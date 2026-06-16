package com.fieldforce.model;

import jakarta.persistence.*;

@Entity
@Table(name = "devices")
public class Device implements RegionBound {

    @Id
    @Column(length = 50)
    private String id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 100)
    private String type;

    @Column(nullable = false, length = 50)
    private String status;

    @Column(nullable = false, length = 50)
    private String firmware;

    @Column(length = 50)
    private String connectivity;

    private Integer battery = 0;

    @Column(name = "last_sync", length = 50)
    private String lastSync;

    @Column(length = 200)
    private String site;

    @Column(name = "shed_id", length = 50)
    private String shedId;

    @Column(name = "status_duration_days")
    private Integer statusDurationDays = 0;

    @Column(name = "pick_date", length = 50)
    private String pickDate;

    @Column(name = "drop_date", length = 50)
    private String dropDate;

    // Constructors
    public Device() {}

    public Device(String id, String name, String type, String status, String firmware, String connectivity, Integer battery, String lastSync, String site, String shedId, Integer statusDurationDays) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.status = status;
        this.firmware = firmware;
        this.connectivity = connectivity;
        this.battery = battery;
        this.lastSync = lastSync;
        this.site = site;
        this.shedId = shedId;
        this.statusDurationDays = statusDurationDays;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getFirmware() { return firmware; }
    public void setFirmware(String firmware) { this.firmware = firmware; }

    public String getConnectivity() { return connectivity; }
    public void setConnectivity(String connectivity) { this.connectivity = connectivity; }

    public Integer getBattery() { return battery; }
    public void setBattery(Integer battery) { this.battery = battery; }

    public String getLastSync() { return lastSync; }
    public void setLastSync(String lastSync) { this.lastSync = lastSync; }

    public String getSite() { return site; }
    public void setSite(String site) { this.site = site; }

    public String getShedId() { return shedId; }
    public void setShedId(String shedId) { this.shedId = shedId; }

    public Integer getStatusDurationDays() { return statusDurationDays; }
    public void setStatusDurationDays(Integer statusDurationDays) { this.statusDurationDays = statusDurationDays; }

    public String getPickDate() { return pickDate; }
    public void setPickDate(String pickDate) { this.pickDate = pickDate; }

    public String getDropDate() { return dropDate; }
    public void setDropDate(String dropDate) { this.dropDate = dropDate; }

    @Override
    public String getZone() {
        return this.site;
    }
}
