-- ── Blocked date ranges (host-managed unavailability) ────────────────────────
CREATE TABLE property_blocked_dates (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID        NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    start_date  DATE        NOT NULL,
    end_date    DATE        NOT NULL,
    reason      TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_blocked_dates_order CHECK (end_date >= start_date)
);
CREATE INDEX idx_blocked_dates_property ON property_blocked_dates(property_id);
CREATE INDEX idx_blocked_dates_range    ON property_blocked_dates(start_date, end_date);

-- ── Per-date and seasonal pricing rules ───────────────────────────────────────
CREATE TABLE property_pricing_rules (
    id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id      UUID           NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    name             VARCHAR(255),
    rule_type        VARCHAR(50)    NOT NULL DEFAULT 'DATE_RANGE', -- DATE_RANGE, WEEKDAY, SEASONAL
    start_date       DATE,
    end_date         DATE,
    nightly_rate     NUMERIC(10,2)  NOT NULL,
    min_stay_nights  INTEGER        DEFAULT 1,
    created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_pricing_rules_property ON property_pricing_rules(property_id);

-- Add pricing & booking config columns to properties
ALTER TABLE properties
    ADD COLUMN IF NOT EXISTS base_nightly_rate  NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS cleaning_fee       NUMERIC(10,2)  DEFAULT 0,
    ADD COLUMN IF NOT EXISTS security_deposit   NUMERIC(10,2)  DEFAULT 0,
    ADD COLUMN IF NOT EXISTS min_stay_nights    INTEGER        DEFAULT 1,
    ADD COLUMN IF NOT EXISTS max_stay_nights    INTEGER        DEFAULT 365,
    ADD COLUMN IF NOT EXISTS check_in_time      VARCHAR(10)    DEFAULT '15:00',
    ADD COLUMN IF NOT EXISTS check_out_time     VARCHAR(10)    DEFAULT '11:00',
    ADD COLUMN IF NOT EXISTS property_type      VARCHAR(100),
    ADD COLUMN IF NOT EXISTS instant_booking    BOOLEAN        NOT NULL DEFAULT TRUE;
