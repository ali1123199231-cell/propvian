-- Preferred language for the host's dashboard and, more importantly, for the
-- transactional emails we send them. Without this, a Spanish host who signs up
-- through a Spanish ad still receives English email.
--
-- Guest-facing language is NOT stored here — booking sites already carry
-- website_configs.default_language / enabled_languages (added in V32).

ALTER TABLE users
    ADD COLUMN locale VARCHAR(10) NOT NULL DEFAULT 'en';

COMMENT ON COLUMN users.locale IS 'ISO 639-1 language code for dashboard UI and outbound email; falls back to en';
