package com.smartlock.scheduler;

import com.smartlock.service.AccessCodeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AccessCodeExpiryScheduler {

    private final AccessCodeService accessCodeService;

    @Scheduled(fixedDelay = 300000)
    public void expireOldCodes() {
        log.debug("Running access code expiry check");
        accessCodeService.expireOldCodes();
    }
}
