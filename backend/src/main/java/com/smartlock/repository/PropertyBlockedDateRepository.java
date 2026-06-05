package com.smartlock.repository;

import com.smartlock.domain.PropertyBlockedDate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface PropertyBlockedDateRepository extends JpaRepository<PropertyBlockedDate, UUID> {

    List<PropertyBlockedDate> findByPropertyId(UUID propertyId);

    void deleteByPropertyId(UUID propertyId);

    @Query("SELECT b FROM PropertyBlockedDate b WHERE b.propertyId = :propertyId " +
           "AND b.startDate <= :end AND b.endDate >= :start")
    List<PropertyBlockedDate> findOverlapping(UUID propertyId, LocalDate start, LocalDate end);
}
