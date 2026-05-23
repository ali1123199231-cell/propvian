CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    address VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    timezone VARCHAR(100) NOT NULL DEFAULT 'UTC',
    description TEXT,
    image_url VARCHAR(500),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    cleaner_user_id UUID REFERENCES users(id),
    max_guests INTEGER,
    bedrooms INTEGER,
    bathrooms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    version BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_properties_org ON properties(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_properties_status ON properties(status) WHERE deleted_at IS NULL;

CREATE TABLE locks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    name VARCHAR(200),
    ttlock_lock_id BIGINT,
    ttlock_lock_alias VARCHAR(200),
    ttlock_feature_value VARCHAR(500),
    ttlock_user_id VARCHAR(200),
    ttlock_access_token TEXT,
    ttlock_refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    battery_level INTEGER,
    status VARCHAR(50) NOT NULL DEFAULT 'DISCONNECTED',
    last_sync_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    version BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_locks_property ON locks(property_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_locks_ttlock_id ON locks(ttlock_lock_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_locks_token_expires ON locks(token_expires_at) WHERE deleted_at IS NULL AND status = 'CONNECTED';
