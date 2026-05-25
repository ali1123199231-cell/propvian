package com.smartlock.service;

import com.smartlock.domain.Subscription;
import com.smartlock.domain.enums.SubscriptionStatus;
import com.smartlock.repository.SubscriptionRepository;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.*;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.CustomerCreateParams;
import com.stripe.param.billingportal.SessionCreateParams;
import com.stripe.param.checkout.SessionCreateParams.LineItem;
import com.stripe.param.checkout.SessionCreateParams.Mode;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class StripeService {

    @Value("${stripe.secret-key:}")
    private String secretKey;

    @Value("${stripe.webhook-secret:}")
    private String webhookSecret;

    @Value("${stripe.price-id:}")
    private String priceId;

    private final SubscriptionRepository subscriptionRepository;
    private final BillingService billingService;

    @PostConstruct
    void init() {
        if (secretKey != null && !secretKey.isBlank()) {
            Stripe.apiKey = secretKey;
        }
    }

    public String createCheckoutSession(UUID orgId, String orgName, String ownerEmail,
                                        int quantity, String successUrl, String cancelUrl) throws StripeException {
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
                                .setPrice(priceId)
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
        Subscription sub = billingService.getSubscription(orgId);
        if (sub.getStripeCustomerId() == null) {
            throw new IllegalStateException("No Stripe customer found for this organization.");
        }

        com.stripe.model.billingportal.Session session = com.stripe.model.billingportal.Session.create(
                SessionCreateParams.builder()
                        .setCustomer(sub.getStripeCustomerId())
                        .setReturnUrl(returnUrl)
                        .build()
        );
        return session.getUrl();
    }

    @Transactional
    public void handleWebhook(String payload, String sigHeader) {
        Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
        } catch (SignatureVerificationException e) {
            log.error("Stripe webhook signature verification failed: {}", e.getMessage());
            throw new SecurityException("Invalid Stripe webhook signature");
        }

        log.info("Stripe webhook: {}", event.getType());

        switch (event.getType()) {
            case "checkout.session.completed" -> handleCheckoutCompleted(event);
            case "customer.subscription.updated" -> handleSubscriptionUpdated(event);
            case "customer.subscription.deleted" -> handleSubscriptionDeleted(event);
            case "invoice.payment_failed" -> handleInvoicePaymentFailed(event);
            case "invoice.payment_succeeded" -> handleInvoicePaymentSucceeded(event);
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
                    priceId,
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
}
