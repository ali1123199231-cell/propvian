package com.smartlock.service;

import com.smartlock.domain.User;
import com.smartlock.dto.response.auth.OnboardingStateResponse;
import com.smartlock.repository.OrganizationMemberRepository;
import com.smartlock.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OnboardingService {

    private final UserRepository userRepository;
    private final OrganizationMemberRepository memberRepository;

    @Transactional
    public void advanceStepIfCurrent(UUID userId, String expectedCurrentStep) {
        userRepository.findById(userId).ifPresent(user -> {
            if (expectedCurrentStep.equals(user.getOnboardingStep())) {
                String next = nextStep(expectedCurrentStep);
                user.setOnboardingStep(next);
                if ("COMPLETED".equals(next)) {
                    user.setOnboardingCompleted(true);
                }
                userRepository.save(user);
                log.debug("Onboarding step advanced for user {}: {} → {}", userId, expectedCurrentStep, next);
            }
        });
    }

    @Transactional
    public OnboardingStateResponse getState(UUID userId) {
        User user = userRepository.findById(userId).orElseThrow();
        UUID orgId = memberRepository.findByUserId(userId).stream()
                .findFirst()
                .map(m -> m.getOrganizationId())
                .orElse(null);

        return OnboardingStateResponse.builder()
                .step(user.getOnboardingStep())
                .completed(user.isOnboardingCompleted())
                .pendingTtlockLockId(user.getPendingTtlockLockId())
                .pendingTtlockLockName(user.getPendingTtlockLockName())
                .pendingTtlockStateId(user.getPendingTtlockStateId())
                .organizationId(orgId)
                .build();
    }

    @Transactional
    public void complete(UUID userId) {
        userRepository.findById(userId).ifPresent(user -> {
            user.setOnboardingStep("COMPLETED");
            user.setOnboardingCompleted(true);
            userRepository.save(user);
            log.info("Onboarding completed for user {}", userId);
        });
    }

    private static String nextStep(String current) {
        return switch (current) {
            case "EMAIL_VERIFICATION" -> "TTLOCK_CONNECT";
            case "TTLOCK_CONNECT"    -> "PROPERTY_SETUP";
            case "PROPERTY_SETUP"   -> "CALENDAR_SETUP";
            case "CALENDAR_SETUP"   -> "COMPLETED";
            default -> current;
        };
    }
}
