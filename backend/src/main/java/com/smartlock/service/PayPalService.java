package com.smartlock.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartlock.exception.AppException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PayPalService {

    // Env-var fallbacks — used only when DB config keys are empty (prod backward compat)
    @Value("${paypal.client-id:}")
    private String clientIdEnv;

    @Value("${paypal.client-secret:}")
    private String clientSecretEnv;

    @Value("${paypal.plan-id:}")
    private String planIdEnv;

    @Value("${paypal.base-url:https://api-m.paypal.com}")
    private String baseUrlEnv;

    @Value("${paypal.webhook-id:}")
    private String webhookIdEnv;

    private final BillingService billingService;
    private final SystemConfigService systemConfigService;
    private final ObjectMapper objectMapper;

    // ── Sandbox-aware credential helpers ─────────────────────────────────────

    private String activeClientId() {
        if (systemConfigService.isPaypalSandbox())
            return systemConfigService.get("paypal.sandbox.client_id", "");
        String db = systemConfigService.get("paypal.client_id", "");
        return db.isBlank() ? clientIdEnv : db;
    }

    private String activeClientSecret() {
        if (systemConfigService.isPaypalSandbox())
            return systemConfigService.get("paypal.sandbox.client_secret", "");
        String db = systemConfigService.get("paypal.client_secret", "");
        return db.isBlank() ? clientSecretEnv : db;
    }

    private String activePlanId() {
        if (systemConfigService.isPaypalSandbox())
            return systemConfigService.get("paypal.sandbox.plan_id", "");
        String db = systemConfigService.get("paypal.plan_id", "");
        return db.isBlank() ? planIdEnv : db;
    }

    private String activeBaseUrl() {
        return systemConfigService.getActivePaypalBaseUrl().isBlank()
                ? baseUrlEnv
                : systemConfigService.getActivePaypalBaseUrl();
    }

    // ── Internal API helpers ──────────────────────────────────────────────────

    private String getAccessToken() {
        RestTemplate rest = new RestTemplate();
        String credentials = Base64.getEncoder().encodeToString((activeClientId() + ":" + activeClientSecret()).getBytes());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.set("Authorization", "Basic " + credentials);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "client_credentials");

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
        ResponseEntity<JsonNode> response = rest.postForEntity(activeBaseUrl() + "/v1/oauth2/token", request, JsonNode.class);

        return response.getBody().get("access_token").asText();
    }

    public String createSubscriptionLink(UUID orgId, int quantity, String returnUrl, String cancelUrl) {
        String cid = activeClientId();
        String csec = activeClientSecret();
        if (cid.isBlank() || csec.isBlank()) {
            throw new AppException("PayPal payments are not configured on this server.", HttpStatus.SERVICE_UNAVAILABLE, "PAYMENT_NOT_CONFIGURED");
        }
        try {
            String token = getAccessToken();
            RestTemplate rest = new RestTemplate();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(token);

            Map<String, Object> subscriptionBody = new HashMap<>();
            subscriptionBody.put("plan_id", activePlanId());
            subscriptionBody.put("quantity", String.valueOf(quantity));

            Map<String, Object> appContext = new HashMap<>();
            appContext.put("return_url", returnUrl);
            appContext.put("cancel_url", cancelUrl);
            appContext.put("brand_name", "Propvian");
            appContext.put("user_action", "SUBSCRIBE_NOW");
            Map<String, String> metadata = new HashMap<>();
            metadata.put("org_id", orgId.toString());
            metadata.put("quantity", String.valueOf(quantity));
            appContext.put("payment_method", Map.of("payer_selected", "PAYPAL", "payee_preferred", "IMMEDIATE_PAYMENT_REQUIRED"));
            subscriptionBody.put("application_context", appContext);
            subscriptionBody.put("custom_id", orgId.toString() + "|" + quantity);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(subscriptionBody, headers);
            ResponseEntity<JsonNode> response = rest.postForEntity(
                    activeBaseUrl() + "/v1/billing/subscriptions", request, JsonNode.class);

            JsonNode links = response.getBody().get("links");
            for (JsonNode link : links) {
                if ("approve".equals(link.get("rel").asText())) {
                    return link.get("href").asText();
                }
            }
            throw new IllegalStateException("No approval link returned from PayPal");
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            log.error("Failed to create PayPal subscription: {}", e.getMessage());
            String body = e.getResponseBodyAsString();
            if (e.getStatusCode().value() == 404 || body.contains("INVALID_RESOURCE_ID") || body.contains("RESOURCE_NOT_FOUND")) {
                throw new AppException("PayPal billing plan is not configured correctly. Please contact support.", HttpStatus.SERVICE_UNAVAILABLE, "PAYMENT_NOT_CONFIGURED");
            }
            if (e.getStatusCode().value() == 401 || body.contains("INVALID_CLIENT")) {
                throw new AppException("PayPal authentication failed. Please contact support.", HttpStatus.SERVICE_UNAVAILABLE, "PAYMENT_NOT_CONFIGURED");
            }
            throw new AppException("PayPal payment could not be started: " + e.getMessage(), HttpStatus.BAD_GATEWAY, "PAYMENT_ERROR");
        } catch (Exception e) {
            log.error("Failed to create PayPal subscription: {}", e.getMessage());
            throw new AppException("PayPal payment could not be started. Please try again later.", HttpStatus.BAD_GATEWAY, "PAYMENT_ERROR");
        }
    }

    @Transactional
    public void handleWebhook(String payload,
                              String transmissionId, String transmissionTime,
                              String certUrl, String authAlgo, String signature) {
        verifyWebhookSignature(payload, transmissionId, transmissionTime, certUrl, authAlgo, signature);
        try {
            JsonNode root = objectMapper.readTree(payload);
            String eventType = root.path("event_type").asText();
            log.info("PayPal webhook: {}", eventType);

            switch (eventType) {
                case "BILLING.SUBSCRIPTION.ACTIVATED" -> handleSubscriptionActivated(root);
                case "BILLING.SUBSCRIPTION.CANCELLED" -> handleSubscriptionCancelled(root);
                case "BILLING.SUBSCRIPTION.SUSPENDED" -> handleSubscriptionSuspended(root);
                case "PAYMENT.SALE.COMPLETED" -> log.info("PayPal payment completed");
                case "PAYMENT.SALE.DENIED" -> handlePaymentDenied(root);
                default -> log.debug("Unhandled PayPal event: {}", eventType);
            }
        } catch (SecurityException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error handling PayPal webhook: {}", e.getMessage());
            throw new RuntimeException("Webhook processing failed", e);
        }
    }

    /**
     * Verifies the PayPal webhook signature by calling the PayPal verify-webhook-signature API.
     * Rejects the event if any signature header is missing or verification fails.
     */
    private void verifyWebhookSignature(String payload,
                                        String transmissionId, String transmissionTime,
                                        String certUrl, String authAlgo, String signature) {
        if (transmissionId == null || transmissionTime == null || certUrl == null
                || authAlgo == null || signature == null) {
            log.warn("PayPal webhook missing signature headers — rejecting");
            throw new SecurityException("Missing PayPal signature headers");
        }
        if (activeClientId().isBlank() || activeClientSecret().isBlank()) {
            log.warn("PayPal credentials not configured — cannot verify webhook signature");
            throw new SecurityException("PayPal not configured for webhook verification");
        }
        try {
            String token = getAccessToken();
            RestTemplate rest = new RestTemplate();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(token);

            Map<String, Object> verifyBody = new HashMap<>();
            verifyBody.put("transmission_id",   transmissionId);
            verifyBody.put("transmission_time", transmissionTime);
            verifyBody.put("cert_url",          certUrl);
            verifyBody.put("auth_algo",         authAlgo);
            verifyBody.put("transmission_sig",  signature);
            verifyBody.put("webhook_id",        resolvedWebhookId());
            verifyBody.put("webhook_event",     objectMapper.readTree(payload));

            ResponseEntity<JsonNode> response = rest.postForEntity(
                    activeBaseUrl() + "/v1/notifications/verify-webhook-signature",
                    new HttpEntity<>(verifyBody, headers),
                    JsonNode.class);

            String verificationStatus = response.getBody() != null
                    ? response.getBody().path("verification_status").asText()
                    : "FAILURE";

            if (!"SUCCESS".equalsIgnoreCase(verificationStatus)) {
                log.warn("PayPal webhook signature verification failed: status={}", verificationStatus);
                throw new SecurityException("PayPal webhook signature verification failed");
            }
        } catch (SecurityException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to verify PayPal webhook signature: {}", e.getMessage());
            throw new SecurityException("PayPal webhook signature verification error: " + e.getMessage());
        }
    }

    // ── Guest booking payments ────────────────────────────────────────────────

    /** Creates a PayPal order that pays the host's PayPal account directly. */
    public String createGuestOrder(UUID bookingId, BigDecimal amount, String currency, String hostPaypalEmail) {
        try {
            String token = getAccessToken();
            RestTemplate rest = new RestTemplate();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(token);

            Map<String, Object> unitAmount = new HashMap<>();
            unitAmount.put("currency_code", currency.toUpperCase());
            unitAmount.put("value", amount.setScale(2, RoundingMode.HALF_UP).toPlainString());

            Map<String, Object> purchaseUnit = new HashMap<>();
            purchaseUnit.put("amount", unitAmount);
            purchaseUnit.put("custom_id", bookingId.toString());
            if (hostPaypalEmail != null && !hostPaypalEmail.isBlank()) {
                purchaseUnit.put("payee", Map.of("email_address", hostPaypalEmail));
            }

            Map<String, Object> body = new HashMap<>();
            body.put("intent", "CAPTURE");
            body.put("purchase_units", List.of(purchaseUnit));

            ResponseEntity<JsonNode> response = rest.postForEntity(
                    activeBaseUrl() + "/v2/checkout/orders",
                    new HttpEntity<>(body, headers),
                    JsonNode.class);

            return response.getBody().get("id").asText();
        } catch (Exception e) {
            log.error("Failed to create PayPal order: {}", e.getMessage());
            throw new AppException("Payment initialization failed", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /** Captures an approved PayPal order. Throws if capture status is not COMPLETED. */
    public void captureGuestOrder(String orderId) {
        try {
            String token = getAccessToken();
            RestTemplate rest = new RestTemplate();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(token);

            ResponseEntity<JsonNode> response = rest.postForEntity(
                    activeBaseUrl() + "/v2/checkout/orders/" + orderId + "/capture",
                    new HttpEntity<>(new HashMap<>(), headers),
                    JsonNode.class);

            String status = response.getBody() != null
                    ? response.getBody().path("status").asText() : "";
            if (!"COMPLETED".equals(status)) {
                throw new AppException("PayPal capture status: " + status, HttpStatus.PAYMENT_REQUIRED);
            }
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to capture PayPal order {}: {}", orderId, e.getMessage());
            throw new AppException("PayPal capture failed", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private String resolvedWebhookId() {
        String db = systemConfigService.getActivePaypalWebhookId();
        return !db.isBlank() ? db : webhookIdEnv;
    }

    private void handleSubscriptionActivated(JsonNode root) {
        JsonNode resource = root.path("resource");
        String subscriptionId = resource.path("id").asText();
        String customId = resource.path("custom_id").asText();

        if (customId.contains("|")) {
            String[] parts = customId.split("\\|");
            UUID orgId = UUID.fromString(parts[0]);
            int quantity = Integer.parseInt(parts[1]);

            // Extract real billing period from PayPal subscription data
            Instant periodStart = null;
            Instant periodEnd   = null;
            try {
                String startStr = resource.path("billing_info").path("last_payment").path("time").asText(null);
                String nextStr  = resource.path("billing_info").path("next_billing_time").asText(null);
                if (startStr != null && !startStr.isBlank()) periodStart = Instant.parse(startStr);
                if (nextStr  != null && !nextStr.isBlank())  periodEnd   = Instant.parse(nextStr);
            } catch (Exception e) {
                log.warn("Could not parse PayPal billing period: {}", e.getMessage());
            }

            billingService.applyPaypalSubscription(subscriptionId, quantity, orgId, periodStart, periodEnd);
            log.info("PayPal subscription activated: org={} quantity={}", orgId, quantity);
        }
    }

    private void handleSubscriptionCancelled(JsonNode root) {
        JsonNode resource = root.path("resource");
        String subscriptionId = resource.path("id").asText();
        billingService.cancelPaypalSubscription(subscriptionId);
    }

    private void handleSubscriptionSuspended(JsonNode root) {
        JsonNode resource = root.path("resource");
        String subscriptionId = resource.path("id").asText();
        billingService.suspendPaypalSubscription(subscriptionId);
    }

    private void handlePaymentDenied(JsonNode root) {
        JsonNode resource = root.path("resource");
        String subscriptionId = resource.path("billing_agreement_id").asText();
        if (!subscriptionId.isBlank()) {
            billingService.markPaypalPaymentFailed(subscriptionId);
        }
    }
}
