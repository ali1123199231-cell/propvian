package com.smartlock.service;

import com.smartlock.domain.DirectBooking;
import com.smartlock.domain.HostVerification;
import com.smartlock.domain.Organization;
import com.smartlock.domain.PromoCode;
import com.smartlock.domain.Property;
import com.smartlock.domain.PropertyPricingRule;
import com.smartlock.domain.WebsiteConfig;
import com.smartlock.domain.enums.DirectBookingStatus;
import com.smartlock.domain.enums.PropertyStatus;
import com.smartlock.dto.request.guest.GuestInitiateRequest;
import com.smartlock.dto.response.guest.GuestInitiateResponse;
import com.smartlock.dto.response.guest.GuestPropertyResponse;
import com.smartlock.dto.response.guest.PromoValidationResponse;
import com.smartlock.dto.response.guest.PublicOrgSiteResponse;
import com.smartlock.exception.AppException;
import com.smartlock.repository.DirectBookingRepository;
import com.smartlock.repository.HostVerificationRepository;
import com.smartlock.repository.OrganizationRepository;
import com.smartlock.repository.CalendarIntervalRepository;
import com.smartlock.repository.PropertyBlockedDateRepository;
import com.smartlock.repository.PropertyPhotoRepository;
import com.smartlock.repository.PropertyPricingRuleRepository;
import com.smartlock.repository.PropertyRepository;
import com.smartlock.repository.PromoCodeRepository;
import com.smartlock.repository.UserRepository;
import com.smartlock.repository.WebsiteConfigRepository;
import com.smartlock.repository.WebsiteSectionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class GuestCheckoutService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("d MMM yyyy");

    private final PropertyRepository propertyRepository;
    private final OrganizationRepository organizationRepository;
    private final HostVerificationRepository verificationRepository;
    private final DirectBookingRepository bookingRepository;
    private final CalendarIntervalRepository calendarIntervalRepository;
    private final PropertyBlockedDateRepository blockedRepo;
    private final PropertyPricingRuleRepository pricingRepo;
    private final PromoCodeRepository promoCodeRepository;
    private final UserRepository userRepository;
    private final WebsiteConfigRepository websiteConfigRepository;
    private final WebsiteSectionRepository websiteSectionRepository;
    private final PropertyPhotoRepository propertyPhotoRepository;
    private final FileUploadService fileUploadService;
    private final EmailService emailService;
    private final CalendarEngine calendarEngine;
    private final SystemConfigService systemConfigService;
    private final StripeService stripeService;
    private final PayPalService paypalService;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    // ── Lookup: property slug, property UUID, or org slug ────────────────────

    private Property resolveProperty(String slug) {
        // Try direct property slug
        Optional<Property> bySlug = propertyRepository.findBySlug(slug);
        if (bySlug.isPresent()) return bySlug.get();
        // Try property ID (UUID) — used when a property has no slug
        try {
            UUID id = UUID.fromString(slug);
            Optional<Property> byId = propertyRepository.findById(id);
            if (byId.isPresent()) return byId.get();
        } catch (IllegalArgumentException ignored) {}
        // Fall back to org slug → first active property
        List<Property> orgProps = propertyRepository.findByOrganizationSlug(slug);
        if (!orgProps.isEmpty()) return orgProps.get(0);
        throw new AppException("Property not found", HttpStatus.NOT_FOUND);
    }

    // ── Public org listing (multi-property site) ──────────────────────────────

    @Transactional(readOnly = true)
    public PublicOrgSiteResponse getOrgSite(String orgSlug) {
        Organization org = organizationRepository.findBySlug(orgSlug)
                .orElseThrow(() -> new AppException("Site not found", HttpStatus.NOT_FOUND));

        WebsiteConfig config = websiteConfigRepository.findByOrganizationId(org.getId()).orElse(null);

        if (config == null || !"PUBLISHED".equals(config.getStatus())) {
            throw new AppException("Site not found", HttpStatus.NOT_FOUND);
        }

        List<Property> activeProperties = propertyRepository
                .findByOrganizationIdAndStatus(org.getId(), PropertyStatus.ACTIVE);

        List<PublicOrgSiteResponse.PublicPropertyCard> cards = activeProperties.stream()
                .map(p -> {
                    List<String> photos = propertyPhotoRepository
                            .findByPropertyIdOrderBySortOrderAsc(p.getId()).stream()
                            .map(ph -> fileUploadService.toPublicUrl(ph.getUrl()))
                            .toList();
                    String primaryImageUrl = photos.isEmpty()
                            ? fileUploadService.toPublicUrl(p.getImageUrl())
                            : photos.get(0);
                    List<String> allPhotos = photos.isEmpty() && p.getImageUrl() != null
                            ? List.of(fileUploadService.toPublicUrl(p.getImageUrl()))
                            : photos;
                    return PublicOrgSiteResponse.PublicPropertyCard.builder()
                            .id(p.getId().toString())
                            .slug(p.getSlug() != null ? p.getSlug() : p.getId().toString())
                            .name(p.getName())
                            .imageUrl(primaryImageUrl)
                            .photoUrls(allPhotos)
                            .city(p.getCity())
                            .country(p.getCountry())
                            .bedrooms(p.getBedrooms())
                            .bathrooms(p.getBathrooms())
                            .maxGuests(p.getMaxGuests())
                            .baseNightlyRate(p.getBaseNightlyRate())
                            .cleaningFee(p.getCleaningFee())
                            .propertyType(p.getPropertyType())
                            .minStayNights(p.getMinStayNights())
                            .checkInTime(p.getCheckInTime())
                            .checkOutTime(p.getCheckOutTime())
                            .build();
                })
                .toList();

        List<PublicOrgSiteResponse.PublicSectionDto> sections = config != null
                ? websiteSectionRepository.findByWebsiteIdOrderByPosition(config.getId()).stream()
                        .map(s -> PublicOrgSiteResponse.PublicSectionDto.builder()
                                .id(s.getId().toString())
                                .sectionType(s.getSectionType())
                                .title(s.getTitle())
                                .enabled(s.isEnabled())
                                .position(s.getPosition())
                                .config(s.getConfig())
                                .build())
                        .toList()
                : List.of();

        String displayName = (config != null && config.getBrandName() != null)
                ? config.getBrandName() : org.getName();

        return PublicOrgSiteResponse.builder()
                .orgSlug(org.getSlug())
                .orgName(org.getName())
                .brandName(displayName)
                .brandLogoUrl(config != null ? config.getBrandLogoUrl() : null)
                .primaryColor(config != null ? config.getPrimaryColor() : "#6366F1")
                .accentColor(config != null ? config.getAccentColor() : "#F59E0B")
                .fontFamily(config != null ? config.getFontFamily() : "Inter")
                .buttonStyle(config != null ? config.getButtonStyle() : "rounded")
                .themeStyle(config != null ? config.getThemeStyle() : "modern")
                .pageTitle(config != null ? config.getPageTitle() : null)
                .metaDescription(config != null ? config.getMetaDescription() : null)
                .ogImageUrl(config != null ? config.getOgImageUrl() : null)
                .gaTrackingId(config != null ? config.getGaTrackingId() : null)
                .gtmContainerId(config != null ? config.getGtmContainerId() : null)
                .metaPixelId(config != null ? config.getMetaPixelId() : null)
                .tiktokPixelId(config != null ? config.getTiktokPixelId() : null)
                .sections(sections)
                .properties(cards)
                .build();
    }

    // ── Public property info ──────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public GuestPropertyResponse getPropertyInfo(String slug) {
        Property property = resolveProperty(slug);

        HostVerification v = verificationRepository.findByOrganizationId(property.getOrganizationId())
                .orElse(null);

        boolean stripeEnabled = v != null
                && v.getStripeAccountId() != null
                && v.isStripeChargesEnabled()
                && v.isStripePayoutsEnabled();
        boolean paypalEnabled = v != null && v.getPaypalAccountId() != null;

        // Manually blocked dates (fully inclusive [start, end])
        List<GuestPropertyResponse.BlockedRange> blocked = new ArrayList<>(
                blockedRepo.findByPropertyId(property.getId()).stream()
                        .map(b -> new GuestPropertyResponse.BlockedRange(
                                b.getStartDate().toString(), b.getEndDate().toString()))
                        .toList());

        // Booked / buffered intervals from CalendarEngine — half-open [start, end),
        // convert to inclusive by sending end - 1 day so the frontend datesInRange works correctly.
        LocalDate windowEnd = LocalDate.now().plusYears(1);
        calendarIntervalRepository.findInWindow(property.getId(), LocalDate.now(), windowEnd).stream()
                .filter(ci -> !ci.getState().equals("CANCELLED") && !ci.getState().equals("EXPIRED"))
                .filter(ci -> ci.getEndDate().isAfter(ci.getStartDate()))
                .forEach(ci -> blocked.add(new GuestPropertyResponse.BlockedRange(
                        ci.getStartDate().toString(),
                        ci.getEndDate().minusDays(1).toString())));

        List<GuestPropertyResponse.PricingRuleInfo> pricing =
                pricingRepo.findByPropertyIdOrderByStartDateAsc(property.getId()).stream()
                        .map(r -> new GuestPropertyResponse.PricingRuleInfo(
                                r.getStartDate().toString(), r.getEndDate().toString(), r.getNightlyRate()))
                        .toList();

        String orgSlug = organizationRepository.findById(property.getOrganizationId())
                .map(Organization::getSlug).orElse(null);

        List<String> photos = propertyPhotoRepository
                .findByPropertyIdOrderBySortOrderAsc(property.getId()).stream()
                .map(ph -> fileUploadService.toPublicUrl(ph.getUrl()))
                .toList();
        String primaryImageUrl = photos.isEmpty()
                ? fileUploadService.toPublicUrl(property.getImageUrl())
                : photos.get(0);
        List<String> allPhotos = photos.isEmpty() && property.getImageUrl() != null
                ? List.of(fileUploadService.toPublicUrl(property.getImageUrl()))
                : photos;

        return GuestPropertyResponse.builder()
                .id(property.getId().toString())
                .orgSlug(orgSlug)
                .name(property.getName())
                .description(property.getDescription())
                .imageUrl(primaryImageUrl)
                .photoUrls(allPhotos)
                .city(property.getCity())
                .country(property.getCountry())
                .maxGuests(property.getMaxGuests())
                .bedrooms(property.getBedrooms())
                .bathrooms(property.getBathrooms())
                .baseNightlyRate(property.getBaseNightlyRate())
                .cleaningFee(property.getCleaningFee())
                .checkInTime(property.getCheckInTime())
                .checkOutTime(property.getCheckOutTime())
                .cancellationPolicy(property.getCancellationPolicy())
                .minStayNights(property.getMinStayNights())
                .instantBooking(property.isInstantBooking())
                .stripeEnabled(stripeEnabled)
                .paypalEnabled(paypalEnabled)
                .stripePublishableKey(stripeEnabled ? systemConfigService.getActiveStripePublishableKey() : null)
                .paypalClientId(paypalEnabled ? systemConfigService.getPaypalClientId() : null)
                .blockedDates(blocked)
                .pricingRules(pricing)
                .build();
    }

    // ── Initiate checkout (creates booking + payment intent / PayPal order) ───

    @Transactional
    public GuestInitiateResponse initiateBooking(String slug, GuestInitiateRequest req) {
        Property property = resolveProperty(slug);

        CalendarEngine.AvailabilityResult avail = calendarEngine.checkAvailability(
                property.getId(), req.getCheckInDate(), req.getCheckOutDate());
        if (!avail.available()) {
            throw new AppException(avail.reason(), HttpStatus.CONFLICT);
        }

        HostVerification v = verificationRepository.findByOrganizationId(property.getOrganizationId())
                .orElseThrow(() -> new AppException("This property cannot accept payments yet", HttpStatus.SERVICE_UNAVAILABLE));

        String provider = req.getPaymentProvider().toLowerCase();
        validateProvider(provider, v);

        // Resolve and validate promo code if provided
        PromoCode promo = null;
        if (req.getPromoCode() != null && !req.getPromoCode().isBlank()) {
            promo = promoCodeRepository
                    .findByOrganizationIdAndCodeIgnoreCase(property.getOrganizationId(), req.getPromoCode().trim())
                    .filter(PromoCode::isActive)
                    .filter(p -> p.getExpiresAt() == null || p.getExpiresAt().isAfter(java.time.Instant.now()))
                    .filter(p -> p.getMaxUses() == null || p.getUsesCount() < p.getMaxUses())
                    .orElseThrow(() -> new AppException("Invalid or expired promo code", HttpStatus.BAD_REQUEST));
        }

        BigDecimal total = calculateTotal(property, req, promo);
        String currency = "USD";

        DirectBooking booking = DirectBooking.builder()
                .propertyId(property.getId())
                .organizationId(property.getOrganizationId())
                .guestName(req.getGuestName())
                .guestEmail(req.getGuestEmail())
                .guestPhone(req.getGuestPhone())
                .numberOfGuests(req.getNumberOfGuests())
                .checkInDate(req.getCheckInDate())
                .checkOutDate(req.getCheckOutDate())
                .totalAmount(total)
                .currency(currency)
                .paymentProvider(provider)
                .build();
        booking = bookingRepository.save(booking);
        if (promo != null) {
            promo.setUsesCount(promo.getUsesCount() + 1);
            promoCodeRepository.save(promo);
        }

        if ("stripe".equals(provider)) {
            try {
                String clientSecret = stripeService.createGuestPaymentIntent(
                        booking.getId(), total, currency, v.getStripeAccountId());
                return GuestInitiateResponse.builder()
                        .bookingId(booking.getId().toString())
                        .provider("stripe")
                        .stripeClientSecret(clientSecret)
                        .totalAmount(total)
                        .currency(currency)
                        .build();
            } catch (com.stripe.exception.StripeException e) {
                bookingRepository.delete(booking);
                throw new AppException("Payment initialization failed: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
            }
        } else {
            String orderId = paypalService.createGuestOrder(
                    booking.getId(), total, currency, v.getPaypalAccountId());
            return GuestInitiateResponse.builder()
                    .bookingId(booking.getId().toString())
                    .provider("paypal")
                    .paypalOrderId(orderId)
                    .totalAmount(total)
                    .currency(currency)
                    .build();
        }
    }

    // ── Confirm after Stripe payment (called from frontend + webhook) ─────────

    @Transactional
    public void confirmStripeBooking(UUID bookingId, String paymentIntentId) {
        DirectBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException("Booking not found", HttpStatus.NOT_FOUND));
        if (booking.getStatus() == DirectBookingStatus.CONFIRMED) return; // idempotent

        booking.setPaymentIntentId(paymentIntentId);
        finalize(booking);
    }

    // ── Capture PayPal order + confirm (called from frontend) ─────────────────

    @Transactional
    public void captureAndConfirmPaypal(UUID bookingId, String orderId) {
        DirectBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException("Booking not found", HttpStatus.NOT_FOUND));
        if (booking.getStatus() == DirectBookingStatus.CONFIRMED) return;

        paypalService.captureGuestOrder(orderId);
        booking.setPaymentIntentId(orderId);
        finalize(booking);
    }

    // ── Internal helpers ─────────────────────────────────────────────────────

    private void finalize(DirectBooking booking) {
        booking.setStatus(DirectBookingStatus.CONFIRMED);
        booking.setPaymentStatus("PAID");
        bookingRepository.save(booking);

        calendarEngine.registerBookedInterval(
                booking.getPropertyId(), booking.getCheckInDate(), booking.getCheckOutDate(),
                booking.getId(), "GuestBooking: " + booking.getGuestEmail());

        notifyHostOfGuestPayment(booking);

        log.info("Guest booking confirmed: id={} guest={} property={}",
                booking.getId(), booking.getGuestEmail(), booking.getPropertyId());
    }

    private void notifyHostOfGuestPayment(DirectBooking booking) {
        try {
            Organization org = organizationRepository.findById(booking.getOrganizationId()).orElse(null);
            if (org == null) return;
            userRepository.findById(org.getOwnerId()).ifPresent(owner -> {
                Property property = propertyRepository.findById(booking.getPropertyId()).orElse(null);
                String propertyName = property != null ? property.getName() : "your property";
                String checkIn = DATE_FMT.format(booking.getCheckInDate());
                String checkOut = DATE_FMT.format(booking.getCheckOutDate());
                emailService.sendNewReservationEmail(
                        owner.getEmail(), booking.getGuestName(), propertyName,
                        checkIn, checkOut, "GUEST_WEBSITE", frontendUrl + "/reservations");
            });
        } catch (Exception e) {
            log.error("Failed to notify host of guest payment for booking {}: {}", booking.getId(), e.getMessage());
        }
    }

    private void validateProvider(String provider, HostVerification v) {
        if ("stripe".equals(provider)) {
            if (v.getStripeAccountId() == null || !v.isStripeChargesEnabled() || !v.isStripePayoutsEnabled()) {
                throw new AppException("Stripe is not available for this property", HttpStatus.BAD_REQUEST);
            }
        } else if ("paypal".equals(provider)) {
            if (v.getPaypalAccountId() == null) {
                throw new AppException("PayPal is not available for this property", HttpStatus.BAD_REQUEST);
            }
        } else {
            throw new AppException("Invalid payment provider", HttpStatus.BAD_REQUEST);
        }
    }

    private BigDecimal calculateTotal(Property property, GuestInitiateRequest req, PromoCode promo) {
        long nights = req.getCheckInDate().until(req.getCheckOutDate(), ChronoUnit.DAYS);
        if (nights < 1) throw new AppException("Check-out must be after check-in", HttpStatus.BAD_REQUEST);
        if (property.getMinStayNights() > 0 && nights < property.getMinStayNights()) {
            throw new AppException("Minimum stay is " + property.getMinStayNights() + " nights", HttpStatus.BAD_REQUEST);
        }
        if (promo != null && promo.getMinNights() != null && nights < promo.getMinNights()) {
            throw new AppException("This promo code requires a minimum stay of " + promo.getMinNights() + " nights", HttpStatus.BAD_REQUEST);
        }

        BigDecimal nightlyRate = property.getBaseNightlyRate() != null
                ? property.getBaseNightlyRate() : BigDecimal.ZERO;
        List<PropertyPricingRule> rules = pricingRepo.findByPropertyIdOrderByStartDateAsc(property.getId());
        for (PropertyPricingRule rule : rules) {
            if (!rule.getStartDate().isAfter(req.getCheckInDate())
                    && !rule.getEndDate().isBefore(req.getCheckOutDate())) {
                nightlyRate = rule.getNightlyRate();
                break;
            }
        }

        if (nightlyRate.compareTo(BigDecimal.ZERO) == 0) {
            throw new AppException("This property is not available for booking yet — no rate has been set", HttpStatus.BAD_REQUEST);
        }

        BigDecimal cleaning = property.getCleaningFee() != null ? property.getCleaningFee() : BigDecimal.ZERO;
        BigDecimal subtotal = nightlyRate.multiply(BigDecimal.valueOf(nights)).add(cleaning);

        if (promo != null) {
            if ("PERCENT".equalsIgnoreCase(promo.getDiscountType())) {
                BigDecimal discount = subtotal.multiply(promo.getDiscountValue())
                        .divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
                subtotal = subtotal.subtract(discount).max(BigDecimal.ZERO);
            } else if ("FIXED".equalsIgnoreCase(promo.getDiscountType())) {
                subtotal = subtotal.subtract(promo.getDiscountValue()).max(BigDecimal.ZERO);
            }
        }

        return subtotal;
    }

    // ── Public promo code validation ──────────────────────────────────────────

    @Transactional(readOnly = true)
    public PromoValidationResponse validatePromoCode(String orgSlug, String code) {
        Organization org = organizationRepository.findBySlug(orgSlug)
                .orElse(null);
        if (org == null) {
            return PromoValidationResponse.builder().valid(false).message("Organization not found").build();
        }
        return promoCodeRepository.findByOrganizationIdAndCodeIgnoreCase(org.getId(), code.trim())
                .filter(PromoCode::isActive)
                .filter(p -> p.getExpiresAt() == null || p.getExpiresAt().isAfter(java.time.Instant.now()))
                .filter(p -> p.getMaxUses() == null || p.getUsesCount() < p.getMaxUses())
                .map(p -> PromoValidationResponse.builder()
                        .valid(true)
                        .code(p.getCode())
                        .discountType(p.getDiscountType())
                        .discountValue(p.getDiscountValue())
                        .message(buildPromoMessage(p))
                        .build())
                .orElse(PromoValidationResponse.builder()
                        .valid(false)
                        .message("Invalid or expired promo code")
                        .build());
    }

    private String buildPromoMessage(PromoCode p) {
        if ("PERCENT".equalsIgnoreCase(p.getDiscountType())) {
            return p.getDiscountValue().stripTrailingZeros().toPlainString() + "% off applied!";
        }
        return "$" + p.getDiscountValue().stripTrailingZeros().toPlainString() + " off applied!";
    }
}
