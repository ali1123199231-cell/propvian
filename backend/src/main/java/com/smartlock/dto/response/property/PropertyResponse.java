package com.smartlock.dto.response.property;

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
public class PropertyResponse {
    private UUID id;
    private UUID organizationId;
    private String name;
    private String address;
    private String city;
    private String state;
    private String country;
    private String postalCode;
    private String timezone;
    private String description;
    private String imageUrl;
    private String status;
    private UUID cleanerUserId;
    private Integer maxGuests;
    private Integer bedrooms;
    private Integer bathrooms;
    private long lockCount;
    private long activeReservationCount;
    private Instant createdAt;
}
