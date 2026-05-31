package com.smartlock.dto.request.verification;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AdminApprovalRequest {
    @NotNull
    private Boolean approved;

    private String notes;
    private String rejectionReason;
}
