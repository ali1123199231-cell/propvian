package com.smartlock.controller;

import com.smartlock.dto.request.verification.*;
import com.smartlock.dto.response.common.ApiResponse;
import com.smartlock.dto.response.common.PageResponse;
import com.smartlock.dto.response.verification.VerificationStatusResponse;
import com.smartlock.security.CustomUserDetails;
import com.smartlock.service.VerificationService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Verification")
@SecurityRequirement(name = "bearerAuth")
public class VerificationController {

    private final VerificationService verificationService;

    // ── Host endpoints ────────────────────────────────────────────────────────

    @GetMapping("/organizations/{orgId}/verification")
    public ResponseEntity<ApiResponse<VerificationStatusResponse>> getStatus(@PathVariable UUID orgId) {
        return ResponseEntity.ok(ApiResponse.success(verificationService.getStatus(orgId)));
    }

    @PostMapping("/organizations/{orgId}/verification/identity")
    public ResponseEntity<ApiResponse<VerificationStatusResponse>> submitIdentity(
            @PathVariable UUID orgId, @Valid @RequestBody SubmitIdentityRequest req) {
        return ResponseEntity.ok(ApiResponse.success(verificationService.submitIdentity(orgId, req)));
    }

    @PostMapping("/organizations/{orgId}/verification/property")
    public ResponseEntity<ApiResponse<VerificationStatusResponse>> submitPropertyVerification(
            @PathVariable UUID orgId, @Valid @RequestBody SubmitPropertyVerificationRequest req) {
        return ResponseEntity.ok(ApiResponse.success(verificationService.submitPropertyVerification(orgId, req)));
    }

    @PostMapping("/organizations/{orgId}/verification/ota")
    public ResponseEntity<ApiResponse<VerificationStatusResponse>> submitOta(
            @PathVariable UUID orgId, @Valid @RequestBody SubmitOtaRequest req) {
        return ResponseEntity.ok(ApiResponse.success(verificationService.submitOta(orgId, req)));
    }

    @PostMapping("/organizations/{orgId}/verification/calendar")
    public ResponseEntity<ApiResponse<VerificationStatusResponse>> connectCalendar(
            @PathVariable UUID orgId, @Valid @RequestBody ConnectCalendarRequest req) {
        return ResponseEntity.ok(ApiResponse.success(verificationService.connectCalendar(orgId, req)));
    }

    @PostMapping("/organizations/{orgId}/verification/payment")
    public ResponseEntity<ApiResponse<VerificationStatusResponse>> connectPayment(
            @PathVariable UUID orgId, @Valid @RequestBody ConnectPaymentRequest req) {
        return ResponseEntity.ok(ApiResponse.success(verificationService.connectPayment(orgId, req)));
    }

    @PostMapping("/organizations/{orgId}/verification/domain")
    public ResponseEntity<ApiResponse<VerificationStatusResponse>> connectDomain(
            @PathVariable UUID orgId, @Valid @RequestBody ConnectDomainRequest req) {
        return ResponseEntity.ok(ApiResponse.success(verificationService.connectDomain(orgId, req)));
    }

    @PostMapping("/organizations/{orgId}/verification/domain/check-dns")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkDomainDns(@PathVariable UUID orgId) {
        return ResponseEntity.ok(ApiResponse.success(verificationService.checkDomainDns(orgId)));
    }

    @PostMapping("/verification/test-ical")
    public ResponseEntity<ApiResponse<Map<String, Object>>> testIcal(@RequestBody Map<String, String> body) {
        String url = body.get("url");
        VerificationService.ICalTestResult result = verificationService.testIcalUrl(url);
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "success", result.success(),
                "message", result.message()
        )));
    }

    // ── Admin endpoints ───────────────────────────────────────────────────────

    @GetMapping("/admin/verification/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<VerificationStatusResponse>>> listPending(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(verificationService.listPending(pageable))));
    }

    @GetMapping("/admin/verification/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<VerificationStatusResponse>>> listAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(verificationService.listAll(pageable))));
    }

    @PostMapping("/admin/verification/{orgId}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<VerificationStatusResponse>> adminApprove(
            @PathVariable UUID orgId,
            @Valid @RequestBody AdminApprovalRequest req,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        return ResponseEntity.ok(ApiResponse.success(
                verificationService.adminApprove(orgId, currentUser.getUserId(), req)));
    }

    @PostMapping("/admin/verification/{orgId}/step/{step}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<VerificationStatusResponse>> adminApproveStep(
            @PathVariable UUID orgId,
            @PathVariable String step,
            @RequestParam boolean approved,
            @RequestParam(required = false) String reason,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        return ResponseEntity.ok(ApiResponse.success(
                verificationService.adminApproveStep(orgId, currentUser.getUserId(), step, approved, reason)));
    }
}
