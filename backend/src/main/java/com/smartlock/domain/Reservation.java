package com.smartlock.domain;

import com.smartlock.domain.base.SoftDeletableEntity;
import com.smartlock.domain.enums.ReservationSource;
import com.smartlock.domain.enums.ReservationStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "reservations")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reservation extends SoftDeletableEntity {

    @Column(name = "property_id", nullable = false)
    private UUID propertyId;

    @Column(name = "guest_id")
    private UUID guestId;

    @Column(name = "external_id", length = 500)
    private String externalId;

    @Column(name = "ical_uid", length = 500)
    private String icalUid;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private ReservationSource source = ReservationSource.MANUAL;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private ReservationStatus status = ReservationStatus.CONFIRMED;

    @Column(name = "check_in_date", nullable = false)
    private Instant checkInDate;

    @Column(name = "check_out_date", nullable = false)
    private Instant checkOutDate;

    @Column(length = 100)
    @Builder.Default
    private String timezone = "UTC";

    @Column(name = "guest_name", length = 200)
    private String guestName;

    @Column(name = "guest_email", length = 255)
    private String guestEmail;

    @Column(name = "guest_phone", length = 50)
    private String guestPhone;

    @Column(name = "number_of_guests")
    private Integer numberOfGuests;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "total_amount", precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(length = 10)
    private String currency;

    @Column(name = "synced_at")
    private Instant syncedAt;

    @Column(name = "access_code_sent_at")
    private Instant accessCodeSentAt;

    @Column(name = "checkin_code", length = 20, unique = true)
    private String checkinCode;

    @Column(name = "host_notified_at")
    private Instant hostNotifiedAt;
}
