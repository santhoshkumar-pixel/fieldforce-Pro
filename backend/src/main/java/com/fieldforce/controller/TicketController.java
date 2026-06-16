package com.fieldforce.controller;

import com.fieldforce.model.Ticket;
import com.fieldforce.repository.TicketRepository;
import com.fieldforce.service.PermissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private PermissionService permissionService;

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
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader) {
        if (roleHeader == null || !permissionService.hasPermission(roleHeader, "tickets.view")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        List<Ticket> all = ticketRepository.findAllByOrderByIdDesc();
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
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader) {
        if (roleHeader == null || !permissionService.hasPermission(roleHeader, "tickets.view")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        return ticketRepository.findById(id).map(ticket -> {
            if (!permissionService.hasRegionAccess(roleHeader, zoneHeader, ticket.getZone())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: cross-region access not allowed"));
            }
            return ResponseEntity.ok(ticket);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
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
            long count = ticketRepository.count();
            ticket.setId("TK-" + (1151 + count));
        }
        if (ticket.getStatus() == null) {
            ticket.setStatus("UNASSIGNED");
        }
        if (ticket.getCreatedAt() == null) {
            ticket.setCreatedAt(Instant.now());
        }
        String creator = userNameHeader != null ? userNameHeader : "Admin";
        if (ticket.getCreatedBy() == null || ticket.getCreatedBy().isEmpty()) {
            ticket.setCreatedBy(creator);
        }
        Ticket saved = ticketRepository.save(ticket);

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
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader) {
        if (roleHeader == null || !permissionService.hasPermission(roleHeader, "tickets.view")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        Optional<Ticket> tOpt = ticketRepository.findById(id);
        if (tOpt.isPresent() && !permissionService.hasRegionAccess(roleHeader, zoneHeader, tOpt.get().getZone())) {
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
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader) {
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
                    return permissionService.hasRegionAccess(roleHeader, zoneHeader, tOpt.get().getZone());
                })
                .collect(java.util.stream.Collectors.toList());
        }
        return ResponseEntity.ok(allLogs);
    }


    @PutMapping("/{id}")
    public ResponseEntity<?> updateTicket(
            @PathVariable String id, 
            @RequestBody Ticket ticketDetails, 
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader,
            @RequestHeader(value = "X-User-Name", required = false) String userNameHeader) {
        if (roleHeader == null || (!permissionService.hasPermission(roleHeader, "tickets.assign") && !permissionService.hasPermission(roleHeader, "tickets.update"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        if (!permissionService.hasRegionAccess(roleHeader, zoneHeader, ticketDetails.getZone())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: cannot update ticket to a different region"));
        }
        return ticketRepository.findById(id).map(ticket -> {
            if (!permissionService.hasRegionAccess(roleHeader, zoneHeader, ticket.getZone())) {
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
                if (!"REVIEWED".equalsIgnoreCase(oldStatus)) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "A ticket can only be completed after it has been reviewed and approved"));
                }
            }

            // Preserve original creator
            if (ticket.getCreatedBy() == null || ticket.getCreatedBy().isEmpty()) {
                ticket.setCreatedBy(ticketDetails.getCreatedBy() != null ? ticketDetails.getCreatedBy() : "Admin");
            }

            ticket.setCustomer(ticketDetails.getCustomer());
            ticket.setSite(ticketDetails.getSite());
            ticket.setTechnician(ticketDetails.getTechnician());
            ticket.setPriority(ticketDetails.getPriority());
            ticket.setIssue(ticketDetails.getIssue());
            ticket.setStatus(ticketDetails.getStatus());
            ticket.setSlaTime(ticketDetails.getSlaTime());
            ticket.setSlaOverdue(ticketDetails.getSlaOverdue());
            ticket.setSentAt(ticketDetails.getSentAt());
            ticket.setRespondedAt(ticketDetails.getRespondedAt());
            ticket.setCreatedAt(ticketDetails.getCreatedAt());
            ticket.setCompletedAt(ticketDetails.getCompletedAt());
            ticket.setRejectReason(ticketDetails.getRejectReason());
            ticket.setJobType(ticketDetails.getJobType());
            ticket.setDeviceId(ticketDetails.getDeviceId());
            ticket.setDeviceName(ticketDetails.getDeviceName());
            Ticket saved = ticketRepository.save(ticket);

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
            @RequestHeader(value = "X-User-Name", required = false) String userNameHeader) {
        if (roleHeader == null || !permissionService.hasPermission(roleHeader, "tickets.update")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        String status = body.get("status");
        if (status == null) {
            return ResponseEntity.badRequest().build();
        }
        return ticketRepository.findById(id).map(ticket -> {
            if (!permissionService.hasRegionAccess(roleHeader, zoneHeader, ticket.getZone())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: cannot update tickets outside your region"));
            }
            if ("REJECTED".equalsIgnoreCase(ticket.getStatus())) {
                if (userNameHeader == null || (ticket.getCreatedBy() != null && !ticket.getCreatedBy().isEmpty() && !ticket.getCreatedBy().equalsIgnoreCase(userNameHeader))) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Only the original ticket creator can resend/re-submit a rejected ticket"));
                }
            }
            if ("COMPLETED".equalsIgnoreCase(status)) {
                if (userNameHeader == null || ticket.getTechnician() == null || !ticket.getTechnician().equalsIgnoreCase(userNameHeader)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Only the assigned technician can mark this ticket as completed"));
                }
                if (!"REVIEWED".equalsIgnoreCase(ticket.getStatus()) && !"COMPLETED".equalsIgnoreCase(ticket.getStatus())) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "A ticket can only be completed after it has been reviewed and approved"));
                }
            }
            String oldStatus = ticket.getStatus();
            ticket.setStatus(status);
            if ("ACCEPTED".equalsIgnoreCase(status) || "REJECTED".equalsIgnoreCase(status)) {
                ticket.setRespondedAt(Instant.now());
            }
            if ("COMPLETED".equalsIgnoreCase(status)) {
                ticket.setSlaTime("02:57");
                ticket.setSlaOverdue(false);
                ticket.setCompletedAt(Instant.now());
            }
            Ticket saved = ticketRepository.save(ticket);

            String actor = userNameHeader != null ? userNameHeader : (saved.getTechnician() != null ? saved.getTechnician() : "Technician");
            String actionDesc = "Status Changed → " + status;
            if ("ACCEPTED".equalsIgnoreCase(status)) {
                actionDesc = "Technician " + actor + " accepted job assignment.";
            } else if ("TRAVELLING".equalsIgnoreCase(status)) {
                actionDesc = "Technician " + actor + " started travel route to site.";
            } else if ("REVIEW".equalsIgnoreCase(status)) {
                actionDesc = "Status Changed → Reached";
            } else if ("REVIEWED".equalsIgnoreCase(status)) {
                actionDesc = "Ticket reviewed by " + actor + "\nStatus changed to Reviewed";
            } else if ("COMPLETED".equalsIgnoreCase(status)) {
                actionDesc = "Ticket marked as Completed by " + actor + "\nStatus changed from " + getStatusLabel(oldStatus) + " → Completed";
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
}
