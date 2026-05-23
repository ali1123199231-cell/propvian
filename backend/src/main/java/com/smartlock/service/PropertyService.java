package com.smartlock.service;

import com.smartlock.domain.Property;
import com.smartlock.domain.enums.PropertyStatus;
import com.smartlock.dto.request.property.CreatePropertyRequest;
import com.smartlock.dto.response.property.PropertyResponse;
import com.smartlock.exception.ResourceNotFoundException;
import com.smartlock.repository.LockRepository;
import com.smartlock.repository.PropertyRepository;
import com.smartlock.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PropertyService {

    private final PropertyRepository propertyRepository;
    private final LockRepository lockRepository;
    private final ReservationRepository reservationRepository;

    @Transactional
    public PropertyResponse createProperty(UUID orgId, CreatePropertyRequest request) {
        Property property = Property.builder()
                .organizationId(orgId)
                .name(request.getName())
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
                .status(PropertyStatus.ACTIVE)
                .build();

        return toResponse(propertyRepository.save(property));
    }

    @Transactional(readOnly = true)
    public Page<PropertyResponse> getPropertiesByOrg(UUID orgId, Pageable pageable) {
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

        return toResponse(propertyRepository.save(property));
    }

    @Transactional
    public void deleteProperty(UUID propertyId, UUID orgId) {
        Property property = propertyRepository.findById(propertyId)
                .filter(p -> p.getOrganizationId().equals(orgId))
                .orElseThrow(() -> new ResourceNotFoundException("Property", propertyId));
        property.softDelete();
        propertyRepository.save(property);
    }

    private PropertyResponse toResponse(Property p) {
        long lockCount = lockRepository.countByPropertyId(p.getId());
        return PropertyResponse.builder()
                .id(p.getId())
                .organizationId(p.getOrganizationId())
                .name(p.getName())
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
                .createdAt(p.getCreatedAt())
                .build();
    }
}
