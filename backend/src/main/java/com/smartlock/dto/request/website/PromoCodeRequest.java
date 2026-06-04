package com.smartlock.dto.request.website;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PromoCodeRequest {
    @NotBlank
    @Size(min = 2, max = 50)
    private String code;

    @NotBlank
    private String discountType; // PERCENT or FIXED

    @NotNull
    @DecimalMin("0.01")
    private BigDecimal discountValue;

    private Integer minNights;
    private Integer maxUses;
    private String expiresAt;
    private Boolean active;
}
