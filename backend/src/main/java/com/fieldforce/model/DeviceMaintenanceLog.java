package com.fieldforce.model;

import jakarta.persistence.*;

@Entity
@Table(name = "device_maintenance_logs")
public class DeviceMaintenanceLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "device_id", nullable = false, length = 50)
    private String deviceId;

    @Column(name = "device_name", length = 100)
    private String deviceName;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "maintenance_date", length = 50)
    private String maintenanceDate;

    private Double cost;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @Column(length = 50)
    private String status; // PENDING, COMPLETED

    @Column(name = "completed_at", length = 50)
    private String completedAt;

    // Constructors
    public DeviceMaintenanceLog() {}

    public DeviceMaintenanceLog(String deviceId, String deviceName, String reason, String maintenanceDate, Double cost, String remarks, String status, String completedAt) {
        this.deviceId = deviceId;
        this.deviceName = deviceName;
        this.reason = reason;
        this.maintenanceDate = maintenanceDate;
        this.cost = cost;
        this.remarks = remarks;
        this.status = status;
        this.completedAt = completedAt;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public String getDeviceName() { return deviceName; }
    public void setDeviceName(String deviceName) { this.deviceName = deviceName; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getMaintenanceDate() { return maintenanceDate; }
    public void setMaintenanceDate(String maintenanceDate) { this.maintenanceDate = maintenanceDate; }

    public Double getCost() { return cost; }
    public void setCost(Double cost) { this.cost = cost; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCompletedAt() { return completedAt; }
    public void setCompletedAt(String completedAt) { this.completedAt = completedAt; }
}
