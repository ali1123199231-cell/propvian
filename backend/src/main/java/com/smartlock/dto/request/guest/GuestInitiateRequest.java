package com.smartlock.dto.request.guest;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class GuestInitiateRequest {
    @NotBlank
    private String guestName;
    @Email @NotBlank
    private String guestEmail;
    private String guestPhone;
    @NotNull
    private LocalDate checkInDate;
    @NotNull
    private LocalDate checkOutDate;
    @Min(1)
    private int numberOfGuests;
    @NotBlank
    private String paymentProvider; // "stripe" or "paypal"
    private String promoCode;       // optional discount code
}
