-- Legal acceptance tracking
-- Stores when users (hosts) accept legal documents, with version, IP, and user-agent
-- Used for GDPR consent records, subscription compliance, and audit trails

CREATE TABLE legal_acceptances (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_type   VARCHAR(64) NOT NULL,   -- 'terms', 'privacy', 'cookie', 'refund', 'acceptable_use', 'dpa', 'subscription'
    document_version VARCHAR(16) NOT NULL,  -- e.g. '2.0', '2026-06'
    accepted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address      VARCHAR(45),            -- IPv4 or IPv6
    user_agent      TEXT,
    context         VARCHAR(64)             -- 'registration', 'subscription', 'onboarding', 'explicit'
);

CREATE INDEX idx_legal_acceptances_user_id ON legal_acceptances(user_id);
CREATE INDEX idx_legal_acceptances_type    ON legal_acceptances(document_type);
CREATE INDEX idx_legal_acceptances_at      ON legal_acceptances(accepted_at);

COMMENT ON TABLE legal_acceptances IS 'Records every time a user explicitly accepts a legal document version. Required for GDPR consent audit trails.';
COMMENT ON COLUMN legal_acceptances.document_type IS 'Identifies which legal document was accepted';
COMMENT ON COLUMN legal_acceptances.document_version IS 'Version of the document at time of acceptance';
COMMENT ON COLUMN legal_acceptances.context IS 'Where in the product the acceptance was recorded';

-- Cookie consent is tracked separately since it applies to anonymous visitors too
CREATE TABLE cookie_consents (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT REFERENCES users(id) ON DELETE SET NULL,  -- NULL for anonymous visitors
    session_id      VARCHAR(128),                                     -- anonymous session identifier
    essential       BOOLEAN NOT NULL DEFAULT TRUE,
    analytics       BOOLEAN NOT NULL DEFAULT FALSE,
    marketing       BOOLEAN NOT NULL DEFAULT FALSE,
    consent_version VARCHAR(16) NOT NULL DEFAULT '1.0',
    consented_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    withdrawn_at    TIMESTAMPTZ,
    ip_address      VARCHAR(45),
    user_agent      TEXT
);

CREATE INDEX idx_cookie_consents_user_id    ON cookie_consents(user_id);
CREATE INDEX idx_cookie_consents_session_id ON cookie_consents(session_id);

COMMENT ON TABLE cookie_consents IS 'Cookie consent records for GDPR/ePrivacy compliance. Tracks per-category consent with withdrawal support.';

-- Data subject requests (GDPR rights requests)
CREATE TABLE data_subject_requests (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT REFERENCES users(id) ON DELETE SET NULL,
    requester_email VARCHAR(255) NOT NULL,
    request_type    VARCHAR(32) NOT NULL,  -- 'access', 'erasure', 'portability', 'rectification', 'restriction', 'objection'
    status          VARCHAR(32) NOT NULL DEFAULT 'pending',  -- 'pending', 'in_progress', 'completed', 'rejected'
    submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    notes           TEXT,
    ip_address      VARCHAR(45)
);

CREATE INDEX idx_dsr_user_id    ON data_subject_requests(user_id);
CREATE INDEX idx_dsr_status     ON data_subject_requests(status);
CREATE INDEX idx_dsr_submitted  ON data_subject_requests(submitted_at);

COMMENT ON TABLE data_subject_requests IS 'Tracks GDPR data subject rights requests (access, erasure, portability, etc.) and their resolution status.';
