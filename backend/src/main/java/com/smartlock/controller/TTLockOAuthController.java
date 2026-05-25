package com.smartlock.controller;

import com.smartlock.domain.TtlockOAuthState;
import com.smartlock.dto.response.common.ApiResponse;
import com.smartlock.integration.ttlock.TTLockClient;
import com.smartlock.integration.ttlock.TTLockProperties;
import com.smartlock.integration.ttlock.dto.TTLockLockListResponse;
import com.smartlock.integration.ttlock.dto.TTLockTokenResponse;
import com.smartlock.repository.TtlockOAuthStateRepository;
import com.smartlock.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

record TTLockLoginRequest(String username, String password) {}

@RestController
@RequestMapping("/api/v1/ttlock/oauth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "TTLock OAuth")
public class TTLockOAuthController {

    private final TTLockClient ttlockClient;
    private final TTLockProperties ttlockProperties;
    private final TtlockOAuthStateRepository stateRepository;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    /**
     * Step 1: Generate the TTLock OAuth authorization URL and a state token.
     * The frontend stores the state and redirects the user to the returned URL.
     */
    @GetMapping("/start")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Start TTLock OAuth flow — returns authorization URL")
    public ResponseEntity<ApiResponse<Map<String, String>>> startOAuth(
            @AuthenticationPrincipal CustomUserDetails currentUser) {

        // Clean up expired states for this user
        stateRepository.deleteExpired(Instant.now());

        // Create a new pending state record
        TtlockOAuthState state = TtlockOAuthState.builder()
                .userId(currentUser.getUserId())
                .expiresAt(Instant.now().plusSeconds(900)) // 15 minutes
                .build();
        state = stateRepository.save(state);

        String oauthUrl = ttlockClient.buildOAuthUrl(state.getId().toString());
        log.info("TTLock OAuth started for user {} with state {}", currentUser.getUserId(), state.getId());

        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "oauthUrl", oauthUrl,
                "state", state.getId().toString()
        )));
    }

    /**
     * Alternative Step 1: Authenticate with TTLock username/password directly (password grant).
     * Used instead of the authorization code flow when TTLock's web authorize page is unavailable.
     */
    @PostMapping("/login")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Connect TTLock account via username/password (password grant)")
    public ResponseEntity<ApiResponse<Map<String, String>>> loginWithCredentials(
            @RequestBody TTLockLoginRequest request,
            @AuthenticationPrincipal CustomUserDetails currentUser) {

        stateRepository.deleteExpired(Instant.now());

        TTLockTokenResponse tokenResponse = ttlockClient.loginWithPassword(request.username(), request.password());

        TtlockOAuthState state = TtlockOAuthState.builder()
                .userId(currentUser.getUserId())
                .accessToken(tokenResponse.getAccessToken())
                .refreshToken(tokenResponse.getRefreshToken())
                .ttlockUid(tokenResponse.getUid())
                .expiresIn(tokenResponse.getExpiresIn())
                .expiresAt(Instant.now().plusSeconds(900))
                .build();
        state = stateRepository.save(state);

        log.info("TTLock password login successful for user {} | state={}", currentUser.getUserId(), state.getId());
        return ResponseEntity.ok(ApiResponse.success(Map.of("state", state.getId().toString())));
    }

    /**
     * Step 2: TTLock redirects here after the user authorizes your app.
     * This endpoint is PUBLIC — no JWT required (browser redirect from TTLock).
     * It exchanges the code for tokens, stores them, then redirects to the frontend.
     */
    @RequestMapping(value = "/callback", method = {RequestMethod.GET, RequestMethod.POST})
    @Operation(summary = "TTLock OAuth callback — public endpoint")
    public ResponseEntity<Void> handleCallback(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String error,
            @RequestParam(required = false) String error_description) {

        log.info("TTLock callback received | code={} | state={} | error={} | error_description={}",
                code != null ? code.substring(0, Math.min(8, code.length())) + "..." : "null",
                state, error, error_description);

        // TTLock developer console tests this URL with no params — return 200 so validation passes
        if (code == null && error == null) {
            log.info("TTLock callback: no params — returning 200 for console validation");
            return ResponseEntity.ok().build();
        }

        // TTLock redirected back with an error (e.g. user denied, invalid params)
        if (error != null) {
            log.warn("TTLock OAuth error callback: error={} description={}", error, error_description);
            String errorUrl = frontendUrl + "/onboarding?ttlock_error=" + error;
            return ResponseEntity.status(302).location(URI.create(errorUrl)).build();
        }

        if (state == null) {
            log.warn("TTLock callback: code present but state is null");
            return ResponseEntity.ok().build();
        }

        UUID stateId;
        try {
            stateId = UUID.fromString(state);
        } catch (IllegalArgumentException e) {
            // Non-UUID state means this is a test/invalid request — redirect rather than 4xx
            String errorUrl = frontendUrl + "/locks?ttlock_error=invalid_state";
            return ResponseEntity.status(302).location(URI.create(errorUrl)).build();
        }

        try {
            TtlockOAuthState oauthState = stateRepository.findById(stateId).orElse(null);
            if (oauthState == null || oauthState.isExpired()) {
                log.warn("TTLock OAuth callback: state {} not found or expired", state);
                String errorUrl = frontendUrl + "/locks?ttlock_error=expired";
                return ResponseEntity.status(302).location(URI.create(errorUrl)).build();
            }

            TTLockTokenResponse tokenResponse = ttlockClient.exchangeAuthCode(
                    code, ttlockProperties.getRedirectUri()
            );

            oauthState.setAccessToken(tokenResponse.getAccessToken());
            oauthState.setRefreshToken(tokenResponse.getRefreshToken());
            oauthState.setTtlockUid(tokenResponse.getUid());
            oauthState.setExpiresIn(tokenResponse.getExpiresIn());
            oauthState.setExpiresAt(Instant.now().plusSeconds(900)); // 15 more minutes to pick a lock
            stateRepository.save(oauthState);

            log.info("TTLock OAuth authorized successfully for state {}", stateId);
            String successUrl = frontendUrl + "/locks?ttlock_state=" + state;
            return ResponseEntity.status(302).location(URI.create(successUrl)).build();

        } catch (Exception e) {
            log.error("TTLock OAuth callback failed for state {}: {}", state, e.getMessage());
            String errorUrl = frontendUrl + "/locks?ttlock_error=auth_failed";
            return ResponseEntity.status(302).location(URI.create(errorUrl)).build();
        }
    }

    /**
     * Step 3: After redirect, frontend fetches the user's available locks.
     */
    @GetMapping("/locks")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "List TTLock locks available for the authorized account")
    public ResponseEntity<ApiResponse<List<TTLockLockListResponse.LockItem>>> getAvailableLocks(
            @RequestParam String state,
            @AuthenticationPrincipal CustomUserDetails currentUser) {

        UUID stateId = UUID.fromString(state);
        TtlockOAuthState oauthState = stateRepository.findById(stateId)
                .orElseThrow(() -> new IllegalArgumentException("OAuth state not found or expired"));

        if (oauthState.isExpired() || !oauthState.isAuthorized()) {
            throw new IllegalStateException("OAuth session expired. Please re-authorize with TTLock.");
        }

        if (!oauthState.getUserId().equals(currentUser.getUserId())) {
            throw new SecurityException("OAuth state does not belong to the current user");
        }

        List<TTLockLockListResponse.LockItem> locks = ttlockClient.getUserLocks(oauthState.getAccessToken());
        return ResponseEntity.ok(ApiResponse.success(locks));
    }
}
