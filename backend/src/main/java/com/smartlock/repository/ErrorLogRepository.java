package com.smartlock.repository;

import com.smartlock.domain.ErrorLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.UUID;

public interface ErrorLogRepository extends JpaRepository<ErrorLog, UUID> {
    Page<ErrorLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
    long countByCreatedAtAfter(Instant since);
}
