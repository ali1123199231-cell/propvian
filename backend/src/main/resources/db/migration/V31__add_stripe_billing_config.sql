INSERT INTO system_config (key, value, description) VALUES
    ('stripe.secret_key',      '', 'Stripe secret key (sk_live_xxx) — from Stripe Dashboard → Developers → API keys'),
    ('stripe.publishable_key', '', 'Stripe publishable key (pk_live_xxx) — from Stripe Dashboard → Developers → API keys'),
    ('stripe.webhook_secret',  '', 'Stripe webhook signing secret (whsec_xxx) — from Stripe Dashboard → Developers → Webhooks'),
    ('stripe.price_id',        '', 'Stripe Price ID (price_xxx) for the $10/month per-property subscription')
ON CONFLICT (key) DO NOTHING;
