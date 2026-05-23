INSERT INTO subscription_plans (id, name, tier, monthly_price, yearly_price, max_properties, max_locks, max_members, max_reservations_per_month, features) VALUES
(gen_random_uuid(), 'Free', 'FREE', 0.00, 0.00, 1, 1, 2, 50,
    '{"calendarSync": true, "emailNotifications": true, "auditLogs": false, "webhooks": false, "analytics": false, "customBranding": false, "prioritySupport": false}'::jsonb),
(gen_random_uuid(), 'Starter', 'STARTER', 29.00, 290.00, 5, 10, 5, 200,
    '{"calendarSync": true, "emailNotifications": true, "auditLogs": true, "webhooks": false, "analytics": true, "customBranding": false, "prioritySupport": false}'::jsonb),
(gen_random_uuid(), 'Professional', 'PROFESSIONAL', 79.00, 790.00, 20, 50, 15, 1000,
    '{"calendarSync": true, "emailNotifications": true, "auditLogs": true, "webhooks": true, "analytics": true, "customBranding": true, "prioritySupport": false}'::jsonb),
(gen_random_uuid(), 'Enterprise', 'ENTERPRISE', 299.00, 2990.00, -1, -1, -1, -1,
    '{"calendarSync": true, "emailNotifications": true, "auditLogs": true, "webhooks": true, "analytics": true, "customBranding": true, "prioritySupport": true}'::jsonb);
