package com.smartlock.dto.response.notification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    private UUID id;
    private String type;
    private String title;
    private String body;
    private String entityType;
    private UUID entityId;
    private String actionUrl;
    private boolean read;
    private Instant readAt;
    private Instant createdAt;
}
