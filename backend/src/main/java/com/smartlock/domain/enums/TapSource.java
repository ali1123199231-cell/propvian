package com.smartlock.domain.enums;

/** How a guest page was opened. NFC tags and printed QR codes carry different ?s= markers. */
public enum TapSource {
    NFC,
    QR,
    LINK;

    public static TapSource fromParam(String s) {
        if (s == null) return LINK;
        return switch (s.trim().toLowerCase()) {
            case "n", "nfc" -> NFC;
            case "q", "qr"  -> QR;
            default         -> LINK;
        };
    }
}
