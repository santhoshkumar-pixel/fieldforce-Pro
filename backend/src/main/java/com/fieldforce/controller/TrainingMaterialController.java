package com.fieldforce.controller;

import com.fieldforce.model.TrainingMaterial;
import com.fieldforce.repository.TrainingMaterialRepository;
import com.fieldforce.service.PermissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/training")
public class TrainingMaterialController {

    @Autowired
    private TrainingMaterialRepository repository;

    @Autowired
    private PermissionService permissionService;

    @GetMapping
    public ResponseEntity<?> getAll(@RequestParam(required = false) String role, @RequestHeader(value = "X-User-Role", required = false) String roleHeader) {
        if (roleHeader == null || !permissionService.hasPermission(roleHeader, "training.view")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        if (role == null || role.isEmpty()) {
            return ResponseEntity.ok(repository.findAll());
        }
        
        String normalizedRole = role;
        String trimmed = role.trim();
        if ("Technician".equalsIgnoreCase(trimmed) || "Field Technician".equalsIgnoreCase(trimmed)) {
            normalizedRole = "Field Technician";
        } else if ("Admin".equalsIgnoreCase(trimmed) || "Scheme PC".equalsIgnoreCase(trimmed) || "Scheme Admin".equalsIgnoreCase(trimmed) || "Scheme CP".equalsIgnoreCase(trimmed) || "Operational Manager".equalsIgnoreCase(trimmed) || "Project Manager".equalsIgnoreCase(trimmed)) {
            normalizedRole = "Operational Manager";
        } else if ("Warehouse".equalsIgnoreCase(trimmed) || "Warehouse Manager".equalsIgnoreCase(trimmed)) {
            normalizedRole = "Warehouse Manager";
        }

        return ResponseEntity.ok(repository.findByTargetedRoleOrTargetedRole("ALL", normalizedRole));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody TrainingMaterial material, @RequestHeader(value = "X-User-Role", required = false) String roleHeader) {
        if (roleHeader == null || !permissionService.hasPermission(roleHeader, "training.manage")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        if (material.getId() == null || material.getId().isEmpty()) {
            material.setId("TM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }
        material.setCreatedAt(LocalDateTime.now());
        TrainingMaterial saved = repository.save(material);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id, @RequestHeader(value = "X-User-Role", required = false) String roleHeader) {
        if (roleHeader == null || !permissionService.hasPermission(roleHeader, "training.manage")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        if (!repository.existsById(id)) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        repository.deleteById(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file, @RequestHeader(value = "X-User-Role", required = false) String roleHeader) {
        if (roleHeader == null || !permissionService.hasPermission(roleHeader, "training.manage")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        try {
            if (file.isEmpty()) {
                return new ResponseEntity<>(Map.of("error", "File is empty"), HttpStatus.BAD_REQUEST);
            }

            File uploadDir = new File("uploads");
            if (!uploadDir.exists()) {
                uploadDir.mkdirs();
            }

            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            
            String uniqueName = UUID.randomUUID().toString() + extension;
            Path path = Paths.get("uploads", uniqueName);
            Files.write(path, file.getBytes());

            String fileUrl = "/uploads/" + uniqueName;
            
            Map<String, String> response = new HashMap<>();
            response.put("url", fileUrl);
            response.put("fileName", originalFilename);
            
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("error", e.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
