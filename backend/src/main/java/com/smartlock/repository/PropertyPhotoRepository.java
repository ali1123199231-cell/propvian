package com.smartlock.repository;

import com.smartlock.domain.PropertyPhoto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PropertyPhotoRepository extends JpaRepository<PropertyPhoto, UUID> {

    List<PropertyPhoto> findByPropertyIdOrderBySortOrderAsc(UUID propertyId);

    void deleteByPropertyId(UUID propertyId);
}
