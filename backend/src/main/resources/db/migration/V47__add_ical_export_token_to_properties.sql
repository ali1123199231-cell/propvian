ALTER TABLE properties ADD COLUMN IF NOT EXISTS ical_export_token VARCHAR(64);

-- Generate a unique token for existing properties
UPDATE properties SET ical_export_token = REPLACE(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')
WHERE ical_export_token IS NULL;
