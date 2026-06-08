package com.smartlock.service;

import com.smartlock.exception.AppException;
import com.smartlock.repository.OrganizationMemberRepository;
import com.smartlock.repository.PropertyRepository;
import com.smartlock.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Central guard for org-level authorization.
 * Every service that handles org-scoped data must call requireOrgAccess() at the top.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OrganizationSecurityService {

    private final OrganizationMemberRepository memberRepository;
    private final PropertyRepository propertyRepository;

    /** Throws 403 if the current principal is not a member of orgId (admins bypass). */
    public void requireOrgAccess(UUID orgId) {
        CustomUserDetails principal = currentPrincipal();
        if (isAdmin(principal)) {
            log.debug("OrgSecurity.requireOrgAccess — ADMIN bypass orgId={}", orgId);
            return;
        }
        if (!memberRepository.existsByOrganizationIdAndUserId(orgId, principal.getUserId())) {
            log.warn("OrgSecurity.requireOrgAccess — DENIED userId={} orgId={}", principal.getUserId(), orgId);
            throw new AppException("Access denied to organization", HttpStatus.FORBIDDEN, "ORG_ACCESS_DENIED");
        }
        log.debug("OrgSecurity.requireOrgAccess — granted userId={} orgId={}", principal.getUserId(), orgId);
    }

    /** Throws 403 if the current principal's org does not own the given property. */
    public void requirePropertyAccess(UUID propertyId) {
        CustomUserDetails principal = currentPrincipal();
        if (isAdmin(principal)) {
            log.debug("OrgSecurity.requirePropertyAccess — ADMIN bypass propertyId={}", propertyId);
            return;
        }
        UUID orgId = principal.getActiveOrgId();
        if (orgId == null) {
            log.warn("OrgSecurity.requirePropertyAccess — no active org for userId={}", principal.getUserId());
            throw new AppException("No active organization", HttpStatus.FORBIDDEN, "NO_ORG");
        }
        boolean owns = propertyRepository.findById(propertyId)
                .map(p -> p.getOrganizationId().equals(orgId))
                .orElse(false);
        if (!owns) {
            log.warn("OrgSecurity.requirePropertyAccess — DENIED userId={} propertyId={} orgId={}", principal.getUserId(), propertyId, orgId);
            throw new AppException("Access denied to property", HttpStatus.FORBIDDEN, "PROPERTY_ACCESS_DENIED");
        }
        log.debug("OrgSecurity.requirePropertyAccess — granted propertyId={} orgId={}", propertyId, orgId);
    }

    public UUID currentOrgId() {
        return currentPrincipal().getActiveOrgId();
    }

    private CustomUserDetails currentPrincipal() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof CustomUserDetails ud) return ud;
        throw new AppException("Unauthorized", HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
    }

    private boolean isAdmin(CustomUserDetails p) {
        return "ADMIN".equals(p.getRole());
    }
}
