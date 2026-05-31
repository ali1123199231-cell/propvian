package com.smartlock.dto.request.verification;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SubmitPropertyVerificationRequest {
    @NotBlank
    private String propertyAddressLine;

    private String ownershipProofUrl;
    private String managementAuthUrl;
    private String utilityBillUrl;
}
