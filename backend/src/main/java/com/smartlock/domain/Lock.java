package com.smartlock.domain;

import com.smartlock.domain.base.SoftDeletableEntity;
import com.smartlock.domain.enums.LockStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "locks")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Lock extends SoftDeletableEntity {

    @Column(name = "property_id", nullable = false)
    private UUID propertyId;

    @Column(length = 200)
    private String name;

    @Column(name = "ttlock_lock_id")
    private Long ttlockLockId;

    @Column(name = "ttlock_lock_alias", length = 200)
    private String ttlockLockAlias;

    @Column(name = "ttlock_feature_value", length = 500)
    private String ttlockFeatureValue;

    @Column(name = "ttlock_user_id", length = 200)
    private String ttlockUserId;

    @Column(name = "ttlock_access_token", columnDefinition = "TEXT")
    private String ttlockAccessToken;

    @Column(name = "ttlock_refresh_token", columnDefinition = "TEXT")
    private String ttlockRefreshToken;

    @Column(name = "token_expires_at")
    private Instant tokenExpiresAt;

    @Column(name = "battery_level")
    private Integer batteryLevel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private LockStatus status = LockStatus.DISCONNECTED;

    @Column(name = "last_sync_at")
    private Instant lastSyncAt;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
