package com.smartlock.controller;

import com.smartlock.domain.CalendarInterval;
import com.smartlock.dto.response.common.ApiResponse;
import com.smartlock.service.CalendarEngine;
import com.smartlock.service.OrganizationSecurityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@Tag(name = "Calendar Engine")
@Slf4j
public class CalendarEngineController {

    private final CalendarEngine calendarEngine;
    private final OrganizationSecurityService orgSecurity;

    // ── Public: availability check + calendar view (website builder) ──────────

    @GetMapping("/api/public/properties/{propertyId}/availability")
    @Operation(summary = "Check availability for a date range (public)")
    public ResponseEntity<ApiResponse<CalendarEngine.AvailabilityResult>> checkAvailability(
            @PathVariable UUID propertyId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkIn,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOut) {
        log.debug("CalendarEngineController.checkAvailability — propertyId={}, checkIn={}", propertyId, checkIn);
        CalendarEngine.AvailabilityResult result =
                calendarEngine.checkAvailability(propertyId, checkIn, checkOut);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/api/public/properties/{propertyId}/calendar")
    @Operation(summary = "Get calendar intervals for a date window (public, for website builder)")
    public ResponseEntity<ApiResponse<List<CalendarInterval>>> getPublicCalendar(
            @PathVariable UUID propertyId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        log.debug("CalendarEngineController.getPublicCalendar — propertyId={}, from={}", propertyId, from);
        List<CalendarInterval> intervals = calendarEngine.getCalendar(propertyId, from, to);
        return ResponseEntity.ok(ApiResponse.success(intervals));
    }

    // ── Public: create hold (guest begins checkout) ───────────────────────────

    @PostMapping("/api/public/properties/{propertyId}/holds")
    @Operation(summary = "Create a temporary booking hold (public)")
    public ResponseEntity<ApiResponse<HoldResponse>> createHold(
            @PathVariable UUID propertyId,
            @Valid @RequestBody CreateHoldRequest req) {
        log.info("CalendarEngineController.createHold — propertyId={}", propertyId);
        CalendarEngine.HoldResult result = calendarEngine.createHold(
                propertyId,
                req.getCheckIn(),
                req.getCheckOut(),
                req.getGuests(),
                req.getGuestName(),
                req.getGuestEmail(),
                req.getSessionId()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                new HoldResponse(result.holdId(), result.intervalId(), result.expiresAt())
        ));
    }

    @DeleteMapping("/api/public/holds/{holdId}")
    @Operation(summary = "Release a hold (guest abandoned checkout)")
    public ResponseEntity<ApiResponse<Void>> releaseHold(@PathVariable UUID holdId) {
        log.info("CalendarEngineController.releaseHold — holdId={}", holdId);
        calendarEngine.releaseHold(holdId);
        return ResponseEntity.ok(ApiResponse.success("Hold released"));
    }

    // ── Authenticated: admin calendar view ───────────────────────────────────

    @GetMapping("/api/v1/properties/{propertyId}/calendar")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get calendar intervals for a date window (authenticated)")
    public ResponseEntity<ApiResponse<List<CalendarInterval>>> getCalendar(
            @PathVariable UUID propertyId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        log.debug("CalendarEngineController.getCalendar — propertyId={}, from={}", propertyId, from);
        orgSecurity.requirePropertyAccess(propertyId);
        List<CalendarInterval> intervals = calendarEngine.getCalendar(propertyId, from, to);
        return ResponseEntity.ok(ApiResponse.success(intervals));
    }

    // ── Authenticated: block/unblock dates ───────────────────────────────────

    @PostMapping("/api/v1/properties/{propertyId}/calendar/block")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Block a date range (owner)")
    public ResponseEntity<ApiResponse<CalendarInterval>> blockDates(
            @PathVariable UUID propertyId,
            @Valid @RequestBody BlockDatesRequest req) {
        log.info("CalendarEngineController.blockDates — propertyId={}", propertyId);
        orgSecurity.requirePropertyAccess(propertyId);
        CalendarInterval interval = calendarEngine.blockDates(
                propertyId, req.getStartDate(), req.getEndDate(), null, req.getReason());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(interval));
    }

    @DeleteMapping("/api/v1/properties/{propertyId}/calendar/intervals/{intervalId}")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Remove a BLOCKED interval (owner)")
    public ResponseEntity<ApiResponse<Void>> unblockDates(
            @PathVariable UUID propertyId,
            @PathVariable UUID intervalId) {
        log.info("CalendarEngineController.unblockDates — propertyId={}, intervalId={}", propertyId, intervalId);
        orgSecurity.requirePropertyAccess(propertyId);
        calendarEngine.unblockDates(intervalId, null);
        return ResponseEntity.ok(ApiResponse.success("Dates unblocked"));
    }

    // ── Request / Response DTOs ───────────────────────────────────────────────

    @Data
    public static class CreateHoldRequest {
        @NotNull LocalDate checkIn;
        @NotNull LocalDate checkOut;
        @NotNull Integer guests;
        String guestName;
        String guestEmail;
        String sessionId;
    }

    @Data
    public static class BlockDatesRequest {
        @NotNull LocalDate startDate;
        @NotNull LocalDate endDate;
        String reason;
    }

    public record HoldResponse(UUID holdId, UUID intervalId, Instant expiresAt) {}
}
