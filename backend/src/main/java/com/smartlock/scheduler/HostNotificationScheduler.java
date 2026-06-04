package com.smartlock.scheduler;

import com.smartlock.domain.AccessCode;
import com.smartlock.domain.Organization;
import com.smartlock.domain.Property;
import com.smartlock.domain.Reservation;
import com.smartlock.domain.User;
import com.smartlock.domain.enums.AccessCodeStatus;
import com.smartlock.repository.AccessCodeRepository;
import com.smartlock.repository.OrganizationRepository;
import com.smartlock.repository.PropertyRepository;
import com.smartlock.repository.ReservationRepository;
import com.smartlock.repository.UserRepository;
import com.smartlock.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class HostNotificationScheduler {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("d MMM yyyy HH:mm");

    private final OrganizationRepository organizationRepository;
    private final PropertyRepository propertyRepository;
    private final ReservationRepository reservationRepository;
    private final AccessCodeRepository accessCodeRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final com.smartlock.service.BillingService billingService;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Scheduled(fixedDelay = 3600000)
    @Transactional
    public void notifyHosts() {
        List<Organization> activeOrgs = organizationRepository.findByAutomationEnabledTrue();
        log.debug("Host notification check for {} orgs with automation enabled", activeOrgs.size());

        Instant now = Instant.now();
        Instant windowStart = now.plus(1, ChronoUnit.HOURS);
        Instant windowEnd = now.plus(48, ChronoUnit.HOURS);

        for (Organization org : activeOrgs) {
            try {
                if (!billingService.isAccessActive(org.getId())) {
                    log.debug("Skipping host notifications for org {} — subscription inactive", org.getId());
                    continue;
                }
                processOrg(org, windowStart, windowEnd);
            } catch (Exception e) {
                log.error("Host notification failed for org {}: {}", org.getId(), e.getMessage());
            }
        }
    }

    private void processOrg(Organization org, Instant windowStart, Instant windowEnd) {
        List<Property> properties = propertyRepository.findByOrganizationId(org.getId());
        if (properties.isEmpty()) return;

        List<java.util.UUID> propertyIds = properties.stream().map(Property::getId).toList();
        List<Reservation> pending = reservationRepository.findPendingHostNotifications(propertyIds, windowStart, windowEnd);

        if (pending.isEmpty()) return;

        Optional<User> ownerOpt = userRepository.findById(org.getOwnerId());
        if (ownerOpt.isEmpty()) return;
        String hostEmail = ownerOpt.get().getEmail();

        for (Reservation reservation : pending) {
            try {
                Property property = properties.stream()
                        .filter(p -> p.getId().equals(reservation.getPropertyId()))
                        .findFirst()
                        .orElse(null);
                if (property == null) continue;

                List<AccessCode> activeCodes = accessCodeRepository.findByReservationId(reservation.getId())
                        .stream()
                        .filter(ac -> ac.getStatus() == AccessCodeStatus.ACTIVE)
                        .toList();

                ZoneId zone = safeZone(reservation.getTimezone());
                String checkIn = FORMATTER.format(reservation.getCheckInDate().atZone(zone));
                String checkOut = FORMATTER.format(reservation.getCheckOutDate().atZone(zone));
                String checkinPageUrl = reservation.getCheckinCode() != null
                        ? frontendUrl + "/checkin/" + reservation.getCheckinCode()
                        : null;

                if (!activeCodes.isEmpty()) {
                    // Send full notification with access PIN
                    AccessCode code = activeCodes.get(0);
                    emailService.sendHostNotificationEmail(
                            hostEmail,
                            reservation.getGuestName(),
                            property.getName(),
                            code.getPin(),
                            checkIn,
                            checkOut,
                            checkinPageUrl
                    );
                } else {
                    // Send notification without PIN (no lock configured)
                    emailService.sendNewReservationEmail(
                            hostEmail,
                            reservation.getGuestName(),
                            property.getName(),
                            checkIn,
                            checkOut,
                            reservation.getSource() != null ? reservation.getSource().name() : "MANUAL",
                            frontendUrl + "/reservations"
                    );
                }

                reservation.setHostNotifiedAt(Instant.now());
                reservationRepository.save(reservation);
                log.info("Host notification sent for reservation {} to {}", reservation.getId(), hostEmail);

            } catch (Exception e) {
                log.error("Failed to notify host for reservation {}: {}", reservation.getId(), e.getMessage());
            }
        }
    }

    private ZoneId safeZone(String timezone) {
        try {
            return ZoneId.of(timezone);
        } catch (Exception e) {
            return ZoneId.of("UTC");
        }
    }
}
