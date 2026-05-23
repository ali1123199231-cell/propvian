package com.smartlock.domain;

import com.smartlock.domain.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "calendar_integrations")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CalendarIntegration extends BaseEntity {

    @Column(name = "property_id", nullable = false)
    private UUID propertyId;

    @Column(nullable = false, length = 50)
    private String platform;

    @Column(name = "ical_url", nullable = false, length = 2000)
    private String icalUrl;

    @Column(name = "display_name", length = 200)
    private String displayName;

    @Column(name = "last_sync_at")
    private Instant lastSyncAt;

    @Column(name = "last_sync_status", length = 50)
    private String lastSyncStatus;

    @Column(name = "last_sync_error", columnDefinition = "TEXT")
    private String lastSyncError;

    @Column(name = "sync_interval_minutes")
    @Builder.Default
    private Integer syncIntervalMinutes = 15;

    @Column(nullable = false)
    @Builder.Default
    private Boolean enabled = true;

    @Column(length = 500)
    private String etag;

    @Column(name = "reservations_synced")
    @Builder.Default
    private Integer reservationsSynced = 0;

    @Column(name = "deleted_at")
    private Instant deletedAt;
}
