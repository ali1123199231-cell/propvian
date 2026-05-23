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
import com.smartlock.exception.DuplicateResourceException;
import com.smartlock.exception.ResourceNotFoundException;
import com.smartlock.repository.*;
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
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", orgId));
        return toResponse(org);
    }

    @Transactional(readOnly = true)
    public List<OrganizationResponse> getUserOrganizations(UUID userId) {
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
        return toMemberResponse(member, user);
    }

    @Transactional
    public void removeMember(UUID orgId, UUID userId) {
        OrganizationMember member = memberRepository.findByOrganizationIdAndUserId(orgId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found"));

        if (member.getRole() == MemberRole.OWNER) {
            throw new IllegalStateException("Cannot remove the organization owner");
        }

        memberRepository.delete(member);
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
