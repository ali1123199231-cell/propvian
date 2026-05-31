package com.smartlock.service;

import com.smartlock.domain.HostVerification;
import com.smartlock.domain.enums.VerificationStatus;
import com.smartlock.dto.request.verification.*;
import com.smartlock.dto.response.verification.VerificationStatusResponse;
import com.smartlock.exception.AppException;
import com.smartlock.integration.ical.ICalFetcher;
import com.smartlock.repository.HostVerificationRepository;
import com.smartlock.repository.OrganizationRepository;
import com.smartlock.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.InetAddress;
import java.time.Instant;
import java.util.*;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Slf4j
public class VerificationService {

    private final HostVerificationRepository verificationRepository;
    private final SystemConfigService        systemConfigService;
    private final OtaVerificationService     otaVerificationService;
    private final ICalFetcher                icalFetcher;
    private final EmailService               emailService;
    private final OrganizationRepository     organizationRepository;
    private final UserRepository             userRepository;

    private static final String CNAME_TARGET = "booking.propvian.com";

    // ── Read ──────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public VerificationStatusResponse getStatus(UUID orgId) {
        return toResponse(getOrCreate(orgId));
    }

    @Transactional
    public HostVerification getOrCreate(UUID orgId) {
        return verificationRepository.findByOrganizationId(orgId)
                .orElseGet(() -> {
                    int total = systemConfigService.countEnabledVerificationSteps();
                    HostVerification v = HostVerification.builder()
                            .organizationId(orgId)
                            .totalRequiredSteps(total)
                            .build();
                    return verificationRepository.save(v);
                });
    }

    // ── Step submissions ──────────────────────────────────────────────────────

    @Transactional
    public VerificationStatusResponse submitIdentity(UUID orgId, SubmitIdentityRequest req) {
        assertStepEnabled("identity_check");
        HostVerification v = getOrCreate(orgId);
        v.setIdentityDocumentUrl(req.getIdentityDocumentUrl());
        v.setSelfieUrl(req.getSelfieUrl());
        v.setIdentityStatus(VerificationStatus.PENDING);
        v.setIdentitySubmittedAt(Instant.now());
        recalculate(v);
        VerificationStatusResponse res = toResponse(verificationRepository.save(v));
        notifyAdminPropertySubmitted(orgId, "identity documents");
        return res;
    }

    @Transactional
    public VerificationStatusResponse submitPropertyVerification(UUID orgId, SubmitPropertyVerificationRequest req) {
        assertStepEnabled("property_check");
        HostVerification v = getOrCreate(orgId);
        v.setPropertyAddressLine(req.getPropertyAddressLine());
        v.setOwnershipProofUrl(req.getOwnershipProofUrl());
        v.setManagementAuthUrl(req.getManagementAuthUrl());
        if (req.getUtilityBillUrl() != null) v.setUtilityBillUrl(req.getUtilityBillUrl());
        v.setPropertyStatus(VerificationStatus.PENDING);
        v.setPropertySubmittedAt(Instant.now());
        recalculate(v);
        VerificationStatusResponse res = toResponse(verificationRepository.save(v));
        notifyAdminPropertySubmitted(orgId, "property documents");
        return res;
    }

    @Transactional
    public VerificationStatusResponse submitOta(UUID orgId, SubmitOtaRequest req) {
        assertStepEnabled("ota_check");
        HostVerification v = getOrCreate(orgId);

        // Store URLs
        v.setAirbnbListingUrl(req.getAirbnbListingUrl());
        v.setBookingListingUrl(req.getBookingListingUrl());
        v.setOtaSubmittedAt(Instant.now());

        // Auto-verify: try each provided URL
        String primaryUrl = Stream.of(req.getAirbnbListingUrl(), req.getBookingListingUrl(),
                        req.getVrboListingUrl())
                .filter(url -> url != null && !url.isBlank())
                .findFirst().orElse(null);

        if (primaryUrl != null) {
            OtaVerificationService.OtaVerificationResult result = otaVerificationService.verify(primaryUrl);
            v.setOtaAutoVerified(result.autoApproved());
            v.setOtaReviewCount(result.reviewCount());
            v.setOtaVerificationNote(result.note());

            if (result.autoApproved()) {
                v.setOtaStatus(VerificationStatus.APPROVED);
                v.setOtaReviewedAt(Instant.now());
                log.info("OTA auto-approved for org={} reviewCount={}", orgId, result.reviewCount());
            } else if (!result.urlValid()) {
                throw new AppException(result.note(), HttpStatus.BAD_REQUEST);
            } else {
                // URL valid but not enough reviews — put PENDING for manual review
                v.setOtaStatus(VerificationStatus.PENDING);
            }
        } else {
            v.setOtaStatus(VerificationStatus.PENDING);
        }

        recalculate(v);
        VerificationStatusResponse res = toResponse(verificationRepository.save(v));

        if (v.getOtaStatus() == VerificationStatus.APPROVED) {
            notifyHostOtaApproved(orgId);
        } else {
            notifyAdminPropertySubmitted(orgId, "OTA listings");
        }
        return res;
    }

    @Transactional
    public VerificationStatusResponse connectCalendar(UUID orgId, ConnectCalendarRequest req) {
        assertStepEnabled("calendar_sync");
        HostVerification v = getOrCreate(orgId);
        v.setAirbnbIcalUrl(req.getAirbnbIcalUrl());
        v.setBookingIcalUrl(req.getBookingIcalUrl());
        if (req.getOtherIcalUrls() != null && !req.getOtherIcalUrls().isEmpty()) {
            v.setOtherIcalUrls(req.getOtherIcalUrls().toString());
        }
        v.setCalendarStatus(VerificationStatus.APPROVED);
        v.setCalendarConnectedAt(Instant.now());
        recalculate(v);
        return toResponse(verificationRepository.save(v));
    }

    @Transactional
    public VerificationStatusResponse connectPayment(UUID orgId, ConnectPaymentRequest req) {
        assertStepEnabled("payment_setup");
        HostVerification v = getOrCreate(orgId);
        if (req.getStripeAccountId() != null && !req.getStripeAccountId().isBlank()) {
            v.setStripeAccountId(req.getStripeAccountId());
            v.setStripeConnectedAt(Instant.now());
            // chargesEnabled/payoutsEnabled set by Stripe webhook or supplied in request
            if (Boolean.TRUE.equals(req.getChargesEnabled())) v.setStripeChargesEnabled(true);
            if (Boolean.TRUE.equals(req.getPayoutsEnabled())) v.setStripePayoutsEnabled(true);
        }
        if (req.getPaypalAccountId() != null && !req.getPaypalAccountId().isBlank()) {
            v.setPaypalAccountId(req.getPaypalAccountId());
            v.setPaypalConnectedAt(Instant.now());
        }
        boolean hasPayment = v.getStripeAccountId() != null || v.getPaypalAccountId() != null;
        if (hasPayment) {
            // Auto-approve if Stripe fully enabled OR PayPal provided
            boolean stripeReady = v.getStripeAccountId() != null && v.isStripeChargesEnabled() && v.isStripePayoutsEnabled();
            boolean paypalReady = v.getPaypalAccountId() != null;
            v.setPaymentStatus(stripeReady || paypalReady ? VerificationStatus.APPROVED : VerificationStatus.PENDING);
        } else {
            v.setPaymentStatus(VerificationStatus.NOT_STARTED);
        }
        recalculate(v);
        VerificationStatusResponse res = toResponse(verificationRepository.save(v));
        if (v.getPaymentStatus() == VerificationStatus.APPROVED) {
            notifyHostPaymentConnected(orgId);
        }
        return res;
    }

    @Transactional
    public VerificationStatusResponse connectDomain(UUID orgId, ConnectDomainRequest req) {
        assertStepEnabled("domain_setup");
        HostVerification v = getOrCreate(orgId);
        v.setCustomDomain(req.getDomain());
        v.setDomainCnameTarget(CNAME_TARGET);
        String token = UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        v.setDomainVerificationToken(token);

        // Check if it's a Propvian subdomain (instant approval)
        if (req.getDomain().endsWith(".propvian.com")) {
            v.setDomainStatus(VerificationStatus.APPROVED);
            v.setDomainVerifiedAt(Instant.now());
        } else {
            v.setDomainStatus(VerificationStatus.PENDING);
            // Try DNS check now (best effort)
            checkDnsAsync(orgId, req.getDomain());
        }
        recalculate(v);
        return toResponse(verificationRepository.save(v));
    }

    public record ICalTestResult(boolean success, String message) {}

    public ICalTestResult testIcalUrl(String url) {
        if (url == null || url.isBlank()) return new ICalTestResult(false, "URL is required");
        if (!url.toLowerCase().contains("ical") && !url.toLowerCase().endsWith(".ics") &&
            !url.toLowerCase().contains("calendar")) {
            log.warn("iCal URL looks suspicious: {}", url);
        }
        ICalFetcher.FetchResult result = icalFetcher.fetch(url, null);
        if (!result.success()) return new ICalTestResult(false, "Could not connect: " + result.error());
        String content = result.content();
        if (content == null || !content.trim().startsWith("BEGIN:VCALENDAR")) {
            return new ICalTestResult(false, "URL does not return a valid iCalendar feed");
        }
        return new ICalTestResult(true, "Connection successful");
    }

    public Map<String, Object> checkDomainDns(UUID orgId) {
        HostVerification v = getOrCreate(orgId);
        if (v.getCustomDomain() == null) {
            return Map.of("verified", false, "message", "No domain configured");
        }
        boolean resolved = resolveCname(v.getCustomDomain());
        if (resolved) {
            v.setDomainStatus(VerificationStatus.APPROVED);
            v.setDomainVerifiedAt(Instant.now());
            recalculate(v);
            verificationRepository.save(v);
            notifyHostDomainVerified(orgId);
        }
        return Map.of(
                "verified", resolved,
                "domain",   v.getCustomDomain(),
                "cnameTarget", CNAME_TARGET,
                "message",  resolved ? "DNS verified successfully" : "CNAME not yet pointing to " + CNAME_TARGET
        );
    }

    private boolean resolveCname(String domain) {
        try {
            InetAddress[] addresses = InetAddress.getAllByName(domain);
            // Check if any resolved address matches booking.propvian.com
            InetAddress[] target = InetAddress.getAllByName(CNAME_TARGET);
            Set<String> targetIps = new HashSet<>();
            for (InetAddress a : target) targetIps.add(a.getHostAddress());
            for (InetAddress a : addresses) {
                if (targetIps.contains(a.getHostAddress())) return true;
            }
        } catch (Exception e) {
            log.debug("DNS lookup failed for {}: {}", domain, e.getMessage());
        }
        return false;
    }

    private void checkDnsAsync(UUID orgId, String domain) {
        // Non-blocking check — result will be visible on next poll
        try {
            boolean resolved = resolveCname(domain);
            if (resolved) {
                HostVerification v = verificationRepository.findByOrganizationId(orgId).orElse(null);
                if (v != null) {
                    v.setDomainStatus(VerificationStatus.APPROVED);
                    v.setDomainVerifiedAt(Instant.now());
                    recalculate(v);
                    verificationRepository.save(v);
                }
            }
        } catch (Exception e) {
            log.debug("Async DNS check failed: {}", e.getMessage());
        }
    }

    // ── Admin actions ─────────────────────────────────────────────────────────

    @Transactional
    public VerificationStatusResponse adminApprove(UUID orgId, UUID adminUserId, AdminApprovalRequest req) {
        assertStepEnabled("admin_approval");
        HostVerification v = getOrCreate(orgId);
        v.setAdminReviewedBy(adminUserId);
        v.setAdminReviewedAt(Instant.now());
        v.setAdminNotes(req.getNotes());

        if (Boolean.TRUE.equals(req.getApproved())) {
            v.setAdminStatus(VerificationStatus.APPROVED);
        } else {
            v.setAdminStatus(VerificationStatus.REJECTED);
            v.setAdminRejectionReason(req.getRejectionReason());
        }
        recalculate(v);
        VerificationStatusResponse res = toResponse(verificationRepository.save(v));
        if (Boolean.TRUE.equals(req.getApproved())) {
            notifyHostApproved(orgId);
        } else {
            notifyHostRejected(orgId, req.getRejectionReason());
        }
        return res;
    }

    @Transactional
    public VerificationStatusResponse adminApproveStep(UUID orgId, UUID adminUserId, String step, boolean approved, String reason) {
        HostVerification v = getOrCreate(orgId);
        Instant now = Instant.now();
        VerificationStatus status = approved ? VerificationStatus.APPROVED : VerificationStatus.REJECTED;

        switch (step) {
            case "identity" -> {
                v.setIdentityStatus(status);
                v.setIdentityReviewedAt(now);
                if (!approved) v.setIdentityRejectionReason(reason);
            }
            case "property" -> {
                v.setPropertyStatus(status);
                v.setPropertyReviewedAt(now);
                if (!approved) v.setPropertyRejectionReason(reason);
                if (approved) notifyHostPropertyApproved(orgId);
                else          notifyHostPropertyRejected(orgId, reason);
            }
            case "ota" -> {
                v.setOtaStatus(status);
                v.setOtaReviewedAt(now);
                if (!approved) v.setOtaRejectionReason(reason);
                if (approved) notifyHostOtaApproved(orgId);
            }
            default -> throw new AppException("Unknown step: " + step, HttpStatus.BAD_REQUEST);
        }
        recalculate(v);
        return toResponse(verificationRepository.save(v));
    }

    // ── Booking gate ──────────────────────────────────────────────────────────

    public boolean isBookingEnabled(UUID orgId) {
        return verificationRepository.findByOrganizationId(orgId)
                .map(HostVerification::isBookingsEnabled)
                .orElse(false);
    }

    // ── Admin list ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<VerificationStatusResponse> listPending(Pageable pageable) {
        return verificationRepository.findByAdminStatus(VerificationStatus.PENDING, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<VerificationStatusResponse> listAll(Pageable pageable) {
        return verificationRepository.findAll(pageable).map(this::toResponse);
    }

    // ── Email notifications ───────────────────────────────────────────────────

    private void notifyAdminPropertySubmitted(UUID orgId, String docType) {
        try {
            String subject = "New verification submission — " + docType;
            emailService.sendEmail("admin@propvian.com", subject, "email/admin-review-needed",
                    Map.of("orgId", orgId.toString(), "docType", docType));
        } catch (Exception e) {
            log.warn("Failed to notify admin of submission: {}", e.getMessage());
        }
    }

    private void notifyHostPropertyApproved(UUID orgId) {
        getHostEmail(orgId).ifPresent(email ->
            emailService.sendEmail(email, "Property verification approved", "email/verification-step-approved",
                    Map.of("step", "Property Verification", "message", "Your property documents have been approved.")));
    }

    private void notifyHostPropertyRejected(UUID orgId, String reason) {
        getHostEmail(orgId).ifPresent(email ->
            emailService.sendEmail(email, "Property verification needs attention", "email/verification-step-rejected",
                    Map.of("step", "Property Verification", "reason", reason != null ? reason : "Please re-upload your documents.")));
    }

    private void notifyHostOtaApproved(UUID orgId) {
        getHostEmail(orgId).ifPresent(email ->
            emailService.sendEmail(email, "OTA listing verified!", "email/verification-step-approved",
                    Map.of("step", "OTA Listings", "message", "Your OTA listing has been verified successfully.")));
    }

    private void notifyHostPaymentConnected(UUID orgId) {
        getHostEmail(orgId).ifPresent(email ->
            emailService.sendEmail(email, "Payment account connected", "email/verification-step-approved",
                    Map.of("step", "Payment Setup", "message", "Your payment account is connected and ready to receive payouts.")));
    }

    private void notifyHostDomainVerified(UUID orgId) {
        getHostEmail(orgId).ifPresent(email ->
            emailService.sendEmail(email, "Domain verified!", "email/verification-step-approved",
                    Map.of("step", "Domain Connection", "message", "Your custom domain is verified and SSL is being provisioned.")));
    }

    private void notifyHostApproved(UUID orgId) {
        getHostEmail(orgId).ifPresent(email ->
            emailService.sendEmail(email, "🎉 Your Propvian account is approved!", "email/verification-approved",
                    Map.of("message", "Your bookings are now live. Guests can book your property directly.")));
    }

    private void notifyHostRejected(UUID orgId, String reason) {
        getHostEmail(orgId).ifPresent(email ->
            emailService.sendEmail(email, "Verification update required", "email/verification-step-rejected",
                    Map.of("step", "Final Review", "reason", reason != null ? reason : "Please contact support.")));
    }

    private Optional<String> getHostEmail(UUID orgId) {
        try {
            return organizationRepository.findById(orgId)
                    .flatMap(org -> userRepository.findById(org.getOwnerId()))
                    .map(user -> user.getEmail());
        } catch (Exception e) {
            log.warn("Could not get host email for org {}: {}", orgId, e.getMessage());
            return Optional.empty();
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private void assertStepEnabled(String stepKey) {
        if (!systemConfigService.isVerificationStepEnabled(stepKey)) {
            throw new AppException("Verification step '" + stepKey + "' is currently disabled", HttpStatus.FORBIDDEN);
        }
    }

    private void recalculate(HostVerification v) {
        List<VerificationStatus> steps = getEnabledStepStatuses(v);
        long approved = steps.stream().filter(s -> s == VerificationStatus.APPROVED).count();
        v.setCompletedSteps((int) approved);
        v.setTotalRequiredSteps(steps.size());
        boolean allApproved = !steps.isEmpty() && steps.stream().allMatch(s -> s == VerificationStatus.APPROVED);
        v.setBookingsEnabled(allApproved);
    }

    private List<VerificationStatus> getEnabledStepStatuses(HostVerification v) {
        List<VerificationStatus> statuses = new ArrayList<>();
        if (systemConfigService.isVerificationStepEnabled("identity_check"))
            statuses.add(v.getIdentityStatus());
        if (systemConfigService.isVerificationStepEnabled("property_check"))
            statuses.add(v.getPropertyStatus());
        if (systemConfigService.isVerificationStepEnabled("ota_check"))
            statuses.add(v.getOtaStatus());
        if (systemConfigService.isVerificationStepEnabled("calendar_sync"))
            statuses.add(v.getCalendarStatus());
        if (systemConfigService.isVerificationStepEnabled("payment_setup"))
            statuses.add(v.getPaymentStatus());
        if (systemConfigService.isVerificationStepEnabled("domain_setup"))
            statuses.add(v.getDomainStatus());
        if (systemConfigService.isVerificationStepEnabled("admin_approval"))
            statuses.add(v.getAdminStatus());
        return statuses;
    }

    private VerificationStatusResponse toResponse(HostVerification v) {
        boolean iEnabled  = systemConfigService.isVerificationStepEnabled("identity_check");
        boolean prEnabled = systemConfigService.isVerificationStepEnabled("property_check");
        boolean oEnabled  = systemConfigService.isVerificationStepEnabled("ota_check");
        boolean cEnabled  = systemConfigService.isVerificationStepEnabled("calendar_sync");
        boolean pyEnabled = systemConfigService.isVerificationStepEnabled("payment_setup");
        boolean dEnabled  = systemConfigService.isVerificationStepEnabled("domain_setup");
        boolean aEnabled  = systemConfigService.isVerificationStepEnabled("admin_approval");

        int total = v.getTotalRequiredSteps() > 0 ? v.getTotalRequiredSteps() : 1;
        int percent = (int) Math.round((double) v.getCompletedSteps() / total * 100);
        String blockingReason = computeBlockingReason(v, iEnabled, prEnabled, oEnabled, cEnabled, pyEnabled, dEnabled, aEnabled);

        return VerificationStatusResponse.builder()
                .organizationId(v.getOrganizationId().toString())
                .bookingsEnabled(v.isBookingsEnabled())
                .completedSteps(v.getCompletedSteps())
                .totalRequiredSteps(v.getTotalRequiredSteps())
                .progressPercent(percent)
                .identityStepEnabled(iEnabled)
                .propertyStepEnabled(prEnabled)
                .otaStepEnabled(oEnabled)
                .calendarStepEnabled(cEnabled)
                .paymentStepEnabled(pyEnabled)
                .domainStepEnabled(dEnabled)
                .adminStepEnabled(aEnabled)
                .identityStep(buildStep("identity_check", "Identity Verification", v.getIdentityStatus(),
                        iEnabled, v.getIdentitySubmittedAt(), v.getIdentityReviewedAt(), v.getIdentityRejectionReason(), null))
                .propertyStep(buildStep("property_check", "Property Verification", v.getPropertyStatus(),
                        prEnabled, v.getPropertySubmittedAt(), v.getPropertyReviewedAt(), v.getPropertyRejectionReason(),
                        List.of(safe(v.getOwnershipProofUrl()), safe(v.getManagementAuthUrl()), safe(v.getUtilityBillUrl()))))
                .otaStep(buildStep("ota_check", "OTA Verification", v.getOtaStatus(),
                        oEnabled, v.getOtaSubmittedAt(), v.getOtaReviewedAt(), v.getOtaRejectionReason(),
                        List.of(safe(v.getAirbnbListingUrl()), safe(v.getBookingListingUrl()),
                                v.getOtaVerificationNote() != null ? v.getOtaVerificationNote() : "",
                                v.getOtaReviewCount() != null ? String.valueOf(v.getOtaReviewCount()) : "")))
                .calendarStep(buildStep("calendar_sync", "Calendar Sync", v.getCalendarStatus(),
                        cEnabled, v.getCalendarConnectedAt(), null, null,
                        List.of(safe(v.getAirbnbIcalUrl()), safe(v.getBookingIcalUrl()))))
                .paymentStep(buildStep("payment_setup", "Stripe Account & Payments", v.getPaymentStatus(),
                        pyEnabled,
                        v.getStripeConnectedAt() != null ? v.getStripeConnectedAt() : v.getPaypalConnectedAt(),
                        null, null,
                        List.of(safe(v.getStripeAccountId()), String.valueOf(v.isStripeChargesEnabled()),
                                String.valueOf(v.isStripePayoutsEnabled()), safe(v.getPaypalAccountId()))))
                .domainStep(buildStep("domain_setup", "Domain Connection", v.getDomainStatus(),
                        dEnabled, v.getDomainVerifiedAt(), null, null,
                        List.of(safe(v.getCustomDomain()), safe(v.getDomainCnameTarget()), safe(v.getDomainVerificationToken()))))
                .adminStep(buildStep("admin_approval", "Admin Approval", v.getAdminStatus(),
                        aEnabled, null, v.getAdminReviewedAt(), v.getAdminRejectionReason(),
                        v.getAdminNotes() != null ? List.of(v.getAdminNotes()) : null))
                .blockingReason(blockingReason)
                .build();
    }

    private String safe(String s) { return s != null ? s : ""; }

    private VerificationStatusResponse.StepStatus buildStep(String key, String label,
            VerificationStatus status, boolean enabled,
            Instant submittedAt, Instant reviewedAt, String rejectionReason, List<String> data) {
        return VerificationStatusResponse.StepStatus.builder()
                .key(key)
                .label(label)
                .status(enabled ? status : VerificationStatus.APPROVED)
                .enabled(enabled)
                .submittedAt(submittedAt)
                .reviewedAt(reviewedAt)
                .rejectionReason(rejectionReason)
                .data(data)
                .build();
    }

    private String computeBlockingReason(HostVerification v,
            boolean iE, boolean prE, boolean oE, boolean cE, boolean pyE, boolean dE, boolean aE) {
        if (iE && v.getIdentityStatus() != VerificationStatus.APPROVED)
            return "Identity verification required";
        if (prE && v.getPropertyStatus() != VerificationStatus.APPROVED)
            return "Property verification required";
        if (oE && v.getOtaStatus() != VerificationStatus.APPROVED)
            return "OTA listing verification required";
        if (cE && v.getCalendarStatus() != VerificationStatus.APPROVED)
            return "Calendar synchronization required";
        if (pyE && v.getPaymentStatus() != VerificationStatus.APPROVED)
            return "Payment account setup required";
        if (dE && v.getDomainStatus() != VerificationStatus.APPROVED)
            return "Domain connection required";
        if (aE && v.getAdminStatus() != VerificationStatus.APPROVED)
            return "Awaiting admin approval";
        return null;
    }
}
