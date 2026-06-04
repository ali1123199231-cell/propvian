package com.smartlock.service;

import com.smartlock.domain.HostVerification;
import com.smartlock.domain.Organization;
import com.smartlock.domain.Subscription;
import com.smartlock.domain.User;
import com.smartlock.domain.enums.Role;
import com.smartlock.domain.enums.SubscriptionStatus;
import com.smartlock.domain.enums.VerificationStatus;
import com.smartlock.dto.response.admin.*;
import com.smartlock.dto.response.common.PageResponse;
import com.smartlock.exception.AppException;
import com.smartlock.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final HostVerificationRepository hostVerificationRepository;
    private final ErrorLogRepository errorLogRepository;

    // ── Dashboard ─────────────────────────────────────────────────────────────

    public AdminDashboardResponse getDashboard() {
        long totalUsers = userRepository.count();
        long totalOrgs  = organizationRepository.count();
        long pendingVerifs  = hostVerificationRepository.countByAdminStatus(VerificationStatus.PENDING);
        long approvedVerifs = hostVerificationRepository.countByAdminStatus(VerificationStatus.APPROVED);

        long activeSubs   = subscriptionRepository.countByStatus(SubscriptionStatus.ACTIVE);
        long trialingSubs = subscriptionRepository.countByStatus(SubscriptionStatus.TRIALING);

        Instant since24h = Instant.now().minus(24, ChronoUnit.HOURS);
        long recentErrors = errorLogRepository.countByCreatedAtAfter(since24h);

        return AdminDashboardResponse.builder()
                .totalUsers(totalUsers)
                .totalOrganizations(totalOrgs)
                .pendingVerifications(pendingVerifs)
                .approvedVerifications(approvedVerifs)
                .activeSubscriptions(activeSubs)
                .trialingSubscriptions(trialingSubs)
                .recentErrors(recentErrors)
                .build();
    }

    // ── Users ─────────────────────────────────────────────────────────────────

    public PageResponse<AdminUserResponse> listUsers(String q, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<User> users = (q != null && !q.isBlank())
                ? userRepository.searchUsers(q, pageable)
                : userRepository.findAll(pageable);
        return PageResponse.from(users.map(AdminUserResponse::from));
    }

    public AdminUserResponse getUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));
        return AdminUserResponse.from(user);
    }

    @Transactional
    public AdminUserResponse changeUserRole(UUID userId, Role newRole) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));
        user.setRole(newRole);
        return AdminUserResponse.from(userRepository.save(user));
    }

    @Transactional
    public void deactivateUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));
        user.softDelete();
        userRepository.save(user);
    }

    // ── Organizations ─────────────────────────────────────────────────────────

    public PageResponse<AdminOrgResponse> listOrganizations(String q, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Organization> orgs = (q != null && !q.isBlank())
                ? organizationRepository.searchOrganizations(q, pageable)
                : organizationRepository.findAll(pageable);
        return PageResponse.from(orgs.map(org -> buildOrgResponse(org)));
    }

    public AdminOrgResponse getOrganization(UUID orgId) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new AppException("Organization not found", HttpStatus.NOT_FOUND));
        return buildOrgResponse(org);
    }

    @Transactional
    public void suspendOrganization(UUID orgId) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new AppException("Organization not found", HttpStatus.NOT_FOUND));
        org.softDelete();
        organizationRepository.save(org);
    }

    @Transactional
    public void restoreOrganization(UUID orgId) {
        organizationRepository.restoreById(orgId);
    }

    private AdminOrgResponse buildOrgResponse(Organization org) {
        String ownerEmail = userRepository.findById(org.getOwnerId())
                .map(User::getEmail).orElse(null);
        Optional<Subscription> sub = subscriptionRepository.findByOrganizationId(org.getId());
        Optional<HostVerification> hv = hostVerificationRepository.findByOrganizationId(org.getId());
        String adminVerifStatus = hv.map(v -> v.getAdminStatus().name()).orElse("NOT_STARTED");
        boolean bookingsEnabled = hv.map(HostVerification::isBookingsEnabled).orElse(false);
        return AdminOrgResponse.from(org, ownerEmail, sub.orElse(null), adminVerifStatus, bookingsEnabled);
    }

    // ── Subscriptions ─────────────────────────────────────────────────────────

    public PageResponse<AdminSubscriptionResponse> listSubscriptions(String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Subscription> subs;
        if (status != null && !status.isBlank()) {
            SubscriptionStatus st = SubscriptionStatus.valueOf(status.toUpperCase());
            subs = subscriptionRepository.findByStatus(st, pageable);
        } else {
            subs = subscriptionRepository.findAll(pageable);
        }
        return PageResponse.from(subs.map(sub -> {
            Organization org = organizationRepository.findById(sub.getOrganizationId()).orElse(null);
            String orgName    = org != null ? org.getName() : "Unknown";
            String ownerEmail = org != null ? userRepository.findById(org.getOwnerId())
                    .map(User::getEmail).orElse(null) : null;
            return AdminSubscriptionResponse.from(sub, orgName, ownerEmail);
        }));
    }

    // ── Error Logs ────────────────────────────────────────────────────────────

    public PageResponse<AdminErrorLogResponse> listErrors(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return PageResponse.from(
                errorLogRepository.findAllByOrderByCreatedAtDesc(pageable)
                        .map(AdminErrorLogResponse::from)
        );
    }
}
