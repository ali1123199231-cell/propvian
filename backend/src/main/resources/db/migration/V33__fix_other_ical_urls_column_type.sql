-- Fix type mismatch: Hibernate writes String as character varying but column was jsonb.
-- PostgreSQL allows casting jsonb → text implicitly so existing data is preserved.
ALTER TABLE host_verifications
    ALTER COLUMN other_ical_urls TYPE TEXT USING other_ical_urls::text;
