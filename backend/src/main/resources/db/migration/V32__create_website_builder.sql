-- ── Website configurations ───────────────────────────────────────────────────
CREATE TABLE website_configs (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id      UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    status               VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    setup_completed      BOOLEAN     NOT NULL DEFAULT FALSE,

    -- Branding
    brand_name           VARCHAR(255),
    brand_logo_url       TEXT,
    primary_color        VARCHAR(7)  NOT NULL DEFAULT '#6366F1',
    accent_color         VARCHAR(7)  NOT NULL DEFAULT '#F59E0B',
    font_family          VARCHAR(100) NOT NULL DEFAULT 'Inter',
    button_style         VARCHAR(50) NOT NULL DEFAULT 'rounded',
    theme_style          VARCHAR(100) NOT NULL DEFAULT 'modern',

    -- SEO
    page_title           VARCHAR(255),
    meta_description     TEXT,
    og_image_url         TEXT,
    schema_type          VARCHAR(50) DEFAULT 'VacationRental',

    -- Conversion features
    sticky_book_button   BOOLEAN NOT NULL DEFAULT TRUE,
    exit_intent_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
    exit_intent_message  TEXT,
    exit_intent_discount INTEGER,
    countdown_enabled    BOOLEAN NOT NULL DEFAULT FALSE,
    countdown_end_date   TIMESTAMPTZ,
    countdown_message    TEXT,

    -- Multi-language
    default_language     VARCHAR(10) NOT NULL DEFAULT 'en',
    enabled_languages    TEXT        NOT NULL DEFAULT 'en',

    -- Analytics
    ga_tracking_id       VARCHAR(100),
    gtm_container_id     VARCHAR(100),
    meta_pixel_id        VARCHAR(100),
    tiktok_pixel_id      VARCHAR(100),

    -- Custom code
    custom_css           TEXT,
    custom_head_js       TEXT,
    custom_footer_js     TEXT,

    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version              BIGINT      NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX idx_website_configs_org ON website_configs(organization_id);

-- ── Website sections (drag-and-drop builder state) ────────────────────────────
CREATE TABLE website_sections (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    website_id   UUID         NOT NULL REFERENCES website_configs(id) ON DELETE CASCADE,
    section_type VARCHAR(100) NOT NULL,
    title        VARCHAR(255),
    is_enabled   BOOLEAN      NOT NULL DEFAULT TRUE,
    position     INTEGER      NOT NULL DEFAULT 0,
    config       TEXT         NOT NULL DEFAULT '{}',
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_website_sections_website   ON website_sections(website_id);
CREATE INDEX idx_website_sections_position  ON website_sections(website_id, position);

-- ── Website pages ─────────────────────────────────────────────────────────────
CREATE TABLE website_pages (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    website_id       UUID        NOT NULL REFERENCES website_configs(id) ON DELETE CASCADE,
    slug             VARCHAR(255) NOT NULL,
    title            VARCHAR(255) NOT NULL,
    page_title       VARCHAR(255),
    meta_description TEXT,
    is_homepage      BOOLEAN     NOT NULL DEFAULT FALSE,
    is_published     BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_website_pages_website ON website_pages(website_id);
CREATE UNIQUE INDEX idx_website_pages_slug ON website_pages(website_id, slug);

-- ── Promo codes ───────────────────────────────────────────────────────────────
CREATE TABLE promo_codes (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID         NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code            VARCHAR(50)  NOT NULL,
    discount_type   VARCHAR(20)  NOT NULL DEFAULT 'PERCENT',
    discount_value  NUMERIC(10,2) NOT NULL,
    min_nights      INTEGER,
    max_uses        INTEGER,
    uses_count      INTEGER      NOT NULL DEFAULT 0,
    expires_at      TIMESTAMPTZ,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_promo_codes_org_code ON promo_codes(organization_id, UPPER(code));
CREATE INDEX idx_promo_codes_org ON promo_codes(organization_id);

-- ── Website analytics events ──────────────────────────────────────────────────
CREATE TABLE website_analytics (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    event_type      VARCHAR(50) NOT NULL, -- PAGE_VIEW, BOOKING_START, BOOKING_COMPLETE, ABANDONED
    page_path       VARCHAR(255),
    referrer        TEXT,
    country_code    VARCHAR(5),
    device_type     VARCHAR(20),
    session_id      VARCHAR(100),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_website_analytics_org  ON website_analytics(organization_id);
CREATE INDEX idx_website_analytics_time ON website_analytics(organization_id, created_at);

-- ── Abandoned bookings for recovery emails ────────────────────────────────────
CREATE TABLE abandoned_bookings (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    property_id     UUID        REFERENCES properties(id) ON DELETE SET NULL,
    guest_email     VARCHAR(255),
    guest_name      VARCHAR(255),
    check_in_date   DATE,
    check_out_date  DATE,
    num_guests      INTEGER,
    recovery_sent   BOOLEAN     NOT NULL DEFAULT FALSE,
    recovery_sent_at TIMESTAMPTZ,
    converted       BOOLEAN     NOT NULL DEFAULT FALSE,
    session_id      VARCHAR(100),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_abandoned_bookings_org ON abandoned_bookings(organization_id);
