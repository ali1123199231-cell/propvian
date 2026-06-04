package com.smartlock.repository;

import com.smartlock.domain.CalendarInterval;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface CalendarIntervalRepository extends JpaRepository<CalendarInterval, UUID> {

    // Returns any interval (regardless of state) overlapping the given range.
    // Uses the half-open interval convention: [startDate, endDate)
    @Query("""
        SELECT ci FROM CalendarInterval ci
        WHERE ci.propertyId = :propertyId
          AND ci.startDate < :endDate
          AND ci.endDate   > :startDate
        ORDER BY ci.startDate
        """)
    List<CalendarInterval> findOverlapping(UUID propertyId, LocalDate startDate, LocalDate endDate);

    // Returns blocking intervals (BOOKED, RESERVED, BLOCKED, BUFFER all block new holds)
    @Query("""
        SELECT ci FROM CalendarInterval ci
        WHERE ci.propertyId = :propertyId
          AND ci.startDate < :endDate
          AND ci.endDate   > :startDate
          AND ci.state NOT IN ('CANCELLED', 'EXPIRED')
        """)
    List<CalendarInterval> findBlockingOverlap(UUID propertyId, LocalDate startDate, LocalDate endDate);

    // Full calendar view for a date window (for UI / website builder)
    @Query("""
        SELECT ci FROM CalendarInterval ci
        WHERE ci.propertyId = :propertyId
          AND ci.startDate < :windowEnd
          AND ci.endDate   > :windowStart
        ORDER BY ci.startDate
        """)
    List<CalendarInterval> findInWindow(UUID propertyId, LocalDate windowStart, LocalDate windowEnd);

    // Find all intervals tied to a booking (for cancellation cleanup)
    List<CalendarInterval> findByBookingId(UUID bookingId);

    // Find all BUFFER intervals adjacent to a booking
    @Query("""
        SELECT ci FROM CalendarInterval ci
        WHERE ci.bookingId = :bookingId
          AND ci.state = 'BUFFER'
        """)
    List<CalendarInterval> findBuffersByBookingId(UUID bookingId);

    // Find expired RESERVED intervals (for cleanup scheduler)
    @Query("""
        SELECT ci FROM CalendarInterval ci
        WHERE ci.state = 'RESERVED'
          AND ci.expiresAt < CURRENT_TIMESTAMP
        """)
    List<CalendarInterval> findExpiredReservations();

    @Modifying
    @Query("DELETE FROM CalendarInterval ci WHERE ci.id = :id")
    void deleteById2(UUID id);
}
