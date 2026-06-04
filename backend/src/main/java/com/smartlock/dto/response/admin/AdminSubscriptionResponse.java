package com.smartlock.dto.response.admin;

import com.smartlock.domain.Subscription;
import com.smartlock.domain.enums.SubscriptionStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class AdminSubscriptionResponse {
    private UUID id;
    private UUID organizationId;
    private String organizationName;
    private String ownerEmail;
    private SubscriptionStatus status;
    private String paymentProvider;
    private String stripeCustomerId;
    private String stripeSubscriptionId;
    private String paypalSubscriptionId;
    private Integer lockQuota;
    private Instant trialEnd;
    private Instant currentPeriodEnd;
    private Instant failedPaymentAt;
    private Boolean cancelAtPeriodEnd;
    private Instant createdAt;

    public static AdminSubscriptionResponse from(Subscription sub, String orgName, String ownerEmail) {
        return AdminSubscriptionResponse.builder()
                .id(sub.getId())
                .organizationId(sub.getOrganizationId())
                .organizationName(orgName)
                .ownerEmail(ownerEmail)
                .status(sub.getStatus())
                .paymentProvider(sub.getPaymentProvider())
                .stripeCustomerId(sub.getStripeCustomerId())
                .stripeSubscriptionId(sub.getStripeSubscriptionId())
                .paypalSubscriptionId(sub.getPaypalSubscriptionId())
                .lockQuota(sub.getLockQuota())
                .trialEnd(sub.getTrialEnd())
                .currentPeriodEnd(sub.getCurrentPeriodEnd())
                .failedPaymentAt(sub.getFailedPaymentAt())
                .cancelAtPeriodEnd(sub.getCancelAtPeriodEnd())
                .createdAt(sub.getCreatedAt())
                .build();
    }
}
