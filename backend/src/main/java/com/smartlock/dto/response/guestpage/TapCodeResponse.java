package com.smartlock.dto.response.guestpage;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TapCodeResponse {
    private String code;
    private String kind;          // PROPERTY | PRODUCT
    private String url;           // plain link
    private String qrUrl;         // what a printed QR code should encode
    private String nfcUrl;        // what an NFC tag should hold
    private String batchLabel;
    private Instant claimedAt;
    private long views30d;
}
