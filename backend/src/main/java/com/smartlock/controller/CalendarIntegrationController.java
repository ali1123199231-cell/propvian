package com.smartlock.controller;

import com.smartlock.dto.request.calendar.CreateCalendarIntegrationRequest;
import com.smartlock.dto.response.calendar.CalendarIntegrationResponse;
import com.smartlock.dto.response.common.ApiResponse;
import com.smartlock.security.CustomUserDetails;
import com.smartlock.service.CalendarIntegrationService;
import com.smartlock.service.ICalExportService;
import java.util.Map;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Calendar Integrations")
@SecurityRequirement(name = "bearerAuth")
public class CalendarIntegrationController {

    private final CalendarIntegrationService calendarIntegrationService;
    private final ICalExportService icalExportService;

    @PostMapping("/properties/{propertyId}/calendar-integrations")
    public ResponseEntity<ApiResponse<CalendarIntegrationResponse>> create(
            @PathVariable UUID propertyId,
            @Valid @RequestBody CreateCalendarIntegrationRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(calendarIntegrationService.createIntegration(
                        propertyId, userDetails.getActiveOrgId(), request)));
    }

    @GetMapping("/properties/{propertyId}/calendar-integrations")
    public ResponseEntity<ApiResponse<List<CalendarIntegrationResponse>>> list(@PathVariable UUID propertyId) {
        return ResponseEntity.ok(ApiResponse.success(calendarIntegrationService.getByProperty(propertyId)));
    }

    @DeleteMapping("/calendar-integrations/{integrationId}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID integrationId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        calendarIntegrationService.deleteIntegration(integrationId, userDetails.getActiveOrgId());
        return ResponseEntity.ok(ApiResponse.success("Integration deleted"));
    }

    @PostMapping("/calendar-integrations/{integrationId}/sync")
    public ResponseEntity<ApiResponse<Void>> sync(
            @PathVariable UUID integrationId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        calendarIntegrationService.triggerSync(integrationId, userDetails.getActiveOrgId());
        return ResponseEntity.ok(ApiResponse.success("Sync triggered"));
    }

    /** Get (or auto-create) the iCal export token for a property. */
    @GetMapping("/properties/{propertyId}/calendar-integrations/export-token")
    public ResponseEntity<ApiResponse<Map<String, String>>> getExportToken(
            @PathVariable UUID propertyId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String token = icalExportService.getOrCreateExportToken(propertyId, userDetails.getActiveOrgId());
        return ResponseEntity.ok(ApiResponse.success(Map.of("token", token)));
    }

    /** Rotate (regenerate) the export token, invalidating the old feed URL. */
    @PostMapping("/properties/{propertyId}/calendar-integrations/rotate-token")
    public ResponseEntity<ApiResponse<Map<String, String>>> rotateToken(
            @PathVariable UUID propertyId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String token = icalExportService.rotateExportToken(propertyId, userDetails.getActiveOrgId());
        return ResponseEntity.ok(ApiResponse.success(Map.of("token", token)));
    }
}
