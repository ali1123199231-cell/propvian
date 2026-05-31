-- ── Property photos ──────────────────────────────────────────────────────────
CREATE TABLE property_photos (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID        NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    url         TEXT        NOT NULL,
    caption     TEXT,
    sort_order  INTEGER     NOT NULL DEFAULT 0,
    is_primary  BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_property_photos_property ON property_photos(property_id);

-- ── Property amenities ───────────────────────────────────────────────────────
CREATE TABLE property_amenities (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID         NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    category    VARCHAR(100) NOT NULL,
    name        VARCHAR(255) NOT NULL,
    icon        VARCHAR(100)
);
CREATE INDEX idx_property_amenities_property ON property_amenities(property_id);

-- ── Custom domains ───────────────────────────────────────────────────────────
CREATE TABLE property_domains (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID         NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    domain              VARCHAR(255) NOT NULL,
    ssl_status          VARCHAR(50)  NOT NULL DEFAULT 'PENDING',
    dns_validated       BOOLEAN      NOT NULL DEFAULT FALSE,
    dns_validated_at    TIMESTAMPTZ,
    verification_token  TEXT,
    is_primary          BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    version             BIGINT       NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX idx_property_domains_domain ON property_domains(domain);
CREATE INDEX idx_property_domains_org ON property_domains(organization_id);

-- ── Direct bookings ──────────────────────────────────────────────────────────
CREATE TABLE direct_bookings (
    id                  UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id         UUID           NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
    organization_id     UUID           NOT NULL REFERENCES organizations(id),

    -- Guest
    guest_name          VARCHAR(255)   NOT NULL,
    guest_email         VARCHAR(255)   NOT NULL,
    guest_phone         VARCHAR(100),
    number_of_guests    INTEGER        NOT NULL DEFAULT 1,

    -- Stay
    check_in_date       DATE           NOT NULL,
    check_out_date      DATE           NOT NULL,

    -- Pricing
    total_amount        NUMERIC(10,2),
    currency            VARCHAR(3)     NOT NULL DEFAULT 'USD',

    -- Payment
    payment_provider    VARCHAR(50),
    payment_intent_id   TEXT,
    payment_status      VARCHAR(50)    NOT NULL DEFAULT 'PENDING',

    -- Status
    status              VARCHAR(50)    NOT NULL DEFAULT 'PENDING_PAYMENT',
    cancelled_at        TIMESTAMPTZ,
    cancellation_reason TEXT,
    notes               TEXT,

    created_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    version             BIGINT         NOT NULL DEFAULT 0
);
CREATE INDEX idx_direct_bookings_property    ON direct_bookings(property_id);
CREATE INDEX idx_direct_bookings_org         ON direct_bookings(organization_id);
CREATE INDEX idx_direct_bookings_status      ON direct_bookings(status);
CREATE INDEX idx_direct_bookings_dates       ON direct_bookings(check_in_date, check_out_date);
CREATE INDEX idx_direct_bookings_guest_email ON direct_bookings(guest_email);

-- ── Guest reviews ────────────────────────────────────────────────────────────
CREATE TABLE guest_reviews (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id          UUID        NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    booking_id           UUID        REFERENCES direct_bookings(id),
    guest_name           VARCHAR(255),
    rating               INTEGER     NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment              TEXT,
    cleanliness_rating   INTEGER     CHECK (cleanliness_rating BETWEEN 1 AND 5),
    communication_rating INTEGER     CHECK (communication_rating BETWEEN 1 AND 5),
    location_rating      INTEGER     CHECK (location_rating BETWEEN 1 AND 5),
    accuracy_rating      INTEGER     CHECK (accuracy_rating BETWEEN 1 AND 5),
    host_reply           TEXT,
    host_replied_at      TIMESTAMPTZ,
    is_public            BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_guest_reviews_property ON guest_reviews(property_id);

-- Add direct-booking fields to properties
ALTER TABLE properties
    ADD COLUMN IF NOT EXISTS property_type      VARCHAR(100),
    ADD COLUMN IF NOT EXISTS slug               VARCHAR(255),
    ADD COLUMN IF NOT EXISTS base_nightly_rate  NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS min_stay_nights    INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS check_in_time      VARCHAR(10) DEFAULT '15:00',
    ADD COLUMN IF NOT EXISTS check_out_time     VARCHAR(10) DEFAULT '11:00';

CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_org_slug ON properties(organization_id, slug) WHERE slug IS NOT NULL AND deleted_at IS NULL;
