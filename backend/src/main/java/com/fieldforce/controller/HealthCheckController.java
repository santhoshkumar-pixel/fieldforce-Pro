package com.fieldforce.controller;

import com.fieldforce.service.PermissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.lang.management.ManagementFactory;
import java.lang.management.ThreadMXBean;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthCheckController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PermissionService permissionService;

    @Autowired
    private com.fieldforce.repository.UserRepository userRepository;

    @Autowired
    private com.fieldforce.repository.DeviceRepository deviceRepository;

    @Autowired
    private com.fieldforce.repository.TicketRepository ticketRepository;

    @Autowired
    private com.fieldforce.repository.ComponentRepository componentRepository;

    @Autowired
    private com.fieldforce.repository.AttendanceShiftRepository shiftRepository;

    @Autowired
    private com.fieldforce.repository.NotificationRepository notificationRepository;

    @GetMapping("/diagnostics")
    public ResponseEntity<?> getDiagnostics(
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader) {
        
        // Restrict diagnostics to Super Admin or Operational Manager for security
        if (roleHeader == null || 
            (!"Super Admin".equalsIgnoreCase(roleHeader) && !"Operational Manager".equalsIgnoreCase(roleHeader))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied: insufficient permissions to view diagnostics"));
        }

        Map<String, Object> report = new HashMap<>();
        
        // 1. Database Health Check
        Map<String, Object> dbHealth = new HashMap<>();
        try {
            long startTime = System.currentTimeMillis();
            Integer val = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            long endTime = System.currentTimeMillis();
            
            dbHealth.put("status", "Healthy");
            dbHealth.put("pingVal", val);
            dbHealth.put("latencyMs", endTime - startTime);
            dbHealth.put("message", "Database connection is active and responsive");
        } catch (Exception e) {
            dbHealth.put("status", "Unhealthy");
            dbHealth.put("error", e.getMessage());
            dbHealth.put("message", "Failed to query database");
        }
        report.put("database", dbHealth);

        // 2. Table Counts / Seeding Status
        Map<String, Object> counts = new HashMap<>();
        try {
            counts.put("usersCount", userRepository.count());
            counts.put("devicesCount", deviceRepository.count());
            counts.put("ticketsCount", ticketRepository.count());
            counts.put("componentsCount", componentRepository.count());
            counts.put("shiftsCount", shiftRepository.count());
            counts.put("notificationsCount", notificationRepository.count());
            counts.put("status", "Success");
        } catch (Exception e) {
            counts.put("status", "Error");
            counts.put("error", e.getMessage());
        }
        report.put("dataCounts", counts);

        // 3. JVM System Health
        Map<String, Object> systemStats = new HashMap<>();
        try {
            Runtime runtime = Runtime.getRuntime();
            long freeMemory = runtime.freeMemory();
            long totalMemory = runtime.totalMemory();
            long maxMemory = runtime.maxMemory();
            
            systemStats.put("freeMemoryBytes", freeMemory);
            systemStats.put("totalMemoryBytes", totalMemory);
            systemStats.put("maxMemoryBytes", maxMemory);
            systemStats.put("usedMemoryBytes", totalMemory - freeMemory);
            systemStats.put("availableProcessors", runtime.availableProcessors());
            
            ThreadMXBean threadBean = ManagementFactory.getThreadMXBean();
            systemStats.put("activeThreads", threadBean.getThreadCount());
            systemStats.put("uptimeMs", ManagementFactory.getRuntimeMXBean().getUptime());
            systemStats.put("jvmVersion", System.getProperty("java.version"));
            systemStats.put("jvmVendor", System.getProperty("java.vendor"));
            systemStats.put("osName", System.getProperty("os.name"));
            systemStats.put("osVersion", System.getProperty("os.version"));
            
            systemStats.put("status", "Healthy");
        } catch (Exception e) {
            systemStats.put("status", "Error");
            systemStats.put("error", e.getMessage());
        }
        report.put("system", systemStats);
        
        report.put("status", "Healthy");
        report.put("timestamp", java.time.Instant.now().toString());

        return ResponseEntity.ok(report);
    }
}
