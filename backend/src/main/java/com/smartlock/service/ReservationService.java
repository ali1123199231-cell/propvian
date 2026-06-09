package com.smartlock.service;

import com.smartlock.domain.Organization;
import com.smartlock.domain.Property;
import com.smartlock.util.LogMaskingUtil;
import com.smartlock.domain.Reservation;
import com.smartlock.domain.User;
import com.smartlock.domain.enums.ReservationSource;
import com.smartlock.domain.enums.ReservationStatus;
import com.smartlock.dto.request.reservation.CreateReservationRequest;
import com.smartlock.dto.response.reservation.ReservationResponse;
import com.smartlock.event.ReservationCancelledEvent;
import com.smartlock.event.ReservationCheckedOutEvent;
import com.smartlock.event.ReservationCreatedEvent;
import com.smartlock.exception.ResourceNotFoundException;
import com.smartlock.repository.AccessCodeRepository;
import com.smartlock.repository.OrganizationRepository;
import com.smartlock.repository.PropertyRepository;
import com.smartlock.repository.ReservationRepository;
import com.smartlock.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReservationService {

    private static final SecureRandom CHECKIN_CODE_RANDOM = new SecureRandom();
    private static final String CHECKIN_CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("d MMM yyyy HH:mm");

    private final ReservationRepository reservationRepository;
    private final PropertyRepository propertyRepository;
    private final AccessCodeRepository accessCodeRepository;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final ApplicationEventPublisher eventPublisher;
    private final OrganizationSecurityService orgSecurity;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Transactional
    public ReservationResponse createReservation(UUID propertyId, UUID orgId, CreateReservationRequest request) {
        log.info("createReservation — propertyId={} orgId={} checkIn={} checkOut={} guests={} source={}",
                propertyId, orgId, request.getCheckInDate(), request.getCheckOutDate(),
                request.getNumberOfGuests(), request.getSource());
        propertyRepository.findById(propertyId)
                .filter(p -> p.getOrganizationId().equals(orgId))
                .orElseThrow(() -> new ResourceNotFoundException("Property", propertyId));

        Reservation reservation = Reservation.builder()
                .propertyId(propertyId)
                .checkInDate(request.getCheckInDate())
                .checkOutDate(request.getCheckOutDate())
                .guestName(request.getGuestName())
                .guestEmail(request.getGuestEmail())
                .guestPhone(request.getGuestPhone())
                .numberOfGuests(request.getNumberOfGuests())
                .notes(request.getNotes())
                .timezone(request.getTimezone() != null ? request.getTimezone() : "UTC")
                .source(request.getSource() != null ? request.getSource() : ReservationSource.MANUAL)
                .externalId(request.getExternalId())
                .status(ReservationStatus.CONFIRMED)
                .checkinCode(generateCheckinCode())
                .build();

        reservation = reservationRepository.save(reservation);
        log.info("createReservation — saved reservationId={} checkinCode={} status={}",
                reservation.getId(), reservation.getCheckinCode(), reservation.getStatus());

        Organization org = organizationRepository.findById(orgId).orElse(null);
        if (org != null) {
            if (org.isAutomationEnabled()) {
                log.debug("createReservation — publishing ReservationCreatedEvent for automation reservationId={}", reservation.getId());
                eventPublisher.publishEvent(new ReservationCreatedEvent(this, reservation.getId(), orgId));
            } else {
                log.debug("createReservation — automation disabled for orgId={}, skipping event", orgId);
            }
            notifyHostOfNewReservation(reservation, org);
        }
        notifyGuestOfNewReservation(reservation);

        return toResponse(reservation, null);
    }

    @Transactional(readOnly = true)
    public Page<ReservationResponse> getReservationsByOrg(UUID orgId, Pageable pageable) {
        log.debug("getReservationsByOrg — orgId={} page={}/{}", orgId, pageable.getPageNumber(), pageable.getPageSize());
        orgSecurity.requireOrgAccess(orgId);
        Page<ReservationResponse> page = reservationRepository.findByOrganizationId(orgId, pageable)
                .map(r -> toResponse(r, null));
        log.debug("getReservationsByOrg — returned {} of {}", page.getNumberOfElements(), page.getTotalElements());
        return page;
    }

    @Transactional(readOnly = true)
    public Page<ReservationResponse> getReservationsByProperty(UUID propertyId, Pageable pageable) {
        log.debug("getReservationsByProperty — propertyId={} page={}", propertyId, pageable.getPageNumber());
        orgSecurity.requirePropertyAccess(propertyId);
        Page<ReservationResponse> page = reservationRepository.findByPropertyId(propertyId, pageable)
                .map(r -> toResponse(r, null));
        log.debug("getReservationsByProperty — returned {} of {}", page.getNumberOfElements(), page.getTotalElements());
        return page;
    }

    @Transactional(readOnly = true)
    public ReservationResponse getReservation(UUID reservationId) {
        log.debug("getReservation — reservationId={}", reservationId);
        Reservation r = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", reservationId));
        orgSecurity.requirePropertyAccess(r.getPropertyId());
        long codeCount = accessCodeRepository.countByReservationId(reservationId);
        log.debug("getReservation — status={} hasAccessCode={}", r.getStatus(), codeCount > 0);
        return toResponse(r, codeCount > 0);
    }

    @Transactional
    public ReservationResponse cancelReservation(UUID reservationId, UUID orgId) {
        log.info("cancelReservation — reservationId={} orgId={}", reservationId, orgId);
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", reservationId));
        orgSecurity.requirePropertyAccess(reservation.getPropertyId());

        reservation.setStatus(ReservationStatus.CANCELLED);
        reservation = reservationRepository.save(reservation);
        log.info("cancelReservation — success reservationId={}", reservationId);

        eventPublisher.publishEvent(new ReservationCancelledEvent(this, reservation.getId(), orgId));

        return toResponse(reservation, null);
    }

    @Transactional
    public ReservationResponse checkOut(UUID reservationId, UUID orgId) {
        log.info("checkOut — reservationId={} orgId={}", reservationId, orgId);
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", reservationId));
        orgSecurity.requirePropertyAccess(reservation.getPropertyId());

        reservation.setStatus(ReservationStatus.CHECKED_OUT);
        reservation = reservationRepository.save(reservation);
        log.info("checkOut — success reservationId={}", reservationId);

        eventPublisher.publishEvent(new ReservationCheckedOutEvent(this, reservation.getId(), orgId));

        return toResponse(reservation, null);
    }

    private void notifyHostOfNewReservation(Reservation reservation, Organization org) {
        try {
            userRepository.findById(org.getOwnerId()).ifPresent(owner -> {
                Property property = propertyRepository.findById(reservation.getPropertyId()).orElse(null);
                String propertyName = property != null ? property.getName() : "your property";
                ZoneId zone = ZoneId.of("UTC");
                String checkIn = DATE_FMT.format(reservation.getCheckInDate().atZone(zone));
                String checkOut = DATE_FMT.format(reservation.getCheckOutDate().atZone(zone));
                String source = reservation.getSource() != null ? reservation.getSource().name() : "MANUAL";
                String dashboardUrl = frontendUrl + "/reservations";
                emailService.sendNewReservationEmail(
                        owner.getEmail(), reservation.getGuestName(), propertyName,
                        checkIn, checkOut, source, dashboardUrl);
            });
        } catch (Exception e) {
            log.error("Failed to notify host of new reservation {}: {}", reservation.getId(), e.getMessage());
        }
    }

    private void notifyGuestOfNewReservation(Reservation reservation) {
        if (reservation.getGuestEmail() == null || reservation.getGuestEmail().isBlank()) return;
        try {
            Property property = propertyRepository.findById(reservation.getPropertyId()).orElse(null);
            String propertyName = property != null ? property.getName() : "your property";
            ZoneId zone = ZoneId.of("UTC");
            String checkIn = DATE_FMT.format(reservation.getCheckInDate().atZone(zone));
            String checkOut = DATE_FMT.format(reservation.getCheckOutDate().atZone(zone));
            String amount = reservation.getTotalAmount() != null ? reservation.getTotalAmount().toPlainString() : null;
            emailService.sendGuestBookingConfirmationEmail(
                    reservation.getGuestEmail(), reservation.getGuestName(), propertyName,
                    checkIn, checkOut, amount, reservation.getCurrency());
        } catch (Exception e) {
            log.error("Failed to send confirmation to guest for reservation {}: {}", reservation.getId(), e.getMessage());
        }
    }

    private String generateCheckinCode() {
        for (int attempt = 0; attempt < 10; attempt++) {
            StringBuilder sb = new StringBuilder(7);
            for (int i = 0; i < 7; i++) {
                sb.append(CHECKIN_CODE_CHARS.charAt(CHECKIN_CODE_RANDOM.nextInt(CHECKIN_CODE_CHARS.length())));
            }
            String code = sb.toString();
            if (reservationRepository.findByCheckinCode(code).isEmpty()) {
                return code;
            }
        }
        throw new IllegalStateException("Failed to generate unique checkin code");
    }

    private ReservationResponse toResponse(Reservation r, Boolean hasAccessCode) {
        return ReservationResponse.builder()
                .id(r.getId())
                .propertyId(r.getPropertyId())
                .guestId(r.getGuestId())
                .externalId(r.getExternalId())
                .icalUid(r.getIcalUid())
                .source(r.getSource().name())
                .status(r.getStatus().name())
                .checkInDate(r.getCheckInDate())
                .checkOutDate(r.getCheckOutDate())
                .timezone(r.getTimezone())
                .guestName(r.getGuestName())
                .guestEmail(r.getGuestEmail())
                .guestPhone(r.getGuestPhone())
                .numberOfGuests(r.getNumberOfGuests())
                .notes(r.getNotes())
                .totalAmount(r.getTotalAmount())
                .currency(r.getCurrency())
                .syncedAt(r.getSyncedAt())
                .accessCodeSentAt(r.getAccessCodeSentAt())
                .hasAccessCode(hasAccessCode != null && hasAccessCode)
                .createdAt(r.getCreatedAt())
                .build();
    }
}
