package com.fieldforce.model;

import jakarta.persistence.*;

@Entity
@Table(name = "device_assignments")
public class DeviceAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "device_id", nullable = false, length = 50)
    private String deviceId;

    @Column(name = "device_name", length = 100)
    private String deviceName;

    @Column(name = "assignee_type", length = 50)
    private String assigneeType; // EMPLOYEE, FIELD_ENGINEER, BRANCH

    @Column(name = "assignee_id", length = 50)
    private String assigneeId;

    @Column(name = "assignee_name", length = 100)
    private String assigneeName;

    @Column(name = "assigned_by", length = 100)
    private String assignedBy;

    @Column(name = "assignment_date", length = 50)
    private String assignmentDate;

    @Column(name = "return_date", length = 50)
    private String returnDate;

    @Column(length = 50)
    private String status; // ACTIVE, RETURNED

    // Constructors
    public DeviceAssignment() {}

    public DeviceAssignment(String deviceId, String deviceName, String assigneeType, String assigneeId, String assigneeName, String assignedBy, String assignmentDate, String returnDate, String status) {
        this.deviceId = deviceId;
        this.deviceName = deviceName;
        this.assigneeType = assigneeType;
        this.assigneeId = assigneeId;
        this.assigneeName = assigneeName;
        this.assignedBy = assignedBy;
        this.assignmentDate = assignmentDate;
        this.returnDate = returnDate;
        this.status = status;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public String getDeviceName() { return deviceName; }
    public void setDeviceName(String deviceName) { this.deviceName = deviceName; }

    public String getAssigneeType() { return assigneeType; }
    public void setAssigneeType(String assigneeType) { this.assigneeType = assigneeType; }

    public String getAssigneeId() { return assigneeId; }
    public void setAssigneeId(String assigneeId) { this.assigneeId = assigneeId; }

    public String getAssigneeName() { return assigneeName; }
    public void setAssigneeName(String assigneeName) { this.assigneeName = assigneeName; }

    public String getAssignedBy() { return assignedBy; }
    public void setAssignedBy(String assignedBy) { this.assignedBy = assignedBy; }

    public String getAssignmentDate() { return assignmentDate; }
    public void setAssignmentDate(String assignmentDate) { this.assignmentDate = assignmentDate; }

    public String getReturnDate() { return returnDate; }
    public void setReturnDate(String returnDate) { this.returnDate = returnDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    @Column(name = "ticket_id", length = 50)
    private String ticketId;

    public String getTicketId() { return ticketId; }
    public void setTicketId(String ticketId) { this.ticketId = ticketId; }
}
