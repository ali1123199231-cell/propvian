package com.smartlock.repository;

import com.smartlock.domain.Reservation;
import com.smartlock.domain.enums.ReservationSource;
import com.smartlock.domain.enums.ReservationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, UUID> {
    Page<Reservation> findByPropertyId(UUID propertyId, Pageable pageable);

    Optional<Reservation> findByPropertyIdAndIcalUid(UUID propertyId, String icalUid);

    Optional<Reservation> findByPropertyIdAndExternalIdAndSource(UUID propertyId, String externalId, ReservationSource source);

    @Query("SELECT r FROM Reservation r JOIN Property p ON r.propertyId = p.id WHERE p.organizationId = :orgId AND r.deletedAt IS NULL")
    Page<Reservation> findByOrganizationId(UUID orgId, Pageable pageable);

    @Query("SELECT r FROM Reservation r WHERE r.propertyId IN :propertyIds AND r.checkInDate >= :from AND r.checkInDate < :to AND r.deletedAt IS NULL")
    List<Reservation> findUpcomingCheckIns(List<UUID> propertyIds, Instant from, Instant to);

    @Query("SELECT r FROM Reservation r WHERE r.propertyId IN :propertyIds AND r.checkOutDate >= :from AND r.checkOutDate < :to AND r.status = 'CONFIRMED' AND r.deletedAt IS NULL")
    List<Reservation> findUpcomingCheckOuts(List<UUID> propertyIds, Instant from, Instant to);

    @Query("SELECT COUNT(r) FROM Reservation r JOIN Property p ON r.propertyId = p.id WHERE p.organizationId = :orgId AND r.deletedAt IS NULL")
    long countByOrganizationId(UUID orgId);

    @Query("SELECT COUNT(r) FROM Reservation r JOIN Property p ON r.propertyId = p.id WHERE p.organizationId = :orgId AND r.status = :status AND r.deletedAt IS NULL")
    long countByOrganizationIdAndStatus(UUID orgId, ReservationStatus status);

    @Query("SELECT COUNT(r) FROM Reservation r JOIN Property p ON r.propertyId = p.id WHERE p.organizationId = :orgId AND r.createdAt >= :from AND r.deletedAt IS NULL")
    long countByOrganizationIdSince(UUID orgId, Instant from);
}
