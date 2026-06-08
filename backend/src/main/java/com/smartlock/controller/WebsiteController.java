package com.smartlock.controller;

import com.smartlock.dto.request.website.PromoCodeRequest;
import com.smartlock.dto.request.website.ReorderSectionsRequest;
import com.smartlock.dto.request.website.WebsiteConfigRequest;
import com.smartlock.dto.request.website.WebsiteSectionRequest;
import com.smartlock.dto.response.common.ApiResponse;
import com.smartlock.dto.response.website.PromoCodeResponse;
import com.smartlock.dto.response.website.WebsiteConfigResponse;
import com.smartlock.dto.response.website.WebsiteSectionResponse;
import com.smartlock.service.WebsiteService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/organizations/{orgId}/website")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Website Builder")
@SecurityRequirement(name = "bearerAuth")
public class WebsiteController {

    private final WebsiteService websiteService;

    // ── Config ────────────────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<ApiResponse<WebsiteConfigResponse>> getConfig(
            @PathVariable UUID orgId) {
        log.debug("WebsiteController.getConfig — orgId={}", orgId);
        return ResponseEntity.ok(ApiResponse.success(websiteService.getConfig(orgId)));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<WebsiteConfigResponse>> updateConfig(
            @PathVariable UUID orgId,
            @RequestBody WebsiteConfigRequest req) {
        log.info("WebsiteController.updateConfig — orgId={}", orgId);
        return ResponseEntity.ok(ApiResponse.success(websiteService.updateConfig(orgId, req)));
    }

    @PostMapping("/publish")
    public ResponseEntity<ApiResponse<WebsiteConfigResponse>> publish(
            @PathVariable UUID orgId) {
        log.info("WebsiteController.publish — orgId={}", orgId);
        return ResponseEntity.ok(ApiResponse.success(websiteService.publishWebsite(orgId)));
    }

    @PostMapping("/unpublish")
    public ResponseEntity<ApiResponse<WebsiteConfigResponse>> unpublish(
            @PathVariable UUID orgId) {
        log.info("WebsiteController.unpublish — orgId={}", orgId);
        return ResponseEntity.ok(ApiResponse.success(websiteService.unpublishWebsite(orgId)));
    }

    // ── Sections ──────────────────────────────────────────────────────────────

    @GetMapping("/sections")
    public ResponseEntity<ApiResponse<List<WebsiteSectionResponse>>> getSections(
            @PathVariable UUID orgId) {
        log.debug("WebsiteController.getSections — orgId={}", orgId);
        return ResponseEntity.ok(ApiResponse.success(websiteService.getSections(orgId)));
    }

    @PostMapping("/sections")
    public ResponseEntity<ApiResponse<WebsiteSectionResponse>> addSection(
            @PathVariable UUID orgId,
            @Valid @RequestBody WebsiteSectionRequest req) {
        log.info("WebsiteController.addSection — orgId={}", orgId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(websiteService.addSection(orgId, req)));
    }

    @PutMapping("/sections/{sectionId}")
    public ResponseEntity<ApiResponse<WebsiteSectionResponse>> updateSection(
            @PathVariable UUID orgId,
            @PathVariable UUID sectionId,
            @RequestBody WebsiteSectionRequest req) {
        log.info("WebsiteController.updateSection — orgId={}, sectionId={}", orgId, sectionId);
        return ResponseEntity.ok(ApiResponse.success(websiteService.updateSection(orgId, sectionId, req)));
    }

    @DeleteMapping("/sections/{sectionId}")
    public ResponseEntity<ApiResponse<Void>> deleteSection(
            @PathVariable UUID orgId,
            @PathVariable UUID sectionId) {
        log.info("WebsiteController.deleteSection — orgId={}, sectionId={}", orgId, sectionId);
        websiteService.deleteSection(orgId, sectionId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/sections/reorder")
    public ResponseEntity<ApiResponse<List<WebsiteSectionResponse>>> reorder(
            @PathVariable UUID orgId,
            @Valid @RequestBody ReorderSectionsRequest req) {
        log.info("WebsiteController.reorder — orgId={}", orgId);
        return ResponseEntity.ok(ApiResponse.success(websiteService.reorderSections(orgId, req)));
    }

    // ── Promo codes ───────────────────────────────────────────────────────────

    @GetMapping("/promo-codes")
    public ResponseEntity<ApiResponse<List<PromoCodeResponse>>> getPromoCodes(
            @PathVariable UUID orgId) {
        log.debug("WebsiteController.getPromoCodes — orgId={}", orgId);
        return ResponseEntity.ok(ApiResponse.success(websiteService.getPromoCodes(orgId)));
    }

    @PostMapping("/promo-codes")
    public ResponseEntity<ApiResponse<PromoCodeResponse>> createPromoCode(
            @PathVariable UUID orgId,
            @Valid @RequestBody PromoCodeRequest req) {
        log.info("WebsiteController.createPromoCode — orgId={}", orgId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(websiteService.createPromoCode(orgId, req)));
    }

    @DeleteMapping("/promo-codes/{codeId}")
    public ResponseEntity<ApiResponse<Void>> deletePromoCode(
            @PathVariable UUID orgId,
            @PathVariable UUID codeId) {
        log.info("WebsiteController.deletePromoCode — orgId={}, codeId={}", orgId, codeId);
        websiteService.deletePromoCode(orgId, codeId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ── AI content ────────────────────────────────────────────────────────────

    @PostMapping("/ai/generate")
    public ResponseEntity<ApiResponse<Map<String, String>>> generateAiContent(
            @PathVariable UUID orgId,
            @RequestParam String type,
            @RequestParam(required = false, defaultValue = "") String context) {
        log.info("WebsiteController.generateAiContent — orgId={}, type={}", orgId, type);
        return ResponseEntity.ok(ApiResponse.success(websiteService.generateAiContent(orgId, type, context)));
    }

    // ── Templates ─────────────────────────────────────────────────────────────

    @PostMapping("/apply-template/{templateId}")
    public ResponseEntity<ApiResponse<WebsiteConfigResponse>> applyTemplate(
            @PathVariable UUID orgId,
            @PathVariable String templateId) {
        log.info("WebsiteController.applyTemplate — orgId={}, templateId={}", orgId, templateId);
        return ResponseEntity.ok(ApiResponse.success(websiteService.applyTemplate(orgId, templateId)));
    }
}
