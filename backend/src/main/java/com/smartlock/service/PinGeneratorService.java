package com.smartlock.service;

import com.smartlock.domain.enums.AccessCodeStatus;
import com.smartlock.repository.AccessCodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PinGeneratorService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int MAX_ATTEMPTS = 20;

    private final AccessCodeRepository accessCodeRepository;

    public String generateUniquePin(UUID lockId) {
        log.debug("PinGeneratorService.generateUniquePin — lockId={}", lockId);
        for (int i = 0; i < MAX_ATTEMPTS; i++) {
            String pin = generatePin();
            if (!isPinInUse(lockId, pin)) {
                log.debug("PinGeneratorService.generateUniquePin — generated on attempt {}", i + 1);
                return pin;
            }
        }
        log.error("PinGeneratorService.generateUniquePin — exhausted {} attempts for lockId={}", MAX_ATTEMPTS, lockId);
        throw new IllegalStateException("Failed to generate unique PIN after " + MAX_ATTEMPTS + " attempts");
    }

    private String generatePin() {
        int pin = SECURE_RANDOM.nextInt(900000) + 100000;
        return String.valueOf(pin);
    }

    private boolean isPinInUse(UUID lockId, String pin) {
        return accessCodeRepository.findByLockIdAndStatus(lockId, AccessCodeStatus.ACTIVE)
                .stream()
                .anyMatch(code -> code.getPin().equals(pin));
    }
}
