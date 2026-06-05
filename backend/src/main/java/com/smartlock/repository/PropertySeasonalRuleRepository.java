package com.smartlock.repository;

import com.smartlock.domain.PropertySeasonalRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface PropertySeasonalRuleRepository extends JpaRepository<PropertySeasonalRule, UUID> {

    List<PropertySeasonalRule> findByPropertyIdOrderByStartDateAsc(UUID propertyId);

    void deleteByPropertyId(UUID propertyId);

    // Find seasonal rules that overlap the given date range
    @Query("""
        SELECT s FROM PropertySeasonalRule s
        WHERE s.propertyId = :propertyId
          AND s.startDate <= :endDate
          AND s.endDate   >= :startDate
        ORDER BY s.startDate
        """)
    List<PropertySeasonalRule> findOverlapping(UUID propertyId, LocalDate startDate, LocalDate endDate);
}
