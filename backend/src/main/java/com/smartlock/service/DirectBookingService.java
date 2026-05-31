package com.smartlock.service;

import com.smartlock.domain.DirectBooking;
import com.smartlock.domain.enums.DirectBookingStatus;
import com.smartlock.dto.request.directbooking.CreateDirectBookingRequest;
import com.smartlock.dto.response.common.PageResponse;
import com.smartlock.dto.response.directbooking.DirectBookingResponse;
import com.smartlock.exception.AppException;
import com.smartlock.repository.DirectBookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DirectBookingService {

    private final DirectBookingRepository bookingRepository;
    private final VerificationService verificationService;

    @Transactional
    public DirectBookingResponse createBooking(UUID orgId, CreateDirectBookingRequest req) {
        // Enforce booking gate
        if (!verificationService.isBookingEnabled(orgId)) {
            throw new AppException("Bookings are disabled until verification is complete", HttpStatus.FORBIDDEN);
        }

        UUID propertyId = UUID.fromString(req.getPropertyId());

        // Check availability
        List<DirectBooking> conflicts = bookingRepository.findConflictingBookings(
                propertyId, req.getCheckInDate(), req.getCheckOutDate());
        if (!conflicts.isEmpty()) {
            throw new AppException("Property is not available for the selected dates", HttpStatus.CONFLICT);
        }

        if (!req.getCheckOutDate().isAfter(req.getCheckInDate())) {
            throw new AppException("Check-out date must be after check-in date", HttpStatus.BAD_REQUEST);
        }

        DirectBooking booking = DirectBooking.builder()
                .propertyId(propertyId)
                .organizationId(orgId)
                .guestName(req.getGuestName())
                .guestEmail(req.getGuestEmail())
                .guestPhone(req.getGuestPhone())
                .numberOfGuests(req.getNumberOfGuests())
                .checkInDate(req.getCheckInDate())
                .checkOutDate(req.getCheckOutDate())
                .totalAmount(req.getTotalAmount())
                .currency(req.getCurrency() != null ? req.getCurrency() : "USD")
                .notes(req.getNotes())
                .build();

        return toResponse(bookingRepository.save(booking));
    }

    @Transactional(readOnly = true)
    public PageResponse<DirectBookingResponse> listBookings(UUID orgId, Pageable pageable) {
        return PageResponse.from(
                bookingRepository.findByOrganizationId(orgId, pageable).map(this::toResponse));
    }

    @Transactional(readOnly = true)
    public DirectBookingResponse getBooking(UUID orgId, UUID bookingId) {
        DirectBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException("Booking not found", HttpStatus.NOT_FOUND));
        if (!booking.getOrganizationId().equals(orgId)) {
            throw new AppException("Access denied", HttpStatus.FORBIDDEN);
        }
        return toResponse(booking);
    }

    @Transactional
    public DirectBookingResponse confirmBooking(UUID orgId, UUID bookingId) {
        DirectBooking booking = requireBooking(orgId, bookingId);
        booking.setStatus(DirectBookingStatus.CONFIRMED);
        booking.setPaymentStatus("PAID");
        return toResponse(bookingRepository.save(booking));
    }

    @Transactional
    public DirectBookingResponse cancelBooking(UUID orgId, UUID bookingId, String reason) {
        DirectBooking booking = requireBooking(orgId, bookingId);
        if (booking.getStatus() == DirectBookingStatus.CANCELLED) {
            throw new AppException("Booking is already cancelled", HttpStatus.BAD_REQUEST);
        }
        booking.setStatus(DirectBookingStatus.CANCELLED);
        booking.setCancelledAt(java.time.Instant.now());
        booking.setCancellationReason(reason);
        return toResponse(bookingRepository.save(booking));
    }

    @Transactional(readOnly = true)
    public List<LocalDate> getUnavailableDates(UUID propertyId) {
        return bookingRepository.findByPropertyId(propertyId).stream()
                .filter(b -> b.getStatus() != DirectBookingStatus.CANCELLED)
                .flatMap(b -> b.getCheckInDate().datesUntil(b.getCheckOutDate()))
                .distinct()
                .sorted()
                .toList();
    }

    private DirectBooking requireBooking(UUID orgId, UUID bookingId) {
        DirectBooking b = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException("Booking not found", HttpStatus.NOT_FOUND));
        if (!b.getOrganizationId().equals(orgId)) {
            throw new AppException("Access denied", HttpStatus.FORBIDDEN);
        }
        return b;
    }

    private DirectBookingResponse toResponse(DirectBooking b) {
        return DirectBookingResponse.builder()
                .id(b.getId().toString())
                .propertyId(b.getPropertyId().toString())
                .organizationId(b.getOrganizationId().toString())
                .guestName(b.getGuestName())
                .guestEmail(b.getGuestEmail())
                .guestPhone(b.getGuestPhone())
                .numberOfGuests(b.getNumberOfGuests())
                .checkInDate(b.getCheckInDate())
                .checkOutDate(b.getCheckOutDate())
                .totalAmount(b.getTotalAmount())
                .currency(b.getCurrency())
                .paymentProvider(b.getPaymentProvider())
                .paymentStatus(b.getPaymentStatus())
                .status(b.getStatus())
                .cancelledAt(b.getCancelledAt())
                .cancellationReason(b.getCancellationReason())
                .notes(b.getNotes())
                .createdAt(b.getCreatedAt())
                .updatedAt(b.getUpdatedAt())
                .build();
    }
}
