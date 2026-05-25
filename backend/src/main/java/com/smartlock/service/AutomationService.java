package com.smartlock.service;

import com.smartlock.domain.Organization;
import com.smartlock.domain.Reservation;
import com.smartlock.domain.enums.AccessCodeStatus;
import com.smartlock.dto.response.automation.AutomationStatusResponse;
import com.smartlock.event.ReservationCreatedEvent;
import com.smartlock.exception.AppException;
import com.smartlock.exception.ResourceNotFoundException;
import com.smartlock.repository.AccessCodeRepository;
import org.springframework.http.HttpStatus;
import com.smartlock.repository.OrganizationRepository;
import com.smartlock.repository.PropertyRepository;
import com.smartlock.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AutomationService {

    private final OrganizationRepository organizationRepository;
    private final PropertyRepository propertyRepository;
    private final ReservationRepository reservationRepository;
    private final AccessCodeRepository accessCodeRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final BillingService billingService;

    @Transactional(readOnly = true)
    public AutomationStatusResponse getStatus(UUID orgId) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", orgId));
        return AutomationStatusResponse.builder()
                .enabled(org.isAutomationEnabled())
                .pendingReservationCount(countPendingReservations(orgId))
                .build();
    }

    @Transactional
    public AutomationStatusResponse enableAutomation(UUID orgId) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", orgId));

        if (!billingService.isAccessActive(orgId)) {
            throw new AppException(
                    "Active subscription required to enable automation.",
                    HttpStatus.PAYMENT_REQUIRED, "SUBSCRIPTION_INACTIVE");
        }

        org.setAutomationEnabled(true);
        organizationRepository.save(org);

        List<Reservation> pending = getPendingReservations(orgId);
        log.info("Automation enabled for org {}. Processing {} pending reservations.", orgId, pending.size());

        for (Reservation reservation : pending) {
            try {
                eventPublisher.publishEvent(new ReservationCreatedEvent(this, reservation.getId(), orgId));
            } catch (Exception e) {
                log.error("Failed to fire event for reservation {}: {}", reservation.getId(), e.getMessage());
            }
        }

        return AutomationStatusResponse.builder()
                .enabled(true)
                .pendingReservationCount(pending.size())
                .build();
    }

    @Transactional
    public AutomationStatusResponse disableAutomation(UUID orgId) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", orgId));

        org.setAutomationEnabled(false);
        organizationRepository.save(org);
        log.info("Automation disabled for org {}", orgId);

        return AutomationStatusResponse.builder()
                .enabled(false)
                .pendingReservationCount(0)
                .build();
    }

    private long countPendingReservations(UUID orgId) {
        return getPendingReservations(orgId).size();
    }

    private List<Reservation> getPendingReservations(UUID orgId) {
        List<UUID> propertyIds = propertyRepository.findByOrganizationId(orgId)
                .stream().map(p -> p.getId()).toList();

        if (propertyIds.isEmpty()) return List.of();

        return reservationRepository.findUpcomingConfirmedByPropertyIds(propertyIds, Instant.now())
                .stream()
                .filter(r -> !hasActiveAccessCode(r.getId()))
                .toList();
    }

    private boolean hasActiveAccessCode(UUID reservationId) {
        return accessCodeRepository.findByReservationId(reservationId)
                .stream()
                .anyMatch(ac -> ac.getStatus() == AccessCodeStatus.ACTIVE);
    }
}
