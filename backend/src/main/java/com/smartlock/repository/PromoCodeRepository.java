package com.smartlock.repository;

import com.smartlock.domain.PromoCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PromoCodeRepository extends JpaRepository<PromoCode, UUID> {
    List<PromoCode> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);
    Optional<PromoCode> findByOrganizationIdAndCodeIgnoreCase(UUID organizationId, String code);
    boolean existsByOrganizationIdAndCodeIgnoreCase(UUID organizationId, String code);
}
