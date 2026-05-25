ALTER TABLE subscriptions
    ADD COLUMN lock_quota INTEGER,
    ADD COLUMN paypal_subscription_id VARCHAR(200),
    ADD COLUMN payment_provider VARCHAR(50),
    ADD COLUMN stripe_price_id VARCHAR(200),
    ADD COLUMN failed_payment_at TIMESTAMPTZ;

CREATE INDEX idx_subscriptions_stripe_sub ON subscriptions(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
CREATE INDEX idx_subscriptions_paypal_sub ON subscriptions(paypal_subscription_id) WHERE paypal_subscription_id IS NOT NULL;
