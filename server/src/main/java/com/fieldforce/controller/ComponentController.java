package com.fieldforce.controller;

import com.fieldforce.model.Component;
import com.fieldforce.repository.ComponentRepository;
import com.fieldforce.service.ComponentService;
import com.fieldforce.service.PermissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/components")
public class ComponentController {

    @Autowired
    private ComponentService componentService;

    @Autowired
    private ComponentRepository componentRepository;

    @Autowired
    private PermissionService permissionService;

    @GetMapping
    public ResponseEntity<?> getAllComponents(
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader) {
        if (roleHeader == null || (!permissionService.hasPermission(roleHeader, "inventory.view") 
                && !permissionService.hasPermission(roleHeader, "devices.view"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        return ResponseEntity.ok(componentService.getAllComponents(roleHeader, zoneHeader));
    }

    @GetMapping("/usage-logs")
    public ResponseEntity<?> getAllUsageLogs(
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader) {
        if (roleHeader == null || (!permissionService.hasPermission(roleHeader, "inventory.view") 
                && !permissionService.hasPermission(roleHeader, "devices.view"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        return ResponseEntity.ok(componentService.getAllUsageLogs(roleHeader, zoneHeader));
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<?> getComponentHistory(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader) {
        if (roleHeader == null || (!permissionService.hasPermission(roleHeader, "inventory.view") 
                && !permissionService.hasPermission(roleHeader, "devices.view"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }

        return componentRepository.findById(id).map(component -> {
            if (!permissionService.hasRegionAccess(roleHeader, zoneHeader, component.getRegion())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: cannot access component in a different region"));
            }
            return ResponseEntity.ok(componentService.getComponentHistory(id, roleHeader, zoneHeader));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createComponent(
            @RequestBody Component component,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader) {
        if (roleHeader == null || !permissionService.hasPermission(roleHeader, "inventory.manage")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        if (!permissionService.hasRegionAccess(roleHeader, zoneHeader, component.getRegion())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: cannot manage components for this region"));
        }
        String userRegion = permissionService.getZoneRegion(zoneHeader);
        if (userRegion != null && !userRegion.isEmpty() && !"Super Admin".equalsIgnoreCase(roleHeader)) {
            component.setRegion(userRegion);
        }
        Component saved = componentService.createComponent(component);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateComponent(
            @PathVariable Long id,
            @RequestBody Component componentDetails,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader) {
        if (roleHeader == null || !permissionService.hasPermission(roleHeader, "inventory.manage")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        if (!permissionService.hasRegionAccess(roleHeader, zoneHeader, componentDetails.getRegion())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: cannot update component to a different region"));
        }
        return componentRepository.findById(id).map(component -> {
            if (!permissionService.hasRegionAccess(roleHeader, zoneHeader, component.getRegion())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: cannot modify components in a different region"));
            }
            Component updated = componentService.updateComponent(id, componentDetails);
            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteComponent(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader) {
        if (roleHeader == null || !permissionService.hasPermission(roleHeader, "inventory.manage")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        return componentRepository.findById(id).map(component -> {
            if (!permissionService.hasRegionAccess(roleHeader, zoneHeader, component.getRegion())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: cannot delete component in a different region"));
            }
            componentService.deleteComponent(id);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/use")
    public ResponseEntity<?> useComponent(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader,
            @RequestHeader(value = "X-User-Name", required = false) String userNameHeader) {
        if (roleHeader == null || !permissionService.hasPermission(roleHeader, "inventory.manage")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        try {
            Integer quantity = body.get("quantity") != null 
                    ? (Integer) body.get("quantity") 
                    : (body.get("quantityUsed") != null ? (Integer) body.get("quantityUsed") : null);
            String reason = body.get("reason") != null 
                    ? (String) body.get("reason") 
                    : (body.get("notes") != null ? (String) body.get("notes") : (String) body.get("note"));
            String deviceId = (String) body.get("deviceId");
            String ticketId = (String) body.get("ticketId");

            // Backward compatibility helper: if deviceId contains a ticket pattern, set ticketId
            if (ticketId == null && deviceId != null && (deviceId.startsWith("TK-") || deviceId.startsWith("JOB-") || deviceId.startsWith("NEW"))) {
                ticketId = deviceId;
                deviceId = null;
            }

            String finalTicketId = ticketId;
            String finalDeviceId = deviceId;

            return componentRepository.findById(id).map(component -> {
                if (!permissionService.hasRegionAccess(roleHeader, zoneHeader, component.getRegion())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: cannot access component in a different region"));
                }
                try {
                    com.fieldforce.model.ComponentUsageLog log = componentService.useComponent(
                            id, quantity, finalDeviceId, finalTicketId, reason, userNameHeader != null ? userNameHeader : "System");
                    return ResponseEntity.ok(log);
                } catch (Exception e) {
                    return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
                }
            }).orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/adjust")
    public ResponseEntity<?> adjustStock(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader,
            @RequestHeader(value = "X-User-Name", required = false) String userNameHeader) {
        if (roleHeader == null || !permissionService.hasPermission(roleHeader, "inventory.manage")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        try {
            Integer quantityChange = (Integer) body.get("quantityChange");

            return componentRepository.findById(id).map(component -> {
                if (!permissionService.hasRegionAccess(roleHeader, zoneHeader, component.getRegion())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: cannot access component in a different region"));
                }
                try {
                    String note = (String) body.get("note");
                    Component updated = componentService.adjustStock(id, quantityChange, note, null, userNameHeader);
                    return ResponseEntity.ok(updated);
                } catch (Exception e) {
                    return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
                }
            }).orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
