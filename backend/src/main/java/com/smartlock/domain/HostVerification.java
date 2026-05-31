package com.smartlock.domain;

import com.smartlock.domain.enums.VerificationStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "host_verifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HostVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "organization_id", nullable = false, unique = true)
    private UUID organizationId;

    // ── Step statuses ─────────────────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(name = "identity_status", nullable = false, length = 20)
    @Builder.Default
    private VerificationStatus identityStatus = VerificationStatus.NOT_STARTED;

    @Enumerated(EnumType.STRING)
    @Column(name = "property_status", nullable = false, length = 20)
    @Builder.Default
    private VerificationStatus propertyStatus = VerificationStatus.NOT_STARTED;

    @Enumerated(EnumType.STRING)
    @Column(name = "ota_status", nullable = false, length = 20)
    @Builder.Default
    private VerificationStatus otaStatus = VerificationStatus.NOT_STARTED;

    @Enumerated(EnumType.STRING)
    @Column(name = "calendar_status", nullable = false, length = 20)
    @Builder.Default
    private VerificationStatus calendarStatus = VerificationStatus.NOT_STARTED;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 20)
    @Builder.Default
    private VerificationStatus paymentStatus = VerificationStatus.NOT_STARTED;

    @Enumerated(EnumType.STRING)
    @Column(name = "domain_status", nullable = false, length = 20)
    @Builder.Default
    private VerificationStatus domainStatus = VerificationStatus.NOT_STARTED;

    @Enumerated(EnumType.STRING)
    @Column(name = "admin_status", nullable = false, length = 20)
    @Builder.Default
    private VerificationStatus adminStatus = VerificationStatus.NOT_STARTED;

    // ── Identity ──────────────────────────────────────────────────────────────
    @Column(name = "identity_document_url", columnDefinition = "text")
    private String identityDocumentUrl;

    @Column(name = "selfie_url", columnDefinition = "text")
    private String selfieUrl;

    @Column(name = "identity_submitted_at")
    private Instant identitySubmittedAt;

    @Column(name = "identity_reviewed_at")
    private Instant identityReviewedAt;

    @Column(name = "identity_rejection_reason", columnDefinition = "text")
    private String identityRejectionReason;

    // ── Property ──────────────────────────────────────────────────────────────
    @Column(name = "property_address_line", columnDefinition = "text")
    private String propertyAddressLine;

    @Column(name = "ownership_proof_url", columnDefinition = "text")
    private String ownershipProofUrl;

    @Column(name = "management_auth_url", columnDefinition = "text")
    private String managementAuthUrl;

    @Column(name = "property_submitted_at")
    private Instant propertySubmittedAt;

    @Column(name = "property_reviewed_at")
    private Instant propertyReviewedAt;

    @Column(name = "property_rejection_reason", columnDefinition = "text")
    private String propertyRejectionReason;

    // ── OTA ───────────────────────────────────────────────────────────────────
    @Column(name = "airbnb_listing_url", columnDefinition = "text")
    private String airbnbListingUrl;

    @Column(name = "booking_listing_url", columnDefinition = "text")
    private String bookingListingUrl;

    @Column(name = "ota_submitted_at")
    private Instant otaSubmittedAt;

    @Column(name = "ota_reviewed_at")
    private Instant otaReviewedAt;

    @Column(name = "ota_rejection_reason", columnDefinition = "text")
    private String otaRejectionReason;

    @Column(name = "ota_auto_verified", nullable = false)
    @Builder.Default
    private boolean otaAutoVerified = false;

    @Column(name = "ota_review_count")
    private Integer otaReviewCount;

    @Column(name = "ota_verification_note", columnDefinition = "text")
    private String otaVerificationNote;

    // ── Calendar ──────────────────────────────────────────────────────────────
    @Column(name = "airbnb_ical_url", columnDefinition = "text")
    private String airbnbIcalUrl;

    @Column(name = "booking_ical_url", columnDefinition = "text")
    private String bookingIcalUrl;

    @Column(name = "other_ical_urls", columnDefinition = "jsonb")
    @Builder.Default
    private String otherIcalUrls = "[]";

    @Column(name = "calendar_connected_at")
    private Instant calendarConnectedAt;

    // ── Property docs extra ───────────────────────────────────────────────────
    @Column(name = "utility_bill_url", columnDefinition = "text")
    private String utilityBillUrl;

    // ── Payment ───────────────────────────────────────────────────────────────
    @Column(name = "stripe_account_id")
    private String stripeAccountId;

    @Column(name = "paypal_account_id")
    private String paypalAccountId;

    @Column(name = "stripe_connected_at")
    private Instant stripeConnectedAt;

    @Column(name = "paypal_connected_at")
    private Instant paypalConnectedAt;

    @Column(name = "stripe_charges_enabled", nullable = false)
    @Builder.Default
    private boolean stripeChargesEnabled = false;

    @Column(name = "stripe_payouts_enabled", nullable = false)
    @Builder.Default
    private boolean stripePayoutsEnabled = false;

    // ── Domain ────────────────────────────────────────────────────────────────
    @Column(name = "custom_domain", length = 255)
    private String customDomain;

    @Column(name = "domain_verified_at")
    private Instant domainVerifiedAt;

    @Column(name = "domain_cname_target", length = 255)
    private String domainCnameTarget;

    @Column(name = "domain_verification_token", length = 255)
    private String domainVerificationToken;

    // ── Admin ─────────────────────────────────────────────────────────────────
    @Column(name = "admin_reviewed_by")
    private UUID adminReviewedBy;

    @Column(name = "admin_reviewed_at")
    private Instant adminReviewedAt;

    @Column(name = "admin_notes", columnDefinition = "text")
    private String adminNotes;

    @Column(name = "admin_rejection_reason", columnDefinition = "text")
    private String adminRejectionReason;

    // ── Derived ───────────────────────────────────────────────────────────────
    @Column(name = "bookings_enabled", nullable = false)
    @Builder.Default
    private boolean bookingsEnabled = false;

    @Column(name = "completed_steps", nullable = false)
    @Builder.Default
    private int completedSteps = 0;

    @Column(name = "total_required_steps", nullable = false)
    @Builder.Default
    private int totalRequiredSteps = 7;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(nullable = false)
    private Long version;
}
