package com.smartlock.controller;

import com.smartlock.domain.TtlockOAuthState;
import com.smartlock.dto.request.auth.SelectLockRequest;
import com.smartlock.dto.response.auth.OnboardingStateResponse;
import com.smartlock.dto.response.common.ApiResponse;
import com.smartlock.repository.TtlockOAuthStateRepository;
import com.smartlock.repository.UserRepository;
import com.smartlock.security.CustomUserDetails;
import com.smartlock.service.OnboardingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/onboarding")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Onboarding")
public class OnboardingController {

    private final OnboardingService onboardingService;
    private final UserRepository userRepository;
    private final TtlockOAuthStateRepository oauthStateRepository;

    @GetMapping("/state")
    @Operation(summary = "Get current onboarding state")
    public ResponseEntity<ApiResponse<OnboardingStateResponse>> getState(
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        return ResponseEntity.ok(ApiResponse.success(onboardingService.getState(currentUser.getUserId())));
    }

    @PostMapping("/select-lock")
    @Operation(summary = "Save lock selection and advance to property setup")
    public ResponseEntity<ApiResponse<OnboardingStateResponse>> selectLock(
            @Valid @RequestBody SelectLockRequest request,
            @AuthenticationPrincipal CustomUserDetails currentUser) {

        UUID userId = currentUser.getUserId();
        UUID stateId = UUID.fromString(request.getOauthState());

        TtlockOAuthState oauthState = oauthStateRepository.findById(stateId)
                .orElseThrow(() -> new IllegalArgumentException("OAuth session not found or expired"));

        if (!oauthState.getUserId().equals(userId)) {
            throw new SecurityException("OAuth state does not belong to this user");
        }
        if (oauthState.isExpired() || !oauthState.isAuthorized()) {
            throw new IllegalStateException("OAuth session expired — please re-connect TTLock");
        }

        // Extend OAuth state so user has time to complete property setup
        oauthState.setExpiresAt(Instant.now().plusSeconds(7200));
        oauthStateRepository.save(oauthState);

        userRepository.findById(userId).ifPresent(user -> {
            user.setPendingTtlockStateId(stateId);
            user.setPendingTtlockLockId(request.getTtlockLockId());
            user.setPendingTtlockLockName(request.getLockName());
            if ("TTLOCK_CONNECT".equals(user.getOnboardingStep())) {
                user.setOnboardingStep("PROPERTY_SETUP");
            }
            userRepository.save(user);
        });

        return ResponseEntity.ok(ApiResponse.success(onboardingService.getState(userId)));
    }

    @PostMapping("/complete")
    @Operation(summary = "Mark onboarding as complete (after calendar setup or skip)")
    public ResponseEntity<ApiResponse<Void>> complete(
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        onboardingService.complete(currentUser.getUserId());
        return ResponseEntity.ok(ApiResponse.success("Onboarding completed"));
    }
}
