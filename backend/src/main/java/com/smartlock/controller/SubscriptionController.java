package com.smartlock.controller;

import com.smartlock.domain.Subscription;
import com.smartlock.domain.SubscriptionPlan;
import com.smartlock.dto.response.common.ApiResponse;
import com.smartlock.exception.ResourceNotFoundException;
import com.smartlock.repository.SubscriptionPlanRepository;
import com.smartlock.repository.SubscriptionRepository;
import com.smartlock.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Subscriptions")
public class SubscriptionController {

    private final SubscriptionPlanRepository planRepository;
    private final SubscriptionRepository subscriptionRepository;

    @GetMapping("/subscriptions/plans")
    public ResponseEntity<ApiResponse<List<SubscriptionPlan>>> getPlans() {
        return ResponseEntity.ok(ApiResponse.success(planRepository.findByIsActiveTrueOrderByMonthlyPriceAsc()));
    }

    @GetMapping("/organizations/{orgId}/subscription")
    public ResponseEntity<ApiResponse<Subscription>> getSubscription(
            @PathVariable UUID orgId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        Subscription sub = subscriptionRepository.findByOrganizationId(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found"));
        return ResponseEntity.ok(ApiResponse.success(sub));
    }
}
