package com.smartlock.domain;

import com.smartlock.domain.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "guests",
    uniqueConstraints = @UniqueConstraint(columnNames = {"organization_id", "email"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Guest extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(length = 255)
    private String email;

    @Column(length = 200)
    private String name;

    @Column(length = 50)
    private String phone;

    @Column(name = "preferred_language", length = 10)
    @Builder.Default
    private String preferredLanguage = "en";

    @Column(name = "total_stays")
    @Builder.Default
    private Integer totalStays = 0;

    @Column(name = "last_stay_at")
    private Instant lastStayAt;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
