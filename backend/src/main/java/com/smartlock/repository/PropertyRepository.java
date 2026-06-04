package com.smartlock.repository;

import com.smartlock.domain.Property;
import com.smartlock.domain.enums.PropertyStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PropertyRepository extends JpaRepository<Property, UUID> {
    List<Property> findByOrganizationId(UUID organizationId);
    Page<Property> findByOrganizationId(UUID organizationId, Pageable pageable);
    List<Property> findByOrganizationIdAndStatus(UUID organizationId, PropertyStatus status);
    long countByOrganizationId(UUID organizationId);
    long countByOrganizationIdAndStatus(UUID organizationId, PropertyStatus status);
    Optional<Property> findBySlug(String slug);
    Optional<Property> findByIcalExportToken(String token);

    @Query("SELECT p FROM Property p JOIN Organization o ON p.organizationId = o.id WHERE o.slug = :orgSlug AND p.deletedAt IS NULL ORDER BY p.createdAt ASC")
    List<Property> findByOrganizationSlug(@Param("orgSlug") String orgSlug);
}
