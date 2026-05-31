package com.smartlock.controller;

import com.smartlock.domain.PropertyBlockedDate;
import com.smartlock.domain.PropertyPricingRule;
import com.smartlock.dto.response.common.ApiResponse;
import com.smartlock.exception.AppException;
import com.smartlock.repository.PropertyBlockedDateRepository;
import com.smartlock.repository.PropertyPricingRuleRepository;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/properties/{propertyId}")
@RequiredArgsConstructor
@Tag(name = "Availability & Pricing")
@SecurityRequirement(name = "bearerAuth")
public class AvailabilityController {

    private final PropertyBlockedDateRepository blockedRepo;
    private final PropertyPricingRuleRepository pricingRepo;

    // ── Blocked dates ─────────────────────────────────────────────────────────

    @GetMapping("/blocked-dates")
    public ResponseEntity<ApiResponse<List<PropertyBlockedDate>>> listBlocked(@PathVariable UUID propertyId) {
        return ResponseEntity.ok(ApiResponse.success(blockedRepo.findByPropertyId(propertyId)));
    }

    @PostMapping("/blocked-dates")
    public ResponseEntity<ApiResponse<PropertyBlockedDate>> blockDates(
            @PathVariable UUID propertyId,
            @Valid @RequestBody BlockDatesRequest req) {
        if (req.getEndDate().isBefore(req.getStartDate())) {
            throw new AppException("End date must be after start date", HttpStatus.BAD_REQUEST);
        }
        PropertyBlockedDate block = PropertyBlockedDate.builder()
                .propertyId(propertyId)
                .startDate(req.getStartDate())
                .endDate(req.getEndDate())
                .reason(req.getReason())
                .build();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(blockedRepo.save(block)));
    }

    @DeleteMapping("/blocked-dates/{blockId}")
    public ResponseEntity<ApiResponse<Void>> unblock(
            @PathVariable UUID propertyId,
            @PathVariable UUID blockId) {
        PropertyBlockedDate block = blockedRepo.findById(blockId)
                .orElseThrow(() -> new AppException("Not found", HttpStatus.NOT_FOUND));
        if (!block.getPropertyId().equals(propertyId))
            throw new AppException("Access denied", HttpStatus.FORBIDDEN);
        blockedRepo.delete(block);
        return ResponseEntity.ok(ApiResponse.success("Unblocked"));
    }

    // ── Pricing rules ─────────────────────────────────────────────────────────

    @GetMapping("/pricing-rules")
    public ResponseEntity<ApiResponse<List<PropertyPricingRule>>> listPricing(@PathVariable UUID propertyId) {
        return ResponseEntity.ok(ApiResponse.success(
                pricingRepo.findByPropertyIdOrderByStartDateAsc(propertyId)));
    }

    @PostMapping("/pricing-rules")
    public ResponseEntity<ApiResponse<PropertyPricingRule>> createPricing(
            @PathVariable UUID propertyId,
            @Valid @RequestBody PricingRuleRequest req) {
        PropertyPricingRule rule = PropertyPricingRule.builder()
                .propertyId(propertyId)
                .name(req.getName())
                .ruleType("DATE_RANGE")
                .startDate(req.getStartDate())
                .endDate(req.getEndDate())
                .nightlyRate(req.getNightlyRate())
                .minStayNights(req.getMinStayNights() != null ? req.getMinStayNights() : 1)
                .build();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(pricingRepo.save(rule)));
    }

    @DeleteMapping("/pricing-rules/{ruleId}")
    public ResponseEntity<ApiResponse<Void>> deletePricing(
            @PathVariable UUID propertyId,
            @PathVariable UUID ruleId) {
        PropertyPricingRule rule = pricingRepo.findById(ruleId)
                .orElseThrow(() -> new AppException("Not found", HttpStatus.NOT_FOUND));
        if (!rule.getPropertyId().equals(propertyId))
            throw new AppException("Access denied", HttpStatus.FORBIDDEN);
        pricingRepo.delete(rule);
        return ResponseEntity.ok(ApiResponse.success("Deleted"));
    }

    // ── Availability check (guest-facing) ────────────────────────────────────

    @GetMapping("/availability")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkAvailability(
            @PathVariable UUID propertyId,
            @RequestParam LocalDate checkIn,
            @RequestParam LocalDate checkOut) {
        List<PropertyBlockedDate> conflicts = blockedRepo.findOverlapping(propertyId, checkIn, checkOut);
        List<PropertyPricingRule> rules     = pricingRepo.findByPropertyIdOrderByStartDateAsc(propertyId);
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "available",     conflicts.isEmpty(),
                "blockedRanges", conflicts,
                "pricingRules",  rules
        )));
    }

    // ── Request DTOs ──────────────────────────────────────────────────────────

    @Data
    public static class BlockDatesRequest {
        @NotNull LocalDate startDate;
        @NotNull LocalDate endDate;
        String reason;
    }

    @Data
    public static class PricingRuleRequest {
        String name;
        @NotNull LocalDate startDate;
        @NotNull LocalDate endDate;
        @NotNull @DecimalMin("0.00") BigDecimal nightlyRate;
        Integer minStayNights;
    }
}
