package com.smartlock.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartlock.domain.GuestPage;
import com.smartlock.domain.GuestPageEvent;
import com.smartlock.domain.HostVerification;
import com.smartlock.domain.Organization;
import com.smartlock.domain.PromoCode;
import com.smartlock.domain.Property;
import com.smartlock.domain.PropertyHouseRule;
import com.smartlock.domain.PropertyPhoto;
import com.smartlock.domain.TapCode;
import com.smartlock.domain.WebsiteConfig;
import com.smartlock.domain.enums.GuestPageEventType;
import com.smartlock.domain.enums.TapCodeKind;
import com.smartlock.domain.enums.TapSource;
import com.smartlock.domain.enums.VerificationStatus;
import com.smartlock.dto.request.guestpage.GuestPageSectionDto;
import com.smartlock.dto.request.guestpage.UpdateGuestPageRequest;
import com.smartlock.dto.response.guestpage.GuestPageResponse;
import com.smartlock.dto.response.guestpage.GuestPageStatsResponse;
import com.smartlock.dto.response.guestpage.GuestPageSummaryResponse;
import com.smartlock.dto.response.guestpage.PublicGuestPageResponse;
import com.smartlock.exception.AppException;
import com.smartlock.repository.GuestPageEventRepository;
import com.smartlock.repository.GuestPageRepository;
import com.smartlock.repository.HostVerificationRepository;
import com.smartlock.repository.OrganizationRepository;
import com.smartlock.repository.PromoCodeRepository;
import com.smartlock.repository.PropertyHouseRuleRepository;
import com.smartlock.repository.PropertyPhotoRepository;
import com.smartlock.repository.PropertyRepository;
import com.smartlock.repository.ReservationRepository;
import com.smartlock.repository.SubscriptionRepository;
import com.smartlock.repository.TapCodeRepository;
import com.smartlock.repository.WebsiteConfigRepository;
import com.smartlock.security.GuestPageEventThrottle;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * The per-property guest page behind an NFC tag or QR code in the rental:
 * WiFi, house guide, host contact and an optional book-direct offer.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GuestPageService {

    static final String DEFAULT_BOOK_DIRECT_MESSAGE = "Loved your stay? Next time, book directly with us.";
    private static final String DEFAULT_BRAND_COLOR = "#4f46e5";
    private static final Pattern HEX_COLOR = Pattern.compile("^#[0-9a-fA-F]{6}$");
    private static final List<String> RULE_ORDER = List.of("SMOKING", "PARTIES", "PETS", "QUIET_HOURS", "CHILDREN");
    private static final TypeReference<List<GuestPageSectionDto>> SECTIONS_TYPE = new TypeReference<>() {};

    // "Network: Casa Sol / Password: sunny2024" and the like, one fact per fragment
    private static final Pattern WIFI_NAME = Pattern.compile(
            "^(?:wi-?fi|network|ssid|net|red|rete|sieć|siec)(?:\\s*name|\\s*nombre|\\s*nome)?\\s*[:=]\\s*(.+)$", Pattern.CASE_INSENSITIVE);
    private static final Pattern WIFI_PASSWORD = Pattern.compile(
            "^(?:password|pass|pwd|pw|key|clave|contraseña|contrasena|hasło|haslo)\\s*[:=]\\s*(\\S+)$", Pattern.CASE_INSENSITIVE);

    private final GuestPageRepository guestPageRepository;
    private final TapCodeRepository tapCodeRepository;
    private final GuestPageEventRepository eventRepository;
    private final PropertyRepository propertyRepository;
    private final PropertyPhotoRepository photoRepository;
    private final PropertyHouseRuleRepository houseRuleRepository;
    private final PromoCodeRepository promoCodeRepository;
    private final ReservationRepository reservationRepository;
    private final OrganizationRepository organizationRepository;
    private final HostVerificationRepository verificationRepository;
    private final WebsiteConfigRepository websiteConfigRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final BillingService billingService;
    private final OrganizationSecurityService orgSecurity;
    private final TapCodeService tapCodeService;
    private final GuestPageEventThrottle throttle;
    private final ObjectMapper objectMapper;

    @Value("${app.frontend-url:https://propvian.com}")
    private String frontendUrl;

    // ── Host ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<GuestPageSummaryResponse> list(UUID orgId) {
        orgSecurity.requireOrgAccess(orgId);
        List<Property> properties = propertyRepository.findByOrganizationId(orgId);
        Map<UUID, GuestPage> pages = guestPageRepository.findByOrganizationId(orgId).stream()
                .collect(Collectors.toMap(GuestPage::getPropertyId, Function.identity()));
        Map<UUID, Long> views = new HashMap<>();
        if (!properties.isEmpty()) {
            for (Object[] row : eventRepository.countViewsByProperty(
                    properties.stream().map(Property::getId).toList(), daysAgo(30))) {
                views.put((UUID) row[0], ((Number) row[1]).longValue());
            }
        }
        log.debug("GuestPageService.list — org={} properties={} pages={}", orgId, properties.size(), pages.size());
        return properties.stream()
                .sorted(Comparator.comparing(Property::getName, String.CASE_INSENSITIVE_ORDER))
                .map(p -> {
                    GuestPage page = pages.get(p.getId());
                    List<TapCode> codes = page == null ? List.of() : tapCodeRepository.findByPropertyIdOrderByCreatedAtAsc(p.getId());
                    String code = codes.stream().filter(c -> c.getKind() == TapCodeKind.PROPERTY)
                            .map(TapCode::getCode).findFirst().orElse(null);
                    return GuestPageSummaryResponse.builder()
                            .propertyId(p.getId())
                            .propertyName(p.getName())
                            .city(p.getCity())
                            .imageUrl(heroImage(p))
                            .configured(page != null)
                            .enabled(page != null && page.isEnabled())
                            .hasWifi(page != null && notBlank(page.getWifiSsid()))
                            .code(code)
                            .publicUrl(code != null ? tapCodeService.publicUrl(code) : null)
                            .views30d(views.getOrDefault(p.getId(), 0L))
                            .linkedStands((int) codes.stream().filter(c -> c.getKind() == TapCodeKind.PRODUCT).count())
                            .build();
                })
                .toList();
    }

    /** Returns the property's guest page, creating a prefilled one on first open. */
    @Transactional
    public GuestPageResponse getOrCreate(UUID orgId, UUID propertyId) {
        orgSecurity.requireOrgAccess(orgId);
        Property property = requireOwnedProperty(orgId, propertyId);
        GuestPage page = guestPageRepository.findByPropertyId(propertyId).orElseGet(() -> createDefault(property));
        return toHostResponse(page, property);
    }

    @Transactional
    public GuestPageResponse update(UUID orgId, UUID propertyId, UpdateGuestPageRequest req) {
        orgSecurity.requireOrgAccess(orgId);
        Property property = requireOwnedProperty(orgId, propertyId);
        GuestPage page = guestPageRepository.findByPropertyId(propertyId).orElseGet(() -> createDefault(property));

        if (req.getEnabled() != null) page.setEnabled(req.getEnabled());
        page.setWelcomeMessage(trimToNull(req.getWelcomeMessage()));

        // SSIDs and passwords are taken verbatim: a trailing space can be part of either
        page.setWifiSsid(emptyToNull(req.getWifiSsid()));
        page.setWifiPassword(emptyToNull(req.getWifiPassword()));
        if (req.getWifiSecurity() != null) page.setWifiSecurity(req.getWifiSecurity());
        if (req.getWifiHidden() != null) page.setWifiHidden(req.getWifiHidden());
        validateWifi(page);

        if (req.getSections() != null) page.setSections(writeSections(normalizeSections(req.getSections())));

        page.setContactName(trimToNull(req.getContactName()));
        page.setContactPhone(trimToNull(req.getContactPhone()));
        if (req.getContactWhatsapp() != null) page.setContactWhatsapp(req.getContactWhatsapp());
        page.setContactEmail(trimToNull(req.getContactEmail()));

        if (req.getBookDirectEnabled() != null) page.setBookDirectEnabled(req.getBookDirectEnabled());
        page.setBookDirectMessage(trimToNull(req.getBookDirectMessage()));
        page.setBookDirectPromoCode(requireKnownPromo(orgId, trimToNull(req.getBookDirectPromoCode())));
        page.setBookDirectUrl(trimToNull(req.getBookDirectUrl()));
        if (req.getBookDirectHideAirbnb() != null) page.setBookDirectHideAirbnb(req.getBookDirectHideAirbnb());
        if (req.getShowPoweredBy() != null) {
            if (!req.getShowPoweredBy() && !paying(orgId)) {
                throw new AppException("Hiding the Propvian footer is part of the paid plans",
                        HttpStatus.FORBIDDEN, "BRANDING_REQUIRES_PAID_PLAN");
            }
            page.setShowPoweredBy(req.getShowPoweredBy());
        }

        page = guestPageRepository.save(page);
        log.info("GuestPageService.update — property={} enabled={} wifi={} bookDirect={}",
                propertyId, page.isEnabled(), page.getWifiSsid() != null, page.isBookDirectEnabled());
        return toHostResponse(page, property);
    }

    @Transactional(readOnly = true)
    public GuestPageStatsResponse stats(UUID orgId, UUID propertyId, int days) {
        orgSecurity.requireOrgAccess(orgId);
        requireOwnedProperty(orgId, propertyId);
        int span = Math.max(1, Math.min(days, 365));
        Instant since = daysAgo(span);

        Map<GuestPageEventType, Long> byType = new EnumMap<>(GuestPageEventType.class);
        for (Object[] row : eventRepository.countByType(propertyId, since)) {
            byType.put((GuestPageEventType) row[0], ((Number) row[1]).longValue());
        }
        Map<String, Long> bySource = new LinkedHashMap<>();
        for (TapSource s : TapSource.values()) bySource.put(s.name(), 0L);
        for (Object[] row : eventRepository.countViewsBySource(propertyId, since)) {
            String key = row[0] == null ? TapSource.LINK.name() : ((TapSource) row[0]).name();
            bySource.merge(key, ((Number) row[1]).longValue(), Long::sum);
        }
        Map<LocalDate, Long> perDay = new HashMap<>();
        for (Object[] row : eventRepository.countDailyViews(propertyId, since)) {
            perDay.put(((java.sql.Date) row[0]).toLocalDate(), ((Number) row[1]).longValue());
        }
        List<GuestPageStatsResponse.DailyViews> daily = new ArrayList<>();
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        for (LocalDate d = today.minusDays(span - 1L); !d.isAfter(today); d = d.plusDays(1)) {
            daily.add(new GuestPageStatsResponse.DailyViews(d, perDay.getOrDefault(d, 0L)));
        }
        return GuestPageStatsResponse.builder()
                .days(span)
                .views(byType.getOrDefault(GuestPageEventType.VIEW, 0L))
                .viewsBySource(bySource)
                .wifiCopies(byType.getOrDefault(GuestPageEventType.WIFI_COPY, 0L))
                .bookDirectClicks(byType.getOrDefault(GuestPageEventType.BOOK_DIRECT_CLICK, 0L))
                .contactClicks(byType.getOrDefault(GuestPageEventType.CONTACT_CLICK, 0L))
                .daily(daily)
                .build();
    }

    /**
     * Links a pre-printed stand or card to one of the caller's properties.
     * A code already claimed by the same organization can be moved between its properties.
     */
    @Transactional
    public GuestPageResponse claim(UUID orgId, String rawCode, UUID propertyId, UUID userId) {
        orgSecurity.requireOrgAccess(orgId);
        Property property = requireOwnedProperty(orgId, propertyId);
        String code = tapCodeService.normalize(rawCode);
        TapCode tap = tapCodeRepository.findById(code)
                .orElseThrow(() -> new AppException("We couldn't find that code. Check the letters printed on your stand.",
                        HttpStatus.NOT_FOUND, "TAP_CODE_NOT_FOUND"));
        if (tap.getKind() != TapCodeKind.PRODUCT) {
            throw new AppException("This code belongs to a guest page and can't be linked again",
                    HttpStatus.CONFLICT, "TAP_CODE_NOT_CLAIMABLE");
        }
        if (tap.getOrganizationId() == null) {
            // Conditional update: two people racing for the same unclaimed code can't both win
            Instant now = Instant.now();
            int won = tapCodeRepository.claimIfUnclaimed(code, orgId, propertyId, userId, now);
            if (won == 0) {
                throw new AppException("This stand was just linked to another account", HttpStatus.CONFLICT, "TAP_CODE_ALREADY_CLAIMED");
            }
            // One setup for the whole kit: a trio of tags is linked by tapping any one of them
            int siblings = tap.getKitCode() != null
                    ? tapCodeRepository.claimKitIfUnclaimed(tap.getKitCode(), orgId, propertyId, userId, now) : 0;
            log.info("GuestPageService.claim — code={} (+{} kit codes) claimed by org={} property={}", code, siblings, orgId, propertyId);
        } else if (tap.getOrganizationId().equals(orgId)) {
            if (tap.getKitCode() != null) {
                tapCodeRepository.moveKit(tap.getKitCode(), orgId, propertyId);
            } else {
                tap.setPropertyId(propertyId);
                tapCodeRepository.save(tap);
            }
            log.info("GuestPageService.claim — code={} (kit={}) moved to property={}", code, tap.getKitCode(), propertyId);
        } else {
            log.warn("GuestPageService.claim — code={} already claimed by another org, requested by org={}", code, orgId);
            throw new AppException("This stand is already linked to another Propvian account",
                    HttpStatus.CONFLICT, "TAP_CODE_ALREADY_CLAIMED");
        }
        GuestPage page = guestPageRepository.findByPropertyId(propertyId).orElseGet(() -> createDefault(property));
        return toHostResponse(page, property);
    }

    // ── Public ──────────────────────────────────────────────────────────────

    @Transactional
    public PublicGuestPageResponse resolvePublic(String rawCode, String sourceParam, boolean countView, String clientKey) {
        String code = tapCodeService.normalize(rawCode);
        TapCode tap = tapCodeRepository.findById(code)
                .orElseThrow(() -> new AppException("Guest page not found", HttpStatus.NOT_FOUND, "GUEST_PAGE_NOT_FOUND"));
        TapSource source = TapSource.fromParam(sourceParam);

        if (tap.getPropertyId() == null) {
            if (countView) record(code, null, GuestPageEventType.VIEW, source, clientKey);
            return PublicGuestPageResponse.builder().status(PublicGuestPageResponse.UNCLAIMED).code(code).build();
        }
        Property property = propertyRepository.findById(tap.getPropertyId()).orElse(null);
        GuestPage page = property == null ? null : guestPageRepository.findByPropertyId(property.getId()).orElse(null);
        if (property == null || page == null || !page.isEnabled()) {
            return PublicGuestPageResponse.builder().status(PublicGuestPageResponse.INACTIVE).code(code).build();
        }
        if (countView) record(code, property.getId(), GuestPageEventType.VIEW, source, clientKey);
        return toPublicResponse(page, property, code);
    }

    /** Clicks reported by the guest page. Views are counted when the page is fetched, not here. */
    @Transactional
    public void recordPublicEvent(String rawCode, String type, String clientKey) {
        GuestPageEventType eventType;
        try {
            eventType = GuestPageEventType.valueOf(type.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return;
        }
        if (eventType == GuestPageEventType.VIEW) return;
        String code = tapCodeService.normalize(rawCode);
        tapCodeRepository.findById(code)
                .ifPresent(tap -> record(code, tap.getPropertyId(), eventType, null, clientKey));
    }

    // ── Building responses ──────────────────────────────────────────────────

    private GuestPageResponse toHostResponse(GuestPage page, Property property) {
        List<TapCode> codes = new ArrayList<>(tapCodeRepository.findByPropertyIdOrderByCreatedAtAsc(property.getId()));
        TapCode own = codes.stream().filter(c -> c.getKind() == TapCodeKind.PROPERTY).findFirst().orElse(null);
        if (own == null) {
            own = tapCodeService.issuePropertyCode(property.getOrganizationId(), property.getId());
            codes.add(own);
        }
        // The page's own code first, then linked stands in the order they were linked
        codes.sort(Comparator.comparing((TapCode c) -> c.getKind() != TapCodeKind.PROPERTY)
                .thenComparing(c -> c.getClaimedAt() != null ? c.getClaimedAt() : c.getCreatedAt(),
                        Comparator.nullsLast(Comparator.naturalOrder())));
        Map<String, Long> views = new HashMap<>();
        for (Object[] row : eventRepository.countViewsByCode(property.getId(), daysAgo(30))) {
            views.put((String) row[0], ((Number) row[1]).longValue());
        }
        WebsiteConfig wc = websiteConfigRepository.findByOrganizationId(property.getOrganizationId()).orElse(null);
        return GuestPageResponse.builder()
                .id(page.getId())
                .propertyId(property.getId())
                .propertyName(property.getName())
                .enabled(page.isEnabled())
                .welcomeMessage(page.getWelcomeMessage())
                .wifiSsid(page.getWifiSsid())
                .wifiPassword(page.getWifiPassword())
                .wifiSecurity(page.getWifiSecurity())
                .wifiHidden(page.isWifiHidden())
                .legacyWifiDetails(property.getWifiDetails())
                .sections(readSections(page.getSections()))
                .houseRules(houseRules(property.getId()))
                .checkInTime(property.getCheckInTime())
                .checkOutTime(property.getCheckOutTime())
                .heroImageUrl(heroImage(property))
                .contactName(page.getContactName())
                .contactPhone(page.getContactPhone())
                .contactWhatsapp(page.isContactWhatsapp())
                .contactEmail(page.getContactEmail())
                .bookDirectEnabled(page.isBookDirectEnabled())
                .bookDirectMessage(page.getBookDirectMessage())
                .bookDirectPromoCode(page.getBookDirectPromoCode())
                .bookDirectUrl(page.getBookDirectUrl())
                .bookDirectHideAirbnb(page.isBookDirectHideAirbnb())
                .defaultBookDirectUrl(defaultBookingUrl(property))
                .showPoweredBy(showsPoweredBy(page))
                .canHideBranding(paying(property.getOrganizationId()))
                .brandColor(brandColor(wc))
                .code(own.getCode())
                .publicUrl(tapCodeService.publicUrl(own.getCode()))
                .codes(codes.stream().map(c -> tapCodeService.toResponse(c, views.getOrDefault(c.getCode(), 0L))).toList())
                .updatedAt(page.getUpdatedAt())
                .build();
    }

    private PublicGuestPageResponse toPublicResponse(GuestPage page, Property property, String code) {
        WebsiteConfig wc = websiteConfigRepository.findByOrganizationId(property.getOrganizationId()).orElse(null);
        Organization org = organizationRepository.findById(property.getOrganizationId()).orElse(null);
        String brandName = wc != null && notBlank(wc.getBrandName()) ? wc.getBrandName() : (org != null ? org.getName() : null);

        PublicGuestPageResponse.Wifi wifi = notBlank(page.getWifiSsid())
                ? PublicGuestPageResponse.Wifi.builder()
                    .ssid(page.getWifiSsid())
                    .password("nopass".equals(page.getWifiSecurity()) ? null : page.getWifiPassword())
                    .security(page.getWifiSecurity())
                    .hidden(page.isWifiHidden())
                    .build()
                : null;

        // Empty sections stay in the editor as prompts but aren't shown to guests.
        // House rules are the exception: the property's structured rules fill them.
        List<GuestPageSectionDto> sections = readSections(page.getSections()).stream()
                .filter(s -> "HOUSE_RULES".equals(s.getType()) || notBlank(s.getBody()))
                .toList();

        return PublicGuestPageResponse.builder()
                .status(PublicGuestPageResponse.ACTIVE)
                .code(code)
                .propertyName(property.getName())
                .city(property.getCity())
                .country(property.getCountry())
                .heroImageUrl(heroImage(property))
                .brandName(brandName)
                .brandColor(brandColor(wc))
                .welcomeMessage(page.getWelcomeMessage())
                .wifi(wifi)
                .checkInTime(property.getCheckInTime())
                .checkOutTime(property.getCheckOutTime())
                .sections(sections)
                .houseRules(houseRules(property.getId()))
                .contact(contact(page))
                .bookDirect(bookDirect(page, property))
                .showPoweredBy(showsPoweredBy(page))
                .build();
    }

    private PublicGuestPageResponse.BookDirect bookDirect(GuestPage page, Property property) {
        if (!page.isBookDirectEnabled()) return null;
        // Airbnb's Off-Platform Policy bans encouraging repeat bookings off Airbnb and
        // offering discounts to do so. Withhold the offer while an Airbnb stay is on.
        if (page.isBookDirectHideAirbnb()
                && reservationRepository.existsAirbnbStayInProgress(property.getId(), Instant.now())) {
            log.debug("GuestPageService.bookDirect — hidden during Airbnb stay property={}", property.getId());
            return null;
        }
        String url = notBlank(page.getBookDirectUrl()) ? page.getBookDirectUrl() : defaultBookingUrl(property);
        if (url == null) return null;
        PromoCode promo = activePromo(property.getOrganizationId(), page.getBookDirectPromoCode());
        return PublicGuestPageResponse.BookDirect.builder()
                .url(url)
                .message(notBlank(page.getBookDirectMessage()) ? page.getBookDirectMessage() : DEFAULT_BOOK_DIRECT_MESSAGE)
                .promoCode(promo != null ? promo.getCode() : null)
                .discountLabel(promo != null ? discountLabel(promo, property.getCurrency()) : null)
                .build();
    }

    /** The host's Propvian booking page: custom domain first, then their subdomain, then the path route. */
    private String defaultBookingUrl(Property property) {
        if (!notBlank(property.getSlug())) return null;
        HostVerification v = verificationRepository.findByOrganizationId(property.getOrganizationId()).orElse(null);
        if (v != null && v.getDomainStatus() == VerificationStatus.APPROVED
                && notBlank(v.getCustomDomain()) && !v.getCustomDomain().endsWith(".propvian.com")) {
            return "https://" + v.getCustomDomain() + "/property/" + property.getSlug();
        }
        Organization org = organizationRepository.findById(property.getOrganizationId()).orElse(null);
        if (org != null && notBlank(org.getSlug())) {
            return "https://" + org.getSlug() + ".propvian.com/property/" + property.getSlug();
        }
        return frontendUrl + "/book/" + property.getSlug();
    }

    private PublicGuestPageResponse.Contact contact(GuestPage page) {
        if (!notBlank(page.getContactName()) && !notBlank(page.getContactPhone()) && !notBlank(page.getContactEmail())) {
            return null;
        }
        return PublicGuestPageResponse.Contact.builder()
                .name(page.getContactName())
                .phone(page.getContactPhone())
                .whatsapp(page.isContactWhatsapp() && notBlank(page.getContactPhone()))
                .email(page.getContactEmail())
                .build();
    }

    private List<PublicGuestPageResponse.HouseRule> houseRules(UUID propertyId) {
        return houseRuleRepository.findByPropertyId(propertyId).stream()
                .sorted(Comparator.comparingInt((PropertyHouseRule r) -> {
                    int i = RULE_ORDER.indexOf(r.getRuleKey());
                    return i < 0 ? RULE_ORDER.size() : i;
                }))
                .map(r -> new PublicGuestPageResponse.HouseRule(r.getRuleKey(), r.isAllowed(), r.getNotes()))
                .toList();
    }

    private String heroImage(Property property) {
        List<PropertyPhoto> photos = photoRepository.findByPropertyIdOrderBySortOrderAsc(property.getId());
        return photos.stream().filter(PropertyPhoto::isPrimary).findFirst()
                .or(() -> photos.stream().findFirst())
                .map(PropertyPhoto::getUrl)
                .orElse(property.getImageUrl());
    }

    /** The footer is what pays for the free guest page, so only a paying host can hide it. */
    private boolean showsPoweredBy(GuestPage page) {
        return page.isShowPoweredBy() || !paying(page.getOrganizationId());
    }

    private boolean paying(UUID orgId) {
        return subscriptionRepository.findByOrganizationId(orgId).map(billingService::isPaidActive).orElse(false);
    }

    private String brandColor(WebsiteConfig wc) {
        String c = wc != null ? wc.getPrimaryColor() : null;
        return c != null && HEX_COLOR.matcher(c).matches() ? c : DEFAULT_BRAND_COLOR;
    }

    // ── Creating and validating ─────────────────────────────────────────────

    private GuestPage createDefault(Property property) {
        String[] wifi = parseLegacyWifi(property.getWifiDetails());
        GuestPage page = guestPageRepository.save(GuestPage.builder()
                .organizationId(property.getOrganizationId())
                .propertyId(property.getId())
                .welcomeMessage("Welcome to " + property.getName() + "! We hope you have a wonderful stay. "
                        + "Everything you need should be on this page. If anything is missing, just get in touch.")
                .wifiSsid(wifi[0])
                .wifiPassword(wifi[1])
                .sections(writeSections(defaultSections(property)))
                .bookDirectMessage(DEFAULT_BOOK_DIRECT_MESSAGE)
                .build());
        if (tapCodeRepository.findFirstByPropertyIdAndKindOrderByCreatedAtAsc(property.getId(), TapCodeKind.PROPERTY).isEmpty()) {
            tapCodeService.issuePropertyCode(property.getOrganizationId(), property.getId());
        }
        log.info("GuestPageService.createDefault — property={} wifiPrefilled={}", property.getId(), wifi[0] != null);
        return page;
    }

    // Arrival text deliberately says nothing about access: door and lockbox codes
    // belong on the per-booking check-in page, never on a page past guests can reopen.
    private List<GuestPageSectionDto> defaultSections(Property property) {
        String in = notBlank(property.getCheckInTime()) ? property.getCheckInTime() : "15:00";
        String out = notBlank(property.getCheckOutTime()) ? property.getCheckOutTime() : "11:00";
        return List.of(
                new GuestPageSectionDto(shortId(), "CHECKIN", "Arrival",
                        "Check-in is from " + in + ". If you'll arrive late, just let us know."),
                new GuestPageSectionDto(shortId(), "HOUSE_RULES", "House rules",
                        "Please treat our home as your own and keep the noise down for the neighbours."),
                new GuestPageSectionDto(shortId(), "CHECKOUT", "Before you leave",
                        "Check-out is by " + out + ". Before you go, please:\n"
                                + "• put used dishes in the dishwasher\n"
                                + "• take the rubbish out\n"
                                + "• switch off lights, heating and air conditioning\n"
                                + "• leave the keys where you found them\n"
                                + "Thank you, and safe travels!"),
                new GuestPageSectionDto(shortId(), "LOCAL_TIPS", "Local tips", null));
    }

    /** Pulls a network name and password out of the property's free-text WiFi note, when it's unambiguous. */
    static String[] parseLegacyWifi(String details) {
        String ssid = null;
        String password = null;
        if (details != null) {
            // Commas and semicolons only split when followed by a space: passwords may contain them
            for (String fragment : details.split("\\r?\\n|\\s[|/]\\s|[,;]\\s")) {
                String f = fragment.trim();
                Matcher name = WIFI_NAME.matcher(f);
                Matcher pass = WIFI_PASSWORD.matcher(f);
                if (ssid == null && name.matches()) ssid = name.group(1).trim();
                else if (password == null && pass.matches()) password = pass.group(1).trim();
            }
        }
        if (ssid != null && ssid.length() > 32) ssid = null;
        if (password != null && password.length() > 63) password = null;
        return new String[]{ssid, password};
    }

    private void validateWifi(GuestPage page) {
        if ("nopass".equals(page.getWifiSecurity())) {
            page.setWifiPassword(null);
            return;
        }
        if (page.getWifiSsid() == null && page.getWifiPassword() != null) {
            throw new AppException("Add the WiFi network name as well as the password", HttpStatus.BAD_REQUEST, "WIFI_SSID_REQUIRED");
        }
        if ("WPA".equals(page.getWifiSecurity()) && page.getWifiPassword() != null && page.getWifiPassword().length() < 8) {
            throw new AppException("WPA passwords are at least 8 characters. Check it against your router.",
                    HttpStatus.BAD_REQUEST, "WIFI_PASSWORD_TOO_SHORT");
        }
    }

    /** Refuses a promo code that doesn't exist, so a dead code never gets printed or shown. */
    private String requireKnownPromo(UUID orgId, String code) {
        if (code == null) return null;
        return promoCodeRepository.findByOrganizationIdAndCodeIgnoreCase(orgId, code)
                .map(PromoCode::getCode)
                .orElseThrow(() -> new AppException(
                        "There's no promo code \"" + code + "\" yet. Create it in the Website builder first.",
                        HttpStatus.BAD_REQUEST, "PROMO_NOT_FOUND"));
    }

    private PromoCode activePromo(UUID orgId, String code) {
        if (!notBlank(code)) return null;
        return promoCodeRepository.findByOrganizationIdAndCodeIgnoreCase(orgId, code)
                .filter(PromoCode::isActive)
                .filter(p -> p.getExpiresAt() == null || p.getExpiresAt().isAfter(Instant.now()))
                .filter(p -> p.getMaxUses() == null || p.getUsesCount() < p.getMaxUses())
                .orElse(null);
    }

    private static String discountLabel(PromoCode promo, String currency) {
        BigDecimal v = promo.getDiscountValue().stripTrailingZeros();
        return "PERCENT".equalsIgnoreCase(promo.getDiscountType())
                ? v.toPlainString() + "% off"
                : v.toPlainString() + " " + (currency != null ? currency : "") + " off";
    }

    private List<GuestPageSectionDto> normalizeSections(List<GuestPageSectionDto> sections) {
        return sections.stream()
                .map(s -> new GuestPageSectionDto(
                        notBlank(s.getId()) ? s.getId() : shortId(),
                        s.getType(),
                        s.getTitle().trim(),
                        trimToNull(s.getBody())))
                .toList();
    }

    private Property requireOwnedProperty(UUID orgId, UUID propertyId) {
        return propertyRepository.findById(propertyId)
                .filter(p -> p.getOrganizationId().equals(orgId))
                .orElseThrow(() -> new AppException("Property not found", HttpStatus.NOT_FOUND, "PROPERTY_NOT_FOUND"));
    }

    private void record(String code, UUID propertyId, GuestPageEventType type, TapSource source, String clientKey) {
        if (!throttle.allow(clientKey + "|" + code + "|" + type)) return;
        eventRepository.save(GuestPageEvent.builder()
                .code(code)
                .propertyId(propertyId)
                .eventType(type)
                .source(source)
                .build());
    }

    // ── JSON and string helpers ─────────────────────────────────────────────

    private List<GuestPageSectionDto> readSections(String json) {
        try {
            return json == null ? List.of() : objectMapper.readValue(json, SECTIONS_TYPE);
        } catch (JsonProcessingException e) {
            log.error("GuestPageService.readSections — unreadable sections JSON, showing none", e);
            return List.of();
        }
    }

    private String writeSections(List<GuestPageSectionDto> sections) {
        try {
            return objectMapper.writeValueAsString(sections);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Could not serialise guest page sections", e);
        }
    }

    private static Instant daysAgo(int days) {
        return Instant.now().minus(days, ChronoUnit.DAYS);
    }

    private static String shortId() {
        return UUID.randomUUID().toString().substring(0, 8);
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }

    private static String trimToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private static String emptyToNull(String s) {
        return s == null || s.isEmpty() ? null : s;
    }
}
