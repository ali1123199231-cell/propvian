package com.smartlock.service;

import com.smartlock.domain.ErrorLog;
import com.smartlock.repository.ErrorLogRepository;
import com.smartlock.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ErrorLogService {

    private final ErrorLogRepository errorLogRepository;

    @Async
    public void record(HttpStatus status, String errorCode, String message, String requestPath, Throwable cause) {
        try {
            UUID userId = null;
            String userEmail = null;

            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof CustomUserDetails principal) {
                userId = principal.getUserId();
                userEmail = principal.getEmail();
            }

            String stackTrace = null;
            if (cause != null && status.is5xxServerError()) {
                StringWriter sw = new StringWriter();
                cause.printStackTrace(new PrintWriter(sw));
                stackTrace = sw.toString();
            }

            ErrorLog entry = ErrorLog.builder()
                    .userId(userId)
                    .userEmail(userEmail)
                    .errorCode(errorCode)
                    .httpStatus(status.value())
                    .message(message)
                    .requestPath(requestPath)
                    .stackTrace(stackTrace)
                    .build();

            errorLogRepository.save(entry);
        } catch (Exception e) {
            log.warn("Failed to persist error log: {}", e.getMessage());
        }
    }
}
