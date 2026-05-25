package com.smartlock.dto.response.organization;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationResponse {
    private UUID id;
    private String slug;
    private String name;
    private String logoUrl;
    private UUID ownerId;
    private String timezone;
    private String country;
    private String website;
    private boolean automationEnabled;
    private Instant createdAt;
}
