CREATE TABLE guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255),
    name VARCHAR(200),
    phone VARCHAR(50),
    preferred_language VARCHAR(10) DEFAULT 'en',
    total_stays INTEGER NOT NULL DEFAULT 0,
    last_stay_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, email)
);

CREATE INDEX idx_guests_org ON guests(organization_id);
CREATE INDEX idx_guests_email ON guests(email);

CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    guest_id UUID REFERENCES guests(id),
    external_id VARCHAR(500),
    ical_uid VARCHAR(500),
    source VARCHAR(50) NOT NULL DEFAULT 'MANUAL',
    status VARCHAR(50) NOT NULL DEFAULT 'CONFIRMED',
    check_in_date TIMESTAMPTZ NOT NULL,
    check_out_date TIMESTAMPTZ NOT NULL,
    timezone VARCHAR(100) NOT NULL DEFAULT 'UTC',
    guest_name VARCHAR(200),
    guest_email VARCHAR(255),
    guest_phone VARCHAR(50),
    number_of_guests INTEGER,
    notes TEXT,
    total_amount DECIMAL(10,2),
    currency VARCHAR(10),
    synced_at TIMESTAMPTZ,
    access_code_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    version BIGINT NOT NULL DEFAULT 0,
    UNIQUE(property_id, ical_uid),
    UNIQUE(property_id, external_id, source)
);

CREATE INDEX idx_reservations_property ON reservations(property_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_reservations_status ON reservations(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_reservations_checkin ON reservations(check_in_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_reservations_checkout ON reservations(check_out_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_reservations_guest_email ON reservations(guest_email) WHERE deleted_at IS NULL;
CREATE INDEX idx_reservations_dates ON reservations(property_id, check_in_date, check_out_date) WHERE deleted_at IS NULL;
