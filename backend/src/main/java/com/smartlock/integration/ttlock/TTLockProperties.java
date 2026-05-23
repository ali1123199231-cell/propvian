package com.smartlock.integration.ttlock;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "ttlock")
public class TTLockProperties {
    private String baseUrl = "https://api.sciener.com";
    private String oauthBaseUrl = "https://euopen.sciener.com";
    private String clientId;
    private String clientSecret;
    private String redirectUri = "http://localhost:8080/api/v1/ttlock/oauth/callback";
    private Retry retry = new Retry();

    @Data
    public static class Retry {
        private int maxAttempts = 3;
        private long waitDurationMs = 1000;
    }
}
