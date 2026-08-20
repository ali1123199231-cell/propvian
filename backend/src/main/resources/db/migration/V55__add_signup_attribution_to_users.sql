-- Marketing attribution captured at signup.
-- Lets paid-ad spend be reconciled against subscriptions that actually go ACTIVE,
-- which Google Ads cannot see on its own (the paid event happens 30 days later in Stripe).

ALTER TABLE users
    ADD COLUMN gclid         VARCHAR(255),
    ADD COLUMN utm_source    VARCHAR(100),
    ADD COLUMN utm_medium    VARCHAR(100),
    ADD COLUMN utm_campaign  VARCHAR(150),
    ADD COLUMN utm_term      VARCHAR(255),
    ADD COLUMN utm_content   VARCHAR(150),
    ADD COLUMN landing_page  VARCHAR(500),
    ADD COLUMN signup_referrer VARCHAR(500);

COMMENT ON COLUMN users.gclid           IS 'Google Ads click id from the first landing URL of this session';
COMMENT ON COLUMN users.landing_page    IS 'Path of the first page seen before signup';
COMMENT ON COLUMN users.signup_referrer IS 'document.referrer at first landing; android-app://com.propvian.app identifies the Play Store TWA';

-- Reporting indexes: partial, since the overwhelming majority of rows are organic and null.
CREATE INDEX idx_users_gclid        ON users (gclid)        WHERE gclid IS NOT NULL;
CREATE INDEX idx_users_utm_campaign ON users (utm_campaign) WHERE utm_campaign IS NOT NULL;
