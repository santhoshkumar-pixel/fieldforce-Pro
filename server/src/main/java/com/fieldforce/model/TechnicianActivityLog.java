package com.fieldforce.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "technician_activity_log")
public class TechnicianActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, length = 50)
    private String userId;

    @Column(name = "ticket_id", length = 50)
    private String ticketId;

    @Column(nullable = false, length = 100)
    private String action;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Instant timestamp;

    @Column(name = "lat")
    private Double lat;

    @Column(name = "lng")
    private Double lng;

    @Column(name = "performed_by", length = 100)
    private String performedBy;

    // Constructors
    public TechnicianActivityLog() {}

    public TechnicianActivityLog(String userId, String ticketId, String action, String description, Instant timestamp, Double lat, Double lng) {
        this.userId = userId;
        this.ticketId = ticketId;
        this.action = action;
        this.description = description;
        this.timestamp = timestamp;
        this.lat = lat;
        this.lng = lng;
    }

    public TechnicianActivityLog(String userId, String ticketId, String action, String description, Instant timestamp, Double lat, Double lng, String performedBy) {
        this.userId = userId;
        this.ticketId = ticketId;
        this.action = action;
        this.description = description;
        this.timestamp = timestamp;
        this.lat = lat;
        this.lng = lng;
        this.performedBy = performedBy;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getTicketId() { return ticketId; }
    public void setTicketId(String ticketId) { this.ticketId = ticketId; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public Double getLat() { return lat; }
    public void setLat(Double lat) { this.lat = lat; }

    public Double getLng() { return lng; }
    public void setLng(Double lng) { this.lng = lng; }

    public String getPerformedBy() { return performedBy; }
    public void setPerformedBy(String performedBy) { this.performedBy = performedBy; }
}
