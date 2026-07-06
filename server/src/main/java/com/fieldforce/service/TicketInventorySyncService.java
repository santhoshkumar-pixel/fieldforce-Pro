package com.fieldforce.service;

import com.fieldforce.model.Device;
import com.fieldforce.model.Ticket;
import com.fieldforce.model.Component;
import com.fieldforce.model.DeviceAssignment;
import com.fieldforce.repository.DeviceRepository;
import com.fieldforce.repository.ComponentRepository;
import com.fieldforce.repository.DeviceAssignmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.time.LocalDate;
import java.util.*;

/**
 * Service to handle inventory synchronization for ticket operations.
 * Manages device assignments, component usage, and ticket-inventory linkages.
 *
 * All public methods are @Transactional so any unchecked exception causes
 * a full rollback — including device status changes AND component deductions.
 */
@Service
public class TicketInventorySyncService {

    @Autowired
    private DeviceRepository deviceRepository;

    @Autowired
    private ComponentRepository componentRepository;

    @Autowired
    private DeviceAssignmentRepository deviceAssignmentRepository;

    @Autowired
    private ComponentService componentService;

    @PersistenceContext
    private EntityManager entityManager;

    private String currentDate() {
        return LocalDate.now().toString();
    }

    /**
     * Parse device IDs from comma-separated string.
     * Filters out component entries (which start with "COMP-").
     */
    private List<String> parseDeviceIds(String deviceIdStr) {
        List<String> deviceIds = new ArrayList<>();
        if (deviceIdStr == null || deviceIdStr.isEmpty()) {
            return deviceIds;
        }
        String[] parts = deviceIdStr.split(",");
        for (String part : parts) {
            String id = part.trim();
            if (!id.isEmpty() && !id.startsWith("COMP-")) {
                deviceIds.add(id);
            }
        }
        return deviceIds;
    }

    /**
     * Parse component assignments from deviceId string.
     * Expected format: COMP-{id} ({qty})
     */
    private Map<Long, Integer> parseComponentAssignments(String deviceIdStr) {
        Map<Long, Integer> components = new LinkedHashMap<>();
        if (deviceIdStr == null || deviceIdStr.isEmpty()) {
            return components;
        }
        String[] parts = deviceIdStr.split(",");
        for (String part : parts) {
            String trimmed = part.trim();
            if (trimmed.startsWith("COMP-")) {
                try {
                    String[] compParts = trimmed.split("\\s*\\(");
                    if (compParts.length == 2) {
                        String idPart = compParts[0].replace("COMP-", "").trim();
                        String qtyPart = compParts[1].replace(")", "").trim();
                        Long compId = Long.parseLong(idPart);
                        Integer qty = Integer.parseInt(qtyPart);
                        components.put(compId, qty);
                    }
                } catch (Exception e) {
                    System.err.println("[InventorySync] Failed to parse component assignment: " + trimmed + " — " + e.getMessage());
                }
            }
        }
        return components;
    }

    private String resolveTicketRegion(Ticket ticket) {
        if (ticket == null) return "Goa";
        String site = ticket.getSite();
        String customer = ticket.getCustomer();
        String zone = ticket.getZone();

        String combined = (site != null ? site : "") + " "
                + (customer != null ? customer : "") + " "
                + (zone != null ? zone : "");
        combined = combined.toLowerCase();

        if (combined.contains("bhutan") || combined.contains("thimphu") || combined.contains("paro")) {
            return "Bhutan";
        }
        return "Goa";
    }

    /**
     * Resolves which region a device's site belongs to.
     */
    private String resolveDeviceRegion(String site) {
        if (site == null || site.isEmpty()) return "Goa";
        String s = site.toLowerCase();
        if (s.contains("bhutan") || s.contains("thimphu") || s.contains("paro")) {
            return "Bhutan";
        }
        // All Goa cities + warehouse default
        return "Goa";
    }

