package com.smartlock.controller;

import com.smartlock.dto.request.guestpage.GenerateTapCodesRequest;
import com.smartlock.dto.response.common.ApiResponse;
import com.smartlock.dto.response.guestpage.TapCodeBatchResponse;
import com.smartlock.service.TapCodeService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Batches of pre-printed codes for physical stands and cards, and how far each
 * batch has got: issued → scanned → claimed by a host.
 */
@RestController
@RequestMapping("/api/v1/admin/tap-codes")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - Tap Codes")
@SecurityRequirement(name = "bearerAuth")
public class AdminTapCodeController {

    private final TapCodeService tapCodeService;

    @GetMapping("/batches")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<TapCodeBatchResponse>>> batches() {
        return ResponseEntity.ok(ApiResponse.success(tapCodeService.batchSummaries()));
    }

    @PostMapping("/batches")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<TapCodeBatchResponse>> generate(@Valid @RequestBody GenerateTapCodesRequest request) {
        log.info("AdminTapCodeController.generate — label={} count={} kitSize={}", request.getBatchLabel(), request.getCount(), request.getKitSize());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(tapCodeService.generateBatch(request.getCount(), request.getKitSize(), request.getBatchLabel())));
    }

    @GetMapping("/batches/{batchLabel}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<TapCodeBatchResponse>> batch(@PathVariable String batchLabel) {
        return ResponseEntity.ok(ApiResponse.success(tapCodeService.batch(batchLabel)));
    }
}
