package com.smartlock.repository;

import com.smartlock.domain.WebsiteSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WebsiteSectionRepository extends JpaRepository<WebsiteSection, UUID> {
    List<WebsiteSection> findByWebsiteIdOrderByPosition(UUID websiteId);

    @Query("SELECT COUNT(s) FROM WebsiteSection s WHERE s.websiteId = :websiteId")
    long countByWebsiteId(UUID websiteId);

    Optional<WebsiteSection> findByIdAndWebsiteId(UUID id, UUID websiteId);

    @Modifying
    @Query("DELETE FROM WebsiteSection s WHERE s.websiteId = :websiteId")
    void deleteByWebsiteId(UUID websiteId);
}
