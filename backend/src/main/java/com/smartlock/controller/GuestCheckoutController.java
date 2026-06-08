package com.smartlock.controller;

import com.smartlock.dto.request.guest.GuestInitiateRequest;
import com.smartlock.dto.response.common.ApiResponse;
import com.smartlock.dto.response.guest.GuestInitiateResponse;
import com.smartlock.dto.response.guest.GuestPropertyResponse;
import com.smartlock.dto.response.guest.PromoValidationResponse;
import com.smartlock.dto.response.guest.PublicOrgSiteResponse;
import com.smartlock.repository.OrganizationRepository;
import com.smartlock.service.FileUploadService;
import com.smartlock.service.GuestCheckoutService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@Slf4j
public class GuestCheckoutController {

    private final GuestCheckoutService guestCheckoutService;
    private final OrganizationRepository organizationRepository;
    private final FileUploadService fileUploadService;

    /** Called by Caddy on-demand TLS to validate a subdomain before issuing a cert */
    @GetMapping("/api/public/check-subdomain")
    public ResponseEntity<Void> checkSubdomain(@RequestParam String domain) {
        log.debug("GuestCheckoutController.checkSubdomain — domain={}", domain);
        String slug = domain.replaceAll("\\.propvian\\.com$", "").toLowerCase();
        if (slug.isEmpty() || slug.contains(".")) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        return organizationRepository.existsBySlug(slug)
                ? ResponseEntity.ok().build()
                : ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }

    /** Org site data (branding + all active properties) — no auth required */
    @GetMapping("/api/public/sites/{orgSlug}")
    public ResponseEntity<ApiResponse<PublicOrgSiteResponse>> getOrgSite(@PathVariable String orgSlug) {
        log.debug("GuestCheckoutController.getOrgSite — orgSlug={}", orgSlug);
        return ResponseEntity.ok(ApiResponse.success(guestCheckoutService.getOrgSite(orgSlug)));
    }

    /** Validate a promo code for a given org — no auth required */
    @GetMapping("/api/public/promo/{orgSlug}/{code}")
    public ResponseEntity<ApiResponse<PromoValidationResponse>> validatePromo(
            @PathVariable String orgSlug,
            @PathVariable String code,
            @RequestParam(required = false) Integer nights) {
        log.debug("GuestCheckoutController.validatePromo — orgSlug={}, code={}, nights={}", orgSlug, code, nights);
        return ResponseEntity.ok(ApiResponse.success(guestCheckoutService.validatePromoCode(orgSlug, code, nights)));
    }

    /** Property info + available payment methods — no auth required */
    @GetMapping("/api/public/book/{slug}")
    public ResponseEntity<ApiResponse<GuestPropertyResponse>> getProperty(@PathVariable String slug) {
        log.debug("GuestCheckoutController.getProperty — slug={}", slug);
        return ResponseEntity.ok(ApiResponse.success(guestCheckoutService.getPropertyInfo(slug)));
    }

    /** Create pending booking + Stripe PaymentIntent or PayPal order */
    @PostMapping("/api/public/book/{slug}/initiate")
    public ResponseEntity<ApiResponse<GuestInitiateResponse>> initiate(
            @PathVariable String slug,
            @Valid @RequestBody GuestInitiateRequest req) {
        log.info("GuestCheckoutController.initiate — slug={}", slug);
        return ResponseEntity.ok(ApiResponse.success(guestCheckoutService.initiateBooking(slug, req)));
    }

    /** Called from frontend after Stripe.confirmCardPayment() succeeds */
    @PostMapping("/api/public/book/confirm-stripe")
    public ResponseEntity<ApiResponse<Void>> confirmStripe(
            @RequestBody Map<String, String> body) {
        log.info("GuestCheckoutController.confirmStripe — bookingId={}", body.get("bookingId"));
        UUID bookingId = UUID.fromString(body.get("bookingId"));
        String paymentIntentId = body.get("paymentIntentId");
        guestCheckoutService.confirmStripeBooking(bookingId, paymentIntentId);
        return ResponseEntity.ok(ApiResponse.success("Booking confirmed"));
    }

    /** Called from frontend after PayPal.onApprove */
    @PostMapping("/api/public/book/capture-paypal")
    public ResponseEntity<ApiResponse<Void>> capturePaypal(
            @RequestBody Map<String, String> body) {
        log.info("GuestCheckoutController.capturePaypal — bookingId={}", body.get("bookingId"));
        UUID bookingId = UUID.fromString(body.get("bookingId"));
        String orderId = body.get("orderId");
        guestCheckoutService.captureAndConfirmPaypal(bookingId, orderId);
        return ResponseEntity.ok(ApiResponse.success("Booking confirmed"));
    }

    /**
     * Public static file serving — no auth required.
     * Used to serve property photos permanently without expiring signed URLs.
     * Path format: /api/public/files/{orgId}/{filename}
     */
    @GetMapping("/api/public/files/{orgId}/{filename:.+}")
    public ResponseEntity<Resource> publicFile(
            @PathVariable String orgId,
            @PathVariable String filename,
            HttpServletRequest request) {
        log.debug("GuestCheckoutController.publicFile — orgId={}, filename={}", orgId, filename);
        Resource resource = fileUploadService.loadDirect(orgId, filename);
        String contentType = "application/octet-stream";
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
