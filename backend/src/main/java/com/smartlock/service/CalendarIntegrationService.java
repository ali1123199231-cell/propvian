package com.smartlock.service;

import com.smartlock.domain.CalendarIntegration;
import com.smartlock.dto.request.calendar.CreateCalendarIntegrationRequest;
import com.smartlock.dto.response.calendar.CalendarIntegrationResponse;
import com.smartlock.exception.ResourceNotFoundException;
import com.smartlock.repository.CalendarIntegrationRepository;
import com.smartlock.repository.PropertyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CalendarIntegrationService {

    private final CalendarIntegrationRepository calendarIntegrationRepository;
    private final PropertyRepository propertyRepository;
    private final CalendarSyncService calendarSyncService;

    @Transactional
    public CalendarIntegrationResponse createIntegration(UUID propertyId, UUID orgId, CreateCalendarIntegrationRequest request) {
        propertyRepository.findById(propertyId)
                .filter(p -> p.getOrganizationId().equals(orgId))
                .orElseThrow(() -> new ResourceNotFoundException("Property", propertyId));

        if (calendarIntegrationRepository.existsByPropertyIdAndIcalUrlAndDeletedAtIsNull(propertyId, request.getIcalUrl())) {
            throw new com.smartlock.exception.DuplicateResourceException("This iCal URL is already added for this property");
        }

        CalendarIntegration integration = CalendarIntegration.builder()
                .propertyId(propertyId)
                .platform(request.getPlatform())
                .icalUrl(request.getIcalUrl())
                .displayName(request.getDisplayName())
                .syncIntervalMinutes(request.getSyncIntervalMinutes() != null ? request.getSyncIntervalMinutes() : 15)
                .enabled(true)
                .build();

        return toResponse(calendarIntegrationRepository.save(integration));
    }

    @Transactional(readOnly = true)
    public List<CalendarIntegrationResponse> getByProperty(UUID propertyId) {
        return calendarIntegrationRepository.findByPropertyId(propertyId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteIntegration(UUID integrationId, UUID orgId) {
        CalendarIntegration integration = calendarIntegrationRepository.findById(integrationId)
                .orElseThrow(() -> new ResourceNotFoundException("CalendarIntegration", integrationId));
        integration.setDeletedAt(java.time.Instant.now());
        calendarIntegrationRepository.save(integration);
    }

    @Async
    public void triggerSync(UUID integrationId, UUID orgId) {
        calendarIntegrationRepository.findById(integrationId).ifPresent(calendarSyncService::syncIntegration);
    }

    private CalendarIntegrationResponse toResponse(CalendarIntegration ci) {
        return CalendarIntegrationResponse.builder()
                .id(ci.getId())
                .propertyId(ci.getPropertyId())
                .platform(ci.getPlatform())
                .icalUrl(ci.getIcalUrl())
                .displayName(ci.getDisplayName())
                .lastSyncAt(ci.getLastSyncAt())
                .lastSyncStatus(ci.getLastSyncStatus())
                .lastSyncError(ci.getLastSyncError())
                .syncIntervalMinutes(ci.getSyncIntervalMinutes())
                .enabled(ci.getEnabled())
                .reservationsSynced(ci.getReservationsSynced())
                .createdAt(ci.getCreatedAt())
                .build();
    }
}
