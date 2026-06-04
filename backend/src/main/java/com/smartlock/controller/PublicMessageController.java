package com.smartlock.controller;

import com.smartlock.dto.request.messaging.GuestReplyRequest;
import com.smartlock.dto.request.messaging.SendGuestMessageRequest;
import com.smartlock.dto.response.common.ApiResponse;
import com.smartlock.dto.response.messaging.ConversationResponse;
import com.smartlock.service.MessagingService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/messaging")
@RequiredArgsConstructor
@Tag(name = "Public Messaging")
public class PublicMessageController {

    private final MessagingService messagingService;

    @PostMapping("/properties/{propertySlug}")
    public ResponseEntity<ApiResponse<ConversationResponse>> guestSendMessage(
            @PathVariable String propertySlug,
            @Valid @RequestBody SendGuestMessageRequest req) {
        return ResponseEntity.ok(ApiResponse.success(messagingService.guestSendMessage(propertySlug, req)));
    }

    @GetMapping("/conversations/{accessToken}")
    public ResponseEntity<ApiResponse<ConversationResponse>> guestViewConversation(
            @PathVariable String accessToken) {
        return ResponseEntity.ok(ApiResponse.success(messagingService.guestViewConversation(accessToken)));
    }

    @PostMapping("/conversations/{accessToken}/reply")
    public ResponseEntity<ApiResponse<ConversationResponse>> guestReply(
            @PathVariable String accessToken,
            @Valid @RequestBody GuestReplyRequest req) {
        return ResponseEntity.ok(ApiResponse.success(messagingService.guestReply(accessToken, req.getBody())));
    }
}
