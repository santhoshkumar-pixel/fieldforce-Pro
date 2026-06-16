package com.fieldforce.model;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {

    @Id
    @Column(length = 50)
    private String id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false, length = 100)
    private String password;

    @Column(nullable = false, length = 50)
    private String role;

    @Column(length = 100)
    private String team;

    @Column(nullable = false, length = 50)
    private String status = "Active";

    @Column(length = 50)
    private String zone;

    @Column(length = 50)
    private String mobile;

    @Column(columnDefinition = "TEXT")
    private String avatar;

    @Column(name = "inactive_date_time", length = 100)
    private String inactiveDateTime;

    @Column(name = "inactivated_by", length = 100)
    private String inactivatedBy;

    @Column(name = "inactivity_reason", columnDefinition = "TEXT")
    private String inactivityReason;

    // Constructors
    public User() {}

    public User(String id, String name, String email, String password, String role, String team, String status, String zone) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role;
        this.team = team;
        this.status = status;
        this.zone = zone;
    }

    public User(String id, String name, String email, String password, String role, String team, String status, String zone, String mobile) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role;
        this.team = team;
        this.status = status;
        this.zone = zone;
        this.mobile = mobile;
    }

    public User(String id, String name, String email, String password, String role, String team, String status, String zone, String mobile, String avatar) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role;
        this.team = team;
        this.status = status;
        this.zone = zone;
        this.mobile = mobile;
        this.avatar = avatar;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getTeam() { return team; }
    public void setTeam(String team) { this.team = team; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getZone() { return zone; }
    public void setZone(String zone) { this.zone = zone; }

    public String getMobile() { return mobile; }
    public void setMobile(String mobile) { this.mobile = mobile; }

    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }

    public String getInactiveDateTime() { return inactiveDateTime; }
    public void setInactiveDateTime(String inactiveDateTime) { this.inactiveDateTime = inactiveDateTime; }

    public String getInactivatedBy() { return inactivatedBy; }
    public void setInactivatedBy(String inactivatedBy) { this.inactivatedBy = inactivatedBy; }

    public String getInactivityReason() { return inactivityReason; }
    public void setInactivityReason(String inactivityReason) { this.inactivityReason = inactivityReason; }
}
