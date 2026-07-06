package com.fieldforce.model;

import jakarta.persistence.*;

@Entity
@Table(name = "teams")
public class Team {

    @Id
    @Column(length = 50)
    private String id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(nullable = false, length = 100)
    private String zone;

    @Column(nullable = false, length = 100)
    private String lead;

    private Integer members = 0;

    @Column(name = "open_tickets")
    private Integer openTickets = 0;

    @Column(name = "sla_compliance")
    private Integer slaCompliance = 100;

    @Column(length = 100)
    private String place;

    // Constructors
    public Team() {}

    public Team(String id, String name, String zone, String lead, Integer members, Integer openTickets, Integer slaCompliance, String place) {
        this.id = id;
        this.name = name;
        this.zone = zone;
        this.lead = lead;
        this.members = members;
        this.openTickets = openTickets;
        this.slaCompliance = slaCompliance;
        this.place = place;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getZone() { return zone; }
    public void setZone(String zone) { this.zone = zone; }

    public String getLead() { return lead; }
    public void setLead(String lead) { this.lead = lead; }

    public Integer getMembers() { return members; }
    public void setMembers(Integer members) { this.members = members; }

    public Integer getOpenTickets() { return openTickets; }
    public void setOpenTickets(Integer openTickets) { this.openTickets = openTickets; }

    public Integer getSlaCompliance() { return slaCompliance; }
    public void setSlaCompliance(Integer slaCompliance) { this.slaCompliance = slaCompliance; }

    public String getPlace() { return place; }
    public void setPlace(String place) { this.place = place; }
}
