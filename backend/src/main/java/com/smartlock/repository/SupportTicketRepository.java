package com.smartlock.repository;

import com.smartlock.domain.SupportTicket;
import com.smartlock.domain.enums.SupportTicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SupportTicketRepository extends JpaRepository<SupportTicket, UUID> {

    List<SupportTicket> findByOrganizationIdOrderByLastMessageAtDesc(UUID organizationId);

    Page<SupportTicket> findAllByOrderByLastMessageAtDesc(Pageable pageable);

    Page<SupportTicket> findByStatusOrderByLastMessageAtDesc(SupportTicketStatus status, Pageable pageable);
}
