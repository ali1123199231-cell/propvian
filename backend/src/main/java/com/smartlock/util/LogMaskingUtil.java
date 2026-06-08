package com.smartlock.util;

/**
 * PII masking helpers for log statements.
 * Use these whenever logging data that might contain personal information.
 * Never log passwords, tokens, or card numbers directly.
 */
public final class LogMaskingUtil {

    private LogMaskingUtil() {}

    /**
     * ali***@gmail.com — shows first 3 chars of local part
     */
    public static String maskEmail(String email) {
        if (email == null) return "[null]";
        int at = email.indexOf('@');
        if (at <= 0) return "***@***";
        String local = email.substring(0, at);
        String domain = email.substring(at);
        int visible = Math.min(3, local.length());
        return local.substring(0, visible) + "***" + domain;
    }

    /**
     * ***-***-1234 — shows last 4 digits only
     */
    public static String maskPhone(String phone) {
        if (phone == null) return "[null]";
        String digits = phone.replaceAll("\\D", "");
        if (digits.length() < 4) return "***";
        return "***-***-" + digits.substring(digits.length() - 4);
    }

    /**
     * A*** K*** — first initial + asterisks per word
     */
    public static String maskName(String name) {
        if (name == null) return "[null]";
        String[] parts = name.trim().split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String part : parts) {
            if (sb.length() > 0) sb.append(' ');
            sb.append(part.isEmpty() ? "" : part.charAt(0) + "***");
        }
        return sb.toString();
    }

    /**
     * Short UUID prefix for readable log correlation without full exposure.
     */
    public static String shortId(Object id) {
        if (id == null) return "[null]";
        String s = id.toString();
        return s.length() > 8 ? s.substring(0, 8) + "…" : s;
    }

    /**
     * Never log token values — just confirm presence.
     */
    public static String hasToken(String token) {
        return token != null && !token.isBlank() ? "present" : "absent";
    }
}
