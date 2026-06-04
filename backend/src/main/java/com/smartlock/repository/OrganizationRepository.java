package com.smartlock.repository;

import com.smartlock.domain.Organization;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, UUID> {
    Optional<Organization> findBySlug(String slug);
    boolean existsBySlug(String slug);
    List<Organization> findByOwnerId(UUID ownerId);
    List<Organization> findByAutomationEnabledTrue();

    @Query("SELECT o FROM Organization o WHERE (:q IS NULL OR LOWER(o.name) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(o.slug) LIKE LOWER(CONCAT('%', :q, '%')))")
    Page<Organization> searchOrganizations(@Param("q") String q, Pageable pageable);

    @Modifying
    @Query(value = "UPDATE organizations SET deleted_at = NULL, updated_at = NOW(), version = version + 1 WHERE id = :orgId", nativeQuery = true)
    void restoreById(@Param("orgId") UUID orgId);
}
