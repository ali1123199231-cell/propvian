package com.smartlock.dto.request.lock;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ConnectLockRequest {
    @NotBlank
    private String oauthState;

    @NotNull
    private Long ttlockLockId;

    private String name;
}
