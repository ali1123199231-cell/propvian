package com.smartlock.dto.response.guest;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicOrgSiteResponse {

    private String orgSlug;
    private String orgName;

    // Website branding (from WebsiteConfig; falls back to org defaults)
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
    private String gaTrackingId;
    private String gtmContainerId;
    private String metaPixelId;
    private String tiktokPixelId;

    // Conversion / UX features
    private boolean stickyBookButton;
    private boolean exitIntentEnabled;
    private String exitIntentMessage;
    private Integer exitIntentDiscount;

    // Custom code injection
    private String customCss;
    private String customHeadJs;
    private String customFooterJs;

    private List<PublicSectionDto> sections;
    private List<PublicPropertyCard> properties;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PublicSectionDto {
        private String id;
        private String sectionType;
        private String title;
        private boolean enabled;
        private int position;

        private Object config;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PublicPropertyCard {
        private String id;
        private String slug;
        private String name;
        private String description;
        private String imageUrl;
        private List<String> photoUrls;
        private String city;
        private String country;
        private Integer bedrooms;
        private Integer beds;
        private Integer bathrooms;
        private Integer maxGuests;
        private BigDecimal baseNightlyRate;
        private BigDecimal cleaningFee;
        private String propertyType;
        private int minStayNights;
        private String checkInTime;
        private String checkOutTime;
        // Actual property data for website builder section fallbacks
        private List<AmenityItem> amenities;
        private List<HouseRuleItem> houseRules;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AmenityItem {
        private String name;
        private String icon;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HouseRuleItem {
        private String ruleKey;
        private boolean allowed;
        private String notes;
    }
}
