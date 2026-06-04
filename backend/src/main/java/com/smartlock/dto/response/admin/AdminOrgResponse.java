package com.smartlock.dto.response.admin;

import com.smartlock.domain.Organization;
import com.smartlock.domain.Subscription;
import com.smartlock.domain.enums.SubscriptionStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class AdminOrgResponse {
    private UUID id;
    private String slug;
    private String name;
    private String ownerEmail;
    private UUID ownerId;
    private String country;
    private String timezone;
    private Instant createdAt;
    private boolean deleted;

    // Subscription summary
    private SubscriptionStatus subscriptionStatus;
    private String paymentProvider;
    private Instant trialEnd;
    private Instant currentPeriodEnd;
    private Integer lockQuota;

    // Verification summary
    private String verificationAdminStatus;
    private boolean bookingsEnabled;

    public static AdminOrgResponse from(Organization org, String ownerEmail,
                                        Subscription sub, String adminVerifStatus, boolean bookingsEnabled) {
        AdminOrgResponse.AdminOrgResponseBuilder b = AdminOrgResponse.builder()
                .id(org.getId())
                .slug(org.getSlug())
                .name(org.getName())
                .ownerId(org.getOwnerId())
                .ownerEmail(ownerEmail)
                .country(org.getCountry())
                .timezone(org.getTimezone())
                .createdAt(org.getCreatedAt())
                .deleted(org.isDeleted())
                .verificationAdminStatus(adminVerifStatus)
                .bookingsEnabled(bookingsEnabled);

        if (sub != null) {
            b.subscriptionStatus(sub.getStatus())
             .paymentProvider(sub.getPaymentProvider())
             .trialEnd(sub.getTrialEnd())
             .currentPeriodEnd(sub.getCurrentPeriodEnd())
             .lockQuota(sub.getLockQuota());
        }
        return b.build();
    }
}
