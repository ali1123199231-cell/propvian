package com.smartlock.domain;

import com.smartlock.domain.enums.TapCodeKind;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "tap_codes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TapCode {

    @Id
    @Column(length = 16, updatable = false, nullable = false)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TapCodeKind kind;

    // Both stay null on a PRODUCT code until it is claimed
    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "property_id")
    private UUID propertyId;

    @Column(name = "batch_label", length = 100)
    private String batchLabel;

    @Column(name = "claimed_at")
    private Instant claimedAt;

    @Column(name = "claimed_by")
    private UUID claimedBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
