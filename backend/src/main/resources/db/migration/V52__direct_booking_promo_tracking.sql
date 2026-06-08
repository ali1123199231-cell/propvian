ALTER TABLE direct_bookings
    ADD COLUMN IF NOT EXISTS promo_code_used  VARCHAR(100),
    ADD COLUMN IF NOT EXISTS discount_amount  NUMERIC(10, 2);
