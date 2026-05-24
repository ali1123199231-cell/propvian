-- Onboarding progress fields and single name field
ALTER TABLE users ADD COLUMN name VARCHAR(200);
ALTER TABLE users ADD COLUMN onboarding_step VARCHAR(50) NOT NULL DEFAULT 'COMPLETED';
ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN pending_ttlock_state_id UUID REFERENCES ttlock_oauth_states(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN pending_ttlock_lock_id BIGINT;
ALTER TABLE users ADD COLUMN pending_ttlock_lock_name VARCHAR(200);

-- Email verification codes (separate from the one-time token field; uses numeric codes)
CREATE TABLE email_verification_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_ver_codes_user ON email_verification_codes(user_id);
CREATE INDEX idx_email_ver_codes_code ON email_verification_codes(code);
