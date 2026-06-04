package com.smartlock.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "property_house_rules",
       uniqueConstraints = @UniqueConstraint(columnNames = {"property_id", "rule_key"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PropertyHouseRule {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "property_id", nullable = false)
    private UUID propertyId;

    // PETS | SMOKING | PARTIES | QUIET_HOURS | CHILDREN | EVENTS | ...
    @Column(name = "rule_key", nullable = false, length = 50)
    private String ruleKey;

    @Column(nullable = false)
    private boolean allowed;

    @Column(columnDefinition = "text")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
