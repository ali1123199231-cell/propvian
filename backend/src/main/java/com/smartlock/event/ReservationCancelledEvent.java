package com.smartlock.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

import java.util.UUID;

@Getter
public class ReservationCancelledEvent extends ApplicationEvent {
    private final UUID reservationId;
    private final UUID organizationId;

    public ReservationCancelledEvent(Object source, UUID reservationId, UUID organizationId) {
        super(source);
        this.reservationId = reservationId;
        this.organizationId = organizationId;
    }
}
