package com.smartlock.integration.ical;

import com.smartlock.exception.AppException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.net.InetAddress;
import java.net.URI;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class ICalFetcher {

    private final RestTemplate restTemplate;

    private static final Set<String> ALLOWED_SCHEMES = Set.of("https", "http");

    public FetchResult fetch(String url, String etag) {
        validateUrl(url);
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
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to fetch iCal from {}: {}", url, e.getMessage());
            return FetchResult.error(e.getMessage());
        }
    }

    /**
     * Validates a URL against SSRF attack vectors.
     * Blocks private IP ranges, loopback, link-local, and non-HTTP(S) schemes.
     */
    private void validateUrl(String url) {
        if (url == null || url.isBlank()) {
            throw new AppException("iCal URL is required", HttpStatus.BAD_REQUEST, "INVALID_ICAL_URL");
        }
        try {
            URI uri = URI.create(url);
            String scheme = uri.getScheme();
            if (scheme == null || !ALLOWED_SCHEMES.contains(scheme.toLowerCase())) {
                throw new AppException("iCal URL must use http or https", HttpStatus.BAD_REQUEST, "INVALID_ICAL_URL");
            }
            String host = uri.getHost();
            if (host == null || host.isBlank()) {
                throw new AppException("Invalid iCal URL host", HttpStatus.BAD_REQUEST, "INVALID_ICAL_URL");
            }
            // Block SSRF: resolve hostname and check address ranges
            InetAddress address = InetAddress.getByName(host);
            if (address.isLoopbackAddress() || address.isSiteLocalAddress()
                    || address.isLinkLocalAddress() || address.isAnyLocalAddress()
                    || isCloudMetadataAddress(address)) {
                throw new AppException("iCal URL points to a private or reserved address", HttpStatus.BAD_REQUEST, "INVALID_ICAL_URL");
            }
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException("Invalid iCal URL: " + e.getMessage(), HttpStatus.BAD_REQUEST, "INVALID_ICAL_URL");
        }
    }

    /** Blocks cloud metadata endpoints (AWS 169.254.169.254, GCP 169.254.169.254, Azure 169.254.169.254). */
    private boolean isCloudMetadataAddress(InetAddress address) {
        byte[] bytes = address.getAddress();
        if (bytes.length == 4) {
            // 169.254.x.x (link-local / cloud metadata)
            return (bytes[0] & 0xFF) == 169 && (bytes[1] & 0xFF) == 254;
        }
        return false;
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
