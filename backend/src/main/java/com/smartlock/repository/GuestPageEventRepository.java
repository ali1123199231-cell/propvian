package com.smartlock.repository;

import com.smartlock.domain.GuestPageEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface GuestPageEventRepository extends JpaRepository<GuestPageEvent, Long> {

    /** Rows: [GuestPageEventType, count]. */
    @Query("SELECT e.eventType, COUNT(e) FROM GuestPageEvent e " +
           "WHERE e.propertyId = :propertyId AND e.createdAt >= :since GROUP BY e.eventType")
    List<Object[]> countByType(@Param("propertyId") UUID propertyId, @Param("since") Instant since);

    /** Views split by how the page was opened. Rows: [TapSource, count]. */
    @Query("SELECT e.source, COUNT(e) FROM GuestPageEvent e " +
           "WHERE e.propertyId = :propertyId AND e.createdAt >= :since " +
           "AND e.eventType = com.smartlock.domain.enums.GuestPageEventType.VIEW GROUP BY e.source")
    List<Object[]> countViewsBySource(@Param("propertyId") UUID propertyId, @Param("since") Instant since);

    /** Views per code, so a host with three stands sees which one guests use. Rows: [code, count]. */
    @Query("SELECT e.code, COUNT(e) FROM GuestPageEvent e " +
           "WHERE e.propertyId = :propertyId AND e.createdAt >= :since " +
           "AND e.eventType = com.smartlock.domain.enums.GuestPageEventType.VIEW GROUP BY e.code")
    List<Object[]> countViewsByCode(@Param("propertyId") UUID propertyId, @Param("since") Instant since);

    /** Daily views in UTC. Rows: [java.sql.Date, count]. */
    @Query(value = "SELECT CAST(created_at AT TIME ZONE 'UTC' AS DATE) AS day, COUNT(*) FROM guest_page_events " +
                   "WHERE property_id = :propertyId AND created_at >= :since AND event_type = 'VIEW' " +
                   "GROUP BY 1 ORDER BY 1", nativeQuery = true)
    List<Object[]> countDailyViews(@Param("propertyId") UUID propertyId, @Param("since") Instant since);

    /** Rows: [propertyId, count]. */
    @Query("SELECT e.propertyId, COUNT(e) FROM GuestPageEvent e " +
           "WHERE e.propertyId IN :propertyIds AND e.createdAt >= :since " +
           "AND e.eventType = com.smartlock.domain.enums.GuestPageEventType.VIEW GROUP BY e.propertyId")
    List<Object[]> countViewsByProperty(@Param("propertyIds") Collection<UUID> propertyIds, @Param("since") Instant since);
}
