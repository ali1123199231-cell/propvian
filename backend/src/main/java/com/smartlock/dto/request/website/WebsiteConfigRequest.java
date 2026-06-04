package com.smartlock.dto.request.website;

import lombok.Data;

@Data
public class WebsiteConfigRequest {
    private String brandName;
    private String brandLogoUrl;
    private String primaryColor;
    private String accentColor;
    private String fontFamily;
    private String buttonStyle;
    private String themeStyle;
    private String pageTitle;
    private String metaDescription;
    private String ogImageUrl;
    private Boolean stickyBookButton;
    private Boolean exitIntentEnabled;
    private String exitIntentMessage;
    private Integer exitIntentDiscount;
    private Boolean countdownEnabled;
    private String countdownEndDate;
    private String countdownMessage;
    private String gaTrackingId;
    private String gtmContainerId;
    private String metaPixelId;
    private String tiktokPixelId;
    private String defaultLanguage;
    private String enabledLanguages;
    private String customCss;
    private String customHeadJs;
    private String customFooterJs;
    private Boolean setupCompleted;
}
