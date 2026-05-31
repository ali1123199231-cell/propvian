package com.smartlock.dto.request.verification;

import lombok.Data;

@Data
public class ConnectPaymentRequest {
    private String  stripeAccountId;
    private String  paypalAccountId;
    private Boolean chargesEnabled;
    private Boolean payoutsEnabled;
}
