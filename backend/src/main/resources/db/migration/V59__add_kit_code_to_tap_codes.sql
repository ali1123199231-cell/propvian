-- Kits: codes sold together (e.g. a trio of NFC tags for one rental) share a
-- kit_code, the first code of the kit. Linking any code of a kit links them all,
-- so a host sets up a trio once instead of three times. Each code keeps its own
-- scan counts, which is why a trio isn't simply one code written three times.
ALTER TABLE tap_codes ADD COLUMN kit_code VARCHAR(16);
CREATE INDEX idx_tap_codes_kit ON tap_codes(kit_code) WHERE kit_code IS NOT NULL;
