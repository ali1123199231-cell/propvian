package com.smartlock.repository;

import com.smartlock.domain.DirectBooking;
import com.smartlock.domain.enums.DirectBookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface DirectBookingRepository extends JpaRepository<DirectBooking, UUID> {

    Page<DirectBooking> findByOrganizationId(UUID organizationId, Pageable pageable);

    Page<DirectBooking> findByOrganizationIdAndStatus(UUID organizationId, DirectBookingStatus status, Pageable pageable);

    List<DirectBooking> findByPropertyId(UUID propertyId);

    long countByOrganizationIdAndStatus(UUID organizationId, DirectBookingStatus status);

    @Query("SELECT b FROM DirectBooking b WHERE b.propertyId = :propertyId AND b.status != 'CANCELLED' " +
           "AND b.checkInDate < :checkOut AND b.checkOutDate > :checkIn")
    List<DirectBooking> findConflictingBookings(UUID propertyId, LocalDate checkIn, LocalDate checkOut);

    @Query("SELECT COALESCE(SUM(b.totalAmount), 0) FROM DirectBooking b " +
           "WHERE b.organizationId = :orgId AND b.status = 'CONFIRMED' AND b.checkInDate >= :from")
    java.math.BigDecimal sumRevenueFromDate(UUID orgId, LocalDate from);
}
