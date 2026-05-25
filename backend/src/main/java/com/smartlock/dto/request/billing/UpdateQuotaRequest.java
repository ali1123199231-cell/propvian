package com.smartlock.dto.request.billing;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateQuotaRequest {
    @NotNull
    @Min(1)
    private Integer quantity;
}
