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
    public ResponseEntity<Void> handleWebhook(@RequestBody String payload) {
        try {
            payPalService.handleWebhook(payload);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("PayPal webhook processing error: {}", e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }
}
