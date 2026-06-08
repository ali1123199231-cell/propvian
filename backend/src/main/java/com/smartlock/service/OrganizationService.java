package com.smartlock.service;

import com.smartlock.domain.Organization;
import com.smartlock.domain.OrganizationMember;
import com.smartlock.domain.Subscription;
import com.smartlock.domain.SubscriptionPlan;
import com.smartlock.domain.User;
import com.smartlock.domain.enums.MemberRole;
import com.smartlock.domain.enums.SubscriptionStatus;
import com.smartlock.domain.enums.SubscriptionTier;
import com.smartlock.dto.request.organization.CreateOrganizationRequest;
import com.smartlock.dto.request.organization.InviteMemberRequest;
import com.smartlock.dto.response.organization.OrganizationMemberResponse;
import com.smartlock.dto.response.organization.OrganizationResponse;
import com.smartlock.exception.AppException;
import com.smartlock.exception.DuplicateResourceException;
import com.smartlock.exception.ResourceNotFoundException;
import com.smartlock.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.context.annotation.Lazy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final OrganizationMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionPlanRepository planRepository;
    @Lazy private final OrganizationSecurityService orgSecurity;

    @Transactional
    public OrganizationResponse createOrganization(CreateOrganizationRequest request, UUID ownerId) {
        String slug = generateUniqueSlug(request.getName());

        Organization org = Organization.builder()
                .name(request.getName())
                .slug(slug)
                .ownerId(ownerId)
                .timezone(request.getTimezone() != null ? request.getTimezone() : "UTC")
                .country(request.getCountry())
                .website(request.getWebsite())
                .build();

        org = organizationRepository.save(org);

        OrganizationMember ownerMember = OrganizationMember.builder()
                .organizationId(org.getId())
                .userId(ownerId)
                .role(MemberRole.OWNER)
                .acceptedAt(Instant.now())
                .build();
        memberRepository.save(ownerMember);

        SubscriptionPlan freePlan = planRepository.findByTier(SubscriptionTier.FREE)
                .orElseThrow(() -> new ResourceNotFoundException("Free plan not found"));

        Subscription subscription = Subscription.builder()
                .organizationId(org.getId())
                .planId(freePlan.getId())
                .status(SubscriptionStatus.TRIALING)
                .currentPeriodStart(Instant.now())
                .currentPeriodEnd(Instant.now().plusSeconds(30L * 24 * 3600))
                .trialEnd(Instant.now().plusSeconds(30L * 24 * 3600))
                .build();
        subscriptionRepository.save(subscription);

        log.info("Organization created: {} ({})", org.getName(), org.getId());
        return toResponse(org);
    }

    @Transactional(readOnly = true)
    public OrganizationResponse getOrganization(UUID orgId) {
        log.debug("OrganizationService.getOrganization — orgId={}", orgId);
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", orgId));
        return toResponse(org);
    }

    @Transactional
    public OrganizationResponse updateOrganization(UUID orgId, String name, String timezone,
                                                    String country, String website, UUID requestingUserId) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", orgId));
        if (name != null && !name.isBlank()) org.setName(name);
        if (timezone != null && !timezone.isBlank()) org.setTimezone(timezone);
        if (country != null) org.setCountry(country.isBlank() ? null : country);
        if (website != null) org.setWebsite(website.isBlank() ? null : website);
        org = organizationRepository.save(org);
        log.info("Organization {} updated by {}", orgId, requestingUserId);
        return toResponse(org);
    }

    @Transactional
    public OrganizationResponse updateSlug(UUID orgId, String desiredSlug, UUID requestingUserId) {
        orgSecurity.requireOrgAccess(orgId);

        if (desiredSlug == null || desiredSlug.isBlank())
            throw new AppException("Slug cannot be empty", HttpStatus.BAD_REQUEST);

        String slug = desiredSlug.toLowerCase().trim();
        if (!slug.matches("^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$") || slug.contains("--"))
            throw new AppException(
                "Site address must be 3–50 characters, lowercase letters, numbers and hyphens only — no consecutive hyphens, and cannot start or end with a hyphen",
                HttpStatus.BAD_REQUEST);

        // Block reserved words that could conflict with platform routes
        if (slug.matches("^(www|api|admin|app|mail|static|cdn|assets|blog|pricing|legal|login|register|dashboard|sites|book|public|onboarding)$"))
            throw new AppException("That address is reserved. Please choose another.", HttpStatus.BAD_REQUEST);

        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", orgId));

        // Allow keeping the same slug (idempotent)
        if (!slug.equals(org.getSlug()) && organizationRepository.existsBySlug(slug))
            throw new AppException("That address is already taken. Try another.", HttpStatus.CONFLICT);

        org.setSlug(slug);
        org = organizationRepository.save(org);
        log.info("Organization {} slug updated to '{}' by {}", orgId, slug, requestingUserId);
        return toResponse(org);
    }

    private static final java.util.Set<String> RESERVED = java.util.Set.of(
        "www", "api", "admin", "app", "mail", "static", "cdn", "assets", "blog",
        "pricing", "legal", "login", "register", "dashboard", "sites", "book",
        "public", "onboarding", "help", "support", "status"
    );

    @Transactional(readOnly = true)
    public boolean isSlugAvailable(String slug) {
        if (slug == null || !slug.matches("^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$")) return false;
        if (slug.contains("--")) return false;
        if (RESERVED.contains(slug)) return false;
        return !organizationRepository.existsBySlug(slug);
    }

    @Transactional(readOnly = true)
    public List<OrganizationResponse> getUserOrganizations(UUID userId) {
        log.debug("OrganizationService.getUserOrganizations — userId={}", userId);
        return memberRepository.findByUserId(userId).stream()
                .map(member -> organizationRepository.findById(member.getOrganizationId()))
                .filter(opt -> opt.isPresent())
                .map(opt -> toResponse(opt.get()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OrganizationMemberResponse> getMembers(UUID orgId) {
        return memberRepository.findByOrganizationId(orgId).stream()
                .map(member -> {
                    User user = userRepository.findById(member.getUserId()).orElse(null);
                    return toMemberResponse(member, user);
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public OrganizationMemberResponse inviteMember(UUID orgId, InviteMemberRequest request, UUID invitedById) {
        log.info("OrganizationService.inviteMember — orgId={} invitedBy={} role={}", orgId, invitedById, request.getRole());
        User user = userRepository.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + request.getEmail()));

        if (memberRepository.existsByOrganizationIdAndUserId(orgId, user.getId())) {
            throw new DuplicateResourceException("User is already a member of this organization");
        }

        OrganizationMember member = OrganizationMember.builder()
                .organizationId(orgId)
                .userId(user.getId())
                .role(request.getRole())
                .invitedById(invitedById)
                .invitedAt(Instant.now())
                .acceptedAt(Instant.now())
                .build();

        member = memberRepository.save(member);
        log.info("OrganizationService.inviteMember — added userId={} to orgId={} role={}", user.getId(), orgId, request.getRole());
        return toMemberResponse(member, user);
    }

    @Transactional
    public void removeMember(UUID orgId, UUID userId) {
        log.info("OrganizationService.removeMember — orgId={} userId={}", orgId, userId);
        OrganizationMember member = memberRepository.findByOrganizationIdAndUserId(orgId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found"));

        if (member.getRole() == MemberRole.OWNER) {
            log.warn("OrganizationService.removeMember — blocked: cannot remove owner userId={}", userId);
            throw new IllegalStateException("Cannot remove the organization owner");
        }

        memberRepository.delete(member);
        log.info("OrganizationService.removeMember — removed userId={} from orgId={}", userId, orgId);
    }

    private OrganizationResponse toResponse(Organization org) {
        return OrganizationResponse.builder()
                .id(org.getId())
                .slug(org.getSlug())
                .name(org.getName())
                .logoUrl(org.getLogoUrl())
                .ownerId(org.getOwnerId())
                .timezone(org.getTimezone())
                .country(org.getCountry())
                .website(org.getWebsite())
                .automationEnabled(org.isAutomationEnabled())
                .createdAt(org.getCreatedAt())
                .build();
    }

    private OrganizationMemberResponse toMemberResponse(OrganizationMember member, User user) {
        return OrganizationMemberResponse.builder()
                .id(member.getId())
                .userId(member.getUserId())
                .email(user != null ? user.getEmail() : null)
                .firstName(user != null ? user.getFirstName() : null)
                .lastName(user != null ? user.getLastName() : null)
                .avatarUrl(user != null ? user.getAvatarUrl() : null)
                .role(member.getRole().name())
                .joinedAt(member.getAcceptedAt())
                .build();
    }

    private String generateUniqueSlug(String name) {
        String baseSlug = AuthService.slugify(name);
        String slug = baseSlug;
        int counter = 1;
        while (organizationRepository.existsBySlug(slug)) {
            slug = baseSlug + "-" + counter++;
        }
        return slug;
    }
}
