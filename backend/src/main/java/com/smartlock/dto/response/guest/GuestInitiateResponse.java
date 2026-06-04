package com.smartlock.dto.response.guest;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuestInitiateResponse {
    private String bookingId;
    private String provider;            // "stripe" or "paypal"
    private String stripeClientSecret;  // set when provider=stripe
    private String paypalOrderId;       // set when provider=paypal
    private BigDecimal totalAmount;
    private String currency;
}
