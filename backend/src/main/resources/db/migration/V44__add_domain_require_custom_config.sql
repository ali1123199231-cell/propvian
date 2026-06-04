INSERT INTO system_config (key, value, description) VALUES
('verification.domain_require_custom', 'true', 'When true, hosts must connect a custom domain. Propvian subdomains (*.propvian.com) are rejected.')
ON CONFLICT (key) DO NOTHING;
