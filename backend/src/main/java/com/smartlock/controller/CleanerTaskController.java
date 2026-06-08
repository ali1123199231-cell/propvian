package com.smartlock.controller;

import com.smartlock.domain.CleanerTask;
import com.smartlock.domain.enums.CleanerTaskStatus;
import com.smartlock.dto.response.common.ApiResponse;
import com.smartlock.dto.response.common.PageResponse;
import com.smartlock.service.CleanerTaskService;
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
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Cleaner Tasks")
@SecurityRequirement(name = "bearerAuth")
@Slf4j
public class CleanerTaskController {

    private final CleanerTaskService cleanerTaskService;

    @GetMapping("/organizations/{orgId}/cleaner-tasks")
    public ResponseEntity<ApiResponse<PageResponse<CleanerTask>>> list(
            @PathVariable UUID orgId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.debug("CleanerTaskController.list — orgId={}", orgId);
        var pageable = PageRequest.of(page, size, Sort.by("scheduledAt").descending());
        return ResponseEntity.ok(ApiResponse.success(
                PageResponse.from(cleanerTaskService.listByOrg(orgId, pageable))));
    }

    @PatchMapping("/cleaner-tasks/{taskId}/status")
    public ResponseEntity<ApiResponse<CleanerTask>> updateStatus(
            @PathVariable UUID taskId,
            @RequestParam CleanerTaskStatus status) {
        log.info("CleanerTaskController.updateStatus — taskId={}, status={}", taskId, status);
        return ResponseEntity.ok(ApiResponse.success(cleanerTaskService.updateStatus(taskId, status)));
    }
}
