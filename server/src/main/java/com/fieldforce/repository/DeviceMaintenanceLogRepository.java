package com.fieldforce.repository;

import com.fieldforce.model.DeviceMaintenanceLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DeviceMaintenanceLogRepository extends JpaRepository<DeviceMaintenanceLog, Long> {
    List<DeviceMaintenanceLog> findByDeviceId(String deviceId);
}
