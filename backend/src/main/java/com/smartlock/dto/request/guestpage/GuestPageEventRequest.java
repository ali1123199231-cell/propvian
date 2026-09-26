package com.smartlock.dto.request.guestpage;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class GuestPageEventRequest {
    @NotBlank
    @Size(max = 30)
    private String type;
}
