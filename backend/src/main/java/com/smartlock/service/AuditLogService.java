package com.smartlock.service;

import com.smartlock.domain.AuditLog;
import com.smartlock.repository.AuditLogRepository;
import com.smartlock.util.LogMaskingUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(UUID orgId, UUID actorId, String actorEmail, String action,
                    String entityType, UUID entityId) {
        logResult(orgId, actorId, actorEmail, action, entityType, entityId, null, null, true, null);
    }

    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logResult(UUID orgId, UUID actorId, String actorEmail, String action,
                    String entityType, UUID entityId, String ipAddress, String userAgent,
                    boolean success, String errorMessage) {
        log.debug("AuditLogService.logResult — orgId={} actor={} action={} entityType={} entityId={} success={}",
                orgId, actorId, action, entityType, entityId, success);
        AuditLog entry = AuditLog.builder()
                .organizationId(orgId)
                .actorId(actorId)
                .actorEmail(actorEmail)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .success(success)
                .errorMessage(errorMessage)
                .build();
        auditLogRepository.save(entry);
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> getByOrg(UUID orgId, Pageable pageable) {
        log.debug("AuditLogService.getByOrg — orgId={} page={}", orgId, pageable.getPageNumber());
        return auditLogRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId, pageable);
    }
}
