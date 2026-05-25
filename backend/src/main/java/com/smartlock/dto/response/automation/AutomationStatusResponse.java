package com.smartlock.dto.response.automation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AutomationStatusResponse {
    private boolean enabled;
    private long pendingReservationCount;
}
