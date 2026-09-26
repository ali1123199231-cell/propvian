package com.smartlock.dto.request.guestpage;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class GenerateTapCodesRequest {

    // Number of units (stands, cards or kits)
    @Min(1)
    @Max(1000)
    private int count;

    // Codes per unit: 1 for a stand or card, 3 for a tag trio
    @Min(1)
    @Max(10)
    private int kitSize = 1;

    // Names the production run, e.g. "etsy-stand-2026-10"
    @NotBlank
    @Size(max = 100)
    @Pattern(regexp = "^[A-Za-z0-9 _.-]+$")
    private String batchLabel;
}
