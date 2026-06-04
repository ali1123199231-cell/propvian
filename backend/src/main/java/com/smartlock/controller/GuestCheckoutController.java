package com.smartlock.controller;

import com.smartlock.dto.request.guest.GuestInitiateRequest;
import com.smartlock.dto.response.common.ApiResponse;
import com.smartlock.dto.response.guest.GuestInitiateResponse;
import com.smartlock.dto.response.guest.GuestPropertyResponse;
import com.smartlock.dto.response.guest.PromoValidationResponse;
import com.smartlock.dto.response.guest.PublicOrgSiteResponse;
import com.smartlock.repository.OrganizationRepository;
import com.smartlock.service.GuestCheckoutService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class GuestCheckoutController {

    private final GuestCheckoutService guestCheckoutService;
    private final OrganizationRepository organizationRepository;

    /** Called by Caddy on-demand TLS to validate a subdomain before issuing a cert */
    @GetMapping("/api/public/check-subdomain")
    public ResponseEntity<Void> checkSubdomain(@RequestParam String domain) {
        String slug = domain.replaceAll("\\.propvian\\.com$", "").toLowerCase();
        if (slug.isEmpty() || slug.contains(".")) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        return organizationRepository.existsBySlug(slug)
                ? ResponseEntity.ok().build()
                : ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }

    /** Org site data (branding + all active properties) — no auth required */
    @GetMapping("/api/public/sites/{orgSlug}")
    public ResponseEntity<ApiResponse<PublicOrgSiteResponse>> getOrgSite(@PathVariable String orgSlug) {
        return ResponseEntity.ok(ApiResponse.success(guestCheckoutService.getOrgSite(orgSlug)));
    }

    /** Validate a promo code for a given org — no auth required */
    @GetMapping("/api/public/promo/{orgSlug}/{code}")
    public ResponseEntity<ApiResponse<PromoValidationResponse>> validatePromo(
            @PathVariable String orgSlug,
            @PathVariable String code) {
        return ResponseEntity.ok(ApiResponse.success(guestCheckoutService.validatePromoCode(orgSlug, code)));
    }

    /** Property info + available payment methods — no auth required */
    @GetMapping("/api/public/book/{slug}")
    public ResponseEntity<ApiResponse<GuestPropertyResponse>> getProperty(@PathVariable String slug) {
        return ResponseEntity.ok(ApiResponse.success(guestCheckoutService.getPropertyInfo(slug)));
    }

    /** Create pending booking + Stripe PaymentIntent or PayPal order */
    @PostMapping("/api/public/book/{slug}/initiate")
    public ResponseEntity<ApiResponse<GuestInitiateResponse>> initiate(
            @PathVariable String slug,
            @Valid @RequestBody GuestInitiateRequest req) {
        return ResponseEntity.ok(ApiResponse.success(guestCheckoutService.initiateBooking(slug, req)));
    }

    /** Called from frontend after Stripe.confirmCardPayment() succeeds */
    @PostMapping("/api/public/book/confirm-stripe")
    public ResponseEntity<ApiResponse<Void>> confirmStripe(
            @RequestBody Map<String, String> body) {
        UUID bookingId = UUID.fromString(body.get("bookingId"));
        String paymentIntentId = body.get("paymentIntentId");
        guestCheckoutService.confirmStripeBooking(bookingId, paymentIntentId);
        return ResponseEntity.ok(ApiResponse.success("Booking confirmed"));
    }

    /** Called from frontend after PayPal.onApprove */
    @PostMapping("/api/public/book/capture-paypal")
    public ResponseEntity<ApiResponse<Void>> capturePaypal(
            @RequestBody Map<String, String> body) {
        UUID bookingId = UUID.fromString(body.get("bookingId"));
        String orderId = body.get("orderId");
        guestCheckoutService.captureAndConfirmPaypal(bookingId, orderId);
        return ResponseEntity.ok(ApiResponse.success("Booking confirmed"));
    }
}
