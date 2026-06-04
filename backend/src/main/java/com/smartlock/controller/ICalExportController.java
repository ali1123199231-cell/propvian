package com.smartlock.controller;

import com.smartlock.service.ICalExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class ICalExportController {

    private final ICalExportService icalExportService;

    /**
     * Public tokenized iCal feed — no authentication required.
     * Subscribe to this URL in Google Calendar, Apple Calendar, Outlook, etc.
     * URL: /api/public/calendar/{token}/calendar.ics
     */
    @GetMapping("/api/public/calendar/{token}/calendar.ics")
    public ResponseEntity<String> exportIcal(@PathVariable String token) {
        String ics = icalExportService.exportByToken(token);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "text/calendar; charset=UTF-8")
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"calendar.ics\"")
                .header("Cache-Control", "no-cache, no-store, must-revalidate")
                .body(ics);
    }
}
