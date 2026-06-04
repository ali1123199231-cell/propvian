package com.smartlock.repository;

import com.smartlock.domain.WebsiteConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface WebsiteConfigRepository extends JpaRepository<WebsiteConfig, UUID> {
    Optional<WebsiteConfig> findByOrganizationId(UUID organizationId);
    boolean existsByOrganizationId(UUID organizationId);
}
