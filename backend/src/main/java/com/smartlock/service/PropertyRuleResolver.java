package com.smartlock.service;

import com.smartlock.domain.Property;
import com.smartlock.domain.PropertySeasonalRule;
import com.smartlock.repository.PropertySeasonalRuleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

/**
 * Resolves the effective rules for a property over a given stay window.
 * Seasonal rules override base property rules; the most restrictive wins
 * when multiple seasons overlap the requested dates.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PropertyRuleResolver {

    private final PropertySeasonalRuleRepository seasonalRuleRepo;

    public record ResolvedRules(
            int minStayDays,
            int maxStayDays,       // Integer.MAX_VALUE means no limit
            int bufferDaysBefore,
            int bufferDaysAfter
    ) {}

    public ResolvedRules resolve(Property property, LocalDate checkIn, LocalDate checkOut) {
        log.debug("PropertyRuleResolver.resolve — property={} checkIn={} checkOut={}", property.getId(), checkIn, checkOut);
        List<PropertySeasonalRule> seasons =
                seasonalRuleRepo.findOverlapping(property.getId(), checkIn, checkOut.minusDays(1));

        if (seasons.isEmpty()) {
            ResolvedRules base = fromProperty(property);
            log.debug("PropertyRuleResolver.resolve — no seasons, using base rules minStay={} maxStay={}",
                    base.minStayDays(), base.maxStayDays());
            return base;
        }

        // Apply the most restrictive values across all overlapping seasons.
        int minStay     = property.getMinStayNights();
        int maxStay     = property.getMaxStayNights();
        int bufBefore   = property.getBufferDaysBefore();
        int bufAfter    = property.getBufferDaysAfter();

        for (PropertySeasonalRule s : seasons) {
            if (s.getMinStayDays()      != null) minStay   = Math.max(minStay,   s.getMinStayDays());
            if (s.getMaxStayDays()      != null) maxStay   = Math.min(maxStay,   s.getMaxStayDays());
            if (s.getBufferDaysBefore() != null) bufBefore = Math.max(bufBefore, s.getBufferDaysBefore());
            if (s.getBufferDaysAfter()  != null) bufAfter  = Math.max(bufAfter,  s.getBufferDaysAfter());
        }

        ResolvedRules resolved = new ResolvedRules(minStay, maxStay, bufBefore, bufAfter);
        log.debug("PropertyRuleResolver.resolve — applied {} season(s), minStay={} maxStay={} bufBefore={} bufAfter={}",
                seasons.size(), minStay, maxStay, bufBefore, bufAfter);
        return resolved;
    }

    private ResolvedRules fromProperty(Property p) {
        return new ResolvedRules(
                p.getMinStayNights(),
                p.getMaxStayNights(),
                p.getBufferDaysBefore(),
                p.getBufferDaysAfter()
        );
    }
}
