package com.fieldforce.repository;

import com.fieldforce.model.DeviceAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DeviceAssignmentRepository extends JpaRepository<DeviceAssignment, Long> {
    List<DeviceAssignment> findByDeviceId(String deviceId);
    List<DeviceAssignment> findAllByOrderByIdDesc();
}
