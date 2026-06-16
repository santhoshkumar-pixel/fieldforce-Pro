package com.fieldforce.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @Column(length = 50)
    private String id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(name = "time_label", nullable = false, length = 50)
    private String timeLabel;

    @Column(nullable = false, length = 50)
    private String type; // escalation, sla, device, info, alert

    private Boolean unread = true;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    // Constructors
    public Notification() {}

    public Notification(String id, String title, String timeLabel, String type, Boolean unread, Instant createdAt) {
        this.id = id;
        this.title = title;
        this.timeLabel = timeLabel;
        this.type = type;
        this.unread = unread;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getTimeLabel() { return timeLabel; }
    public void setTimeLabel(String timeLabel) { this.timeLabel = timeLabel; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Boolean getUnread() { return unread; }
    public void setUnread(Boolean unread) { this.unread = unread; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
