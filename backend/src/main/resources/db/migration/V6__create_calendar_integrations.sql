CREATE TABLE calendar_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    ical_url VARCHAR(2000) NOT NULL,
    display_name VARCHAR(200),
    last_sync_at TIMESTAMPTZ,
    last_sync_status VARCHAR(50),
    last_sync_error TEXT,
    sync_interval_minutes INTEGER NOT NULL DEFAULT 15,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    etag VARCHAR(500),
    reservations_synced INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_calendar_integrations_property ON calendar_integrations(property_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_calendar_integrations_enabled ON calendar_integrations(enabled, last_sync_at) WHERE deleted_at IS NULL;
