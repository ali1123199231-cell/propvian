package com.smartlock.domain;

import com.smartlock.domain.base.SoftDeletableEntity;
import com.smartlock.domain.enums.PropertyStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.util.UUID;

@Entity
@Table(name = "properties")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Property extends SoftDeletableEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 500)
    private String address;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String state;

    @Column(length = 100)
    private String country;

    @Column(name = "postal_code", length = 20)
    private String postalCode;

    @Column(length = 100)
    @Builder.Default
    private String timezone = "UTC";

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private PropertyStatus status = PropertyStatus.ACTIVE;

    @Column(name = "cleaner_user_id")
    private UUID cleanerUserId;

    @Column(name = "max_guests")
    private Integer maxGuests;

    @Column
    private Integer bedrooms;

    @Column
    private Integer bathrooms;

    @Column(name = "wifi_details", columnDefinition = "TEXT")
    private String wifiDetails;

    @Column(name = "access_instructions", columnDefinition = "TEXT")
    private String accessInstructions;
}
