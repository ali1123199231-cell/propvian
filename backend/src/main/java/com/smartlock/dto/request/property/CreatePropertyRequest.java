package com.smartlock.dto.request.property;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
public class CreatePropertyRequest {
    @NotBlank
    @Size(min = 2, max = 200)
    private String name;

    @Size(max = 500)
    private String address;

    @Size(max = 100)
    private String city;

    @Size(max = 100)
    private String state;

    @Size(max = 100)
    private String country;

    @Size(max = 20)
    private String postalCode;

    @Size(max = 100)
    private String timezone;

    private String description;

    private String imageUrl;

    private Integer maxGuests;
    private Integer bedrooms;
    private Integer bathrooms;

    private UUID cleanerUserId;
}
