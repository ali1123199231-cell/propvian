package com.smartlock.controller;

import com.smartlock.domain.Subscription;
import com.smartlock.domain.SubscriptionPlan;
import com.smartlock.dto.response.common.ApiResponse;
import com.smartlock.exception.ResourceNotFoundException;
import com.smartlock.repository.SubscriptionPlanRepository;
import com.smartlock.repository.SubscriptionRepository;
import com.smartlock.security.CustomUserDetails;
import com.smartlock.service.OrganizationSecurityService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Subscriptions")
public class SubscriptionController {

    private final SubscriptionPlanRepository planRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final OrganizationSecurityService orgSecurity;

    @GetMapping("/subscriptions/plans")
    public ResponseEntity<ApiResponse<List<SubscriptionPlan>>> getPlans() {
        return ResponseEntity.ok(ApiResponse.success(planRepository.findByIsActiveTrueOrderByMonthlyPriceAsc()));
    }

    @GetMapping("/organizations/{orgId}/subscription")
    public ResponseEntity<ApiResponse<SubscriptionView>> getSubscription(
            @PathVariable UUID orgId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        orgSecurity.requireOrgAccess(orgId);
        Subscription sub = subscriptionRepository.findByOrganizationId(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found"));
        return ResponseEntity.ok(ApiResponse.success(toView(sub)));
    }

    /** Safe public view — never expose Stripe/PayPal IDs to the client. */
    private SubscriptionView toView(Subscription sub) {
        return SubscriptionView.builder()
                .id(sub.getId())
                .organizationId(sub.getOrganizationId())
                .status(sub.getStatus() != null ? sub.getStatus().name() : null)
                .lockQuota(sub.getLockQuota())
                .paymentProvider(sub.getPaymentProvider())
                .currentPeriodStart(sub.getCurrentPeriodStart())
                .currentPeriodEnd(sub.getCurrentPeriodEnd())
                .trialEnd(sub.getTrialEnd())
                .cancelAtPeriodEnd(Boolean.TRUE.equals(sub.getCancelAtPeriodEnd()))
                .failedPaymentAt(sub.getFailedPaymentAt())
                .cancelledAt(sub.getCancelledAt())
                .hasStripeSubscription(sub.getStripeSubscriptionId() != null)
                .hasPaypalSubscription(sub.getPaypalSubscriptionId() != null)
                .build();
    }

    @Data
    @Builder
    public static class SubscriptionView {
        private UUID id;
        private UUID organizationId;
        private String status;
        private Integer lockQuota;
        private String paymentProvider;
        private Instant currentPeriodStart;
        private Instant currentPeriodEnd;
        private Instant trialEnd;
        private boolean cancelAtPeriodEnd;
        private Instant failedPaymentAt;
        private Instant cancelledAt;
        private boolean hasStripeSubscription;
        private boolean hasPaypalSubscription;
    }
}
