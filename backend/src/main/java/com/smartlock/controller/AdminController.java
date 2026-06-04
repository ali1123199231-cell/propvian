package com.smartlock.controller;

import com.smartlock.domain.enums.Role;
import com.smartlock.domain.enums.SupportTicketStatus;
import com.smartlock.dto.request.messaging.SupportReplyRequest;
import com.smartlock.dto.response.admin.*;
import com.smartlock.dto.response.common.ApiResponse;
import com.smartlock.dto.response.common.PageResponse;
import com.smartlock.dto.response.messaging.SupportTicketResponse;
import com.smartlock.service.AdminService;
import com.smartlock.service.MessagingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final MessagingService messagingService;

    // ── Dashboard ─────────────────────────────────────────────────────────────

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<AdminDashboardResponse>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getDashboard()));
    }

    // ── Users ─────────────────────────────────────────────────────────────────

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<AdminUserResponse>>> listUsers(
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(adminService.listUsers(q, page, size)));
    }

    @GetMapping("/users/{userId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<AdminUserResponse>> getUser(@PathVariable UUID userId) {
        return ResponseEntity.ok(ApiResponse.success(adminService.getUser(userId)));
    }

    @PutMapping("/users/{userId}/role")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<AdminUserResponse>> changeUserRole(
            @PathVariable UUID userId,
            @RequestBody Map<String, String> body) {
        Role role = Role.valueOf(body.get("role"));
        return ResponseEntity.ok(ApiResponse.success(adminService.changeUserRole(userId, role)));
    }

    @DeleteMapping("/users/{userId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deactivateUser(@PathVariable UUID userId) {
        adminService.deactivateUser(userId);
        return ResponseEntity.ok(ApiResponse.success("User deactivated"));
    }

    // ── Organizations ─────────────────────────────────────────────────────────

    @GetMapping("/organizations")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<AdminOrgResponse>>> listOrganizations(
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(adminService.listOrganizations(q, page, size)));
    }

    @GetMapping("/organizations/{orgId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<AdminOrgResponse>> getOrganization(@PathVariable UUID orgId) {
        return ResponseEntity.ok(ApiResponse.success(adminService.getOrganization(orgId)));
    }

    @PostMapping("/organizations/{orgId}/suspend")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> suspendOrganization(@PathVariable UUID orgId) {
        adminService.suspendOrganization(orgId);
        return ResponseEntity.ok(ApiResponse.success("Organization suspended"));
    }

    @PostMapping("/organizations/{orgId}/restore")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> restoreOrganization(@PathVariable UUID orgId) {
        adminService.restoreOrganization(orgId);
        return ResponseEntity.ok(ApiResponse.success("Organization restored"));
    }

    // ── Subscriptions ─────────────────────────────────────────────────────────

    @GetMapping("/subscriptions")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<AdminSubscriptionResponse>>> listSubscriptions(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(adminService.listSubscriptions(status, page, size)));
    }

    // ── Error Logs ────────────────────────────────────────────────────────────

    @GetMapping("/errors")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<AdminErrorLogResponse>>> listErrors(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(ApiResponse.success(adminService.listErrors(page, size)));
    }

    // ── Support Tickets ───────────────────────────────────────────────────────

    @GetMapping("/support/tickets")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<SupportTicketResponse>>> listSupportTickets(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        var pageable = PageRequest.of(page, size, Sort.by("lastMessageAt").descending());
        return ResponseEntity.ok(ApiResponse.success(
                PageResponse.from(messagingService.adminListAllTickets(status, pageable))));
    }

    @GetMapping("/support/tickets/{ticketId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<SupportTicketResponse>> getSupportTicket(
            @PathVariable UUID ticketId) {
        return ResponseEntity.ok(ApiResponse.success(messagingService.adminGetTicket(ticketId)));
    }

    @PostMapping("/support/tickets/{ticketId}/reply")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<SupportTicketResponse>> adminReply(
            @PathVariable UUID ticketId,
            @Valid @RequestBody SupportReplyRequest req) {
        return ResponseEntity.ok(ApiResponse.success(messagingService.adminReplyToTicket(ticketId, req.getBody())));
    }

    @PutMapping("/support/tickets/{ticketId}/status")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<SupportTicketResponse>> updateTicketStatus(
            @PathVariable UUID ticketId,
            @RequestBody Map<String, String> body) {
        SupportTicketStatus status = SupportTicketStatus.valueOf(body.get("status").toUpperCase());
        return ResponseEntity.ok(ApiResponse.success(messagingService.adminUpdateTicketStatus(ticketId, status)));
    }
}
