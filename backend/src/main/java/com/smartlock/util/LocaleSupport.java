package com.smartlock.util;

import java.util.List;
import java.util.Locale;

/**
 * Single source of truth for which languages the backend will honour.
 *
 * Mirrors {@code frontend/src/lib/i18n/config.ts} — when a language is added,
 * it must be added in both places, and a matching
 * {@code messages_<code>.properties} bundle must exist or email silently falls
 * back to English.
 */
public final class LocaleSupport {

    public static final String DEFAULT_LANGUAGE = "en";

    public static final List<String> SUPPORTED = List.of("en", "es", "it", "pl");

    private LocaleSupport() {
    }

    /**
     * Reduces any incoming tag to a supported language code.
     * "es-419", "ES_es", "es" all become "es"; anything unsupported becomes "en".
     */
    public static String normalize(String raw) {
        if (raw == null || raw.isBlank()) return DEFAULT_LANGUAGE;
        String base = raw.trim().toLowerCase(Locale.ROOT).split("[-_]")[0];
        return SUPPORTED.contains(base) ? base : DEFAULT_LANGUAGE;
    }

    public static boolean isSupported(String raw) {
        return raw != null && SUPPORTED.contains(raw.trim().toLowerCase(Locale.ROOT).split("[-_]")[0]);
    }

    /** Locale for Thymeleaf message resolution. Never null. */
    public static Locale toLocale(String raw) {
        return Locale.forLanguageTag(normalize(raw));
    }
}