    /**
     * Validates that all requested devices and components can be allocated to the ticket.
     * Must be called AFTER reversal so restored stock values are visible.
     * Flushes the EntityManager before reading stock to ensure previous restores are reflected.
     */
    private void validateAllocation(Ticket ticket, List<String> deviceIds, Map<Long, Integer> componentAssignments) {
        // Flush all pending JPA writes so that restored stock quantities are visible
        entityManager.flush();

        String ticketRegion = resolveTicketRegion(ticket);

        // 1. Validate Devices
        for (String deviceId : deviceIds) {
            if (deviceId == null || deviceId.isEmpty()) continue;

            Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new IllegalArgumentException(
                    "Device " + deviceId + " not found. Please verify the device ID."));

            String status = device.getStatus();
            String devSite = device.getSite();
            boolean isWarehouseDevice = devSite == null || devSite.isEmpty()
                || devSite.toLowerCase().contains("warehouse");

            // Allow assignable inventory statuses, including legacy health labels
            // that the UI now treats as available for dispatch.
            // Also allow Online only if the device is physically in a warehouse
            boolean statusOk = "Available".equalsIgnoreCase(status)
                || "Not Deployed".equalsIgnoreCase(status)
                || "In Stock".equalsIgnoreCase(status)
                || "Maintenance Completed".equalsIgnoreCase(status)
                || "Critical".equalsIgnoreCase(status)
                || "Maintenance".equalsIgnoreCase(status)
                || "Maintenance Required".equalsIgnoreCase(status)
                || (isWarehouseDevice && "Online".equalsIgnoreCase(status));

            if (status == null || !statusOk) {
                throw new IllegalArgumentException(
                    "Device " + deviceId + " (status: " + status + ") is not available for assignment. "
                    + "Only Available/In-Stock warehouse devices can be assigned.");
            }

            // Region check
            String devRegion = resolveDeviceRegion(devSite);
            if (!devRegion.equalsIgnoreCase(ticketRegion)) {
                throw new IllegalArgumentException(
                    "Region mismatch: Device " + deviceId + " is in " + devRegion
                    + " but the ticket is for " + ticketRegion + ". "
                    + "Please select a device from the " + ticketRegion + " warehouse.");
            }
        }

        // 2. Validate Components — read fresh from DB after flush
        for (Map.Entry<Long, Integer> entry : componentAssignments.entrySet()) {
            Long componentId = entry.getKey();
            Integer qtyNeeded = entry.getValue();
            if (componentId == null || qtyNeeded == null || qtyNeeded <= 0) continue;

            // Clear the JPA 1st-level cache for this entity so we get the latest DB value
            entityManager.clear();

            Component component = componentRepository.findById(componentId)
                .orElseThrow(() -> new IllegalArgumentException(
                    "Component ID " + componentId + " not found in warehouse."));

            int availableQty = componentRepository.findAll().stream()
                .filter(c -> sameComponentPool(component, c))
                .mapToInt(c -> c.getQuantity() != null ? c.getQuantity() : 0)
                .sum();

            if (availableQty < qtyNeeded) {
                throw new IllegalArgumentException(
                    "Insufficient stock for \"" + component.getName() + "\" in "
                    + component.getRegion() + " Warehouse. "
                    + "Available: " + availableQty + ", Required: " + qtyNeeded + ".");
            }

            // Region check
            String compRegion = component.getRegion();
            if (compRegion != null && !compRegion.equalsIgnoreCase(ticketRegion)) {
                throw new IllegalArgumentException(
                    "Region mismatch: Component \"" + component.getName() + "\" is from "
                    + compRegion + " Warehouse but the ticket is for " + ticketRegion + ". "
                    + "Please select components from the " + ticketRegion + " warehouse.");
            }
        }

