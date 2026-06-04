package com.smartlock.dto.response.website;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class WebsiteConfigResponse {
    private UUID id;
    private UUID organizationId;
    private String status;
    private boolean setupCompleted;

    // Branding
    private String brandName;
    private String brandLogoUrl;
    private String primaryColor;
    private String accentColor;
    private String fontFamily;
    private String buttonStyle;
    private String themeStyle;

    // SEO
    private String pageTitle;
    private String metaDescription;
    private String ogImageUrl;

    // Conversion
    private boolean stickyBookButton;
    private boolean exitIntentEnabled;
    private String exitIntentMessage;
    private Integer exitIntentDiscount;
    private boolean countdownEnabled;
    private Instant countdownEndDate;
    private String countdownMessage;

    // Analytics
    private String gaTrackingId;
    private String gtmContainerId;
    private String metaPixelId;
    private String tiktokPixelId;

    // Locale
    private String defaultLanguage;
    private String enabledLanguages;

    // Custom code
    private String customCss;
    private String customHeadJs;
    private String customFooterJs;

    // Nested
    private List<WebsiteSectionResponse> sections;

    private Instant createdAt;
    private Instant updatedAt;
}
