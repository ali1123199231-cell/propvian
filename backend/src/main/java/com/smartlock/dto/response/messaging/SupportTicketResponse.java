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
public class SupportTicketResponse {
    private UUID id;
    private UUID organizationId;
    private String organizationName;
    private String organizationSlug;
    private String subject;
    private String status;
    private String lastMessage;
    private Instant lastMessageAt;
    private List<SupportMessageResponse> messages;
    private Instant createdAt;
}
