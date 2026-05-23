CREATE TABLE access_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    lock_id UUID NOT NULL REFERENCES locks(id),
    pin VARCHAR(20) NOT NULL,
    ttlock_keyboard_pwd_id BIGINT,
    ttlock_keyboard_pwd_name VARCHAR(200),
    type VARCHAR(50) NOT NULL DEFAULT 'TIME_SENSITIVE',
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    valid_from TIMESTAMPTZ NOT NULL,
    valid_to TIMESTAMPTZ NOT NULL,
    created_via VARCHAR(50) DEFAULT 'AUTOMATIC',
    sent_to_guest_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    failure_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_access_codes_reservation ON access_codes(reservation_id);
CREATE INDEX idx_access_codes_lock ON access_codes(lock_id);
CREATE INDEX idx_access_codes_status ON access_codes(status);
CREATE INDEX idx_access_codes_valid_to ON access_codes(valid_to) WHERE status = 'ACTIVE';
