package com.smartlock.exception;

import org.springframework.http.HttpStatus;

public class TTLockException extends AppException {
    public TTLockException(String message) {
        super(message, HttpStatus.BAD_GATEWAY, "TTLOCK_ERROR");
    }
    public TTLockException(String message, Throwable cause) {
        super(message, HttpStatus.BAD_GATEWAY, "TTLOCK_ERROR");
        initCause(cause);
    }
}
