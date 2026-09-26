package com.smartlock.security;

import com.smartlock.service.OrganizationSecurityService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.HandlerMapping;

import java.util.Map;
import java.util.UUID;

/**
 * Requires membership of the organization named by any {orgId} path variable
 * under /api/v1, before the controller runs.
 *
 * The check used to be written into each endpoint by hand, and enough were
 * missed that on 2026-09-26 any signed-in user could edit or delete another
 * org's properties, rename the org, point its domain elsewhere and invite
 * themselves as ADMIN, using the org id the public property API returns.
 * This closes that whole class. Endpoints must still check that the resource
 * they touch (property, booking, photo) belongs to {orgId}.
 */
@Component
@RequiredArgsConstructor
public class OrganizationAccessInterceptor implements HandlerInterceptor {

    private final OrganizationSecurityService orgSecurity;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        @SuppressWarnings("unchecked")
        Map<String, String> vars = (Map<String, String>) request.getAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE);
        String raw = vars != null ? vars.get("orgId") : null;
        if (raw == null) return true;
        UUID orgId;
        try {
            orgId = UUID.fromString(raw);
        } catch (IllegalArgumentException e) {
            return true;   // not an org id (the controller will reject it); nothing to guard
        }
        orgSecurity.requireOrgAccess(orgId);   // 403 via the global exception handler; admins pass
        return true;
    }
}
