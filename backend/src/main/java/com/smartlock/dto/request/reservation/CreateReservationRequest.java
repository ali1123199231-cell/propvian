package com.smartlock.dto.request.reservation;

import com.smartlock.domain.enums.ReservationSource;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.Instant;

@Data
public class CreateReservationRequest {
    @NotNull
    private Instant checkInDate;

    @NotNull
    private Instant checkOutDate;

    private String guestName;

    @Email
    private String guestEmail;

    private String guestPhone;

    private Integer numberOfGuests;

    private String notes;

    private String timezone;

    private ReservationSource source;

    private String externalId;
}
