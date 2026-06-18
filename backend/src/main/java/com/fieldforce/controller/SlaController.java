package com.fieldforce.controller;

import com.fieldforce.model.Ticket;
import com.fieldforce.service.PermissionService;
import com.fieldforce.service.SlaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sla")
public class SlaController {

    @Autowired
    private SlaService slaService;

    @Autowired
    private PermissionService permissionService;

    private boolean checkPermissions(String roleHeader) {
        if (roleHeader == null || roleHeader.isEmpty()) {
            return false;
        }
        // Admin, Manager, and Product Manager can view full SLA Dashboard
        return permissionService.hasPermission(roleHeader, "sla.view") || 
               permissionService.hasPermission(roleHeader, "tickets.view") ||
               "Operational Manager".equalsIgnoreCase(roleHeader) ||
               "Warehouse Manager".equalsIgnoreCase(roleHeader) ||
               "Product Management".equalsIgnoreCase(roleHeader);
    }

    @GetMapping("/metrics")
    public ResponseEntity<?> getSlaMetrics(
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader) {
        if (!checkPermissions(roleHeader)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied: insufficient SLA dashboard permissions"));
        }
        return ResponseEntity.ok(slaService.getSlaMetrics(roleHeader, zoneHeader));
    }

    @GetMapping("/technicians")
    public ResponseEntity<?> getTechnicianPerformance(
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader) {
        if (!checkPermissions(roleHeader)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied: insufficient SLA dashboard permissions"));
        }
        return ResponseEntity.ok(slaService.getTechnicianPerformance(roleHeader, zoneHeader));
    }

    @GetMapping("/reports")
    public ResponseEntity<?> getSlaReports(
            @RequestParam(value = "startDate", required = false) String startDate,
            @RequestParam(value = "endDate", required = false) String endDate,
            @RequestParam(value = "technician", required = false) String technician,
            @RequestParam(value = "severity", required = false) String severity,
            @RequestParam(value = "performance", required = false) String performance,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader) {
        if (!checkPermissions(roleHeader)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied: insufficient SLA reporting permissions"));
        }
        List<Ticket> reportTickets = slaService.getSlaReports(
                startDate, endDate, technician, severity, performance, roleHeader, zoneHeader
        );
        return ResponseEntity.ok(reportTickets);
    }
}
