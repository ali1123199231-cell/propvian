package com.smartlock.dto.request.messaging;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SendGuestMessageRequest {

    @NotBlank
    @Size(max = 255)
    private String guestName;

    @NotBlank
    @Email
    private String guestEmail;

    @NotBlank
    @Size(max = 5000)
    private String body;
}
