package com.smartlock.service;

import com.smartlock.domain.Organization;
import com.smartlock.domain.Reservation;
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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReservationService {

    private static final SecureRandom CHECKIN_CODE_RANDOM = new SecureRandom();
    private static final String CHECKIN_CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    private final ReservationRepository reservationRepository;
    private final PropertyRepository propertyRepository;
    private final AccessCodeRepository accessCodeRepository;
    private final OrganizationRepository organizationRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public ReservationResponse createReservation(UUID propertyId, UUID orgId, CreateReservationRequest request) {
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

        boolean automationEnabled = organizationRepository.findById(orgId)
                .map(Organization::isAutomationEnabled)
                .orElse(false);

        if (automationEnabled) {
            eventPublisher.publishEvent(new ReservationCreatedEvent(this, reservation.getId(), orgId));
        }

        return toResponse(reservation, null);
    }

    @Transactional(readOnly = true)
    public Page<ReservationResponse> getReservationsByOrg(UUID orgId, Pageable pageable) {
        return reservationRepository.findByOrganizationId(orgId, pageable)
                .map(r -> toResponse(r, null));
    }

    @Transactional(readOnly = true)
    public Page<ReservationResponse> getReservationsByProperty(UUID propertyId, Pageable pageable) {
        return reservationRepository.findByPropertyId(propertyId, pageable)
                .map(r -> toResponse(r, null));
    }

    @Transactional(readOnly = true)
    public ReservationResponse getReservation(UUID reservationId) {
        Reservation r = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", reservationId));
        long codeCount = accessCodeRepository.countByReservationId(reservationId);
        return toResponse(r, codeCount > 0);
    }

    @Transactional
    public ReservationResponse cancelReservation(UUID reservationId, UUID orgId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", reservationId));

        reservation.setStatus(ReservationStatus.CANCELLED);
        reservation = reservationRepository.save(reservation);

        eventPublisher.publishEvent(new ReservationCancelledEvent(this, reservation.getId(), orgId));

        return toResponse(reservation, null);
    }

    @Transactional
    public ReservationResponse checkOut(UUID reservationId, UUID orgId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", reservationId));

        reservation.setStatus(ReservationStatus.CHECKED_OUT);
        reservation = reservationRepository.save(reservation);

        eventPublisher.publishEvent(new ReservationCheckedOutEvent(this, reservation.getId(), orgId));

        return toResponse(reservation, null);
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
