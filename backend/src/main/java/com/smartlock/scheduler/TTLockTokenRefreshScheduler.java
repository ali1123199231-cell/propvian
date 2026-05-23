package com.smartlock.scheduler;

import com.smartlock.domain.Lock;
import com.smartlock.domain.enums.LockStatus;
import com.smartlock.integration.ttlock.TTLockClient;
import com.smartlock.integration.ttlock.dto.TTLockTokenResponse;
import com.smartlock.repository.LockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class TTLockTokenRefreshScheduler {

    private final LockRepository lockRepository;
    private final TTLockClient ttlockClient;

    @Scheduled(fixedDelay = 3600000)
    public void refreshExpiringTokens() {
        Instant threshold = Instant.now().plus(2, ChronoUnit.HOURS);
        List<Lock> locks = lockRepository.findLocksWithExpiringTokens(threshold);
        log.debug("Refreshing tokens for {} locks", locks.size());

        for (Lock lock : locks) {
            try {
                if (lock.getTtlockRefreshToken() != null) {
                    TTLockTokenResponse newToken = ttlockClient.refreshToken(lock.getTtlockRefreshToken());
                    lock.setTtlockAccessToken(newToken.getAccessToken());
                    lock.setTtlockRefreshToken(newToken.getRefreshToken());
                    lock.setTokenExpiresAt(Instant.now().plusSeconds(newToken.getExpiresIn()));
                    lock.setStatus(LockStatus.CONNECTED);
                    lockRepository.save(lock);
                    log.info("Refreshed token for lock {}", lock.getId());
                }
            } catch (Exception e) {
                log.error("Failed to refresh token for lock {}: {}", lock.getId(), e.getMessage());
                lock.setStatus(LockStatus.ERROR);
                lockRepository.save(lock);
            }
        }
    }
}
