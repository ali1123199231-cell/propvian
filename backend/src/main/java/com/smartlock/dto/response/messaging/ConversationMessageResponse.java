package com.smartlock.dto.response.messaging;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ConversationMessageResponse {
    private UUID id;
    private String senderType;
    private String body;
    private Instant readAt;
    private Instant createdAt;
}
