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
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader) {
        if (roleHeader != null && "Super Admin".equalsIgnoreCase(roleHeader.trim())) {
            return notificationRepository.findAllByOrderByCreatedAtDesc();
        }
        if (userIdHeader == null || userIdHeader.isEmpty()) {
            return java.util.Collections.emptyList();
        }
        return notificationRepository.findAllByUserIdOrderByCreatedAtDesc(userIdHeader);
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
