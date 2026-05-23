package com.smartlock.service;

import com.smartlock.domain.Lock;
import com.smartlock.domain.TtlockOAuthState;
import com.smartlock.domain.enums.LockStatus;
import com.smartlock.dto.request.lock.ConnectLockRequest;
import com.smartlock.dto.response.lock.LockResponse;
import com.smartlock.exception.ResourceNotFoundException;
import com.smartlock.integration.ttlock.TTLockClient;
import com.smartlock.integration.ttlock.dto.TTLockLockInfoResponse;
import com.smartlock.repository.LockRepository;
import com.smartlock.repository.PropertyRepository;
import com.smartlock.repository.TtlockOAuthStateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
    private final TTLockClient ttlockClient;
    private final TtlockOAuthStateRepository oauthStateRepository;

    @Transactional
    public LockResponse connectLock(UUID propertyId, ConnectLockRequest request, UUID userId) {
        propertyRepository.findById(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("Property", propertyId));

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

        long tokenTtl = oauthState.getExpiresIn() != null ? oauthState.getExpiresIn() : 7776000L;

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
        log.info("Lock connected via OAuth: {} (TTLock ID: {})", lock.getId(), request.getTtlockLockId());
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
        log.info("Lock deleted: {}", lockId);
    }

    @Transactional
    public LockResponse syncLock(UUID lockId) {
        Lock lock = lockRepository.findById(lockId)
                .orElseThrow(() -> new ResourceNotFoundException("Lock", lockId));

        try {
            TTLockLockInfoResponse lockInfo = ttlockClient.getLockInfo(
                    lock.getTtlockLockId(), lock.getTtlockAccessToken()
            );
            lock.setBatteryLevel(lockInfo.getElectricQuantity());
            lock.setLastSyncAt(Instant.now());
            lock.setStatus(LockStatus.CONNECTED);
        } catch (Exception e) {
            lock.setStatus(LockStatus.ERROR);
            log.error("Failed to sync lock {}: {}", lockId, e.getMessage());
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
