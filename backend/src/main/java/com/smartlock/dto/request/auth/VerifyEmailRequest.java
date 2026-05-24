package com.smartlock.dto.request.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class VerifyEmailRequest {

    @NotBlank
    @Size(min = 6, max = 6, message = "Code must be exactly 6 digits")
    private String code;
}
