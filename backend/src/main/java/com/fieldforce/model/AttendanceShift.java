package com.fieldforce.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "attendance_shifts")
public class AttendanceShift {

    @Id
    @Column(name = "user_id", length = 50)
    private String userId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 100)
    private String team;

    @Column(length = 100)
    private String zone;

    @Column(name = "shift_status", nullable = false, length = 50)
    private String shiftStatus = "off_shift";

    private Boolean online = false;

    @Column(name = "punch_in_at")
    private Instant punchInAt;

    @Column(name = "punch_out_at")
    private Instant punchOutAt;

    @Column(name = "break_start_at")
    private Instant breakStartAt;

    @Column(name = "total_break_ms")
    private Long totalBreakMs = 0L;

    @Column(name = "gps_lat")
    private Double gpsLat;

    @Column(name = "gps_lng")
    private Double gpsLng;

    @Column(name = "gps_address", columnDefinition = "TEXT")
    private String gpsAddress;

    // Constructors
    public AttendanceShift() {}

    public AttendanceShift(String userId, String name, String team, String zone, String shiftStatus, Boolean online, Instant punchInAt, Instant punchOutAt, Instant breakStartAt, Long totalBreakMs, Double gpsLat, Double gpsLng, String gpsAddress) {
        this.userId = userId;
        this.name = name;
        this.team = team;
        this.zone = zone;
        this.shiftStatus = shiftStatus;
        this.online = online;
        this.punchInAt = punchInAt;
        this.punchOutAt = punchOutAt;
        this.breakStartAt = breakStartAt;
        this.totalBreakMs = totalBreakMs;
        this.gpsLat = gpsLat;
        this.gpsLng = gpsLng;
        this.gpsAddress = gpsAddress;
    }

    // Getters and Setters
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getTeam() { return team; }
    public void setTeam(String team) { this.team = team; }

    public String getZone() { return zone; }
    public void setZone(String zone) { this.zone = zone; }

    public String getShiftStatus() { return shiftStatus; }
    public void setShiftStatus(String shiftStatus) { this.shiftStatus = shiftStatus; }

    public Boolean getOnline() { return online; }
    public void setOnline(Boolean online) { this.online = online; }

    public Instant getPunchInAt() { return punchInAt; }
    public void setPunchInAt(Instant punchInAt) { this.punchInAt = punchInAt; }

    public Instant getPunchOutAt() { return punchOutAt; }
    public void setPunchOutAt(Instant punchOutAt) { this.punchOutAt = punchOutAt; }

    public Instant getBreakStartAt() { return breakStartAt; }
    public void setBreakStartAt(Instant breakStartAt) { this.breakStartAt = breakStartAt; }

    public Long getTotalBreakMs() { return totalBreakMs; }
    public void setTotalBreakMs(Long totalBreakMs) { this.totalBreakMs = totalBreakMs; }

    public Double getGpsLat() { return gpsLat; }
    public void setGpsLat(Double gpsLat) { this.gpsLat = gpsLat; }

    public Double getGpsLng() { return gpsLng; }
    public void setGpsLng(Double gpsLng) { this.gpsLng = gpsLng; }

    public String getGpsAddress() { return gpsAddress; }
    public void setGpsAddress(String gpsAddress) { this.gpsAddress = gpsAddress; }
}
