package com.smartlock.dto.request.guestpage;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class GenerateTapCodesRequest {

    @Min(1)
    @Max(1000)
    private int count;

    // Names the production run, e.g. "etsy-stand-2026-10"
    @NotBlank
    @Size(max = 100)
    @Pattern(regexp = "^[A-Za-z0-9 _.-]+$")
    private String batchLabel;
}
