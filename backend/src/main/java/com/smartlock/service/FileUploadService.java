package com.smartlock.service;

import com.smartlock.exception.AppException;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
public class FileUploadService {

    private static final long MAX_FILE_SIZE   = 20 * 1024 * 1024; // 20 MB
    private static final long SIGNED_URL_TTL  = 60 * 60 * 1000L;   // 1 hour
    private static final List<String> ALLOWED_TYPES = List.of(
            "application/pdf", "image/jpeg", "image/jpg", "image/png"
    );

    @Value("${app.upload-dir:/tmp/propvian-uploads}")
    private String uploadDir;

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    private SecretKey signingKey;

    @PostConstruct
    void init() {
        signingKey = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        try {
            Files.createDirectories(Paths.get(uploadDir));
            log.info("Upload directory: {}", uploadDir);
        } catch (IOException e) {
            log.error("Cannot create upload directory: {}", uploadDir, e);
        }
    }

    public String store(MultipartFile file, String orgId) {
        log.info("FileUploadService.store — name={} size={} contentType={} empty={}",
                file.getOriginalFilename(), file.getSize(), file.getContentType(), file.isEmpty());
        if (file.isEmpty()) throw new AppException("File is empty", HttpStatus.BAD_REQUEST);
        if (file.getSize() > MAX_FILE_SIZE)
            throw new AppException("File exceeds 20 MB limit", HttpStatus.BAD_REQUEST);

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType.toLowerCase())) {
            log.warn("FileUploadService.store — rejected contentType={} allowed={}", contentType, ALLOWED_TYPES);
            throw new AppException("Only PDF, JPG, JPEG and PNG files are allowed", HttpStatus.BAD_REQUEST);
        }

        String original  = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "file");
        String ext       = original.contains(".") ? original.substring(original.lastIndexOf('.')) : "";
        String filename  = UUID.randomUUID() + ext;

        try {
            Path orgDir = Paths.get(uploadDir, orgId);
            Files.createDirectories(orgDir);
            Files.copy(file.getInputStream(), orgDir.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
            log.info("Stored file {} for org {}", filename, orgId);
            return orgId + "/" + filename;
        } catch (IOException e) {
            throw new AppException("Failed to store file", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public String generateToken(String filePath) {
        return Jwts.builder()
                .subject(filePath)
                .expiration(new Date(System.currentTimeMillis() + SIGNED_URL_TTL))
                .signWith(signingKey)
                .compact();
    }

    public String generateSignedUrl(String filePath, String baseUrl) {
        return baseUrl + "/api/v1/files/view?token=" + generateToken(filePath);
    }

    public Resource loadSigned(String token) {
        try {
            Claims claims = Jwts.parser().verifyWith(signingKey).build()
                    .parseSignedClaims(token).getPayload();
            String filePath = claims.getSubject();
            Path uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
            Path path = uploadRoot.resolve(filePath).normalize();
            // Prevent path traversal outside upload directory
            if (!path.startsWith(uploadRoot)) {
                throw new AppException("Access denied", HttpStatus.FORBIDDEN);
            }
            Resource resource = new UrlResource(path.toUri());
            if (!resource.exists()) throw new AppException("File not found", HttpStatus.NOT_FOUND);
            return resource;
        } catch (AppException e) {
            throw e;
        } catch (JwtException e) {
            throw new AppException("Invalid or expired file link", HttpStatus.FORBIDDEN);
        } catch (MalformedURLException e) {
            throw new AppException("File not found", HttpStatus.NOT_FOUND);
        }
    }

    public void deleteFile(String urlOrPath) {
        try {
            String filePath = extractFilePath(urlOrPath);
            if (filePath == null) {
                log.warn("[DELETE-FILE] Could not extract file path from: {}", urlOrPath);
                return;
            }
            Path uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
            Path target = uploadRoot.resolve(filePath).normalize();
            if (!target.startsWith(uploadRoot)) {
                log.warn("[DELETE-FILE] Path traversal attempt blocked: {}", filePath);
                return;
            }
            boolean existed = Files.deleteIfExists(target);
            if (existed) {
                log.info("[DELETE-FILE] Successfully deleted file from disk: {}", filePath);
            } else {
                log.warn("[DELETE-FILE] File not found on disk (already deleted?): {}", filePath);
            }
        } catch (Exception e) {
            log.warn("[DELETE-FILE] Could not delete file {}: {}", urlOrPath, e.getMessage());
        }
    }

    // Extract relative path from either a raw path or a signed-URL token (ignoring JWT expiry)
    private String extractFilePath(String urlOrPath) {
        if (urlOrPath == null || urlOrPath.isBlank()) return null;
        if (!urlOrPath.contains("?token=")) return urlOrPath;
        try {
            String token = urlOrPath.substring(urlOrPath.indexOf("?token=") + 7);
            String[] parts = token.split("\\.");
            if (parts.length < 2) return null;
            // Base64-decode the payload without verifying signature or expiry
            byte[] payloadBytes = java.util.Base64.getUrlDecoder().decode(parts[1]);
            String payload = new String(payloadBytes, java.nio.charset.StandardCharsets.UTF_8);
            int subIdx = payload.indexOf("\"sub\":\"");
            if (subIdx < 0) return null;
            int start = subIdx + 7;
            int end = payload.indexOf("\"", start);
            return end > start ? payload.substring(start, end) : null;
        } catch (Exception e) {
            log.warn("Could not extract file path from URL: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Converts any stored photo URL/path to a permanent public URL.
     * Handles three formats that may exist in the database:
     *   1. "orgId/filename.jpg"          — raw relative path (new format)
     *   2. "/api/v1/files/view?token=..."— expiring signed URL (old format)
     *   3. "/api/public/files/..."       — already a public URL (idempotent)
     */
    public String toPublicUrl(String storedValue) {
        if (storedValue == null || storedValue.isBlank()) return storedValue;
        if (storedValue.startsWith("/api/public/files/")) return storedValue;
        // Signed URL — extract path from JWT payload without verifying expiry
        if (storedValue.contains("?token=")) {
            String path = extractFilePath(storedValue);
            if (path != null) return "/api/public/files/" + path;
            return storedValue; // fallback — leave as-is if extraction fails
        }
        // Raw relative path: "orgId/filename.ext"
        if (!storedValue.startsWith("/") && storedValue.contains("/")) {
            return "/api/public/files/" + storedValue;
        }
        return storedValue;
    }

    public Resource loadDirect(String orgId, String filename) {
        try {
            Path path = Paths.get(uploadDir, orgId, filename).normalize();
            Resource resource = new UrlResource(path.toUri());
            if (!resource.exists()) throw new AppException("File not found", HttpStatus.NOT_FOUND);
            return resource;
        } catch (MalformedURLException e) {
            throw new AppException("File not found", HttpStatus.NOT_FOUND);
        }
    }
}
