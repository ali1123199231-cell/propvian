-- Per-organisation Stripe mode.
--
-- Stripe mode was a single platform-wide switch (system_config 'stripe.sandbox'),
-- so putting one organisation into test mode meant putting every paying customer
-- there too. This lets the demo organisation run on test keys while real hosts and
-- subscribers stay on live.
--
-- Default false: every existing organisation keeps live behaviour untouched.
ALTER TABLE organizations
    ADD COLUMN stripe_sandbox BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN organizations.stripe_sandbox IS
    'When true this org uses the stripe.sandbox.* test keys for guest payments. Demo/testing orgs only.';
