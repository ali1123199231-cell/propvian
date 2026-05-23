package com.smartlock.dto.response.reservation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservationResponse {
    private UUID id;
    private UUID propertyId;
    private String propertyName;
    private UUID guestId;
    private String externalId;
    private String icalUid;
    private String source;
    private String status;
    private Instant checkInDate;
    private Instant checkOutDate;
    private String timezone;
    private String guestName;
    private String guestEmail;
    private String guestPhone;
    private Integer numberOfGuests;
    private String notes;
    private BigDecimal totalAmount;
    private String currency;
    private Instant syncedAt;
    private Instant accessCodeSentAt;
    private boolean hasAccessCode;
    private Instant createdAt;
}
