-- Fix SMALLINT → INTEGER for columns mapped to Java int in Hibernate
ALTER TABLE booking_holds
    ALTER COLUMN number_of_guests TYPE INTEGER;

ALTER TABLE property_house_rules
    ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

ALTER TABLE property_seasonal_rules
    ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
