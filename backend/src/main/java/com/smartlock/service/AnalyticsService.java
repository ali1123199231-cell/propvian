package com.smartlock.service;

import com.smartlock.domain.enums.CleanerTaskStatus;
import com.smartlock.domain.enums.LockStatus;
import com.smartlock.domain.enums.PropertyStatus;
import com.smartlock.domain.enums.ReservationStatus;
import com.smartlock.dto.response.analytics.DashboardStatsResponse;
import com.smartlock.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {

    private final PropertyRepository propertyRepository;
    private final LockRepository lockRepository;
    private final ReservationRepository reservationRepository;
    private final CleanerTaskRepository cleanerTaskRepository;
    private final NotificationRepository notificationRepository;

    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats(UUID orgId, UUID userId) {
        log.debug("AnalyticsService.getDashboardStats — orgId={} userId={}", orgId, userId);
        long totalProperties = propertyRepository.countByOrganizationId(orgId);
        long activeProperties = propertyRepository.countByOrganizationIdAndStatus(orgId, PropertyStatus.ACTIVE);

        var locks = lockRepository.findByOrganizationId(orgId);
        long totalLocks = locks.size();
        long connectedLocks = locks.stream().filter(l -> l.getStatus() == LockStatus.CONNECTED).count();

        long totalReservations = reservationRepository.countByOrganizationId(orgId);
        long activeReservations = reservationRepository.countByOrganizationIdAndStatus(orgId, ReservationStatus.CONFIRMED);
        long checkedInReservations = reservationRepository.countByOrganizationIdAndStatus(orgId, ReservationStatus.CHECKED_IN);

        Instant monthStart = Instant.now().minus(30, ChronoUnit.DAYS);
        long reservationsThisMonth = reservationRepository.countByOrganizationIdSince(orgId, monthStart);

        long pendingCleanerTasks = cleanerTaskRepository.countByOrganizationIdAndStatus(orgId, CleanerTaskStatus.PENDING);

        long unreadNotifications = notificationRepository.countByUserIdAndReadAtIsNull(userId);

        double occupancyRate = totalProperties > 0
                ? (double) (activeReservations + checkedInReservations) / totalProperties * 100
                : 0.0;

        DashboardStatsResponse stats = DashboardStatsResponse.builder()
                .totalProperties(totalProperties)
                .activeProperties(activeProperties)
                .totalLocks(totalLocks)
                .connectedLocks(connectedLocks)
                .totalReservations(totalReservations)
                .activeReservations(activeReservations + checkedInReservations)
                .pendingReservations(activeReservations)
                .reservationsThisMonth(reservationsThisMonth)
                .pendingCleanerTasks(pendingCleanerTasks)
                .unreadNotifications(unreadNotifications)
                .occupancyRate(Math.round(occupancyRate * 10.0) / 10.0)
                .build();

        log.info("AnalyticsService.getDashboardStats — org={} props={}/{} locks={}/{} reservations={} occupancy={}%",
                orgId, activeProperties, totalProperties, connectedLocks, totalLocks,
                activeReservations + checkedInReservations, stats.getOccupancyRate());
        return stats;
    }
}
