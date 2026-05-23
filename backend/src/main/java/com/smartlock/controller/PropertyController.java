package com.smartlock.controller;

import com.smartlock.dto.request.property.CreatePropertyRequest;
import com.smartlock.dto.response.common.ApiResponse;
import com.smartlock.dto.response.common.PageResponse;
import com.smartlock.dto.response.property.PropertyResponse;
import com.smartlock.security.CustomUserDetails;
import com.smartlock.service.PropertyService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/organizations/{orgId}/properties")
@RequiredArgsConstructor
@Tag(name = "Properties")
@SecurityRequirement(name = "bearerAuth")
public class PropertyController {

    private final PropertyService propertyService;

    @PostMapping
    public ResponseEntity<ApiResponse<PropertyResponse>> create(
            @PathVariable UUID orgId,
            @Valid @RequestBody CreatePropertyRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(propertyService.createProperty(orgId, request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<PropertyResponse>>> list(
            @PathVariable UUID orgId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.success(
                PageResponse.from(propertyService.getPropertiesByOrg(orgId, pageable))));
    }

    @GetMapping("/{propertyId}")
    public ResponseEntity<ApiResponse<PropertyResponse>> get(
            @PathVariable UUID orgId,
            @PathVariable UUID propertyId) {
        return ResponseEntity.ok(ApiResponse.success(propertyService.getProperty(propertyId, orgId)));
    }

    @PutMapping("/{propertyId}")
    public ResponseEntity<ApiResponse<PropertyResponse>> update(
            @PathVariable UUID orgId,
            @PathVariable UUID propertyId,
            @Valid @RequestBody CreatePropertyRequest request) {
        return ResponseEntity.ok(ApiResponse.success(propertyService.updateProperty(propertyId, orgId, request)));
    }

    @DeleteMapping("/{propertyId}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID orgId,
            @PathVariable UUID propertyId) {
        propertyService.deleteProperty(propertyId, orgId);
        return ResponseEntity.ok(ApiResponse.success("Property deleted"));
    }
}
