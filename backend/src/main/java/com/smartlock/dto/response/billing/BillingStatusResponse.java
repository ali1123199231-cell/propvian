package com.smartlock.dto.response.billing;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class BillingStatusResponse {
    private String status;
    private boolean trialActive;
    private boolean paidActive;
    private boolean accessActive;
    private Instant trialEnd;
    private Instant currentPeriodEnd;
    private Integer lockQuota;
    private long usedLocks;
    private boolean cancelAtPeriodEnd;
    private String paymentProvider;
    private Instant failedPaymentAt;
}
