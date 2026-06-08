package com.smartlock.controller;

import com.smartlock.dto.response.common.ApiResponse;
import com.smartlock.security.CustomUserDetails;
import com.smartlock.service.FileUploadService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Files")
@Slf4j
public class FileUploadController {

    private final FileUploadService fileUploadService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<Map<String, String>>> upload(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal CustomUserDetails currentUser,
            jakarta.servlet.http.HttpServletRequest request) {
        log.info("FileUploadController.upload — filename={} size={} contentType={} requestContentType={}",
                file.getOriginalFilename(), file.getSize(), file.getContentType(),
                request.getContentType());
        // Always derive orgId from the JWT — never trust a client-supplied value
        String orgId = currentUser.getActiveOrgId() != null
                ? currentUser.getActiveOrgId().toString()
                : currentUser.getUserId().toString();
        log.info("FileUploadController.upload — orgId={} userId={}", orgId, currentUser.getUserId());
        String storedPath = fileUploadService.store(file, orgId);
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "path", storedPath,
                "url",  "/api/v1/files/view?token=" + fileUploadService.generateToken(storedPath)
        )));
    }

    @GetMapping("/files/view")
    public ResponseEntity<Resource> viewSigned(@RequestParam("token") String token,
                                               HttpServletRequest request) {
        log.debug("FileUploadController.viewSigned — token=***");
        Resource resource = fileUploadService.loadSigned(token);
        return buildResourceResponse(resource, request);
    }

    @GetMapping("/files/{orgId}/{filename:.+}")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<Resource> view(@PathVariable String orgId,
                                         @PathVariable String filename,
                                         @AuthenticationPrincipal CustomUserDetails currentUser,
                                         HttpServletRequest request) {
        log.debug("FileUploadController.view — orgId={}, filename={}", orgId, filename);
        // Restrict direct access to the caller's own org files
        String callerOrgId = currentUser.getActiveOrgId() != null
                ? currentUser.getActiveOrgId().toString() : "";
        if (!"ADMIN".equals(currentUser.getRole()) && !orgId.equals(callerOrgId)) {
            throw new com.smartlock.exception.AppException(
                    "Access denied", org.springframework.http.HttpStatus.FORBIDDEN, "ORG_ACCESS_DENIED");
        }
        Resource resource = fileUploadService.loadDirect(orgId, filename);
        return buildResourceResponse(resource, request);
    }

    private ResponseEntity<Resource> buildResourceResponse(Resource resource, HttpServletRequest request) {
        String contentType = "application/octet-stream";
        try {
            contentType = request.getServletContext().getMimeType(resource.getFile().getAbsolutePath());
        } catch (IOException ignored) {}
        if (contentType == null) contentType = "application/octet-stream";
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .body(resource);
    }

    private String extractToken(String url) {
        int idx = url.indexOf("?token=");
        return idx >= 0 ? url.substring(idx + 7) : url;
    }
}
