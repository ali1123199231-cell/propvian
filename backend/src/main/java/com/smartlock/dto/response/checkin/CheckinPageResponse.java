package com.smartlock.dto.response.checkin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckinPageResponse {
    private String propertyName;
    private String guestName;
    private String pin;
    private Instant validFrom;
    private Instant validTo;
    private String timezone;
    private String wifiDetails;
    private String accessInstructions;
    private String lockNotes;
}
