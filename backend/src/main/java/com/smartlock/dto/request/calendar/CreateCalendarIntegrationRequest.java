package com.smartlock.dto.request.calendar;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.hibernate.validator.constraints.URL;

@Data
public class CreateCalendarIntegrationRequest {
    @NotBlank
    private String platform;

    @NotBlank
    @URL
    @Size(max = 2000)
    private String icalUrl;

    @Size(max = 200)
    private String displayName;

    private Integer syncIntervalMinutes;
}
