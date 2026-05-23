package com.smartlock.repository;

import com.smartlock.domain.TtlockOAuthState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Repository
public interface TtlockOAuthStateRepository extends JpaRepository<TtlockOAuthState, UUID> {

    @Modifying
    @Transactional
    @Query("DELETE FROM TtlockOAuthState s WHERE s.expiresAt < :now")
    void deleteExpired(Instant now);
}
