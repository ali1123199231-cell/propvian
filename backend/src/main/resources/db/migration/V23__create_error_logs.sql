CREATE TABLE error_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    user_email  VARCHAR(255),
    error_code  VARCHAR(100),
    http_status INTEGER NOT NULL,
    message     TEXT,
    request_path VARCHAR(500),
    stack_trace TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_error_logs_user_id    ON error_logs(user_id);
CREATE INDEX idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX idx_error_logs_http_status ON error_logs(http_status);
