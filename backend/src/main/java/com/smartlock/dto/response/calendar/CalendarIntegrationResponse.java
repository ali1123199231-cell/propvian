package com.smartlock.dto.response.calendar;

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
public class CalendarIntegrationResponse {
    private UUID id;
    private UUID propertyId;
    private String platform;
    private String icalUrl;
    private String displayName;
    private Instant lastSyncAt;
    private String lastSyncStatus;
    private String lastSyncError;
    private Integer syncIntervalMinutes;
    private Boolean enabled;
    private Integer reservationsSynced;
    private Instant createdAt;
}
