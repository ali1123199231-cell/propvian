package com.smartlock.dto.response.guestpage;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/** One row of the host's guest-page list: every property, set up or not. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuestPageSummaryResponse {
    private UUID propertyId;
    private String propertyName;
    private String city;
    private String imageUrl;
    private boolean configured;
    private boolean enabled;
    private boolean hasWifi;
    private String code;
    private String publicUrl;
    private long views30d;
    private int linkedStands;
}
