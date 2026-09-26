package com.smartlock.repository;

import com.smartlock.domain.GuestPage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GuestPageRepository extends JpaRepository<GuestPage, UUID> {
    Optional<GuestPage> findByPropertyId(UUID propertyId);
    List<GuestPage> findByOrganizationId(UUID organizationId);
}
