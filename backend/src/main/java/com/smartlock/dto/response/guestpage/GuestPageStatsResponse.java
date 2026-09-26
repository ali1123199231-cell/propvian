package com.smartlock.dto.response.guestpage;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuestPageStatsResponse {
    private int days;
    private long views;
    private Map<String, Long> viewsBySource;   // NFC / QR / LINK
    private long wifiCopies;
    private long bookDirectClicks;
    private long contactClicks;
    private List<DailyViews> daily;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class DailyViews {
        private LocalDate date;
        private long views;
    }
}
