package com.smartlock.repository;

import com.smartlock.domain.BookingHold;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface BookingHoldRepository extends JpaRepository<BookingHold, UUID> {

    @Query("""
        SELECT h FROM BookingHold h
        WHERE h.status = 'ACTIVE'
          AND h.expiresAt < :now
        """)
    List<BookingHold> findExpired(Instant now);

    List<BookingHold> findByPropertyIdAndStatus(UUID propertyId, String status);
}
