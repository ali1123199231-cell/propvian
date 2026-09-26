package com.smartlock.dto.request.guestpage;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/**
 * Full replacement of the editable fields: text fields left null are cleared,
 * Boolean fields left null keep their current value.
 */
@Data
public class UpdateGuestPageRequest {

    private Boolean enabled;

    @Size(max = 2000)
    private String welcomeMessage;

    // An SSID is at most 32 bytes and a WPA passphrase at most 63 characters
    @Size(max = 32)
    private String wifiSsid;

    @Size(max = 63)
    private String wifiPassword;

    @Pattern(regexp = "WPA|WEP|nopass")
    private String wifiSecurity;

    private Boolean wifiHidden;

    @Valid
    @Size(max = 20)
    private List<GuestPageSectionDto> sections;

    @Size(max = 100)
    private String contactName;

    @Size(max = 40)
    @Pattern(regexp = "^[+0-9 ()\\-]*$", message = "Phone may contain digits, spaces, +, - and brackets only")
    private String contactPhone;

    private Boolean contactWhatsapp;

    @Email
    @Size(max = 255)
    private String contactEmail;

    private Boolean bookDirectEnabled;

    @Size(max = 300)
    private String bookDirectMessage;

    @Size(max = 50)
    private String bookDirectPromoCode;

    @Size(max = 500)
    @Pattern(regexp = "^(https?://\\S+)?$", message = "Must be a full http(s) link")
    private String bookDirectUrl;

    private Boolean bookDirectHideAirbnb;

    private Boolean showPoweredBy;
}
