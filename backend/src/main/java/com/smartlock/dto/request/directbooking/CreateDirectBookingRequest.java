package com.smartlock.dto.request.directbooking;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CreateDirectBookingRequest {

    @NotNull
    private String propertyId;

    @NotBlank
    private String guestName;

    @NotBlank
    @Email
    private String guestEmail;

    private String guestPhone;

    @NotNull
    @Min(1)
    private Integer numberOfGuests;

    @NotNull
    @Future
    private LocalDate checkInDate;

    @NotNull
    @Future
    private LocalDate checkOutDate;

    @DecimalMin("0.00")
    private BigDecimal totalAmount;

    private String currency;
    private String notes;
}
