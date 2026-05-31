package com.smartlock.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "guest_reviews")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GuestReview {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "property_id", nullable = false)
    private UUID propertyId;

    @Column(name = "booking_id")
    private UUID bookingId;

    @Column(name = "guest_name", length = 255)
    private String guestName;

    @Column(nullable = false)
    private int rating;

    @Column(columnDefinition = "text")
    private String comment;

    @Column(name = "cleanliness_rating")
    private Integer cleanlinessRating;

    @Column(name = "communication_rating")
    private Integer communicationRating;

    @Column(name = "location_rating")
    private Integer locationRating;

    @Column(name = "accuracy_rating")
    private Integer accuracyRating;

    @Column(name = "host_reply", columnDefinition = "text")
    private String hostReply;

    @Column(name = "host_replied_at")
    private Instant hostRepliedAt;

    @Column(name = "is_public", nullable = false)
    @Builder.Default
    private boolean publicReview = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
