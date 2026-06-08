package com.smartlock.controller;

import com.smartlock.service.StripeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/webhooks/stripe")
@RequiredArgsConstructor
@Slf4j
public class StripeWebhookController {

    private final StripeService stripeService;

    @PostMapping
    public ResponseEntity<Void> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String signature) {
        log.info("StripeWebhookController.handleWebhook — payloadLength={}", payload.length());
        try {
            stripeService.handleWebhook(payload, signature);
            return ResponseEntity.ok().build();
        } catch (SecurityException e) {
            log.warn("Stripe webhook rejected: {}", e.getMessage());
            return ResponseEntity.status(400).build();
        } catch (Exception e) {
            log.error("Stripe webhook processing error: {}", e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }
}
