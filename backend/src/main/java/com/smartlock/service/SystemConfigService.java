package com.smartlock.service;

import com.smartlock.repository.SystemConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class SystemConfigService {

    private final SystemConfigRepository repository;

    public String get(String key, String defaultValue) {
        return repository.findById(key)
                .map(c -> c.getValue())
                .orElseGet(() -> {
                    log.warn("SystemConfig key '{}' not found, using default '{}'", key, defaultValue);
                    return defaultValue;
                });
    }

    /** Returns "oauth" or "password" */
    public String getTtlockAuthMethod() {
        return get("ttlock.auth_method", "oauth");
    }

    public String getTtlockRedirectUri() {
        return get("ttlock.redirect_uri", "https://propvian.com/api/v1/ttlock/oauth/callback");
    }
}
