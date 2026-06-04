package com.smartlock.dto.response.admin;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminDashboardResponse {
    private long totalUsers;
    private long totalOrganizations;
    private long pendingVerifications;
    private long approvedVerifications;
    private long activeSubscriptions;
    private long trialingSubscriptions;
    private long recentErrors;
}
