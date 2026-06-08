package com.smartlock.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartlock.domain.PromoCode;
import com.smartlock.domain.WebsiteConfig;
import com.smartlock.domain.WebsiteSection;
import com.smartlock.dto.request.website.PromoCodeRequest;
import com.smartlock.dto.request.website.ReorderSectionsRequest;
import com.smartlock.dto.request.website.WebsiteConfigRequest;
import com.smartlock.dto.request.website.WebsiteSectionRequest;
import com.smartlock.dto.response.website.PromoCodeResponse;
import com.smartlock.dto.response.website.WebsiteConfigResponse;
import com.smartlock.dto.response.website.WebsiteSectionResponse;
import com.smartlock.domain.enums.PropertyStatus;
import com.smartlock.exception.AppException;
import com.smartlock.repository.PromoCodeRepository;
import com.smartlock.repository.PropertyRepository;
import com.smartlock.repository.WebsiteConfigRepository;
import com.smartlock.repository.WebsiteSectionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebsiteService {

    private final WebsiteConfigRepository websiteRepo;
    private final WebsiteSectionRepository sectionRepo;
    private final PromoCodeRepository promoRepo;
    private final PropertyRepository propertyRepo;
    private final OrganizationSecurityService orgSecurity;

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

    // ── Config ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public WebsiteConfigResponse getConfig(UUID orgId) {
        log.debug("WebsiteService.getConfig — orgId={}", orgId);
        orgSecurity.requireOrgAccess(orgId);
        WebsiteConfig config = websiteRepo.findByOrganizationId(orgId)
                .orElseGet(() -> {
                    log.info("WebsiteService.getConfig — no config yet, creating default for org={}", orgId);
                    return createDefaultConfig(orgId);
                });
        log.debug("WebsiteService.getConfig — status={} setupCompleted={}", config.getStatus(), config.isSetupCompleted());
        return toConfigResponse(config);
    }

    @Transactional
    public WebsiteConfigResponse updateConfig(UUID orgId, WebsiteConfigRequest req) {
        log.info("WebsiteService.updateConfig — orgId={}", orgId);
        orgSecurity.requireOrgAccess(orgId);
        if (Boolean.TRUE.equals(req.getSetupCompleted()) && propertyRepo.countByOrganizationIdAndStatus(orgId, PropertyStatus.ACTIVE) == 0) {
            throw new AppException("You must have at least one active property before completing website setup.", HttpStatus.BAD_REQUEST);
        }
        WebsiteConfig config = websiteRepo.findByOrganizationId(orgId)
                .orElseGet(() -> createDefaultConfig(orgId));

        if (req.getBrandName() != null)        config.setBrandName(req.getBrandName());
        if (req.getBrandLogoUrl() != null)     config.setBrandLogoUrl(req.getBrandLogoUrl());
        if (req.getPrimaryColor() != null)     config.setPrimaryColor(req.getPrimaryColor());
        if (req.getAccentColor() != null)      config.setAccentColor(req.getAccentColor());
        if (req.getFontFamily() != null)       config.setFontFamily(req.getFontFamily());
        if (req.getButtonStyle() != null)      config.setButtonStyle(req.getButtonStyle());
        if (req.getThemeStyle() != null)       config.setThemeStyle(req.getThemeStyle());
        if (req.getPageTitle() != null)        config.setPageTitle(req.getPageTitle());
        if (req.getMetaDescription() != null)  config.setMetaDescription(req.getMetaDescription());
        if (req.getOgImageUrl() != null)       config.setOgImageUrl(req.getOgImageUrl());
        if (req.getStickyBookButton() != null) config.setStickyBookButton(req.getStickyBookButton());
        if (req.getExitIntentEnabled() != null)  config.setExitIntentEnabled(req.getExitIntentEnabled());
        if (req.getExitIntentMessage() != null)  config.setExitIntentMessage(req.getExitIntentMessage());
        if (req.getExitIntentDiscount() != null) config.setExitIntentDiscount(req.getExitIntentDiscount());
        if (req.getCountdownEnabled() != null)   config.setCountdownEnabled(req.getCountdownEnabled());
        if (req.getCountdownMessage() != null)   config.setCountdownMessage(req.getCountdownMessage());
        if (req.getCountdownEndDate() != null) {
            try { config.setCountdownEndDate(Instant.parse(req.getCountdownEndDate())); } catch (Exception ignored) {}
        }
        if (req.getGaTrackingId() != null)     config.setGaTrackingId(req.getGaTrackingId());
        if (req.getGtmContainerId() != null)   config.setGtmContainerId(req.getGtmContainerId());
        if (req.getMetaPixelId() != null)      config.setMetaPixelId(req.getMetaPixelId());
        if (req.getTiktokPixelId() != null)    config.setTiktokPixelId(req.getTiktokPixelId());
        if (req.getDefaultLanguage() != null)  config.setDefaultLanguage(req.getDefaultLanguage());
        if (req.getEnabledLanguages() != null) config.setEnabledLanguages(req.getEnabledLanguages());
        if (req.getCustomCss() != null)        config.setCustomCss(req.getCustomCss());
        if (req.getCustomHeadJs() != null)     config.setCustomHeadJs(req.getCustomHeadJs());
        if (req.getCustomFooterJs() != null)   config.setCustomFooterJs(req.getCustomFooterJs());
        if (req.getSetupCompleted() != null)   config.setSetupCompleted(req.getSetupCompleted());

        WebsiteConfigResponse result = toConfigResponse(websiteRepo.save(config));
        log.info("WebsiteService.updateConfig — success orgId={}", orgId);
        return result;
    }

    @Transactional
    public WebsiteConfigResponse publishWebsite(UUID orgId) {
        log.info("WebsiteService.publishWebsite — orgId={}", orgId);
        orgSecurity.requireOrgAccess(orgId);
        if (propertyRepo.countByOrganizationIdAndStatus(orgId, PropertyStatus.ACTIVE) == 0) {
            log.warn("WebsiteService.publishWebsite — blocked: no active properties org={}", orgId);
            throw new AppException("You must have at least one active property before publishing your website.", HttpStatus.BAD_REQUEST);
        }
        WebsiteConfig config = websiteRepo.findByOrganizationId(orgId)
                .orElseThrow(() -> new AppException("Website not configured", HttpStatus.NOT_FOUND));
        config.setStatus("PUBLISHED");
        config.setSetupCompleted(true);
        WebsiteConfigResponse result = toConfigResponse(websiteRepo.save(config));
        log.info("WebsiteService.publishWebsite — published orgId={}", orgId);
        return result;
    }

    @Transactional
    public WebsiteConfigResponse unpublishWebsite(UUID orgId) {
        log.info("WebsiteService.unpublishWebsite — orgId={}", orgId);
        orgSecurity.requireOrgAccess(orgId);
        WebsiteConfig config = websiteRepo.findByOrganizationId(orgId)
                .orElseThrow(() -> new AppException("Website not configured", HttpStatus.NOT_FOUND));
        config.setStatus("DRAFT");
        WebsiteConfigResponse result = toConfigResponse(websiteRepo.save(config));
        log.info("WebsiteService.unpublishWebsite — unpublished orgId={}", orgId);
        return result;
    }

    // ── Sections ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<WebsiteSectionResponse> getSections(UUID orgId) {
        log.debug("WebsiteService.getSections — orgId={}", orgId);
        orgSecurity.requireOrgAccess(orgId);
        WebsiteConfig config = getOrCreateConfig(orgId);
        List<WebsiteSectionResponse> sections = sectionRepo.findByWebsiteIdOrderByPosition(config.getId())
                .stream().map(this::toSectionResponse).collect(Collectors.toList());
        log.debug("WebsiteService.getSections — got {} sections", sections.size());
        return sections;
    }

    @Transactional
    public WebsiteSectionResponse addSection(UUID orgId, WebsiteSectionRequest req) {
        log.info("WebsiteService.addSection — orgId={} type={} pos={}", orgId, req.getSectionType(), req.getPosition());
        orgSecurity.requireOrgAccess(orgId);
        WebsiteConfig config = getOrCreateConfig(orgId);
        long count = sectionRepo.countByWebsiteId(config.getId());

        WebsiteSection section = WebsiteSection.builder()
                .websiteId(config.getId())
                .sectionType(req.getSectionType())
                .title(req.getTitle())
                .enabled(req.getEnabled() != null ? req.getEnabled() : !"hero".equals(req.getSectionType()))
                .position(req.getPosition() != null ? req.getPosition() : (int) count)
                .config(req.getConfig() != null ? req.getConfig().toString() : defaultConfig(req.getSectionType()))
                .build();

        WebsiteSectionResponse result = toSectionResponse(sectionRepo.save(section));
        log.info("WebsiteService.addSection — created sectionId={}", result.getId());
        return result;
    }

    @Transactional
    public WebsiteSectionResponse updateSection(UUID orgId, UUID sectionId, WebsiteSectionRequest req) {
        log.debug("WebsiteService.updateSection — sectionId={} enabled={}", sectionId, req.getEnabled());
        orgSecurity.requireOrgAccess(orgId);
        WebsiteConfig config = getOrCreateConfig(orgId);
        WebsiteSection section = sectionRepo.findByIdAndWebsiteId(sectionId, config.getId())
                .orElseThrow(() -> new AppException("Section not found", HttpStatus.NOT_FOUND));

        if (req.getTitle() != null)   section.setTitle(req.getTitle());
        if (req.getEnabled() != null) section.setEnabled(req.getEnabled());
        if (req.getConfig() != null)  section.setConfig(req.getConfig().toString());
        if (req.getPosition() != null) section.setPosition(req.getPosition());

        return toSectionResponse(sectionRepo.save(section));
    }

    @Transactional
    public void deleteSection(UUID orgId, UUID sectionId) {
        log.info("WebsiteService.deleteSection — orgId={} sectionId={}", orgId, sectionId);
        orgSecurity.requireOrgAccess(orgId);
        WebsiteConfig config = getOrCreateConfig(orgId);
        WebsiteSection section = sectionRepo.findByIdAndWebsiteId(sectionId, config.getId())
                .orElseThrow(() -> new AppException("Section not found", HttpStatus.NOT_FOUND));
        sectionRepo.delete(section);
        log.info("WebsiteService.deleteSection — deleted");
    }

    @Transactional
    public List<WebsiteSectionResponse> reorderSections(UUID orgId, ReorderSectionsRequest req) {
        orgSecurity.requireOrgAccess(orgId);
        WebsiteConfig config = getOrCreateConfig(orgId);
        List<WebsiteSection> sections = sectionRepo.findByWebsiteIdOrderByPosition(config.getId());

        Map<UUID, WebsiteSection> sectionMap = sections.stream()
                .collect(Collectors.toMap(WebsiteSection::getId, s -> s));

        AtomicInteger pos = new AtomicInteger(0);
        List<WebsiteSection> toSave = new ArrayList<>();
        for (UUID id : req.getSectionIds()) {
            WebsiteSection s = sectionMap.get(id);
            if (s != null) {
                s.setPosition(pos.getAndIncrement());
                toSave.add(s);
            }
        }

        sectionRepo.saveAll(toSave);
        return sectionRepo.findByWebsiteIdOrderByPosition(config.getId())
                .stream().map(this::toSectionResponse).collect(Collectors.toList());
    }

    // ── Promo codes ───────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<PromoCodeResponse> getPromoCodes(UUID orgId) {
        log.debug("WebsiteService.getPromoCodes — orgId={}", orgId);
        orgSecurity.requireOrgAccess(orgId);
        List<PromoCodeResponse> codes = promoRepo.findByOrganizationIdOrderByCreatedAtDesc(orgId)
                .stream().map(this::toPromoResponse).collect(Collectors.toList());
        log.debug("WebsiteService.getPromoCodes — got {} codes", codes.size());
        return codes;
    }

    @Transactional
    public PromoCodeResponse createPromoCode(UUID orgId, PromoCodeRequest req) {
        log.info("WebsiteService.createPromoCode — orgId={} code={} type={} value={}",
                orgId, req.getCode(), req.getDiscountType(), req.getDiscountValue());
        orgSecurity.requireOrgAccess(orgId);
        if (promoRepo.existsByOrganizationIdAndCodeIgnoreCase(orgId, req.getCode())) {
            log.warn("WebsiteService.createPromoCode — duplicate code={} org={}", req.getCode(), orgId);
            throw new AppException("Promo code already exists", HttpStatus.CONFLICT);
        }
        PromoCode promo = PromoCode.builder()
                .organizationId(orgId)
                .code(req.getCode().toUpperCase())
                .discountType(req.getDiscountType())
                .discountValue(req.getDiscountValue())
                .minNights(req.getMinNights())
                .maxUses(req.getMaxUses())
                .active(req.getActive() != null ? req.getActive() : true)
                .build();
        if (req.getExpiresAt() != null) {
            try { promo.setExpiresAt(Instant.parse(req.getExpiresAt())); } catch (Exception ignored) {}
        }
        PromoCodeResponse result = toPromoResponse(promoRepo.save(promo));
        log.info("WebsiteService.createPromoCode — created id={} code={}", result.getId(), result.getCode());
        return result;
    }

    @Transactional
    public void deletePromoCode(UUID orgId, UUID codeId) {
        log.info("WebsiteService.deletePromoCode — orgId={} codeId={}", orgId, codeId);
        orgSecurity.requireOrgAccess(orgId);
        PromoCode promo = promoRepo.findById(codeId)
                .orElseThrow(() -> new AppException("Promo code not found", HttpStatus.NOT_FOUND));
        if (!promo.getOrganizationId().equals(orgId)) {
            log.warn("WebsiteService.deletePromoCode — access denied codeId={} org={}", codeId, orgId);
            throw new AppException("Access denied", HttpStatus.FORBIDDEN);
        }
        promoRepo.delete(promo);
        log.info("WebsiteService.deletePromoCode — deleted");
    }

    // ── AI content generation ─────────────────────────────────────────────────

    public Map<String, String> generateAiContent(UUID orgId, String type, String context) {
        log.info("WebsiteService.generateAiContent — orgId={} type={}", orgId, type);
        orgSecurity.requireOrgAccess(orgId);
        // Returns suggested starter content — clearly labelled as a template for the user to edit
        String label = "suggested_template";
        String content = switch (type) {
            case "description" -> "Welcome to our beautiful property! Nestled in a prime location, our " + context + " offers the perfect retreat for travelers seeking comfort and style. Enjoy modern amenities, breathtaking views, and personalized hospitality that makes every stay unforgettable.";
            case "headline" -> "Your Perfect " + context + " Getaway Awaits";
            case "seo_title" -> "Book Direct | " + context + " | Best Rates Guaranteed";
            case "seo_description" -> "Discover our stunning " + context + ". Book direct for the best rates and a personalized experience. Easy online booking, instant confirmation, and direct host communication.";
            case "faq" -> "[{\"q\":\"What time is check-in/check-out?\",\"a\":\"Check-in is at 3:00 PM and check-out is at 11:00 AM.\"},{\"q\":\"Is parking available?\",\"a\":\"Yes, free parking is available on the premises.\"},{\"q\":\"Is the property pet-friendly?\",\"a\":\"We welcome well-behaved pets with prior approval. A small pet fee may apply.\"}]";
            case "house_rules" -> "No smoking indoors. No parties or events. Quiet hours from 10 PM to 8 AM. Please treat the property with care and respect the neighbors.";
            default -> "";
        };
        return Map.of("content", content, "type", type, "source", label);
    }

    // ── Templates ─────────────────────────────────────────────────────────────

    @Transactional
    public WebsiteConfigResponse applyTemplate(UUID orgId, String templateId) {
        log.info("WebsiteService.applyTemplate — orgId={} template={}", orgId, templateId);
        orgSecurity.requireOrgAccess(orgId);
        WebsiteConfig config = getOrCreateConfig(orgId);

        // Apply template branding
        switch (templateId) {
            case "luxury-villa"    -> { config.setPrimaryColor("#B8860B"); config.setAccentColor("#FFD700"); config.setThemeStyle("luxury"); config.setFontFamily("Playfair Display"); }
            case "coastal-escape"  -> { config.setPrimaryColor("#0EA5E9"); config.setAccentColor("#F97316"); config.setThemeStyle("coastal"); config.setFontFamily("Lato"); }
            case "mountain-cabin"  -> { config.setPrimaryColor("#78350F"); config.setAccentColor("#D97706"); config.setThemeStyle("rustic"); config.setFontFamily("Merriweather"); }
            case "urban-loft"      -> { config.setPrimaryColor("#1C1917"); config.setAccentColor("#EF4444"); config.setThemeStyle("minimal"); config.setFontFamily("DM Sans"); }
            case "boutique-stay"   -> { config.setPrimaryColor("#7C3AED"); config.setAccentColor("#EC4899"); config.setThemeStyle("boutique"); config.setFontFamily("Cormorant"); }
            default                -> { config.setPrimaryColor("#6366F1"); config.setAccentColor("#F59E0B"); config.setThemeStyle("modern"); config.setFontFamily("Inter"); }
        }

        config = websiteRepo.save(config);

        // Reset sections to template defaults
        sectionRepo.deleteByWebsiteId(config.getId());
        createDefaultSections(config.getId(), templateId);

        return toConfigResponse(config);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private WebsiteConfig createDefaultConfig(UUID orgId) {
        WebsiteConfig config = WebsiteConfig.builder()
                .organizationId(orgId)
                .build();
        config = websiteRepo.save(config);
        createDefaultSections(config.getId(), "modern-minimal");
        return config;
    }

    private WebsiteConfig getOrCreateConfig(UUID orgId) {
        return websiteRepo.findByOrganizationId(orgId)
                .orElseGet(() -> createDefaultConfig(orgId));
    }

    private void createDefaultSections(UUID websiteId, String template) {
        List<String> types = switch (template) {
            case "luxury-villa"  -> List.of("hero", "gallery", "about", "amenities", "booking-widget", "reviews", "host-info", "location", "footer");
            case "coastal-escape"-> List.of("hero", "gallery", "about", "amenities", "booking-widget", "reviews", "nearby", "faq", "footer");
            case "mountain-cabin"-> List.of("hero", "gallery", "about", "amenities", "booking-widget", "house-rules", "reviews", "location", "footer");
            default              -> List.of("hero", "gallery", "about", "amenities", "booking-widget", "reviews", "faq", "house-rules", "contact", "footer");
        };

        List<WebsiteSection> sections = new ArrayList<>();
        for (int i = 0; i < types.size(); i++) {
            String sectionType = types.get(i);
            sections.add(WebsiteSection.builder()
                    .websiteId(websiteId)
                    .sectionType(sectionType)
                    .position(i)
                    .enabled(!sectionType.equals("hero"))
                    .config(defaultConfig(sectionType))
                    .build());
        }
        sectionRepo.saveAll(sections);
    }

    private String defaultConfig(String type) {
        return switch (type) {
            case "hero"           -> "{\"headline\":\"Welcome to Our Property\",\"subheadline\":\"Book direct for the best rates and a personal experience\",\"ctaText\":\"Check Availability\",\"overlayOpacity\":0.4,\"height\":\"large\"}";
            case "gallery"        -> "{\"columns\":3,\"lightbox\":true,\"showCaptions\":false}";
            case "about"          -> "{\"title\":\"About This Property\",\"description\":\"A beautiful and thoughtfully designed space for your perfect getaway. Every detail has been curated to ensure your comfort and enjoyment.\",\"imagePosition\":\"right\"}";
            case "amenities"      -> "{\"title\":\"Amenities\",\"layout\":\"grid\",\"columns\":4}";
            case "location"       -> "{\"title\":\"Location\",\"showMap\":true,\"description\":\"Perfectly situated for exploring the area.\"}";
            case "booking-widget" -> "{\"title\":\"Book Your Stay\",\"showPricing\":true,\"instantBooking\":true,\"checkInNote\":\"Check-in from 3:00 PM\",\"checkOutNote\":\"Check-out by 11:00 AM\"}";
            case "reviews"        -> "{\"title\":\"Guest Reviews\",\"layout\":\"grid\",\"showRating\":true}";
            case "faq"            -> "{\"title\":\"Frequently Asked Questions\",\"items\":[{\"q\":\"What is the check-in time?\",\"a\":\"Check-in is from 3:00 PM onwards.\"},{\"q\":\"Is parking available?\",\"a\":\"Yes, free parking is available.\"},{\"q\":\"Are pets allowed?\",\"a\":\"Please contact us for our pet policy.\"}]}";
            case "host-info"      -> "{\"title\":\"Your Host\",\"showContactButton\":true}";
            case "house-rules"    -> "{\"title\":\"House Rules\",\"rules\":[{\"icon\":\"🚫\",\"text\":\"No smoking\"},{\"icon\":\"🎉\",\"text\":\"No parties or events\"},{\"icon\":\"🌙\",\"text\":\"Quiet hours: 10 PM - 8 AM\"},{\"icon\":\"🐾\",\"text\":\"No pets without approval\"}]}";
            case "cta"            -> "{\"title\":\"Ready to Book?\",\"subtitle\":\"Secure your dates now for the best rates\",\"buttonText\":\"Book Direct & Save\",\"style\":\"primary\"}";
            case "contact"        -> "{\"title\":\"Get in Touch\",\"subtitle\":\"Have questions? We'd love to hear from you.\",\"showPhone\":true,\"showEmail\":true}";
            case "nearby"         -> "{\"title\":\"Nearby Attractions\",\"items\":[{\"name\":\"City Center\",\"category\":\"Culture\",\"distance\":\"2 km\"},{\"name\":\"Main Beach\",\"category\":\"Nature\",\"distance\":\"500 m\"},{\"name\":\"Local Market\",\"category\":\"Shopping\",\"distance\":\"1 km\"}]}";
            case "special-offers" -> "{\"title\":\"Special Offers\",\"offers\":[{\"title\":\"Early Bird Discount\",\"description\":\"Book 30+ days in advance\",\"discount\":\"15%\",\"validUntil\":\"Dec 31\"}]}";
            case "video"          -> "{\"title\":\"Experience Our Property\",\"videoUrl\":\"\",\"caption\":\"A virtual tour of your home away from home\"}";
            case "footer"         -> "{\"copyright\":\"All rights reserved\",\"links\":[{\"label\":\"Terms\",\"url\":\"/terms\"},{\"label\":\"Privacy\",\"url\":\"/privacy\"}],\"socials\":[]}";
            default               -> "{}";
        };
    }

    // ── Mappers ───────────────────────────────────────────────────────────────

    private WebsiteConfigResponse toConfigResponse(WebsiteConfig c) {
        return WebsiteConfigResponse.builder()
                .id(c.getId())
                .organizationId(c.getOrganizationId())
                .status(c.getStatus())
                .setupCompleted(c.isSetupCompleted())
                .brandName(c.getBrandName())
                .brandLogoUrl(c.getBrandLogoUrl())
                .primaryColor(c.getPrimaryColor())
                .accentColor(c.getAccentColor())
                .fontFamily(c.getFontFamily())
                .buttonStyle(c.getButtonStyle())
                .themeStyle(c.getThemeStyle())
                .pageTitle(c.getPageTitle())
                .metaDescription(c.getMetaDescription())
                .ogImageUrl(c.getOgImageUrl())
                .stickyBookButton(c.isStickyBookButton())
                .exitIntentEnabled(c.isExitIntentEnabled())
                .exitIntentMessage(c.getExitIntentMessage())
                .exitIntentDiscount(c.getExitIntentDiscount())
                .countdownEnabled(c.isCountdownEnabled())
                .countdownEndDate(c.getCountdownEndDate())
                .countdownMessage(c.getCountdownMessage())
                .gaTrackingId(c.getGaTrackingId())
                .gtmContainerId(c.getGtmContainerId())
                .metaPixelId(c.getMetaPixelId())
                .tiktokPixelId(c.getTiktokPixelId())
                .defaultLanguage(c.getDefaultLanguage())
                .enabledLanguages(c.getEnabledLanguages())
                .customCss(c.getCustomCss())
                .customHeadJs(c.getCustomHeadJs())
                .customFooterJs(c.getCustomFooterJs())
                .sections(sectionRepo.findByWebsiteIdOrderByPosition(c.getId())
                        .stream().map(this::toSectionResponse).collect(Collectors.toList()))
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private WebsiteSectionResponse toSectionResponse(WebsiteSection s) {
        return WebsiteSectionResponse.builder()
                .id(s.getId())
                .websiteId(s.getWebsiteId())
                .sectionType(s.getSectionType())
                .title(s.getTitle())
                .enabled(s.isEnabled())
                .position(s.getPosition())
                .config(parseConfig(s.getConfig()))
                .createdAt(s.getCreatedAt())
                .updatedAt(s.getUpdatedAt())
                .build();
    }

    private PromoCodeResponse toPromoResponse(PromoCode p) {
        return PromoCodeResponse.builder()
                .id(p.getId())
                .code(p.getCode())
                .discountType(p.getDiscountType())
                .discountValue(p.getDiscountValue())
                .minNights(p.getMinNights())
                .maxUses(p.getMaxUses())
                .usesCount(p.getUsesCount())
                .expiresAt(p.getExpiresAt())
                .active(p.isActive())
                .createdAt(p.getCreatedAt())
                .build();
    }
}
