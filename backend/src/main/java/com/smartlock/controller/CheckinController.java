package com.smartlock.controller;

import com.smartlock.dto.response.checkin.CheckinPageResponse;
import com.smartlock.service.CheckinPageService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/checkin")
@RequiredArgsConstructor
@Tag(name = "Public Check-in")
@Slf4j
public class CheckinController {

    private final CheckinPageService checkinPageService;

    @GetMapping("/{code}")
    public ResponseEntity<CheckinPageResponse> getCheckinPage(@PathVariable String code) {
        log.debug("CheckinController.getCheckinPage — code={}", code);
        return ResponseEntity.ok(checkinPageService.getCheckinPage(code));
    }
}
