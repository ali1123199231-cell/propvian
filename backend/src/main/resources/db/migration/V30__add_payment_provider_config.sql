-- Payment provider credentials stored in system_config so they can be
-- updated via a DB change without redeploying the application.
INSERT INTO system_config (key, value, description) VALUES
    ('stripe.connect_client_id', '', 'Stripe Connect Express client ID (ca_xxx) — from Stripe Dashboard → Connect → Settings'),
    ('paypal.client_id',         '', 'PayPal app client ID — from developer.paypal.com → My Apps'),
    ('paypal.client_secret',     '', 'PayPal app client secret — from developer.paypal.com → My Apps'),
    ('paypal.sandbox',           'false', 'Set to true to use PayPal sandbox (developer.paypal.com) instead of live')
ON CONFLICT (key) DO NOTHING;
