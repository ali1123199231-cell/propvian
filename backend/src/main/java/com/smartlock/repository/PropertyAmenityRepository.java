package com.smartlock.repository;

import com.smartlock.domain.PropertyAmenity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PropertyAmenityRepository extends JpaRepository<PropertyAmenity, UUID> {

    List<PropertyAmenity> findByPropertyId(UUID propertyId);

    void deleteByPropertyId(UUID propertyId);
}
