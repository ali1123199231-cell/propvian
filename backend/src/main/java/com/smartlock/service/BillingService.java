package com.smartlock.service;

import com.smartlock.domain.Subscription;
import com.smartlock.domain.SubscriptionPlan;
import com.smartlock.domain.enums.SubscriptionStatus;
import com.smartlock.domain.enums.SubscriptionTier;
import com.smartlock.exception.AppException;
import com.smartlock.repository.LockRepository;
import com.smartlock.repository.SubscriptionPlanRepository;
import com.smartlock.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BillingService {

    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final LockRepository lockRepository;

    @Transactional
    public Subscription getSubscription(UUID orgId) {
        return subscriptionRepository.findByOrganizationId(orgId)
                .orElseGet(() -> createDefaultTrialSubscription(orgId));
    }

    private Subscription createDefaultTrialSubscription(UUID orgId) {
        SubscriptionPlan freePlan = subscriptionPlanRepository.findByTier(SubscriptionTier.FREE)
                .orElseThrow(() -> new AppException("No FREE plan found", HttpStatus.INTERNAL_SERVER_ERROR, "PLAN_NOT_FOUND"));
        Instant now = Instant.now();
        Subscription sub = Subscription.builder()
                .organizationId(orgId)
                .planId(freePlan.getId())
                .status(SubscriptionStatus.TRIALING)
                .currentPeriodStart(now)
                .currentPeriodEnd(now.plus(30, java.time.temporal.ChronoUnit.DAYS))
                .trialEnd(now.plus(30, java.time.temporal.ChronoUnit.DAYS))
                .lockQuota(1)
                .cancelAtPeriodEnd(false)
                .build();
        log.info("Auto-creating trial subscription for org {}", orgId);
        return subscriptionRepository.save(sub);
    }

    public boolean isTrialActive(Subscription sub) {
        return sub.getStatus() == SubscriptionStatus.TRIALING
                && sub.getTrialEnd() != null
                && Instant.now().isBefore(sub.getTrialEnd());
    }

    public boolean isPaidActive(Subscription sub) {
        return sub.getStatus() == SubscriptionStatus.ACTIVE
                && (sub.getCurrentPeriodEnd() == null || Instant.now().isBefore(sub.getCurrentPeriodEnd()));
    }

    public boolean isAccessActive(Subscription sub) {
        return isTrialActive(sub) || isPaidActive(sub);
    }

    public boolean isAccessActive(UUID orgId) {
        try {
            return isAccessActive(getSubscription(orgId));
        } catch (Exception e) {
            return false;
        }
    }

    public int getLockQuota(Subscription sub) {
        if (isTrialActive(sub)) return 1;
        if (isPaidActive(sub) && sub.getLockQuota() != null) return sub.getLockQuota();
        return 0;
    }

    public long getUsedLockCount(UUID orgId) {
        return lockRepository.findByOrganizationId(orgId).size();
    }

    @Transactional(readOnly = true)
    public void enforceCanAddLock(UUID orgId) {
        Subscription sub = getSubscription(orgId);
        if (!isAccessActive(sub)) {
            throw new AppException(
                    "Your trial has expired or subscription is inactive. Please subscribe to add locks.",
                    HttpStatus.PAYMENT_REQUIRED, "SUBSCRIPTION_INACTIVE");
        }
        int quota = getLockQuota(sub);
        long used = getUsedLockCount(orgId);
        if (used >= quota) {
            throw new AppException(
                    "Lock quota reached (" + used + "/" + quota + "). Upgrade your plan to add more locks.",
                    HttpStatus.PAYMENT_REQUIRED, "LOCK_QUOTA_EXCEEDED");
        }
    }

    @Transactional
    public void applyStripeSubscription(String stripeSubscriptionId, String stripeCustomerId,
                                        String stripePriceId, int quantity, UUID orgId,
                                        Instant periodStart, Instant periodEnd) {
        Subscription sub = getSubscription(orgId);
        sub.setStatus(SubscriptionStatus.ACTIVE);
        sub.setStripeSubscriptionId(stripeSubscriptionId);
        sub.setStripeCustomerId(stripeCustomerId);
        sub.setStripePriceId(stripePriceId);
        sub.setLockQuota(quantity);
        sub.setPaymentProvider("STRIPE");
        sub.setCurrentPeriodStart(periodStart);
        sub.setCurrentPeriodEnd(periodEnd);
        sub.setFailedPaymentAt(null);
        subscriptionRepository.save(sub);
        log.info("Stripe subscription applied: org={} quantity={}", orgId, quantity);
    }

    @Transactional
    public void applyPaypalSubscription(String paypalSubscriptionId, int quantity, UUID orgId) {
        Subscription sub = getSubscription(orgId);
        sub.setStatus(SubscriptionStatus.ACTIVE);
        sub.setPaypalSubscriptionId(paypalSubscriptionId);
        sub.setLockQuota(quantity);
        sub.setPaymentProvider("PAYPAL");
        sub.setCurrentPeriodStart(Instant.now());
        sub.setCurrentPeriodEnd(Instant.now().plusSeconds(30L * 24 * 3600));
        sub.setFailedPaymentAt(null);
        subscriptionRepository.save(sub);
        log.info("PayPal subscription applied: org={} quantity={}", orgId, quantity);
    }

    @Transactional
    public void cancelSubscription(UUID orgId, boolean atPeriodEnd) {
        Subscription sub = getSubscription(orgId);
        if (atPeriodEnd) {
            sub.setCancelAtPeriodEnd(true);
        } else {
            sub.setStatus(SubscriptionStatus.CANCELLED);
            sub.setCancelledAt(Instant.now());
        }
        subscriptionRepository.save(sub);
    }

    @Transactional
    public void markPaymentFailed(UUID orgId) {
        subscriptionRepository.findByOrganizationId(orgId).ifPresent(sub -> {
            sub.setStatus(SubscriptionStatus.PAST_DUE);
            sub.setFailedPaymentAt(Instant.now());
            subscriptionRepository.save(sub);
        });
    }

    @Transactional
    public void markPaymentFailed(String stripeSubscriptionId) {
        subscriptionRepository.findByStripeSubscriptionId(stripeSubscriptionId).ifPresent(sub -> {
            sub.setStatus(SubscriptionStatus.PAST_DUE);
            sub.setFailedPaymentAt(Instant.now());
            subscriptionRepository.save(sub);
        });
    }

    @Transactional
    public void cancelPaypalSubscription(String paypalSubscriptionId) {
        subscriptionRepository.findByPaypalSubscriptionId(paypalSubscriptionId).ifPresent(sub -> {
            sub.setStatus(SubscriptionStatus.CANCELLED);
            sub.setCancelledAt(Instant.now());
            subscriptionRepository.save(sub);
            log.info("PayPal subscription cancelled: org={}", sub.getOrganizationId());
        });
    }

    @Transactional
    public void suspendPaypalSubscription(String paypalSubscriptionId) {
        subscriptionRepository.findByPaypalSubscriptionId(paypalSubscriptionId).ifPresent(sub -> {
            sub.setStatus(SubscriptionStatus.PAST_DUE);
            subscriptionRepository.save(sub);
        });
    }

    @Transactional
    public void markPaypalPaymentFailed(String paypalSubscriptionId) {
        subscriptionRepository.findByPaypalSubscriptionId(paypalSubscriptionId).ifPresent(sub -> {
            sub.setStatus(SubscriptionStatus.PAST_DUE);
            sub.setFailedPaymentAt(Instant.now());
            subscriptionRepository.save(sub);
        });
    }

    @Transactional
    public void updateLockQuota(UUID orgId, int newQuota) {
        Subscription sub = getSubscription(orgId);
        if (!isPaidActive(sub)) {
            throw new AppException("Active paid subscription required to update lock quota.",
                    HttpStatus.PAYMENT_REQUIRED, "SUBSCRIPTION_INACTIVE");
        }
        if (newQuota < 1) {
            throw new AppException("Lock quota must be at least 1.", HttpStatus.BAD_REQUEST, "INVALID_QUOTA");
        }
        long used = getUsedLockCount(orgId);
        if (newQuota < used) {
            throw new AppException(
                    "Cannot reduce quota below current lock count (" + used + " locks connected).",
                    HttpStatus.BAD_REQUEST, "QUOTA_BELOW_USAGE");
        }
        sub.setLockQuota(newQuota);
        subscriptionRepository.save(sub);
    }
}
