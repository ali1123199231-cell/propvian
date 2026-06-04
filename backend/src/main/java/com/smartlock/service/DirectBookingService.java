package com.smartlock.service;

import com.smartlock.domain.DirectBooking;
import com.smartlock.domain.Organization;
import com.smartlock.domain.Property;
import com.smartlock.domain.enums.DirectBookingStatus;
import com.smartlock.dto.request.directbooking.CreateDirectBookingRequest;
import com.smartlock.dto.response.common.PageResponse;
import com.smartlock.dto.response.directbooking.DirectBookingResponse;
import com.smartlock.exception.AppException;
import com.smartlock.repository.DirectBookingRepository;
import com.smartlock.repository.OrganizationRepository;
import com.smartlock.repository.PropertyRepository;
import com.smartlock.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DirectBookingService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("d MMM yyyy");

    private final DirectBookingRepository bookingRepository;
    private final VerificationService verificationService;
    private final PropertyRepository propertyRepository;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final OrganizationSecurityService orgSecurity;
    private final CalendarEngine calendarEngine;
    private final CleanerTaskService cleanerTaskService;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Transactional
    public DirectBookingResponse createBooking(UUID orgId, CreateDirectBookingRequest req) {
        orgSecurity.requireOrgAccess(orgId);
        // Enforce booking gate
        if (!verificationService.isBookingEnabled(orgId)) {
            throw new AppException("Bookings are disabled until verification is complete", HttpStatus.FORBIDDEN);
        }

        UUID propertyId = UUID.fromString(req.getPropertyId());
        // Verify the property belongs to this org
        propertyRepository.findById(propertyId)
                .filter(p -> p.getOrganizationId().equals(orgId))
                .orElseThrow(() -> new AppException("Property not found in this organization", HttpStatus.NOT_FOUND));

        // CalendarEngine handles: advisory lock + availability check + stay rule validation
        // This replaces the old findConflictingBookings() call
        CalendarEngine.AvailabilityResult avail = calendarEngine.checkAvailability(
                propertyId, req.getCheckInDate(), req.getCheckOutDate());
        if (!avail.available()) {
            throw new AppException(avail.reason(), HttpStatus.CONFLICT);
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

        booking = bookingRepository.save(booking);

        // Register dates in the calendar engine (advisory lock + GIST constraint protection)
        calendarEngine.registerBookedInterval(
                propertyId, req.getCheckInDate(), req.getCheckOutDate(),
                booking.getId(), "DirectBooking: " + req.getGuestEmail());

        return toResponse(booking);
    }

    @Transactional(readOnly = true)
    public PageResponse<DirectBookingResponse> listBookings(UUID orgId, Pageable pageable) {
        orgSecurity.requireOrgAccess(orgId);
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
        bookingRepository.save(booking);
        notifyHostOfConfirmedBooking(orgId, booking);
        return toResponse(booking);
    }

    private void notifyHostOfConfirmedBooking(UUID orgId, DirectBooking booking) {
        try {
            Organization org = organizationRepository.findById(orgId).orElse(null);
            if (org == null) return;
            userRepository.findById(org.getOwnerId()).ifPresent(owner -> {
                Property property = propertyRepository.findById(booking.getPropertyId()).orElse(null);
                String propertyName = property != null ? property.getName() : "your property";
                String checkIn = DATE_FMT.format(booking.getCheckInDate());
                String checkOut = DATE_FMT.format(booking.getCheckOutDate());
                emailService.sendNewReservationEmail(
                        owner.getEmail(), booking.getGuestName(), propertyName,
                        checkIn, checkOut, "DIRECT", frontendUrl + "/reservations");
            });
        } catch (Exception e) {
            log.error("Failed to notify host of confirmed booking {}: {}", booking.getId(), e.getMessage());
        }
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
        bookingRepository.save(booking);

        // Release calendar dates (removes BOOKED + BUFFER intervals)
        calendarEngine.cancelBookingDates(booking.getId());

        return toResponse(booking);
    }

    @Transactional
    public DirectBookingResponse checkInBooking(UUID orgId, UUID bookingId) {
        DirectBooking booking = requireBooking(orgId, bookingId);
        if (booking.getStatus() != DirectBookingStatus.CONFIRMED) {
            throw new AppException("Booking must be CONFIRMED to check in (current: " + booking.getStatus() + ")", HttpStatus.BAD_REQUEST);
        }
        booking.setStatus(DirectBookingStatus.CHECKED_IN);
        return toResponse(bookingRepository.save(booking));
    }

    @Transactional
    public DirectBookingResponse checkOutBooking(UUID orgId, UUID bookingId) {
        DirectBooking booking = requireBooking(orgId, bookingId);
        if (booking.getStatus() != DirectBookingStatus.CHECKED_IN) {
            throw new AppException("Booking must be CHECKED_IN to check out (current: " + booking.getStatus() + ")", HttpStatus.BAD_REQUEST);
        }
        booking.setStatus(DirectBookingStatus.CHECKED_OUT);
        bookingRepository.save(booking);

        // Create a cleaner task for this checkout
        cleanerTaskService.createCleanerTaskForDirectBooking(bookingId, orgId);

        return toResponse(booking);
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
