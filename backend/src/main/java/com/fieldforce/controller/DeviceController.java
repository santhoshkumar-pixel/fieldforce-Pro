package com.fieldforce.controller;

import com.fieldforce.model.Device;
import com.fieldforce.repository.DeviceRepository;
import com.fieldforce.service.PermissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/devices")
public class DeviceController {

    @Autowired
    private DeviceRepository deviceRepository;

    @Autowired
    private PermissionService permissionService;

    @Autowired
    private com.fieldforce.service.DeviceInventoryService deviceInventoryService;

    @GetMapping
    public ResponseEntity<?> getAllDevices(
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader) {
        if (roleHeader == null || !permissionService.hasPermission(roleHeader, "devices.view")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        List<Device> all = deviceRepository.findAll();
        if (zoneHeader != null && !zoneHeader.isEmpty()) {
            all = all.stream()
                .filter(d -> permissionService.hasRegionAccess(roleHeader, zoneHeader, d.getZone()))
                .collect(java.util.stream.Collectors.toList());
        }
        return ResponseEntity.ok(all);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDeviceById(
            @PathVariable String id, 
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader) {
        if (roleHeader == null || !permissionService.hasPermission(roleHeader, "devices.view")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        return deviceRepository.findById(id).map(device -> {
            if (!permissionService.hasRegionAccess(roleHeader, zoneHeader, device.getZone())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: cross-region device access not allowed"));
            }
            return ResponseEntity.ok(device);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createDevice(
            @RequestBody Device device, 
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader) {
        if (roleHeader == null || !permissionService.hasPermission(roleHeader, "devices.configure")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        if (!permissionService.hasRegionAccess(roleHeader, zoneHeader, device.getZone())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: cannot create device in a different region"));
        }
        Device saved = deviceRepository.save(device);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateDevice(
            @PathVariable String id, 
            @RequestBody Device deviceDetails, 
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader) {
        if (roleHeader == null || !permissionService.hasPermission(roleHeader, "devices.configure")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        if (!permissionService.hasRegionAccess(roleHeader, zoneHeader, deviceDetails.getZone())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: cannot update device to a different region"));
        }
        return deviceRepository.findById(id).map(device -> {
            if (!permissionService.hasRegionAccess(roleHeader, zoneHeader, device.getZone())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: cannot modify device in a different region"));
            }
            device.setName(deviceDetails.getName());
            device.setType(deviceDetails.getType());
            device.setStatus(deviceDetails.getStatus());
            device.setFirmware(deviceDetails.getFirmware());
            device.setConnectivity(deviceDetails.getConnectivity());
            device.setBattery(deviceDetails.getBattery());
            device.setLastSync(deviceDetails.getLastSync());
            device.setSite(deviceDetails.getSite());
            device.setShedId(deviceDetails.getShedId());
            device.setStatusDurationDays(deviceDetails.getStatusDurationDays());
            device.setPickDate(deviceDetails.getPickDate());
            device.setDropDate(deviceDetails.getDropDate());
            device.setPurchaseDate(deviceDetails.getPurchaseDate());
            device.setWarrantyExpiryDate(deviceDetails.getWarrantyExpiryDate());
            Device saved = deviceRepository.save(device);
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDevice(
            @PathVariable String id, 
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader) {
        if (roleHeader == null || !permissionService.hasPermission(roleHeader, "devices.configure")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        return deviceRepository.findById(id).map(device -> {
            if (!permissionService.hasRegionAccess(roleHeader, zoneHeader, device.getZone())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: cannot delete device in a different region"));
            }
            deviceRepository.delete(device);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/assign")
    public ResponseEntity<?> assignDevice(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader,
            @RequestHeader(value = "X-User-Name", required = false) String userNameHeader) {
        if (roleHeader == null || !permissionService.hasPermission(roleHeader, "inventory.manage")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        try {
            String assigneeType = body.get("assigneeType");
            String assigneeId = body.get("assigneeId");
            String assigneeName = body.get("assigneeName");
            String assignmentDate = body.get("assignmentDate");
            String returnDate = body.get("returnDate");
            String ticketId = body.get("ticketId");
            
            Device updated = deviceInventoryService.assignDevice(
                    id, assigneeType, assigneeId, assigneeName, 
                    userNameHeader != null ? userNameHeader : "Admin", assignmentDate, returnDate, ticketId);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/return")
    public ResponseEntity<?> returnDevice(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> body,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader) {
        if (roleHeader == null || !permissionService.hasPermission(roleHeader, "inventory.manage")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        try {
            String returnDate = body != null ? body.get("returnDate") : null;
            Device updated = deviceInventoryService.returnDevice(id, returnDate);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/assignments")
    public ResponseEntity<?> getDeviceAssignmentHistory(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader) {
        if (roleHeader == null || !permissionService.hasPermission(roleHeader, "devices.view")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        return ResponseEntity.ok(deviceInventoryService.getDeviceAssignmentHistory(id));
    }

    @GetMapping("/assignments")
    public ResponseEntity<?> getAllAssignments(
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader) {
        if (roleHeader == null || !permissionService.hasPermission(roleHeader, "devices.view")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        return ResponseEntity.ok(deviceInventoryService.getAllAssignments(roleHeader, zoneHeader));
    }

    @PostMapping("/{id}/maintenance")
    public ResponseEntity<?> createMaintenanceRequest(
            @PathVariable String id,
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader) {
        if (roleHeader == null || !permissionService.hasPermission(roleHeader, "inventory.manage")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        try {
            String reason = (String) body.get("reason");
            String maintenanceDate = (String) body.get("maintenanceDate");
            Double cost = body.get("cost") != null ? Double.valueOf(body.get("cost").toString()) : 0.0;
            String remarks = (String) body.get("remarks");

            com.fieldforce.model.DeviceMaintenanceLog log = deviceInventoryService.createMaintenanceRequest(id, reason, maintenanceDate, cost, remarks);
            return ResponseEntity.ok(log);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/maintenance/{logId}/complete")
    public ResponseEntity<?> completeMaintenance(
            @PathVariable Long logId,
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader) {
        if (roleHeader == null || !permissionService.hasPermission(roleHeader, "inventory.manage")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        try {
            String status = (String) body.get("status"); // Available, Damaged, Lost
            Double cost = body.get("cost") != null ? Double.valueOf(body.get("cost").toString()) : null;
            String remarks = (String) body.get("remarks");
            String completionDate = (String) body.get("completionDate");
            Long componentId = body.get("componentId") != null ? Long.valueOf(body.get("componentId").toString()) : null;
            Integer componentQtyUsed = body.get("componentQtyUsed") != null ? Integer.valueOf(body.get("componentQtyUsed").toString()) : null;

            com.fieldforce.model.DeviceMaintenanceLog log = deviceInventoryService.completeMaintenance(
                    logId, status, cost, remarks, completionDate, componentId, componentQtyUsed);
            return ResponseEntity.ok(log);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/maintenance")
    public ResponseEntity<?> getAllMaintenanceLogs(
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader) {
        if (roleHeader == null || !permissionService.hasPermission(roleHeader, "devices.view")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        return ResponseEntity.ok(deviceInventoryService.getAllMaintenanceLogs(roleHeader, zoneHeader));
    }

    @GetMapping("/reports/inventory")
    public ResponseEntity<?> getInventoryReport(
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader) {
        if (roleHeader == null || !permissionService.hasPermission(roleHeader, "inventory.view")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        return ResponseEntity.ok(deviceInventoryService.getInventoryReport(roleHeader, zoneHeader));
    }

    @GetMapping("/reports/assignments")
    public ResponseEntity<?> getAssignmentReport(
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader) {
        if (roleHeader == null || !permissionService.hasPermission(roleHeader, "inventory.view")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        return ResponseEntity.ok(deviceInventoryService.getAssignmentReport(roleHeader, zoneHeader));
    }

    @GetMapping("/reports/maintenance")
    public ResponseEntity<?> getMaintenanceReport(
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader) {
        if (roleHeader == null || !permissionService.hasPermission(roleHeader, "inventory.view")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        return ResponseEntity.ok(deviceInventoryService.getMaintenanceReport(roleHeader, zoneHeader));
    }

    @GetMapping("/reports/lost-damaged")
    public ResponseEntity<?> getLostDamagedReport(
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader) {
        if (roleHeader == null || !permissionService.hasPermission(roleHeader, "inventory.view")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        return ResponseEntity.ok(deviceInventoryService.getLostDamagedReport(roleHeader, zoneHeader));
    }
}

