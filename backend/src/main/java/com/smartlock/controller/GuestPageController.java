package com.smartlock.controller;

import com.smartlock.dto.request.guestpage.ClaimTapCodeRequest;
import com.smartlock.dto.request.guestpage.UpdateGuestPageRequest;
import com.smartlock.dto.response.common.ApiResponse;
import com.smartlock.dto.response.guestpage.GuestPageResponse;
import com.smartlock.dto.response.guestpage.GuestPageStatsResponse;
import com.smartlock.dto.response.guestpage.GuestPageSummaryResponse;
import com.smartlock.security.CustomUserDetails;
import com.smartlock.service.GuestPageService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/** Host-side guest pages. Every service method checks org access and property ownership. */
@RestController
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Guest Pages")
@SecurityRequirement(name = "bearerAuth")
public class GuestPageController {

    private final GuestPageService guestPageService;

    @GetMapping("/api/v1/organizations/{orgId}/guest-pages")
    public ResponseEntity<ApiResponse<List<GuestPageSummaryResponse>>> list(@PathVariable UUID orgId) {
        log.debug("GuestPageController.list — orgId={}", orgId);
        return ResponseEntity.ok(ApiResponse.success(guestPageService.list(orgId)));
    }

    @GetMapping("/api/v1/organizations/{orgId}/properties/{propertyId}/guest-page")
    public ResponseEntity<ApiResponse<GuestPageResponse>> get(@PathVariable UUID orgId, @PathVariable UUID propertyId) {
        log.debug("GuestPageController.get — propertyId={}", propertyId);
        return ResponseEntity.ok(ApiResponse.success(guestPageService.getOrCreate(orgId, propertyId)));
    }

    @PutMapping("/api/v1/organizations/{orgId}/properties/{propertyId}/guest-page")
    public ResponseEntity<ApiResponse<GuestPageResponse>> update(
            @PathVariable UUID orgId,
            @PathVariable UUID propertyId,
            @Valid @RequestBody UpdateGuestPageRequest request) {
        log.info("GuestPageController.update — propertyId={}", propertyId);
        return ResponseEntity.ok(ApiResponse.success("Guest page saved", guestPageService.update(orgId, propertyId, request)));
    }

    @GetMapping("/api/v1/organizations/{orgId}/properties/{propertyId}/guest-page/stats")
    public ResponseEntity<ApiResponse<GuestPageStatsResponse>> stats(
            @PathVariable UUID orgId,
            @PathVariable UUID propertyId,
            @RequestParam(defaultValue = "30") int days) {
        log.debug("GuestPageController.stats — propertyId={} days={}", propertyId, days);
        return ResponseEntity.ok(ApiResponse.success(guestPageService.stats(orgId, propertyId, days)));
    }

    @PostMapping("/api/v1/organizations/{orgId}/tap-codes/{code}/claim")
    public ResponseEntity<ApiResponse<GuestPageResponse>> claim(
            @PathVariable UUID orgId,
            @PathVariable String code,
            @Valid @RequestBody ClaimTapCodeRequest request,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        log.info("GuestPageController.claim — orgId={} propertyId={}", orgId, request.getPropertyId());
        return ResponseEntity.ok(ApiResponse.success("Stand linked",
                guestPageService.claim(orgId, code, request.getPropertyId(), currentUser.getUserId())));
    }
}
