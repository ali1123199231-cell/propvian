package com.smartlock.service;

import com.smartlock.domain.Organization;
import com.smartlock.domain.OrganizationMember;
import com.smartlock.domain.RefreshToken;
import com.smartlock.domain.User;
import com.smartlock.domain.enums.MemberRole;
import com.smartlock.domain.enums.Role;
import com.smartlock.dto.request.auth.LoginRequest;
import com.smartlock.dto.request.auth.RefreshTokenRequest;
import com.smartlock.dto.request.auth.RegisterRequest;
import com.smartlock.dto.response.auth.AuthResponse;
import com.smartlock.exception.DuplicateResourceException;
import com.smartlock.exception.InvalidTokenException;
import com.smartlock.repository.OrganizationMemberRepository;
import com.smartlock.repository.OrganizationRepository;
import com.smartlock.repository.RefreshTokenRepository;
import com.smartlock.repository.UserRepository;
import com.smartlock.security.JwtTokenProvider;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final OrganizationMemberRepository memberRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;

    @Value("${jwt.refresh-expiration-ms}")
    private long refreshExpirationMs;

    @Value("${jwt.access-expiration-ms}")
    private long accessExpirationMs;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail().toLowerCase())) {
            throw new DuplicateResourceException("Email already registered");
        }

        User user = User.builder()
                .email(request.getEmail().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(Role.USER)
                .emailVerified(false)
                .build();

        user = userRepository.save(user);
        log.info("New user registered: {}", user.getEmail());

        return buildAuthResponse(user, null);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail().toLowerCase(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(() -> new InvalidTokenException("User not found"));

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        List<OrganizationMember> memberships = memberRepository.findByUserId(user.getId());
        UUID activeOrgId = memberships.isEmpty() ? null : memberships.get(0).getOrganizationId();

        return buildAuthResponse(user, activeOrgId);
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken storedToken = refreshTokenRepository.findByTokenAndRevokedAtIsNull(request.getRefreshToken())
                .orElseThrow(() -> new InvalidTokenException("Invalid refresh token"));

        if (storedToken.isExpired()) {
            storedToken.setRevokedAt(Instant.now());
            refreshTokenRepository.save(storedToken);
            throw new InvalidTokenException("Refresh token expired");
        }

        storedToken.setRevokedAt(Instant.now());
        refreshTokenRepository.save(storedToken);

        User user = userRepository.findById(storedToken.getUserId())
                .orElseThrow(() -> new InvalidTokenException("User not found"));

        List<OrganizationMember> memberships = memberRepository.findByUserId(user.getId());
        UUID activeOrgId = memberships.isEmpty() ? null : memberships.get(0).getOrganizationId();

        return buildAuthResponse(user, activeOrgId);
    }

    @Transactional
    public void logout(String accessToken, UUID userId) {
        try {
            Claims claims = jwtTokenProvider.validateAndExtractClaims(accessToken);
            long remainingMs = jwtTokenProvider.getRemainingMs(claims);
            jwtTokenProvider.blacklistToken(claims.getId(), remainingMs);
        } catch (JwtException e) {
            // token already invalid, ignore
        }
        refreshTokenRepository.revokeAllByUserId(userId, Instant.now());
    }

    private AuthResponse buildAuthResponse(User user, UUID activeOrgId) {
        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getId(), user.getEmail(), user.getRole().name(), activeOrgId
        );

        String rawRefreshToken = UUID.randomUUID().toString();
        RefreshToken refreshToken = RefreshToken.builder()
                .token(rawRefreshToken)
                .userId(user.getId())
                .expiresAt(Instant.now().plusMillis(refreshExpirationMs))
                .build();
        refreshTokenRepository.save(refreshToken);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(rawRefreshToken)
                .tokenType("Bearer")
                .expiresIn(accessExpirationMs / 1000)
                .user(AuthResponse.UserInfo.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .role(user.getRole().name())
                        .avatarUrl(user.getAvatarUrl())
                        .build())
                .build();
    }

    public static String slugify(String text) {
        String normalized = Normalizer.normalize(text, Normalizer.Form.NFD);
        Pattern pattern = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        return pattern.matcher(normalized)
                .replaceAll("")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9\\s-]", "")
                .trim()
                .replaceAll("[\\s-]+", "-");
    }
}
