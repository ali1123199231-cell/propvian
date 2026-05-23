package com.smartlock.dto.response.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {
    private long totalProperties;
    private long activeProperties;
    private long totalLocks;
    private long connectedLocks;
    private long totalReservations;
    private long activeReservations;
    private long pendingReservations;
    private long reservationsThisMonth;
    private long pendingCleanerTasks;
    private long unreadNotifications;
    private double occupancyRate;
}
