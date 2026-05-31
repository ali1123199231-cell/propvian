package com.smartlock.dto.response.verification;

import com.smartlock.domain.enums.VerificationStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
@Builder
public class VerificationStatusResponse {

    private String organizationId;
    private boolean bookingsEnabled;
    private int completedSteps;
    private int totalRequiredSteps;
    private int progressPercent;

    // Per-step
    private StepStatus identityStep;
    private StepStatus propertyStep;
    private StepStatus otaStep;
    private StepStatus calendarStep;
    private StepStatus paymentStep;
    private StepStatus domainStep;
    private StepStatus adminStep;

    // Enabled flags (from system_config)
    private boolean identityStepEnabled;
    private boolean propertyStepEnabled;
    private boolean otaStepEnabled;
    private boolean calendarStepEnabled;
    private boolean paymentStepEnabled;
    private boolean domainStepEnabled;
    private boolean adminStepEnabled;

    // Convenience
    private String blockingReason;

    @Data
    @Builder
    public static class StepStatus {
        private String key;
        private String label;
        private VerificationStatus status;
        private boolean enabled;
        private Instant submittedAt;
        private Instant reviewedAt;
        private String rejectionReason;
        private List<String> data;
    }
}
