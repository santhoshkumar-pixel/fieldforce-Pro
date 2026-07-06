package com.fieldforce.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "training_materials")
public class TrainingMaterial {

    @Id
    @Column(length = 50)
    private String id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 50)
    private String type; // TEXT, FILE, VIDEO

    @Column(name = "targeted_role", nullable = false, length = 50)
    private String targetedRole; // ALL, Operational Manager, Field Technician, etc.

    @Column(columnDefinition = "TEXT")
    private String content; // Rich text / markdown / body text for type TEXT

    @Column(name = "file_name", length = 255)
    private String fileName; // Display name of the file

    @Column(name = "file_path", length = 500)
    private String filePath; // URL for FILE / VIDEO path or external link

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    // Constructors
    public TrainingMaterial() {}

    public TrainingMaterial(String id, String title, String description, String type, String targetedRole, String content, String fileName, String filePath) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.type = type;
        this.targetedRole = targetedRole;
        this.content = content;
        this.fileName = fileName;
        this.filePath = filePath;
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getTargetedRole() { return targetedRole; }
    public void setTargetedRole(String targetedRole) { this.targetedRole = targetedRole; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
