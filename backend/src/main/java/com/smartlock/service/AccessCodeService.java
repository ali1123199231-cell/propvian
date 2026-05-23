package com.smartlock.service;

import com.smartlock.domain.AccessCode;
import com.smartlock.domain.Lock;
import com.smartlock.domain.Reservation;
import com.smartlock.domain.enums.AccessCodeStatus;
import com.smartlock.domain.enums.LockStatus;
import com.smartlock.exception.ResourceNotFoundException;
import com.smartlock.integration.ttlock.TTLockClient;
import com.smartlock.integration.ttlock.dto.TTLockPasscodeResponse;
import com.smartlock.repository.AccessCodeRepository;
import com.smartlock.repository.LockRepository;
import com.smartlock.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AccessCodeService {

    private final AccessCodeRepository accessCodeRepository;
    private final ReservationRepository reservationRepository;
    private final LockRepository lockRepository;
    private final PinGeneratorService pinGeneratorService;
    private final TTLockClient ttlockClient;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public List<AccessCode> createForReservation(UUID reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", reservationId));

        List<Lock> locks = lockRepository.findByPropertyIdAndStatus(reservation.getPropertyId(), LockStatus.CONNECTED);

        if (locks.isEmpty()) {
            log.warn("No connected locks found for property {}", reservation.getPropertyId());
            return List.of();
        }

        Instant validFrom = reservation.getCheckInDate().minus(1, ChronoUnit.HOURS);
        Instant validTo = reservation.getCheckOutDate().plus(1, ChronoUnit.HOURS);

        return locks.stream()
                .map(lock -> createCodeForLock(reservation, lock, validFrom, validTo))
                .toList();
    }

    private AccessCode createCodeForLock(Reservation reservation, Lock lock, Instant validFrom, Instant validTo) {
        String pin = pinGeneratorService.generateUniquePin(lock.getId());

        AccessCode accessCode = AccessCode.builder()
                .reservationId(reservation.getId())
                .lockId(lock.getId())
                .pin(pin)
                .status(AccessCodeStatus.PENDING)
                .validFrom(validFrom)
                .validTo(validTo)
                .build();

        accessCode = accessCodeRepository.save(accessCode);

        try {
            TTLockPasscodeResponse response = ttlockClient.createKeyboardPasscode(
                    lock.getTtlockLockId(),
                    pin,
                    validFrom.toEpochMilli(),
                    validTo.toEpochMilli(),
                    lock.getTtlockAccessToken()
            );

            accessCode.setTtlockKeyboardPwdId(response.getKeyboardPwdId());
            accessCode.setStatus(AccessCodeStatus.ACTIVE);
            log.info("Access code created for reservation {} on lock {}", reservation.getId(), lock.getId());
        } catch (Exception e) {
            accessCode.setStatus(AccessCodeStatus.FAILED);
            accessCode.setFailureReason(e.getMessage());
            log.error("Failed to create TTLock code for reservation {}: {}", reservation.getId(), e.getMessage());
        }

        return accessCodeRepository.save(accessCode);
    }

    @Transactional
    public void revokeAccessCodesForReservation(UUID reservationId) {
        accessCodeRepository.findByReservationId(reservationId)
                .stream()
                .filter(code -> code.getStatus() == AccessCodeStatus.ACTIVE)
                .forEach(this::revokeCode);
    }

    @Transactional
    public void revokeCode(AccessCode accessCode) {
        Lock lock = lockRepository.findById(accessCode.getLockId()).orElse(null);

        if (lock != null && lock.getTtlockLockId() != null && accessCode.getTtlockKeyboardPwdId() != null) {
            try {
                ttlockClient.deleteKeyboardPasscode(
                        lock.getTtlockLockId(),
                        accessCode.getTtlockKeyboardPwdId(),
                        lock.getTtlockAccessToken()
                );
            } catch (Exception e) {
                log.warn("Failed to delete TTLock passcode for code {}: {}", accessCode.getId(), e.getMessage());
            }
        }

        accessCode.setStatus(AccessCodeStatus.REVOKED);
        accessCode.setRevokedAt(Instant.now());
        accessCodeRepository.save(accessCode);
    }

    @Transactional
    public void expireOldCodes() {
        List<AccessCode> expired = accessCodeRepository.findExpiredActiveCodes(Instant.now());
        log.info("Expiring {} access codes", expired.size());
        expired.forEach(code -> {
            code.setStatus(AccessCodeStatus.EXPIRED);
            accessCodeRepository.save(code);
        });
    }
}
