package com.smartlock.service;

import com.smartlock.domain.AccessCode;
import com.smartlock.domain.Lock;
import com.smartlock.domain.Property;
import com.smartlock.domain.Reservation;
import com.smartlock.domain.enums.AccessCodeStatus;
import com.smartlock.dto.response.checkin.CheckinPageResponse;
import com.smartlock.exception.ResourceNotFoundException;
import com.smartlock.repository.AccessCodeRepository;
import com.smartlock.repository.LockRepository;
import com.smartlock.repository.PropertyRepository;
import com.smartlock.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CheckinPageService {

    private final ReservationRepository reservationRepository;
    private final PropertyRepository propertyRepository;
    private final AccessCodeRepository accessCodeRepository;
    private final LockRepository lockRepository;

    @Transactional(readOnly = true)
    public CheckinPageResponse getCheckinPage(String code) {
        log.debug("CheckinPageService.getCheckinPage — code={}...", code.length() > 6 ? code.substring(0, 6) : code);
        Reservation reservation = reservationRepository.findByCheckinCode(code)
                .orElseThrow(() -> {
                    log.warn("CheckinPageService.getCheckinPage — not found for code prefix={}",
                            code.length() > 6 ? code.substring(0, 6) : code);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Check-in page not found");
                });

        log.debug("CheckinPageService.getCheckinPage — reservationId={} property={}",
                reservation.getId(), reservation.getPropertyId());
        Property property = propertyRepository.findById(reservation.getPropertyId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Property not found"));

        List<AccessCode> activeCodes = accessCodeRepository.findByReservationId(reservation.getId())
                .stream()
                .filter(ac -> ac.getStatus() == AccessCodeStatus.ACTIVE)
                .sorted(Comparator.comparing(AccessCode::getCreatedAt))
                .toList();

        if (activeCodes.isEmpty()) {
            log.warn("CheckinPageService.getCheckinPage — no active access code reservationId={}", reservation.getId());
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No active access code found for this reservation");
        }

        AccessCode code0 = activeCodes.get(0);

        String lockNotes = lockRepository.findById(code0.getLockId())
                .map(Lock::getNotes)
                .orElse(null);

        log.info("CheckinPageService.getCheckinPage — served property={} reservationId={}",
                property.getName(), reservation.getId());
        return CheckinPageResponse.builder()
                .propertyName(property.getName())
                .guestName(reservation.getGuestName())
                .pin(code0.getPin())
                .validFrom(code0.getValidFrom())
                .validTo(code0.getValidTo())
                .timezone(reservation.getTimezone())
                .wifiDetails(property.getWifiDetails())
                .accessInstructions(property.getAccessInstructions())
                .lockNotes(lockNotes)
                .build();
    }
}
