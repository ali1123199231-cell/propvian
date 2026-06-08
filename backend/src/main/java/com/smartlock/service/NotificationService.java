package com.smartlock.service;

import com.smartlock.domain.Notification;
import com.smartlock.domain.enums.NotificationType;
import com.smartlock.dto.response.notification.NotificationResponse;
import com.smartlock.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional
    public Notification createNotification(UUID userId, UUID orgId, NotificationType type,
                                           String title, String body, String entityType, UUID entityId) {
        log.debug("NotificationService.create — userId={} type={} entityType={}", userId, type, entityType);
        Notification notification = Notification.builder()
                .userId(userId)
                .organizationId(orgId)
                .type(type)
                .title(title)
                .body(body)
                .entityType(entityType)
                .entityId(entityId)
                .build();
        Notification saved = notificationRepository.save(notification);
        log.debug("NotificationService.create — saved id={}", saved.getId());
        return saved;
    }

    @Transactional(readOnly = true)
    public Page<NotificationResponse> getNotifications(UUID userId, Pageable pageable) {
        log.debug("NotificationService.getNotifications — userId={} page={}", userId, pageable.getPageNumber());
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        long count = notificationRepository.countByUserIdAndReadAtIsNull(userId);
        log.debug("NotificationService.getUnreadCount — userId={} unread={}", userId, count);
        return count;
    }

    @Transactional
    public void markAsRead(UUID notificationId, UUID userId) {
        log.debug("NotificationService.markAsRead — notificationId={} userId={}", notificationId, userId);
        notificationRepository.findById(notificationId).ifPresent(n -> {
            if (n.getUserId().equals(userId) && n.getReadAt() == null) {
                n.setReadAt(Instant.now());
                notificationRepository.save(n);
                log.debug("NotificationService.markAsRead — marked");
            }
        });
    }

    @Transactional
    public void markAllAsRead(UUID userId) {
        log.info("NotificationService.markAllAsRead — userId={}", userId);
        notificationRepository.markAllReadByUserId(userId, Instant.now());
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .type(n.getType().name())
                .title(n.getTitle())
                .body(n.getBody())
                .entityType(n.getEntityType())
                .entityId(n.getEntityId())
                .actionUrl(n.getActionUrl())
                .read(n.isRead())
                .readAt(n.getReadAt())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
