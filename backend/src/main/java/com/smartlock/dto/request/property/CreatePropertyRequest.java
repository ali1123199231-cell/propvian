package com.smartlock.dto.request.property;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class CreatePropertyRequest {
    @NotBlank
    @Size(min = 2, max = 200)
    private String name;

    @Size(max = 100)
    private String propertyType;

    @Size(max = 500)
    private String address;

    @Size(max = 100)
    private String city;

    @Size(max = 100)
    private String state;

    @Size(max = 100)
    private String country;

    @Size(max = 20)
    private String postalCode;

    @Size(max = 100)
    private String timezone;

    private String description;
    private String imageUrl;

    private Integer maxGuests;
    private Integer bedrooms;
    private Integer bathrooms;

    private UUID cleanerUserId;

    // Direct booking pricing
    @Size(max = 3)
    private String currency;
    private BigDecimal baseNightlyRate;
    private BigDecimal cleaningFee;
    private BigDecimal securityDeposit;
    private Integer    minStayNights;
    private Integer    maxStayNights;

    @Size(max = 10)
    private String checkInTime;

    @Size(max = 10)
    private String checkOutTime;

    private Boolean instantBooking;

    // ── Business Rules ─────────────────────────────────────────────────────────
    // FLEXIBLE | MODERATE | STRICT | NON_REFUNDABLE
    @Size(max = 30)
    private String cancellationPolicy;

    private Integer bufferDaysBefore;
    private Integer bufferDaysAfter;
    private Boolean depositRequired;
    private BigDecimal depositPercent;

    // ── Location coordinates ───────────────────────────────────────────────────
    private BigDecimal latitude;
    private BigDecimal longitude;

    // ── Status ────────────────────────────────────────────────────────────────
    // DRAFT | ACTIVE | PAUSED | ARCHIVED
    @Size(max = 20)
    private String status;

    // ── Booking slug ──────────────────────────────────────────────────────────
    @Size(max = 255)
    private String slug;
}
