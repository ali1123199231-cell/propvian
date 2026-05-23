package com.smartlock.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

import java.util.UUID;

@Getter
public class ReservationCreatedEvent extends ApplicationEvent {
    private final UUID reservationId;
    private final UUID organizationId;

    public ReservationCreatedEvent(Object source, UUID reservationId, UUID organizationId) {
        super(source);
        this.reservationId = reservationId;
        this.organizationId = organizationId;
    }
}
