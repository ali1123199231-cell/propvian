package com.smartlock.repository;

import com.smartlock.domain.Lock;
import java.util.Optional;
import com.smartlock.domain.enums.LockStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface LockRepository extends JpaRepository<Lock, UUID> {
    List<Lock> findByPropertyId(UUID propertyId);
    List<Lock> findByPropertyIdAndStatus(UUID propertyId, LockStatus status);
    long countByPropertyId(UUID propertyId);

    Optional<Lock> findFirstByTtlockLockId(Long ttlockLockId);

    @Query("SELECT l FROM Lock l WHERE l.tokenExpiresAt < :threshold AND l.status = 'CONNECTED' AND l.deletedAt IS NULL")
    List<Lock> findLocksWithExpiringTokens(Instant threshold);

    @Query("SELECT l FROM Lock l JOIN Property p ON l.propertyId = p.id WHERE p.organizationId = :orgId AND l.deletedAt IS NULL")
    List<Lock> findByOrganizationId(UUID orgId);
}
