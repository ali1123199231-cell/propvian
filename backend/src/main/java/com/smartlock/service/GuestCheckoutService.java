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
import com.smartlock.repository.PropertyAmenityRepository;
import com.smartlock.repository.PropertyBlockedDateRepository;
import com.smartlock.repository.PropertyHouseRuleRepository;
import com.smartlock.repository.PropertyPhotoRepository;
import com.smartlock.repository.PropertyPricingRuleRepository;
import com.smartlock.repository.PropertySeasonalRuleRepository;
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

import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class GuestCheckoutService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("d MMM yyyy");
    private static final ObjectMapper MAPPER = new ObjectMapper();

    /** Parse a section config string to a Map, unwrapping any legacy double/triple-encoding. */
    private static Object parseConfig(String raw) {
        if (raw == null || raw.isBlank()) return Map.of();
        Object result = raw;
        for (int i = 0; i < 5; i++) {
            if (!(result instanceof String s)) break;
            try { result = MAPPER.readValue(s, Object.class); }
            catch (Exception e) { break; }
        }
        return (result instanceof Map) ? result : Map.of();
    }

    private final PropertyRepository propertyRepository;
    private final OrganizationRepository organizationRepository;
    private final HostVerificationRepository verificationRepository;
    private final DirectBookingRepository bookingRepository;
    private final CalendarIntervalRepository calendarIntervalRepository;
    private final PropertyBlockedDateRepository blockedRepo;
    private final PropertyPricingRuleRepository pricingRepo;
    private final PropertySeasonalRuleRepository seasonalRuleRepo;
    private final PropertyHouseRuleRepository houseRuleRepo;
    private final PropertyAmenityRepository amenityRepo;
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
        log.info("[ORG-SITE] Request for orgSlug='{}'", orgSlug);
        Organization org = organizationRepository.findBySlug(orgSlug)
                .orElseThrow(() -> new AppException("Site not found", HttpStatus.NOT_FOUND));

        WebsiteConfig config = websiteConfigRepository.findByOrganizationId(org.getId()).orElse(null);

        if (config == null || !"PUBLISHED".equals(config.getStatus())) {
            log.warn("[ORG-SITE] Blocked for org='{}': config={} status={}", orgSlug, config != null ? "exists" : "null", config != null ? config.getStatus() : "n/a");
            throw new AppException("Site not found", HttpStatus.NOT_FOUND);
        }

        List<Property> activeProperties = propertyRepository
                .findByOrganizationIdAndStatus(org.getId(), PropertyStatus.ACTIVE);
        log.info("[ORG-SITE] org='{}' activeProperties={} stickyBook={} exitIntent={} customCss={}",
                orgSlug, activeProperties.size(), config.isStickyBookButton(), config.isExitIntentEnabled(),
                config.getCustomCss() != null ? "set" : "null");

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
                            .description(p.getDescription())
                            .imageUrl(primaryImageUrl)
                            .photoUrls(allPhotos)
                            .city(p.getCity())
                            .country(p.getCountry())
                            .bedrooms(p.getBedrooms())
                            .beds(p.getBeds())
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
                                .config(parseConfig(s.getConfig()))
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
                .stickyBookButton(config != null && config.isStickyBookButton())
                .exitIntentEnabled(config != null && config.isExitIntentEnabled())
                .exitIntentMessage(config != null ? config.getExitIntentMessage() : null)
                .exitIntentDiscount(config != null ? config.getExitIntentDiscount() : null)
                .customCss(config != null ? config.getCustomCss() : null)
                .customHeadJs(config != null ? config.getCustomHeadJs() : null)
                .customFooterJs(config != null ? config.getCustomFooterJs() : null)
                .sections(sections)
                .properties(cards)
                .build();
    }

    // ── Public property info ──────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public GuestPropertyResponse getPropertyInfo(String slug) {
        log.info("[GUEST-PROPERTY] Request for slug='{}'", slug);
        Property property = resolveProperty(slug);
        log.info("[GUEST-PROPERTY] Resolved property id={} name='{}' status={} currency={}",
                property.getId(), property.getName(), property.getStatus(), property.getCurrency());
        if (property.getStatus() != PropertyStatus.ACTIVE) {
            log.warn("[GUEST-PROPERTY] Blocked: property id={} is not ACTIVE (status={})", property.getId(), property.getStatus());
            throw new AppException("Property not found", HttpStatus.NOT_FOUND);
        }

        HostVerification v = verificationRepository.findByOrganizationId(property.getOrganizationId())
                .orElse(null);

        boolean stripeEnabled = v != null
                && v.getStripeAccountId() != null
                && v.isStripeChargesEnabled()
                && v.isStripePayoutsEnabled()
                && v.isStripeGuestEnabled();
        boolean paypalEnabled = v != null && v.getPaypalAccountId() != null && v.isPaypalGuestEnabled();
        log.info("[GUEST-PROPERTY] Payment methods: stripe={} paypal={}", stripeEnabled, paypalEnabled);

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

        List<GuestPropertyResponse.SeasonalRuleInfo> seasonalRules =
                seasonalRuleRepo.findByPropertyIdOrderByStartDateAsc(property.getId()).stream()
                        .map(r -> new GuestPropertyResponse.SeasonalRuleInfo(
                                r.getStartDate().toString(), r.getEndDate().toString(),
                                r.getMinStayDays(), r.getMaxStayDays()))
                        .toList();

        Organization org = organizationRepository.findById(property.getOrganizationId())
                .orElseThrow(() -> new AppException("Property not found", HttpStatus.NOT_FOUND));
        String orgSlug = org.getSlug();
        WebsiteConfig wc = websiteConfigRepository.findByOrganizationId(property.getOrganizationId()).orElse(null);

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

        List<GuestPropertyResponse.HouseRuleInfo> houseRules =
                houseRuleRepo.findByPropertyId(property.getId()).stream()
                        .map(r -> new GuestPropertyResponse.HouseRuleInfo(r.getRuleKey(), r.isAllowed(), r.getNotes()))
                        .toList();

        List<GuestPropertyResponse.AmenityInfo> amenities =
                amenityRepo.findByPropertyId(property.getId()).stream()
                        .map(a -> new GuestPropertyResponse.AmenityInfo(a.getCategory(), a.getName(), a.getIcon()))
                        .toList();
        if (amenities.isEmpty()) {
            log.info("[GUEST-PROPERTY] No amenities saved — using {} defaults", DEFAULT_AMENITIES.size());
            amenities = DEFAULT_AMENITIES;
        } else {
            log.info("[GUEST-PROPERTY] Loaded {} amenities, {} house rules, {} blocked ranges, {} pricing rules",
                    amenities.size(), houseRules.size(), blocked.size(), pricing.size());
        }

        boolean bookingsEnabled = v != null && v.isBookingsEnabled();
        log.info("[GUEST-PROPERTY] Building response: minStay={} maxStay={} instantBooking={} bookingsEnabled={} hasPromos={} securityDeposit={} beds={} propertyType='{}'",
                property.getMinStayNights(), property.getMaxStayNights(), property.isInstantBooking(),
                bookingsEnabled, hasActivePromos(property.getOrganizationId()), property.getSecurityDeposit(),
                property.getBeds(), property.getPropertyType());

        return GuestPropertyResponse.builder()
                .id(property.getId().toString())
                .orgSlug(orgSlug)
                .name(property.getName())
                .description(property.getDescription())
                .propertyType(property.getPropertyType())
                .currency(property.getCurrency() != null ? property.getCurrency() : "USD")
                .imageUrl(primaryImageUrl)
                .photoUrls(allPhotos)
                .city(property.getCity())
                .country(property.getCountry())
                .maxGuests(property.getMaxGuests())
                .bedrooms(property.getBedrooms())
                .beds(property.getBeds())
                .bathrooms(property.getBathrooms())
                .baseNightlyRate(property.getBaseNightlyRate())
                .cleaningFee(property.getCleaningFee())
                .securityDeposit(property.getSecurityDeposit())
                .checkInTime(property.getCheckInTime())
                .checkOutTime(property.getCheckOutTime())
                .cancellationPolicy(property.getCancellationPolicy())
                .minStayNights(property.getMinStayNights())
                .maxStayNights(property.getMaxStayNights())
                .instantBooking(property.isInstantBooking())
                .depositRequired(property.isDepositRequired())
                .depositPercent(property.getDepositPercent())
                .stripeEnabled(stripeEnabled)
                .paypalEnabled(paypalEnabled)
                .stripePublishableKey(stripeEnabled ? systemConfigService.getActiveStripePublishableKey() : null)
                .stripeConnectedAccountId(stripeEnabled ? v.getStripeAccountId() : null)
                .paypalClientId(paypalEnabled ? systemConfigService.getPaypalClientId() : null)
                .bookingsEnabled(bookingsEnabled)
                .hasActivePromos(hasActivePromos(property.getOrganizationId()))
                .houseRules(houseRules)
                .amenities(amenities)
                .blockedDates(blocked)
                .pricingRules(pricing)
                .seasonalRules(seasonalRules)
                .brandName(wc != null && wc.getBrandName() != null ? wc.getBrandName() : (org != null ? org.getName() : null))
                .brandLogoUrl(wc != null ? wc.getBrandLogoUrl() : null)
                .primaryColor(wc != null && wc.getPrimaryColor() != null ? wc.getPrimaryColor() : "#6366F1")
                .accentColor(wc != null && wc.getAccentColor() != null ? wc.getAccentColor() : "#F59E0B")
                .fontFamily(wc != null && wc.getFontFamily() != null ? wc.getFontFamily() : "Inter")
                .buttonStyle(wc != null && wc.getButtonStyle() != null ? wc.getButtonStyle() : "rounded")
                .build();
    }

    private static final List<GuestPropertyResponse.AmenityInfo> DEFAULT_AMENITIES = List.of(
            new GuestPropertyResponse.AmenityInfo("essentials", "WiFi", "wifi"),
            new GuestPropertyResponse.AmenityInfo("essentials", "Washing machine", "washing-machine"),
            new GuestPropertyResponse.AmenityInfo("workspace",  "Workspace",       "laptop"),
            new GuestPropertyResponse.AmenityInfo("entertainment", "TV",            "tv"),
            new GuestPropertyResponse.AmenityInfo("outdoor",    "Balcony",         "sun")
    );

    // ── Initiate checkout (creates booking + payment intent / PayPal order) ───

    @Transactional
    public GuestInitiateResponse initiateBooking(String slug, GuestInitiateRequest req) {
        log.info("[GUEST-INITIATE] slug='{}' checkIn={} checkOut={} guests={} provider={} promo='{}'",
                slug, req.getCheckInDate(), req.getCheckOutDate(), req.getNumberOfGuests(),
                req.getPaymentProvider(), req.getPromoCode());
        Property property = resolveProperty(slug);

        CalendarEngine.AvailabilityResult avail = calendarEngine.checkAvailability(
                property.getId(), req.getCheckInDate(), req.getCheckOutDate());
        if (!avail.available()) {
            log.warn("[GUEST-INITIATE] Availability check FAILED for property={}: {}", property.getId(), avail.reason());
            throw new AppException(avail.reason(), HttpStatus.CONFLICT);
        }
        log.info("[GUEST-INITIATE] Availability OK for property={}", property.getId());

        organizationRepository.findById(property.getOrganizationId())
                .orElseThrow(() -> new AppException("Property not found", HttpStatus.NOT_FOUND));

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
        String currency = property.getCurrency() != null ? property.getCurrency().toUpperCase() : "USD";
        log.info("[GUEST-INITIATE] Calculated total={} {} promo={}", total, currency, promo != null ? promo.getCode() : "none");

        BigDecimal discountAmt = BigDecimal.ZERO;
        if (promo != null) {
            BigDecimal gross = calculateGross(property, req);
            discountAmt = "PERCENT".equalsIgnoreCase(promo.getDiscountType())
                    ? gross.multiply(promo.getDiscountValue()).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP)
                    : promo.getDiscountValue();
        }

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
                .promoCodeUsed(promo != null ? promo.getCode() : null)
                .discountAmount(discountAmt.compareTo(BigDecimal.ZERO) > 0 ? discountAmt : null)
                .build();
        booking = bookingRepository.save(booking);
        if (promo != null) {
            promo.setUsesCount(promo.getUsesCount() + 1);
            promoCodeRepository.save(promo);
            log.info("[GUEST-INITIATE] Promo '{}' applied: discount={} {} usesCount now={}",
                    promo.getCode(), discountAmt, currency, promo.getUsesCount());
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
            if (v.getStripeAccountId() == null || !v.isStripeChargesEnabled() || !v.isStripePayoutsEnabled() || !v.isStripeGuestEnabled()) {
                throw new AppException("Stripe is not available for this property", HttpStatus.BAD_REQUEST);
            }
        } else if ("paypal".equals(provider)) {
            if (v.getPaypalAccountId() == null || !v.isPaypalGuestEnabled()) {
                throw new AppException("PayPal is not available for this property", HttpStatus.BAD_REQUEST);
            }
        } else {
            throw new AppException("Invalid payment provider", HttpStatus.BAD_REQUEST);
        }
    }

    private BigDecimal calculateTotal(Property property, GuestInitiateRequest req, PromoCode promo) {
        long nights = req.getCheckInDate().until(req.getCheckOutDate(), ChronoUnit.DAYS);
        log.info("[CALC-TOTAL] property={} nights={} minStay={} maxStay={}", property.getId(), nights, property.getMinStayNights(), property.getMaxStayNights());
        if (nights < 1) throw new AppException("Check-out must be after check-in", HttpStatus.BAD_REQUEST);
        if (property.getMinStayNights() > 0 && nights < property.getMinStayNights()) {
            log.warn("[CALC-TOTAL] REJECTED: nights={} below minStay={}", nights, property.getMinStayNights());
            throw new AppException("Minimum stay is " + property.getMinStayNights() + " nights", HttpStatus.BAD_REQUEST);
        }
        if (property.getMaxStayNights() > 0 && nights > property.getMaxStayNights()) {
            log.warn("[CALC-TOTAL] REJECTED: nights={} above maxStay={}", nights, property.getMaxStayNights());
            throw new AppException("Maximum stay is " + property.getMaxStayNights() + " nights", HttpStatus.BAD_REQUEST);
        }
        if (promo != null && promo.getMinNights() != null && nights < promo.getMinNights()) {
            log.warn("[CALC-TOTAL] REJECTED: promo '{}' requires minNights={} but got {}", promo.getCode(), promo.getMinNights(), nights);
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
            log.warn("[CALC-TOTAL] REJECTED: no nightly rate for property={}", property.getId());
            throw new AppException("This property is not available for booking yet — no rate has been set", HttpStatus.BAD_REQUEST);
        }

        BigDecimal cleaning = property.getCleaningFee() != null ? property.getCleaningFee() : BigDecimal.ZERO;
        BigDecimal subtotal = nightlyRate.multiply(BigDecimal.valueOf(nights)).add(cleaning);
        log.info("[CALC-TOTAL] rate={} × {} nights + cleaning={} = subtotal={}", nightlyRate, nights, cleaning, subtotal);

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

    /** Gross (pre-discount) total — used to compute the discount amount for audit. */
    private BigDecimal calculateGross(Property property, GuestInitiateRequest req) {
        long nights = req.getCheckInDate().until(req.getCheckOutDate(), ChronoUnit.DAYS);
        BigDecimal nightlyRate = property.getBaseNightlyRate() != null ? property.getBaseNightlyRate() : BigDecimal.ZERO;
        List<PropertyPricingRule> rules = pricingRepo.findByPropertyIdOrderByStartDateAsc(property.getId());
        for (PropertyPricingRule rule : rules) {
            if (!rule.getStartDate().isAfter(req.getCheckInDate()) && !rule.getEndDate().isBefore(req.getCheckOutDate())) {
                nightlyRate = rule.getNightlyRate(); break;
            }
        }
        BigDecimal cleaning = property.getCleaningFee() != null ? property.getCleaningFee() : BigDecimal.ZERO;
        return nightlyRate.multiply(BigDecimal.valueOf(nights)).add(cleaning);
    }

    // ── Public promo code validation ──────────────────────────────────────────

    @Transactional(readOnly = true)
    public PromoValidationResponse validatePromoCode(String orgSlug, String code, Integer nights) {
        log.info("[PROMO-VALIDATE] orgSlug='{}' code='{}' nights={}", orgSlug, code, nights);
        Organization org = organizationRepository.findBySlug(orgSlug)
                .orElse(null);
        if (org == null) {
            log.warn("[PROMO-VALIDATE] Organization not found for slug='{}'", orgSlug);
            return PromoValidationResponse.builder().valid(false).message("Organization not found").build();
        }
        return promoCodeRepository.findByOrganizationIdAndCodeIgnoreCase(org.getId(), code.trim())
                .filter(PromoCode::isActive)
                .filter(p -> p.getExpiresAt() == null || p.getExpiresAt().isAfter(java.time.Instant.now()))
                .filter(p -> p.getMaxUses() == null || p.getUsesCount() < p.getMaxUses())
                .map(p -> {
                    if (nights != null && p.getMinNights() != null && nights < p.getMinNights()) {
                        log.warn("[PROMO-VALIDATE] REJECTED minNights: code='{}' requires {} nights but got {}", p.getCode(), p.getMinNights(), nights);
                        return PromoValidationResponse.builder().valid(false)
                                .message("This promo code requires a minimum stay of " + p.getMinNights() + " nights")
                                .minNights(p.getMinNights()).build();
                    }
                    log.info("[PROMO-VALIDATE] VALID code='{}' type={} value={} minNights={}", p.getCode(), p.getDiscountType(), p.getDiscountValue(), p.getMinNights());
                    return PromoValidationResponse.builder()
                            .valid(true).code(p.getCode()).discountType(p.getDiscountType())
                            .discountValue(p.getDiscountValue()).minNights(p.getMinNights())
                            .message(buildPromoMessage(p)).build();
                })
                .orElseGet(() -> {
                    log.warn("[PROMO-VALIDATE] INVALID or expired code='{}' for org='{}'", code, orgSlug);
                    return PromoValidationResponse.builder().valid(false).message("Invalid or expired promo code").build();
                });
    }

    private boolean hasActivePromos(java.util.UUID orgId) {
        return promoCodeRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId).stream()
                .anyMatch(p -> p.isActive()
                        && (p.getExpiresAt() == null || p.getExpiresAt().isAfter(java.time.Instant.now()))
                        && (p.getMaxUses() == null || p.getUsesCount() < p.getMaxUses()));
    }

    private String buildPromoMessage(PromoCode p) {
        if ("PERCENT".equalsIgnoreCase(p.getDiscountType())) {
            return p.getDiscountValue().stripTrailingZeros().toPlainString() + "% off applied!";
        }
        return "$" + p.getDiscountValue().stripTrailingZeros().toPlainString() + " off applied!";
    }
}
