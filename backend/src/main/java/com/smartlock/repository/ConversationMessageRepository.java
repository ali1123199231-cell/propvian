package com.smartlock.repository;

import com.smartlock.domain.ConversationMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface ConversationMessageRepository extends JpaRepository<ConversationMessage, UUID> {

    List<ConversationMessage> findByConversationIdOrderByCreatedAtAsc(UUID conversationId);

    @Modifying
    @Query("UPDATE ConversationMessage m SET m.readAt = :now WHERE m.conversationId = :convId AND m.senderType = 'GUEST' AND m.readAt IS NULL")
    int markGuestMessagesRead(UUID convId, Instant now);
}
