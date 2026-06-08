package com.smartlock.service;

import com.smartlock.domain.*;
import com.smartlock.domain.enums.LockStatus;
import com.smartlock.util.LogMaskingUtil;
import com.smartlock.dto.request.lock.ConnectLockRequest;
import com.smartlock.dto.response.lock.LockResponse;
import com.smartlock.exception.AppException;
import com.smartlock.exception.ResourceNotFoundException;
import com.smartlock.integration.ttlock.TTLockClient;
import com.smartlock.integration.ttlock.dto.TTLockLockInfoResponse;
import com.smartlock.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LockService {

    private final LockRepository lockRepository;
    private final PropertyRepository propertyRepository;
    private final OrganizationRepository organizationRepository;
    private final TTLockClient ttlockClient;
    private final TtlockOAuthStateRepository oauthStateRepository;
    private final DuplicateLockAttemptRepository duplicateLockAttemptRepository;
    private final OnboardingService onboardingService;
    private final BillingService billingService;
    private final OrganizationSecurityService orgSecurity;

    @Transactional
    public LockResponse connectLock(UUID propertyId, ConnectLockRequest request, UUID userId) {
        log.info("connectLock — propertyId={} userId={} ttlockId={}", propertyId, userId, request.getTtlockLockId());
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("Property", propertyId));

        log.debug("connectLock — billing check for orgId={}", property.getOrganizationId());
        billingService.enforceCanAddLock(property.getOrganizationId());

        lockRepository.findFirstByTtlockLockId(request.getTtlockLockId()).ifPresent(existing -> {
            Property existingProperty = propertyRepository.findById(existing.getPropertyId()).orElse(null);
            UUID existingOrgId = existingProperty != null ? existingProperty.getOrganizationId() : null;

            if (property.getOrganizationId().equals(existingOrgId)) {
                throw new AppException(
                        "This lock is already connected to your account. You can manage it from the Locks page.",
                        HttpStatus.CONFLICT, "LOCK_ALREADY_REGISTERED");
            }

            UUID existingOwnerId = existingOrgId != null
                    ? organizationRepository.findById(existingOrgId).map(Organization::getOwnerId).orElse(null)
                    : null;
            duplicateLockAttemptRepository.save(DuplicateLockAttempt.builder()
                    .attemptedUserId(userId)
                    .existingOwnerUserId(existingOwnerId != null ? existingOwnerId : userId)
                    .ttlockLockId(request.getTtlockLockId())
                    .provider("TTLOCK")
                    .build());
            throw new AppException(
                    "This lock is already registered to another account. Contact support if you believe this is an error.",
                    HttpStatus.CONFLICT, "LOCK_ALREADY_REGISTERED");
        });

        UUID stateId = UUID.fromString(request.getOauthState());
        TtlockOAuthState oauthState = oauthStateRepository.findById(stateId)
                .orElseThrow(() -> new IllegalArgumentException("OAuth session not found or expired"));

        if (oauthState.isExpired() || !oauthState.isAuthorized()) {
            throw new IllegalStateException("OAuth session expired. Please re-authorize with TTLock.");
        }
        if (!oauthState.getUserId().equals(userId)) {
            throw new SecurityException("OAuth state does not belong to the current user");
        }

        TTLockLockInfoResponse lockInfo = ttlockClient.getLockInfo(
                request.getTtlockLockId(), oauthState.getAccessToken()
        );

        long tokenTtl = oauthState.getExpiresIn() != null ? oauthState.getExpiresIn() : 7_776_000L;

        Lock lock = Lock.builder()
                .propertyId(propertyId)
                .name(request.getName() != null ? request.getName() : lockInfo.getLockAlias())
                .ttlockLockId(request.getTtlockLockId())
                .ttlockLockAlias(lockInfo.getLockAlias())
                .ttlockFeatureValue(lockInfo.getFeatureValue())
                .ttlockUserId(oauthState.getTtlockUid())
                .ttlockAccessToken(oauthState.getAccessToken())
                .ttlockRefreshToken(oauthState.getRefreshToken())
                .tokenExpiresAt(Instant.now().plusSeconds(tokenTtl))
                .batteryLevel(lockInfo.getElectricQuantity())
                .status(LockStatus.CONNECTED)
                .lastSyncAt(Instant.now())
                .build();

        lock = lockRepository.save(lock);
        oauthStateRepository.delete(oauthState);
        log.info("connectLock — success lockId={} name={} ttlockId={} battery={}",
                lock.getId(), lock.getName(), lock.getTtlockLockId(), lock.getBatteryLevel());

        onboardingService.advanceStepIfCurrent(userId, "TTLOCK_CONNECT");

        return toResponse(lock);
    }

    @Transactional(readOnly = true)
    public List<LockResponse> getLocksByProperty(UUID propertyId) {
        log.debug("getLocksByProperty — propertyId={}", propertyId);
        orgSecurity.requirePropertyAccess(propertyId);
        List<LockResponse> locks = lockRepository.findByPropertyId(propertyId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        log.debug("getLocksByProperty — found {} locks", locks.size());
        return locks;
    }

    @Transactional(readOnly = true)
    public LockResponse getLock(UUID lockId) {
        log.debug("getLock — lockId={}", lockId);
        Lock lock = lockRepository.findById(lockId)
                .orElseThrow(() -> new ResourceNotFoundException("Lock", lockId));
        orgSecurity.requirePropertyAccess(lock.getPropertyId());
        log.debug("getLock — name={} status={} battery={}", lock.getName(), lock.getStatus(), lock.getBatteryLevel());
        return toResponse(lock);
    }

    @Transactional
    public void disconnectLock(UUID lockId) {
        log.info("disconnectLock — lockId={}", lockId);
        Lock lock = lockRepository.findById(lockId)
                .orElseThrow(() -> new ResourceNotFoundException("Lock", lockId));
        orgSecurity.requirePropertyAccess(lock.getPropertyId());
        lock.setStatus(LockStatus.DISCONNECTED);
        lock.setTtlockAccessToken(null);
        lock.setTtlockRefreshToken(null);
        lockRepository.save(lock);
        log.info("disconnectLock — success lockId={}", lockId);
    }

    @Transactional
    public void deleteLock(UUID lockId) {
        log.info("deleteLock — lockId={}", lockId);
        Lock lock = lockRepository.findById(lockId)
                .orElseThrow(() -> new ResourceNotFoundException("Lock", lockId));
        orgSecurity.requirePropertyAccess(lock.getPropertyId());
        lock.softDelete();
        lockRepository.save(lock);
        log.info("deleteLock — soft-deleted lockId={}", lockId);
    }

    @Transactional
    public LockResponse syncLock(UUID lockId) {
        log.info("syncLock — lockId={}", lockId);
        Lock lock = lockRepository.findById(lockId)
                .orElseThrow(() -> new ResourceNotFoundException("Lock", lockId));
        orgSecurity.requirePropertyAccess(lock.getPropertyId());

        try {
            TTLockLockInfoResponse info = ttlockClient.getLockInfo(lock.getTtlockLockId(), lock.getTtlockAccessToken());
            lock.setBatteryLevel(info.getElectricQuantity());
            lock.setLastSyncAt(Instant.now());
            lock.setStatus(LockStatus.CONNECTED);
            log.info("syncLock — success lockId={} battery={}", lockId, info.getElectricQuantity());
        } catch (Exception e) {
            lock.setStatus(LockStatus.ERROR);
            log.error("syncLock — failed lockId={} error={}", lockId, e.getMessage());
        }

        return toResponse(lockRepository.save(lock));
    }

    private LockResponse toResponse(Lock lock) {
        return LockResponse.builder()
                .id(lock.getId())
                .propertyId(lock.getPropertyId())
                .name(lock.getName())
                .ttlockLockId(lock.getTtlockLockId())
                .ttlockLockAlias(lock.getTtlockLockAlias())
                .batteryLevel(lock.getBatteryLevel())
                .status(lock.getStatus().name())
                .lastSyncAt(lock.getLastSyncAt())
                .tokenExpiresAt(lock.getTokenExpiresAt())
                .notes(lock.getNotes())
                .createdAt(lock.getCreatedAt())
                .build();
    }
}
