package com.fieldforce.service;

import com.fieldforce.model.Device;
import com.fieldforce.model.DeviceAssignment;
import com.fieldforce.model.DeviceMaintenanceLog;
import com.fieldforce.repository.DeviceRepository;
import com.fieldforce.repository.DeviceAssignmentRepository;
import com.fieldforce.repository.DeviceMaintenanceLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DeviceInventoryService {

    @Autowired
    private DeviceRepository deviceRepository;

    @Autowired
    private DeviceAssignmentRepository deviceAssignmentRepository;

    @Autowired
    private DeviceMaintenanceLogRepository deviceMaintenanceLogRepository;

    @Autowired
    private PermissionService permissionService;

    @Autowired
    private ComponentService componentService;

    // Helper to get current date string
    private String currentDate() {
        return LocalDate.now().toString();
    }

    // Filter devices based on RBAC and zone header
    private List<Device> getFilteredDevices(String roleHeader, String zoneHeader) {
        List<Device> all = deviceRepository.findAll();
        if (zoneHeader != null && !zoneHeader.isEmpty()) {
            return all.stream()
                .filter(d -> permissionService.hasRegionAccess(roleHeader, zoneHeader, d.getZone()))
                .collect(Collectors.toList());
        }
        return all;
    }

    @Transactional
    public Device assignDevice(String deviceId, String assigneeType, String assigneeId, String assigneeName, String assignedBy, String assignmentDate, String returnDate, String ticketId) {
        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new IllegalArgumentException("Device not found: " + deviceId));

        device.setStatus("Assigned");
        device.setAssignedToType(assigneeType);
        device.setAssignedToId(assigneeId);
        device.setAssignedToName(assigneeName);
        device.setAssignmentDate(assignmentDate != null && !assignmentDate.isEmpty() ? assignmentDate : currentDate());
        device.setReturnDate(returnDate);

        // Save device status change
        deviceRepository.save(device);

        // Record history log
        DeviceAssignment assignment = new DeviceAssignment(
                deviceId,
                device.getName(),
                assigneeType,
                assigneeId,
                assigneeName,
                assignedBy,
                assignmentDate != null && !assignmentDate.isEmpty() ? assignmentDate : currentDate(),
                returnDate,
                "ACTIVE"
        );
        assignment.setTicketId(ticketId);
        deviceAssignmentRepository.save(assignment);

        return device;
    }

    @Transactional
    public Device returnDevice(String deviceId, String returnDate) {
        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new IllegalArgumentException("Device not found: " + deviceId));

        device.setStatus("Available");
        device.setAssignedToType(null);
        device.setAssignedToId(null);
        device.setAssignedToName(null);
        device.setAssignmentDate(null);
        device.setReturnDate(null);

        deviceRepository.save(device);

        // Update active assignment to RETURNED
        List<DeviceAssignment> assignments = deviceAssignmentRepository.findByDeviceId(deviceId);
        Optional<DeviceAssignment> activeOpt = assignments.stream()
                .filter(a -> "ACTIVE".equalsIgnoreCase(a.getStatus()))
                .findFirst();

        if (activeOpt.isPresent()) {
            DeviceAssignment active = activeOpt.get();
            active.setStatus("RETURNED");
            active.setReturnDate(returnDate != null && !returnDate.isEmpty() ? returnDate : currentDate());
            deviceAssignmentRepository.save(active);
        }

        return device;
    }

    @Transactional
    public DeviceMaintenanceLog createMaintenanceRequest(String deviceId, String reason, String maintenanceDate, Double cost, String remarks) {
        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new IllegalArgumentException("Device not found: " + deviceId));

        device.setStatus("Maintenance");
        deviceRepository.save(device);

        DeviceMaintenanceLog log = new DeviceMaintenanceLog(
                deviceId,
                device.getName(),
                reason,
                maintenanceDate != null && !maintenanceDate.isEmpty() ? maintenanceDate : currentDate(),
                cost != null ? cost : 0.0,
                remarks,
                "PENDING",
                null
        );

        return deviceMaintenanceLogRepository.save(log);
    }

    @Transactional
    public DeviceMaintenanceLog completeMaintenance(Long logId, String status, Double cost, String remarks, String completionDate, Long componentId, Integer componentQtyUsed) {
        DeviceMaintenanceLog log = deviceMaintenanceLogRepository.findById(logId)
                .orElseThrow(() -> new IllegalArgumentException("Maintenance log not found: " + logId));

        log.setStatus("COMPLETED");
        log.setCompletedAt(completionDate != null && !completionDate.isEmpty() ? completionDate : currentDate());
        if (cost != null) log.setCost(cost);
        
        String finalRemarks = remarks;
        if (componentId != null && componentQtyUsed != null && componentQtyUsed > 0) {
            try {
                componentService.useComponent(componentId, componentQtyUsed, log.getDeviceId(), null, "Device Maintenance repair", null);
                String partInfo = "Used " + componentQtyUsed + " replacement parts (ID: " + componentId + ").";
                finalRemarks = (remarks == null || remarks.isEmpty()) ? partInfo : partInfo + " " + remarks;
            } catch (Exception e) {
                throw new IllegalArgumentException("Failed to consume replacement component: " + e.getMessage());
            }
        }
        
        log.setRemarks(finalRemarks);
        deviceMaintenanceLogRepository.save(log);

        // Bring device back to status based on input (e.g. 'Available', or 'Damaged' if irreparable)
        Device device = deviceRepository.findById(log.getDeviceId()).orElse(null);
        if (device != null) {
            String deviceStatus = "Available";
            if ("Damaged".equalsIgnoreCase(status) || "Lost".equalsIgnoreCase(status)) {
                deviceStatus = status;
            }
            device.setStatus(deviceStatus);
            deviceRepository.save(device);
        }

        return log;
    }

    public List<DeviceAssignment> getDeviceAssignmentHistory(String deviceId) {
        return deviceAssignmentRepository.findByDeviceId(deviceId);
    }

    public List<DeviceAssignment> getAllAssignments(String roleHeader, String zoneHeader) {
        List<DeviceAssignment> all = deviceAssignmentRepository.findAllByOrderByIdDesc();
        if (zoneHeader != null && !zoneHeader.isEmpty()) {
            // Filter by device region access
            return all.stream()
                .filter(a -> {
                    Device d = deviceRepository.findById(a.getDeviceId()).orElse(null);
                    return d != null && permissionService.hasRegionAccess(roleHeader, zoneHeader, d.getZone());
                })
                .collect(Collectors.toList());
        }
        return all;
    }

    public List<DeviceMaintenanceLog> getAllMaintenanceLogs(String roleHeader, String zoneHeader) {
        List<DeviceMaintenanceLog> all = deviceMaintenanceLogRepository.findAll();
        if (zoneHeader != null && !zoneHeader.isEmpty()) {
            return all.stream()
                .filter(m -> {
                    Device d = deviceRepository.findById(m.getDeviceId()).orElse(null);
                    return d != null && permissionService.hasRegionAccess(roleHeader, zoneHeader, d.getZone());
                })
                .collect(Collectors.toList());
        }
        return all;
    }

    // Reports Generation Mappings
    public Map<String, Object> getInventoryReport(String roleHeader, String zoneHeader) {
        List<Device> devices = getFilteredDevices(roleHeader, zoneHeader);
        
        long total = devices.size();
        long available = devices.stream().filter(d -> "Available".equalsIgnoreCase(d.getStatus()) || "Online".equalsIgnoreCase(d.getStatus())).count();
        long assigned = devices.stream().filter(d -> "Assigned".equalsIgnoreCase(d.getStatus())).count();
        long maintenance = devices.stream().filter(d -> "Maintenance".equalsIgnoreCase(d.getStatus()) || "Maintenance Required".equalsIgnoreCase(d.getStatus())).count();
        long damaged = devices.stream().filter(d -> "Damaged".equalsIgnoreCase(d.getStatus())).count();
        long lost = devices.stream().filter(d -> "Lost".equalsIgnoreCase(d.getStatus())).count();

        Map<String, Object> report = new HashMap<>();
        report.put("generatedAt", currentDate());
        report.put("totalDevices", total);
        report.put("availableDevices", available);
        report.put("assignedDevices", assigned);
        report.put("maintenanceDevices", maintenance);
        report.put("damagedDevices", damaged);
        report.put("lostDevices", lost);
        report.put("details", devices);

        return report;
    }

    public List<Map<String, Object>> getAssignmentReport(String roleHeader, String zoneHeader) {
        List<DeviceAssignment> assignments = getAllAssignments(roleHeader, zoneHeader);
        List<Map<String, Object>> report = new ArrayList<>();
        
        for (DeviceAssignment a : assignments) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", a.getId());
            item.put("deviceId", a.getDeviceId());
            
            String devName = "ACE";
            Optional<Device> devOpt = deviceRepository.findById(a.getDeviceId());
            if (devOpt.isPresent()) {
                String t = devOpt.get().getType().toUpperCase();
                if ("FASTSCAN".equals(t)) {
                    devName = "FAST SCAN";
                } else {
                    devName = t;
                }
            } else if (a.getDeviceName() != null) {
                String lower = a.getDeviceName().toLowerCase();
                if (lower.contains("ace")) devName = "ACE";
                else if (lower.contains("mini")) devName = "MINI";
                else if (lower.contains("go")) devName = "GO";
                else if (lower.contains("fast") || lower.contains("scan")) devName = "FAST SCAN";
            }
            item.put("deviceName", devName);
            
            item.put("assigneeType", a.getAssigneeType());
            item.put("assigneeName", a.getAssigneeName());
            item.put("assignedBy", a.getAssignedBy());
            item.put("assignmentDate", a.getAssignmentDate());
            item.put("returnDate", a.getReturnDate());
            item.put("status", a.getStatus());
            item.put("ticketId", a.getTicketId());
            report.add(item);
        }
        return report;
    }

    public List<Map<String, Object>> getMaintenanceReport(String roleHeader, String zoneHeader) {
        List<DeviceMaintenanceLog> logs = getAllMaintenanceLogs(roleHeader, zoneHeader);
        List<Map<String, Object>> report = new ArrayList<>();

        for (DeviceMaintenanceLog l : logs) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", l.getId());
            item.put("deviceId", l.getDeviceId());
            
            String devName = "ACE";
            Optional<Device> devOpt = deviceRepository.findById(l.getDeviceId());
            if (devOpt.isPresent()) {
                String t = devOpt.get().getType().toUpperCase();
                if ("FASTSCAN".equals(t)) {
                    devName = "FAST SCAN";
                } else {
                    devName = t;
                }
            } else if (l.getDeviceName() != null) {
                String lower = l.getDeviceName().toLowerCase();
                if (lower.contains("ace")) devName = "ACE";
                else if (lower.contains("mini")) devName = "MINI";
                else if (lower.contains("go")) devName = "GO";
                else if (lower.contains("fast") || lower.contains("scan")) devName = "FAST SCAN";
            }
            item.put("deviceName", devName);
            
            item.put("reason", l.getReason());
            item.put("maintenanceDate", l.getMaintenanceDate());
            item.put("cost", l.getCost());
            item.put("status", l.getStatus());
            item.put("completedAt", l.getCompletedAt());
            item.put("remarks", l.getRemarks());
            report.add(item);
        }
        return report;
    }

    public List<Device> getLostDamagedReport(String roleHeader, String zoneHeader) {
        List<Device> devices = getFilteredDevices(roleHeader, zoneHeader);
        return devices.stream()
                .filter(d -> "Lost".equalsIgnoreCase(d.getStatus()) || "Damaged".equalsIgnoreCase(d.getStatus()))
                .collect(Collectors.toList());
    }
}
