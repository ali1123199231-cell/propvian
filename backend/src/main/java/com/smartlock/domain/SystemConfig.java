package com.smartlock.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "system_config")
@Getter
@Setter
public class SystemConfig {

    @Id
    @Column(name = "key", length = 255)
    private String key;

    @Column(name = "value", nullable = false, columnDefinition = "text")
    private String value;

    @Column(name = "description", columnDefinition = "text")
    private String description;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
