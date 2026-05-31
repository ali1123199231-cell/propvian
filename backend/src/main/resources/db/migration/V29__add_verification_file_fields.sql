-- Add direct file path storage and OTA auto-verification fields to host_verifications
ALTER TABLE host_verifications
    ADD COLUMN IF NOT EXISTS utility_bill_url         TEXT,
    ADD COLUMN IF NOT EXISTS ota_auto_verified        BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS ota_review_count         INT,
    ADD COLUMN IF NOT EXISTS ota_verification_note    TEXT,
    ADD COLUMN IF NOT EXISTS domain_cname_target      VARCHAR(255),
    ADD COLUMN IF NOT EXISTS domain_verification_token VARCHAR(255),
    ADD COLUMN IF NOT EXISTS stripe_charges_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS stripe_payouts_enabled   BOOLEAN NOT NULL DEFAULT FALSE;

-- Admin auto-approval flag
INSERT INTO system_config (key, value, description) VALUES
    ('verification.admin_auto_approve', 'false', 'Auto-approve admin step when all other steps pass'),
    ('verification.ota_min_reviews',    '3',     'Minimum OTA reviews required for auto-approval'),
    ('stripe.connect_client_id',        '',      'Stripe Connect client ID for Express OAuth'),
    ('app.upload_dir',                  '/tmp/propvian-uploads', 'Directory for uploaded verification documents')
ON CONFLICT (key) DO NOTHING;
