package com.smartlock.service;

import com.smartlock.domain.Property;
import com.smartlock.domain.enums.PropertyStatus;
import com.smartlock.dto.request.property.CreatePropertyRequest;
import com.smartlock.dto.response.property.PropertyResponse;
import com.smartlock.exception.AppException;
import com.smartlock.exception.ResourceNotFoundException;
import org.springframework.http.HttpStatus;
import com.smartlock.repository.LockRepository;
import com.smartlock.repository.PropertyPhotoRepository;
import com.smartlock.repository.PropertyRepository;
import com.smartlock.repository.ReservationRepository;
import com.smartlock.repository.WebsiteConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PropertyService {

    private final PropertyRepository propertyRepository;
    private final PropertyPhotoRepository photoRepository;
    private final LockRepository lockRepository;
    private final ReservationRepository reservationRepository;
    private final OnboardingService onboardingService;
    private final OrganizationSecurityService orgSecurity;
    private final BillingService billingService;
    private final FileUploadService fileUploadService;
    private final WebsiteConfigRepository websiteConfigRepository;

    @Transactional
    public PropertyResponse createProperty(UUID orgId, CreatePropertyRequest request, UUID userId) {
        orgSecurity.requireOrgAccess(orgId);
        long currentCount = propertyRepository.countByOrganizationId(orgId);
        billingService.enforceCanAddProperty(orgId, currentCount);
        Property property = Property.builder()
                .organizationId(orgId)
                .name(request.getName())
                .propertyType(request.getPropertyType())
                .address(request.getAddress())
                .city(request.getCity())
                .state(request.getState())
                .country(request.getCountry())
                .postalCode(request.getPostalCode())
                .timezone(request.getTimezone() != null ? request.getTimezone() : "UTC")
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .maxGuests(request.getMaxGuests())
                .bedrooms(request.getBedrooms())
                .bathrooms(request.getBathrooms())
                .cleanerUserId(request.getCleanerUserId())
                .currency(request.getCurrency() != null ? request.getCurrency().toUpperCase() : "USD")
                .baseNightlyRate(request.getBaseNightlyRate())
                .cleaningFee(request.getCleaningFee())
                .securityDeposit(request.getSecurityDeposit())
                .minStayNights(request.getMinStayNights() != null ? request.getMinStayNights() : 1)
                .maxStayNights(request.getMaxStayNights() != null ? request.getMaxStayNights() : 365)
                .checkInTime(request.getCheckInTime() != null ? request.getCheckInTime() : "15:00")
                .checkOutTime(request.getCheckOutTime() != null ? request.getCheckOutTime() : "11:00")
                .instantBooking(request.getInstantBooking() != null ? request.getInstantBooking() : true)
                .cancellationPolicy(request.getCancellationPolicy() != null ? request.getCancellationPolicy() : "MODERATE")
                .bufferDaysBefore(request.getBufferDaysBefore() != null ? request.getBufferDaysBefore() : 0)
                .bufferDaysAfter(request.getBufferDaysAfter() != null ? request.getBufferDaysAfter() : 0)
                .depositRequired(request.getDepositRequired() != null ? request.getDepositRequired() : false)
                .depositPercent(request.getDepositPercent())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .slug(request.getSlug())
                .status(request.getStatus() != null
                        ? PropertyStatus.valueOf(request.getStatus().toUpperCase())
                        : PropertyStatus.DRAFT)
                .build();

        PropertyResponse response = toResponse(propertyRepository.save(property));

        if (userId != null) {
            onboardingService.advanceStepIfCurrent(userId, "PROPERTY_SETUP");
        }

        return response;
    }

    @Transactional(readOnly = true)
    public Page<PropertyResponse> getPropertiesByOrg(UUID orgId, Pageable pageable) {
        orgSecurity.requireOrgAccess(orgId);
        return propertyRepository.findByOrganizationId(orgId, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public PropertyResponse getProperty(UUID propertyId, UUID orgId) {
        Property property = propertyRepository.findById(propertyId)
                .filter(p -> p.getOrganizationId().equals(orgId))
                .orElseThrow(() -> new ResourceNotFoundException("Property", propertyId));
        return toResponse(property);
    }

    @Transactional
    public PropertyResponse updateProperty(UUID propertyId, UUID orgId, CreatePropertyRequest request) {
        Property property = propertyRepository.findById(propertyId)
                .filter(p -> p.getOrganizationId().equals(orgId))
                .orElseThrow(() -> new ResourceNotFoundException("Property", propertyId));

        property.setName(request.getName());
        property.setAddress(request.getAddress());
        property.setCity(request.getCity());
        property.setCountry(request.getCountry());
        property.setTimezone(request.getTimezone() != null ? request.getTimezone() : property.getTimezone());
        property.setDescription(request.getDescription());
        property.setImageUrl(request.getImageUrl());
        property.setMaxGuests(request.getMaxGuests());
        property.setBedrooms(request.getBedrooms());
        property.setBathrooms(request.getBathrooms());
        property.setCleanerUserId(request.getCleanerUserId());
        property.setPropertyType(request.getPropertyType());
        if (request.getCurrency() != null)          property.setCurrency(request.getCurrency().toUpperCase());
        if (request.getBaseNightlyRate() != null)  property.setBaseNightlyRate(request.getBaseNightlyRate());
        if (request.getCleaningFee() != null)       property.setCleaningFee(request.getCleaningFee());
        if (request.getSecurityDeposit() != null)   property.setSecurityDeposit(request.getSecurityDeposit());
        if (request.getMinStayNights() != null)     property.setMinStayNights(request.getMinStayNights());
        if (request.getMaxStayNights() != null)     property.setMaxStayNights(request.getMaxStayNights());
        if (request.getCheckInTime() != null)       property.setCheckInTime(request.getCheckInTime());
        if (request.getCheckOutTime() != null)      property.setCheckOutTime(request.getCheckOutTime());
        if (request.getInstantBooking() != null)       property.setInstantBooking(request.getInstantBooking());
        if (request.getCancellationPolicy() != null)   property.setCancellationPolicy(request.getCancellationPolicy());
        if (request.getBufferDaysBefore() != null)     property.setBufferDaysBefore(request.getBufferDaysBefore());
        if (request.getBufferDaysAfter() != null)      property.setBufferDaysAfter(request.getBufferDaysAfter());
        if (request.getDepositRequired() != null)      property.setDepositRequired(request.getDepositRequired());
        if (request.getDepositPercent() != null)       property.setDepositPercent(request.getDepositPercent());
        if (request.getLatitude() != null)             property.setLatitude(request.getLatitude());
        if (request.getLongitude() != null)            property.setLongitude(request.getLongitude());
        if (request.getSlug() != null)                 property.setSlug(request.getSlug());
        if (request.getStatus() != null) {
            try {
                property.setStatus(PropertyStatus.valueOf(request.getStatus().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new AppException("Invalid property status: " + request.getStatus(), HttpStatus.BAD_REQUEST);
            }
        }

        return toResponse(propertyRepository.save(property));
    }

    @Transactional(readOnly = true)
    public PropertyResponse getPropertyBySlug(String slug) {
        Property property = propertyRepository.findBySlug(slug)
                .orElseThrow(() -> new AppException("Property not found", HttpStatus.NOT_FOUND));
        if (property.getStatus() != PropertyStatus.ACTIVE) {
            throw new AppException("Property is not publicly available", HttpStatus.NOT_FOUND);
        }
        return toResponse(property);
    }

    @Transactional
    public void deleteProperty(UUID propertyId, UUID orgId) {
        Property property = propertyRepository.findById(propertyId)
                .filter(p -> p.getOrganizationId().equals(orgId))
                .orElseThrow(() -> new ResourceNotFoundException("Property", propertyId));

        log.info("[DELETE-PROPERTY] Starting deletion of property '{}' (id={}, org={})",
                property.getName(), propertyId, orgId);

        var photos = photoRepository.findByPropertyIdOrderBySortOrderAsc(propertyId);
        log.info("[DELETE-PROPERTY] Found {} photo(s) to delete for property {}", photos.size(), propertyId);

        for (var photo : photos) {
            log.info("[DELETE-PROPERTY] Deleting photo id={} url={}", photo.getId(), photo.getUrl());
            fileUploadService.deleteFile(photo.getUrl());
        }

        photoRepository.deleteByPropertyId(propertyId);
        log.info("[DELETE-PROPERTY] Deleted {} photo record(s) from DB for property {}", photos.size(), propertyId);

        property.softDelete();
        propertyRepository.save(property);
        log.info("[DELETE-PROPERTY] Property '{}' (id={}) soft-deleted successfully", property.getName(), propertyId);

        long remaining = propertyRepository.countByOrganizationIdAndStatus(orgId, PropertyStatus.ACTIVE);
        if (remaining == 0) {
            websiteConfigRepository.findByOrganizationId(orgId).ifPresent(ws -> {
                ws.setSetupCompleted(false);
                websiteConfigRepository.save(ws);
                log.info("[DELETE-PROPERTY] Reset setupCompleted=false for org {} — no active properties remain", orgId);
            });
        }
    }

    private PropertyResponse toResponse(Property p) {
        long lockCount = lockRepository.countByPropertyId(p.getId());
        List<PropertyResponse.PhotoInfo> photos = photoRepository
                .findByPropertyIdOrderBySortOrderAsc(p.getId()).stream()
                .map(ph -> new PropertyResponse.PhotoInfo(
                        ph.getId(), ph.getUrl(), ph.getCaption(), ph.getSortOrder(), ph.isPrimary()))
                .toList();
        return PropertyResponse.builder()
                .id(p.getId())
                .organizationId(p.getOrganizationId())
                .name(p.getName())
                .propertyType(p.getPropertyType())
                .address(p.getAddress())
                .city(p.getCity())
                .state(p.getState())
                .country(p.getCountry())
                .postalCode(p.getPostalCode())
                .timezone(p.getTimezone())
                .description(p.getDescription())
                .imageUrl(p.getImageUrl())
                .status(p.getStatus().name())
                .cleanerUserId(p.getCleanerUserId())
                .maxGuests(p.getMaxGuests())
                .bedrooms(p.getBedrooms())
                .bathrooms(p.getBathrooms())
                .lockCount(lockCount)
                .currency(p.getCurrency())
                .baseNightlyRate(p.getBaseNightlyRate())
                .cleaningFee(p.getCleaningFee())
                .securityDeposit(p.getSecurityDeposit())
                .minStayNights(p.getMinStayNights())
                .maxStayNights(p.getMaxStayNights())
                .checkInTime(p.getCheckInTime())
                .checkOutTime(p.getCheckOutTime())
                .instantBooking(p.isInstantBooking())
                .slug(p.getSlug())
                .cancellationPolicy(p.getCancellationPolicy())
                .bufferDaysBefore(p.getBufferDaysBefore())
                .bufferDaysAfter(p.getBufferDaysAfter())
                .depositRequired(p.isDepositRequired())
                .depositPercent(p.getDepositPercent())
                .latitude(p.getLatitude())
                .longitude(p.getLongitude())
                .createdAt(p.getCreatedAt())
                .photos(photos)
                .build();
    }
}
