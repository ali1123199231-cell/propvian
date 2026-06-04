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
        if (file.isEmpty()) throw new AppException("File is empty", HttpStatus.BAD_REQUEST);
        if (file.getSize() > MAX_FILE_SIZE)
            throw new AppException("File exceeds 20 MB limit", HttpStatus.BAD_REQUEST);

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType.toLowerCase()))
            throw new AppException("Only PDF, JPG, JPEG and PNG files are allowed", HttpStatus.BAD_REQUEST);

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
