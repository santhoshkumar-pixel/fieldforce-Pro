package com.fieldforce.model;

import jakarta.persistence.*;

@Entity
@Table(name = "component_usage_logs")
public class ComponentUsageLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "component_id")
    private Long componentId;

    @Column(name = "component_name", nullable = false, length = 150)
    private String componentName;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "device_id", length = 50)
    private String deviceId;

    @Column(length = 255)
    private String reason;

    @Column(name = "logged_by", length = 100)
    private String loggedBy;

    @Column(name = "date_logged", length = 50)
    private String dateLogged;

    @Column(name = "ticket_id", length = 50)
    private String ticketId;

    public ComponentUsageLog() {}

    public ComponentUsageLog(Long componentId, String componentName, Integer quantity, String deviceId, String reason, String loggedBy, String dateLogged) {
        this.componentId = componentId;
        this.componentName = componentName;
        this.quantity = quantity;
        this.deviceId = deviceId;
        this.reason = reason;
        this.loggedBy = loggedBy;
        this.dateLogged = dateLogged;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getComponentId() { return componentId; }
    public void setComponentId(Long componentId) { this.componentId = componentId; }

    public String getComponentName() { return componentName; }
    public void setComponentName(String componentName) { this.componentName = componentName; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public String getTicketId() { return ticketId; }
    public void setTicketId(String ticketId) { this.ticketId = ticketId; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getLoggedBy() { return loggedBy; }
    public void setLoggedBy(String loggedBy) { this.loggedBy = loggedBy; }

    public String getDateLogged() { return dateLogged; }
    public void setDateLogged(String dateLogged) { this.dateLogged = dateLogged; }
}
