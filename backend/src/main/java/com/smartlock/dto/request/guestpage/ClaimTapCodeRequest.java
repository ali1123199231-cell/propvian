package com.smartlock.dto.request.guestpage;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class ClaimTapCodeRequest {
    @NotNull
    private UUID propertyId;
}
