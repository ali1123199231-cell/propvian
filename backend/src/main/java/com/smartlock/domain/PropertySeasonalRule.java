package com.smartlock.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "property_seasonal_rules")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PropertySeasonalRule {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "property_id", nullable = false)
    private UUID propertyId;

    @Column(length = 100)
    private String name;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    // NULL means "inherit from property base rule"
    @Column(name = "min_stay_days")
    private Integer minStayDays;

    @Column(name = "max_stay_days")
    private Integer maxStayDays;

    @Column(name = "buffer_days_before")
    private Integer bufferDaysBefore;

    @Column(name = "buffer_days_after")
    private Integer bufferDaysAfter;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
