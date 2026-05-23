package com.smartlock.domain;

import com.smartlock.domain.base.BaseEntity;
import com.smartlock.domain.enums.AccessCodeStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "access_codes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccessCode extends BaseEntity {

    @Column(name = "reservation_id", nullable = false)
    private UUID reservationId;

    @Column(name = "lock_id", nullable = false)
    private UUID lockId;

    @Column(nullable = false, length = 20)
    private String pin;

    @Column(name = "ttlock_keyboard_pwd_id")
    private Long ttlockKeyboardPwdId;

    @Column(name = "ttlock_keyboard_pwd_name", length = 200)
    private String ttlockKeyboardPwdName;

    @Column(length = 50)
    @Builder.Default
    private String type = "TIME_SENSITIVE";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private AccessCodeStatus status = AccessCodeStatus.PENDING;

    @Column(name = "valid_from", nullable = false)
    private Instant validFrom;

    @Column(name = "valid_to", nullable = false)
    private Instant validTo;

    @Column(name = "created_via", length = 50)
    @Builder.Default
    private String createdVia = "AUTOMATIC";

    @Column(name = "sent_to_guest_at")
    private Instant sentToGuestAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @Column(name = "failure_reason", columnDefinition = "TEXT")
    private String failureReason;
}
