package com.smartlock.service;

import com.smartlock.domain.User;
import com.smartlock.exception.ResourceNotFoundException;
import com.smartlock.repository.UserRepository;
import com.smartlock.util.LogMaskingUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User getById(UUID id) {
        log.debug("UserService.getById — userId={}", id);
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @Transactional
    public User updateProfile(UUID id, String firstName, String lastName, String avatarUrl) {
        log.info("UserService.updateProfile — userId={} hasFirstName={} hasLastName={} hasAvatar={}",
                id, firstName != null, lastName != null, avatarUrl != null);
        User user = getById(id);
        if (firstName != null) user.setFirstName(firstName);
        if (lastName != null) user.setLastName(lastName);
        if (avatarUrl != null) user.setAvatarUrl(avatarUrl.isBlank() ? null : avatarUrl);
        User saved = userRepository.save(user);
        log.info("UserService.updateProfile — success userId={}", id);
        return saved;
    }

    @Transactional
    public void changePassword(UUID id, String currentPassword, String newPassword) {
        log.info("UserService.changePassword — userId={}", id);
        User user = getById(id);
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            log.warn("UserService.changePassword — wrong current password userId={}", id);
            throw new com.smartlock.exception.AppException(
                    "Current password is incorrect", org.springframework.http.HttpStatus.BAD_REQUEST, "INVALID_PASSWORD");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        log.info("UserService.changePassword — success userId={}", id);
    }
}
