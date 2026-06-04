package com.smartlock.domain;

import com.smartlock.domain.base.SoftDeletableEntity;
import com.smartlock.domain.enums.PropertyStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "properties")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Property extends SoftDeletableEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 500)
    private String address;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String state;

    @Column(length = 100)
    private String country;

    @Column(name = "postal_code", length = 20)
    private String postalCode;

    @Column(length = 100)
    @Builder.Default
    private String timezone = "UTC";

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private PropertyStatus status = PropertyStatus.ACTIVE;

    @Column(name = "cleaner_user_id")
    private UUID cleanerUserId;

    @Column(name = "max_guests")
    private Integer maxGuests;

    @Column
    private Integer bedrooms;

    @Column
    private Integer bathrooms;

    @Column(name = "wifi_details", columnDefinition = "TEXT")
    private String wifiDetails;

    @Column(name = "access_instructions", columnDefinition = "TEXT")
    private String accessInstructions;

    @Column(name = "property_type", length = 100)
    private String propertyType;

    @Column(name = "currency", length = 3, nullable = false)
    @Builder.Default
    private String currency = "USD";

    @Column(name = "base_nightly_rate", precision = 10, scale = 2)
    private BigDecimal baseNightlyRate;

    @Column(name = "cleaning_fee", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal cleaningFee = BigDecimal.ZERO;

    @Column(name = "security_deposit", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal securityDeposit = BigDecimal.ZERO;

    @Column(name = "min_stay_nights")
    @Builder.Default
    private int minStayNights = 1;

    @Column(name = "max_stay_nights")
    @Builder.Default
    private int maxStayNights = 365;

    @Column(name = "check_in_time", length = 10)
    @Builder.Default
    private String checkInTime = "15:00";

    @Column(name = "check_out_time", length = 10)
    @Builder.Default
    private String checkOutTime = "11:00";

    @Column(name = "instant_booking", nullable = false)
    @Builder.Default
    private boolean instantBooking = true;

    @Column(name = "slug", length = 255)
    private String slug;

    // ── Business Rules ─────────────────────────────────────────────────────────

    @Column(name = "cancellation_policy", length = 30)
    @Builder.Default
    private String cancellationPolicy = "MODERATE";  // FLEXIBLE | MODERATE | STRICT | NON_REFUNDABLE

    @Column(name = "buffer_days_before", nullable = false)
    @Builder.Default
    private int bufferDaysBefore = 0;

    @Column(name = "buffer_days_after", nullable = false)
    @Builder.Default
    private int bufferDaysAfter = 0;

    @Column(name = "deposit_required", nullable = false)
    @Builder.Default
    private boolean depositRequired = false;

    @Column(name = "deposit_percent", precision = 5, scale = 2)
    private java.math.BigDecimal depositPercent;

    // ── Location coordinates ───────────────────────────────────────────────────

    @Column(name = "latitude", precision = 10, scale = 7)
    private java.math.BigDecimal latitude;

    @Column(name = "longitude", precision = 10, scale = 7)
    private java.math.BigDecimal longitude;

    @Column(name = "ical_export_token", length = 64)
    private String icalExportToken;
}
