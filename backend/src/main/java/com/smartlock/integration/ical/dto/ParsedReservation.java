package com.smartlock.integration.ical.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class ParsedReservation {
    private String uid;
    private Instant startDate;
    private Instant endDate;
    private String summary;
    private String description;
    private String guestName;
    private String guestEmail;
    private String timezone;
    private String rawData;
}
