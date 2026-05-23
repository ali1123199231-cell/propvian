package com.smartlock.repository;

import com.smartlock.domain.ActivityEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ActivityEventRepository extends JpaRepository<ActivityEvent, UUID> {
    Page<ActivityEvent> findByOrganizationIdOrderByOccurredAtDesc(UUID organizationId, Pageable pageable);
}
