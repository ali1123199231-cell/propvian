package com.smartlock.domain;

import com.smartlock.domain.enums.DomainSslStatus;
import com.smartlock.domain.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "property_domains")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PropertyDomain extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(nullable = false, length = 255, unique = true)
    private String domain;

    @Enumerated(EnumType.STRING)
    @Column(name = "ssl_status", nullable = false, length = 50)
    @Builder.Default
    private DomainSslStatus sslStatus = DomainSslStatus.PENDING;

    @Column(name = "dns_validated", nullable = false)
    @Builder.Default
    private boolean dnsValidated = false;

    @Column(name = "dns_validated_at")
    private Instant dnsValidatedAt;

    @Column(name = "verification_token", columnDefinition = "text")
    private String verificationToken;

    @Column(name = "is_primary", nullable = false)
    @Builder.Default
    private boolean primary = false;
}
