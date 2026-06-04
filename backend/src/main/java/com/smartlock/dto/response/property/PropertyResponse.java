package com.smartlock.dto.response.property;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PropertyResponse {
    private UUID id;
    private UUID organizationId;
    private String name;
    private String propertyType;
    private String address;
    private String city;
    private String state;
    private String country;
    private String postalCode;
    private String timezone;
    private String description;
    private String imageUrl;
    private String status;
    private UUID cleanerUserId;
    private Integer maxGuests;
    private Integer bedrooms;
    private Integer bathrooms;
    private long lockCount;
    private long activeReservationCount;

    // Direct booking pricing
    private String currency;
    private BigDecimal baseNightlyRate;
    private BigDecimal cleaningFee;
    private BigDecimal securityDeposit;
    private int minStayNights;
    private int maxStayNights;
    private String checkInTime;
    private String checkOutTime;
    private boolean instantBooking;
    private String slug;

    // Business rules
    private String cancellationPolicy;
    private int bufferDaysBefore;
    private int bufferDaysAfter;
    private boolean depositRequired;
    private java.math.BigDecimal depositPercent;

    // Location coordinates
    private java.math.BigDecimal latitude;
    private java.math.BigDecimal longitude;

    private Instant createdAt;

    private List<PhotoInfo> photos;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PhotoInfo {
        private UUID id;
        private String url;
        private String caption;
        private int sortOrder;
        private boolean primary;
    }
}
