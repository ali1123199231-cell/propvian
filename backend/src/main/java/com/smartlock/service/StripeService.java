package com.smartlock.service;

import com.smartlock.domain.Subscription;
import com.smartlock.domain.enums.SubscriptionStatus;
import com.smartlock.exception.AppException;
import com.smartlock.repository.SubscriptionRepository;
import org.springframework.http.HttpStatus;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.*;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.CustomerCreateParams;
import com.stripe.net.RequestOptions;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.billingportal.SessionCreateParams;
import com.stripe.param.checkout.SessionCreateParams.LineItem;
import com.stripe.param.checkout.SessionCreateParams.Mode;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class StripeService {

    @Value("${stripe.secret-key:}")
    private String secretKeyEnv;

    @Value("${stripe.webhook-secret:}")
    private String webhookSecretEnv;

    @Value("${stripe.price-id:}")
    private String priceIdEnv;

    private final SubscriptionRepository subscriptionRepository;
    private final BillingService         billingService;
    private final SystemConfigService    systemConfigService;

    @Lazy @Setter @Autowired
    private GuestCheckoutService guestCheckoutService;

    private String resolvedSecretKey() {
        String db = systemConfigService.getActiveStripeSecretKey();
        return !db.isBlank() ? db : (secretKeyEnv != null ? secretKeyEnv : "");
    }
    private String resolvedWebhookSecret() {
        String db = systemConfigService.getActiveStripeWebhookSecret();
        return !db.isBlank() ? db : (webhookSecretEnv != null ? webhookSecretEnv : "");
    }
    private String resolvedPriceId() {
        String db = systemConfigService.getActiveStripePriceId();
        return !db.isBlank() ? db : (priceIdEnv != null ? priceIdEnv : "");
    }

    private void initStripe() {
        String key = resolvedSecretKey();
        if (!key.isBlank()) Stripe.apiKey = key;
    }

    @PostConstruct
    void init() {
        String key = resolvedSecretKey();
        if (!key.isBlank()) {
            Stripe.apiKey = key;
        }
    }

    public String createCheckoutSession(UUID orgId, String orgName, String ownerEmail,
                                        int quantity, String successUrl, String cancelUrl) throws StripeException {
        initStripe();
        if (resolvedSecretKey().isBlank()) {
            throw new AppException("Stripe payments are not configured on this server.", HttpStatus.SERVICE_UNAVAILABLE, "PAYMENT_NOT_CONFIGURED");
        }
        Subscription sub = billingService.getSubscription(orgId);

        String customerId = sub.getStripeCustomerId();
        if (customerId == null || customerId.isBlank()) {
            Customer customer = Customer.create(CustomerCreateParams.builder()
                    .setEmail(ownerEmail)
                    .setName(orgName)
                    .putMetadata("orgId", orgId.toString())
                    .build());
            customerId = customer.getId();
            sub.setStripeCustomerId(customerId);
            subscriptionRepository.save(sub);
        }

        Session session = Session.create(
                com.stripe.param.checkout.SessionCreateParams.builder()
                        .setMode(Mode.SUBSCRIPTION)
                        .setCustomer(customerId)
                        .addLineItem(LineItem.builder()
                                .setPrice(resolvedPriceId())
                                .setQuantity((long) quantity)
                                .build())
                        .setSuccessUrl(successUrl + "?session_id={CHECKOUT_SESSION_ID}")
                        .setCancelUrl(cancelUrl)
                        .putMetadata("orgId", orgId.toString())
                        .putMetadata("quantity", String.valueOf(quantity))
                        .build()
        );

        return session.getUrl();
    }

    public String createCustomerPortalSession(UUID orgId, String returnUrl) throws StripeException {
        initStripe();
        if (resolvedSecretKey().isBlank()) {
            throw new AppException("Stripe payments are not configured on this server.", HttpStatus.SERVICE_UNAVAILABLE, "PAYMENT_NOT_CONFIGURED");
        }
        Subscription sub = billingService.getSubscription(orgId);
        if (sub.getStripeCustomerId() == null) {
            throw new AppException("No active Stripe subscription found. Please subscribe first.", HttpStatus.BAD_REQUEST, "NO_STRIPE_CUSTOMER");
        }

        com.stripe.model.billingportal.Session session = com.stripe.model.billingportal.Session.create(
                SessionCreateParams.builder()
                        .setCustomer(sub.getStripeCustomerId())
                        .setReturnUrl(returnUrl)
                        .build()
        );
        return session.getUrl();
    }

    private String resolvedConnectWebhookSecret() {
        return systemConfigService.getActiveStripeConnectWebhookSecret();
    }

    @Transactional
    public void handleWebhook(String payload, String sigHeader) {
        Event event = null;
        for (String secret : new String[]{ resolvedWebhookSecret(), resolvedConnectWebhookSecret() }) {
            if (secret == null || secret.isBlank()) continue;
            try {
                event = Webhook.constructEvent(payload, sigHeader, secret);
                break;
            } catch (SignatureVerificationException ignored) {}
        }
        if (event == null) {
            log.error("Stripe webhook signature verification failed against all known secrets");
            throw new SecurityException("Invalid Stripe webhook signature");
        }

        log.info("Stripe webhook: {}", event.getType());

        switch (event.getType()) {
            case "checkout.session.completed"   -> handleCheckoutCompleted(event);
            case "customer.subscription.updated" -> handleSubscriptionUpdated(event);
            case "customer.subscription.deleted" -> handleSubscriptionDeleted(event);
            case "invoice.payment_failed"        -> handleInvoicePaymentFailed(event);
            case "invoice.payment_succeeded"     -> handleInvoicePaymentSucceeded(event);
            case "payment_intent.succeeded"      -> handleGuestPaymentIntentSucceeded(event);
            default -> log.debug("Unhandled Stripe event: {}", event.getType());
        }
    }

    private void handleCheckoutCompleted(Event event) {
        Session session = (Session) event.getDataObjectDeserializer().getObject().orElse(null);
        if (session == null) return;

        String orgIdStr = session.getMetadata().get("orgId");
        String quantityStr = session.getMetadata().getOrDefault("quantity", "1");
        if (orgIdStr == null) return;

        UUID orgId = UUID.fromString(orgIdStr);
        int quantity = Integer.parseInt(quantityStr);

        try {
            com.stripe.model.Subscription stripeSub = com.stripe.model.Subscription.retrieve(session.getSubscription());
            billingService.applyStripeSubscription(
                    stripeSub.getId(),
                    session.getCustomer(),
                    resolvedPriceId(),
                    quantity,
                    orgId,
                    Instant.ofEpochSecond(stripeSub.getCurrentPeriodStart()),
                    Instant.ofEpochSecond(stripeSub.getCurrentPeriodEnd())
            );
        } catch (StripeException e) {
            log.error("Failed to retrieve Stripe subscription after checkout: {}", e.getMessage());
        }
    }

    private void handleSubscriptionUpdated(Event event) {
        com.stripe.model.Subscription stripeSub =
                (com.stripe.model.Subscription) event.getDataObjectDeserializer().getObject().orElse(null);
        if (stripeSub == null) return;

        Optional<Subscription> subOpt = subscriptionRepository.findByStripeSubscriptionId(stripeSub.getId());
        if (subOpt.isEmpty()) return;

        Subscription sub = subOpt.get();

        long quantity = stripeSub.getItems().getData().isEmpty() ? 1
                : stripeSub.getItems().getData().get(0).getQuantity();

        sub.setLockQuota((int) quantity);
        sub.setCurrentPeriodStart(Instant.ofEpochSecond(stripeSub.getCurrentPeriodStart()));
        sub.setCurrentPeriodEnd(Instant.ofEpochSecond(stripeSub.getCurrentPeriodEnd()));
        sub.setCancelAtPeriodEnd(stripeSub.getCancelAtPeriodEnd());

        if ("active".equals(stripeSub.getStatus())) {
            sub.setStatus(SubscriptionStatus.ACTIVE);
            sub.setFailedPaymentAt(null);
        } else if ("past_due".equals(stripeSub.getStatus())) {
            sub.setStatus(SubscriptionStatus.PAST_DUE);
        } else if ("canceled".equals(stripeSub.getStatus())) {
            sub.setStatus(SubscriptionStatus.CANCELLED);
            sub.setCancelledAt(Instant.now());
        }

        subscriptionRepository.save(sub);
    }

    private void handleSubscriptionDeleted(Event event) {
        com.stripe.model.Subscription stripeSub =
                (com.stripe.model.Subscription) event.getDataObjectDeserializer().getObject().orElse(null);
        if (stripeSub == null) return;

        subscriptionRepository.findByStripeSubscriptionId(stripeSub.getId()).ifPresent(sub -> {
            sub.setStatus(SubscriptionStatus.CANCELLED);
            sub.setCancelledAt(Instant.now());
            subscriptionRepository.save(sub);
            log.info("Subscription cancelled via Stripe webhook: org={}", sub.getOrganizationId());
        });
    }

    private void handleInvoicePaymentFailed(Event event) {
        Invoice invoice = (Invoice) event.getDataObjectDeserializer().getObject().orElse(null);
        if (invoice == null || invoice.getSubscription() == null) return;
        billingService.markPaymentFailed(invoice.getSubscription());
    }

    private void handleInvoicePaymentSucceeded(Event event) {
        Invoice invoice = (Invoice) event.getDataObjectDeserializer().getObject().orElse(null);
        if (invoice == null || invoice.getSubscription() == null) return;

        subscriptionRepository.findByStripeSubscriptionId(invoice.getSubscription()).ifPresent(sub -> {
            if (sub.getStatus() == SubscriptionStatus.PAST_DUE) {
                sub.setStatus(SubscriptionStatus.ACTIVE);
                sub.setFailedPaymentAt(null);
                subscriptionRepository.save(sub);
            }
        });
    }

    /** Fetches the current subscription state directly from Stripe and syncs it to the DB. */
    @Transactional
    public void syncSubscriptionStatus(UUID orgId) {
        initStripe();
        Subscription sub = billingService.getSubscription(orgId);
        String stripeSubId = sub.getStripeSubscriptionId();
        if (stripeSubId == null || stripeSubId.isBlank()) {
            log.info("No Stripe subscription ID for org {}, nothing to sync", orgId);
            return;
        }
        try {
            com.stripe.model.Subscription stripeSub = com.stripe.model.Subscription.retrieve(stripeSubId);
            long quantity = stripeSub.getItems().getData().isEmpty() ? 1
                    : stripeSub.getItems().getData().get(0).getQuantity();
            sub.setLockQuota((int) quantity);
            if (stripeSub.getCurrentPeriodStart() != null)
                sub.setCurrentPeriodStart(Instant.ofEpochSecond(stripeSub.getCurrentPeriodStart()));
            if (stripeSub.getCurrentPeriodEnd() != null)
                sub.setCurrentPeriodEnd(Instant.ofEpochSecond(stripeSub.getCurrentPeriodEnd()));
            sub.setCancelAtPeriodEnd(Boolean.TRUE.equals(stripeSub.getCancelAtPeriodEnd()));

            String status = stripeSub.getStatus();
            if ("active".equals(status)) {
                sub.setStatus(SubscriptionStatus.ACTIVE);
                sub.setFailedPaymentAt(null);
            } else if ("past_due".equals(status)) {
                sub.setStatus(SubscriptionStatus.PAST_DUE);
            } else if ("canceled".equals(status) || "cancelled".equals(status)) {
                sub.setStatus(SubscriptionStatus.CANCELLED);
                if (sub.getCancelledAt() == null) sub.setCancelledAt(Instant.now());
            } else if ("trialing".equals(status)) {
                sub.setStatus(SubscriptionStatus.TRIALING);
            }
            subscriptionRepository.save(sub);
            log.info("Synced subscription status for org {} → {}", orgId, status);
        } catch (StripeException e) {
            log.warn("Failed to sync subscription for org {}: {}", orgId, e.getMessage());
            throw new AppException("Could not sync with Stripe: " + e.getMessage(),
                    org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE);
        }
    }

    // ── Guest booking payment ─────────────────────────────────────────────────

    /** Creates a Stripe PaymentIntent that transfers funds to the host's connected account. */
    public String createGuestPaymentIntent(UUID bookingId, BigDecimal amount, String currency,
                                           String hostStripeAccountId) throws StripeException {
        initStripe();
        if (resolvedSecretKey().isBlank()) {
            throw new AppException("Stripe is not configured", HttpStatus.SERVICE_UNAVAILABLE);
        }
        long amountCents = amount.multiply(BigDecimal.valueOf(100)).longValue();

        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(amountCents)
                .setCurrency(currency.toLowerCase())
                .addPaymentMethodType("card")
                .putMetadata("bookingId", bookingId.toString())
                .putMetadata("type", "guest_booking")
                .build();

        if (hostStripeAccountId != null && !hostStripeAccountId.isBlank()) {
            RequestOptions options = RequestOptions.builder()
                    .setStripeAccount(hostStripeAccountId)
                    .build();
            return PaymentIntent.create(params, options).getClientSecret();
        }

        return PaymentIntent.create(params).getClientSecret();
    }

    private void handleGuestPaymentIntentSucceeded(Event event) {
        PaymentIntent intent = (PaymentIntent) event.getDataObjectDeserializer().getObject().orElse(null);
        if (intent == null) return;
        if (!"guest_booking".equals(intent.getMetadata().get("type"))) return;

        String bookingIdStr = intent.getMetadata().get("bookingId");
        if (bookingIdStr == null) return;

        try {
            guestCheckoutService.confirmStripeBooking(UUID.fromString(bookingIdStr), intent.getId());
        } catch (Exception e) {
            log.error("Failed to confirm guest booking via webhook: bookingId={} error={}",
                    bookingIdStr, e.getMessage());
        }
    }
}
