package com.smartlock.dto.response.lock;

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
public class LockResponse {
    private UUID id;
    private UUID propertyId;
    private String name;
    private Long ttlockLockId;
    private String ttlockLockAlias;
    private Integer batteryLevel;
    private String status;
    private Instant lastSyncAt;
    private Instant tokenExpiresAt;
    private String notes;
    private Instant createdAt;
}
