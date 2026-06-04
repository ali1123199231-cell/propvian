package com.smartlock.repository;

import com.smartlock.domain.CleanerTask;
import com.smartlock.domain.enums.CleanerTaskStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CleanerTaskRepository extends JpaRepository<CleanerTask, UUID> {
    Optional<CleanerTask> findByReservationId(UUID reservationId);
    Optional<CleanerTask> findByDirectBookingId(UUID directBookingId);
    List<CleanerTask> findByAssignedUserIdAndStatus(UUID userId, CleanerTaskStatus status);
    Page<CleanerTask> findByOrganizationIdOrderByScheduledAtDesc(UUID organizationId, Pageable pageable);
    long countByOrganizationIdAndStatus(UUID organizationId, CleanerTaskStatus status);
}
