package com.smartlock.integration.ttlock;

import com.smartlock.exception.TTLockException;
import com.smartlock.integration.ttlock.dto.TTLockLockInfoResponse;
import com.smartlock.integration.ttlock.dto.TTLockLockListResponse;
import com.smartlock.integration.ttlock.dto.TTLockPasscodeResponse;
import com.smartlock.integration.ttlock.dto.TTLockTokenResponse;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class TTLockClient {

    private final TTLockProperties properties;
    private final RestTemplate restTemplate;

    @PostConstruct
    public void logConfig() {
        log.info("TTLock config | baseUrl={} | oauthBaseUrl={} | clientId={} | redirectUri={}",
                properties.getBaseUrl(), properties.getOauthBaseUrl(),
                properties.getClientId(), properties.getRedirectUri());
    }

    /**
     * Exchange an OAuth authorization code for access/refresh tokens.
     * Used in the OAuth authorization code flow.
     */
    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 1000, multiplier = 2))
    public TTLockTokenResponse exchangeAuthCode(String code, String redirectUri) {
        try {
            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("clientId", properties.getClientId());
            params.add("clientSecret", properties.getClientSecret());
            params.add("code", code);
            params.add("redirect_uri", redirectUri);
            params.add("grant_type", "authorization_code");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            ResponseEntity<TTLockTokenResponse> response = restTemplate.postForEntity(
                    properties.getOauthBaseUrl() + "/oauth2/token",
                    new HttpEntity<>(params, headers),
                    TTLockTokenResponse.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
            throw new TTLockException("Failed to exchange authorization code with TTLock");
        } catch (TTLockException e) {
            throw e;
        } catch (Exception e) {
            throw new TTLockException("TTLock code exchange error: " + e.getMessage(), e);
        }
    }

    /**
     * Get all locks associated with the authenticated TTLock user.
     */
    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 1000, multiplier = 2))
    public List<TTLockLockListResponse.LockItem> getUserLocks(String accessToken) {
        try {
            String url = properties.getBaseUrl() + "/v3/lock/list"
                    + "?clientId=" + properties.getClientId()
                    + "&accessToken=" + accessToken
                    + "&pageNo=1&pageSize=100"
                    + "&date=" + Instant.now().toEpochMilli();

            ResponseEntity<TTLockLockListResponse> response = restTemplate.getForEntity(
                    url, TTLockLockListResponse.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                TTLockLockListResponse body = response.getBody();
                if (!body.isSuccess()) {
                    throw new TTLockException("TTLock lock list error [" + body.getErrCode() + "]: " + body.getErrMsg());
                }
                return body.getList() != null ? body.getList() : List.of();
            }
            throw new TTLockException("Failed to retrieve lock list from TTLock");
        } catch (TTLockException e) {
            throw e;
        } catch (Exception e) {
            throw new TTLockException("TTLock getUserLocks error: " + e.getMessage(), e);
        }
    }

    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 1000, multiplier = 2))
    public TTLockTokenResponse refreshToken(String refreshToken) {
        try {
            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("clientId", properties.getClientId());
            params.add("clientSecret", properties.getClientSecret());
            params.add("grant_type", "refresh_token");
            params.add("refresh_token", refreshToken);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            ResponseEntity<TTLockTokenResponse> response = restTemplate.postForEntity(
                    properties.getOauthBaseUrl() + "/oauth2/token",
                    new HttpEntity<>(params, headers),
                    TTLockTokenResponse.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
            throw new TTLockException("Failed to refresh TTLock token");
        } catch (TTLockException e) {
            throw e;
        } catch (Exception e) {
            throw new TTLockException("TTLock token refresh error: " + e.getMessage(), e);
        }
    }

    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 1000, multiplier = 2))
    public TTLockLockInfoResponse getLockInfo(Long lockId, String accessToken) {
        try {
            String url = properties.getBaseUrl() + "/v3/lock/detail?clientId=" + properties.getClientId()
                    + "&accessToken=" + accessToken
                    + "&lockId=" + lockId
                    + "&date=" + Instant.now().toEpochMilli();

            ResponseEntity<TTLockLockInfoResponse> response = restTemplate.getForEntity(url, TTLockLockInfoResponse.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
            throw new TTLockException("Failed to get lock info");
        } catch (TTLockException e) {
            throw e;
        } catch (Exception e) {
            throw new TTLockException("TTLock getLockInfo error: " + e.getMessage(), e);
        }
    }

    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 1000, multiplier = 2))
    public TTLockPasscodeResponse createKeyboardPasscode(Long lockId, String passcode, long startDate, long endDate, String accessToken) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("clientId", properties.getClientId());
            body.put("accessToken", accessToken);
            body.put("lockId", lockId);
            body.put("keyboardPwdType", 3); // time-sensitive
            body.put("keyboardPwd", passcode);
            body.put("startDate", startDate);
            body.put("endDate", endDate);
            body.put("date", Instant.now().toEpochMilli());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            ResponseEntity<TTLockPasscodeResponse> response = restTemplate.postForEntity(
                    properties.getBaseUrl() + "/v3/keyboardPwd/add",
                    new HttpEntity<>(body, headers),
                    TTLockPasscodeResponse.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                TTLockPasscodeResponse result = response.getBody();
                if (!result.isSuccess()) {
                    throw new TTLockException("TTLock API error [" + result.getErrCode() + "]: " + result.getErrMsg());
                }
                return result;
            }
            throw new TTLockException("Failed to create keyboard passcode");
        } catch (TTLockException e) {
            throw e;
        } catch (Exception e) {
            throw new TTLockException("TTLock createPasscode error: " + e.getMessage(), e);
        }
    }

    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 1000, multiplier = 2))
    public void deleteKeyboardPasscode(Long lockId, Long keyboardPwdId, String accessToken) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("clientId", properties.getClientId());
            body.put("accessToken", accessToken);
            body.put("lockId", lockId);
            body.put("keyboardPwdId", keyboardPwdId);
            body.put("date", Instant.now().toEpochMilli());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            ResponseEntity<TTLockPasscodeResponse> response = restTemplate.postForEntity(
                    properties.getBaseUrl() + "/v3/keyboardPwd/delete",
                    new HttpEntity<>(body, headers),
                    TTLockPasscodeResponse.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                TTLockPasscodeResponse result = response.getBody();
                if (!result.isSuccess()) {
                    log.warn("TTLock delete passcode warning [{}]: {}", result.getErrCode(), result.getErrMsg());
                }
            }
        } catch (TTLockException e) {
            throw e;
        } catch (Exception e) {
            throw new TTLockException("TTLock deletePasscode error: " + e.getMessage(), e);
        }
    }

    /**
     * Authenticate with TTLock using the resource owner password credentials grant.
     * TTLock requires the password to be MD5-hashed before transmission.
     */
    public TTLockTokenResponse loginWithPassword(String username, String password) {
        try {
            String hashedPassword = md5(password);
            log.info("TTLock password login | username={} | tokenUrl={}/oauth2/token",
                    username, properties.getBaseUrl());

            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("clientId", properties.getClientId());
            params.add("clientSecret", properties.getClientSecret());
            params.add("username", username);
            params.add("password", hashedPassword);
            params.add("grant_type", "password");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            ResponseEntity<TTLockTokenResponse> response = restTemplate.postForEntity(
                    properties.getBaseUrl() + "/oauth2/token",
                    new HttpEntity<>(params, headers),
                    TTLockTokenResponse.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                TTLockTokenResponse body = response.getBody();
                if (body.getAccessToken() == null) {
                    String errDetail = body.getErrCode() != null
                            ? "[" + body.getErrCode() + "] " + body.getErrMsg()
                            : "no access_token in response";
                    throw new TTLockException("TTLock login failed: " + errDetail);
                }
                log.info("TTLock password login success | username={} | uid={}", username, body.getUid());
                return body;
            }
            throw new TTLockException("TTLock login failed: empty response");
        } catch (TTLockException e) {
            throw e;
        } catch (Exception e) {
            throw new TTLockException("TTLock login error: " + e.getMessage(), e);
        }
    }

    public String buildOAuthUrl(String state) {
        String url = properties.getOauthBaseUrl() + "/oauth2/authorize"
                + "?client_id=" + properties.getClientId()
                + "&response_type=code"
                + "&redirect_uri=" + properties.getRedirectUri()
                + "&state=" + state;
        log.info("TTLock OAuth URL built | oauthBaseUrl={} | clientId={} | redirectUri={} | state={} | fullUrl={}",
                properties.getOauthBaseUrl(), properties.getClientId(), properties.getRedirectUri(), state, url);
        return url;
    }

    private String md5(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("MD5 not available", e);
        }
    }
}
