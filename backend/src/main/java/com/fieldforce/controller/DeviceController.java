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
}
