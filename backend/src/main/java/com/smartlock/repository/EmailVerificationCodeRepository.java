package com.smartlock.repository;

import com.smartlock.domain.EmailVerificationCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmailVerificationCodeRepository extends JpaRepository<EmailVerificationCode, UUID> {

    Optional<EmailVerificationCode> findFirstByUserIdAndUsedAtIsNullOrderByCreatedAtDesc(UUID userId);

    Optional<EmailVerificationCode> findFirstByUserIdAndCodeAndUsedAtIsNull(UUID userId, String code);

    @Modifying
    @Transactional
    @Query("DELETE FROM EmailVerificationCode e WHERE e.userId = :userId")
    void deleteAllByUserId(UUID userId);
}
