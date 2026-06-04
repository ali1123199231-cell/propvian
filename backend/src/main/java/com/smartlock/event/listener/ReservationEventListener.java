package com.smartlock.event.listener;

import com.smartlock.event.ReservationCancelledEvent;
import com.smartlock.event.ReservationCheckedOutEvent;
import com.smartlock.event.ReservationCreatedEvent;
import com.smartlock.service.AccessCodeService;
import com.smartlock.service.CalendarEngine;
import com.smartlock.service.CleanerTaskService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
@Slf4j
public class ReservationEventListener {

    private final AccessCodeService accessCodeService;
    private final CleanerTaskService cleanerTaskService;
    private final CalendarEngine calendarEngine;

    @Async
    @TransactionalEventListener
    public void onReservationCreated(ReservationCreatedEvent event) {
        log.info("Processing ReservationCreatedEvent for {}", event.getReservationId());
        try {
            accessCodeService.createForReservation(event.getReservationId());
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
            log.error("Error revoking access codes for cancelled reservation {}: {}", event.getReservationId(), e.getMessage());
        }
        try {
            calendarEngine.cancelBookingDates(event.getReservationId());
        } catch (Exception e) {
            log.warn("Could not clear calendar interval for cancelled reservation {} (may not have one): {}",
                    event.getReservationId(), e.getMessage());
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

}
