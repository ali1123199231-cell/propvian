package com.smartlock.repository;

import com.smartlock.domain.Subscription;
import com.smartlock.domain.enums.SubscriptionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {
    Optional<Subscription> findByOrganizationId(UUID organizationId);
    Optional<Subscription> findByStripeSubscriptionId(String stripeSubscriptionId);
    Optional<Subscription> findByPaypalSubscriptionId(String paypalSubscriptionId);
    Page<Subscription> findByStatus(SubscriptionStatus status, Pageable pageable);
    long countByStatus(SubscriptionStatus status);
}
