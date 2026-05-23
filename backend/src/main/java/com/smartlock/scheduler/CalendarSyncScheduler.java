package com.smartlock.scheduler;

import com.smartlock.service.CalendarSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class CalendarSyncScheduler {

    private final CalendarSyncService calendarSyncService;

    @Scheduled(fixedDelayString = "${scheduler.calendar-sync.delay-ms:900000}")
    public void syncAllCalendars() {
        log.debug("Running scheduled calendar sync");
        calendarSyncService.syncAll();
    }
}
