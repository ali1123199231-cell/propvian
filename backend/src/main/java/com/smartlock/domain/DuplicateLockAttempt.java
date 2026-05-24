package com.smartlock.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "duplicate_lock_attempts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DuplicateLockAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "attempted_user_id", nullable = false)
    private UUID attemptedUserId;

    @Column(name = "existing_owner_user_id", nullable = false)
    private UUID existingOwnerUserId;

    @Column(name = "ttlock_lock_id", nullable = false)
    private Long ttlockLockId;

    @Column(nullable = false, length = 100)
    @Builder.Default
    private String provider = "TTLOCK";

    @CreationTimestamp
    @Column(name = "attempted_at", nullable = false, updatable = false)
    private Instant attemptedAt;
}
