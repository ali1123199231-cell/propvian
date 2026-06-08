package com.smartlock.domain;

import com.smartlock.domain.base.BaseEntity;
import com.smartlock.domain.enums.DirectBookingStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "direct_bookings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DirectBooking extends BaseEntity {

    @Column(name = "property_id", nullable = false)
    private UUID propertyId;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    // ── Guest ─────────────────────────────────────────────────────────────────
    @Column(name = "guest_name", nullable = false, length = 255)
    private String guestName;

    @Column(name = "guest_email", nullable = false, length = 255)
    private String guestEmail;

    @Column(name = "guest_phone", length = 100)
    private String guestPhone;

    @Column(name = "number_of_guests", nullable = false)
    @Builder.Default
    private int numberOfGuests = 1;

    // ── Stay ──────────────────────────────────────────────────────────────────
    @Column(name = "check_in_date", nullable = false)
    private LocalDate checkInDate;

    @Column(name = "check_out_date", nullable = false)
    private LocalDate checkOutDate;

    // ── Pricing ───────────────────────────────────────────────────────────────
    @Column(name = "total_amount", precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "currency", nullable = false, length = 3)
    @Builder.Default
    private String currency = "USD";

    // ── Payment ───────────────────────────────────────────────────────────────
    @Column(name = "payment_provider", length = 50)
    private String paymentProvider;

    @Column(name = "payment_intent_id", columnDefinition = "text")
    private String paymentIntentId;

    @Column(name = "payment_status", nullable = false, length = 50)
    @Builder.Default
    private String paymentStatus = "PENDING";

    // ── Status ────────────────────────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private DirectBookingStatus status = DirectBookingStatus.PENDING_PAYMENT;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @Column(name = "cancellation_reason", columnDefinition = "text")
    private String cancellationReason;

    @Column(name = "promo_code_used", length = 100)
    private String promoCodeUsed;

    @Column(name = "discount_amount", precision = 10, scale = 2)
    private java.math.BigDecimal discountAmount;

    @Column(columnDefinition = "text")
    private String notes;
}
