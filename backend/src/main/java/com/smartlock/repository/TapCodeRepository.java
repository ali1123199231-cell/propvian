package com.smartlock.repository;

import com.smartlock.domain.TapCode;
import com.smartlock.domain.enums.TapCodeKind;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TapCodeRepository extends JpaRepository<TapCode, String> {

    List<TapCode> findByPropertyIdOrderByCreatedAtAsc(UUID propertyId);

    Optional<TapCode> findFirstByPropertyIdAndKindOrderByCreatedAtAsc(UUID propertyId, TapCodeKind kind);

    /** Kit members stay next to each other, in the order the cards print and the tags get written. */
    @Query("SELECT t FROM TapCode t WHERE t.batchLabel = :batch ORDER BY COALESCE(t.kitCode, t.code), t.code")
    List<TapCode> findBatchInKitOrder(@Param("batch") String batchLabel);

    boolean existsByBatchLabel(String batchLabel);

    /** Claims an unclaimed PRODUCT code; returns 0 when someone else got there first. */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE TapCode t SET t.organizationId = :orgId, t.propertyId = :propertyId, " +
           "t.claimedAt = :now, t.claimedBy = :userId " +
           "WHERE t.code = :code AND t.kind = com.smartlock.domain.enums.TapCodeKind.PRODUCT AND t.organizationId IS NULL")
    int claimIfUnclaimed(@Param("code") String code, @Param("orgId") UUID orgId, @Param("propertyId") UUID propertyId,
                         @Param("userId") UUID userId, @Param("now") Instant now);

    /** Claims the still-unclaimed rest of a kit together with the code that was tapped. */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE TapCode t SET t.organizationId = :orgId, t.propertyId = :propertyId, " +
           "t.claimedAt = :now, t.claimedBy = :userId " +
           "WHERE t.kitCode = :kitCode AND t.kind = com.smartlock.domain.enums.TapCodeKind.PRODUCT AND t.organizationId IS NULL")
    int claimKitIfUnclaimed(@Param("kitCode") String kitCode, @Param("orgId") UUID orgId, @Param("propertyId") UUID propertyId,
                            @Param("userId") UUID userId, @Param("now") Instant now);

    /** Moves a whole kit between properties of the org that owns it. */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE TapCode t SET t.propertyId = :propertyId WHERE t.kitCode = :kitCode AND t.organizationId = :orgId")
    int moveKit(@Param("kitCode") String kitCode, @Param("orgId") UUID orgId, @Param("propertyId") UUID propertyId);

    interface BatchSummary {
        String getBatchLabel();
        long getIssued();
        long getClaimed();
        Instant getCreatedAt();
    }

    @Query("SELECT t.batchLabel AS batchLabel, COUNT(t) AS issued, COUNT(t.claimedAt) AS claimed, MIN(t.createdAt) AS createdAt " +
           "FROM TapCode t WHERE t.kind = com.smartlock.domain.enums.TapCodeKind.PRODUCT " +
           "GROUP BY t.batchLabel ORDER BY MIN(t.createdAt) DESC")
    List<BatchSummary> summarizeProductBatches();

    /** Codes in each batch that have been opened at least once, by anyone. Rows: [batch_label, count]. */
    @Query(value = "SELECT t.batch_label, COUNT(DISTINCT t.code) FROM tap_codes t " +
                   "JOIN guest_page_events e ON e.code = t.code AND e.event_type = 'VIEW' " +
                   "WHERE t.kind = 'PRODUCT' GROUP BY t.batch_label", nativeQuery = true)
    List<Object[]> countScannedCodesByBatch();

    @Query(value = "SELECT COUNT(DISTINCT t.code) FROM tap_codes t " +
                   "JOIN guest_page_events e ON e.code = t.code AND e.event_type = 'VIEW' " +
                   "WHERE t.batch_label = :batch", nativeQuery = true)
    long countScannedCodesInBatch(@Param("batch") String batch);
}
