package com.smartlock.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartlock.dto.request.verification.ConnectPaymentRequest;
import com.smartlock.dto.response.common.ApiResponse;
import com.smartlock.service.SystemConfigService;
import com.smartlock.service.VerificationService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/paypal")
@RequiredArgsConstructor
@Tag(name = "PayPal Connect")
@Slf4j
public class PayPalConnectController {

    private final VerificationService verificationService;
    private final SystemConfigService systemConfigService;
    private final RestTemplate        restTemplate;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    private String apiBase() {
        return systemConfigService.getActivePaypalBaseUrl();
    }

    private String authBase() {
        return systemConfigService.isPaypalSandbox()
                ? systemConfigService.get("paypal.sandbox.auth_base_url", "https://www.sandbox.paypal.com")
                : systemConfigService.get("paypal.auth_base_url", "https://www.paypal.com");
    }

    @GetMapping("/connect-url")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<Map<String, String>>> connectUrl(@RequestParam String orgId) {
        log.debug("PayPalConnectController.connectUrl — orgId={}", orgId);
        String clientId = systemConfigService.getActivePaypalClientId();

        if (clientId.isBlank()) {
            String devUrl = frontendUrl + "/oauth-connect?provider=paypal&orgId=" + orgId;
            log.info("paypal.client_id is empty — using dev connect form");
            return ResponseEntity.ok(ApiResponse.success(Map.of("url", devUrl, "dev", "true")));
        }

        String callbackUrl = frontendUrl.replace("5173", "8080") + "/api/v1/paypal/connect-callback";

        String url = UriComponentsBuilder.fromHttpUrl(authBase() + "/connect")
                .queryParam("flowEntry", "static")
                .queryParam("client_id", clientId)
                .queryParam("scope", "openid email profile https://uri.paypal.com/services/paypalattributes")
                .queryParam("redirect_uri", callbackUrl)
                .queryParam("response_type", "code")
                .queryParam("state", orgId)
                .build().encode().toUriString();

        return ResponseEntity.ok(ApiResponse.success(Map.of("url", url)));
    }

    @GetMapping("/connect-callback")
    public void connectCallback(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String error,
            HttpServletResponse response) throws IOException {
        log.info("PayPalConnectController.connectCallback — state={}", state);
        String callbackPage = frontendUrl + "/oauth-callback";

        if (error != null || code == null) {
            response.sendRedirect(callbackPage + "?provider=paypal&status=error&message="
                    + encode(error != null ? error : "Authorization denied"));
            return;
        }

        try {
            String callbackUrl = frontendUrl.replace("5173", "8080") + "/api/v1/paypal/connect-callback";
            String email       = exchangeCodeForEmail(code, callbackUrl);

            if (state != null) {
                ConnectPaymentRequest req = new ConnectPaymentRequest();
                req.setPaypalAccountId(email);
                verificationService.connectPayment(UUID.fromString(state), req);
            }

            response.sendRedirect(callbackPage + "?provider=paypal&status=success&email=" + encode(email));

        } catch (Exception e) {
            log.error("PayPal Connect callback failed: {}", e.getMessage());
            response.sendRedirect(callbackPage + "?provider=paypal&status=error&message=" + encode(e.getMessage()));
        }
    }

    private String exchangeCodeForEmail(String code, String redirectUri) throws Exception {
        String clientId     = systemConfigService.getActivePaypalClientId();
        String clientSecret = systemConfigService.getActivePaypalClientSecret();

        String credentials = Base64.getEncoder().encodeToString(
                (clientId + ":" + clientSecret).getBytes(StandardCharsets.UTF_8));

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Basic " + credentials);
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "authorization_code");
        body.add("code", code);
        body.add("redirect_uri", redirectUri);

        ResponseEntity<String> tokenRes = restTemplate.exchange(
                apiBase() + "/v1/oauth2/token", HttpMethod.POST,
                new HttpEntity<>(body, headers), String.class);

        String accessToken = new ObjectMapper().readTree(tokenRes.getBody())
                .get("access_token").asText();

        HttpHeaders userHeaders = new HttpHeaders();
        userHeaders.set("Authorization", "Bearer " + accessToken);

        ResponseEntity<String> userRes = restTemplate.exchange(
                apiBase() + "/v1/identity/openidconnect/userinfo?schema=openid",
                HttpMethod.GET, new HttpEntity<>(userHeaders), String.class);

        return new ObjectMapper().readTree(userRes.getBody())
                .path("email").asText("paypal-user@unknown.com");
    }

    private String encode(String s) {
        return URLEncoder.encode(s != null ? s : "", StandardCharsets.UTF_8);
    }
}
