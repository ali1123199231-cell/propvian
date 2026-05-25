CREATE TABLE system_config (
    key         VARCHAR(255) PRIMARY KEY,
    value       TEXT         NOT NULL,
    description TEXT,
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

INSERT INTO system_config (key, value, description) VALUES
    ('ttlock.auth_method',  'oauth',                                                          'TTLock auth method: oauth or password'),
    ('ttlock.redirect_uri', 'https://propvian.com/api/v1/ttlock/oauth/callback',              'TTLock OAuth redirect URI sent in the authorize request');
