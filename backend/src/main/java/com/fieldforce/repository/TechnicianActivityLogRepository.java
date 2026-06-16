package com.fieldforce.repository;

import com.fieldforce.model.TechnicianActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TechnicianActivityLogRepository extends JpaRepository<TechnicianActivityLog, Long> {
    List<TechnicianActivityLog> findByUserIdOrderByTimestampDesc(String userId);
    List<TechnicianActivityLog> findByTicketIdOrderByTimestampAsc(String ticketId);
    List<TechnicianActivityLog> findAllByOrderByTimestampDesc();
}

