package com.smartlock.domain;

import com.smartlock.domain.base.SoftDeletableEntity;
import com.smartlock.domain.enums.Role;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends SoftDeletableEntity {

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "first_name", length = 100)
    private String firstName;

    @Column(name = "last_name", length = 100)
    private String lastName;

    @Column(length = 200)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private Role role = Role.USER;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(name = "email_verified")
    @Builder.Default
    private boolean emailVerified = false;

    @Column(name = "email_verification_token")
    private String emailVerificationToken;

    @Column(name = "password_reset_token")
    private String passwordResetToken;

    @Column(name = "password_reset_expires_at")
    private Instant passwordResetExpiresAt;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    @Column(name = "onboarding_step", length = 50)
    @Builder.Default
    private String onboardingStep = "COMPLETED";

    @Column(name = "onboarding_completed")
    @Builder.Default
    private boolean onboardingCompleted = true;

    @Column(name = "pending_ttlock_state_id")
    private UUID pendingTtlockStateId;

    @Column(name = "pending_ttlock_lock_id")
    private Long pendingTtlockLockId;

    @Column(name = "pending_ttlock_lock_name", length = 200)
    private String pendingTtlockLockName;

    public String getDisplayName() {
        if (name != null && !name.isBlank()) return name;
        if (firstName != null && !firstName.isBlank()) return firstName;
        return email.split("@")[0];
    }
}
