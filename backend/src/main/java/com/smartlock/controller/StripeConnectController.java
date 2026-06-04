package com.smartlock.controller;

import com.smartlock.dto.request.verification.ConnectPaymentRequest;
import com.smartlock.dto.response.common.ApiResponse;
import com.smartlock.service.SystemConfigService;
import com.smartlock.service.VerificationService;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.Account;
import com.stripe.model.oauth.TokenResponse;
import com.stripe.net.OAuth;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/stripe")
@RequiredArgsConstructor
@Tag(name = "Stripe Connect")
@Slf4j
public class StripeConnectController {

    private final VerificationService  verificationService;
    private final SystemConfigService  systemConfigService;

    @Value("${stripe.secret-key:}")
    private String secretKeyEnv;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    private void initStripe() {
        String db  = systemConfigService.getActiveStripeSecretKey();
        String key = !db.isBlank() ? db : (secretKeyEnv != null ? secretKeyEnv : "");
        if (!key.isBlank()) Stripe.apiKey = key;
    }

    @GetMapping("/connect-url")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<Map<String, String>>> connectUrl(@RequestParam String orgId) {
        String clientId = systemConfigService.getActiveStripeConnectClientId();

        if (clientId.isBlank()) {
            // No client ID in DB yet — open the dev credential-entry form
            String devUrl = frontendUrl + "/oauth-connect?provider=stripe&orgId=" + orgId;
            log.info("stripe.connect_client_id is empty — using dev connect form");
            return ResponseEntity.ok(ApiResponse.success(Map.of("url", devUrl, "dev", "true")));
        }

        String callbackUrl = frontendUrl.replace("5173", "8080") + "/api/v1/stripe/connect-callback";

        String url = UriComponentsBuilder
                .fromHttpUrl("https://connect.stripe.com/oauth/authorize")
                .queryParam("client_id", clientId)
                .queryParam("response_type", "code")
                .queryParam("scope", "read_write")
                .queryParam("state", orgId)
                .queryParam("redirect_uri", callbackUrl)
                .build().toUriString();

        return ResponseEntity.ok(ApiResponse.success(Map.of("url", url)));
    }

    @GetMapping("/connect-callback")
    public void connectCallback(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String error,
            @RequestParam(required = false, name = "error_description") String errorDescription,
            HttpServletResponse response) throws IOException {

        initStripe();
        String callbackPage = frontendUrl + "/oauth-callback";

        if (error != null) {
            log.warn("Stripe Connect OAuth error: {} — {}", error, errorDescription);
            response.sendRedirect(callbackPage + "?provider=stripe&status=error&message="
                    + encode(errorDescription != null ? errorDescription : error));
            return;
        }

        try {
            TokenResponse token = OAuth.token(
                    Map.of("grant_type", "authorization_code", "code", code), null);

            String accountId     = token.getStripeUserId();
            Account account      = Account.retrieve(accountId, null);
            boolean charges      = Boolean.TRUE.equals(account.getChargesEnabled());
            boolean payouts      = Boolean.TRUE.equals(account.getPayoutsEnabled());

            log.info("Stripe Connect: accountId={} charges={} payouts={} org={}", accountId, charges, payouts, state);

            if (state != null) {
                ConnectPaymentRequest req = new ConnectPaymentRequest();
                req.setStripeAccountId(accountId);
                req.setChargesEnabled(charges);
                req.setPayoutsEnabled(payouts);
                verificationService.connectPayment(UUID.fromString(state), req);
            }

            response.sendRedirect(callbackPage
                    + "?provider=stripe&status=success"
                    + "&accountId=" + encode(accountId)
                    + "&chargesEnabled=" + charges
                    + "&payoutsEnabled=" + payouts);

        } catch (StripeException e) {
            log.error("Stripe Connect token exchange failed: {}", e.getMessage());
            response.sendRedirect(callbackPage + "?provider=stripe&status=error&message=" + encode(e.getMessage()));
        }
    }

    private String encode(String s) {
        return URLEncoder.encode(s != null ? s : "", StandardCharsets.UTF_8);
    }
}
