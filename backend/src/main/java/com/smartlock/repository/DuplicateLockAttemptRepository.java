package com.smartlock.repository;

import com.smartlock.domain.DuplicateLockAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface DuplicateLockAttemptRepository extends JpaRepository<DuplicateLockAttempt, UUID> {
}
