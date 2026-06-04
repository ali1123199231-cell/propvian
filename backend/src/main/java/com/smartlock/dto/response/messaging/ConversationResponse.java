package com.smartlock.dto.response.messaging;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ConversationResponse {
    private UUID id;
    private UUID organizationId;
    private UUID propertyId;
    private String propertyName;
    private UUID directBookingId;
    private String guestName;
    private String guestEmail;
    private String guestAccessToken;
    private int unreadHostCount;
    private String lastMessage;
    private Instant lastMessageAt;
    private List<ConversationMessageResponse> messages;
    private Instant createdAt;
}
