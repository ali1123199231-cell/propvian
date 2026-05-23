package com.smartlock.repository;

import com.smartlock.domain.SubscriptionPlan;
import com.smartlock.domain.enums.SubscriptionTier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, UUID> {
    Optional<SubscriptionPlan> findByTier(SubscriptionTier tier);
    List<SubscriptionPlan> findByIsActiveTrueOrderByMonthlyPriceAsc();
}
