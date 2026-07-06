package com.fieldforce.model;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "roles")
public class Role {

    @Id
    @Column(length = 50)
    private String id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "users_count")
    private Integer usersCount = 0;
    @Column(name = "super_admin")
    private Boolean superAdmin = false;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "role_permissions", joinColumns = @JoinColumn(name = "role_id"))
    @Column(name = "permission")
    private List<String> permissions = new ArrayList<>();

    // Constructors
    public Role() {}

    public Role(String id, String name, String description, Integer usersCount, List<String> permissions) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.usersCount = usersCount;
        this.permissions = permissions;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getUsersCount() { return usersCount; }
    public void setUsersCount(Integer usersCount) { this.usersCount = usersCount; }

    public List<String> getPermissions() { return permissions; }
    public void setPermissions(List<String> permissions) { this.permissions = permissions; }

    public boolean isSuperAdmin() { return superAdmin != null && superAdmin; }
    public void setSuperAdmin(Boolean superAdmin) { this.superAdmin = superAdmin; }
}
