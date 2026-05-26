package com.smartlock.controller;

import com.smartlock.dto.response.common.ApiResponse;
import com.smartlock.security.CustomUserDetails;
import com.smartlock.service.ActivityEventService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/organizations/{orgId}/events")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Events")
public class EventController {

    private final ActivityEventService activityEventService;

    @PostMapping("/track")
    public ResponseEntity<ApiResponse<Void>> track(
            @PathVariable UUID orgId,
            @RequestBody TrackRequest body,
            @AuthenticationPrincipal CustomUserDetails principal) {

        String actorName = principal.getEmail();
        activityEventService.track(orgId, principal.getUserId(), actorName,
                body.eventType(), body.metadata());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    public record TrackRequest(String eventType, Map<String, Object> metadata) {}
}
