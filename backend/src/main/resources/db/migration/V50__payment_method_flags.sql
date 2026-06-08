-- Allow hosts to activate/deactivate their connected payment methods for guests
ALTER TABLE host_verifications
    ADD COLUMN IF NOT EXISTS stripe_guest_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS paypal_guest_enabled BOOLEAN NOT NULL DEFAULT TRUE;
