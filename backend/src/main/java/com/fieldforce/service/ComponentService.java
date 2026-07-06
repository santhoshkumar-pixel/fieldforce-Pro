package com.fieldforce.service;

import com.fieldforce.model.Component;
import com.fieldforce.model.ComponentUsageLog;
import com.fieldforce.model.Ticket;
import com.fieldforce.repository.ComponentRepository;
import com.fieldforce.repository.ComponentUsageLogRepository;
import com.fieldforce.repository.TicketRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ComponentService {
    @Autowired
    private ComponentRepository componentRepository;

    @Autowired
    private ComponentUsageLogRepository componentUsageLogRepository;

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private PermissionService permissionService;

    private String currentDate() {
        return LocalDate.now().toString();
    }

    private String currentTimestamp() {
        return Instant.now().toString();
    }

    private void updateComponentStatusAndDate(Component component) {
        if (component.getQuantity() <= 0) {
            component.setStatus("Out of Stock");
        } else if (component.getQuantity() < component.getMinLimit()) {
            component.setStatus("Low Stock");
        } else {
            component.setStatus("In Stock");
        }
        component.setLastUpdated(currentDate());
    }

    public List<Component> getAllComponents(String roleHeader, String zoneHeader) {
        List<Component> all = componentRepository.findAll();
        String userRegion = permissionService.getZoneRegion(zoneHeader);
        if (userRegion != null && !userRegion.isEmpty()) {
            return all.stream()
                    .filter(c -> permissionService.hasRegionAccess(roleHeader, zoneHeader, c.getRegion()))
                    .collect(Collectors.toList());
        }
        return all;
    }

    public List<ComponentUsageLog> getAllUsageLogs(String roleHeader, String zoneHeader) {
        List<ComponentUsageLog> all = componentUsageLogRepository.findAllByOrderByIdDesc();
        String userRegion = permissionService.getZoneRegion(zoneHeader);
        if (userRegion != null && !userRegion.isEmpty()) {
            return componentUsageLogRepository.findByRegion(userRegion);
        }
        return all;
    }

    public List<Map<String, Object>> getComponentHistory(Long componentId, String roleHeader, String zoneHeader) {
        Component component = componentRepository.findById(componentId)
                .orElseThrow(() -> new IllegalArgumentException("Component not found: " + componentId));

        return componentUsageLogRepository.findAllByOrderByIdDesc().stream()
                .filter(log -> log.getComponentId() != null && log.getComponentId().equals(componentId))
                .filter(log -> !isBlank(log.getTicketId()))
                .map(log -> buildComponentHistoryRecord(log, component, roleHeader, zoneHeader))
                .filter(record -> record != null)
                .collect(Collectors.toList());
    }

    @Transactional
    public Component createComponent(Component component) {
        updateComponentStatusAndDate(component);
        return componentRepository.save(component);
    }

    @Transactional
    public Component updateComponent(Long id, Component details) {
        Component component = componentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Component not found: " + id));

        component.setName(details.getName());
        component.setCategory(details.getCategory());
        component.setQuantity(details.getQuantity());
        component.setMinLimit(details.getMinLimit());
        component.setWarehouse(details.getWarehouse());
        component.setRegion(details.getRegion());
        
        updateComponentStatusAndDate(component);
        return componentRepository.save(component);
    }

    @Transactional
    public void deleteComponent(Long id) {
        componentRepository.deleteById(id);
    }
    @Transactional
    public Component adjustStock(Long id, Integer quantityChange, String updatedBy) {
        return adjustStock(id, quantityChange, "Manual stock adjustment", null, updatedBy);
    }

    @Transactional
    public Component adjustStock(Long id, Integer quantityChange, String reason, String ticketId, String updatedBy) {
        if (quantityChange == null) {
            throw new IllegalArgumentException("Quantity change is required");
        }

        Component component = componentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Component not found: " + id));

        int newQty = component.getQuantity() + quantityChange;
        if (newQty < 0) {
            throw new IllegalArgumentException("Quantity cannot be negative: " + newQty);
        }
        component.setQuantity(newQty);
        updateComponentStatusAndDate(component);
        componentRepository.save(component);

        if (quantityChange < 0 || !isBlank(ticketId)) {
            ComponentUsageLog log = new ComponentUsageLog(
                    id,
                    component.getName(),
                    Math.abs(quantityChange),
                    null,
                    !isBlank(reason) ? reason : "Manual stock adjustment",
                    updatedBy != null ? updatedBy : "Admin",
                    currentTimestamp()
            );
            log.setTicketId(ticketId);
            componentUsageLogRepository.save(log);
        }

        return component;
    }

    @Transactional
    public ComponentUsageLog useComponent(Long id, Integer qtyUsed, String deviceId, String ticketId, String reason, String loggedBy) {
        Component component = componentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Component not found: " + id));

        List<Component> stockPool = componentRepository.findAll().stream()
                .filter(c -> sameComponentPool(component, c))
                .sorted(Comparator.comparing(c -> c.getId().equals(id) ? 0 : 1))
                .collect(Collectors.toCollection(ArrayList::new));

        int availableQty = stockPool.stream()
                .mapToInt(c -> c.getQuantity() != null ? c.getQuantity() : 0)
                .sum();

        if (availableQty < qtyUsed) {
            throw new IllegalArgumentException("Insufficient component stock for: " + component.getName());
        }

        int remainingQty = qtyUsed;
        for (Component stockItem : stockPool) {
            if (remainingQty <= 0) break;
            int currentQty = stockItem.getQuantity() != null ? stockItem.getQuantity() : 0;
            int usedFromItem = Math.min(currentQty, remainingQty);
            stockItem.setQuantity(currentQty - usedFromItem);
            updateComponentStatusAndDate(stockItem);
            componentRepository.save(stockItem);
            remainingQty -= usedFromItem;
        }

        ComponentUsageLog log = new ComponentUsageLog(
                id,
                component.getName(),
                qtyUsed,
                deviceId,
                reason,
                loggedBy != null ? loggedBy : "System",
                currentTimestamp()
        );
        log.setTicketId(ticketId);
        return componentUsageLogRepository.save(log);
    }

    private boolean sameComponentPool(Component base, Component candidate) {
        return sameText(base.getName(), candidate.getName())
                && sameText(base.getCategory(), candidate.getCategory())
                && sameText(base.getRegion(), candidate.getRegion());
    }

    private boolean sameText(String a, String b) {
        return (a == null ? "" : a.trim()).equalsIgnoreCase(b == null ? "" : b.trim());
    }

    private Map<String, Object> buildComponentHistoryRecord(ComponentUsageLog log, Component component, String roleHeader, String zoneHeader) {
        Ticket ticket = ticketRepository.findById(log.getTicketId()).orElse(null);
        if (ticket != null && !permissionService.hasRegionAccess(roleHeader, zoneHeader, ticket.getZone())) {
            return null;
        }

        Map<String, Object> record = new LinkedHashMap<>();
        record.put("id", log.getId());
        record.put("ticketId", log.getTicketId());
        record.put("assignedPerson", ticket != null && !isBlank(ticket.getTechnician()) ? ticket.getTechnician() : log.getLoggedBy());
        record.put("assignmentDateTime", resolveHistoryDate(ticket, log));
        record.put("deviceNames", ticket != null ? parseDeviceNames(ticket.getDeviceId(), ticket.getDeviceName()) : new ArrayList<>());
        record.put("componentNames", List.of(!isBlank(log.getComponentName()) ? log.getComponentName() : component.getName()));
        record.put("quantityUsed", log.getQuantity());
        record.put("region", component.getRegion());
        record.put("warehouse", component.getWarehouse());
        record.put("reason", !isBlank(log.getReason()) ? log.getReason() : "Assigned to ticket " + log.getTicketId());
        record.put("loggedBy", log.getLoggedBy());
        return record;
    }

    private Object resolveHistoryDate(Ticket ticket, ComponentUsageLog log) {
        if (ticket != null) {
            if (ticket.getSentAt() != null) return ticket.getSentAt();
            if (ticket.getCreatedAt() != null) return ticket.getCreatedAt();
        }
        return log.getDateLogged();
    }

    private List<String> parseDeviceNames(String deviceIdStr, String deviceNameStr) {
        List<String> devices = new ArrayList<>();
        if (isBlank(deviceIdStr)) {
            return devices;
        }

        String[] ids = deviceIdStr.split(",");
        String[] names = !isBlank(deviceNameStr) ? deviceNameStr.split(",") : new String[0];
        for (int i = 0; i < ids.length; i++) {
            String id = ids[i].trim();
            if (isBlank(id) || id.startsWith("COMP-")) continue;

            String name = i < names.length ? names[i].trim() : id;
            devices.add(name + " (" + id + ")");
        }
        return devices;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
