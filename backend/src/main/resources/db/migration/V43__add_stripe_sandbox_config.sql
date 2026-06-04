-- Stripe sandbox (test-mode) credentials and toggle.
-- Existing live keys were added in V30/V31.
-- Set stripe.sandbox=true to route all Stripe calls to test mode without touching live keys.
INSERT INTO system_config (key, value, description) VALUES
    ('stripe.sandbox',                  'false', 'Set to true to use Stripe test-mode keys instead of live keys'),
    ('stripe.sandbox.secret_key',       '', 'Stripe test secret key (sk_test_xxx) — from Stripe Dashboard → Developers → API keys → Test mode'),
    ('stripe.sandbox.publishable_key',  '', 'Stripe test publishable key (pk_test_xxx) — from Stripe Dashboard → Developers → API keys → Test mode'),
    ('stripe.sandbox.webhook_secret',   '', 'Stripe test webhook signing secret (whsec_xxx) — from Stripe Dashboard → Developers → Webhooks → Test mode'),
    ('stripe.sandbox.price_id',         '', 'Stripe test Price ID (price_xxx) for the $10/month plan in test mode'),
    ('stripe.sandbox.connect_client_id','', 'Stripe Connect test client ID (ca_xxx) — from Stripe Dashboard → Connect → Settings → Test mode')
ON CONFLICT (key) DO NOTHING;
