package com.smartlock.controller;

import com.smartlock.domain.PropertyPhoto;
import com.smartlock.dto.request.property.CreatePropertyRequest;
import com.smartlock.dto.response.common.ApiResponse;
import com.smartlock.dto.response.common.PageResponse;
import com.smartlock.dto.response.property.PropertyResponse;
import com.smartlock.repository.PropertyPhotoRepository;
import com.smartlock.security.CustomUserDetails;
import com.smartlock.service.PropertyService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@Tag(name = "Properties")
public class PropertyController {

    private final PropertyService propertyService;
    private final PropertyPhotoRepository photoRepository;

    // ── Public: website builder ───────────────────────────────────────────────

    @GetMapping("/api/public/properties/by-slug/{slug}")
    public ResponseEntity<ApiResponse<PropertyResponse>> getBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(ApiResponse.success(propertyService.getPropertyBySlug(slug)));
    }

    // ── Authenticated: property CRUD ─────────────────────────────────────────

    @PostMapping("/api/v1/organizations/{orgId}/properties")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<PropertyResponse>> create(
            @PathVariable UUID orgId,
            @Valid @RequestBody CreatePropertyRequest request,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(propertyService.createProperty(orgId, request, currentUser.getUserId())));
    }

    @GetMapping("/api/v1/organizations/{orgId}/properties")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<PageResponse<PropertyResponse>>> list(
            @PathVariable UUID orgId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.success(
                PageResponse.from(propertyService.getPropertiesByOrg(orgId, pageable))));
    }

    @GetMapping("/api/v1/organizations/{orgId}/properties/{propertyId}")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<PropertyResponse>> get(
            @PathVariable UUID orgId,
            @PathVariable UUID propertyId) {
        return ResponseEntity.ok(ApiResponse.success(propertyService.getProperty(propertyId, orgId)));
    }

    @PutMapping("/api/v1/organizations/{orgId}/properties/{propertyId}")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<PropertyResponse>> update(
            @PathVariable UUID orgId,
            @PathVariable UUID propertyId,
            @Valid @RequestBody CreatePropertyRequest request) {
        return ResponseEntity.ok(ApiResponse.success(propertyService.updateProperty(propertyId, orgId, request)));
    }

    @DeleteMapping("/api/v1/organizations/{orgId}/properties/{propertyId}")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID orgId,
            @PathVariable UUID propertyId) {
        propertyService.deleteProperty(propertyId, orgId);
        return ResponseEntity.ok(ApiResponse.success("Property deleted"));
    }

    // ── Photos ────────────────────────────────────────────────────────────────

    @GetMapping("/api/v1/organizations/{orgId}/properties/{propertyId}/photos")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<List<PhotoResponse>>> listPhotos(
            @PathVariable UUID orgId,
            @PathVariable UUID propertyId) {
        List<PhotoResponse> photos = photoRepository
                .findByPropertyIdOrderBySortOrderAsc(propertyId).stream()
                .map(PhotoResponse::from).toList();
        return ResponseEntity.ok(ApiResponse.success(photos));
    }

    @PostMapping("/api/v1/organizations/{orgId}/properties/{propertyId}/photos")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<PhotoResponse>> addPhoto(
            @PathVariable UUID orgId,
            @PathVariable UUID propertyId,
            @Valid @RequestBody AddPhotoRequest request) {
        PropertyPhoto photo = PropertyPhoto.builder()
                .propertyId(propertyId)
                .url(request.getUrl())
                .caption(request.getCaption())
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .primary(Boolean.TRUE.equals(request.getPrimary()))
                .build();
        photo = photoRepository.save(photo);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(PhotoResponse.from(photo)));
    }

    @DeleteMapping("/api/v1/organizations/{orgId}/properties/{propertyId}/photos/{photoId}")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<Void>> deletePhoto(
            @PathVariable UUID orgId,
            @PathVariable UUID propertyId,
            @PathVariable UUID photoId) {
        photoRepository.deleteById(photoId);
        return ResponseEntity.ok(ApiResponse.success("Photo deleted"));
    }

    @PutMapping("/api/v1/organizations/{orgId}/properties/{propertyId}/photos/reorder")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<Void>> reorderPhotos(
            @PathVariable UUID orgId,
            @PathVariable UUID propertyId,
            @RequestBody ReorderPhotosRequest request) {
        List<UUID> ids = request.getPhotoIds();
        for (int i = 0; i < ids.size(); i++) {
            final int order = i;
            final boolean isPrimary = (i == 0);
            photoRepository.findById(ids.get(i)).ifPresent(photo -> {
                photo.setSortOrder(order);
                photo.setPrimary(isPrimary);
                photoRepository.save(photo);
            });
        }
        return ResponseEntity.ok(ApiResponse.success("Photos reordered"));
    }

    // ── DTOs ──────────────────────────────────────────────────────────────────

    public record PhotoResponse(UUID id, UUID propertyId, String url, String caption,
                                int sortOrder, boolean primary, Instant createdAt) {
        static PhotoResponse from(PropertyPhoto p) {
            return new PhotoResponse(p.getId(), p.getPropertyId(), p.getUrl(),
                    p.getCaption(), p.getSortOrder(), p.isPrimary(), p.getCreatedAt());
        }
    }

    @Data
    public static class AddPhotoRequest {
        @NotBlank
        @Size(max = 500)
        private String url;
        @Size(max = 300)
        private String caption;
        private Integer sortOrder;
        private Boolean primary;
    }

    @Data
    public static class ReorderPhotosRequest {
        private List<UUID> photoIds;
    }
}
