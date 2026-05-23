package com.smartlock.exception;

import org.springframework.http.HttpStatus;

public class SubscriptionLimitException extends AppException {
    public SubscriptionLimitException(String message) {
        super(message, HttpStatus.PAYMENT_REQUIRED, "SUBSCRIPTION_LIMIT_EXCEEDED");
    }
}
