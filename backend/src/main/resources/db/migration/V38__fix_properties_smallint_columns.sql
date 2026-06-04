-- Fix remaining SMALLINT columns that Hibernate expects as INTEGER
ALTER TABLE properties
    ALTER COLUMN buffer_days_before TYPE INTEGER,
    ALTER COLUMN buffer_days_after  TYPE INTEGER;
