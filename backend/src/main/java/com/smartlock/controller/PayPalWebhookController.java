package com.smartlock.controller;

import com.smartlock.service.PayPalService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/webhooks/paypal")
@RequiredArgsConstructor
@Slf4j
public class PayPalWebhookController {

    private final PayPalService payPalService;

    @PostMapping
    public ResponseEntity<Void> handleWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "PAYPAL-TRANSMISSION-ID",   required = false) String transmissionId,
            @RequestHeader(value = "PAYPAL-TRANSMISSION-TIME", required = false) String transmissionTime,
            @RequestHeader(value = "PAYPAL-CERT-URL",          required = false) String certUrl,
            @RequestHeader(value = "PAYPAL-AUTH-ALGO",         required = false) String authAlgo,
            @RequestHeader(value = "PAYPAL-TRANSMISSION-SIG",  required = false) String signature) {
        try {
            payPalService.handleWebhook(payload, transmissionId, transmissionTime, certUrl, authAlgo, signature);
            return ResponseEntity.ok().build();
        } catch (SecurityException e) {
            log.warn("PayPal webhook rejected: {}", e.getMessage());
            return ResponseEntity.status(400).build();
        } catch (Exception e) {
            log.error("PayPal webhook processing error: {}", e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }
}
