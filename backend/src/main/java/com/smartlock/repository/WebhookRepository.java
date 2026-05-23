package com.smartlock.repository;

import com.smartlock.domain.Webhook;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WebhookRepository extends JpaRepository<Webhook, UUID> {
    List<Webhook> findByOrganizationId(UUID organizationId);
    List<Webhook> findByOrganizationIdAndEnabledTrue(UUID organizationId);
}
