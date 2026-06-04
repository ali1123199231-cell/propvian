package com.smartlock.security;

import com.smartlock.exception.AppException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Simple sliding-window rate limiter for login and registration endpoints.
 * Limits each IP to MAX_ATTEMPTS within WINDOW_SECONDS.
 */
@Component
public class LoginRateLimiter {

    private static final int MAX_ATTEMPTS = 10;
    private static final long WINDOW_SECONDS = 60;

    private final ConcurrentHashMap<String, WindowEntry> windows = new ConcurrentHashMap<>();

    public void check(String ipAddress) {
        windows.compute(ipAddress, (ip, entry) -> {
            long now = Instant.now().getEpochSecond();
            if (entry == null || now - entry.windowStart > WINDOW_SECONDS) {
                return new WindowEntry(now, new AtomicInteger(1));
            }
            int count = entry.count.incrementAndGet();
            if (count > MAX_ATTEMPTS) {
                throw new AppException(
                        "Too many attempts. Please wait a minute before trying again.",
                        HttpStatus.TOO_MANY_REQUESTS, "RATE_LIMITED");
            }
            return entry;
        });
    }

    private record WindowEntry(long windowStart, AtomicInteger count) {}
}
