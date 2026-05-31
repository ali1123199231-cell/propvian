package com.smartlock.repository;

import com.smartlock.domain.PropertyDomain;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PropertyDomainRepository extends JpaRepository<PropertyDomain, UUID> {

    List<PropertyDomain> findByOrganizationId(UUID organizationId);

    Optional<PropertyDomain> findByDomain(String domain);

    Optional<PropertyDomain> findByOrganizationIdAndPrimaryTrue(UUID organizationId);
}
