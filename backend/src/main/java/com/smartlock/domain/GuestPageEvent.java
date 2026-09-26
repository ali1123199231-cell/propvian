package com.smartlock.domain;

import com.smartlock.domain.enums.GuestPageEventType;
import com.smartlock.domain.enums.TapSource;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "guest_page_events")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GuestPageEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 16)
    private String code;

    @Column(name = "property_id")
    private UUID propertyId;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 30)
    private GuestPageEventType eventType;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private TapSource source;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
