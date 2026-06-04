package com.smartlock.domain;

import com.smartlock.domain.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "conversations")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Conversation extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "property_id")
    private UUID propertyId;

    @Column(name = "direct_booking_id")
    private UUID directBookingId;

    @Column(name = "guest_name", nullable = false)
    private String guestName;

    @Column(name = "guest_email", nullable = false)
    private String guestEmail;

    @Column(name = "guest_access_token", nullable = false, unique = true)
    private String guestAccessToken;

    @Column(name = "unread_host_count", nullable = false)
    private int unreadHostCount = 0;

    @Column(name = "last_message_at", nullable = false)
    private Instant lastMessageAt;
}
