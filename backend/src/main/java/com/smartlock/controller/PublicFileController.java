package com.smartlock.controller;

import com.smartlock.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicFileController {

    private final FileUploadService fileUploadService;

    @GetMapping("/files/{orgId}/{filename:.+}")
    public ResponseEntity<Resource> servePublicFile(
            @PathVariable String orgId,
            @PathVariable String filename,
            HttpServletRequest request) {

        Resource resource = fileUploadService.loadDirect(orgId, filename);

        String contentType = null;
        try {
            contentType = request.getServletContext().getMimeType(resource.getFile().getAbsolutePath());
        } catch (IOException ignored) {}
        if (contentType == null) contentType = "application/octet-stream";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000, immutable")
                .body(resource);
    }
}
