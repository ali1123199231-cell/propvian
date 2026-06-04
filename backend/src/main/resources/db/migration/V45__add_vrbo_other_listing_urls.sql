ALTER TABLE host_verifications
    ADD COLUMN IF NOT EXISTS vrbo_listing_url   text,
    ADD COLUMN IF NOT EXISTS other_listing_urls text;
