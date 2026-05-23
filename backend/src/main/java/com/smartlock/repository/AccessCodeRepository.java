package com.smartlock.repository;

import com.smartlock.domain.AccessCode;
import com.smartlock.domain.enums.AccessCodeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AccessCodeRepository extends JpaRepository<AccessCode, UUID> {
    List<AccessCode> findByReservationId(UUID reservationId);
    List<AccessCode> findByLockIdAndStatus(UUID lockId, AccessCodeStatus status);
    Optional<AccessCode> findByReservationIdAndLockId(UUID reservationId, UUID lockId);

    @Query("SELECT ac FROM AccessCode ac WHERE ac.validTo < :now AND ac.status = 'ACTIVE'")
    List<AccessCode> findExpiredActiveCodes(Instant now);

    long countByReservationId(UUID reservationId);
}
