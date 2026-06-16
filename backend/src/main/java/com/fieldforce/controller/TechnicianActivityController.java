package com.fieldforce.controller;

import com.fieldforce.model.TechnicianActivityLog;
import com.fieldforce.repository.TechnicianActivityLogRepository;
import com.fieldforce.repository.UserRepository;
import com.fieldforce.service.PermissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/attendance/activities")
public class TechnicianActivityController {

    @Autowired
    private TechnicianActivityLogRepository activityLogRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PermissionService permissionService;

    @GetMapping("/{userId}")
    public ResponseEntity<?> getActivitiesByUserId(
            @PathVariable String userId,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader) {
        
        // Allow technicians to view their own activity, and admins to view any technician's activity
        if (roleHeader == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }

        // Validate region access to target user
        Optional<com.fieldforce.model.User> uOpt = userRepository.findById(userId);
        if (uOpt.isPresent()) {
            if (!permissionService.hasRegionAccess(roleHeader, zoneHeader, uOpt.get().getZone())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: different region"));
            }
        }

        List<TechnicianActivityLog> logs = activityLogRepository.findByUserIdOrderByTimestampDesc(userId);
        return ResponseEntity.ok(logs);
    }
}
