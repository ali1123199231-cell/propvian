package com.smartlock.service;

import com.smartlock.domain.*;
import com.smartlock.domain.enums.MemberRole;
import com.smartlock.domain.enums.Role;
import com.smartlock.dto.request.auth.LoginRequest;
import com.smartlock.dto.request.auth.RefreshTokenRequest;
import com.smartlock.dto.request.auth.RegisterRequest;
import com.smartlock.dto.request.auth.VerifyEmailRequest;
import com.smartlock.dto.response.auth.AuthResponse;
import com.smartlock.exception.AppException;
import com.smartlock.exception.DuplicateResourceException;
import com.smartlock.exception.InvalidTokenException;
import com.smartlock.repository.*;
import com.smartlock.security.JwtTokenProvider;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
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
    private final EmailVerificationCodeRepository verificationCodeRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Value("${jwt.refresh-expiration-ms}")
    private long refreshExpirationMs;

    @Value("${jwt.access-expiration-ms}")
    private long accessExpirationMs;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail().toLowerCase();

        User existingUser = userRepository.findByEmail(email).orElse(null);
        if (existingUser != null) {
            if (existingUser.isOnboardingCompleted()) {
                throw new DuplicateResourceException("An account with this email already exists");
            }
            // Incomplete onboarding — verify password then resume where they left off
            if (!passwordEncoder.matches(request.getPassword(), existingUser.getPasswordHash())) {
                throw new DuplicateResourceException("An account with this email already exists");
            }
            if ("EMAIL_VERIFICATION".equals(existingUser.getOnboardingStep())) {
                sendVerificationCode(existingUser);
            }
            List<OrganizationMember> memberships = memberRepository.findByUserId(existingUser.getId());
            UUID orgId = memberships.isEmpty() ? null : memberships.get(0).getOrganizationId();
            log.info("Resuming incomplete registration for user: {}", email);
            return buildAuthResponse(existingUser, orgId);
        }

        String resolvedFirstName = request.getFirstName() != null ? request.getFirstName()
                : (request.getName() != null ? request.getName().split(" ")[0] : null);
        String resolvedLastName  = request.getLastName() != null ? request.getLastName()
                : (request.getName() != null && request.getName().contains(" ")
                   ? request.getName().substring(request.getName().indexOf(' ') + 1) : null);
        String displayName = resolvedFirstName != null ? resolvedFirstName
                + (resolvedLastName != null ? " " + resolvedLastName : "") : request.getName();

        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .name(displayName)
                .firstName(resolvedFirstName)
                .lastName(resolvedLastName)
                .role(Role.USER)
                .emailVerified(false)
                .onboardingStep("EMAIL_VERIFICATION")
                .onboardingCompleted(false)
                .build();
        user = userRepository.save(user);

        // Auto-create a default organization — slug is a random internal ID,
        // never derived from the user's email. The host picks a public-facing
        // brand slug later in the website setup wizard.
        String slug = "org-" + UUID.randomUUID().toString().substring(0, 8);
        while (organizationRepository.existsBySlug(slug)) {
            slug = "org-" + UUID.randomUUID().toString().substring(0, 8);
        }
        Organization org = Organization.builder()
                .name("My Organization")
                .slug(slug)
                .ownerId(user.getId())
                .timezone("UTC")
                .build();
        org = organizationRepository.save(org);

        memberRepository.save(OrganizationMember.builder()
                .organizationId(org.getId())
                .userId(user.getId())
                .role(MemberRole.OWNER)
                .acceptedAt(Instant.now())
                .build());

        sendVerificationCode(user);
        log.info("New user registered: {} (org: {})", user.getEmail(), org.getId());

        return buildAuthResponse(user, org.getId());
    }

    @Transactional
    public AuthResponse verifyEmail(VerifyEmailRequest request, UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));

        if (user.isEmailVerified()) {
            List<OrganizationMember> memberships = memberRepository.findByUserId(userId);
            UUID orgId = memberships.isEmpty() ? null : memberships.get(0).getOrganizationId();
            return buildAuthResponse(user, orgId);
        }

        EmailVerificationCode code = verificationCodeRepository
                .findFirstByUserIdAndCodeAndUsedAtIsNull(userId, request.getCode())
                .orElseThrow(() -> new AppException("Invalid verification code", HttpStatus.BAD_REQUEST, "INVALID_CODE"));

        if (code.isExpired()) {
            throw new AppException("Verification code has expired. Please request a new one.", HttpStatus.BAD_REQUEST, "CODE_EXPIRED");
        }

        code.setUsedAt(Instant.now());
        verificationCodeRepository.save(code);

        user.setEmailVerified(true);
        user.setOnboardingStep("TTLOCK_CONNECT");
        userRepository.save(user);

        List<OrganizationMember> memberships = memberRepository.findByUserId(userId);
        UUID orgId = memberships.isEmpty() ? null : memberships.get(0).getOrganizationId();
        return buildAuthResponse(user, orgId);
    }

    @Transactional
    public void resendVerification(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));

        if (user.isEmailVerified()) {
            throw new AppException("Email already verified", HttpStatus.BAD_REQUEST, "ALREADY_VERIFIED");
        }

        // Rate limit: check if a code was sent in the last 60 seconds
        verificationCodeRepository
                .findFirstByUserIdAndUsedAtIsNullOrderByCreatedAtDesc(userId)
                .ifPresent(existing -> {
                    if (existing.getCreatedAt().isAfter(Instant.now().minusSeconds(60))) {
                        throw new AppException("Please wait before requesting another code", HttpStatus.TOO_MANY_REQUESTS, "RATE_LIMITED");
                    }
                });

        sendVerificationCode(user);
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

    private void sendVerificationCode(User user) {
        verificationCodeRepository.deleteAllByUserId(user.getId());

        String code = String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
        verificationCodeRepository.save(EmailVerificationCode.builder()
                .userId(user.getId())
                .code(code)
                .expiresAt(Instant.now().plusSeconds(900))
                .build());

        emailService.sendVerificationCodeEmail(user.getEmail(), user.getDisplayName(), code);
    }

    private AuthResponse buildAuthResponse(User user, UUID activeOrgId) {
        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getId(), user.getEmail(), user.getRole().name(), activeOrgId
        );

        String rawRefreshToken = UUID.randomUUID().toString();
        refreshTokenRepository.save(RefreshToken.builder()
                .token(rawRefreshToken)
                .userId(user.getId())
                .expiresAt(Instant.now().plusMillis(refreshExpirationMs))
                .build());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(rawRefreshToken)
                .tokenType("Bearer")
                .expiresIn(accessExpirationMs / 1000)
                .user(AuthResponse.UserInfo.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .name(user.getDisplayName())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .role(user.getRole().name())
                        .avatarUrl(user.getAvatarUrl())
                        .emailVerified(user.isEmailVerified())
                        .onboardingStep(user.getOnboardingStep())
                        .onboardingCompleted(user.isOnboardingCompleted())
                        .organizationId(activeOrgId)
                        .build())
                .build();
    }

    @Transactional
    public void forgotPassword(String email) {
        // Always return silently — don't reveal whether email exists
        userRepository.findByEmail(email.toLowerCase()).ifPresent(user -> {
            String token = UUID.randomUUID().toString().replace("-", "");
            user.setPasswordResetToken(token);
            user.setPasswordResetExpiresAt(Instant.now().plusSeconds(3600)); // 1 hour
            userRepository.save(user);
            emailService.sendEmail(
                user.getEmail(),
                "Reset your Propvian password",
                "email/password-reset",
                java.util.Map.of(
                    "name",  user.getFirstName() != null ? user.getFirstName() : "there",
                    "token", token
                )
            );
        });
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        User user = userRepository.findByPasswordResetToken(token)
            .orElseThrow(() -> new AppException("Invalid or expired reset link", HttpStatus.BAD_REQUEST));
        if (user.getPasswordResetExpiresAt() == null || Instant.now().isAfter(user.getPasswordResetExpiresAt())) {
            throw new AppException("Reset link has expired. Please request a new one.", HttpStatus.BAD_REQUEST);
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setPasswordResetToken(null);
        user.setPasswordResetExpiresAt(null);
        userRepository.save(user);
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
