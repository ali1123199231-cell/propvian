package com.smartlock.service;

import com.smartlock.domain.Guest;
import com.smartlock.repository.GuestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GuestService {

    private final GuestRepository guestRepository;

    @Transactional
    public Guest upsertGuest(UUID orgId, String email, String name) {
        return guestRepository.findByOrganizationIdAndEmail(orgId, email)
                .orElseGet(() -> guestRepository.save(
                        Guest.builder()
                                .organizationId(orgId)
                                .email(email)
                                .name(name)
                                .build()
                ));
    }
}
