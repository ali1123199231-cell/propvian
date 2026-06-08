package com.smartlock.controller;

import com.smartlock.dto.request.lock.ConnectLockRequest;
import com.smartlock.dto.response.common.ApiResponse;
import com.smartlock.dto.response.lock.LockResponse;
import com.smartlock.security.CustomUserDetails;
import com.smartlock.service.LockService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Locks")
@SecurityRequirement(name = "bearerAuth")
public class LockController {

    private final LockService lockService;

    @PostMapping("/api/v1/properties/{propertyId}/locks")
    public ResponseEntity<ApiResponse<LockResponse>> connectLock(
            @PathVariable UUID propertyId,
            @Valid @RequestBody ConnectLockRequest request,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        log.info("LockController.connectLock — propertyId={} userId={}", propertyId, currentUser.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(lockService.connectLock(propertyId, request, currentUser.getUserId())));
    }

    @GetMapping("/api/v1/properties/{propertyId}/locks")
    public ResponseEntity<ApiResponse<List<LockResponse>>> getLocks(@PathVariable UUID propertyId) {
        log.debug("LockController.getLocks — propertyId={}", propertyId);
        return ResponseEntity.ok(ApiResponse.success(lockService.getLocksByProperty(propertyId)));
    }

    @GetMapping("/api/v1/locks/{lockId}")
    public ResponseEntity<ApiResponse<LockResponse>> getLock(@PathVariable UUID lockId) {
        log.debug("LockController.getLock — lockId={}", lockId);
        return ResponseEntity.ok(ApiResponse.success(lockService.getLock(lockId)));
    }

    @PostMapping("/api/v1/locks/{lockId}/sync")
    public ResponseEntity<ApiResponse<LockResponse>> syncLock(@PathVariable UUID lockId) {
        log.info("LockController.syncLock — lockId={}", lockId);
        return ResponseEntity.ok(ApiResponse.success(lockService.syncLock(lockId)));
    }

    @DeleteMapping("/api/v1/locks/{lockId}")
    public ResponseEntity<ApiResponse<Void>> disconnectLock(@PathVariable UUID lockId) {
        log.info("LockController.disconnectLock — lockId={}", lockId);
        lockService.disconnectLock(lockId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @DeleteMapping("/api/v1/locks/{lockId}/remove")
    public ResponseEntity<ApiResponse<Void>> deleteLock(@PathVariable UUID lockId) {
        log.info("LockController.deleteLock — lockId={}", lockId);
        lockService.deleteLock(lockId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
