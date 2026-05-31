-- Business model selection and verification step feature flags
INSERT INTO system_config (key, value, description) VALUES
    ('platform.business_model',               'ttlock', 'Active business model: ttlock or direct_booking'),

    -- Verification step toggles (set value to ''false'' to disable a step)
    ('verification.identity_check.enabled',   'true',   'Enable host identity verification step'),
    ('verification.property_check.enabled',   'true',   'Enable property ownership verification step'),
    ('verification.ota_check.enabled',        'true',   'Enable OTA listing URL verification step'),
    ('verification.calendar_sync.enabled',    'true',   'Enable calendar iCal sync step'),
    ('verification.payment_setup.enabled',    'true',   'Enable Stripe/PayPal connection step'),
    ('verification.domain_setup.enabled',     'true',   'Enable custom domain connection step'),
    ('verification.admin_approval.enabled',   'true',   'Enable final admin approval step'),

    -- Direct booking billing
    ('direct_booking.price_per_property',     '10.00',  'Monthly price per active property (USD)');
