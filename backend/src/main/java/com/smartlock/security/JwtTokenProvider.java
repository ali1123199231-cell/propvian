package com.smartlock.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Component
@Slf4j
public class JwtTokenProvider {

    private static final String BLACKLIST_PREFIX = "auth:blacklist:";

    private final SecretKey key;
    private final long accessExpirationMs;
    private final StringRedisTemplate redisTemplate;

    public JwtTokenProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-expiration-ms}") long accessExpirationMs,
            StringRedisTemplate redisTemplate) {
        byte[] keyBytes = secret.getBytes();
        this.key = Keys.hmacShaKeyFor(keyBytes);
        this.accessExpirationMs = accessExpirationMs;
        this.redisTemplate = redisTemplate;
    }

    public String generateAccessToken(UUID userId, String email, String role, UUID organizationId) {
        Instant now = Instant.now();
        Instant expiry = now.plusMillis(accessExpirationMs);

        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(userId.toString())
                .claim("email", email)
                .claim("role", role)
                .claim("orgId", organizationId != null ? organizationId.toString() : null)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(key, Jwts.SIG.HS512)
                .compact();
    }

    public Claims validateAndExtractClaims(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        if (isBlacklisted(claims.getId())) {
            throw new JwtException("Token has been revoked");
        }

        return claims;
    }

    public UUID extractUserId(Claims claims) {
        return UUID.fromString(claims.getSubject());
    }

    public String extractEmail(Claims claims) {
        return claims.get("email", String.class);
    }

    public String extractRole(Claims claims) {
        return claims.get("role", String.class);
    }

    public UUID extractOrgId(Claims claims) {
        String orgId = claims.get("orgId", String.class);
        return orgId != null ? UUID.fromString(orgId) : null;
    }

    public void blacklistToken(String jti, long remainingMs) {
        try {
            redisTemplate.opsForValue().set(
                    BLACKLIST_PREFIX + jti,
                    "revoked",
                    Duration.ofMillis(remainingMs)
            );
        } catch (Exception e) {
            log.warn("Redis unavailable — token blacklist skipped for jti={}: {}", jti, e.getMessage());
        }
    }

    private boolean isBlacklisted(String jti) {
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey(BLACKLIST_PREFIX + jti));
        } catch (Exception e) {
            log.warn("Redis unavailable — blacklist check skipped for jti={}: {}", jti, e.getMessage());
            return false;
        }
    }

    public long getRemainingMs(Claims claims) {
        long expiry = claims.getExpiration().getTime();
        long now = System.currentTimeMillis();
        return Math.max(0, expiry - now);
    }
}
