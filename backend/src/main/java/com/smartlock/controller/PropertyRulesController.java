package com.smartlock.controller;

import com.smartlock.domain.PropertyAmenity;
import com.smartlock.domain.PropertyHouseRule;
import com.smartlock.domain.PropertySeasonalRule;
import com.smartlock.dto.response.common.ApiResponse;
import com.smartlock.exception.AppException;
import com.smartlock.repository.PropertyAmenityRepository;
import com.smartlock.repository.PropertyHouseRuleRepository;
import com.smartlock.repository.PropertySeasonalRuleRepository;
import com.smartlock.service.OrganizationSecurityService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/properties/{propertyId}")
@RequiredArgsConstructor
@Tag(name = "Property Rules")
@SecurityRequirement(name = "bearerAuth")
public class PropertyRulesController {

    private final PropertyHouseRuleRepository houseRuleRepo;
    private final PropertySeasonalRuleRepository seasonalRuleRepo;
    private final PropertyAmenityRepository amenityRepo;
    private final OrganizationSecurityService orgSecurity;

    // ── House rules ───────────────────────────────────────────────────────────

    @GetMapping("/house-rules")
    public ResponseEntity<ApiResponse<List<PropertyHouseRule>>> listHouseRules(
            @PathVariable UUID propertyId) {
        orgSecurity.requirePropertyAccess(propertyId);
        return ResponseEntity.ok(ApiResponse.success(houseRuleRepo.findByPropertyId(propertyId)));
    }

    @PutMapping("/house-rules")
    public ResponseEntity<ApiResponse<PropertyHouseRule>> upsertHouseRule(
            @PathVariable UUID propertyId,
            @Valid @RequestBody HouseRuleRequest req) {
        orgSecurity.requirePropertyAccess(propertyId);

        PropertyHouseRule rule = houseRuleRepo
                .findByPropertyIdAndRuleKey(propertyId, req.getRuleKey().toUpperCase())
                .orElse(PropertyHouseRule.builder()
                        .propertyId(propertyId)
                        .ruleKey(req.getRuleKey().toUpperCase())
                        .build());

        rule.setAllowed(req.isAllowed());
        rule.setNotes(req.getNotes());
        return ResponseEntity.ok(ApiResponse.success(houseRuleRepo.save(rule)));
    }

    @DeleteMapping("/house-rules/{ruleId}")
    public ResponseEntity<ApiResponse<Void>> deleteHouseRule(
            @PathVariable UUID propertyId,
            @PathVariable UUID ruleId) {
        orgSecurity.requirePropertyAccess(propertyId);
        PropertyHouseRule rule = houseRuleRepo.findById(ruleId)
                .orElseThrow(() -> new AppException("House rule not found", HttpStatus.NOT_FOUND));
        if (!rule.getPropertyId().equals(propertyId))
            throw new AppException("Access denied", HttpStatus.FORBIDDEN);
        houseRuleRepo.delete(rule);
        return ResponseEntity.ok(ApiResponse.success("Deleted"));
    }

    // ── Seasonal rules ────────────────────────────────────────────────────────

    @GetMapping("/seasonal-rules")
    public ResponseEntity<ApiResponse<List<PropertySeasonalRule>>> listSeasonalRules(
            @PathVariable UUID propertyId) {
        orgSecurity.requirePropertyAccess(propertyId);
        return ResponseEntity.ok(ApiResponse.success(
                seasonalRuleRepo.findByPropertyIdOrderByStartDateAsc(propertyId)));
    }

