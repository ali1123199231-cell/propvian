package com.smartlock.controller;

import com.smartlock.dto.response.common.ApiResponse;
import com.smartlock.service.SystemConfigService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/system")
@RequiredArgsConstructor
@Tag(name = "System Config")
public class SystemConfigController {

    private final SystemConfigService systemConfigService;

    /** Public: only non-sensitive UI/feature-flag keys. */
    @GetMapping("/public-config")
    public ResponseEntity<ApiResponse<Map<String, String>>> getPublicConfig() {
        return ResponseEntity.ok(ApiResponse.success(systemConfigService.getPublicConfig()));
    }

    /** Admin only: full config including secret keys. */
    @GetMapping("/config")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, String>>> getFullConfig() {
        return ResponseEntity.ok(ApiResponse.success(systemConfigService.getAllConfig()));
    }

    /** Admin only: update any config key including secrets. */
    @PutMapping("/config")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> updateConfig(@RequestBody Map<String, String> updates) {
        systemConfigService.setMultiple(updates);
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true).message("Config updated").build());
    }

    @GetMapping("/business-model")
    public ResponseEntity<ApiResponse<String>> getBusinessModel() {
        return ResponseEntity.ok(ApiResponse.<String>builder()
                .success(true)
                .data(systemConfigService.getBusinessModel().name().toLowerCase())
                .build());
    }
}
