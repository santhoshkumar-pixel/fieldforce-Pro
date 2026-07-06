package com.fieldforce.repository;

import com.fieldforce.model.AttendanceEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AttendanceEventRepository extends JpaRepository<AttendanceEvent, String> {
    List<AttendanceEvent> findAllByOrderByTimestampDesc();
}
