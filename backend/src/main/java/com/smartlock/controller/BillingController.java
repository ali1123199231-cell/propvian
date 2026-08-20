package com.smartlock.controller;

import com.smartlock.domain.Organization;
import com.smartlock.domain.Subscription;
import com.smartlock.domain.User;
import com.smartlock.dto.request.billing.CheckoutRequest;
import com.smartlock.dto.request.billing.UpdateQuotaRequest;
import com.smartlock.dto.response.billing.BillingStatusResponse;
import com.smartlock.dto.response.common.ApiResponse;
import com.smartlock.exception.AppException;
import com.smartlock.exception.ResourceNotFoundException;
import com.smartlock.service.OrganizationSecurityService;
import com.smartlock.repository.OrganizationRepository;
import com.smartlock.repository.UserRepository;
import com.smartlock.security.CustomUserDetails;
import com.smartlock.service.AuditLogService;
import com.smartlock.service.BillingService;
import com.smartlock.service.PayPalService;
import com.smartlock.service.StripeService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
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
    private final AuditLogService auditLogService;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    private static String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    /** Single source of truth for the billing status payload — three endpoints return it. */
    private BillingStatusResponse toStatusResponse(UUID orgId, Subscription sub) {
        int propertyQuota = billingService.getPropertyQuota(sub);
        return BillingStatusResponse.builder()
                .status(sub.getStatus().name())
                .trialActive(billingService.isTrialActive(sub))
                .paidActive(billingService.isPaidActive(sub))
                .accessActive(billingService.isAccessActive(sub))
                .trialEnd(sub.getTrialEnd())
                .currentPeriodEnd(sub.getCurrentPeriodEnd())
                .lockQuota(billingService.getLockQuota(sub))
                .usedLocks(billingService.getUsedLockCount(orgId))
                // null = uncapped plan; the UI renders "Unlimited" rather than a sentinel number.
                .propertyQuota(propertyQuota == Integer.MAX_VALUE ? null : propertyQuota)
                .activeProperties(billingService.getActivePropertyCount(orgId))
                .cancelAtPeriodEnd(Boolean.TRUE.equals(sub.getCancelAtPeriodEnd()))
                .paymentProvider(sub.getPaymentProvider())
                .failedPaymentAt(sub.getFailedPaymentAt())
                .build();
    }

    @GetMapping
    public ResponseEntity<ApiResponse<BillingStatusResponse>> getBillingStatus(
            @PathVariable UUID orgId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        log.debug("BillingController.getBillingStatus — orgId={}", orgId);
        orgSecurity.requireOrgAccess(orgId);
        Subscription sub = billingService.getSubscription(orgId);
        BillingStatusResponse response = toStatusResponse(orgId, sub);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/checkout/stripe")
    public ResponseEntity<ApiResponse<Map<String, String>>> createStripeCheckout(
            @PathVariable UUID orgId,
            @Valid @RequestBody CheckoutRequest request,
            @AuthenticationPrincipal CustomUserDetails principal,
            HttpServletRequest httpRequest) throws Exception {
        log.info("BillingController.createStripeCheckout — orgId={}", orgId);
        orgSecurity.requireOrgAccess(orgId);
        String ip = clientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        try {
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

            auditLogService.logResult(orgId, principal.getUserId(), principal.getEmail(),
                    "BILLING_STRIPE_CHECKOUT_CLICK", "ORGANIZATION", orgId, ip, userAgent, true, null);
            return ResponseEntity.ok(ApiResponse.success(Map.of("url", checkoutUrl)));
        } catch (Exception e) {
            auditLogService.logResult(orgId, principal.getUserId(), principal.getEmail(),
                    "BILLING_STRIPE_CHECKOUT_CLICK", "ORGANIZATION", orgId, ip, userAgent, false, e.getMessage());
            throw e;
        }
    }

    @PostMapping("/portal/stripe")
    public ResponseEntity<ApiResponse<Map<String, String>>> createStripePortal(
            @PathVariable UUID orgId,
            @AuthenticationPrincipal CustomUserDetails principal,
            HttpServletRequest httpRequest) throws Exception {
        log.info("BillingController.createStripePortal — orgId={}", orgId);
        orgSecurity.requireOrgAccess(orgId);
        String ip = clientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        try {
            String returnUrl = frontendUrl + "/billing";
            String portalUrl = stripeService.createCustomerPortalSession(orgId, returnUrl);
            auditLogService.logResult(orgId, principal.getUserId(), principal.getEmail(),
                    "BILLING_STRIPE_PORTAL_CLICK", "ORGANIZATION", orgId, ip, userAgent, true, null);
            return ResponseEntity.ok(ApiResponse.success(Map.of("url", portalUrl)));
        } catch (Exception e) {
            auditLogService.logResult(orgId, principal.getUserId(), principal.getEmail(),
                    "BILLING_STRIPE_PORTAL_CLICK", "ORGANIZATION", orgId, ip, userAgent, false, e.getMessage());
            throw e;
        }
    }

    @PostMapping("/checkout/paypal")
    public ResponseEntity<ApiResponse<Map<String, String>>> createPaypalSubscription(
            @PathVariable UUID orgId,
            @Valid @RequestBody CheckoutRequest request,
            @AuthenticationPrincipal CustomUserDetails principal,
            HttpServletRequest httpRequest) {
        log.info("BillingController.createPaypalSubscription — orgId={}", orgId);
        orgSecurity.requireOrgAccess(orgId);
        String ip = clientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        try {
            String returnUrl = request.getSuccessUrl() != null ? request.getSuccessUrl()
                    : frontendUrl + "/billing?success=true";
            String cancelUrl = request.getCancelUrl() != null ? request.getCancelUrl()
                    : frontendUrl + "/billing?cancelled=true";

            String approvalUrl = payPalService.createSubscriptionLink(orgId, request.getQuantity(), returnUrl, cancelUrl);
            auditLogService.logResult(orgId, principal.getUserId(), principal.getEmail(),
                    "BILLING_PAYPAL_CHECKOUT_CLICK", "ORGANIZATION", orgId, ip, userAgent, true, null);
            return ResponseEntity.ok(ApiResponse.success(Map.of("url", approvalUrl)));
        } catch (RuntimeException e) {
            auditLogService.logResult(orgId, principal.getUserId(), principal.getEmail(),
                    "BILLING_PAYPAL_CHECKOUT_CLICK", "ORGANIZATION", orgId, ip, userAgent, false, e.getMessage());
            throw e;
        }
    }

    @PostMapping("/sync")
    public ResponseEntity<ApiResponse<BillingStatusResponse>> syncSubscription(
            @PathVariable UUID orgId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        log.info("BillingController.syncSubscription — orgId={}", orgId);
        orgSecurity.requireOrgAccess(orgId);
        stripeService.syncSubscriptionStatus(orgId);

        Subscription sub = billingService.getSubscription(orgId);
        BillingStatusResponse response = toStatusResponse(orgId, sub);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/quota")
    public ResponseEntity<ApiResponse<BillingStatusResponse>> updateQuota(
            @PathVariable UUID orgId,
            @Valid @RequestBody UpdateQuotaRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) throws Exception {
        log.info("BillingController.updateQuota — orgId={} quantity={}", orgId, request.getQuantity());
        orgSecurity.requireOrgAccess(orgId);
        Subscription sub = billingService.validateQuotaChange(orgId, request.getQuantity());

        // The quantity has to change at the provider, not just locally: it is what the customer is
        // charged, and syncSubscriptionStatus copies Stripe's value back over ours.
        if (!"STRIPE".equals(sub.getPaymentProvider())) {
            throw new AppException(
                    "Changing your subscription quantity is only supported for card subscriptions. "
                            + "Manage your PayPal billing agreement in your PayPal account.",
                    HttpStatus.BAD_REQUEST, "PROVIDER_UNSUPPORTED");
        }
        stripeService.updateSubscriptionQuantity(orgId, request.getQuantity());

        BillingStatusResponse response = toStatusResponse(orgId, billingService.getSubscription(orgId));
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
