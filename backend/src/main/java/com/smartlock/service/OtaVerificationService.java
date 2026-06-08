package com.smartlock.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtaVerificationService {

    private final RestTemplate restTemplate;
    private final SystemConfigService systemConfigService;

    private static final Pattern AIRBNB_URL  = Pattern.compile("https?://(www\\.)?airbnb\\.(com|[a-z]{2,3})/rooms/\\d+");
    private static final Pattern BOOKING_URL = Pattern.compile("https?://(www\\.)?booking\\.com/hotel/");
    private static final Pattern VRBO_URL    = Pattern.compile("https?://(www\\.)?vrbo\\.com/\\d+");

    // Airbnb embeds listing data as "reviewCount":N (not "reviewsCount")
    private static final Pattern AIRBNB_JSON_COUNT  = Pattern.compile("\"reviewCount\"\\s*:\\s*(\\d+)");
    // Booking.com JSON review count
    private static final Pattern BOOKING_JSON_COUNT = Pattern.compile("\"reviewScore\"\\s*:[^}]*\"reviewCount\"\\s*:\\s*(\\d+)");
    // Strict "N reviews" text — negative lookbehind excludes comma to skip "9,160 reviews" → "160"
    private static final Pattern STRICT_REVIEW_TEXT = Pattern.compile("(?<![,/\\w])(\\d{1,5})\\s+reviews?(?![\\w/])", Pattern.CASE_INSENSITIVE);

    // "Hosted by FirstName" — appears consistently in Airbnb and VRBO pages
    private static final Pattern HOSTED_BY = Pattern.compile("[Hh]osted by ([A-Z][a-zA-Z\\-]{1,30})(?:[\"<,\\.\\s]|$)");

    public record OtaVerificationResult(
            boolean urlValid,
            boolean accessible,
            int reviewCount,
            String hostName,
            boolean nameMatches,
            boolean autoApproved,
            String note
    ) {}

    public OtaVerificationResult verify(String url, String userFirstName) {
        if (url == null || url.isBlank()) {
            return new OtaVerificationResult(false, false, 0, null, false, false, "No URL provided");
        }

        boolean urlValid = isValidOtaUrl(url);
        if (!urlValid) {
            return new OtaVerificationResult(false, false, 0, null, false, false,
                    "URL must be from Airbnb, Booking.com, or VRBO");
        }

        String body = fetchPage(url);
        if (body == null) {
            return new OtaVerificationResult(true, false, 0, null, false, false,
                    "Your listing has been submitted for review.");
        }

        int reviewCount = extractReviewCount(body);
        String hostName  = extractHostName(body);
        boolean nameMatches = matchesFirstName(hostName, userFirstName);

        log.info("OTA verify: url={} reviewCount={} hostName={} userFirstName={} nameMatches={}",
                url, reviewCount, hostName, userFirstName, nameMatches);

        int minReviews;
        try { minReviews = Integer.parseInt(systemConfigService.get("verification.ota_min_reviews", "3")); }
        catch (NumberFormatException e) { minReviews = 3; }
        if (reviewCount >= minReviews) {
            return new OtaVerificationResult(true, true, reviewCount, hostName, nameMatches, true,
                    "Verified");
        }

        return new OtaVerificationResult(true, true, reviewCount, hostName, nameMatches, false,
                "Your listing has been submitted for review.");
    }

    private boolean matchesFirstName(String hostName, String userFirstName) {
        if (hostName == null || userFirstName == null || userFirstName.isBlank()) return false;
        // Compare first word of host name against user's first name (case-insensitive)
        String hostFirst = hostName.trim().split("[\\s\\-]+")[0];
        String userFirst = userFirstName.trim().split("[\\s\\-]+")[0];
        return hostFirst.equalsIgnoreCase(userFirst);
    }

    private boolean isValidOtaUrl(String url) {
        return AIRBNB_URL.matcher(url).find()
            || BOOKING_URL.matcher(url).find()
            || VRBO_URL.matcher(url).find();
    }

    private String fetchPage(String url) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set(HttpHeaders.USER_AGENT,
                    "Mozilla/5.0 (compatible; PropvianBot/1.0; +https://propvian.com/bot)");
            headers.set(HttpHeaders.ACCEPT, "text/html,application/xhtml+xml");
            headers.set(HttpHeaders.ACCEPT_LANGUAGE, "en-US,en;q=0.9");

            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.GET, new HttpEntity<>(headers), String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                return response.getBody();
            }
        } catch (Exception e) {
            log.warn("OTA fetch failed for {}: {}", url, e.getMessage());
        }
        return null;
    }

    private int extractReviewCount(String html) {
        if (html == null) return 0;

        // 1. Airbnb JSON "reviewCount":N — first occurrence is the listing's own data
        Matcher airbnbJson = AIRBNB_JSON_COUNT.matcher(html);
        if (airbnbJson.find()) {
            try {
                int n = Integer.parseInt(airbnbJson.group(1));
                if (n >= 0 && n < 100000) {
                    log.debug("OTA review count from Airbnb JSON: {}", n);
                    return n;
                }
            } catch (NumberFormatException ignored) {}
        }

        // 2. Booking.com JSON review count
        Matcher bookingJson = BOOKING_JSON_COUNT.matcher(html);
        if (bookingJson.find()) {
            try {
                int n = Integer.parseInt(bookingJson.group(1));
                if (n >= 0 && n < 100000) {
                    log.debug("OTA review count from Booking JSON: {}", n);
                    return n;
                }
            } catch (NumberFormatException ignored) {}
        }

        // 3. Strict "N reviews" text — first match only (listing data appears before related listings)
        Matcher reviewText = STRICT_REVIEW_TEXT.matcher(html);
        if (reviewText.find()) {
            try {
                int n = Integer.parseInt(reviewText.group(1));
                if (n > 0 && n < 10000) {
                    log.debug("OTA review count from text pattern: {}", n);
                    return n;
                }
            } catch (NumberFormatException ignored) {}
        }

        return 0;
    }

    private String extractHostName(String html) {
        if (html == null) return null;
        Matcher m = HOSTED_BY.matcher(html);
        if (m.find()) {
            String name = m.group(1).trim();
            log.debug("OTA host name extracted: {}", name);
            return name;
        }
        return null;
    }
}
