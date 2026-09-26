package com.smartlock.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "guest_pages")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GuestPage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "property_id", nullable = false, unique = true)
    private UUID propertyId;

    @Column(nullable = false)
    @Builder.Default
    private boolean enabled = true;

    @Column(name = "welcome_message", columnDefinition = "text")
    private String welcomeMessage;

    @Column(name = "wifi_ssid", length = 64)
    private String wifiSsid;

    @Column(name = "wifi_password", length = 128)
    private String wifiPassword;

    // WPA | WEP | nopass — the values the WIFI: QR format uses
    @Column(name = "wifi_security", nullable = false, length = 10)
    @Builder.Default
    private String wifiSecurity = "WPA";

    @Column(name = "wifi_hidden", nullable = false)
    @Builder.Default
    private boolean wifiHidden = false;

    // JSON array of {id, type, title, body}
    @Column(columnDefinition = "text", nullable = false)
    @Builder.Default
    private String sections = "[]";

    @Column(name = "contact_name", length = 100)
    private String contactName;

    @Column(name = "contact_phone", length = 40)
    private String contactPhone;

    @Column(name = "contact_whatsapp", nullable = false)
    @Builder.Default
    private boolean contactWhatsapp = false;

    @Column(name = "contact_email", length = 255)
    private String contactEmail;

    @Column(name = "book_direct_enabled", nullable = false)
    @Builder.Default
    private boolean bookDirectEnabled = false;

    @Column(name = "book_direct_message", length = 300)
    private String bookDirectMessage;

    @Column(name = "book_direct_promo_code", length = 50)
    private String bookDirectPromoCode;

    // Overrides the Propvian booking site, for hosts whose direct site lives elsewhere
    @Column(name = "book_direct_url", length = 500)
    private String bookDirectUrl;

    @Column(name = "book_direct_hide_airbnb", nullable = false)
    @Builder.Default
    private boolean bookDirectHideAirbnb = true;

    @Column(name = "show_powered_by", nullable = false)
    @Builder.Default
    private boolean showPoweredBy = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
