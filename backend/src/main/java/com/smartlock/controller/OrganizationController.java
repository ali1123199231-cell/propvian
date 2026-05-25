package com.smartlock.controller;

import com.smartlock.dto.request.organization.CreateOrganizationRequest;
import com.smartlock.dto.request.organization.InviteMemberRequest;
import com.smartlock.dto.response.automation.AutomationStatusResponse;
import com.smartlock.dto.response.common.ApiResponse;
import com.smartlock.dto.response.organization.OrganizationMemberResponse;
import com.smartlock.dto.response.organization.OrganizationResponse;
import com.smartlock.security.CustomUserDetails;
import com.smartlock.service.AutomationService;
import com.smartlock.service.OrganizationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/organizations")
@RequiredArgsConstructor
@Tag(name = "Organizations")
@SecurityRequirement(name = "bearerAuth")
public class OrganizationController {

    private final OrganizationService organizationService;
    private final AutomationService automationService;

    @PostMapping
    @Operation(summary = "Create organization")
    public ResponseEntity<ApiResponse<OrganizationResponse>> create(
            @Valid @RequestBody CreateOrganizationRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(organizationService.createOrganization(request, userDetails.getUserId())));
    }

    @GetMapping("/{orgId}")
    public ResponseEntity<ApiResponse<OrganizationResponse>> get(@PathVariable UUID orgId) {
        return ResponseEntity.ok(ApiResponse.success(organizationService.getOrganization(orgId)));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<OrganizationResponse>>> getMyOrganizations(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(organizationService.getUserOrganizations(userDetails.getUserId())));
    }

    @GetMapping("/{orgId}/members")
    public ResponseEntity<ApiResponse<List<OrganizationMemberResponse>>> getMembers(@PathVariable UUID orgId) {
        return ResponseEntity.ok(ApiResponse.success(organizationService.getMembers(orgId)));
    }

    @PostMapping("/{orgId}/members/invite")
    public ResponseEntity<ApiResponse<OrganizationMemberResponse>> inviteMember(
            @PathVariable UUID orgId,
            @Valid @RequestBody InviteMemberRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(organizationService.inviteMember(orgId, request, userDetails.getUserId())));
    }

    @DeleteMapping("/{orgId}/members/{userId}")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @PathVariable UUID orgId,
            @PathVariable UUID userId) {
        organizationService.removeMember(orgId, userId);
        return ResponseEntity.ok(ApiResponse.success("Member removed"));
    }

    @GetMapping("/{orgId}/automation")
    @Operation(summary = "Get automation status")
    public ResponseEntity<ApiResponse<AutomationStatusResponse>> getAutomationStatus(@PathVariable UUID orgId) {
        return ResponseEntity.ok(ApiResponse.success(automationService.getStatus(orgId)));
    }

    @PutMapping("/{orgId}/automation/enable")
    @Operation(summary = "Enable automation")
    public ResponseEntity<ApiResponse<AutomationStatusResponse>> enableAutomation(@PathVariable UUID orgId) {
        return ResponseEntity.ok(ApiResponse.success(automationService.enableAutomation(orgId)));
    }

    @PutMapping("/{orgId}/automation/disable")
    @Operation(summary = "Disable automation")
    public ResponseEntity<ApiResponse<AutomationStatusResponse>> disableAutomation(@PathVariable UUID orgId) {
        return ResponseEntity.ok(ApiResponse.success(automationService.disableAutomation(orgId)));
    }
}
