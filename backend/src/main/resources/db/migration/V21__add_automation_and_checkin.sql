-- Automation toggle per organization
ALTER TABLE organizations ADD COLUMN automation_enabled BOOLEAN NOT NULL DEFAULT FALSE;

-- Guest check-in page code per reservation (short public identifier)
ALTER TABLE reservations ADD COLUMN checkin_code VARCHAR(20);
ALTER TABLE reservations ADD COLUMN host_notified_at TIMESTAMPTZ;
CREATE UNIQUE INDEX idx_reservations_checkin_code ON reservations(checkin_code) WHERE checkin_code IS NOT NULL;

-- Property-level guest info fields for the check-in page
ALTER TABLE properties ADD COLUMN wifi_details TEXT;
ALTER TABLE properties ADD COLUMN access_instructions TEXT;
