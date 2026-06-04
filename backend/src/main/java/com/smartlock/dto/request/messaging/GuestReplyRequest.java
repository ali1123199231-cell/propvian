package com.smartlock.dto.request.messaging;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class GuestReplyRequest {

    @NotBlank
    @Size(max = 5000)
    private String body;
}
