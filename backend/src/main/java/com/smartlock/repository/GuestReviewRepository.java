package com.smartlock.repository;

import com.smartlock.domain.GuestReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.UUID;

public interface GuestReviewRepository extends JpaRepository<GuestReview, UUID> {

    Page<GuestReview> findByPropertyIdAndPublicReviewTrue(UUID propertyId, Pageable pageable);

    Page<GuestReview> findByPropertyId(UUID propertyId, Pageable pageable);

    @Query("SELECT AVG(r.rating) FROM GuestReview r WHERE r.propertyId = :propertyId AND r.publicReview = true")
    Double findAverageRatingByPropertyId(UUID propertyId);

    long countByPropertyIdAndPublicReviewTrue(UUID propertyId);
}
