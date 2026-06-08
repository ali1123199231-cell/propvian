package com.smartlock.service;

import com.smartlock.domain.SystemConfig;
import com.smartlock.domain.enums.BusinessModel;
import com.smartlock.repository.SystemConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.stream.StreamSupport;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SystemConfigService {

    private final SystemConfigRepository repository;

    public String get(String key, String defaultValue) {
        return repository.findById(key)
                .map(SystemConfig::getValue)
                .orElseGet(() -> {
                    log.debug("SystemConfig key '{}' not found, using default '{}'", key, defaultValue);
                    return defaultValue;
                });
    }

    public BusinessModel getBusinessModel() {
        String val = get("platform.business_model", "ttlock").toUpperCase();
        try {
            return BusinessModel.valueOf(val);
        } catch (IllegalArgumentException e) {
            return BusinessModel.TTLOCK;
        }
    }

    public boolean isDirectBookingMode() {
        return getBusinessModel() == BusinessModel.DIRECT_BOOKING;
    }

    public boolean isVerificationStepEnabled(String stepKey) {
        return Boolean.parseBoolean(get("verification." + stepKey + ".enabled", "true"));
    }

    public int countEnabledVerificationSteps() {
        String[] steps = {"identity_check", "property_check", "ota_check",
                          "calendar_sync", "payment_setup", "domain_setup", "admin_approval"};
        int count = 0;
        for (String step : steps) {
            if (isVerificationStepEnabled(step)) count++;
        }
        return count;
    }

    private static final Set<String> SECRET_KEYS = Set.of(
            "stripe.secret_key", "stripe.webhook_secret",
            "stripe.connect_webhook_secret",
            "stripe.sandbox.secret_key", "stripe.sandbox.webhook_secret",
            "stripe.sandbox.connect_webhook_secret",
            "paypal.client_secret", "paypal.sandbox.client_secret", "ttlock.client_secret"
    );

    @Transactional(readOnly = true)
    public Map<String, String> getAllConfig() {
        return StreamSupport.stream(repository.findAll().spliterator(), false)
                .collect(Collectors.toMap(SystemConfig::getKey, SystemConfig::getValue));
    }

    /** Returns only non-sensitive keys safe to expose publicly. */
    @Transactional(readOnly = true)
    public Map<String, String> getPublicConfig() {
        return StreamSupport.stream(repository.findAll().spliterator(), false)
                .filter(c -> !SECRET_KEYS.contains(c.getKey()))
                .collect(Collectors.toMap(SystemConfig::getKey, SystemConfig::getValue));
    }

    @Transactional
    public void setMultiple(Map<String, String> updates) {
        updates.forEach((key, value) -> {
            SystemConfig cfg = repository.findById(key).orElse(new SystemConfig());
            cfg.setKey(key);
            cfg.setValue(value);
            cfg.setUpdatedAt(Instant.now());
            repository.save(cfg);
        });
    }

    /** Returns "oauth" or "password" */
    public String getTtlockAuthMethod() {
        return get("ttlock.auth_method", "oauth");
    }

    public String getTtlockRedirectUri() {
        return get("ttlock.redirect_uri", "https://propvian.com/api/v1/ttlock/oauth/callback");
    }

    // ── Payment provider config ───────────────────────────────────────────────

    public String getStripeConnectClientId() {
        return get("stripe.connect_client_id", "");
    }

    public String getStripeSecretKey() {
        return get("stripe.secret_key", "");
    }

    public String getStripePublishableKey() {
        return get("stripe.publishable_key", "");
    }

    public String getStripeWebhookSecret() {
        return get("stripe.webhook_secret", "");
    }

    public String getStripePriceId() {
        return get("stripe.price_id", "");
    }

    public boolean isStripeSandbox() {
        return Boolean.parseBoolean(get("stripe.sandbox", "false"));
    }

    // ── Stripe sandbox-aware active getters ──────────────────────────────────

    public String getActiveStripeSecretKey() {
        if (isStripeSandbox()) return get("stripe.sandbox.secret_key", "");
        return get("stripe.secret_key", "");
    }

    public String getActiveStripePublishableKey() {
        if (isStripeSandbox()) return get("stripe.sandbox.publishable_key", "");
        return get("stripe.publishable_key", "");
    }

    public String getActiveStripeWebhookSecret() {
        if (isStripeSandbox()) return get("stripe.sandbox.webhook_secret", "");
        return get("stripe.webhook_secret", "");
    }

    public String getActiveStripePriceId() {
        if (isStripeSandbox()) return get("stripe.sandbox.price_id", "");
        return get("stripe.price_id", "");
    }

    public String getActiveStripeConnectClientId() {
        if (isStripeSandbox()) return get("stripe.sandbox.connect_client_id", "");
        return get("stripe.connect_client_id", "");
    }

    public String getActiveStripeConnectWebhookSecret() {
        if (isStripeSandbox()) return get("stripe.sandbox.connect_webhook_secret", "");
        return get("stripe.connect_webhook_secret", "");
    }

    public String getPaypalClientId() {
        return get("paypal.client_id", "");
    }

    public String getPaypalClientSecret() {
        return get("paypal.client_secret", "");
    }

    public boolean isPaypalSandbox() {
        return Boolean.parseBoolean(get("paypal.sandbox", "false"));
    }

    // ── Sandbox-aware active getters ─────────────────────────────────────────

    /** Returns the sandbox or prod client ID based on the paypal.sandbox flag. */
    public String getActivePaypalClientId() {
        if (isPaypalSandbox()) return get("paypal.sandbox.client_id", "");
        return get("paypal.client_id", "");
    }

    /** Returns the sandbox or prod client secret based on the paypal.sandbox flag. */
    public String getActivePaypalClientSecret() {
        if (isPaypalSandbox()) return get("paypal.sandbox.client_secret", "");
        return get("paypal.client_secret", "");
    }

    /** Returns the sandbox or prod billing plan ID based on the paypal.sandbox flag. */
    public String getActivePaypalPlanId() {
        if (isPaypalSandbox()) return get("paypal.sandbox.plan_id", "");
        return get("paypal.plan_id", "");
    }

    /** Returns the sandbox or prod webhook ID based on the paypal.sandbox flag. */
    public String getActivePaypalWebhookId() {
        if (isPaypalSandbox()) return get("paypal.sandbox.webhook_id", "");
        return get("paypal.webhook_id", "");
    }

    /** Returns the sandbox or prod REST API base URL based on the paypal.sandbox flag. */
    public String getActivePaypalBaseUrl() {
        if (isPaypalSandbox())
            return get("paypal.sandbox.base_url", "https://api-m.sandbox.paypal.com");
        return get("paypal.base_url", "https://api-m.paypal.com");
    }
}
