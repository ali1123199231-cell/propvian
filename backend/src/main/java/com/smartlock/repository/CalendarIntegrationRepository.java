package com.smartlock.repository;

import com.smartlock.domain.CalendarIntegration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.UUID;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CalendarIntegrationRepository extends JpaRepository<CalendarIntegration, UUID> {
    List<CalendarIntegration> findByPropertyId(UUID propertyId);

    boolean existsByPropertyIdAndIcalUrlAndDeletedAtIsNull(UUID propertyId, String icalUrl);

    @Query("SELECT ci FROM CalendarIntegration ci WHERE ci.enabled = true AND ci.deletedAt IS NULL")
    List<CalendarIntegration> findAllEnabled();
}
