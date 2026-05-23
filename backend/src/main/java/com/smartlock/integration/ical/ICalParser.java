package com.smartlock.integration.ical;

import com.smartlock.integration.ical.dto.ParsedReservation;
import lombok.extern.slf4j.Slf4j;
import net.fortuna.ical4j.data.CalendarBuilder;
import net.fortuna.ical4j.model.Calendar;
import net.fortuna.ical4j.model.Component;
import net.fortuna.ical4j.model.Property;
import net.fortuna.ical4j.model.component.VEvent;
import net.fortuna.ical4j.model.property.*;

import java.io.StringReader;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@org.springframework.stereotype.Component
@Slf4j
public class ICalParser {

    public List<ParsedReservation> parse(String icalContent) {
        List<ParsedReservation> reservations = new ArrayList<>();

        try {
            System.setProperty("ical4j.unfolding.relaxed", "true");
            System.setProperty("ical4j.parsing.relaxed", "true");
            System.setProperty("ical4j.compatibility.outlook", "true");

            CalendarBuilder builder = new CalendarBuilder();
            Calendar calendar = builder.build(new StringReader(icalContent));

            for (net.fortuna.ical4j.model.Component component : calendar.getComponents(Component.VEVENT)) {
                VEvent event = (VEvent) component;
                try {
                    ParsedReservation reservation = parseEvent(event);
                    if (reservation != null) {
                        reservations.add(reservation);
                    }
                } catch (Exception e) {
                    log.warn("Failed to parse VEVENT: {}", e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse iCal content: {}", e.getMessage());
        }

        return reservations;
    }

    private ParsedReservation parseEvent(VEvent event) {
        String uid = Optional.ofNullable(event.getUid())
                .map(Uid::getValue)
                .orElse(null);

        if (uid == null) {
            return null;
        }

        Instant startDate = extractDateAsInstant(event.getStartDate());
        Instant endDate = extractDateAsInstant(event.getEndDate());

        if (startDate == null || endDate == null) {
            return null;
        }

        String summary = Optional.ofNullable(event.getSummary())
                .map(Summary::getValue)
                .orElse("");

        String description = Optional.ofNullable(event.getDescription())
                .map(Description::getValue)
                .orElse("");

        String guestName = extractGuestName(summary, description);
        String guestEmail = extractGuestEmail(event);
        String timezone = extractTimezone(event);

        return ParsedReservation.builder()
                .uid(uid)
                .startDate(startDate)
                .endDate(endDate)
                .summary(summary)
                .description(description)
                .guestName(guestName)
                .guestEmail(guestEmail)
                .timezone(timezone)
                .rawData(event.toString())
                .build();
    }

    private Instant extractDateAsInstant(DtStart dtStart) {
        if (dtStart == null) return null;
        try {
            java.util.Date date = dtStart.getDate();
            return date.toInstant();
        } catch (Exception e) {
            return null;
        }
    }

    private Instant extractDateAsInstant(DtEnd dtEnd) {
        if (dtEnd == null) return null;
        try {
            java.util.Date date = dtEnd.getDate();
            return date.toInstant();
        } catch (Exception e) {
            return null;
        }
    }

    private String extractGuestName(String summary, String description) {
        if (summary != null && !summary.isBlank() && !summary.startsWith("Airbnb") && !summary.startsWith("BLOCKED")) {
            return summary;
        }
        if (description != null && description.contains("Name:")) {
            int nameIdx = description.indexOf("Name:") + 5;
            int endIdx = description.indexOf("\n", nameIdx);
            return endIdx > nameIdx
                    ? description.substring(nameIdx, endIdx).trim()
                    : description.substring(nameIdx).trim();
        }
        return null;
    }

    private String extractGuestEmail(VEvent event) {
        try {
            Property attendee = event.getProperty("ATTENDEE");
            if (attendee != null) {
                String value = attendee.getValue();
                if (value != null && value.startsWith("mailto:")) {
                    return value.substring(7);
                }
            }
        } catch (Exception e) {
            // ignore
        }
        return null;
    }

    private String extractTimezone(VEvent event) {
        try {
            DtStart dtStart = event.getStartDate();
            if (dtStart != null && dtStart.getTimeZone() != null) {
                return dtStart.getTimeZone().getID();
            }
        } catch (Exception e) {
            // ignore
        }
        return "UTC";
    }
}
