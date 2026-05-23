package com.smartlock.repository;

import com.smartlock.domain.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    Page<AuditLog> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId, Pageable pageable);
    Page<AuditLog> findByOrganizationIdAndEntityTypeAndEntityId(UUID organizationId, String entityType, UUID entityId, Pageable pageable);
}
