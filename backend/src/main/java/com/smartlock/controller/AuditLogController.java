package com.smartlock.controller;

import com.smartlock.domain.AuditLog;
import com.smartlock.dto.response.common.ApiResponse;
import com.smartlock.dto.response.common.PageResponse;
import com.smartlock.service.AuditLogService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/organizations/{orgId}/audit-logs")
@RequiredArgsConstructor
@Tag(name = "Audit Logs")
@SecurityRequirement(name = "bearerAuth")
@Slf4j
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<AuditLog>>> list(
            @PathVariable UUID orgId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        log.debug("AuditLogController.list — orgId={}", orgId);
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.success(
                PageResponse.from(auditLogService.getByOrg(orgId, pageable))));
    }
}
