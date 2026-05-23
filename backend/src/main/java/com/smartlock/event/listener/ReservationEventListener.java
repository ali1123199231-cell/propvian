package com.smartlock.event.listener;

import com.smartlock.domain.AccessCode;
import com.smartlock.domain.Reservation;
import com.smartlock.domain.enums.NotificationType;
import com.smartlock.event.ReservationCancelledEvent;
import com.smartlock.event.ReservationCheckedOutEvent;
import com.smartlock.event.ReservationCreatedEvent;
import com.smartlock.repository.ReservationRepository;
import com.smartlock.service.AccessCodeService;
import com.smartlock.service.CleanerTaskService;
import com.smartlock.service.EmailService;
import com.smartlock.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class ReservationEventListener {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("MMM d, yyyy HH:mm");

    private final AccessCodeService accessCodeService;
    private final CleanerTaskService cleanerTaskService;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final ReservationRepository reservationRepository;

    @Async
    @TransactionalEventListener
    public void onReservationCreated(ReservationCreatedEvent event) {
        log.info("Processing ReservationCreatedEvent for {}", event.getReservationId());
        try {
            List<AccessCode> codes = accessCodeService.createForReservation(event.getReservationId());

            reservationRepository.findById(event.getReservationId()).ifPresent(reservation -> {
                if (reservation.getGuestEmail() != null && !codes.isEmpty()) {
                    String pin = codes.get(0).getPin();
                    ZoneId zone = safeZone(reservation.getTimezone());
                    String checkIn = FORMATTER.format(reservation.getCheckInDate().atZone(zone));
                    String checkOut = FORMATTER.format(reservation.getCheckOutDate().atZone(zone));
                    emailService.sendGuestAccessEmail(
                            reservation.getGuestEmail(),
                            reservation.getGuestName() != null ? reservation.getGuestName() : "Guest",
                            "Your Property",
                            pin, checkIn, checkOut
                    );
                }
            });
        } catch (Exception e) {
            log.error("Error processing ReservationCreatedEvent {}: {}", event.getReservationId(), e.getMessage());
        }
    }

    @Async
    @TransactionalEventListener
    public void onReservationCancelled(ReservationCancelledEvent event) {
        log.info("Processing ReservationCancelledEvent for {}", event.getReservationId());
        try {
            accessCodeService.revokeAccessCodesForReservation(event.getReservationId());
        } catch (Exception e) {
            log.error("Error processing ReservationCancelledEvent {}: {}", event.getReservationId(), e.getMessage());
        }
    }

    @Async
    @TransactionalEventListener
    public void onReservationCheckedOut(ReservationCheckedOutEvent event) {
        log.info("Processing ReservationCheckedOutEvent for {}", event.getReservationId());
        try {
            accessCodeService.revokeAccessCodesForReservation(event.getReservationId());
            cleanerTaskService.createCleanerTask(event.getReservationId(), event.getOrganizationId());
        } catch (Exception e) {
            log.error("Error processing ReservationCheckedOutEvent {}: {}", event.getReservationId(), e.getMessage());
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
