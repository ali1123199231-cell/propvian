CREATE TABLE host_verifications (
    id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id             UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- ── Step statuses ───────────────────────────────────────────────────────────
    identity_status             VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED',
    property_status             VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED',
    ota_status                  VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED',
    calendar_status             VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED',
    payment_status              VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED',
    domain_status               VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED',
    admin_status                VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED',

    -- ── Identity verification ───────────────────────────────────────────────────
    identity_document_url       TEXT,
    selfie_url                  TEXT,
    identity_submitted_at       TIMESTAMPTZ,
    identity_reviewed_at        TIMESTAMPTZ,
    identity_rejection_reason   TEXT,

    -- ── Property verification ───────────────────────────────────────────────────
    property_address_line       TEXT,
    ownership_proof_url         TEXT,
    management_auth_url         TEXT,
    property_submitted_at       TIMESTAMPTZ,
    property_reviewed_at        TIMESTAMPTZ,
    property_rejection_reason   TEXT,

    -- ── OTA verification ────────────────────────────────────────────────────────
    airbnb_listing_url          TEXT,
    booking_listing_url         TEXT,
    ota_submitted_at            TIMESTAMPTZ,
    ota_reviewed_at             TIMESTAMPTZ,
    ota_rejection_reason        TEXT,
    ota_auto_verified           BOOLEAN     NOT NULL DEFAULT FALSE,

    -- ── Calendar sync ───────────────────────────────────────────────────────────
    airbnb_ical_url             TEXT,
    booking_ical_url            TEXT,
    other_ical_urls             JSONB       NOT NULL DEFAULT '[]',
    calendar_connected_at       TIMESTAMPTZ,

    -- ── Payment setup ───────────────────────────────────────────────────────────
    stripe_account_id           TEXT,
    paypal_account_id           TEXT,
    stripe_connected_at         TIMESTAMPTZ,
    paypal_connected_at         TIMESTAMPTZ,

    -- ── Domain connection ───────────────────────────────────────────────────────
    custom_domain               VARCHAR(255),
    domain_verified_at          TIMESTAMPTZ,

    -- ── Admin approval ──────────────────────────────────────────────────────────
    admin_reviewed_by           UUID        REFERENCES users(id),
    admin_reviewed_at           TIMESTAMPTZ,
    admin_notes                 TEXT,
    admin_rejection_reason      TEXT,

    -- ── Derived booking gate ────────────────────────────────────────────────────
    bookings_enabled            BOOLEAN     NOT NULL DEFAULT FALSE,
    completed_steps             INTEGER     NOT NULL DEFAULT 0,
    total_required_steps        INTEGER     NOT NULL DEFAULT 7,

    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version                     BIGINT      NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX idx_host_verifications_org ON host_verifications(organization_id);
CREATE INDEX idx_host_verifications_admin_status ON host_verifications(admin_status);
CREATE INDEX idx_host_verifications_bookings ON host_verifications(bookings_enabled);
