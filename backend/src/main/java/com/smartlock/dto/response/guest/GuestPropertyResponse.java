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
public class GuestPropertyResponse {
    private String id;
    private String orgSlug;
    private String name;
    private String description;
    private String imageUrl;
    private List<String> photoUrls;
    private String city;
    private String country;
    private Integer maxGuests;
    private Integer bedrooms;
    private Integer bathrooms;
    private BigDecimal baseNightlyRate;
    private BigDecimal cleaningFee;
    private String checkInTime;
    private String checkOutTime;
    private String cancellationPolicy;
    private int minStayNights;
    private boolean instantBooking;

    // Payment methods available for this host
    private boolean stripeEnabled;
    private boolean paypalEnabled;
    private String stripePublishableKey;
    private String paypalClientId;

    // Unavailability data for the date picker
    private List<BlockedRange> blockedDates;
    private List<PricingRuleInfo> pricingRules;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class BlockedRange {
        private String startDate;
        private String endDate;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class PricingRuleInfo {
        private String startDate;
        private String endDate;
        private BigDecimal nightlyRate;
    }
}
