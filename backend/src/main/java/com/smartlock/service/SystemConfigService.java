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
                    log.warn("SystemConfig key '{}' not found, using default '{}'", key, defaultValue);
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

    @Transactional(readOnly = true)
    public Map<String, String> getAllPublicConfig() {
        return StreamSupport.stream(repository.findAll().spliterator(), false)
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

    public String getPaypalClientId() {
        return get("paypal.client_id", "");
    }

    public String getPaypalClientSecret() {
        return get("paypal.client_secret", "");
    }

    public boolean isPaypalSandbox() {
        return Boolean.parseBoolean(get("paypal.sandbox", "false"));
    }
}
