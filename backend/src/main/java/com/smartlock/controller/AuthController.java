package com.smartlock.controller;

import com.smartlock.dto.request.auth.*;
import com.smartlock.dto.response.auth.AuthResponse;
import com.smartlock.dto.response.common.ApiResponse;
import com.smartlock.security.CustomUserDetails;
import com.smartlock.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register a new account")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(authService.register(request)));
    }

    @PostMapping("/login")
    @Operation(summary = "Sign in")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(ApiResponse.success(authService.login(request)));
    }

    @PostMapping("/verify-email")
    @Operation(summary = "Verify email with 6-digit code")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyEmail(
            @Valid @RequestBody VerifyEmailRequest request,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        return ResponseEntity.ok(ApiResponse.success(authService.verifyEmail(request, currentUser.getUserId())));
    }

    @PostMapping("/resend-verification")
    @Operation(summary = "Resend email verification code")
    public ResponseEntity<ApiResponse<Void>> resendVerification(
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        authService.resendVerification(currentUser.getUserId());
        return ResponseEntity.ok(ApiResponse.success("Verification code sent"));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(ApiResponse.success(authService.refreshToken(request)));
    }

    @PostMapping("/logout")
    @Operation(summary = "Sign out")
    public ResponseEntity<ApiResponse<Void>> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails != null) {
            String token = null;
            if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
            }
            authService.logout(token, userDetails.getUserId());
        }
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully"));
    }
}
