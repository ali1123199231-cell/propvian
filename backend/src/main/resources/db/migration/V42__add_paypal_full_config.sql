-- Complete PayPal config: prod plan/base-url keys and full sandbox credential set.
-- Existing keys (client_id, client_secret, sandbox, webhook_id) were added in V30/V34.
INSERT INTO system_config (key, value, description) VALUES
    ('paypal.plan_id',                '', 'PayPal live billing plan ID ($10/month) — from PayPal Dashboard → Subscriptions → Plans'),
    ('paypal.base_url',               'https://api-m.paypal.com',      'PayPal live REST API base URL'),
    ('paypal.auth_base_url',          'https://www.paypal.com',         'PayPal live OAuth/Connect base URL'),

    ('paypal.sandbox.client_id',      '', 'PayPal sandbox app client ID — from developer.paypal.com → Sandbox → My Apps'),
    ('paypal.sandbox.client_secret',  '', 'PayPal sandbox app client secret — from developer.paypal.com → Sandbox → My Apps'),
    ('paypal.sandbox.plan_id',        '', 'PayPal sandbox billing plan ID — created in sandbox dashboard'),
    ('paypal.sandbox.webhook_id',     '', 'PayPal sandbox webhook ID — from developer.paypal.com → Sandbox → Webhooks'),
    ('paypal.sandbox.base_url',       'https://api-m.sandbox.paypal.com', 'PayPal sandbox REST API base URL'),
    ('paypal.sandbox.auth_base_url',  'https://www.sandbox.paypal.com',   'PayPal sandbox OAuth/Connect base URL')
ON CONFLICT (key) DO NOTHING;
