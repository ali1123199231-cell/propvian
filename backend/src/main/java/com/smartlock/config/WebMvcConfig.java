package com.smartlock.config;

import com.smartlock.security.OrganizationAccessInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {

    private final CorsConfig corsConfig;
    private final OrganizationAccessInterceptor organizationAccessInterceptor;

    /** Public routes like /api/public/files/{orgId}/… stay open: only /api/v1 is guarded. */
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(organizationAccessInterceptor).addPathPatterns("/api/v1/**");
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
