-- Guest pages: one public welcome page per property (WiFi, house guide, host
-- contact, optional book-direct offer), opened by tapping an NFC tag or
-- scanning a QR code placed inside the rental.
--
-- Unlike the per-reservation check-in page, this page is reachable by anyone
-- holding the link, including past guests, so it must never carry door or
-- lockbox codes. The editor says so; nothing here is prefilled from
-- properties.access_instructions for the same reason.
CREATE TABLE guest_pages (
    id                       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id          UUID         NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    property_id              UUID         NOT NULL UNIQUE REFERENCES properties(id) ON DELETE CASCADE,
    enabled                  BOOLEAN      NOT NULL DEFAULT TRUE,
    welcome_message          TEXT,
    wifi_ssid                VARCHAR(64),
    wifi_password            VARCHAR(128),
    wifi_security            VARCHAR(10)  NOT NULL DEFAULT 'WPA',   -- WPA | WEP | nopass
    wifi_hidden              BOOLEAN      NOT NULL DEFAULT FALSE,
    sections                 TEXT         NOT NULL DEFAULT '[]',    -- JSON [{id,type,title,body}]
    contact_name             VARCHAR(100),
    contact_phone            VARCHAR(40),
    contact_whatsapp         BOOLEAN      NOT NULL DEFAULT FALSE,
    contact_email            VARCHAR(255),
    book_direct_enabled      BOOLEAN      NOT NULL DEFAULT FALSE,
    book_direct_message      VARCHAR(300),
    book_direct_promo_code   VARCHAR(50),
    book_direct_url          VARCHAR(500),
    -- Airbnb's Off-Platform Policy bans encouraging repeat bookings off Airbnb
    -- and offering discounts to do so, so by default the offer is withheld
    -- while an Airbnb reservation is in progress at the property.
    book_direct_hide_airbnb  BOOLEAN      NOT NULL DEFAULT TRUE,
    show_powered_by          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_guest_pages_org ON guest_pages(organization_id);

-- Short public codes that open a guest page at /g/{code}.
-- PROPERTY codes are issued together with the page. PRODUCT codes are
-- pre-printed onto physical stands and cards in batches; they stay unclaimed
-- (no organization, no property) until the buyer links one to a property.
CREATE TABLE tap_codes (
    code             VARCHAR(16)  PRIMARY KEY,
    kind             VARCHAR(20)  NOT NULL,
    organization_id  UUID         REFERENCES organizations(id) ON DELETE SET NULL,
    property_id      UUID         REFERENCES properties(id) ON DELETE SET NULL,
    batch_label      VARCHAR(100),
    claimed_at       TIMESTAMPTZ,
    claimed_by       UUID         REFERENCES users(id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_tap_codes_property ON tap_codes(property_id);
CREATE INDEX idx_tap_codes_batch    ON tap_codes(batch_label) WHERE batch_label IS NOT NULL;

-- Append-only log of scans and clicks. Feeds the host's guest-page stats and
-- the physical-product funnel: codes issued → scanned → claimed.
CREATE TABLE guest_page_events (
    id           BIGSERIAL    PRIMARY KEY,
    code         VARCHAR(16)  NOT NULL,
    property_id  UUID,                     -- NULL for scans of an unclaimed code
    event_type   VARCHAR(30)  NOT NULL,    -- VIEW | WIFI_COPY | BOOK_DIRECT_CLICK | CONTACT_CLICK | POWERED_BY_CLICK
    source       VARCHAR(10),              -- NFC | QR | LINK
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_guest_page_events_property_time ON guest_page_events(property_id, created_at);
CREATE INDEX idx_guest_page_events_code          ON guest_page_events(code);
