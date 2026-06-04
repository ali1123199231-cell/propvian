package com.smartlock.repository;

import com.smartlock.domain.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

    List<Conversation> findByOrganizationIdOrderByLastMessageAtDesc(UUID organizationId);

    Optional<Conversation> findByOrganizationIdAndGuestEmail(UUID organizationId, String guestEmail);

    Optional<Conversation> findByGuestAccessToken(String guestAccessToken);
}
