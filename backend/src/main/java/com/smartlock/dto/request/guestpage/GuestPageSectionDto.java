package com.smartlock.dto.request.guestpage;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** One block of the guest page. Shared by the editor request and both responses. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuestPageSectionDto {

    @Size(max = 40)
    private String id;

    // HOUSE_RULES also renders the property's structured rules above the body text
    @NotBlank
    @Pattern(regexp = "CHECKIN|CHECKOUT|HOUSE_RULES|LOCAL_TIPS|APPLIANCES|PARKING|EMERGENCY|CUSTOM")
    private String type;

    @NotBlank
    @Size(max = 100)
    private String title;

    @Size(max = 4000)
    private String body;
}
