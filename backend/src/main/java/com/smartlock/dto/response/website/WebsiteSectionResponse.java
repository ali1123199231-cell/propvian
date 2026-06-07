package com.smartlock.dto.response.website;

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

    private Object config;

    private Instant createdAt;
    private Instant updatedAt;
}
