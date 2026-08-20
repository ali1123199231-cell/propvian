package com.smartlock.dto.request.auth;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank
    @Email
    private String email;

    @NotBlank
    @Size(min = 8, max = 128)
    private String password;

    @Size(max = 100)
    private String firstName;

    @Size(max = 100)
    private String lastName;

    /** Legacy single-name field — used as firstName fallback */
    @Size(max = 200)
    private String name;

    // Marketing attribution — captured client-side on first landing, optional and untrusted.
    // Sizes mirror the users table columns so an oversized value is rejected rather than truncated.

    @Size(max = 255)
    private String gclid;

    @Size(max = 100)
    private String utmSource;

    @Size(max = 100)
    private String utmMedium;

    @Size(max = 150)
    private String utmCampaign;

    @Size(max = 255)
    private String utmTerm;

    @Size(max = 150)
    private String utmContent;

    @Size(max = 500)
    private String landingPage;

    @Size(max = 500)
    private String signupReferrer;
}
