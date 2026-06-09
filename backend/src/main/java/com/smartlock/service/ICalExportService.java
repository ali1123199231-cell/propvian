package com.smartlock.service;

import com.smartlock.domain.DirectBooking;
import com.smartlock.domain.Property;
import com.smartlock.domain.enums.DirectBookingStatus;
import com.smartlock.exception.AppException;
import com.smartlock.repository.DirectBookingRepository;
import com.smartlock.repository.PropertyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ICalExportService {

    private final PropertyRepository propertyRepository;
    private final DirectBookingRepository directBookingRepository;

    private static final DateTimeFormatter ICAL_DATE = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final DateTimeFormatter ICAL_DATETIME = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'");

    @Transactional(readOnly = true)
    public String exportByToken(String token) {
        log.debug("ICalExportService.exportByToken — tokenPrefix={}...", token.length() > 8 ? token.substring(0, 8) : token);
        Property property = propertyRepository.findByIcalExportToken(token)
                .orElseThrow(() -> new AppException("Calendar feed not found", HttpStatus.NOT_FOUND));
        log.info("ICalExportService.exportByToken — property={}", property.getId());
        return generateIcs(property);
    }

    @Transactional(readOnly = true)
    public String exportByPropertyId(UUID propertyId, UUID orgId) {
        log.debug("ICalExportService.exportByPropertyId — propertyId={} orgId={}", propertyId, orgId);
        Property property = propertyRepository.findById(propertyId)
                .filter(p -> p.getOrganizationId().equals(orgId))
                .orElseThrow(() -> new AppException("Property not found", HttpStatus.NOT_FOUND));

        // Auto-generate token if missing
        if (property.getIcalExportToken() == null) {
            property.setIcalExportToken(generateToken());
            propertyRepository.save(property);
            log.info("ICalExportService.exportByPropertyId — generated new token for property={}", propertyId);
        }

        return generateIcs(property);
    }

    @Transactional
    public String getOrCreateExportToken(UUID propertyId, UUID orgId) {
        log.debug("ICalExportService.getOrCreateExportToken — propertyId={} orgId={}", propertyId, orgId);
        Property property = propertyRepository.findById(propertyId)
                .filter(p -> p.getOrganizationId().equals(orgId))
                .orElseThrow(() -> new AppException("Property not found", HttpStatus.NOT_FOUND));

        if (property.getIcalExportToken() == null) {
            property.setIcalExportToken(generateToken());
            propertyRepository.save(property);
            log.info("ICalExportService.getOrCreateExportToken — created token for property={}", propertyId);
        }
        return property.getIcalExportToken();
    }

    @Transactional
    public String rotateExportToken(UUID propertyId, UUID orgId) {
        log.info("ICalExportService.rotateExportToken — propertyId={} orgId={}", propertyId, orgId);
        Property property = propertyRepository.findById(propertyId)
                .filter(p -> p.getOrganizationId().equals(orgId))
                .orElseThrow(() -> new AppException("Property not found", HttpStatus.NOT_FOUND));
        property.setIcalExportToken(generateToken());
        propertyRepository.save(property);
        log.info("ICalExportService.rotateExportToken — rotated token for property={}", propertyId);
        return property.getIcalExportToken();
    }

    private String generateIcs(Property property) {
        List<DirectBooking> bookings = directBookingRepository.findByPropertyId(property.getId()).stream()
                .filter(b -> b.getStatus() == DirectBookingStatus.CONFIRMED)
                .toList();
        log.debug("ICalExportService.generateIcs — property={} confirmedBookings={}", property.getId(), bookings.size());

        StringBuilder sb = new StringBuilder();
        sb.append("BEGIN:VCALENDAR\r\n");
        sb.append("VERSION:2.0\r\n");
        sb.append("PRODID:-//Propvian//Propvian Calendar//EN\r\n");
        sb.append("CALSCALE:GREGORIAN\r\n");
        sb.append("METHOD:PUBLISH\r\n");
        sb.append("X-WR-CALNAME:").append(escapeText(property.getName())).append("\r\n");
        sb.append("X-WR-TIMEZONE:UTC\r\n");

        for (DirectBooking b : bookings) {
            sb.append("BEGIN:VEVENT\r\n");
            sb.append("UID:propvian-").append(b.getId()).append("@propvian.com\r\n");

            String dtstamp = java.time.Instant.now().atZone(ZoneOffset.UTC).format(ICAL_DATETIME);
            sb.append("DTSTAMP:").append(dtstamp).append("\r\n");

            sb.append("DTSTART;VALUE=DATE:").append(b.getCheckInDate().format(ICAL_DATE)).append("\r\n");
            sb.append("DTEND;VALUE=DATE:").append(b.getCheckOutDate().format(ICAL_DATE)).append("\r\n");

            String summary = b.getGuestName() != null ? "Reserved – " + b.getGuestName() : "Reserved";
            sb.append("SUMMARY:").append(escapeText(summary)).append("\r\n");
            sb.append("STATUS:CONFIRMED\r\n");

            if (b.getGuestEmail() != null) {
                sb.append("DESCRIPTION:Guest: ").append(escapeText(b.getGuestEmail())).append("\r\n");
            }

            sb.append("TRANSP:OPAQUE\r\n");
            sb.append("END:VEVENT\r\n");
        }

        sb.append("END:VCALENDAR\r\n");
        return sb.toString();
    }

    private String escapeText(String text) {
        if (text == null) return "";
        return text.replace("\\", "\\\\")
                   .replace(";", "\\;")
                   .replace(",", "\\,")
                   .replace("\n", "\\n")
                   .replace("\r", "");
    }

    private String generateToken() {
        return UUID.randomUUID().toString().replace("-", "")
                + UUID.randomUUID().toString().replace("-", "");
    }
}
