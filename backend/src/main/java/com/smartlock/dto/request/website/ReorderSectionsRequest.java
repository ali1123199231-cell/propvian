package com.smartlock.dto.request.website;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class ReorderSectionsRequest {
    @NotEmpty
    private List<UUID> sectionIds;
}
