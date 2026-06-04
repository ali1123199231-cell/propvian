package com.smartlock.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Periodically cleans up expired booking holds and their associated
 * RESERVED calendar intervals, restoring dates to available.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class HoldExpirationScheduler {

    private final CalendarEngine calendarEngine;

    // Runs every 60 seconds; short enough that guests see dates freed promptly
    @Scheduled(fixedDelay = 60_000)
    public void expireHolds() {
        try {
            int expired = calendarEngine.expireStaleHolds();
            if (expired > 0) {
                log.info("HoldExpirationScheduler: expired {} holds", expired);
            }
        } catch (Exception e) {
            log.error("HoldExpirationScheduler: unexpected error during cleanup", e);
        }
    }
}
