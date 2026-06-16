package com.fieldforce.controller;

import com.fieldforce.model.Notification;
import com.fieldforce.repository.NotificationRepository;
import com.fieldforce.service.PermissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private PermissionService permissionService;

    @GetMapping
    public List<Notification> getAllNotifications(
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader) {
        List<Notification> all = notificationRepository.findAllByOrderByCreatedAtDesc();
        if (roleHeader != null && !"Super Admin".equalsIgnoreCase(roleHeader) && !"Admin".equalsIgnoreCase(roleHeader) && !"Warehouse Manager".equalsIgnoreCase(roleHeader)) {
            String userRegion = permissionService.getZoneRegion(zoneHeader);
            if (userRegion != null) {
                all = all.stream()
                    .filter(n -> {
                        if (n.getTitle() == null) return false;
                        String titleLower = n.getTitle().toLowerCase();
                        String notifRegion = (titleLower.contains("thimphu") || titleLower.contains("paro") || titleLower.contains("bhutan")) ? "Bhutan" : "Goa";
                        return userRegion.equalsIgnoreCase(notifRegion);
                    })
                    .collect(java.util.stream.Collectors.toList());
            }
        }
        return all;
    }

    @PostMapping
    public Notification createNotification(@RequestBody Notification notification) {
        if (notification.getId() == null || notification.getId().isEmpty()) {
            notification.setId("N-" + System.currentTimeMillis());
        }
        return notificationRepository.save(notification);
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Notification> markAsRead(@PathVariable String id) {
        return notificationRepository.findById(id).map(notif -> {
            notif.setUnread(false);
            Notification saved = notificationRepository.save(notif);
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/read-all")
    public ResponseEntity<?> markAllAsRead() {
        List<Notification> all = notificationRepository.findAll();
        for (Notification n : all) {
            n.setUnread(false);
        }
        notificationRepository.saveAll(all);
        return ResponseEntity.ok().build();
    }
}
