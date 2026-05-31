-- Support per-property billing model alongside the legacy per-lock model
ALTER TABLE subscriptions
    ADD COLUMN IF NOT EXISTS billing_model        VARCHAR(50)    NOT NULL DEFAULT 'PER_LOCK',
    ADD COLUMN IF NOT EXISTS active_property_count INTEGER        NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS per_property_price    NUMERIC(10,2)  NOT NULL DEFAULT 10.00;
