package com.smartlock.domain.enums;

public enum PropertyStatus {
    DRAFT,      // not bookable, being set up
    ACTIVE,     // bookable
    PAUSED,     // temporarily unavailable (owner action)
    INACTIVE,   // legacy alias for PAUSED
    ARCHIVED    // soft-deleted, historical data preserved
}
