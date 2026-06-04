package com.smartlock.dto.response.website;

import com.fasterxml.jackson.annotation.JsonRawValue;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class WebsiteSectionResponse {
    private UUID id;
    private UUID websiteId;
    private String sectionType;
    private String title;
    private boolean enabled;
    private int position;

    @JsonRawValue
    private String config;

    private Instant createdAt;
    private Instant updatedAt;
}
