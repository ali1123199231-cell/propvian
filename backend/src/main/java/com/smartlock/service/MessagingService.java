package com.smartlock.service;

import com.smartlock.domain.*;
import com.smartlock.domain.enums.NotificationType;
import com.smartlock.domain.enums.SupportTicketStatus;
import com.smartlock.dto.request.messaging.CreateSupportTicketRequest;
import com.smartlock.dto.request.messaging.SendGuestMessageRequest;
import com.smartlock.dto.response.messaging.*;
import com.smartlock.exception.AppException;
import com.smartlock.exception.ResourceNotFoundException;
import com.smartlock.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessagingService {

    private final ConversationRepository conversationRepository;
    private final ConversationMessageRepository conversationMessageRepository;
    private final SupportTicketRepository supportTicketRepository;
    private final SupportMessageRepository supportMessageRepository;
    private final PropertyRepository propertyRepository;
    private final OrganizationRepository organizationRepository;
    private final OrganizationMemberRepository memberRepository;
    private final NotificationService notificationService;
    private final OrganizationSecurityService orgSecurity;
    private final EmailService emailService;

    @Value("${app.frontend-url:https://propvian.com}")
    private String frontendUrl;

    // ── Public: guest sends first message or reply ────────────────────────────

    @Transactional
    public ConversationResponse guestSendMessage(String propertySlug, SendGuestMessageRequest req) {
        Property property = propertyRepository.findBySlug(propertySlug)
                .or(() -> {
                    try { return propertyRepository.findById(UUID.fromString(propertySlug)); }
                    catch (IllegalArgumentException ignored) { return java.util.Optional.empty(); }
                })
                .orElseThrow(() -> new ResourceNotFoundException("Property not found"));

        UUID orgId = property.getOrganizationId();
        String normalizedEmail = req.getGuestEmail().trim().toLowerCase();

        Conversation conv = conversationRepository
                .findByOrganizationIdAndGuestEmail(orgId, normalizedEmail)
                .orElseGet(() -> conversationRepository.save(
                        Conversation.builder()
                                .organizationId(orgId)
                                .propertyId(property.getId())
                                .guestName(req.getGuestName().trim())
                                .guestEmail(normalizedEmail)
                                .guestAccessToken(UUID.randomUUID().toString())
                                .unreadHostCount(0)
                                .lastMessageAt(Instant.now())
                                .build()
                ));

        conversationMessageRepository.save(ConversationMessage.builder()
                .conversationId(conv.getId())
                .senderType(ConversationMessage.SenderType.GUEST)
                .body(req.getBody().trim())
                .build());

        conv.setUnreadHostCount(conv.getUnreadHostCount() + 1);
        conv.setLastMessageAt(Instant.now());
        conv.setGuestName(req.getGuestName().trim());
        conv = conversationRepository.save(conv);

        notifyOrgOwners(orgId, conv.getId(),
                "New message from " + conv.getGuestName(),
                conv.getGuestName() + " sent you a message about " + property.getName());

        return buildConversationResponse(conv);
    }

    @Transactional(readOnly = true)
    public ConversationResponse guestViewConversation(String accessToken) {
        Conversation conv = conversationRepository.findByGuestAccessToken(accessToken)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
        return buildConversationResponse(conv);
    }

    @Transactional
    public ConversationResponse guestReply(String accessToken, String body) {
        Conversation conv = conversationRepository.findByGuestAccessToken(accessToken)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));

        conversationMessageRepository.save(ConversationMessage.builder()
                .conversationId(conv.getId())
                .senderType(ConversationMessage.SenderType.GUEST)
                .body(body.trim())
                .build());

        conv.setUnreadHostCount(conv.getUnreadHostCount() + 1);
        conv.setLastMessageAt(Instant.now());
        conv = conversationRepository.save(conv);

        notifyOrgOwners(conv.getOrganizationId(), conv.getId(),
                "New reply from " + conv.getGuestName(),
                conv.getGuestName() + " sent a reply");

        return buildConversationResponse(conv);
    }

    // ── Host: guest conversations ─────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ConversationResponse> listConversations(UUID orgId) {
        orgSecurity.requireOrgAccess(orgId);
        return conversationRepository.findByOrganizationIdOrderByLastMessageAtDesc(orgId)
                .stream().map(this::buildConversationResponse).toList();
    }

    @Transactional(readOnly = true)
    public ConversationResponse getConversation(UUID orgId, UUID convId) {
        orgSecurity.requireOrgAccess(orgId);
        Conversation conv = findConvForOrg(orgId, convId);
        return buildConversationResponse(conv);
    }

    @Transactional
    public ConversationResponse hostReply(UUID orgId, UUID convId, String body) {
        orgSecurity.requireOrgAccess(orgId);
        Conversation conv = findConvForOrg(orgId, convId);

        conversationMessageRepository.save(ConversationMessage.builder()
                .conversationId(conv.getId())
                .senderType(ConversationMessage.SenderType.HOST)
                .body(body.trim())
                .build());

        conv.setLastMessageAt(Instant.now());
        conv = conversationRepository.save(conv);

        notifyGuestOfHostReply(conv, body.trim());

        return buildConversationResponse(conv);
    }

    @Transactional
    public void markConversationRead(UUID orgId, UUID convId) {
        orgSecurity.requireOrgAccess(orgId);
        Conversation conv = findConvForOrg(orgId, convId);
        conversationMessageRepository.markGuestMessagesRead(convId, Instant.now());
        conv.setUnreadHostCount(0);
        conversationRepository.save(conv);
    }

    // ── Host: support tickets ─────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<SupportTicketResponse> listTickets(UUID orgId) {
        orgSecurity.requireOrgAccess(orgId);
        return supportTicketRepository.findByOrganizationIdOrderByLastMessageAtDesc(orgId)
                .stream().map(this::buildTicketResponse).toList();
    }

    @Transactional(readOnly = true)
    public SupportTicketResponse getTicket(UUID orgId, UUID ticketId) {
        orgSecurity.requireOrgAccess(orgId);
        return buildTicketResponse(findTicketForOrg(orgId, ticketId));
    }

    @Transactional
    public SupportTicketResponse createTicket(UUID orgId, CreateSupportTicketRequest req) {
        orgSecurity.requireOrgAccess(orgId);

        SupportTicket ticket = supportTicketRepository.save(SupportTicket.builder()
                .organizationId(orgId)
                .subject(req.getSubject().trim())
                .status(SupportTicketStatus.OPEN)
                .lastMessageAt(Instant.now())
                .build());

        supportMessageRepository.save(SupportMessage.builder()
                .ticketId(ticket.getId())
                .senderType(SupportMessage.SenderType.HOST)
                .body(req.getBody().trim())
                .build());

        return buildTicketResponse(ticket);
    }

    @Transactional
    public SupportTicketResponse hostReplyToTicket(UUID orgId, UUID ticketId, String body) {
        orgSecurity.requireOrgAccess(orgId);
        SupportTicket ticket = findTicketForOrg(orgId, ticketId);

        if (ticket.getStatus() == SupportTicketStatus.RESOLVED) {
            throw new AppException("Cannot reply to a resolved ticket", HttpStatus.BAD_REQUEST, "TICKET_RESOLVED");
        }

        supportMessageRepository.save(SupportMessage.builder()
                .ticketId(ticket.getId())
                .senderType(SupportMessage.SenderType.HOST)
                .body(body.trim())
                .build());

        ticket.setStatus(SupportTicketStatus.OPEN);
        ticket.setLastMessageAt(Instant.now());
        ticket = supportTicketRepository.save(ticket);
        return buildTicketResponse(ticket);
    }

    // ── Admin: cross-org support ticket management ────────────────────────────

    @Transactional(readOnly = true)
    public Page<SupportTicketResponse> adminListAllTickets(String status, Pageable pageable) {
        Page<SupportTicket> page = (status != null && !status.isBlank())
                ? supportTicketRepository.findByStatusOrderByLastMessageAtDesc(
                        SupportTicketStatus.valueOf(status.toUpperCase()), pageable)
                : supportTicketRepository.findAllByOrderByLastMessageAtDesc(pageable);

        return page.map(ticket -> {
            SupportTicketResponse resp = buildTicketResponse(ticket);
            organizationRepository.findById(ticket.getOrganizationId()).ifPresent(org -> {
                resp.setOrganizationName(org.getName());
                resp.setOrganizationSlug(org.getSlug());
            });
            return resp;
        });
    }

    @Transactional(readOnly = true)
    public SupportTicketResponse adminGetTicket(UUID ticketId) {
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Support ticket", ticketId));
        SupportTicketResponse resp = buildTicketResponse(ticket);
        organizationRepository.findById(ticket.getOrganizationId()).ifPresent(org -> {
            resp.setOrganizationName(org.getName());
            resp.setOrganizationSlug(org.getSlug());
        });
        return resp;
    }

    @Transactional
    public SupportTicketResponse adminReplyToTicket(UUID ticketId, String body) {
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Support ticket", ticketId));

        supportMessageRepository.save(SupportMessage.builder()
                .ticketId(ticketId)
                .senderType(SupportMessage.SenderType.SUPPORT)
                .body(body.trim())
                .build());

        ticket.setStatus(SupportTicketStatus.WAITING_REPLY);
        ticket.setLastMessageAt(Instant.now());
        ticket = supportTicketRepository.save(ticket);

        // Notify org members of the support reply
        try {
            final UUID orgId = ticket.getOrganizationId();
            final String subject = ticket.getSubject();
            memberRepository.findByOrganizationId(orgId).forEach(member ->
                    notificationService.createNotification(
                            member.getUserId(), orgId,
                            NotificationType.SUPPORT_REPLY,
                            "Support replied to your ticket",
                            "Propvian support replied to: " + subject,
                            "support_ticket", ticketId));
        } catch (Exception e) {
            log.warn("Failed to send support-reply notifications: {}", e.getMessage());
        }

        SupportTicketResponse resp = buildTicketResponse(ticket);
        organizationRepository.findById(ticket.getOrganizationId()).ifPresent(org -> {
            resp.setOrganizationName(org.getName());
            resp.setOrganizationSlug(org.getSlug());
        });
        return resp;
    }

    @Transactional
    public SupportTicketResponse adminUpdateTicketStatus(UUID ticketId, SupportTicketStatus status) {
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Support ticket", ticketId));
        ticket.setStatus(status);
        ticket = supportTicketRepository.save(ticket);
        SupportTicketResponse resp = buildTicketResponse(ticket);
        organizationRepository.findById(ticket.getOrganizationId()).ifPresent(org -> {
            resp.setOrganizationName(org.getName());
            resp.setOrganizationSlug(org.getSlug());
        });
        return resp;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Conversation findConvForOrg(UUID orgId, UUID convId) {
        return conversationRepository.findById(convId)
                .filter(c -> c.getOrganizationId().equals(orgId))
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", convId));
    }

    private SupportTicket findTicketForOrg(UUID orgId, UUID ticketId) {
        return supportTicketRepository.findById(ticketId)
                .filter(t -> t.getOrganizationId().equals(orgId))
                .orElseThrow(() -> new ResourceNotFoundException("Support ticket", ticketId));
    }

    private ConversationResponse buildConversationResponse(Conversation conv) {
        List<ConversationMessage> msgs = conversationMessageRepository
                .findByConversationIdOrderByCreatedAtAsc(conv.getId());

        String propertyName = null;
        if (conv.getPropertyId() != null) {
            propertyName = propertyRepository.findById(conv.getPropertyId())
                    .map(Property::getName).orElse(null);
        }

        String lastMessage = msgs.isEmpty() ? null : msgs.get(msgs.size() - 1).getBody();

        return ConversationResponse.builder()
                .id(conv.getId())
                .organizationId(conv.getOrganizationId())
                .propertyId(conv.getPropertyId())
                .propertyName(propertyName)
                .directBookingId(conv.getDirectBookingId())
                .guestName(conv.getGuestName())
                .guestEmail(conv.getGuestEmail())
                .guestAccessToken(conv.getGuestAccessToken())
                .unreadHostCount(conv.getUnreadHostCount())
                .lastMessage(lastMessage)
                .lastMessageAt(conv.getLastMessageAt())
                .messages(msgs.stream().map(m -> ConversationMessageResponse.builder()
                        .id(m.getId())
                        .senderType(m.getSenderType().name())
                        .body(m.getBody())
                        .readAt(m.getReadAt())
                        .createdAt(m.getCreatedAt())
                        .build()).toList())
                .createdAt(conv.getCreatedAt())
                .build();
    }

    private SupportTicketResponse buildTicketResponse(SupportTicket ticket) {
        List<SupportMessage> msgs = supportMessageRepository
                .findByTicketIdOrderByCreatedAtAsc(ticket.getId());

        String lastMessage = msgs.isEmpty() ? null : msgs.get(msgs.size() - 1).getBody();

        return SupportTicketResponse.builder()
                .id(ticket.getId())
                .organizationId(ticket.getOrganizationId())
                .subject(ticket.getSubject())
                .status(ticket.getStatus().name())
                .lastMessage(lastMessage)
                .lastMessageAt(ticket.getLastMessageAt())
                .messages(msgs.stream().map(m -> SupportMessageResponse.builder()
                        .id(m.getId())
                        .senderType(m.getSenderType().name())
                        .body(m.getBody())
                        .createdAt(m.getCreatedAt())
                        .build()).toList())
                .createdAt(ticket.getCreatedAt())
                .build();
    }

    private void notifyGuestOfHostReply(Conversation conv, String replyBody) {
        try {
            String propertyName = propertyRepository.findById(conv.getPropertyId())
                    .map(p -> p.getName()).orElse("your property");
            String conversationUrl = frontendUrl + "/messages/" + conv.getGuestAccessToken();
            emailService.sendEmail(
                    conv.getGuestEmail(),
                    "New reply from your host — " + propertyName,
                    "email/guest-message-reply",
                    Map.of(
                            "guestName",       conv.getGuestName(),
                            "propertyName",    propertyName,
                            "replyBody",       replyBody,
                            "conversationUrl", conversationUrl
                    )
            );
            log.info("Sent host-reply email to guest {} for conv {}", conv.getGuestEmail(), conv.getId());
        } catch (Exception e) {
            log.warn("Failed to send host-reply email to guest for conv {}: {}", conv.getId(), e.getMessage());
        }
    }

    private void notifyOrgOwners(UUID orgId, UUID convId, String title, String body) {
        try {
            memberRepository.findByOrganizationId(orgId).forEach(member ->
                    notificationService.createNotification(
                            member.getUserId(), orgId,
                            NotificationType.NEW_GUEST_MESSAGE,
                            title, body, "conversation", convId));
        } catch (Exception e) {
            log.warn("Failed to send new-message notifications for org {}: {}", orgId, e.getMessage());
        }
    }
}
