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

    @Column(name = "accepted_at")
    private Instant acceptedAt;

    @Column(name = "reached_site_at")
    private Instant reachedSiteAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Column(name = "ack_deadline")
    private Instant ackDeadline;

    @Column(name = "response_deadline")
    private Instant responseDeadline;

    @Column(name = "resolution_deadline")
    private Instant resolutionDeadline;

    @Column(name = "ack_sla_status", length = 50)
    private String ackSlaStatus = "PENDING";

    @Column(name = "response_sla_status", length = 50)
    private String responseSlaStatus = "PENDING";

    @Column(name = "resolution_sla_status", length = 50)
    private String resolutionSlaStatus = "PENDING";

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

    public Instant getAcceptedAt() { return acceptedAt; }
    public void setAcceptedAt(Instant acceptedAt) { this.acceptedAt = acceptedAt; }

    public Instant getReachedSiteAt() { return reachedSiteAt; }
    public void setReachedSiteAt(Instant reachedSiteAt) { this.reachedSiteAt = reachedSiteAt; }

    public Instant getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(Instant resolvedAt) { this.resolvedAt = resolvedAt; }

    public Instant getAckDeadline() { return ackDeadline; }
    public void setAckDeadline(Instant ackDeadline) { this.ackDeadline = ackDeadline; }

    public Instant getResponseDeadline() { return responseDeadline; }
    public void setResponseDeadline(Instant responseDeadline) { this.responseDeadline = responseDeadline; }

    public Instant getResolutionDeadline() { return resolutionDeadline; }
    public void setResolutionDeadline(Instant resolutionDeadline) { this.resolutionDeadline = resolutionDeadline; }

    public String getAckSlaStatus() { return ackSlaStatus; }
    public void setAckSlaStatus(String ackSlaStatus) { this.ackSlaStatus = ackSlaStatus; }

    public String getResponseSlaStatus() { return responseSlaStatus; }
    public void setResponseSlaStatus(String responseSlaStatus) { this.responseSlaStatus = responseSlaStatus; }

    public String getResolutionSlaStatus() { return resolutionSlaStatus; }
    public void setResolutionSlaStatus(String resolutionSlaStatus) { this.resolutionSlaStatus = resolutionSlaStatus; }

    public void calculateSlaDeadlines() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        String sev = this.priority != null ? this.priority.toUpperCase() : "MEDIUM";
        long ackMin = 30;
        long respMin = 120;
        long resMin = 480;
        
        switch (sev) {
            case "CRITICAL":
                ackMin = 5;
                respMin = 30;
                resMin = 120;
                break;
            case "HIGH":
                ackMin = 15;
                respMin = 60;
                resMin = 240;
                break;
            case "MEDIUM":
                ackMin = 30;
                respMin = 120;
                resMin = 480;
                break;
            case "LOW":
                ackMin = 60;
                respMin = 240;
                resMin = 1440;
                break;
        }
        
        this.ackDeadline = this.createdAt.plus(java.time.Duration.ofMinutes(ackMin));
        this.responseDeadline = this.createdAt.plus(java.time.Duration.ofMinutes(respMin));
        this.resolutionDeadline = this.createdAt.plus(java.time.Duration.ofMinutes(resMin));
        
        this.updateSlaStatuses();
    }

    public void updateSlaStatuses() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.ackDeadline == null || this.responseDeadline == null || this.resolutionDeadline == null) {
            String sev = this.priority != null ? this.priority.toUpperCase() : "MEDIUM";
            long ackMin = 30;
            long respMin = 120;
            long resMin = 480;
            
            switch (sev) {
                case "CRITICAL":
                    ackMin = 5;
                    respMin = 30;
                    resMin = 120;
                    break;
                case "HIGH":
                    ackMin = 15;
                    respMin = 60;
                    resMin = 240;
                    break;
                case "MEDIUM":
                    ackMin = 30;
                    respMin = 120;
                    resMin = 480;
                    break;
                case "LOW":
                    ackMin = 60;
                    respMin = 240;
                    resMin = 1440;
                    break;
            }
            this.ackDeadline = this.createdAt.plus(java.time.Duration.ofMinutes(ackMin));
            this.responseDeadline = this.createdAt.plus(java.time.Duration.ofMinutes(respMin));
            this.resolutionDeadline = this.createdAt.plus(java.time.Duration.ofMinutes(resMin));
        }

        Instant now = Instant.now();
        
        // Acknowledgement SLA
        if (this.acceptedAt != null) {
            this.ackSlaStatus = (this.acceptedAt.isBefore(this.ackDeadline) || this.acceptedAt.equals(this.ackDeadline)) ? "MET" : "BREACHED";
        } else {
            this.ackSlaStatus = now.isAfter(this.ackDeadline) ? "OVERDUE" : "PENDING";
        }
        
        // Response SLA
        if (this.reachedSiteAt != null) {
            this.responseSlaStatus = (this.reachedSiteAt.isBefore(this.responseDeadline) || this.reachedSiteAt.equals(this.responseDeadline)) ? "MET" : "BREACHED";
        } else {
            this.responseSlaStatus = now.isAfter(this.responseDeadline) ? "OVERDUE" : "PENDING";
        }
        
        // Resolution SLA
        if (this.resolvedAt != null) {
            this.resolutionSlaStatus = (this.resolvedAt.isBefore(this.resolutionDeadline) || this.resolvedAt.equals(this.resolutionDeadline)) ? "MET" : "BREACHED";
        } else {
            this.resolutionSlaStatus = now.isAfter(this.resolutionDeadline) ? "OVERDUE" : "PENDING";
        }

        this.slaOverdue = "OVERDUE".equals(this.ackSlaStatus) || "BREACHED".equals(this.ackSlaStatus) ||
                           "OVERDUE".equals(this.responseSlaStatus) || "BREACHED".equals(this.responseSlaStatus) ||
                           "OVERDUE".equals(this.resolutionSlaStatus) || "BREACHED".equals(this.resolutionSlaStatus);
    }

    @Override
    public String getZone() {
        return this.site;
    }
}
