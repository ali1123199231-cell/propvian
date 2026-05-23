package com.smartlock.service;

import com.smartlock.domain.CleanerTask;
import com.smartlock.domain.Property;
import com.smartlock.domain.Reservation;
import com.smartlock.domain.User;
import com.smartlock.domain.enums.CleanerTaskStatus;
import com.smartlock.exception.ResourceNotFoundException;
import com.smartlock.repository.CleanerTaskRepository;
import com.smartlock.repository.PropertyRepository;
import com.smartlock.repository.ReservationRepository;
import com.smartlock.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CleanerTaskService {

    private final CleanerTaskRepository cleanerTaskRepository;
    private final ReservationRepository reservationRepository;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Transactional
    public CleanerTask createCleanerTask(UUID reservationId, UUID organizationId) {
        if (cleanerTaskRepository.findByReservationId(reservationId).isPresent()) {
            return cleanerTaskRepository.findByReservationId(reservationId).get();
        }

        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", reservationId));

        Property property = propertyRepository.findById(reservation.getPropertyId())
                .orElseThrow(() -> new ResourceNotFoundException("Property", reservation.getPropertyId()));

        CleanerTask task = CleanerTask.builder()
                .reservationId(reservationId)
                .organizationId(organizationId)
                .assignedUserId(property.getCleanerUserId())
                .status(CleanerTaskStatus.PENDING)
                .scheduledAt(reservation.getCheckOutDate())
                .checklist(List.of(
                        "Clean all rooms",
                        "Change bed linens",
                        "Clean bathrooms",
                        "Restock consumables",
                        "Check for damages",
                        "Lock up property"
                ))
                .build();

        task = cleanerTaskRepository.save(task);

        if (property.getCleanerUserId() != null) {
            notifyCleanerAsync(task, property, reservation);
        }

        return task;
    }

    @Transactional(readOnly = true)
    public Page<CleanerTask> listByOrg(UUID orgId, Pageable pageable) {
        return cleanerTaskRepository.findByOrganizationIdOrderByScheduledAtDesc(orgId, pageable);
    }

    @Transactional
    public CleanerTask updateStatus(UUID taskId, CleanerTaskStatus status) {
        CleanerTask task = cleanerTaskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("CleanerTask", taskId));
        task.setStatus(status);
        if (status == CleanerTaskStatus.COMPLETED) {
            task.setCompletedAt(Instant.now());
        }
        return cleanerTaskRepository.save(task);
    }

    @Async
    public void notifyCleanerAsync(CleanerTask task, Property property, Reservation reservation) {
        if (task.getAssignedUserId() == null) return;
        userRepository.findById(task.getAssignedUserId()).ifPresent(cleaner -> {
            String checkOut = reservation.getCheckOutDate().toString();
            emailService.sendCleanerTaskEmail(
                    cleaner.getEmail(),
                    cleaner.getFirstName(),
                    property.getName(),
                    checkOut,
                    reservation.getId().toString()
            );
            task.setNotifiedAt(Instant.now());
            cleanerTaskRepository.save(task);
        });
    }
}
