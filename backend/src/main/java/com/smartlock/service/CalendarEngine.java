package com.smartlock.service;

import com.smartlock.domain.BookingHold;
import com.smartlock.domain.CalendarInterval;
import com.smartlock.domain.HostVerification;
import com.smartlock.domain.Property;
import com.smartlock.domain.PropertyBlockedDate;
import com.smartlock.domain.enums.PropertyStatus;
import com.smartlock.exception.AppException;
import com.smartlock.repository.BookingHoldRepository;
import com.smartlock.repository.CalendarIntervalRepository;
import com.smartlock.repository.HostVerificationRepository;
import com.smartlock.repository.PropertyBlockedDateRepository;
import com.smartlock.repository.PropertyRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Core calendar state engine for Propvian.
 *
 * Responsibilities:
 *  - Availability checks (range-based, fast)
 *  - Booking holds (temporary RESERVED state with TTL)
 *  - State transitions (hold → booked, booked → cancelled, etc.)
 *  - Buffer interval management (auto-block before/after bookings)
 *  - Concurrency safety via PostgreSQL advisory locks + GIST exclusion constraint
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CalendarEngine {

    private static final Duration HOLD_TTL = Duration.ofMinutes(15);

    private final CalendarIntervalRepository intervalRepo;
    private final BookingHoldRepository holdRepo;
    private final PropertyRepository propertyRepo;
    private final PropertyRuleResolver ruleResolver;
    private final HostVerificationRepository hostVerificationRepo;
    private final PropertyBlockedDateRepository blockedDateRepo;
    private final EntityManager em;

    // ── Public record types ───────────────────────────────────────────────────

    public record AvailabilityResult(boolean available, String reason) {
        static AvailabilityResult ok()               { return new AvailabilityResult(true,  null); }
        static AvailabilityResult blocked(String r)  { return new AvailabilityResult(false, r);    }
    }

    public record HoldResult(UUID holdId, UUID intervalId, Instant expiresAt) {}

    // ── Availability check ────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AvailabilityResult checkAvailability(UUID propertyId, LocalDate checkIn, LocalDate checkOut) {
        validateDates(checkIn, checkOut);

        Property property = requireActiveProperty(propertyId);
        validateStayRules(property, checkIn, checkOut);

        List<CalendarInterval> conflicts = intervalRepo.findBlockingOverlap(propertyId, checkIn, checkOut);
        if (!conflicts.isEmpty()) {
            String states = conflicts.stream().map(CalendarInterval::getState).distinct()
                    .reduce((a, b) -> a + "," + b).orElse("UNKNOWN");
            return AvailabilityResult.blocked("Dates conflict with existing " + states + " intervals");
        }
        if (!blockedDateRepo.findOverlapping(propertyId, checkIn, checkOut).isEmpty()) {
            return AvailabilityResult.blocked("Dates are blocked by the host");
        }
        return AvailabilityResult.ok();
    }

    // ── Calendar view (website builder + admin calendar UI) ──────────────────

    @Transactional(readOnly = true)
    public List<CalendarInterval> getCalendar(UUID propertyId, LocalDate windowStart, LocalDate windowEnd) {
        return intervalRepo.findInWindow(propertyId, windowStart, windowEnd);
    }

    // ── Hold creation (guest begins checkout) ────────────────────────────────

    /**
     * Acquires a PostgreSQL advisory lock on the property, validates availability,
     * then atomically inserts a RESERVED interval + booking_hold record.
     * The advisory lock is transaction-scoped and released automatically on commit.
     */
    @Transactional
    public HoldResult createHold(UUID propertyId, LocalDate checkIn, LocalDate checkOut,
                                  int guests, String guestName, String guestEmail, String sessionId) {
        validateDates(checkIn, checkOut);
        Property property = requireActiveProperty(propertyId);
        validateStayRules(property, checkIn, checkOut);

        acquireAdvisoryLock(propertyId);

        // Re-check inside lock scope (TOCTOU prevention)
        List<CalendarInterval> conflicts = intervalRepo.findBlockingOverlap(propertyId, checkIn, checkOut);
        if (!conflicts.isEmpty()) {
            throw new AppException("Property is not available for the selected dates", HttpStatus.CONFLICT);
        }

        Instant expiresAt = Instant.now().plus(HOLD_TTL);

        CalendarInterval interval = CalendarInterval.builder()
                .propertyId(propertyId)
                .startDate(checkIn)
                .endDate(checkOut)
                .state("RESERVED")
                .expiresAt(expiresAt)
                .note("Guest hold: " + (guestEmail != null ? guestEmail : sessionId))
                .build();
        interval = intervalRepo.save(interval);

        BookingHold hold = BookingHold.builder()
                .propertyId(propertyId)
                .intervalId(interval.getId())
                .guestName(guestName)
                .guestEmail(guestEmail)
                .guestSessionId(sessionId)
                .checkinDate(checkIn)
                .checkoutDate(checkOut)
                .numberOfGuests(guests)
                .expiresAt(expiresAt)
                .status("ACTIVE")
                .build();
        hold = holdRepo.save(hold);

        // Link interval back to hold
        interval.setHoldId(hold.getId());
        intervalRepo.save(interval);

        log.info("Hold created: property={} hold={} [{} → {}] expires={}",
                propertyId, hold.getId(), checkIn, checkOut, expiresAt);

        return new HoldResult(hold.getId(), interval.getId(), expiresAt);
    }

    // ── Confirm hold → booked (payment succeeded) ────────────────────────────

    @Transactional
    public CalendarInterval confirmHold(UUID holdId, UUID bookingId) {
        BookingHold hold = holdRepo.findById(holdId)
                .orElseThrow(() -> new AppException("Hold not found", HttpStatus.NOT_FOUND));

        if (!"ACTIVE".equals(hold.getStatus())) {
            throw new AppException("Hold is no longer active (status: " + hold.getStatus() + ")",
                    HttpStatus.CONFLICT);
        }
        if (hold.getExpiresAt().isBefore(Instant.now())) {
            throw new AppException("Hold has expired", HttpStatus.CONFLICT);
        }

        CalendarInterval interval = intervalRepo.findById(hold.getIntervalId())
                .orElseThrow(() -> new AppException("Interval not found for hold", HttpStatus.INTERNAL_SERVER_ERROR));

        interval.setState("BOOKED");
        interval.setBookingId(bookingId);
        interval.setExpiresAt(null);
        interval = intervalRepo.save(interval);

        hold.setStatus("CONVERTED");
        holdRepo.save(hold);

        insertBuffers(interval);

        log.info("Hold confirmed: hold={} booking={} [{} → {}]",
                holdId, bookingId, interval.getStartDate(), interval.getEndDate());

        return interval;
    }

    // ── Release hold (payment failed / guest abandoned) ──────────────────────

    @Transactional
    public void releaseHold(UUID holdId) {
        BookingHold hold = holdRepo.findById(holdId)
                .orElseThrow(() -> new AppException("Hold not found", HttpStatus.NOT_FOUND));

        if ("CONVERTED".equals(hold.getStatus())) {
            throw new AppException("Cannot release a converted hold", HttpStatus.BAD_REQUEST);
        }

        if (hold.getIntervalId() != null) {
            intervalRepo.findById(hold.getIntervalId()).ifPresent(intervalRepo::delete);
        }

        hold.setStatus("RELEASED");
        holdRepo.save(hold);

        log.info("Hold released: hold={} property={}", holdId, hold.getPropertyId());
    }

    // ── Block / unblock dates (owner action) ─────────────────────────────────

    @Transactional
    public CalendarInterval blockDates(UUID propertyId, LocalDate startDate, LocalDate endDate,
                                        UUID actorId, String reason) {
        validateDates(startDate, endDate);
        acquireAdvisoryLock(propertyId);

        List<CalendarInterval> conflicts = intervalRepo.findBlockingOverlap(propertyId, startDate, endDate);
        if (!conflicts.isEmpty()) {
            throw new AppException("Date range conflicts with existing intervals", HttpStatus.CONFLICT);
        }

        CalendarInterval block = CalendarInterval.builder()
                .propertyId(propertyId)
                .startDate(startDate)
                .endDate(endDate)
                .state("BLOCKED")
                .blockedBy(actorId)
                .note(reason)
                .build();

        return intervalRepo.save(block);
    }

    @Transactional
    public void unblockDates(UUID intervalId, UUID actorId) {
        CalendarInterval interval = intervalRepo.findById(intervalId)
                .orElseThrow(() -> new AppException("Interval not found", HttpStatus.NOT_FOUND));

        if (!"BLOCKED".equals(interval.getState())) {
            throw new AppException("Can only unblock BLOCKED intervals", HttpStatus.BAD_REQUEST);
        }

        intervalRepo.delete(interval);
        log.info("Dates unblocked: interval={} by={}", intervalId, actorId);
    }

    // ── Cancel booking (restore dates) ────────────────────────────────────────

    @Transactional
    public void cancelBookingDates(UUID bookingId) {
        List<CalendarInterval> intervals = intervalRepo.findByBookingId(bookingId);
        if (!intervals.isEmpty()) {
            intervalRepo.deleteAll(intervals);
            log.info("Cancelled calendar intervals for booking={} count={}", bookingId, intervals.size());
        }
    }

    // ── Register a booking directly (for iCal sync / manual reservations) ────

    @Transactional
    public CalendarInterval registerBookedInterval(UUID propertyId, LocalDate checkIn,
                                                    LocalDate checkOut, UUID bookingId, String note) {
        validateDates(checkIn, checkOut);
        acquireAdvisoryLock(propertyId);

        // Remove any stale RESERVED intervals for this exact range before inserting
        intervalRepo.findBlockingOverlap(propertyId, checkIn, checkOut).stream()
                .filter(ci -> "RESERVED".equals(ci.getState()))
                .forEach(intervalRepo::delete);

        List<CalendarInterval> remaining = intervalRepo.findBlockingOverlap(propertyId, checkIn, checkOut);
        if (!remaining.isEmpty()) {
            throw new AppException("Cannot register booking — dates already occupied", HttpStatus.CONFLICT);
        }

        CalendarInterval interval = CalendarInterval.builder()
                .propertyId(propertyId)
                .startDate(checkIn)
                .endDate(checkOut)
                .state("BOOKED")
                .bookingId(bookingId)
                .note(note)
                .build();
        interval = intervalRepo.save(interval);

        Property property = propertyRepo.findById(propertyId).orElse(null);
        if (property != null) {
            insertBuffers(interval);
        }

        return interval;
    }

    // ── Buffer engine ─────────────────────────────────────────────────────────

    private void insertBuffers(CalendarInterval booked) {
        Property property = propertyRepo.findById(booked.getPropertyId()).orElse(null);
        if (property == null) return;

        PropertyRuleResolver.ResolvedRules rules =
                ruleResolver.resolve(property, booked.getStartDate(), booked.getEndDate());

        if (rules.bufferDaysBefore() > 0) {
            LocalDate bufStart = booked.getStartDate().minusDays(rules.bufferDaysBefore());
            LocalDate bufEnd   = booked.getStartDate();
            // Only insert buffer if those dates are currently free
            if (intervalRepo.findBlockingOverlap(booked.getPropertyId(), bufStart, bufEnd).isEmpty()) {
                CalendarInterval buffer = CalendarInterval.builder()
                        .propertyId(booked.getPropertyId())
                        .startDate(bufStart)
                        .endDate(bufEnd)
                        .state("BUFFER")
                        .bookingId(booked.getBookingId())
                        .note("Auto-buffer before booking")
                        .build();
                intervalRepo.save(buffer);
            }
        }

        if (rules.bufferDaysAfter() > 0) {
            LocalDate bufStart = booked.getEndDate();
            LocalDate bufEnd   = booked.getEndDate().plusDays(rules.bufferDaysAfter());
            if (intervalRepo.findBlockingOverlap(booked.getPropertyId(), bufStart, bufEnd).isEmpty()) {
                CalendarInterval buffer = CalendarInterval.builder()
                        .propertyId(booked.getPropertyId())
                        .startDate(bufStart)
                        .endDate(bufEnd)
                        .state("BUFFER")
                        .bookingId(booked.getBookingId())
                        .note("Auto-buffer after booking")
                        .build();
                intervalRepo.save(buffer);
            }
        }
    }

    // ── Expiration cleanup (called by scheduler) ──────────────────────────────

    @Transactional
    public int expireStaleHolds() {
        List<BookingHold> expired = holdRepo.findExpired(Instant.now());
        int count = 0;
        for (BookingHold hold : expired) {
            if (hold.getIntervalId() != null) {
                intervalRepo.findById(hold.getIntervalId()).ifPresent(intervalRepo::delete);
            }
            hold.setStatus("EXPIRED");
            holdRepo.save(hold);
            count++;
        }
        if (count > 0) {
            log.info("Expired {} stale booking holds", count);
        }
        return count;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Property requireActiveProperty(UUID propertyId) {
        Property property = propertyRepo.findById(propertyId)
                .orElseThrow(() -> new AppException("Property not found", HttpStatus.NOT_FOUND));
        if (property.getStatus() != PropertyStatus.ACTIVE) {
            throw new AppException("Property is not accepting bookings (status: " + property.getStatus() + ")",
                    HttpStatus.BAD_REQUEST);
        }
        // Verify the organization has bookings enabled (passed host verification)
        boolean bookingsEnabled = hostVerificationRepo
                .findByOrganizationId(property.getOrganizationId())
                .map(HostVerification::isBookingsEnabled)
                .orElse(false);
        if (!bookingsEnabled) {
            throw new AppException(
                    "Bookings are disabled until verification is complete",
                    HttpStatus.FORBIDDEN);
        }
        return property;
    }

    private void validateDates(LocalDate start, LocalDate end) {
        if (start == null || end == null) {
            throw new AppException("Check-in and check-out dates are required", HttpStatus.BAD_REQUEST);
        }
        if (!end.isAfter(start)) {
            throw new AppException("Check-out must be after check-in", HttpStatus.BAD_REQUEST);
        }
        if (start.isBefore(LocalDate.now())) {
            throw new AppException("Check-in cannot be in the past", HttpStatus.BAD_REQUEST);
        }
    }

    private void validateStayRules(Property property, LocalDate checkIn, LocalDate checkOut) {
        PropertyRuleResolver.ResolvedRules rules = ruleResolver.resolve(property, checkIn, checkOut);
        long nights = java.time.temporal.ChronoUnit.DAYS.between(checkIn, checkOut);

        if (nights < rules.minStayDays()) {
            throw new AppException(
                    "Minimum stay is " + rules.minStayDays() + " night(s)", HttpStatus.BAD_REQUEST);
        }
        if (rules.maxStayDays() > 0 && nights > rules.maxStayDays()) {
            throw new AppException(
                    "Maximum stay is " + rules.maxStayDays() + " night(s)", HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * Acquires a transaction-scoped advisory lock for the given property.
     * Uses hashtext() to convert UUID to an int8 key.
     * The lock is automatically released when the surrounding transaction commits or rolls back.
     * If the lock is held by another transaction, this call returns immediately with false
     * (non-blocking) and we throw a CONFLICT error to avoid deadlocks.
     */
    private void acquireAdvisoryLock(UUID propertyId) {
        String key = propertyId.toString();
        Boolean acquired = (Boolean) em.createNativeQuery(
                "SELECT pg_try_advisory_xact_lock(hashtext(:key))")
                .setParameter("key", key)
                .getSingleResult();

        if (Boolean.FALSE.equals(acquired)) {
            throw new AppException(
                    "Property calendar is busy — please retry in a moment", HttpStatus.CONFLICT);
        }
    }
}
