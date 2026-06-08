package com.smartlock.service;

import com.smartlock.domain.Guest;
import com.smartlock.repository.GuestRepository;
import com.smartlock.util.LogMaskingUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class GuestService {

    private final GuestRepository guestRepository;

    @Transactional
    public Guest upsertGuest(UUID orgId, String email, String name) {
        log.debug("GuestService.upsertGuest — orgId={} email={}", orgId, LogMaskingUtil.maskEmail(email));
        return guestRepository.findByOrganizationIdAndEmail(orgId, email)
                .map(existing -> {
                    log.debug("GuestService.upsertGuest — existing guestId={}", existing.getId());
                    return existing;
                })
                .orElseGet(() -> {
                    Guest saved = guestRepository.save(
                            Guest.builder()
                                    .organizationId(orgId)
                                    .email(email)
                                    .name(name)
                                    .build()
                    );
                    log.info("GuestService.upsertGuest — created guestId={} org={}", saved.getId(), orgId);
                    return saved;
                });
    }
}
