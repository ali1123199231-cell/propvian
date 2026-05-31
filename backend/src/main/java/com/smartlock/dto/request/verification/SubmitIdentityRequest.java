package com.smartlock.dto.request.verification;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SubmitIdentityRequest {
    @NotBlank
    private String identityDocumentUrl;

    @NotBlank
    private String selfieUrl;
}
