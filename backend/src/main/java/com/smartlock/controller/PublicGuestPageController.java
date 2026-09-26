package com.smartlock.controller;

import com.smartlock.dto.request.guestpage.GuestPageEventRequest;
import com.smartlock.dto.response.common.ApiResponse;
import com.smartlock.dto.response.guestpage.PublicGuestPageResponse;
import com.smartlock.service.GuestPageService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * What a guest's phone opens after tapping an NFC tag or scanning a QR code.
 * The response carries the WiFi password, so it is neither cached nor indexed.
 */
@RestController
@RequestMapping("/api/public/guest-pages")
@RequiredArgsConstructor
@Tag(name = "Public Guest Pages")
@Slf4j
public class PublicGuestPageController {

    private final GuestPageService guestPageService;

    /** {@code s} is how the page was opened: n = NFC, q = QR, p = host preview (not counted). */
    @GetMapping("/{code}")
    public ResponseEntity<ApiResponse<PublicGuestPageResponse>> get(
            @PathVariable String code,
            @RequestParam(name = "s", required = false) String s,
            HttpServletRequest request) {
        boolean preview = "p".equalsIgnoreCase(s) || "preview".equalsIgnoreCase(s);
        PublicGuestPageResponse page = guestPageService.resolvePublic(code, s, !preview, clientIp(request));
        log.debug("PublicGuestPageController.get — status={} source={}", page.getStatus(), s);
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .header("X-Robots-Tag", "noindex, nofollow")
                .body(ApiResponse.success(page));
    }

    @PostMapping("/{code}/events")
    public ResponseEntity<Void> event(
            @PathVariable String code,
            @Valid @RequestBody GuestPageEventRequest body,
            HttpServletRequest request) {
        guestPageService.recordPublicEvent(code, body.getType(), clientIp(request));
        return ResponseEntity.noContent().build();
    }

    private static String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) return forwarded.split(",")[0].trim();
        return request.getRemoteAddr();
    }
}
