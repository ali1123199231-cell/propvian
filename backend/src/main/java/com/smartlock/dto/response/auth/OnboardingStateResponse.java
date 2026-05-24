package com.smartlock.dto.response.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OnboardingStateResponse {
    private String step;
    private boolean completed;
    private Long pendingTtlockLockId;
    private String pendingTtlockLockName;
    private UUID pendingTtlockStateId;
    private UUID organizationId;
}
