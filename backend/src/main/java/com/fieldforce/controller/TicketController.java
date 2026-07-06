package com.fieldforce.controller;

import com.fieldforce.model.Ticket;
import com.fieldforce.repository.TicketRepository;
import com.fieldforce.service.PermissionService;
import com.fieldforce.service.TicketInventorySyncService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Objects;
import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private PermissionService permissionService;

    @Autowired
    private TicketInventorySyncService inventorySyncService;

    @Autowired
    private com.fieldforce.repository.UserRepository userRepository;

    @Autowired
    private com.fieldforce.repository.TechnicianActivityLogRepository activityLogRepository;

    @Autowired
    private com.fieldforce.repository.DeviceRepository deviceRepository;

    private void logTechnicianActivity(String technicianName, String ticketId, String action, String description, String performedBy) {
        if (technicianName == null || technicianName.isEmpty()) {
            return;
        }
        userRepository.findByName(technicianName).ifPresent(user -> {
            Double lat = null;
            Double lng = null;
            if ("Meera Rao".equalsIgnoreCase(technicianName)) {
                lat = 15.275;
                lng = 74.124;
            } else if ("Rohit Kumar".equalsIgnoreCase(technicianName)) {
                lat = 15.5812;
                lng = 73.7421;
            } else if ("Ayesha Patel".equalsIgnoreCase(technicianName)) {
                lat = 15.4989;
                lng = 73.8278;
            } else {
                lat = 15.4901;
                lng = 73.8199;
            }

            com.fieldforce.model.TechnicianActivityLog log = new com.fieldforce.model.TechnicianActivityLog(
                user.getId(),
                ticketId,
                action,
                description,
                Instant.now(),
                lat,
                lng,
                performedBy
            );
            activityLogRepository.save(log);
            System.out.println("Technician activity logged: " + action + " for " + technicianName + " by " + performedBy);
        });
    }

    private boolean isTechSupportRole(String role) {
        return "Tech Support".equalsIgnoreCase(role) || "Technical Support".equalsIgnoreCase(role);
    }

    private boolean isTechSupportTicket(Ticket ticket) {
        return ticket != null && (
            "TECH_SUPPORT".equalsIgnoreCase(ticket.getEscalationType()) ||
            "TECH_SUPPORT".equalsIgnoreCase(ticket.getEscalatedToRole())
        );
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String resolveUserId(String userName) {
        if (isBlank(userName)) {
            return null;
        }
        return userRepository.findByName(userName)
                .map(com.fieldforce.model.User::getId)
                .orElse(userName);
    }

    private String resolveUserId(String userName, String userEmail, String userId) {
        if (!isBlank(userId)) {
            return userId;
        }
        if (!isBlank(userEmail)) {
            Optional<com.fieldforce.model.User> byEmail = userRepository.findByEmail(userEmail);
            if (byEmail.isPresent()) {
                return byEmail.get().getId();
            }
        }
        return resolveUserId(userName);
    }

    private boolean isCurrentTechSupportOwner(Ticket ticket, String userName, String userEmail, String userId) {
        String currentUserId = resolveUserId(userName, userEmail, userId);
        String ownerId = ticket.getAssignedTechSupportId();
        boolean assignedToCurrentUser = !isBlank(ownerId) && (
            ownerId.equalsIgnoreCase(currentUserId != null ? currentUserId : "") ||
            ownerId.equalsIgnoreCase(userName != null ? userName : "")
        );
        boolean completedByCurrentUser = !isBlank(ticket.getCompletedBy()) &&
            ticket.getCompletedBy().equalsIgnoreCase(userName != null ? userName : "");
        return assignedToCurrentUser || completedByCurrentUser;
    }

    private boolean isAvailableTechSupportTicket(Ticket ticket) {
        return isTechSupportTicket(ticket)
            && "ESCALATED".equalsIgnoreCase(ticket.getStatus())
            && isBlank(ticket.getAssignedTechSupportId());
    }

    private boolean canAccessTechSupportTicket(String roleHeader, Ticket ticket, String userName, String userEmail, String userId) {
        if (!isTechSupportRole(roleHeader) || !isTechSupportTicket(ticket)) {
            return false;
        }
        return isAvailableTechSupportTicket(ticket) || isCurrentTechSupportOwner(ticket, userName, userEmail, userId);
    }

    private boolean canBypassRegionForTechSupport(String roleHeader, Ticket ticket, String userName, String userEmail, String userId) {
        return canAccessTechSupportTicket(roleHeader, ticket, userName, userEmail, userId);
    }

    private boolean isCompletedStatus(String status) {
        return "COMPLETED".equalsIgnoreCase(status) || "TECH_SUPPORT_COMPLETED".equalsIgnoreCase(status);
    }

    private Optional<com.fieldforce.model.User> findUserByIdentifier(String identifier) {
        if (isBlank(identifier)) {
            return Optional.empty();
        }
        Optional<com.fieldforce.model.User> byId = userRepository.findById(identifier);
        if (byId.isPresent()) {
            return byId;
        }
        Optional<com.fieldforce.model.User> byEmail = userRepository.findByEmail(identifier);
        if (byEmail.isPresent()) {
            return byEmail;
        }
        return userRepository.findByName(identifier);
    }

    private void hydrateCompletionOwner(Ticket ticket) {
        if (ticket == null || !isCompletedStatus(ticket.getStatus()) || !isBlank(ticket.getCompletedBy())) {
            return;
        }

        Optional<com.fieldforce.model.User> owner = findUserByIdentifier(ticket.getCompletedByUserId());
        if (!owner.isPresent()) {
            owner = findUserByIdentifier(ticket.getAssignedTechSupportId());
        }

        if (owner.isPresent()) {
            ticket.setCompletedBy(owner.get().getName());
            if (isBlank(ticket.getCompletedByUserId())) {
                ticket.setCompletedByUserId(owner.get().getId());
            }
            return;
        }

        List<com.fieldforce.model.TechnicianActivityLog> logs =
            activityLogRepository.findByTicketIdOrderByTimestampAsc(ticket.getId());
        for (int i = logs.size() - 1; i >= 0; i--) {
            com.fieldforce.model.TechnicianActivityLog log = logs.get(i);
            String action = log.getAction() != null ? log.getAction() : "";
            String description = log.getDescription() != null ? log.getDescription() : "";
            if (action.toUpperCase().contains("COMPLETED") || description.toLowerCase().contains("completed")) {
                if (!isBlank(log.getPerformedBy())) {
                    ticket.setCompletedBy(log.getPerformedBy());
                    return;
                }
                findUserByIdentifier(log.getUserId()).ifPresent(user -> {
                    ticket.setCompletedBy(user.getName());
                    if (isBlank(ticket.getCompletedByUserId())) {
                        ticket.setCompletedByUserId(user.getId());
                    }
                });
                return;
            }
        }
    }

    private String getStatusLabel(String status) {
        if (status == null) return "";
        switch (status.toUpperCase()) {
            case "PENDING": return "Pending";
            case "ASSIGNED": return "Assigned";
            case "ACCEPTED": return "Accepted";
            case "TRAVELLING": return "Travelling";
            case "REVIEW": return "Reached";
            case "REVIEWED": return "Reviewed";
            case "COMPLETED": return "Completed";
            case "REJECTED": return "Rejected";
            case "UNASSIGNED": return "Unassigned";
            case "ESCALATED": return "Escalated";
            default:
                String lower = status.toLowerCase();
                return Character.toUpperCase(lower.charAt(0)) + lower.substring(1);
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllTickets(
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader,
            @RequestHeader(value = "X-User-Name", required = false) String userNameHeader,
            @RequestHeader(value = "X-User-Email", required = false) String userEmailHeader,
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader) {
        if (roleHeader == null || !permissionService.hasPermission(roleHeader, "tickets.view")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        List<Ticket> all = ticketRepository.findAllByOrderByIdDesc();
        all.forEach(Ticket::updateSlaStatuses);
        all.forEach(this::hydrateCompletionOwner);
        if (isTechSupportRole(roleHeader)) {
            all = all.stream()
                .filter(t -> canAccessTechSupportTicket(roleHeader, t, userNameHeader, userEmailHeader, userIdHeader))
                .collect(java.util.stream.Collectors.toList());
            return ResponseEntity.ok(all);
        }
        if (zoneHeader != null && !zoneHeader.isEmpty()) {
            all = all.stream()
                .filter(t -> permissionService.hasRegionAccess(roleHeader, zoneHeader, t.getZone()))
                .collect(java.util.stream.Collectors.toList());
        }
        return ResponseEntity.ok(all);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTicketById(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader,
            @RequestHeader(value = "X-User-Name", required = false) String userNameHeader,
            @RequestHeader(value = "X-User-Email", required = false) String userEmailHeader,
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader) {
        if (roleHeader == null || !permissionService.hasPermission(roleHeader, "tickets.view")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        return ticketRepository.findById(id).map(ticket -> {
            if (!canBypassRegionForTechSupport(roleHeader, ticket, userNameHeader, userEmailHeader, userIdHeader) && !permissionService.hasRegionAccess(roleHeader, zoneHeader, ticket.getZone())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: cross-region access not allowed"));
            }
            ticket.updateSlaStatuses();
            hydrateCompletionOwner(ticket);
            return ResponseEntity.ok(ticket);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> createTicket(
            @RequestBody Ticket ticket, 
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader,
            @RequestHeader(value = "X-User-Name", required = false) String userNameHeader) {
        if (roleHeader == null || (!permissionService.hasPermission(roleHeader, "tickets.assign") && !permissionService.hasPermission(roleHeader, "tickets.update"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        if (!permissionService.hasRegionAccess(roleHeader, zoneHeader, ticket.getZone())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: cannot create ticket in a different region"));
        }
                if (ticket.getId() == null || ticket.getId().isEmpty()) {
            long maxNumericId = 1000;
            List<Ticket> allTickets = ticketRepository.findAll();
            for (Ticket t : allTickets) {
                String id = t.getId();
                if (id != null && id.startsWith("TK-")) {
                    try {
                        long num = Long.parseLong(id.substring(3));
                        if (num > maxNumericId) {
                            maxNumericId = num;
                        }
                    } catch (NumberFormatException e) {
                        // ignore non-numeric TK- IDs
                    }
                }
            }
            ticket.setId("TK-" + (maxNumericId + 1));
        }
        if (ticket.getStatus() == null) {
            ticket.setStatus("UNASSIGNED");
        }
        if (ticket.getCreatedAt() == null) {
            ticket.setCreatedAt(Instant.now());
        }
        ticket.calculateSlaDeadlines();
        String creator = userNameHeader != null ? userNameHeader : "Admin";
        if (ticket.getCreatedBy() == null || ticket.getCreatedBy().isEmpty()) {
            ticket.setCreatedBy(creator);
        }
        Ticket saved = ticketRepository.save(ticket);

        // Sync inventory for newly created ticket with devices/components
        if (saved.getDeviceId() != null && !saved.getDeviceId().isEmpty()) {
            inventorySyncService.syncOnUpdate(null, saved);
        }

        if (saved.getDeviceId() != null && !saved.getDeviceId().isEmpty()) {
            String[] deviceIds = saved.getDeviceId().split(",");
            for (String devId : deviceIds) {
                devId = devId.trim();
                if (!devId.isEmpty()) {
                    deviceRepository.findById(devId).ifPresent(device -> {
                        device.setPickDate(java.time.LocalDate.now().toString());
                        deviceRepository.save(device);
                    });
                }
            }
        }

        if (saved.getTechnician() != null && !saved.getTechnician().isEmpty()) {
            logTechnicianActivity(saved.getTechnician(), saved.getId(), "ASSIGNED", "Assigned to " + saved.getTechnician() + " by " + creator, creator);
        } else {
            logTechnicianActivity(creator, saved.getId(), "CREATED", "Ticket created by " + creator + " (Unassigned)", creator);
        }

        return ResponseEntity.ok(saved);
    }


    @GetMapping("/{id}/logs")
    public ResponseEntity<?> getTicketLogs(
            @PathVariable String id, 
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader,
            @RequestHeader(value = "X-User-Name", required = false) String userNameHeader,
            @RequestHeader(value = "X-User-Email", required = false) String userEmailHeader,
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader) {
        if (roleHeader == null || !permissionService.hasPermission(roleHeader, "tickets.view")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        Optional<Ticket> tOpt = ticketRepository.findById(id);
        if (tOpt.isPresent() && !canBypassRegionForTechSupport(roleHeader, tOpt.get(), userNameHeader, userEmailHeader, userIdHeader) && !permissionService.hasRegionAccess(roleHeader, zoneHeader, tOpt.get().getZone())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: cross-region logs access not allowed"));
        }
        List<com.fieldforce.model.TechnicianActivityLog> logs = activityLogRepository.findByTicketIdOrderByTimestampAsc(id);
        List<String> inactiveUserIds = userRepository.findAll().stream()
            .filter(u -> "Inactive".equalsIgnoreCase(u.getStatus()))
            .map(com.fieldforce.model.User::getId)
            .collect(java.util.stream.Collectors.toList());
        logs = logs.stream()
            .filter(log -> !inactiveUserIds.contains(log.getUserId()))
            .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/all-logs")
    public ResponseEntity<?> getAllTicketLogs(
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader,
            @RequestHeader(value = "X-User-Name", required = false) String userNameHeader,
            @RequestHeader(value = "X-User-Email", required = false) String userEmailHeader,
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader) {
        if (roleHeader == null || !permissionService.hasPermission(roleHeader, "tickets.view")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        List<com.fieldforce.model.TechnicianActivityLog> allLogs = activityLogRepository.findAllByOrderByTimestampDesc();
        List<String> inactiveUserIds = userRepository.findAll().stream()
            .filter(u -> "Inactive".equalsIgnoreCase(u.getStatus()))
            .map(com.fieldforce.model.User::getId)
            .collect(java.util.stream.Collectors.toList());
        allLogs = allLogs.stream()
            .filter(log -> !inactiveUserIds.contains(log.getUserId()))
            .collect(java.util.stream.Collectors.toList());
        if (zoneHeader != null && !zoneHeader.isEmpty()) {
            allLogs = allLogs.stream()
                .filter(log -> {
                    if (log.getTicketId() == null) return false;
                    Optional<Ticket> tOpt = ticketRepository.findById(log.getTicketId());
                    if (!tOpt.isPresent()) return false;
                    if (canBypassRegionForTechSupport(roleHeader, tOpt.get(), userNameHeader, userEmailHeader, userIdHeader)) return true;
                    return permissionService.hasRegionAccess(roleHeader, zoneHeader, tOpt.get().getZone());
                })
                .collect(java.util.stream.Collectors.toList());
        }
        return ResponseEntity.ok(allLogs);
    }


    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> updateTicket(
            @PathVariable String id, 
            @RequestBody Ticket ticketDetails, 
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader,
            @RequestHeader(value = "X-User-Name", required = false) String userNameHeader,
            @RequestHeader(value = "X-User-Email", required = false) String userEmailHeader,
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader) {
        if (roleHeader == null || (!permissionService.hasPermission(roleHeader, "tickets.assign") && !permissionService.hasPermission(roleHeader, "tickets.update"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        if (!canBypassRegionForTechSupport(roleHeader, ticketDetails, userNameHeader, userEmailHeader, userIdHeader) && !permissionService.hasRegionAccess(roleHeader, zoneHeader, ticketDetails.getZone())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: cannot update ticket to a different region"));
        }
        return ticketRepository.findById(id).map(ticket -> {
            if (!canBypassRegionForTechSupport(roleHeader, ticket, userNameHeader, userEmailHeader, userIdHeader) && !permissionService.hasRegionAccess(roleHeader, zoneHeader, ticket.getZone())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: cannot modify ticket in a different region"));
            }
            String oldStatus = ticket.getStatus();
            String oldTech = ticket.getTechnician();

            if ("REJECTED".equalsIgnoreCase(oldStatus)) {
                if (userNameHeader == null || (ticket.getCreatedBy() != null && !ticket.getCreatedBy().isEmpty() && !ticket.getCreatedBy().equalsIgnoreCase(userNameHeader))) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Only the original ticket creator can resend/re-submit a rejected ticket"));
                }
            }

            if ("COMPLETED".equalsIgnoreCase(ticketDetails.getStatus()) && !"COMPLETED".equalsIgnoreCase(oldStatus)) {
                if (userNameHeader == null || oldTech == null || !oldTech.equalsIgnoreCase(userNameHeader)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Only the assigned technician can mark this ticket as completed"));
                }
                boolean isEscalatedWarehousePending = "PENDING".equalsIgnoreCase(oldStatus) && "WAREHOUSE".equalsIgnoreCase(ticket.getEscalationType());
                boolean isEscalatedTechSupport = "ESCALATED".equalsIgnoreCase(oldStatus) && isTechSupportTicket(ticket);
                if (!"REVIEWED".equalsIgnoreCase(oldStatus) && !isEscalatedWarehousePending && !isEscalatedTechSupport) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "A ticket can only be completed after it has been reviewed and approved"));
                }
            }

            // Preserve original creator
            if (ticket.getCreatedBy() == null || ticket.getCreatedBy().isEmpty()) {
                ticket.setCreatedBy(ticketDetails.getCreatedBy() != null ? ticketDetails.getCreatedBy() : "Admin");
            }

            String oldPriority = ticket.getPriority();

            // Clear response times on tech reassignment
            if (ticketDetails.getTechnician() != null && !ticketDetails.getTechnician().equalsIgnoreCase(oldTech)) {
                ticket.setAcceptedAt(null);
                ticket.setReachedSiteAt(null);
                ticket.setEscalatedReason(null);
                ticket.setEscalatedBy(null);
                ticket.setEscalatedAt(null);
                ticket.setEscalationDate(null);
                ticket.setEscalatedToRole(null);
                ticket.setEscalatedToUserId(null);
                ticket.setAssignedTechSupportId(null);
            } else {
                ticket.setAcceptedAt(ticketDetails.getAcceptedAt());
                ticket.setReachedSiteAt(ticketDetails.getReachedSiteAt());
            }

            // Capture timestamps based on status change
            String newStatus = ticketDetails.getStatus();
            if (!newStatus.equalsIgnoreCase(oldStatus)) {
                if ("ACCEPTED".equalsIgnoreCase(newStatus) || "TRAVELLING".equalsIgnoreCase(newStatus)) {
                    if (ticket.getAcceptedAt() == null) {
                        ticket.setAcceptedAt(Instant.now());
                    }
                    ticket.setRespondedAt(Instant.now());
                } else if ("REVIEW".equalsIgnoreCase(newStatus)) {
                    if (ticket.getReachedSiteAt() == null) {
                        ticket.setReachedSiteAt(Instant.now());
                    }
                } else if ("COMPLETED".equalsIgnoreCase(newStatus)) {
                    if (ticket.getResolvedAt() == null) {
                        ticket.setResolvedAt(Instant.now());
                    }
                    ticket.setCompletedAt(Instant.now());
                    ticket.setCompletedBy(userNameHeader != null ? userNameHeader : oldTech);
                    ticket.setCompletedByUserId(resolveUserId(userNameHeader != null ? userNameHeader : oldTech, userEmailHeader, userIdHeader));
                }
            } else {
                ticket.setResolvedAt(ticketDetails.getResolvedAt());
            }

            String oldDeviceId = ticket.getDeviceId();
            Ticket oldTicketForSync = new Ticket();
            oldTicketForSync.setId(ticket.getId());
            oldTicketForSync.setDeviceId(oldDeviceId);
            oldTicketForSync.setTechnician(oldTech);
            oldTicketForSync.setStatus(oldStatus);
            oldTicketForSync.setSite(ticket.getSite());
            oldTicketForSync.setCustomer(ticket.getCustomer());

            ticket.setCustomer(ticketDetails.getCustomer());
            ticket.setSite(ticketDetails.getSite());
            ticket.setTechnician(ticketDetails.getTechnician());
            ticket.setPriority(ticketDetails.getPriority());
            ticket.setIssue(ticketDetails.getIssue());
            ticket.setStatus(ticketDetails.getStatus());
            ticket.setSlaTime(ticketDetails.getSlaTime());
            ticket.setSentAt(ticketDetails.getSentAt());
            ticket.setRespondedAt(ticketDetails.getRespondedAt());
            ticket.setCreatedAt(ticketDetails.getCreatedAt());
            if (!"COMPLETED".equalsIgnoreCase(newStatus) || "COMPLETED".equalsIgnoreCase(oldStatus)) {
                ticket.setCompletedAt(ticketDetails.getCompletedAt());
            }
            ticket.setRejectReason(ticketDetails.getRejectReason());
            ticket.setJobType(ticketDetails.getJobType());
            ticket.setDeviceId(ticketDetails.getDeviceId());
            ticket.setDeviceName(ticketDetails.getDeviceName());
            ticket.setEscalationType(ticketDetails.getEscalationType());
            ticket.setEscalatedToRole(ticketDetails.getEscalatedToRole() != null ? ticketDetails.getEscalatedToRole() : ticket.getEscalatedToRole());
            ticket.setEscalatedToUserId(ticketDetails.getEscalatedToUserId() != null ? ticketDetails.getEscalatedToUserId() : ticket.getEscalatedToUserId());
            ticket.setAssignedTechSupportId(ticketDetails.getAssignedTechSupportId() != null ? ticketDetails.getAssignedTechSupportId() : ticket.getAssignedTechSupportId());
            ticket.setEscalationDate(ticketDetails.getEscalationDate() != null ? ticketDetails.getEscalationDate() : ticket.getEscalationDate());
            ticket.setCompletedBy(ticketDetails.getCompletedBy() != null ? ticketDetails.getCompletedBy() : ticket.getCompletedBy());
            ticket.setCompletedByUserId(ticketDetails.getCompletedByUserId() != null ? ticketDetails.getCompletedByUserId() : ticket.getCompletedByUserId());

            // Check if priority changed or deadlines are null, recalculate SLA deadlines
            if (ticket.getAckDeadline() == null || !ticket.getPriority().equalsIgnoreCase(oldPriority)) {
                ticket.calculateSlaDeadlines();
            } else {
                ticket.updateSlaStatuses();
            }

            Ticket saved = ticketRepository.save(ticket);

            // Sync inventory for status transitions
            if (!newStatus.equalsIgnoreCase(oldStatus)) {
                if ("COMPLETED".equalsIgnoreCase(newStatus)) {
                    inventorySyncService.syncOnComplete(saved);
                } else if ("REJECTED".equalsIgnoreCase(newStatus)) {
                    inventorySyncService.syncOnReject(saved);
                }
            }

            // Sync inventory whenever deviceId changes OR technician changes (assign/reassign)
            // This covers: new assignment, reassignment, device swap, warehouse escalation
            boolean hasAssignmentChanges = !Objects.equals(oldDeviceId, saved.getDeviceId());
            boolean hasTechnicianChanges = !Objects.equals(oldTech, saved.getTechnician());
            boolean hasActiveInventory = saved.getDeviceId() != null && !saved.getDeviceId().isEmpty();

            if ((hasAssignmentChanges || hasTechnicianChanges) && hasActiveInventory) {
                inventorySyncService.syncOnUpdate(oldTicketForSync, saved);
            }

            String actor = userNameHeader != null ? userNameHeader : "Admin";
            if (saved.getTechnician() != null && !saved.getTechnician().equalsIgnoreCase(oldTech)) {
                String logDesc = "Ticket reassigned from " + (oldTech != null && !oldTech.isEmpty() ? oldTech : "Unassigned") + " to " + saved.getTechnician() + " by " + actor;
                logTechnicianActivity(saved.getTechnician(), saved.getId(), "REASSIGNED", logDesc, actor);
                if (oldTech != null && !oldTech.isEmpty()) {
                    logTechnicianActivity(oldTech, saved.getId(), "REASSIGNED", logDesc, actor);
                }
            } else if (!saved.getStatus().equalsIgnoreCase(oldStatus)) {
                String logDesc;
                if ("COMPLETED".equalsIgnoreCase(saved.getStatus())) {
                    logDesc = "Ticket marked as Completed by " + actor + "\nStatus changed from " + getStatusLabel(oldStatus) + " → Completed";
                } else {
                    logDesc = "Status Changed → " + saved.getStatus() + " by " + actor;
                }
                logTechnicianActivity(saved.getTechnician(), saved.getId(), saved.getStatus(), logDesc, actor);
            }

            if ("COMPLETED".equalsIgnoreCase(saved.getStatus()) && !"COMPLETED".equalsIgnoreCase(oldStatus)) {
                if (saved.getDeviceId() != null && !saved.getDeviceId().isEmpty()) {
                    String[] deviceIds = saved.getDeviceId().split(",");
                    for (String devId : deviceIds) {
                        devId = devId.trim();
                        if (!devId.isEmpty()) {
                            deviceRepository.findById(devId).ifPresent(device -> {
                                device.setDropDate(java.time.LocalDate.now().toString());
                                deviceRepository.save(device);
                            });
                        }
                    }
                }
            }

            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable String id, 
            @RequestBody Map<String, String> body, 
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader,
            @RequestHeader(value = "X-User-Name", required = false) String userNameHeader,
            @RequestHeader(value = "X-User-Email", required = false) String userEmailHeader,
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader) {
        if (roleHeader == null || !permissionService.hasPermission(roleHeader, "tickets.update")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        String status = body.get("status");
        if (status == null) {
            return ResponseEntity.badRequest().build();
        }
        return ticketRepository.findById(id).map(ticket -> {
            if (!canBypassRegionForTechSupport(roleHeader, ticket, userNameHeader, userEmailHeader, userIdHeader) && !permissionService.hasRegionAccess(roleHeader, zoneHeader, ticket.getZone())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: cannot update tickets outside your region"));
            }
            if ("REJECTED".equalsIgnoreCase(ticket.getStatus())) {
                if (userNameHeader == null || (ticket.getCreatedBy() != null && !ticket.getCreatedBy().isEmpty() && !ticket.getCreatedBy().equalsIgnoreCase(userNameHeader))) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Only the original ticket creator can resend/re-submit a rejected ticket"));
                }
            }
            if ("TECH_SUPPORT_COMPLETED".equalsIgnoreCase(status) || "TECH_SUPPORT_IN_PROGRESS".equalsIgnoreCase(status)) {
                if (!isTechSupportRole(roleHeader)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Only Tech Support can perform this action"));
                }
                if (!isTechSupportTicket(ticket)) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Ticket is not escalated to Tech Support"));
                }
                String currentUserId = resolveUserId(userNameHeader, userEmailHeader, userIdHeader);
                String ownerId = ticket.getAssignedTechSupportId();
                boolean takenByAnother = !isBlank(ownerId)
                    && !ownerId.equalsIgnoreCase(currentUserId != null ? currentUserId : "")
                    && !ownerId.equalsIgnoreCase(userNameHeader != null ? userNameHeader : "");
                if (takenByAnother || (!isAvailableTechSupportTicket(ticket) && !isCurrentTechSupportOwner(ticket, userNameHeader, userEmailHeader, userIdHeader))) {
                    return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Ticket is already handled by another Tech Support user"));
                }
            }
            if ("COMPLETED".equalsIgnoreCase(status)) {
                if (userNameHeader == null || ticket.getTechnician() == null || !ticket.getTechnician().equalsIgnoreCase(userNameHeader)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Only the assigned technician can mark this ticket as completed"));
                }
                boolean isEscalatedWarehousePending = "PENDING".equalsIgnoreCase(ticket.getStatus()) && "WAREHOUSE".equalsIgnoreCase(ticket.getEscalationType());
                boolean isTechSupportCompleted = "TECH_SUPPORT_COMPLETED".equalsIgnoreCase(ticket.getStatus());
                if (!"REVIEWED".equalsIgnoreCase(ticket.getStatus()) && !"COMPLETED".equalsIgnoreCase(ticket.getStatus()) && !isEscalatedWarehousePending && !isTechSupportCompleted) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "A ticket can only be completed after it has been reviewed and approved"));
                }
            }
            String oldStatus = ticket.getStatus();
            ticket.setStatus(status);
            String actor = userNameHeader != null ? userNameHeader : (ticket.getTechnician() != null ? ticket.getTechnician() : "Technician");
            String actorUserId = resolveUserId(actor, userEmailHeader, userIdHeader);
            String actorDisplayName = findUserByIdentifier(actorUserId)
                .map(com.fieldforce.model.User::getName)
                .orElse(actor);
            
            if ("ACCEPTED".equalsIgnoreCase(status) || "TRAVELLING".equalsIgnoreCase(status)) {
                if (ticket.getAcceptedAt() == null) {
                    ticket.setAcceptedAt(Instant.now());
                }
                ticket.setRespondedAt(Instant.now());
            } else if ("REJECTED".equalsIgnoreCase(status)) {
                ticket.setRespondedAt(Instant.now());
            }
            
            if ("REVIEW".equalsIgnoreCase(status)) {
                if (ticket.getReachedSiteAt() == null) {
                    ticket.setReachedSiteAt(Instant.now());
                }
            }
            
            if ("COMPLETED".equalsIgnoreCase(status)) {
                if (ticket.getResolvedAt() == null) {
                    ticket.setResolvedAt(Instant.now());
                }
                ticket.setCompletedAt(Instant.now());
                ticket.setCompletedBy(actorDisplayName);
                ticket.setCompletedByUserId(actorUserId);
                ticket.setSlaTime("02:57");
            }

            if ("TECH_SUPPORT_IN_PROGRESS".equalsIgnoreCase(status) && isTechSupportTicket(ticket)) {
                ticket.setEscalatedToRole("TECH_SUPPORT");
                if (ticket.getAssignedTechSupportId() == null || ticket.getAssignedTechSupportId().isEmpty()) {
                    ticket.setAssignedTechSupportId(actorUserId);
                }
            }

            if ("TECH_SUPPORT_COMPLETED".equalsIgnoreCase(status) && isTechSupportTicket(ticket)) {
                ticket.setEscalatedToRole("TECH_SUPPORT");
                if (ticket.getAssignedTechSupportId() == null || ticket.getAssignedTechSupportId().isEmpty()) {
                    ticket.setAssignedTechSupportId(actorUserId);
                }
                ticket.setCompletedBy(actorDisplayName);
                ticket.setCompletedByUserId(actorUserId);
                ticket.setCompletedAt(Instant.now());
            }
            
            // Ensure SLA deadlines are populated and statuses are updated
            if (ticket.getAckDeadline() == null) {
                ticket.calculateSlaDeadlines();
            } else {
                ticket.updateSlaStatuses();
            }
            
            Ticket saved = ticketRepository.save(ticket);

            // Sync inventory for status transitions
            if (!status.equalsIgnoreCase(oldStatus)) {
                if ("COMPLETED".equalsIgnoreCase(status)) {
                    inventorySyncService.syncOnComplete(saved);
                } else if ("REJECTED".equalsIgnoreCase(status)) {
                    inventorySyncService.syncOnReject(saved);
                }
            }

            String userRole = roleHeader != null ? roleHeader : "Field Technician";
            Optional<com.fieldforce.model.User> actorUserOpt = userRepository.findByName(actor);
            if (actorUserOpt.isPresent()) {
                userRole = actorUserOpt.get().getRole();
            }

            String actionDesc = "Status Changed → " + status;
            if ("ACCEPTED".equalsIgnoreCase(status)) {
                actionDesc = "Technician " + actor + " accepted job assignment.";
            } else if ("TRAVELLING".equalsIgnoreCase(status)) {
                actionDesc = "Technician " + actor + " started travel route to site.";
            } else if ("REVIEW".equalsIgnoreCase(status)) {
                actionDesc = "Status Changed → Reached";
            } else if ("REVIEWED".equalsIgnoreCase(status)) {
                actionDesc = "Ticket reviewed by " + actor + "\nStatus changed to Reviewed";
            } else if ("TECH_SUPPORT_IN_PROGRESS".equalsIgnoreCase(status)) {
                actionDesc = "Tech Support started resolving the issue - " + actor;
            } else if ("TECH_SUPPORT_COMPLETED".equalsIgnoreCase(status)) {
                actionDesc = "Mark as Completed by Tech Support - " + actor;
            } else if ("COMPLETED".equalsIgnoreCase(status)) {
                actionDesc = "Mark as Completed by " + userRole + " - " + actor;
            }

            logTechnicianActivity(saved.getTechnician() != null ? saved.getTechnician() : actor, saved.getId(), status, actionDesc, actor);

            if ("COMPLETED".equalsIgnoreCase(status) && !"COMPLETED".equalsIgnoreCase(oldStatus)) {
                if (saved.getDeviceId() != null && !saved.getDeviceId().isEmpty()) {
                    String[] deviceIds = saved.getDeviceId().split(",");
                    for (String devId : deviceIds) {
                        devId = devId.trim();
                        if (!devId.isEmpty()) {
                            deviceRepository.findById(devId).ifPresent(device -> {
                                device.setDropDate(java.time.LocalDate.now().toString());
                                deviceRepository.save(device);
                            });
                        }
                    }
                }
            }

            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<?> rejectTicket(
            @PathVariable String id, 
            @RequestBody Map<String, String> body, 
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader,
            @RequestHeader(value = "X-User-Name", required = false) String userNameHeader) {
        if (roleHeader == null || !permissionService.hasPermission(roleHeader, "tickets.update")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        String reason = body.get("reason");
        return ticketRepository.findById(id).map(ticket -> {
            if (!permissionService.hasRegionAccess(roleHeader, zoneHeader, ticket.getZone())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: cannot reject tickets outside your region"));
            }
            ticket.setStatus("REJECTED");
            ticket.setRespondedAt(Instant.now());
            ticket.setRejectReason(reason);
            ticket.setSlaTime("—");
            Ticket saved = ticketRepository.save(ticket);

            String actor = userNameHeader != null ? userNameHeader : (saved.getTechnician() != null ? saved.getTechnician() : "Technician");
            String logDesc = "Rejected by " + actor + "\nReason:\n" + reason;
            logTechnicianActivity(saved.getTechnician() != null ? saved.getTechnician() : actor, saved.getId(), "REJECTED", logDesc, actor);

            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/escalate")
    public ResponseEntity<?> escalateTicket(
            @PathVariable String id, 
            @RequestBody Map<String, String> body, 
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader,
            @RequestHeader(value = "X-User-Name", required = false) String userNameHeader) {
        if (roleHeader == null || !permissionService.hasPermission(roleHeader, "tickets.update")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        String reason = body.get("reason");
        String escalationType = body.get("escalationType");
        if (reason == null || reason.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Escalation reason is required"));
        }
        return ticketRepository.findById(id).map(ticket -> {
            boolean isTechSupportEscalation = "TECH_SUPPORT".equalsIgnoreCase(escalationType);
            if (!isTechSupportEscalation && !permissionService.hasRegionAccess(roleHeader, zoneHeader, ticket.getZone())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: cannot modify tickets outside your region"));
            }
            if (ticket.getTechnician() == null || userNameHeader == null || !ticket.getTechnician().equalsIgnoreCase(userNameHeader)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Only the assigned technician can escalate this ticket"));
            }
            
            if (isTechSupportEscalation) {
                boolean hasTechSupportUser = userRepository.findAll().stream()
                    .anyMatch(u -> "Tech Support".equalsIgnoreCase(u.getRole()) && !"Inactive".equalsIgnoreCase(u.getStatus()));
                if (!hasTechSupportUser) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Tech Support user not available."));
                }
            }
            
            String oldStatus = ticket.getStatus();
            String oldTech = ticket.getTechnician();
            
            ticket.setStatus("ESCALATED");
            ticket.setEscalatedReason(reason);
            ticket.setEscalatedBy(userNameHeader);
            ticket.setEscalatedAt(Instant.now());
            ticket.setEscalationType(escalationType != null ? escalationType : "WAREHOUSE");
            if (isTechSupportEscalation) {
                ticket.setEscalatedToRole("TECH_SUPPORT");
                ticket.setEscalatedToUserId("ALL_TECH_SUPPORT");
                ticket.setAssignedTechSupportId(null);
                ticket.setEscalationDate(ticket.getEscalatedAt());
            } else {
                ticket.setEscalatedToRole("WAREHOUSE");
                ticket.setEscalatedToUserId(null);
                ticket.setAssignedTechSupportId(null);
                ticket.setEscalationDate(ticket.getEscalatedAt());
            }
            
            Ticket saved = ticketRepository.save(ticket);
            
            String logDesc = "Ticket Escalated to " + (escalationType != null ? escalationType : "WAREHOUSE") + " by " + userNameHeader + " (" + roleHeader + ") with reason: " + reason + ". Old assigned user: " + oldTech;
            logTechnicianActivity(oldTech, saved.getId(), "ESCALATED", logDesc, userNameHeader);
            
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTicket(
            @PathVariable String id, 
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader) {
        if (roleHeader == null || (!permissionService.hasPermission(roleHeader, "tickets.assign") && !permissionService.hasPermission(roleHeader, "tickets.update"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        return ticketRepository.findById(id).map(ticket -> {
            if (!permissionService.hasRegionAccess(roleHeader, zoneHeader, ticket.getZone())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: cannot delete tickets outside your region"));
            }
            ticketRepository.delete(ticket);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleIllegalArgumentException(IllegalArgumentException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
    }
}

