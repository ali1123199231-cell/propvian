package com.smartlock.integration.ical;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
@RequiredArgsConstructor
@Slf4j
public class ICalFetcher {

    private final RestTemplate restTemplate;

    public FetchResult fetch(String url, String etag) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set(HttpHeaders.ACCEPT, "text/calendar,application/ics");
            if (etag != null) {
                headers.set(HttpHeaders.IF_NONE_MATCH, etag);
            }

            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.GET, new HttpEntity<>(headers), String.class
            );

            if (response.getStatusCode() == HttpStatus.NOT_MODIFIED) {
                return FetchResult.unchanged();
            }

            String newEtag = response.getHeaders().getFirst(HttpHeaders.ETAG);
            return FetchResult.success(response.getBody(), newEtag);
        } catch (Exception e) {
            log.error("Failed to fetch iCal from {}: {}", url, e.getMessage());
            return FetchResult.error(e.getMessage());
        }
    }

    public record FetchResult(boolean success, boolean notModified, String content, String etag, String error) {
        public static FetchResult success(String content, String etag) {
            return new FetchResult(true, false, content, etag, null);
        }

        public static FetchResult unchanged() {
            return new FetchResult(true, true, null, null, null);
        }

        public static FetchResult error(String error) {
            return new FetchResult(false, false, null, null, error);
        }
    }
}
