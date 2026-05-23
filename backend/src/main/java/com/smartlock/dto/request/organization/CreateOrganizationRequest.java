package com.smartlock.dto.request.organization;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateOrganizationRequest {
    @NotBlank
    @Size(min = 2, max = 200)
    private String name;

    @Size(max = 100)
    private String country;

    @Size(max = 100)
    private String timezone;

    @Size(max = 500)
    private String website;
}
