package com.fieldforce.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "attendance_events")
public class AttendanceEvent {

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "technician_id", nullable = false, length = 50)
    private String technicianId;

    @Column(name = "technician_name", nullable = false, length = 100)
    private String technicianName;

    @Column(nullable = false, length = 50)
    private String type; // PUNCH_IN, PUNCH_OUT, BREAK_START, BREAK_END

    @Column(nullable = false)
    private Instant timestamp;

    @Column(name = "gps_lat")
    private Double gpsLat;

    @Column(name = "gps_lng")
    private Double gpsLng;

    @Column(name = "gps_address", columnDefinition = "TEXT")
    private String gpsAddress;

    @Column(length = 100)
    private String zone;

    // Constructors
    public AttendanceEvent() {}

    public AttendanceEvent(String id, String technicianId, String technicianName, String type, Instant timestamp, Double gpsLat, Double gpsLng, String gpsAddress, String zone) {
        this.id = id;
        this.technicianId = technicianId;
        this.technicianName = technicianName;
        this.type = type;
        this.timestamp = timestamp;
        this.gpsLat = gpsLat;
        this.gpsLng = gpsLng;
        this.gpsAddress = gpsAddress;
        this.zone = zone;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTechnicianId() { return technicianId; }
    public void setTechnicianId(String technicianId) { this.technicianId = technicianId; }

    public String getTechnicianName() { return technicianName; }
    public void setTechnicianName(String technicianName) { this.technicianName = technicianName; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public Double getGpsLat() { return gpsLat; }
    public void setGpsLat(Double gpsLat) { this.gpsLat = gpsLat; }

    public Double getGpsLng() { return gpsLng; }
    public void setGpsLng(Double gpsLng) { this.gpsLng = gpsLng; }

    public String getGpsAddress() { return gpsAddress; }
    public void setGpsAddress(String gpsAddress) { this.gpsAddress = gpsAddress; }

    public String getZone() { return zone; }
    public void setZone(String zone) { this.zone = zone; }
}
