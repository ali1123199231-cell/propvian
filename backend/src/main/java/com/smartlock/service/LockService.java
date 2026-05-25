package com.smartlock.service;

import com.smartlock.domain.*;
import com.smartlock.domain.enums.LockStatus;
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

    @Transactional
    public LockResponse connectLock(UUID propertyId, ConnectLockRequest request, UUID userId) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("Property", propertyId));

        billingService.enforceCanAddLock(property.getOrganizationId());

        lockRepository.findFirstByTtlockLockId(request.getTtlockLockId()).ifPresent(existing -> {
            UUID existingOwnerId = resolveOwner(existing.getPropertyId());
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

        onboardingService.advanceStepIfCurrent(userId, "TTLOCK_CONNECT");

        log.info("Lock connected: {} (TTLock ID: {})", lock.getId(), request.getTtlockLockId());
        return toResponse(lock);
    }

    @Transactional(readOnly = true)
    public List<LockResponse> getLocksByProperty(UUID propertyId) {
        return lockRepository.findByPropertyId(propertyId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public LockResponse getLock(UUID lockId) {
        return toResponse(lockRepository.findById(lockId)
                .orElseThrow(() -> new ResourceNotFoundException("Lock", lockId)));
    }

    @Transactional
    public void disconnectLock(UUID lockId) {
        Lock lock = lockRepository.findById(lockId)
                .orElseThrow(() -> new ResourceNotFoundException("Lock", lockId));
        lock.setStatus(LockStatus.DISCONNECTED);
        lock.setTtlockAccessToken(null);
        lock.setTtlockRefreshToken(null);
        lockRepository.save(lock);
    }

    @Transactional
    public void deleteLock(UUID lockId) {
        Lock lock = lockRepository.findById(lockId)
                .orElseThrow(() -> new ResourceNotFoundException("Lock", lockId));
        lock.softDelete();
        lockRepository.save(lock);
    }

    @Transactional
    public LockResponse syncLock(UUID lockId) {
        Lock lock = lockRepository.findById(lockId)
                .orElseThrow(() -> new ResourceNotFoundException("Lock", lockId));

        try {
            TTLockLockInfoResponse info = ttlockClient.getLockInfo(lock.getTtlockLockId(), lock.getTtlockAccessToken());
            lock.setBatteryLevel(info.getElectricQuantity());
            lock.setLastSyncAt(Instant.now());
            lock.setStatus(LockStatus.CONNECTED);
        } catch (Exception e) {
            lock.setStatus(LockStatus.ERROR);
            log.error("Failed to sync lock {}: {}", lockId, e.getMessage());
        }

        return toResponse(lockRepository.save(lock));
    }

    private UUID resolveOwner(UUID propertyId) {
        if (propertyId == null) return null;
        return propertyRepository.findById(propertyId)
                .flatMap(p -> organizationRepository.findById(p.getOrganizationId()))
                .map(Organization::getOwnerId)
                .orElse(null);
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
