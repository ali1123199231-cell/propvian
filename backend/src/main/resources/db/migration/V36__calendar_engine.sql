-- ── btree_gist required for GIST exclusion constraints on UUID + daterange ───
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ── Unified calendar intervals ────────────────────────────────────────────────
-- Each row is a contiguous date range that is NOT available.
-- Gaps between rows = available. No AVAILABLE rows are stored.
-- The GIST exclusion constraint is the final database-level guard against
-- double-booking: two overlapping intervals for the same property cannot
-- coexist (unless at least one is BUFFER which is allowed to overlap with
-- nothing since buffers are auto-managed).
CREATE TABLE IF NOT EXISTS calendar_intervals (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID        NOT NULL REFERENCES properties(id) ON DELETE CASCADE,

    start_date      DATE        NOT NULL,
    end_date        DATE        NOT NULL,   -- exclusive (checkout day convention)

    -- BOOKED    = confirmed booking occupying these dates
    -- BLOCKED   = owner/admin manual block
    -- RESERVED  = temporary hold during guest checkout (has expires_at)
    -- MAINTENANCE = property unavailable for maintenance
    -- BUFFER    = automatic gap inserted before/after a booking
    state           VARCHAR(20) NOT NULL
                    CHECK (state IN ('BOOKED','BLOCKED','RESERVED','MAINTENANCE','BUFFER')),

    -- Context references
    booking_id      UUID,                  -- FK to direct_bookings or reservations
    hold_id         UUID,                  -- FK to booking_holds (RESERVED state only)
    blocked_by      UUID,                  -- user id who created the block
    note            TEXT,

    -- Only set for RESERVED state; scheduler cleans up past this timestamp
    expires_at      TIMESTAMPTZ,

    -- Audit
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (start_date < end_date)
);

-- Primary range-query index: "give me all intervals for property X in date range Y"
CREATE INDEX IF NOT EXISTS idx_cal_property_dates
    ON calendar_intervals USING GIST (
        property_id,
        daterange(start_date, end_date, '[)')
    );

-- Partial index for expiration cleanup job (only RESERVED intervals have expires_at)
CREATE INDEX IF NOT EXISTS idx_cal_expired_holds
    ON calendar_intervals (expires_at)
    WHERE state = 'RESERVED' AND expires_at IS NOT NULL;

-- Index to find all intervals belonging to a booking (for cancellation cleanup)
CREATE INDEX IF NOT EXISTS idx_cal_booking_id
    ON calendar_intervals (booking_id)
    WHERE booking_id IS NOT NULL;

-- GIST exclusion constraint: the hard DB guarantee against double booking.
-- Two intervals for the same property cannot have overlapping date ranges
-- UNLESS one of them is a BUFFER (buffers are auto-managed and can be
-- re-evaluated when adjacent bookings change).
ALTER TABLE calendar_intervals
    ADD CONSTRAINT no_overlap_per_property
    EXCLUDE USING GIST (
        property_id WITH =,
        daterange(start_date, end_date, '[)') WITH &&
    )
    WHERE (state != 'BUFFER');

-- ── Booking holds ─────────────────────────────────────────────────────────────
-- Tracks the intent to book while the guest is in checkout flow.
-- A corresponding RESERVED interval in calendar_intervals blocks the dates.
-- On payment success → hold CONVERTED + interval → BOOKED.
-- On expiry or payment failure → hold EXPIRED/RELEASED + interval deleted.
CREATE TABLE IF NOT EXISTS booking_holds (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id      UUID        NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    interval_id      UUID        REFERENCES calendar_intervals(id) ON DELETE SET NULL,

    -- Guest context (may be anonymous during checkout)
    guest_name       VARCHAR(255),
    guest_email      VARCHAR(255),
    guest_session_id VARCHAR(128),

    checkin_date     DATE        NOT NULL,
    checkout_date    DATE        NOT NULL,
    number_of_guests SMALLINT    NOT NULL DEFAULT 1,

    expires_at       TIMESTAMPTZ NOT NULL,

    status           VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                     CHECK (status IN ('ACTIVE','CONVERTED','EXPIRED','RELEASED')),

    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (checkin_date < checkout_date)
);

CREATE INDEX IF NOT EXISTS idx_holds_property  ON booking_holds(property_id);
CREATE INDEX IF NOT EXISTS idx_holds_status    ON booking_holds(status) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_holds_expires   ON booking_holds(expires_at) WHERE status = 'ACTIVE';

-- ── Calendar event log ────────────────────────────────────────────────────────
-- Immutable audit trail of every state transition in the calendar engine.
CREATE TABLE IF NOT EXISTS calendar_event_log (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID        NOT NULL,
    event_type  VARCHAR(60) NOT NULL,   -- HOLD_CREATED | BOOKING_CONFIRMED | HOLD_EXPIRED | etc.
    interval_id UUID,
    booking_id  UUID,
    hold_id     UUID,
    from_state  VARCHAR(20),
    to_state    VARCHAR(20),
    actor_id    UUID,                   -- user or null for system actions
    payload     JSONB,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cal_log_property ON calendar_event_log(property_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_cal_log_booking  ON calendar_event_log(booking_id) WHERE booking_id IS NOT NULL;
