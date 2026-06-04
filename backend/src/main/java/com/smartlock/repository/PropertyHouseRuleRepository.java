package com.smartlock.repository;

import com.smartlock.domain.PropertyHouseRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PropertyHouseRuleRepository extends JpaRepository<PropertyHouseRule, UUID> {

    List<PropertyHouseRule> findByPropertyId(UUID propertyId);

    Optional<PropertyHouseRule> findByPropertyIdAndRuleKey(UUID propertyId, String ruleKey);

    void deleteByPropertyId(UUID propertyId);
}
