package com.smartlock.domain;

import com.smartlock.domain.enums.SubscriptionTier;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "subscription_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50, unique = true)
    private SubscriptionTier tier;

    @Column(name = "monthly_price", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal monthlyPrice = BigDecimal.ZERO;

    @Column(name = "yearly_price", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal yearlyPrice = BigDecimal.ZERO;

    @Column(name = "max_properties", nullable = false)
    @Builder.Default
    private Integer maxProperties = 1;

    @Column(name = "max_locks", nullable = false)
    @Builder.Default
    private Integer maxLocks = 1;

    @Column(name = "max_members", nullable = false)
    @Builder.Default
    private Integer maxMembers = 1;

    @Column(name = "max_reservations_per_month")
    private Integer maxReservationsPerMonth;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> features;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
