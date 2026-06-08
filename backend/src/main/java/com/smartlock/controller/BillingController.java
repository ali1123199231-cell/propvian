package com.smartlock.controller;

import com.smartlock.domain.Organization;
import com.smartlock.domain.Subscription;
import com.smartlock.domain.User;
import com.smartlock.dto.request.billing.CheckoutRequest;
import com.smartlock.dto.request.billing.UpdateQuotaRequest;
import com.smartlock.dto.response.billing.BillingStatusResponse;
import com.smartlock.dto.response.common.ApiResponse;
import com.smartlock.exception.ResourceNotFoundException;
import com.smartlock.service.OrganizationSecurityService;
import com.smartlock.repository.OrganizationRepository;
import com.smartlock.repository.UserRepository;
import com.smartlock.security.CustomUserDetails;
import com.smartlock.service.BillingService;
import com.smartlock.service.PayPalService;
import com.smartlock.service.StripeService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/organizations/{orgId}/billing")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Billing")
@Slf4j
public class BillingController {

    private final BillingService billingService;
    private final StripeService stripeService;
    private final PayPalService payPalService;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final OrganizationSecurityService orgSecurity;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @GetMapping
    public ResponseEntity<ApiResponse<BillingStatusResponse>> getBillingStatus(
            @PathVariable UUID orgId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        log.debug("BillingController.getBillingStatus — orgId={}", orgId);
        orgSecurity.requireOrgAccess(orgId);
        Subscription sub = billingService.getSubscription(orgId);
        long usedLocks = billingService.getUsedLockCount(orgId);

        BillingStatusResponse response = BillingStatusResponse.builder()
                .status(sub.getStatus().name())
                .trialActive(billingService.isTrialActive(sub))
                .paidActive(billingService.isPaidActive(sub))
                .accessActive(billingService.isAccessActive(sub))
                .trialEnd(sub.getTrialEnd())
                .currentPeriodEnd(sub.getCurrentPeriodEnd())
                .lockQuota(billingService.getLockQuota(sub))
                .usedLocks(usedLocks)
                .cancelAtPeriodEnd(Boolean.TRUE.equals(sub.getCancelAtPeriodEnd()))
                .paymentProvider(sub.getPaymentProvider())
                .failedPaymentAt(sub.getFailedPaymentAt())
                .build();

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/checkout/stripe")
    public ResponseEntity<ApiResponse<Map<String, String>>> createStripeCheckout(
            @PathVariable UUID orgId,
            @Valid @RequestBody CheckoutRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) throws Exception {
        log.info("BillingController.createStripeCheckout — orgId={}", orgId);
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", orgId));
        User owner = userRepository.findById(org.getOwnerId())
                .orElseThrow(() -> new ResourceNotFoundException("User", org.getOwnerId()));

        String successUrl = request.getSuccessUrl() != null ? request.getSuccessUrl()
                : frontendUrl + "/billing?success=true";
        String cancelUrl = request.getCancelUrl() != null ? request.getCancelUrl()
                : frontendUrl + "/billing?cancelled=true";

        String checkoutUrl = stripeService.createCheckoutSession(
                orgId, org.getName(), owner.getEmail(),
                request.getQuantity(), successUrl, cancelUrl);

        return ResponseEntity.ok(ApiResponse.success(Map.of("url", checkoutUrl)));
    }

    @PostMapping("/portal/stripe")
    public ResponseEntity<ApiResponse<Map<String, String>>> createStripePortal(
            @PathVariable UUID orgId,
            @AuthenticationPrincipal CustomUserDetails principal) throws Exception {
        log.info("BillingController.createStripePortal — orgId={}", orgId);
        String returnUrl = frontendUrl + "/billing";
        String portalUrl = stripeService.createCustomerPortalSession(orgId, returnUrl);
        return ResponseEntity.ok(ApiResponse.success(Map.of("url", portalUrl)));
    }

    @PostMapping("/checkout/paypal")
    public ResponseEntity<ApiResponse<Map<String, String>>> createPaypalSubscription(
            @PathVariable UUID orgId,
            @Valid @RequestBody CheckoutRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        log.info("BillingController.createPaypalSubscription — orgId={}", orgId);
        String returnUrl = request.getSuccessUrl() != null ? request.getSuccessUrl()
                : frontendUrl + "/billing?success=true";
        String cancelUrl = request.getCancelUrl() != null ? request.getCancelUrl()
                : frontendUrl + "/billing?cancelled=true";

        String approvalUrl = payPalService.createSubscriptionLink(orgId, request.getQuantity(), returnUrl, cancelUrl);
        return ResponseEntity.ok(ApiResponse.success(Map.of("url", approvalUrl)));
    }

    @PostMapping("/sync")
    public ResponseEntity<ApiResponse<BillingStatusResponse>> syncSubscription(
            @PathVariable UUID orgId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        log.info("BillingController.syncSubscription — orgId={}", orgId);
        orgSecurity.requireOrgAccess(orgId);
        stripeService.syncSubscriptionStatus(orgId);

        Subscription sub = billingService.getSubscription(orgId);
        long usedLocks = billingService.getUsedLockCount(orgId);
        BillingStatusResponse response = BillingStatusResponse.builder()
                .status(sub.getStatus().name())
                .trialActive(billingService.isTrialActive(sub))
                .paidActive(billingService.isPaidActive(sub))
                .accessActive(billingService.isAccessActive(sub))
                .trialEnd(sub.getTrialEnd())
                .currentPeriodEnd(sub.getCurrentPeriodEnd())
                .lockQuota(billingService.getLockQuota(sub))
                .usedLocks(usedLocks)
                .cancelAtPeriodEnd(Boolean.TRUE.equals(sub.getCancelAtPeriodEnd()))
                .paymentProvider(sub.getPaymentProvider())
                .failedPaymentAt(sub.getFailedPaymentAt())
                .build();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/quota")
    public ResponseEntity<ApiResponse<BillingStatusResponse>> updateLockQuota(
            @PathVariable UUID orgId,
            @Valid @RequestBody UpdateQuotaRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        log.info("BillingController.updateLockQuota — orgId={}", orgId);
        billingService.updateLockQuota(orgId, request.getQuantity());

        Subscription sub = billingService.getSubscription(orgId);
        long usedLocks = billingService.getUsedLockCount(orgId);

        BillingStatusResponse response = BillingStatusResponse.builder()
                .status(sub.getStatus().name())
                .trialActive(billingService.isTrialActive(sub))
                .paidActive(billingService.isPaidActive(sub))
                .accessActive(billingService.isAccessActive(sub))
                .trialEnd(sub.getTrialEnd())
                .currentPeriodEnd(sub.getCurrentPeriodEnd())
                .lockQuota(billingService.getLockQuota(sub))
                .usedLocks(usedLocks)
                .cancelAtPeriodEnd(Boolean.TRUE.equals(sub.getCancelAtPeriodEnd()))
                .paymentProvider(sub.getPaymentProvider())
                .failedPaymentAt(sub.getFailedPaymentAt())
                .build();

        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
