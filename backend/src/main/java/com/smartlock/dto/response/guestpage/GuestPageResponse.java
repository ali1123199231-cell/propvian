package com.smartlock.dto.response.guestpage;

import com.smartlock.dto.request.guestpage.GuestPageSectionDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** The host's editable view of a guest page. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuestPageResponse {
    private UUID id;
    private UUID propertyId;
    private String propertyName;
    private boolean enabled;

    private String welcomeMessage;
    private String wifiSsid;
    private String wifiPassword;
    private String wifiSecurity;
    private boolean wifiHidden;
    // The free-text WiFi note from the property settings, shown as a hint when it couldn't be parsed
    private String legacyWifiDetails;

    private List<GuestPageSectionDto> sections;
    private List<PublicGuestPageResponse.HouseRule> houseRules;
    private String checkInTime;
    private String checkOutTime;
    private String heroImageUrl;

    private String contactName;
    private String contactPhone;
    private boolean contactWhatsapp;
    private String contactEmail;

    private boolean bookDirectEnabled;
    private String bookDirectMessage;
    private String bookDirectPromoCode;
    private String bookDirectUrl;
    private boolean bookDirectHideAirbnb;
    // Where "Book direct" goes when no override is set: the host's Propvian booking site
    private String defaultBookDirectUrl;

    private boolean showPoweredBy;
    // Hiding the footer is a paid-plan perk
    private boolean canHideBranding;
    private String brandColor;

    private String code;
    private String publicUrl;
    private List<TapCodeResponse> codes;

    private Instant updatedAt;
}
