package com.smartlock.dto.response.admin;

import com.smartlock.domain.ErrorLog;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class AdminErrorLogResponse {
    private UUID id;
    private UUID userId;
    private String userEmail;
    private String errorCode;
    private int httpStatus;
    private String message;
    private String requestPath;
    private String stackTrace;
    private Instant createdAt;

    public static AdminErrorLogResponse from(ErrorLog e) {
        return AdminErrorLogResponse.builder()
                .id(e.getId())
                .userId(e.getUserId())
                .userEmail(e.getUserEmail())
                .errorCode(e.getErrorCode())
                .httpStatus(e.getHttpStatus())
                .message(e.getMessage())
                .requestPath(e.getRequestPath())
                .stackTrace(e.getStackTrace())
                .createdAt(e.getCreatedAt())
                .build();
    }
}
