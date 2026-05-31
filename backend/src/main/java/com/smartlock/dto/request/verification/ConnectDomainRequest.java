package com.smartlock.dto.request.verification;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class ConnectDomainRequest {
    @NotBlank
    @Pattern(regexp = "^[a-zA-Z0-9][a-zA-Z0-9\\-\\.]{1,251}[a-zA-Z0-9]$",
             message = "Invalid domain name")
    private String domain;
}
