INSERT INTO system_config (key, value, description) VALUES
    ('paypal.webhook_id', '', 'PayPal Webhook ID — from PayPal Developer Dashboard → Webhooks → Webhook ID (required for signature verification)')
ON CONFLICT (key) DO NOTHING;
