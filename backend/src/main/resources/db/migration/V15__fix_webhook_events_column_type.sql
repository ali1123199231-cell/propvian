ALTER TABLE webhooks ALTER COLUMN events DROP DEFAULT;
ALTER TABLE webhooks ALTER COLUMN events TYPE jsonb USING to_jsonb(events);
ALTER TABLE webhooks ALTER COLUMN events SET DEFAULT '[]'::jsonb;
