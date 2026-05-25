package com.smartlock.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PayPalService {

    @Value("${paypal.client-id:}")
    private String clientId;

    @Value("${paypal.client-secret:}")
    private String clientSecret;

    @Value("${paypal.plan-id:}")
    private String planId;

    @Value("${paypal.base-url:https://api-m.paypal.com}")
    private String baseUrl;

    private final BillingService billingService;
    private final ObjectMapper objectMapper;

    private String getAccessToken() {
        RestTemplate rest = new RestTemplate();
        String credentials = Base64.getEncoder().encodeToString((clientId + ":" + clientSecret).getBytes());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.set("Authorization", "Basic " + credentials);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "client_credentials");

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
        ResponseEntity<JsonNode> response = rest.postForEntity(baseUrl + "/v1/oauth2/token", request, JsonNode.class);

        return response.getBody().get("access_token").asText();
    }

    public String createSubscriptionLink(UUID orgId, int quantity, String returnUrl, String cancelUrl) {
        try {
            String token = getAccessToken();
            RestTemplate rest = new RestTemplate();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(token);

            Map<String, Object> subscriptionBody = new HashMap<>();
            subscriptionBody.put("plan_id", planId);
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
                    baseUrl + "/v1/billing/subscriptions", request, JsonNode.class);

            JsonNode links = response.getBody().get("links");
            for (JsonNode link : links) {
                if ("approve".equals(link.get("rel").asText())) {
                    return link.get("href").asText();
                }
            }
            throw new IllegalStateException("No approval link returned from PayPal");
        } catch (Exception e) {
            log.error("Failed to create PayPal subscription: {}", e.getMessage());
            throw new RuntimeException("Failed to create PayPal subscription: " + e.getMessage(), e);
        }
    }

    @Transactional
    public void handleWebhook(String payload) {
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
        } catch (Exception e) {
            log.error("Error handling PayPal webhook: {}", e.getMessage());
            throw new RuntimeException("Webhook processing failed", e);
        }
    }

    private void handleSubscriptionActivated(JsonNode root) {
        JsonNode resource = root.path("resource");
        String subscriptionId = resource.path("id").asText();
        String customId = resource.path("custom_id").asText();

        if (customId.contains("|")) {
            String[] parts = customId.split("\\|");
            UUID orgId = UUID.fromString(parts[0]);
            int quantity = Integer.parseInt(parts[1]);
            billingService.applyPaypalSubscription(subscriptionId, quantity, orgId);
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
