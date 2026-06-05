package com.smartlock.repository;

import com.smartlock.domain.PropertyPricingRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PropertyPricingRuleRepository extends JpaRepository<PropertyPricingRule, UUID> {

    List<PropertyPricingRule> findByPropertyIdOrderByStartDateAsc(UUID propertyId);

    void deleteByPropertyId(UUID propertyId);

    @Query("SELECT r FROM PropertyPricingRule r WHERE r.propertyId = :propertyId " +
           "AND r.startDate <= :date AND r.endDate >= :date ORDER BY r.startDate DESC")
    List<PropertyPricingRule> findRulesForDate(UUID propertyId, LocalDate date);
}
