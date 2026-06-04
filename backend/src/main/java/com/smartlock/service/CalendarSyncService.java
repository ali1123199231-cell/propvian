package com.smartlock.service;

import com.smartlock.domain.CalendarIntegration;
import com.smartlock.domain.Organization;
import com.smartlock.domain.Reservation;
import com.smartlock.domain.enums.ReservationSource;
import com.smartlock.domain.enums.ReservationStatus;
import com.smartlock.event.ReservationCancelledEvent;
import com.smartlock.event.ReservationCreatedEvent;
import com.smartlock.integration.ical.ICalFetcher;
import com.smartlock.integration.ical.ICalParser;
import com.smartlock.integration.ical.dto.ParsedReservation;
import com.smartlock.repository.CalendarIntegrationRepository;
import com.smartlock.repository.OrganizationRepository;
import com.smartlock.repository.PropertyRepository;
import com.smartlock.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CalendarSyncService {

    private static final SecureRandom CHECKIN_CODE_RANDOM = new SecureRandom();
    private static final String CHECKIN_CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    private final CalendarIntegrationRepository calendarIntegrationRepository;
    private final ReservationRepository reservationRepository;
    private final PropertyRepository propertyRepository;
    private final OrganizationRepository organizationRepository;
    private final ICalFetcher icalFetcher;
    private final ICalParser icalParser;
    private final ApplicationEventPublisher eventPublisher;
    private final GuestService guestService;
    private final CalendarEngine calendarEngine;

    // Not @Transactional — each syncIntegration manages its own transaction independently
    public void syncAll() {
        List<CalendarIntegration> integrations = calendarIntegrationRepository.findAllEnabled();
        log.info("Starting calendar sync for {} integrations", integrations.size());
        for (CalendarIntegration integration : integrations) {
            try {
                syncIntegration(integration);
            } catch (Exception e) {
                log.error("Calendar sync failed for integration {}: {}", integration.getId(), e.getMessage());
            }
        }
    }

    @Transactional
    public void syncIntegration(CalendarIntegration integration) {
        log.debug("Syncing calendar integration {} for property {}", integration.getId(), integration.getPropertyId());

        ICalFetcher.FetchResult result = icalFetcher.fetch(integration.getIcalUrl(), integration.getEtag());

        if (!result.success()) {
            integration.setLastSyncStatus("FAILED");
            integration.setLastSyncError(result.error());
            integration.setLastSyncAt(Instant.now());
            calendarIntegrationRepository.save(integration);
            return;
        }

        if (result.notModified()) {
            integration.setLastSyncAt(Instant.now());
            integration.setLastSyncStatus("SUCCESS");
            calendarIntegrationRepository.save(integration);
            return;
        }

        List<ParsedReservation> parsed = icalParser.parse(result.content());
        int created = 0, updated = 0, cancelled = 0;

        UUID orgId = propertyRepository.findById(integration.getPropertyId())
                .map(p -> p.getOrganizationId())
                .orElse(null);

        boolean automationEnabled = orgId != null && organizationRepository.findById(orgId)
                .map(Organization::isAutomationEnabled)
                .orElse(false);

        for (ParsedReservation pr : parsed) {
            try {
                SyncResult syncResult = upsertReservation(integration.getPropertyId(), orgId, automationEnabled, pr);
                switch (syncResult) {
                    case CREATED -> created++;
                    case UPDATED -> updated++;
                    case SKIPPED -> {}
                }
            } catch (Exception e) {
                log.warn("Failed to sync reservation {}: {}", pr.getUid(), e.getMessage());
            }
        }

        integration.setLastSyncAt(Instant.now());
        integration.setLastSyncStatus("SUCCESS");
        integration.setLastSyncError(null);
        integration.setEtag(result.etag());
        integration.setReservationsSynced(integration.getReservationsSynced() + created);
        calendarIntegrationRepository.save(integration);

        log.info("Calendar sync complete for {}: +{} new, {} updated", integration.getId(), created, updated);
    }

    private SyncResult upsertReservation(UUID propertyId, UUID orgId, boolean automationEnabled, ParsedReservation pr) {
        Optional<Reservation> existing = reservationRepository.findByPropertyIdAndIcalUid(propertyId, pr.getUid());

        if (existing.isPresent()) {
            Reservation res = existing.get();
            if (!res.getCheckInDate().equals(pr.getStartDate()) || !res.getCheckOutDate().equals(pr.getEndDate())) {
                // Release old calendar interval before registering new dates
                try {
                    calendarEngine.cancelBookingDates(res.getId());
                } catch (Exception e) {
                    log.warn("Could not cancel old calendar interval for iCal reservation {}: {}", res.getId(), e.getMessage());
                }
                res.setCheckInDate(pr.getStartDate());
                res.setCheckOutDate(pr.getEndDate());
                res.setGuestName(pr.getGuestName());
                res.setGuestEmail(pr.getGuestEmail());
                res.setSyncedAt(Instant.now());
                reservationRepository.save(res);
                // Register new dates (future only)
                LocalDate newCheckIn  = pr.getStartDate().atZone(ZoneOffset.UTC).toLocalDate();
                LocalDate newCheckOut = pr.getEndDate().atZone(ZoneOffset.UTC).toLocalDate();
                if (!newCheckIn.isBefore(LocalDate.now())) {
                    try {
                        calendarEngine.registerBookedInterval(
                                propertyId, newCheckIn, newCheckOut,
                                res.getId(), pr.getSummary() != null ? pr.getSummary() : "iCal update");
                    } catch (Exception e) {
                        log.warn("Could not register updated calendar interval for iCal reservation {}: {}", res.getId(), e.getMessage());
                    }
                }
                return SyncResult.UPDATED;
            }
            return SyncResult.SKIPPED;
        }

        ReservationSource source = detectSource(pr.getSummary());
        UUID guestId = null;
        if (pr.getGuestEmail() != null && orgId != null) {
            guestId = guestService.upsertGuest(orgId, pr.getGuestEmail(), pr.getGuestName()).getId();
        }

        Reservation reservation = Reservation.builder()
                .propertyId(propertyId)
                .guestId(guestId)
                .icalUid(pr.getUid())
                .source(source)
                .status(ReservationStatus.CONFIRMED)
                .checkInDate(pr.getStartDate())
                .checkOutDate(pr.getEndDate())
                .timezone(pr.getTimezone() != null ? pr.getTimezone() : "UTC")
                .guestName(pr.getGuestName())
                .guestEmail(pr.getGuestEmail())
                .checkinCode(generateCheckinCode())
                .syncedAt(Instant.now())
                .build();

        reservation = reservationRepository.save(reservation);

        // Register in CalendarEngine to block these dates for direct bookings (future only)
        LocalDate checkIn  = pr.getStartDate().atZone(ZoneOffset.UTC).toLocalDate();
        LocalDate checkOut = pr.getEndDate().atZone(ZoneOffset.UTC).toLocalDate();
        if (!checkIn.isBefore(LocalDate.now())) {
            try {
                calendarEngine.registerBookedInterval(
                        propertyId, checkIn, checkOut,
                        reservation.getId(), pr.getSummary() != null ? pr.getSummary() : "iCal import");
            } catch (Exception e) {
                log.warn("Could not register calendar interval for iCal reservation {} on property {}: {}",
                        pr.getUid(), propertyId, e.getMessage());
            }
        }

        if (orgId != null && automationEnabled) {
            eventPublisher.publishEvent(new ReservationCreatedEvent(this, reservation.getId(), orgId));
        }

        return SyncResult.CREATED;
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

    private ReservationSource detectSource(String summary) {
        if (summary == null) return ReservationSource.OTHER;
        String lower = summary.toLowerCase();
        if (lower.contains("airbnb")) return ReservationSource.AIRBNB;
        if (lower.contains("booking")) return ReservationSource.BOOKING;
        if (lower.contains("vrbo") || lower.contains("homeaway")) return ReservationSource.VRBO;
        return ReservationSource.OTHER;
    }

    private enum SyncResult { CREATED, UPDATED, SKIPPED }
}