        System.out.println("[InventorySync] Validation passed for " + deviceIds.size()
            + " device(s) and " + componentAssignments.size() + " component type(s).");
    }

    /**
     * Sync inventory when a ticket is rejected — returns all devices and restores component stock.
     */
    @Transactional
    public void syncOnReject(Ticket ticket) {
        if (ticket == null || ticket.getDeviceId() == null || ticket.getDeviceId().isEmpty()) {
            return;
        }

        System.out.println("[InventorySync] syncOnReject: ticket=" + ticket.getId());
        String currentDateStr = currentDate();

        List<String> deviceIds = parseDeviceIds(ticket.getDeviceId());
        for (String deviceId : deviceIds) {
            returnDevice(deviceId, currentDateStr);
        }

        Map<Long, Integer> components = parseComponentAssignments(ticket.getDeviceId());
        for (Map.Entry<Long, Integer> entry : components.entrySet()) {
            Long compId = entry.getKey();
            Integer qty = entry.getValue();
            if (compId != null && qty != null && qty > 0) {
                componentService.adjustStock(compId, qty, "Ticket " + ticket.getId() + " Rejected - Stock Restored", ticket.getId(), "Warehouse Manager");
            }
        }
    }

    /**
     * Sync inventory when a ticket is completed — marks devices as Online (deployed to field).
     */
    @Transactional
    public void syncOnComplete(Ticket ticket) {
        if (ticket == null || ticket.getDeviceId() == null || ticket.getDeviceId().isEmpty()) {
            return;
        }

        System.out.println("[InventorySync] syncOnComplete: ticket=" + ticket.getId());
        String currentDateStr = currentDate();

        List<String> deviceIds = parseDeviceIds(ticket.getDeviceId());
        for (String deviceId : deviceIds) {
            if (deviceId != null && !deviceId.isEmpty()) {
                Optional<Device> deviceOpt = deviceRepository.findById(deviceId);
                if (deviceOpt.isPresent()) {
                    Device device = deviceOpt.get();
                    device.setStatus("Online");
                    device.setDropDate(currentDateStr);
                    deviceRepository.save(device);
                    System.out.println("[InventorySync] Device " + deviceId + " → Online (field deployed)");
                }
            }
        }
    }

    /**
     * Full transactional sync for ticket assign or reassign.
     *
     * Steps:
     *   1. REVERSAL — restore old device statuses + component stock
     *   2. FLUSH    — push reversals to DB so validation reads fresh values
     *   3. VALIDATE — check availability + region match for new allocation
     *   4. APPLY    — mark devices Assigned, deduct component stock
     *
     * If ANY step throws, the entire transaction is rolled back.
     */
    @Transactional
    public void syncOnUpdate(Ticket oldTicket, Ticket newTicket) {
        if (newTicket == null) return;

        String ticketId = newTicket.getId();
        String currentDateStr = currentDate();

        System.out.println("[InventorySync] syncOnUpdate: ticket=" + ticketId
            + " | old=" + (oldTicket != null ? oldTicket.getDeviceId() : "null")
            + " | new=" + newTicket.getDeviceId());

        // ── STEP 1: REVERSE old allocation ────────────────────────────────────
        if (oldTicket != null && oldTicket.getDeviceId() != null && !oldTicket.getDeviceId().isEmpty()) {
            List<String> oldDeviceIds = parseDeviceIds(oldTicket.getDeviceId());
            for (String deviceId : oldDeviceIds) {
                returnDevice(deviceId, currentDateStr);
                System.out.println("[InventorySync] REVERSED device " + deviceId + " → Available");
            }

            Map<Long, Integer> oldComponents = parseComponentAssignments(oldTicket.getDeviceId());
            for (Map.Entry<Long, Integer> entry : oldComponents.entrySet()) {
                Long compId = entry.getKey();
                Integer qty = entry.getValue();
                if (compId != null && qty != null && qty > 0) {
                    // No silent catch — let it propagate and trigger rollback
                    componentService.adjustStock(compId, qty, "Ticket " + ticketId + " Reassignment - Stock Restored", ticketId, "Warehouse Manager");
                    System.out.println("[InventorySync] REVERSED component " + compId + " +qty=" + qty);
                }
            }
        }

        // ── STEP 2 & 3: FLUSH + VALIDATE new allocation ───────────────────────
        List<String> newDeviceIds = parseDeviceIds(newTicket.getDeviceId());
        Map<Long, Integer> newComponents = parseComponentAssignments(newTicket.getDeviceId());

        if (newDeviceIds.isEmpty() && newComponents.isEmpty()) {
            System.out.println("[InventorySync] No devices/components in new ticket — skipping apply.");
            return;
        }

        // Validates & flushes internally
        validateAllocation(newTicket, newDeviceIds, newComponents);

        // ── STEP 4: APPLY new allocation ──────────────────────────────────────
        for (String deviceId : newDeviceIds) {
            assignDevice(deviceId, newTicket.getTechnician(), currentDateStr, ticketId);
            System.out.println("[InventorySync] ASSIGNED device " + deviceId
                + " → technician=" + newTicket.getTechnician());
        }

        String firstDevId = newDeviceIds.isEmpty() ? null : newDeviceIds.get(0);
        for (Map.Entry<Long, Integer> entry : newComponents.entrySet()) {
            Long componentId = entry.getKey();
            Integer qtyUsed = entry.getValue();
            if (componentId != null && qtyUsed != null && qtyUsed > 0) {
                // No silent catch — propagate so the full transaction rolls back on failure
                componentService.useComponent(
                    componentId,
                    qtyUsed,
                    firstDevId,
                    ticketId,
                    "Assigned to ticket " + ticketId,
                    "Warehouse Manager"
                );
                System.out.println("[InventorySync] DEDUCTED component " + componentId + " qty=" + qtyUsed);
            }
        }

        System.out.println("[InventorySync] syncOnUpdate complete for ticket " + ticketId);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private void returnDevice(String deviceId, String returnDate) {
        if (deviceId == null || deviceId.isEmpty()) return;

        Optional<Device> deviceOpt = deviceRepository.findById(deviceId);
        if (deviceOpt.isPresent()) {
            Device device = deviceOpt.get();
            device.setStatus("Available");
            device.setAssignedToType(null);
            device.setAssignedToId(null);
            device.setAssignedToName(null);
            device.setAssignmentDate(null);
            device.setReturnDate(returnDate);
            deviceRepository.save(device);

            // Mark all active assignments for this device as RETURNED
            deviceAssignmentRepository.findByDeviceId(deviceId).stream()
                .filter(a -> "ACTIVE".equalsIgnoreCase(a.getStatus()))
                .forEach(a -> {
                    a.setStatus("RETURNED");
                    a.setReturnDate(returnDate);
                    deviceAssignmentRepository.save(a);
                });
        }
    }

    private boolean sameComponentPool(Component base, Component candidate) {
        return sameText(base.getName(), candidate.getName())
            && sameText(base.getCategory(), candidate.getCategory())
            && sameText(base.getRegion(), candidate.getRegion());
    }

    private boolean sameText(String a, String b) {
        return (a == null ? "" : a.trim()).equalsIgnoreCase(b == null ? "" : b.trim());
    }

    private void assignDevice(String deviceId, String technician, String assignmentDate, String ticketId) {
        if (deviceId == null || deviceId.isEmpty()) return;
        if (technician == null || technician.isEmpty()) return;

        Optional<Device> deviceOpt = deviceRepository.findById(deviceId);
        if (deviceOpt.isPresent()) {
            Device device = deviceOpt.get();
            device.setStatus("Assigned");
            device.setAssignedToType("Technician");
            device.setAssignedToId(technician);
            device.setAssignedToName(technician);
            device.setAssignmentDate(assignmentDate);
            device.setReturnDate(null);
            deviceRepository.save(device);

            // Close any stale active assignments first
            deviceAssignmentRepository.findByDeviceId(deviceId).stream()
                .filter(a -> "ACTIVE".equalsIgnoreCase(a.getStatus()))
                .forEach(a -> {
                    a.setStatus("RETURNED");
                    a.setReturnDate(assignmentDate);
                    deviceAssignmentRepository.save(a);
                });

            // Create a fresh assignment record linked to this ticket
            DeviceAssignment assignment = new DeviceAssignment(
                deviceId,
                device.getName(),
                "Technician",
                technician,
                technician,
                "Warehouse Manager",
                assignmentDate,
                "",
                "ACTIVE"
            );
            assignment.setTicketId(ticketId);
            deviceAssignmentRepository.save(assignment);
        }
    }
}
