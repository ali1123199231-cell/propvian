package com.smartlock.domain;

import com.smartlock.domain.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "website_configs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WebsiteConfig extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "DRAFT";

    @Column(name = "setup_completed", nullable = false)
    @Builder.Default
    private boolean setupCompleted = false;

    // ── Branding ──────────────────────────────────────────────────────────────
    @Column(name = "brand_name", length = 255)
    private String brandName;

    @Column(name = "brand_logo_url", columnDefinition = "text")
    private String brandLogoUrl;

    @Column(name = "primary_color", length = 7, nullable = false)
    @Builder.Default
    private String primaryColor = "#6366F1";

    @Column(name = "accent_color", length = 7, nullable = false)
    @Builder.Default
    private String accentColor = "#F59E0B";

    @Column(name = "font_family", length = 100, nullable = false)
    @Builder.Default
    private String fontFamily = "Inter";

    @Column(name = "button_style", length = 50, nullable = false)
    @Builder.Default
    private String buttonStyle = "rounded";

    @Column(name = "theme_style", length = 100, nullable = false)
    @Builder.Default
    private String themeStyle = "modern";

    // ── SEO ───────────────────────────────────────────────────────────────────
    @Column(name = "page_title", length = 255)
    private String pageTitle;

    @Column(name = "meta_description", columnDefinition = "text")
    private String metaDescription;

    @Column(name = "og_image_url", columnDefinition = "text")
    private String ogImageUrl;

    // ── Conversion ────────────────────────────────────────────────────────────
    @Column(name = "sticky_book_button", nullable = false)
    @Builder.Default
    private boolean stickyBookButton = true;

    @Column(name = "exit_intent_enabled", nullable = false)
    @Builder.Default
    private boolean exitIntentEnabled = false;

    @Column(name = "exit_intent_message", columnDefinition = "text")
    private String exitIntentMessage;

    @Column(name = "exit_intent_discount")
    private Integer exitIntentDiscount;

    @Column(name = "countdown_enabled", nullable = false)
    @Builder.Default
    private boolean countdownEnabled = false;

    @Column(name = "countdown_end_date")
    private Instant countdownEndDate;

    @Column(name = "countdown_message", columnDefinition = "text")
    private String countdownMessage;

    // ── Analytics ─────────────────────────────────────────────────────────────
    @Column(name = "ga_tracking_id", length = 100)
    private String gaTrackingId;

    @Column(name = "gtm_container_id", length = 100)
    private String gtmContainerId;

    @Column(name = "meta_pixel_id", length = 100)
    private String metaPixelId;

    @Column(name = "tiktok_pixel_id", length = 100)
    private String tiktokPixelId;

    // ── Multi-language ────────────────────────────────────────────────────────
    @Column(name = "default_language", length = 10, nullable = false)
    @Builder.Default
    private String defaultLanguage = "en";

    @Column(name = "enabled_languages", columnDefinition = "text", nullable = false)
    @Builder.Default
    private String enabledLanguages = "en";

    // ── Custom code ───────────────────────────────────────────────────────────
    @Column(name = "custom_css", columnDefinition = "text")
    private String customCss;

    @Column(name = "custom_head_js", columnDefinition = "text")
    private String customHeadJs;

    @Column(name = "custom_footer_js", columnDefinition = "text")
    private String customFooterJs;
}
