package com.smartlock.service;

import com.smartlock.domain.Subscription;
import com.smartlock.domain.SubscriptionPlan;
import com.smartlock.domain.enums.PropertyStatus;
import com.smartlock.domain.enums.SubscriptionStatus;
import com.smartlock.domain.enums.SubscriptionTier;
import com.smartlock.exception.AppException;
import com.smartlock.repository.LockRepository;
import com.smartlock.repository.PropertyRepository;
import com.smartlock.repository.SubscriptionPlanRepository;
import com.smartlock.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BillingService {

    /** Plans store -1 in max_properties to mean "no cap". */
    private static final int PLAN_UNLIMITED = -1;

    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final LockRepository lockRepository;
    private final PropertyRepository propertyRepository;
    private final OrganizationSecurityService orgSecurity;

    /**
     * Properties a trialing org may create. The trial has to fit the whole portfolio of a small
     * manager — they cannot evaluate the product on one property and will not pay before they have.
     */
    @Value("${app.billing.trial-property-quota:5}")
    private int trialPropertyQuota;

    /**
     * Floor for how many unpublished (draft/paused) properties an org may hold. Only ACTIVE
     * properties are billed, so unpublished ones must not consume quota — a host has to be able to
     * prepare a listing before paying for it. The real allowance is this or the property quota,
     * whichever is larger, so a manager can stage their whole portfolio before publishing any of
     * it. It exists only so an account cannot grow rows without limit.
     */
    @Value("${app.billing.draft-headroom:10}")
    private int draftHeadroom;

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
        return lockRepository.countConnectedByOrganizationId(orgId);
    }

    /** Billable properties. Billing counts ACTIVE only, so quota must count the same thing. */
    public long getActivePropertyCount(UUID orgId) {
        return propertyRepository.countByOrganizationIdAndStatus(orgId, PropertyStatus.ACTIVE);
    }

    /**
     * Properties this subscription may hold. Returns {@link Integer#MAX_VALUE} for uncapped plans.
     *
     * <p>Paid subscriptions bill per property (the Stripe/PayPal line-item quantity, stored on
     * {@code lockQuota}), so the purchased quantity is the real cap. The plan row is only a floor:
     * checkout never moves an org off the seeded FREE plan, so reading max_properties alone would
     * hold every paying customer at one property.
     */
    public int getPropertyQuota(Subscription sub) {
        if (isPaidActive(sub)) {
            int planMax = subscriptionPlanRepository.findById(sub.getPlanId())
                    .map(SubscriptionPlan::getMaxProperties)
                    .orElse(1);
            if (planMax == PLAN_UNLIMITED) return Integer.MAX_VALUE;
            int purchased = sub.getLockQuota() != null ? sub.getLockQuota() : 0;
            return Math.max(planMax, purchased);
        }
        if (isTrialActive(sub)) return Math.max(1, trialPropertyQuota);
        return 0;
    }

    private Subscription requireActiveSubscription(UUID orgId, String attemptedAction) {
        Subscription sub = getSubscription(orgId);
        if (!isAccessActive(sub)) {
            log.warn("requireActiveSubscription — blocked orgId={} status={} action={}",
                    orgId, sub.getStatus(), attemptedAction);
            throw new AppException(
                    "Your trial has expired or subscription is inactive. Please subscribe to "
                            + attemptedAction + ".",
                    HttpStatus.PAYMENT_REQUIRED, "SUBSCRIPTION_INACTIVE");
        }
        return sub;
    }

    private void enforceActivePropertyQuota(Subscription sub, UUID orgId) {
        int quota = getPropertyQuota(sub);
        long active = getActivePropertyCount(orgId);
        log.debug("enforceActivePropertyQuota — orgId={} active={} quota={}", orgId, active, quota);
        if (active >= quota) {
            log.warn("enforceActivePropertyQuota — quota exceeded orgId={} active={} quota={}", orgId, active, quota);
            String action = isTrialActive(sub)
                    ? "Subscribe to activate more properties."
                    : "Increase your subscription quantity to activate more properties.";
            throw new AppException(
                    "Active property limit reached (" + active + "/" + quota + "). " + action,
                    HttpStatus.PAYMENT_REQUIRED, "PROPERTY_LIMIT_REACHED");
        }
    }

    /**
     * Guards creating a property. An ACTIVE one is billed immediately so it consumes quota;
     * a draft does not, and is bounded by {@link #draftHeadroom} instead.
     */
    @Transactional(readOnly = true)
    public void enforceCanAddProperty(UUID orgId, boolean active) {
        Subscription sub = requireActiveSubscription(orgId, "add properties");
        if (active) {
            enforceActivePropertyQuota(sub, orgId);
            return;
        }
        long unpublished = propertyRepository.countByOrganizationIdAndStatusNot(orgId, PropertyStatus.ACTIVE);
        int allowed = Math.max(draftHeadroom, getPropertyQuota(sub));
        log.debug("enforceCanAddProperty — draft orgId={} unpublished={} allowed={}", orgId, unpublished, allowed);
        if (unpublished >= allowed) {
            log.warn("enforceCanAddProperty — draft headroom exhausted orgId={} unpublished={} allowed={}",
                    orgId, unpublished, allowed);
            throw new AppException(
                    "You have " + unpublished + " properties that are not active (limit " + allowed
                            + "). Activate or delete one before adding another.",
                    HttpStatus.PAYMENT_REQUIRED, "DRAFT_LIMIT_REACHED");
        }
    }

    /** Guards publishing a property, i.e. the moment it starts being billed. */
    @Transactional(readOnly = true)
    public void enforceCanActivateProperty(UUID orgId) {
        enforceActivePropertyQuota(requireActiveSubscription(orgId, "activate properties"), orgId);
    }

    @Transactional(readOnly = true)
    public void enforceCanAddLock(UUID orgId) {
        Subscription sub = requireActiveSubscription(orgId, "add locks");
        int quota = getLockQuota(sub);
        long used = getUsedLockCount(orgId);
        log.debug("enforceCanAddLock — orgId={} used={} quota={}", orgId, used, quota);
        if (used >= quota) {
            log.warn("enforceCanAddLock — quota exceeded orgId={} used={} quota={}", orgId, used, quota);
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
    public void applyPaypalSubscription(String paypalSubscriptionId, int quantity, UUID orgId,
                                        Instant periodStart, Instant periodEnd) {
        Subscription sub = getSubscription(orgId);
        sub.setStatus(SubscriptionStatus.ACTIVE);
        sub.setPaypalSubscriptionId(paypalSubscriptionId);
        sub.setLockQuota(quantity);
        sub.setPaymentProvider("PAYPAL");
        // Use real period from PayPal; fall back to 30-day default only when unavailable
        sub.setCurrentPeriodStart(periodStart != null ? periodStart : Instant.now());
        sub.setCurrentPeriodEnd(periodEnd != null ? periodEnd : Instant.now().plusSeconds(30L * 24 * 3600));
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

    /**
     * Checks a requested quantity change and returns the subscription it applies to. Deliberately
     * does not persist: the quantity is what the customer is billed, so it has to change at the
     * payment provider first — a local-only write hands out free capacity until the next sync
     * silently reverts it.
     */
    @Transactional(readOnly = true)
    public Subscription validateQuotaChange(UUID orgId, int newQuota) {
        Subscription sub = getSubscription(orgId);
        if (!isPaidActive(sub)) {
            throw new AppException("Active paid subscription required to change your quantity.",
                    HttpStatus.PAYMENT_REQUIRED, "SUBSCRIPTION_INACTIVE");
        }
        if (newQuota < 1) {
            throw new AppException("Quantity must be at least 1.", HttpStatus.BAD_REQUEST, "INVALID_QUOTA");
        }
        long usedLocks = getUsedLockCount(orgId);
        if (newQuota < usedLocks) {
            throw new AppException(
                    "Cannot reduce quantity below the locks you have connected (" + usedLocks + ").",
                    HttpStatus.BAD_REQUEST, "QUOTA_BELOW_USAGE");
        }
        long activeProperties = getActivePropertyCount(orgId);
        if (newQuota < activeProperties) {
            throw new AppException(
                    "Cannot reduce quantity below your " + activeProperties
                            + " active properties. Pause or delete one first.",
                    HttpStatus.BAD_REQUEST, "QUOTA_BELOW_USAGE");
        }
        return sub;
    }
}
