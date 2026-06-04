package com.smartlock.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "calendar_intervals")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CalendarInterval {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "property_id", nullable = false)
    private UUID propertyId;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    // Exclusive: checkout day is NOT blocked (half-open interval [start, end))
    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    // BOOKED | BLOCKED | RESERVED | MAINTENANCE | BUFFER
    @Column(nullable = false, length = 20)
    private String state;

    @Column(name = "booking_id")
    private UUID bookingId;

    @Column(name = "hold_id")
    private UUID holdId;

    @Column(name = "blocked_by")
    private UUID blockedBy;

    @Column(columnDefinition = "text")
    private String note;

    // Only set for RESERVED state
    @Column(name = "expires_at")
    private Instant expiresAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
