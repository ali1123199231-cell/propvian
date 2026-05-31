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

    private static final Pattern AIRBNB_URL  = Pattern.compile("https?://(www\\.)?airbnb\\.(com|[a-z]{2,3})/rooms/\\d+");
    private static final Pattern BOOKING_URL = Pattern.compile("https?://(www\\.)?booking\\.com/hotel/");
    private static final Pattern VRBO_URL    = Pattern.compile("https?://(www\\.)?vrbo\\.com/\\d+");
    private static final Pattern REVIEW_NUM  = Pattern.compile("(\\d+)\\s*(reviews?|ratings?|avis|bewertungen)", Pattern.CASE_INSENSITIVE);
    private static final Pattern AIRBNB_META = Pattern.compile("\"reviewsCount\"\\s*:\\s*(\\d+)");
    private static final Pattern RATING_COUNT= Pattern.compile("\\((\\d+)\\)");

    public record OtaVerificationResult(
            boolean urlValid,
            boolean accessible,
            int reviewCount,
            boolean autoApproved,
            String note
    ) {}

    public OtaVerificationResult verify(String url) {
        if (url == null || url.isBlank()) {
            return new OtaVerificationResult(false, false, 0, false, "No URL provided");
        }

        boolean urlValid = isValidOtaUrl(url);
        if (!urlValid) {
            return new OtaVerificationResult(false, false, 0, false,
                    "URL must be from Airbnb, Booking.com, or VRBO");
        }

        String body = fetchPage(url);
        if (body == null) {
            return new OtaVerificationResult(true, false, 0, false,
                    "Could not reach your listing. Make sure it's public and published.");
        }

        int reviewCount = extractReviewCount(body);
        boolean approved = reviewCount >= 3;
        String note;
        if (approved) {
            note = "Verified — " + reviewCount + " reviews found";
        } else if (reviewCount > 0) {
            note = "Your listing has " + reviewCount + " review(s). We require at least 3 reviews. "
                 + "We currently work only with experienced hosts.";
        } else {
            note = "We currently work only with experienced hosts who have at least 3 reviews.";
        }

        return new OtaVerificationResult(true, true, reviewCount, approved, note);
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
                    url, HttpMethod.GET, new HttpEntity<>(headers), String.class
            );

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

        // Try Airbnb JSON metadata first
        Matcher meta = AIRBNB_META.matcher(html);
        if (meta.find()) {
            try { return Integer.parseInt(meta.group(1)); } catch (NumberFormatException ignored) {}
        }

        // Try "X reviews" pattern
        Matcher review = REVIEW_NUM.matcher(html);
        int max = 0;
        while (review.find()) {
            try {
                int n = Integer.parseInt(review.group(1));
                if (n > max) max = n;
            } catch (NumberFormatException ignored) {}
        }
        if (max > 0) return max;

        // Fallback: look for "(X)" rating count pattern
        Matcher rating = RATING_COUNT.matcher(html);
        while (rating.find()) {
            try {
                int n = Integer.parseInt(rating.group(1));
                if (n > max && n < 100000) max = n; // sanity check
            } catch (NumberFormatException ignored) {}
        }
        return max;
    }
}
