-- Fix SMALLINT columns in property_seasonal_rules that Hibernate maps to Integer
ALTER TABLE property_seasonal_rules
    ALTER COLUMN min_stay_days      TYPE INTEGER,
    ALTER COLUMN max_stay_days      TYPE INTEGER,
    ALTER COLUMN buffer_days_before TYPE INTEGER,
    ALTER COLUMN buffer_days_after  TYPE INTEGER;
