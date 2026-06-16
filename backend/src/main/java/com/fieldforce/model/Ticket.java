package com.fieldforce.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "tickets")
public class Ticket implements RegionBound {

    @Id
    @Column(length = 50)
    private String id;

    @Column(nullable = false, length = 100)
    private String customer;

    @Column(nullable = false, length = 200)
    private String site;

    @Column(length = 100)
    private String technician;

    @Column(nullable = false, length = 50)
    private String priority;

    @Column(columnDefinition = "TEXT")
    private String issue;

    @Column(nullable = false, length = 50)
    private String status;

    @Column(name = "sla_time", length = 50)
    private String slaTime;

    @Column(name = "sla_overdue")
    private Boolean slaOverdue = false;

    @Column(name = "sent_at")
    private Instant sentAt;

    @Column(name = "responded_at")
    private Instant respondedAt;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "reject_reason", columnDefinition = "TEXT")
    private String rejectReason;

    @Column(name = "job_type", length = 100)
    private String jobType = "service_repairs";

    @Column(name = "device_id", length = 50)
    private String deviceId;

    @Column(name = "device_name", length = 100)
    private String deviceName;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    // Constructors
    public Ticket() {}

    public Ticket(String id, String customer, String site, String technician, String priority, String issue, String status, String slaTime, Boolean slaOverdue, Instant sentAt, Instant respondedAt, String rejectReason, String jobType, String deviceId, String deviceName) {
        this.id = id;
        this.customer = customer;
        this.site = site;
        this.technician = technician;
        this.priority = priority;
        this.issue = issue;
        this.status = status;
        this.slaTime = slaTime;
        this.slaOverdue = slaOverdue;
        this.sentAt = sentAt;
        this.respondedAt = respondedAt;
        this.rejectReason = rejectReason;
        this.jobType = jobType;
        this.deviceId = deviceId;
        this.deviceName = deviceName;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCustomer() { return customer; }
    public void setCustomer(String customer) { this.customer = customer; }

    public String getSite() { return site; }
    public void setSite(String site) { this.site = site; }

    public String getTechnician() { return technician; }
    public void setTechnician(String technician) { this.technician = technician; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getIssue() { return issue; }
    public void setIssue(String issue) { this.issue = issue; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getSlaTime() { return slaTime; }
    public void setSlaTime(String slaTime) { this.slaTime = slaTime; }

    public Boolean getSlaOverdue() { return slaOverdue; }
    public void setSlaOverdue(Boolean slaOverdue) { this.slaOverdue = slaOverdue; }

    public Instant getSentAt() { return sentAt; }
    public void setSentAt(Instant sentAt) { this.sentAt = sentAt; }

    public Instant getRespondedAt() { return respondedAt; }
    public void setRespondedAt(Instant respondedAt) { this.respondedAt = respondedAt; }

    public String getRejectReason() { return rejectReason; }
    public void setRejectReason(String rejectReason) { this.rejectReason = rejectReason; }

    public String getJobType() { return jobType; }
    public void setJobType(String jobType) { this.jobType = jobType; }

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public String getDeviceName() { return deviceName; }
    public void setDeviceName(String deviceName) { this.deviceName = deviceName; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    @Override
    public String getZone() {
        return this.site;
    }
}
