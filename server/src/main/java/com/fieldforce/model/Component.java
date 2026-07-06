package com.fieldforce.model;

import jakarta.persistence.*;

@Entity
@Table(name = "components")
public class Component implements RegionBound {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(nullable = false)
    private Integer quantity = 0;

    @Column(name = "min_limit", nullable = false)
    private Integer minLimit = 5;

    @Column(nullable = false, length = 150)
    private String warehouse;

    @Column(nullable = false, length = 100)
    private String region;

    @Column(nullable = false, length = 50)
    private String status = "In Stock";

    @Column(name = "last_updated", length = 50)
    private String lastUpdated;

    public Component() {}

    public Component(String name, String category, Integer quantity, Integer minLimit, String warehouse, String region, String status, String lastUpdated) {
        this.name = name;
        this.category = category;
        this.quantity = quantity;
        this.minLimit = minLimit;
        this.warehouse = warehouse;
        this.region = region;
        this.status = status;
        this.lastUpdated = lastUpdated;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public Integer getMinLimit() { return minLimit; }
    public void setMinLimit(Integer minLimit) { this.minLimit = minLimit; }

    public String getWarehouse() { return warehouse; }
    public void setWarehouse(String warehouse) { this.warehouse = warehouse; }

    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(String lastUpdated) { this.lastUpdated = lastUpdated; }

    @Override
    public String getZone() {
        return this.region;
    }
}
