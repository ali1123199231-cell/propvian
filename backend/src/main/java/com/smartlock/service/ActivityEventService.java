package com.smartlock.service;

import com.smartlock.domain.ActivityEvent;
import com.smartlock.repository.ActivityEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ActivityEventService {

    private final ActivityEventRepository activityEventRepository;

    @Async
    public void track(UUID orgId, UUID actorId, String actorName,
                      String eventType, Map<String, Object> metadata) {
        log.debug("ActivityEventService.track — orgId={} actorId={} eventType={}", orgId, actorId, eventType);
        ActivityEvent event = ActivityEvent.builder()
                .organizationId(orgId)
                .entityType("BILLING")
                .actorId(actorId)
                .actorName(actorName)
                .eventType(eventType)
                .metadata(metadata)
                .build();
        activityEventRepository.save(event);
    }
}
