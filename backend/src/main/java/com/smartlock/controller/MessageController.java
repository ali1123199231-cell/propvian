package com.smartlock.controller;

import com.smartlock.dto.request.messaging.*;
import com.smartlock.dto.response.common.ApiResponse;
import com.smartlock.dto.response.messaging.*;
import com.smartlock.service.MessagingService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Messaging")
@SecurityRequirement(name = "bearerAuth")
public class MessageController {

    private final MessagingService messagingService;

    // ── Guest conversations ───────────────────────────────────────────────────

    @GetMapping("/api/v1/organizations/{orgId}/conversations")
    public ResponseEntity<ApiResponse<List<ConversationResponse>>> listConversations(
            @PathVariable UUID orgId) {
        log.debug("MessageController.listConversations — orgId={}", orgId);
        return ResponseEntity.ok(ApiResponse.success(messagingService.listConversations(orgId)));
    }

    @GetMapping("/api/v1/organizations/{orgId}/conversations/{convId}")
    public ResponseEntity<ApiResponse<ConversationResponse>> getConversation(
            @PathVariable UUID orgId,
            @PathVariable UUID convId) {
        log.debug("MessageController.getConversation — convId={}", convId);
        return ResponseEntity.ok(ApiResponse.success(messagingService.getConversation(orgId, convId)));
    }

    @PostMapping("/api/v1/organizations/{orgId}/conversations/{convId}/reply")
    public ResponseEntity<ApiResponse<ConversationResponse>> hostReply(
            @PathVariable UUID orgId,
            @PathVariable UUID convId,
            @Valid @RequestBody HostReplyRequest req) {
        log.info("MessageController.hostReply — convId={}", convId);
        return ResponseEntity.ok(ApiResponse.success(messagingService.hostReply(orgId, convId, req.getBody())));
    }

    @PutMapping("/api/v1/organizations/{orgId}/conversations/{convId}/read")
    public ResponseEntity<ApiResponse<Void>> markRead(
            @PathVariable UUID orgId,
            @PathVariable UUID convId) {
        log.debug("MessageController.markRead — convId={}", convId);
        messagingService.markConversationRead(orgId, convId);
        return ResponseEntity.ok(ApiResponse.success("Marked as read", null));
    }

    // ── Support tickets ───────────────────────────────────────────────────────

    @GetMapping("/api/v1/organizations/{orgId}/support/tickets")
    public ResponseEntity<ApiResponse<List<SupportTicketResponse>>> listTickets(
            @PathVariable UUID orgId) {
        log.debug("MessageController.listTickets — orgId={}", orgId);
        return ResponseEntity.ok(ApiResponse.success(messagingService.listTickets(orgId)));
    }

    @PostMapping("/api/v1/organizations/{orgId}/support/tickets")
    public ResponseEntity<ApiResponse<SupportTicketResponse>> createTicket(
            @PathVariable UUID orgId,
            @Valid @RequestBody CreateSupportTicketRequest req) {
        log.info("MessageController.createTicket — orgId={}", orgId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(messagingService.createTicket(orgId, req)));
    }

    @PostMapping("/api/v1/organizations/{orgId}/support/tickets/{ticketId}/reply")
    public ResponseEntity<ApiResponse<SupportTicketResponse>> replyToTicket(
            @PathVariable UUID orgId,
            @PathVariable UUID ticketId,
            @Valid @RequestBody SupportReplyRequest req) {
        log.info("MessageController.replyToTicket — ticketId={}", ticketId);
        return ResponseEntity.ok(ApiResponse.success(messagingService.hostReplyToTicket(orgId, ticketId, req.getBody())));
    }
}
