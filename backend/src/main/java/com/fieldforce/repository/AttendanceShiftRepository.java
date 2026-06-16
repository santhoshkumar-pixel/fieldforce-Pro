package com.fieldforce.repository;

import com.fieldforce.model.AttendanceShift;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AttendanceShiftRepository extends JpaRepository<AttendanceShift, String> {
}
