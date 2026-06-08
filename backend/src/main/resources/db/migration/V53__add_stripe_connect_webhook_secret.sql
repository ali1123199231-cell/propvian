INSERT INTO system_config (key, value, description) VALUES
    ('stripe.connect_webhook_secret',         '', 'Stripe Connect webhook signing secret for connected account events (whsec_xxx) — from Stripe Dashboard → Connect → Webhooks'),
    ('stripe.sandbox.connect_webhook_secret', '', 'Stripe Connect test webhook signing secret for connected account events (whsec_xxx) — from Stripe Dashboard → Connect → Webhooks → Test mode')
ON CONFLICT (key) DO NOTHING;
