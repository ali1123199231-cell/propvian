-- Admin log table for duplicate lock registration attempts
CREATE TABLE duplicate_lock_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempted_user_id UUID NOT NULL REFERENCES users(id),
    existing_owner_user_id UUID NOT NULL REFERENCES users(id),
    ttlock_lock_id BIGINT NOT NULL,
    provider VARCHAR(100) NOT NULL DEFAULT 'TTLOCK',
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dup_lock_att_user ON duplicate_lock_attempts(attempted_user_id);
CREATE INDEX idx_dup_lock_att_lock_id ON duplicate_lock_attempts(ttlock_lock_id);
