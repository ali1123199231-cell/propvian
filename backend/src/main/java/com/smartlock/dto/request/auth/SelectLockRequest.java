package com.smartlock.dto.request.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SelectLockRequest {

    @NotBlank
    private String oauthState;

    @NotNull
    private Long ttlockLockId;

    @Size(max = 200)
    private String lockName;
}
