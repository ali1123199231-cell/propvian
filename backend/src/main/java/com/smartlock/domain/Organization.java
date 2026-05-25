package com.smartlock.domain;

import com.smartlock.domain.base.SoftDeletableEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.util.UUID;

@Entity
@Table(name = "organizations")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Organization extends SoftDeletableEntity {

    @Column(nullable = false, unique = true, length = 100)
    private String slug;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @Column(length = 100)
    @Builder.Default
    private String timezone = "UTC";

    @Column(length = 100)
    private String country;

    @Column(length = 500)
    private String website;

    @Column(name = "automation_enabled", nullable = false)
    @Builder.Default
    private boolean automationEnabled = false;
}
