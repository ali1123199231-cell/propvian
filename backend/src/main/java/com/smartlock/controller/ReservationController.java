package com.smartlock.controller;

import com.smartlock.dto.request.reservation.CreateReservationRequest;
import com.smartlock.dto.response.common.ApiResponse;
import com.smartlock.dto.response.common.PageResponse;
import com.smartlock.dto.response.reservation.ReservationResponse;
import com.smartlock.security.CustomUserDetails;
import com.smartlock.service.ReservationService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Reservations")
@SecurityRequirement(name = "bearerAuth")
public class ReservationController {

    private final ReservationService reservationService;

    @PostMapping("/api/v1/properties/{propertyId}/reservations")
    public ResponseEntity<ApiResponse<ReservationResponse>> create(
            @PathVariable UUID propertyId,
            @Valid @RequestBody CreateReservationRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        log.debug("ReservationController.create — propertyId={} orgId={}", propertyId, userDetails.getActiveOrgId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(reservationService.createReservation(
                        propertyId, userDetails.getActiveOrgId(), request)));
    }

    @GetMapping("/api/v1/organizations/{orgId}/reservations")
    public ResponseEntity<ApiResponse<PageResponse<ReservationResponse>>> listByOrg(
            @PathVariable UUID orgId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.debug("ReservationController.listByOrg — orgId={} page={}", orgId, page);
        var pageable = PageRequest.of(page, size, Sort.by("checkInDate").descending());
        return ResponseEntity.ok(ApiResponse.success(
                PageResponse.from(reservationService.getReservationsByOrg(orgId, pageable))));
    }

    @GetMapping("/api/v1/properties/{propertyId}/reservations")
    public ResponseEntity<ApiResponse<PageResponse<ReservationResponse>>> listByProperty(
            @PathVariable UUID propertyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.debug("ReservationController.listByProperty — propertyId={} page={}", propertyId, page);
        var pageable = PageRequest.of(page, size, Sort.by("checkInDate").descending());
        return ResponseEntity.ok(ApiResponse.success(
                PageResponse.from(reservationService.getReservationsByProperty(propertyId, pageable))));
    }

    @GetMapping("/api/v1/reservations/{reservationId}")
    public ResponseEntity<ApiResponse<ReservationResponse>> get(@PathVariable UUID reservationId) {
        log.debug("ReservationController.get — reservationId={}", reservationId);
        return ResponseEntity.ok(ApiResponse.success(reservationService.getReservation(reservationId)));
    }

    @PostMapping("/api/v1/reservations/{reservationId}/cancel")
    public ResponseEntity<ApiResponse<ReservationResponse>> cancel(
            @PathVariable UUID reservationId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        log.info("ReservationController.cancel — reservationId={}", reservationId);
        return ResponseEntity.ok(ApiResponse.success(
                reservationService.cancelReservation(reservationId, userDetails.getActiveOrgId())));
    }

    @PostMapping("/api/v1/reservations/{reservationId}/checkout")
    public ResponseEntity<ApiResponse<ReservationResponse>> checkout(
            @PathVariable UUID reservationId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        log.info("ReservationController.checkout — reservationId={}", reservationId);
        return ResponseEntity.ok(ApiResponse.success(
                reservationService.checkOut(reservationId, userDetails.getActiveOrgId())));
    }
}
