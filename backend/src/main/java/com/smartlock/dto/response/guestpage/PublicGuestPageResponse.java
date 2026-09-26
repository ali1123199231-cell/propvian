package com.smartlock.dto.response.guestpage;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.smartlock.dto.request.guestpage.GuestPageSectionDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** What a guest sees after tapping or scanning. Never carries door or lockbox codes. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PublicGuestPageResponse {

    public static final String ACTIVE    = "ACTIVE";
    public static final String UNCLAIMED = "UNCLAIMED";
    public static final String INACTIVE  = "INACTIVE";

    private String status;
    private String code;

    private String propertyName;
    private String city;
    private String country;
    private String heroImageUrl;
    private String brandName;
    private String brandColor;

    private String welcomeMessage;
    private Wifi wifi;
    private String checkInTime;
    private String checkOutTime;
    private List<GuestPageSectionDto> sections;
    private List<HouseRule> houseRules;
    private Contact contact;
    private BookDirect bookDirect;
    private Boolean showPoweredBy;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class Wifi {
        private String ssid;
        private String password;
        private String security;
        private boolean hidden;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class HouseRule {
        private String key;
        private boolean allowed;
        private String notes;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Contact {
        private String name;
        private String phone;
        private boolean whatsapp;
        private String email;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class BookDirect {
        private String url;
        private String message;
        private String promoCode;
        private String discountLabel;   // "10% off", "20 EUR off"
    }
}
