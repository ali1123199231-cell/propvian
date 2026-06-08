package com.smartlock.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.util.Set;
import java.util.UUID;

/**
 * Logs every HTTP request/response with method, URL, status, and duration.
 *
 * Security rules:
 *  - Request bodies are never logged for sensitive auth endpoints.
 *  - Response bodies are only logged on 4xx/5xx (truncated to 2000 chars).
 *  - MDC key "requestId" is available to all log statements within the request.
 *
 * To disable: set logging.level.com.smartlock.filter.RequestLoggingFilter=WARN
 */
@Slf4j
@Component
@Order(1)
public class RequestLoggingFilter extends OncePerRequestFilter {

    private static final int MAX_BODY_CHARS = 2000;

    // Never log request bodies for these paths (contain passwords / tokens)
    private static final Set<String> SENSITIVE_PATHS = Set.of(
        "/auth/login",
        "/auth/register",
        "/auth/reset-password",
        "/auth/refresh",
        "/auth/forgot-password"
    );

    // Skip entirely — too noisy, no diagnostic value
    private static final Set<String> SKIP_PATHS = Set.of(
        "/actuator/health",
        "/actuator/info"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        String uri = request.getRequestURI();

        if (SKIP_PATHS.stream().anyMatch(uri::startsWith)) {
            chain.doFilter(request, response);
            return;
        }

        String requestId = UUID.randomUUID().toString().substring(0, 8);
        MDC.put("requestId", requestId);

        ContentCachingRequestWrapper wrappedReq = new ContentCachingRequestWrapper(request);
        ContentCachingResponseWrapper wrappedRes = new ContentCachingResponseWrapper(response);

        long startMs = System.currentTimeMillis();
        String method = request.getMethod();
        String query = request.getQueryString();
        String fullUri = query != null ? uri + "?" + query : uri;

        log.debug("→ {} {} [rid={}]", method, fullUri, requestId);

        try {
            chain.doFilter(wrappedReq, wrappedRes);
        } finally {
            long elapsed = System.currentTimeMillis() - startMs;
            int status = wrappedRes.getStatus();

            if (status >= 500) {
                String body = readBody(wrappedRes);
                log.error("← {} {} {} {}ms [rid={}] body={}", method, fullUri, status, elapsed, requestId, truncate(body));
            } else if (status >= 400) {
                String body = readBody(wrappedRes);
                log.warn("← {} {} {} {}ms [rid={}] body={}", method, fullUri, status, elapsed, requestId, truncate(body));
            } else {
                log.debug("← {} {} {} {}ms [rid={}]", method, fullUri, status, elapsed, requestId);
            }

            wrappedRes.copyBodyToResponse();
            MDC.remove("requestId");
        }
    }

    private boolean isSensitive(String uri) {
        return SENSITIVE_PATHS.stream().anyMatch(uri::contains);
    }

    private String readBody(ContentCachingResponseWrapper response) {
        try {
            byte[] bytes = response.getContentAsByteArray();
            if (bytes.length == 0) return "";
            String encoding = response.getCharacterEncoding();
            return new String(bytes, encoding != null ? encoding : "UTF-8");
        } catch (Exception e) {
            return "[unreadable]";
        }
    }

    private String truncate(String s) {
        if (s == null || s.isBlank()) return "";
        return s.length() <= MAX_BODY_CHARS ? s : s.substring(0, MAX_BODY_CHARS) + "…[truncated]";
    }
}
