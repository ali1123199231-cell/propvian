-- ── Property lifecycle states: add DRAFT and PAUSED ─────────────────────────
-- The CHECK constraint on 'status' did not exist before (VARCHAR column),
-- so we can just start using the new values at the application layer.
-- INACTIVE remains valid for legacy rows.
ALTER TABLE properties
    ADD COLUMN IF NOT EXISTS cancellation_policy  VARCHAR(30)    DEFAULT 'MODERATE',
    ADD COLUMN IF NOT EXISTS buffer_days_before   SMALLINT       NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS buffer_days_after    SMALLINT       NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS deposit_required     BOOLEAN        NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS deposit_percent      NUMERIC(5,2)   CHECK (deposit_percent BETWEEN 0 AND 100),
    ADD COLUMN IF NOT EXISTS latitude             DECIMAL(10,7),
    ADD COLUMN IF NOT EXISTS longitude            DECIMAL(10,7);

-- ── House rules ───────────────────────────────────────────────────────────────
-- Flexible key-value model: each rule is a row (PETS, SMOKING, PARTIES, etc.)
CREATE TABLE IF NOT EXISTS property_house_rules (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID        NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    rule_key    VARCHAR(50) NOT NULL,     -- e.g. PETS, SMOKING, PARTIES, QUIET_HOURS
    allowed     BOOLEAN     NOT NULL,
    notes       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (property_id, rule_key)
);
CREATE INDEX IF NOT EXISTS idx_house_rules_property ON property_house_rules(property_id);

-- ── Seasonal rule overrides ───────────────────────────────────────────────────
-- Overrides base min/max stay and buffer for a specific date window.
-- NULL value means "use property base rule for this field".
CREATE TABLE IF NOT EXISTS property_seasonal_rules (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id         UUID        NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    name                VARCHAR(100),
    start_date          DATE        NOT NULL,
    end_date            DATE        NOT NULL,
    min_stay_days       SMALLINT,
    max_stay_days       SMALLINT,
    buffer_days_before  SMALLINT,
    buffer_days_after   SMALLINT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (start_date <= end_date)
);
CREATE INDEX IF NOT EXISTS idx_seasonal_rules_property ON property_seasonal_rules(property_id);
CREATE INDEX IF NOT EXISTS idx_seasonal_rules_dates    ON property_seasonal_rules(start_date, end_date);
