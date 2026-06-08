package com.smartlock.repository;

import com.smartlock.domain.HostVerification;
import com.smartlock.domain.enums.VerificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface HostVerificationRepository extends JpaRepository<HostVerification, UUID> {

    Optional<HostVerification> findByOrganizationId(UUID organizationId);

    Optional<HostVerification> findByCustomDomainAndDomainStatus(String customDomain, VerificationStatus domainStatus);

    boolean existsByCustomDomainAndDomainStatus(String customDomain, VerificationStatus domainStatus);

    Page<HostVerification> findByAdminStatus(VerificationStatus adminStatus, Pageable pageable);

    long countByAdminStatus(VerificationStatus adminStatus);
}
