package com.smartlock.dto.response.directbooking;

import com.smartlock.domain.enums.DirectBookingStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
public class DirectBookingResponse {
    private String id;
    private String propertyId;
    private String organizationId;
    private String guestName;
    private String guestEmail;
    private String guestPhone;
    private int numberOfGuests;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private BigDecimal totalAmount;
    private String currency;
    private String paymentProvider;
    private String paymentStatus;
    private DirectBookingStatus status;
    private Instant cancelledAt;
    private String cancellationReason;
    private String notes;
    private Instant createdAt;
    private Instant updatedAt;
}
