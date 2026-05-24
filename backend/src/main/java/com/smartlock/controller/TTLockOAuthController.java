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
     * Step 2: TTLock redirects here after the user authorizes your app.
     * This endpoint is PUBLIC — no JWT required (browser redirect from TTLock).
     * It exchanges the code for tokens, stores them, then redirects to the frontend.
     */
    @RequestMapping(value = "/callback", method = {RequestMethod.GET, RequestMethod.POST})
    @Operation(summary = "TTLock OAuth callback — public endpoint")
    public ResponseEntity<Void> handleCallback(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String state) {

        // TTLock developer console tests this URL with no params — return 200 so validation passes
        if (code == null || state == null) {
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
