package com.smartlock.service;

import com.smartlock.domain.DirectBooking;
import com.smartlock.domain.Organization;
import com.smartlock.util.LogMaskingUtil;
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
        log.info("createBooking — orgId={} propertyId={} checkIn={} checkOut={} guests={} guestEmail={}",
                orgId, req.getPropertyId(), req.getCheckInDate(), req.getCheckOutDate(),
                req.getNumberOfGuests(), LogMaskingUtil.maskEmail(req.getGuestEmail()));
        orgSecurity.requireOrgAccess(orgId);
        // Enforce booking gate
        if (!verificationService.isBookingEnabled(orgId)) {
            log.warn("createBooking — rejected: booking gate disabled for orgId={}", orgId);
            throw new AppException("Bookings are disabled until verification is complete", HttpStatus.FORBIDDEN);
        }

        UUID propertyId = UUID.fromString(req.getPropertyId());
        // Verify the property belongs to this org
        propertyRepository.findById(propertyId)
                .filter(p -> p.getOrganizationId().equals(orgId))
                .orElseThrow(() -> new AppException("Property not found in this organization", HttpStatus.NOT_FOUND));

        log.debug("createBooking — checking availability propertyId={} {} → {}",
                propertyId, req.getCheckInDate(), req.getCheckOutDate());
        CalendarEngine.AvailabilityResult avail = calendarEngine.checkAvailability(
                propertyId, req.getCheckInDate(), req.getCheckOutDate());
        if (!avail.available()) {
            log.warn("createBooking — unavailable propertyId={} reason={}", propertyId, avail.reason());
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
        log.info("createBooking — saved bookingId={} status={}", booking.getId(), booking.getStatus());

        // Register dates in the calendar engine (advisory lock + GIST constraint protection)
        calendarEngine.registerBookedInterval(
                propertyId, req.getCheckInDate(), req.getCheckOutDate(),
                booking.getId(), "DirectBooking: " + LogMaskingUtil.maskEmail(req.getGuestEmail()));
        log.debug("createBooking — calendar interval registered for bookingId={}", booking.getId());

        return toResponse(booking);
    }

    @Transactional(readOnly = true)
    public PageResponse<DirectBookingResponse> listBookings(UUID orgId, Pageable pageable) {
        log.debug("listBookings — orgId={} page={}", orgId, pageable.getPageNumber());
        orgSecurity.requireOrgAccess(orgId);
        PageResponse<DirectBookingResponse> result = PageResponse.from(
                bookingRepository.findByOrganizationId(orgId, pageable).map(this::toResponse));
        log.debug("listBookings — returned {} of {}", result.getContent().size(), result.getTotalElements());
        return result;
    }

    @Transactional(readOnly = true)
    public DirectBookingResponse getBooking(UUID orgId, UUID bookingId) {
        log.debug("getBooking — orgId={} bookingId={}", orgId, bookingId);
        DirectBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException("Booking not found", HttpStatus.NOT_FOUND));
        if (!booking.getOrganizationId().equals(orgId)) {
            log.warn("getBooking — access denied orgId={} bookingId={}", orgId, bookingId);
            throw new AppException("Access denied", HttpStatus.FORBIDDEN);
        }
        log.debug("getBooking — status={}", booking.getStatus());
        return toResponse(booking);
    }

    @Transactional
    public DirectBookingResponse confirmBooking(UUID orgId, UUID bookingId) {
        log.info("confirmBooking — orgId={} bookingId={}", orgId, bookingId);
        DirectBooking booking = requireBooking(orgId, bookingId);
        booking.setStatus(DirectBookingStatus.CONFIRMED);
        booking.setPaymentStatus("PAID");
        bookingRepository.save(booking);
        log.info("confirmBooking — success bookingId={}", bookingId);
        notifyHostOfConfirmedBooking(orgId, booking);
        notifyGuestOfBookingConfirmation(booking);
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

    private void notifyGuestOfBookingConfirmation(DirectBooking booking) {
        if (booking.getGuestEmail() == null || booking.getGuestEmail().isBlank()) return;
        try {
            Property property = propertyRepository.findById(booking.getPropertyId()).orElse(null);
            String propertyName = property != null ? property.getName() : "your property";
            String checkIn = DATE_FMT.format(booking.getCheckInDate());
            String checkOut = DATE_FMT.format(booking.getCheckOutDate());
            String amount = booking.getTotalAmount() != null ? booking.getTotalAmount().toPlainString() : null;
            emailService.sendGuestBookingConfirmationEmail(
                    booking.getGuestEmail(), booking.getGuestName(), propertyName,
                    checkIn, checkOut, amount, booking.getCurrency());
        } catch (Exception e) {
            log.error("Failed to send confirmation to guest for booking {}: {}", booking.getId(), e.getMessage());
        }
    }

    @Transactional
    public DirectBookingResponse cancelBooking(UUID orgId, UUID bookingId, String reason) {
        log.info("cancelBooking — orgId={} bookingId={} reason={}", orgId, bookingId, reason);
        DirectBooking booking = requireBooking(orgId, bookingId);
        if (booking.getStatus() == DirectBookingStatus.CANCELLED) {
            log.warn("cancelBooking — already cancelled bookingId={}", bookingId);
            throw new AppException("Booking is already cancelled", HttpStatus.BAD_REQUEST);
        }
        booking.setStatus(DirectBookingStatus.CANCELLED);
        booking.setCancelledAt(java.time.Instant.now());
        booking.setCancellationReason(reason);
        bookingRepository.save(booking);

        log.debug("cancelBooking — releasing calendar intervals for bookingId={}", bookingId);
        calendarEngine.cancelBookingDates(booking.getId());
        log.info("cancelBooking — success bookingId={}", bookingId);

        return toResponse(booking);
    }

    @Transactional
    public DirectBookingResponse checkInBooking(UUID orgId, UUID bookingId) {
        log.info("checkInBooking — orgId={} bookingId={}", orgId, bookingId);
        DirectBooking booking = requireBooking(orgId, bookingId);
        if (booking.getStatus() != DirectBookingStatus.CONFIRMED) {
            log.warn("checkInBooking — wrong status={} bookingId={}", booking.getStatus(), bookingId);
            throw new AppException("Booking must be CONFIRMED to check in (current: " + booking.getStatus() + ")", HttpStatus.BAD_REQUEST);
        }
        booking.setStatus(DirectBookingStatus.CHECKED_IN);
        log.info("checkInBooking — success bookingId={}", bookingId);
        return toResponse(bookingRepository.save(booking));
    }

    @Transactional
    public DirectBookingResponse checkOutBooking(UUID orgId, UUID bookingId) {
        log.info("checkOutBooking — orgId={} bookingId={}", orgId, bookingId);
        DirectBooking booking = requireBooking(orgId, bookingId);
        if (booking.getStatus() != DirectBookingStatus.CHECKED_IN) {
            log.warn("checkOutBooking — wrong status={} bookingId={}", booking.getStatus(), bookingId);
            throw new AppException("Booking must be CHECKED_IN to check out (current: " + booking.getStatus() + ")", HttpStatus.BAD_REQUEST);
        }
        booking.setStatus(DirectBookingStatus.CHECKED_OUT);
        bookingRepository.save(booking);
        log.info("checkOutBooking — success bookingId={}", bookingId);

        log.debug("checkOutBooking — creating cleaner task for bookingId={}", bookingId);
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