    @PostMapping("/seasonal-rules")
    public ResponseEntity<ApiResponse<PropertySeasonalRule>> createSeasonalRule(
            @PathVariable UUID propertyId,
            @Valid @RequestBody SeasonalRuleRequest req) {
        orgSecurity.requirePropertyAccess(propertyId);
        if (req.getEndDate().isBefore(req.getStartDate()))
            throw new AppException("End date must be after start date", HttpStatus.BAD_REQUEST);

        PropertySeasonalRule rule = PropertySeasonalRule.builder()
                .propertyId(propertyId)
                .name(req.getName())
                .startDate(req.getStartDate())
                .endDate(req.getEndDate())
                .minStayDays(req.getMinStayDays())
                .maxStayDays(req.getMaxStayDays())
                .bufferDaysBefore(req.getBufferDaysBefore())
                .bufferDaysAfter(req.getBufferDaysAfter())
                .build();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(seasonalRuleRepo.save(rule)));
    }

    @DeleteMapping("/seasonal-rules/{ruleId}")
    public ResponseEntity<ApiResponse<Void>> deleteSeasonalRule(
            @PathVariable UUID propertyId,
            @PathVariable UUID ruleId) {
        orgSecurity.requirePropertyAccess(propertyId);
        PropertySeasonalRule rule = seasonalRuleRepo.findById(ruleId)
                .orElseThrow(() -> new AppException("Seasonal rule not found", HttpStatus.NOT_FOUND));
        if (!rule.getPropertyId().equals(propertyId))
            throw new AppException("Access denied", HttpStatus.FORBIDDEN);
        seasonalRuleRepo.delete(rule);
        return ResponseEntity.ok(ApiResponse.success("Deleted"));
    }

    // ── Public: house rules for website builder ───────────────────────────────

    @GetMapping("/house-rules/public")
    @SecurityRequirement(name = "bearerAuth")  // overridden by security config /api/public/**
    public ResponseEntity<ApiResponse<List<PropertyHouseRule>>> publicHouseRules(
            @PathVariable UUID propertyId) {
        return ResponseEntity.ok(ApiResponse.success(houseRuleRepo.findByPropertyId(propertyId)));
    }

    // ── Amenities ─────────────────────────────────────────────────────────────

    @GetMapping("/amenities")
    public ResponseEntity<ApiResponse<List<PropertyAmenity>>> listAmenities(
            @PathVariable UUID propertyId) {
        orgSecurity.requirePropertyAccess(propertyId);
        return ResponseEntity.ok(ApiResponse.success(amenityRepo.findByPropertyId(propertyId)));
    }

    @PutMapping("/amenities")
    @Transactional
    public ResponseEntity<ApiResponse<List<PropertyAmenity>>> replaceAmenities(
            @PathVariable UUID propertyId,
            @RequestBody List<AmenityRequest> reqs) {
        orgSecurity.requirePropertyAccess(propertyId);
        amenityRepo.deleteByPropertyId(propertyId);
        List<PropertyAmenity> saved = amenityRepo.saveAll(
                reqs.stream().map(r -> PropertyAmenity.builder()
                        .propertyId(propertyId)
                        .category(r.getCategory() != null ? r.getCategory() : "general")
                        .name(r.getName())
                        .icon(r.getIcon())
                        .build()).toList());
        return ResponseEntity.ok(ApiResponse.success(saved));
    }

    @DeleteMapping("/amenities/{amenityId}")
    public ResponseEntity<ApiResponse<Void>> deleteAmenity(
            @PathVariable UUID propertyId,
            @PathVariable UUID amenityId) {
        orgSecurity.requirePropertyAccess(propertyId);
        PropertyAmenity a = amenityRepo.findById(amenityId)
                .orElseThrow(() -> new AppException("Amenity not found", HttpStatus.NOT_FOUND));
        if (!a.getPropertyId().equals(propertyId))
            throw new AppException("Access denied", HttpStatus.FORBIDDEN);
        amenityRepo.delete(a);
        return ResponseEntity.ok(ApiResponse.success("Deleted"));
    }

    // ── DTOs ──────────────────────────────────────────────────────────────────

    @Data
    public static class AmenityRequest {
        @NotBlank String name;
        String category;
        String icon;
    }

    @Data
    public static class HouseRuleRequest {
        @NotBlank String ruleKey;   // PETS | SMOKING | PARTIES | QUIET_HOURS | CHILDREN
        boolean allowed;
        String notes;
    }

    @Data
    public static class SeasonalRuleRequest {
        String name;
        @NotNull LocalDate startDate;
        @NotNull LocalDate endDate;
        Integer minStayDays;
        Integer maxStayDays;
        Integer bufferDaysBefore;
        Integer bufferDaysAfter;
    }
}
