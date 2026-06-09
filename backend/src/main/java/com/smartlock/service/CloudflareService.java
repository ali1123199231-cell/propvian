package com.smartlock.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudflareService {

    private static final String CF_API = "https://api.cloudflare.com/client/v4";

    private final SystemConfigService systemConfigService;
    private final RestTemplate restTemplate;

    public void addCustomHostname(String hostname) {
        String zoneId = systemConfigService.get("cloudflare.zone_id", null);
        String token  = systemConfigService.get("cloudflare.api_token", null);
        if (zoneId == null || token == null) {
            log.warn("CloudflareService.addCustomHostname — credentials not configured, skipping");
            return;
        }
        log.info("CloudflareService.addCustomHostname — hostname={}", hostname);
        try {
            HttpHeaders headers = buildHeaders(token);
            Map<String, Object> body = Map.of(
                "hostname", hostname,
                "ssl", Map.of("method", "http", "type", "dv")
            );
            restTemplate.exchange(
                CF_API + "/zones/" + zoneId + "/custom_hostnames",
                HttpMethod.POST,
                new HttpEntity<>(body, headers),
                Map.class
            );
            log.info("CloudflareService.addCustomHostname — registered hostname={}", hostname);
        } catch (HttpClientErrorException e) {
            // 409 = already exists, safe to ignore
            if (e.getStatusCode() == HttpStatus.CONFLICT) {
                log.info("CloudflareService.addCustomHostname — already exists hostname={}", hostname);
            } else {
                log.error("CloudflareService.addCustomHostname — failed hostname={} status={} body={}",
                        hostname, e.getStatusCode(), e.getResponseBodyAsString());
            }
        } catch (Exception e) {
            log.error("CloudflareService.addCustomHostname — unexpected error hostname={}", hostname, e);
        }
    }

    public void deleteCustomHostname(String hostname) {
        String zoneId = systemConfigService.get("cloudflare.zone_id", null);
        String token  = systemConfigService.get("cloudflare.api_token", null);
        if (zoneId == null || token == null) {
            log.warn("CloudflareService.deleteCustomHostname — credentials not configured, skipping");
            return;
        }
        log.info("CloudflareService.deleteCustomHostname — hostname={}", hostname);
        try {
            HttpHeaders headers = buildHeaders(token);
            // Look up the Custom Hostname ID first
            ResponseEntity<Map> listResp = restTemplate.exchange(
                CF_API + "/zones/" + zoneId + "/custom_hostnames?hostname=" + hostname,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                Map.class
            );
            List<Map<String, Object>> results = (List<Map<String, Object>>) listResp.getBody().get("result");
            if (results == null || results.isEmpty()) {
                log.info("CloudflareService.deleteCustomHostname — not found hostname={}", hostname);
                return;
            }
            String id = (String) results.get(0).get("id");
            restTemplate.exchange(
                CF_API + "/zones/" + zoneId + "/custom_hostnames/" + id,
                HttpMethod.DELETE,
                new HttpEntity<>(headers),
                Map.class
            );
            log.info("CloudflareService.deleteCustomHostname — deleted hostname={} id={}", hostname, id);
        } catch (Exception e) {
            log.error("CloudflareService.deleteCustomHostname — failed hostname={}", hostname, e);
        }
    }

    private HttpHeaders buildHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }
}
