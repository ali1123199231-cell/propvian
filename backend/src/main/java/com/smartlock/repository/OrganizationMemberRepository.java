package com.smartlock.repository;

import com.smartlock.domain.OrganizationMember;
import com.smartlock.domain.enums.MemberRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrganizationMemberRepository extends JpaRepository<OrganizationMember, UUID> {
    Optional<OrganizationMember> findByOrganizationIdAndUserId(UUID organizationId, UUID userId);
    List<OrganizationMember> findByOrganizationId(UUID organizationId);
    List<OrganizationMember> findByUserId(UUID userId);
    boolean existsByOrganizationIdAndUserId(UUID organizationId, UUID userId);
    long countByOrganizationId(UUID organizationId);

    @Query("SELECT om FROM OrganizationMember om WHERE om.organizationId = :orgId AND om.role IN :roles")
    List<OrganizationMember> findByOrganizationIdAndRoleIn(UUID orgId, List<MemberRole> roles);
}
