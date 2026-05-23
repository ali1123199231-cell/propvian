package com.smartlock.repository;

import com.smartlock.domain.Guest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface GuestRepository extends JpaRepository<Guest, UUID> {
    Optional<Guest> findByOrganizationIdAndEmail(UUID organizationId, String email);
    Page<Guest> findByOrganizationId(UUID organizationId, Pageable pageable);
}
