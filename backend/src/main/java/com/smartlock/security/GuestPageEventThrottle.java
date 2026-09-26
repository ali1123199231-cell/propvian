package com.smartlock.security;

import org.springframework.stereotype.Component;

import java.util.concurrent.ConcurrentHashMap;

/**
 * Keeps refresh storms and scripted hammering out of the public guest-page log:
 * the same client, code and event type count once per minute. Guests sharing the
 * rental's WiFi share one public IP, so the window stays short.
 */
@Component
public class GuestPageEventThrottle {

    private static final long WINDOW_MS = 60_000;
    private static final int MAX_KEYS = 50_000;

    private final ConcurrentHashMap<String, Long> lastSeen = new ConcurrentHashMap<>();

    public boolean allow(String key) {
        long now = System.currentTimeMillis();
        if (lastSeen.size() > MAX_KEYS) {
            lastSeen.entrySet().removeIf(e -> now - e.getValue() > WINDOW_MS);
            if (lastSeen.size() > MAX_KEYS) lastSeen.clear();   // flood from many addresses: start over
        }
        Long previous = lastSeen.put(key, now);
        return previous == null || now - previous > WINDOW_MS;
    }
}
