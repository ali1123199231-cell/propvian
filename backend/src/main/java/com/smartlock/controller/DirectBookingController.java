package com.smartlock.controller;

import com.smartlock.dto.request.directbooking.CreateDirectBookingRequest;
import com.smartlock.dto.response.common.ApiResponse;
import com.smartlock.dto.response.common.PageResponse;
import com.smartlock.dto.response.directbooking.DirectBookingResponse;
import com.smartlock.service.DirectBookingService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/organizations/{orgId}/direct-bookings")
@RequiredArgsConstructor
@Tag(name = "Direct Bookings")
@SecurityRequirement(name = "bearerAuth")
public class DirectBookingController {

    private final DirectBookingService bookingService;

    @PostMapping
    public ResponseEntity<ApiResponse<DirectBookingResponse>> create(
            @PathVariable UUID orgId,
            @Valid @RequestBody CreateDirectBookingRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(bookingService.createBooking(orgId, req)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<DirectBookingResponse>>> list(
            @PathVariable UUID orgId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.success(bookingService.listBookings(orgId, pageable)));
    }

    @GetMapping("/{bookingId}")
    public ResponseEntity<ApiResponse<DirectBookingResponse>> get(
            @PathVariable UUID orgId,
            @PathVariable UUID bookingId) {
        return ResponseEntity.ok(ApiResponse.success(bookingService.getBooking(orgId, bookingId)));
    }

    @PostMapping("/{bookingId}/confirm")
    public ResponseEntity<ApiResponse<DirectBookingResponse>> confirm(
            @PathVariable UUID orgId,
            @PathVariable UUID bookingId) {
        return ResponseEntity.ok(ApiResponse.success(bookingService.confirmBooking(orgId, bookingId)));
    }

    @PostMapping("/{bookingId}/cancel")
    public ResponseEntity<ApiResponse<DirectBookingResponse>> cancel(
            @PathVariable UUID orgId,
            @PathVariable UUID bookingId,
            @RequestParam(required = false) String reason) {
        return ResponseEntity.ok(ApiResponse.success(bookingService.cancelBooking(orgId, bookingId, reason)));
    }

    @PostMapping("/{bookingId}/check-in")
    public ResponseEntity<ApiResponse<DirectBookingResponse>> checkIn(
            @PathVariable UUID orgId,
            @PathVariable UUID bookingId) {
        return ResponseEntity.ok(ApiResponse.success(bookingService.checkInBooking(orgId, bookingId)));
    }

    @PostMapping("/{bookingId}/check-out")
    public ResponseEntity<ApiResponse<DirectBookingResponse>> checkOut(
            @PathVariable UUID orgId,
            @PathVariable UUID bookingId) {
        return ResponseEntity.ok(ApiResponse.success(bookingService.checkOutBooking(orgId, bookingId)));
    }

    @GetMapping("/unavailable-dates")
    public ResponseEntity<ApiResponse<List<LocalDate>>> unavailableDates(
            @PathVariable UUID orgId,
            @RequestParam UUID propertyId) {
        return ResponseEntity.ok(ApiResponse.success(bookingService.getUnavailableDates(propertyId)));
    }
}
