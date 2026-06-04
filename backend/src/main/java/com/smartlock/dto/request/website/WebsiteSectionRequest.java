package com.smartlock.dto.request.website;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class WebsiteSectionRequest {
    @NotBlank
    private String sectionType;
    private String title;
    private Boolean enabled;
    private Integer position;
    private JsonNode config; // accepts JSON object or null
}

