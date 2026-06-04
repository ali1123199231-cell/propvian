package com.smartlock.dto.response.website;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class PromoCodeResponse {
    private UUID id;
    private String code;
    private String discountType;
    private BigDecimal discountValue;
    private Integer minNights;
    private Integer maxUses;
    private int usesCount;
    private Instant expiresAt;
    private boolean active;
    private Instant createdAt;
}
