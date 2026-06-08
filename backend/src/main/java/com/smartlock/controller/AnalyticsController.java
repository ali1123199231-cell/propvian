package com.smartlock.controller;

import com.smartlock.dto.response.analytics.DashboardStatsResponse;
import com.smartlock.dto.response.common.ApiResponse;
import com.smartlock.security.CustomUserDetails;
import com.smartlock.service.AnalyticsService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/organizations/{orgId}/analytics")
@RequiredArgsConstructor
@Tag(name = "Analytics")
@SecurityRequirement(name = "bearerAuth")
@Slf4j
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getDashboardStats(
            @PathVariable UUID orgId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        log.debug("AnalyticsController.getDashboardStats — orgId={}", orgId);
        return ResponseEntity.ok(ApiResponse.success(
                analyticsService.getDashboardStats(orgId, userDetails.getUserId())));
    }
}
