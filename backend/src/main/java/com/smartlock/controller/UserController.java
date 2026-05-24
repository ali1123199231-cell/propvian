package com.smartlock.controller;

import com.smartlock.domain.OrganizationMember;
import com.smartlock.domain.User;
import com.smartlock.dto.response.auth.AuthResponse;
import com.smartlock.dto.response.common.ApiResponse;
import com.smartlock.repository.OrganizationMemberRepository;
import com.smartlock.security.CustomUserDetails;
import com.smartlock.service.UserService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Users")
public class UserController {

    private final UserService userService;
    private final OrganizationMemberRepository memberRepository;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthResponse.UserInfo>> getMe(
            @AuthenticationPrincipal CustomUserDetails principal) {
        User user = userService.getById(principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success(toUserInfo(user)));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<AuthResponse.UserInfo>> updateProfile(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody UpdateProfileRequest request) {
        User user = userService.updateProfile(
                principal.getUserId(),
                request.getFirstName(),
                request.getLastName(),
                request.getAvatarUrl());
        return ResponseEntity.ok(ApiResponse.success(toUserInfo(user)));
    }

    @PutMapping("/me/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(principal.getUserId(), request.getCurrentPassword(), request.getNewPassword());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    private AuthResponse.UserInfo toUserInfo(User user) {
        java.util.List<OrganizationMember> memberships = memberRepository.findByUserId(user.getId());
        java.util.UUID orgId = memberships.isEmpty() ? null : memberships.get(0).getOrganizationId();
        return AuthResponse.UserInfo.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole().name())
                .avatarUrl(user.getAvatarUrl())
                .emailVerified(user.isEmailVerified())
                .onboardingStep(user.getOnboardingStep())
                .onboardingCompleted(user.isOnboardingCompleted())
                .organizationId(orgId)
                .build();
    }

    @Data
    public static class UpdateProfileRequest {
        @Size(max = 100)
        private String firstName;
        @Size(max = 100)
        private String lastName;
        @Size(max = 500)
        private String avatarUrl;
    }

    @Data
    public static class ChangePasswordRequest {
        @NotBlank
        private String currentPassword;
        @NotBlank
        @Size(min = 8)
        private String newPassword;
    }
}
