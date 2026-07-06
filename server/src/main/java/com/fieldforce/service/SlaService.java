package com.fieldforce.service;

import com.fieldforce.model.Ticket;
import com.fieldforce.repository.TicketRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SlaService {

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private PermissionService permissionService;

    private List<Ticket> getFilteredTickets(String roleHeader, String zoneHeader) {
        List<Ticket> all = ticketRepository.findAll();
        // Dynamically update and persist SLA statuses on fetch to capture current OVERDUE states in the DB
        for (Ticket t : all) {
            String oldAck = t.getAckSlaStatus();
            String oldResp = t.getResponseSlaStatus();
            String oldRes = t.getResolutionSlaStatus();
            Boolean oldOverdue = t.getSlaOverdue();
            
            t.updateSlaStatuses();
            
            if (!Objects.equals(oldAck, t.getAckSlaStatus()) ||
                !Objects.equals(oldResp, t.getResponseSlaStatus()) ||
                !Objects.equals(oldRes, t.getResolutionSlaStatus()) ||
                !Objects.equals(oldOverdue, t.getSlaOverdue())) {
                ticketRepository.save(t);
            }
        }
        
        if (zoneHeader != null && !zoneHeader.isEmpty()) {
            return all.stream()
                .filter(t -> permissionService.hasRegionAccess(roleHeader, zoneHeader, t.getZone()))
                .collect(Collectors.toList());
        }
        return all;
    }

    public Map<String, Object> getSlaMetrics(String roleHeader, String zoneHeader) {
        List<Ticket> tickets = getFilteredTickets(roleHeader, zoneHeader);
        
        long totalTickets = tickets.size();
        long ackMet = 0;
        long ackBreached = 0;
        long ackPending = 0;
        long ackOverdue = 0;

        long respMet = 0;
        long respBreached = 0;
        long respPending = 0;
        long respOverdue = 0;

        long resMet = 0;
        long resBreached = 0;
        long resPending = 0;
        long resOverdue = 0;

        long overallCompliant = 0;
        long assignedTicketsCount = 0;
        long closedTicketsCount = 0;
        long resolvedWithinSlaCount = 0;
        long totalResponseTimeMs = 0;
        long responseTimeCount = 0;
        long totalResolutionTimeMs = 0;
        long resolutionTimeCount = 0;

        Map<String, Long> severityCounts = new HashMap<>();
        severityCounts.put("CRITICAL", 0L);
        severityCounts.put("HIGH", 0L);
        severityCounts.put("MEDIUM", 0L);
        severityCounts.put("LOW", 0L);

        for (Ticket t : tickets) {
            String severity = t.getPriority() != null ? t.getPriority().toUpperCase() : "MEDIUM";
            severityCounts.put(severity, severityCounts.getOrDefault(severity, 0L) + 1);

            boolean hasAssignment = t.getTechnician() != null && !t.getTechnician().isEmpty() && !"Unassigned".equalsIgnoreCase(t.getTechnician());
            if (hasAssignment) {
                assignedTicketsCount++;
            }

            // Acknowledgement
            if ("MET".equals(t.getAckSlaStatus())) ackMet++;
            else if ("BREACHED".equals(t.getAckSlaStatus())) ackBreached++;
            else if ("PENDING".equals(t.getAckSlaStatus())) ackPending++;
            else if ("OVERDUE".equals(t.getAckSlaStatus())) ackOverdue++;

            // Response
            if ("MET".equals(t.getResponseSlaStatus())) respMet++;
            else if ("BREACHED".equals(t.getResponseSlaStatus())) respBreached++;
            else if ("PENDING".equals(t.getResponseSlaStatus())) respPending++;
            else if ("OVERDUE".equals(t.getResponseSlaStatus())) respOverdue++;

            // Resolution
            if ("MET".equals(t.getResolutionSlaStatus())) resMet++;
            else if ("BREACHED".equals(t.getResolutionSlaStatus())) resBreached++;
            else if ("PENDING".equals(t.getResolutionSlaStatus())) resPending++;
            else if ("OVERDUE".equals(t.getResolutionSlaStatus())) resOverdue++;

            // Overall Compliance: a ticket is compliant if no active or finished SLA is breached or overdue
            boolean isBreachedOrOverdue = "BREACHED".equals(t.getAckSlaStatus()) || "OVERDUE".equals(t.getAckSlaStatus()) ||
                                          "BREACHED".equals(t.getResponseSlaStatus()) || "OVERDUE".equals(t.getResponseSlaStatus()) ||
                                          "BREACHED".equals(t.getResolutionSlaStatus()) || "OVERDUE".equals(t.getResolutionSlaStatus());
            
            if (hasAssignment && !isBreachedOrOverdue) {
                overallCompliant++;
            }

            // Closed metrics
            boolean isClosed = "COMPLETED".equalsIgnoreCase(t.getStatus()) || "RESOLVED".equalsIgnoreCase(t.getStatus());
            if (isClosed) {
                closedTicketsCount++;
                if ("MET".equals(t.getResolutionSlaStatus())) {
                    resolvedWithinSlaCount++;
                }
            }

            // Response time metric: On Site Time - Assigned Time
            if (t.getReachedSiteAt() != null && t.getSentAt() != null) {
                long diffMs = java.time.Duration.between(t.getSentAt(), t.getReachedSiteAt()).toMillis();
                if (diffMs >= 0) {
                    totalResponseTimeMs += diffMs;
                    responseTimeCount++;
                }
            }

            // Resolution time metric: Resolved Time - Created Time
            if (t.getResolvedAt() != null && t.getCreatedAt() != null) {
                long diffMs = java.time.Duration.between(t.getCreatedAt(), t.getResolvedAt()).toMillis();
                if (diffMs >= 0) {
                    totalResolutionTimeMs += diffMs;
                    resolutionTimeCount++;
                }
            }
        }

        double complianceRate = assignedTicketsCount > 0 ? ((double) overallCompliant / assignedTicketsCount) * 100.0 : 100.0;
        double closedSlaComplianceRate = closedTicketsCount > 0 ? ((double) resolvedWithinSlaCount / closedTicketsCount) * 100.0 : 100.0;
        double avgResponseTimeMins = responseTimeCount > 0 ? (double) totalResponseTimeMs / (1000.0 * 60.0) / responseTimeCount : 0.0;
        double avgResolutionTimeMins = resolutionTimeCount > 0 ? (double) totalResolutionTimeMs / (1000.0 * 60.0) / resolutionTimeCount : 0.0;

        Map<String, Object> metrics = new HashMap<>();
        metrics.put("totalTickets", totalTickets);
        metrics.put("assignedTickets", assignedTicketsCount);
        metrics.put("slaCompliantTickets", overallCompliant);
        metrics.put("complianceRate", Math.round(complianceRate * 10.0) / 10.0);
        metrics.put("closedSlaComplianceRate", Math.round(closedSlaComplianceRate * 10.0) / 10.0);
        metrics.put("closedTicketsCount", closedTicketsCount);
        metrics.put("resolvedWithinSlaCount", resolvedWithinSlaCount);
        metrics.put("avgResponseTimeMins", Math.round(avgResponseTimeMins * 10.0) / 10.0);
        metrics.put("avgResolutionTimeMins", Math.round(avgResolutionTimeMins * 10.0) / 10.0);
        
        metrics.put("ackMet", ackMet);
        metrics.put("ackBreached", ackBreached);
        metrics.put("ackPending", ackPending);
        metrics.put("ackOverdue", ackOverdue);

        metrics.put("respMet", respMet);
        metrics.put("respBreached", respBreached);
        metrics.put("respPending", respPending);
        metrics.put("respOverdue", respOverdue);

        metrics.put("resMet", resMet);
        metrics.put("resBreached", resBreached);
        metrics.put("resPending", resPending);
        metrics.put("resOverdue", resOverdue);

        // Combined SLA statuses for top level cards
        metrics.put("totalSlaBreached", ackBreached + respBreached + resBreached);
        metrics.put("totalSlaOverdue", ackOverdue + respOverdue + resOverdue);
        metrics.put("totalSlaPending", ackPending + respPending + resPending);
        metrics.put("totalSlaMet", ackMet + respMet + resMet);

        metrics.put("severityCounts", severityCounts);

        return metrics;
    }

    public List<Map<String, Object>> getTechnicianPerformance(String roleHeader, String zoneHeader) {
        List<Ticket> tickets = getFilteredTickets(roleHeader, zoneHeader);
        Map<String, List<Ticket>> techTickets = tickets.stream()
                .filter(t -> t.getTechnician() != null && !t.getTechnician().isEmpty() && !"Unassigned".equalsIgnoreCase(t.getTechnician()))
                .collect(Collectors.groupingBy(Ticket::getTechnician));

        List<Map<String, Object>> performanceList = new ArrayList<>();

        for (Map.Entry<String, List<Ticket>> entry : techTickets.entrySet()) {
            String techName = entry.getKey();
            List<Ticket> list = entry.getValue();

            long total = list.size();
            long ackMet = list.stream().filter(t -> "MET".equals(t.getAckSlaStatus())).count();
            long ackBreached = list.stream().filter(t -> "BREACHED".equals(t.getAckSlaStatus()) || "OVERDUE".equals(t.getAckSlaStatus())).count();
            
            long respMet = list.stream().filter(t -> "MET".equals(t.getResponseSlaStatus())).count();
            long respBreached = list.stream().filter(t -> "BREACHED".equals(t.getResponseSlaStatus()) || "OVERDUE".equals(t.getResponseSlaStatus())).count();
            
            long resMet = list.stream().filter(t -> "MET".equals(t.getResolutionSlaStatus())).count();
            long resBreached = list.stream().filter(t -> "BREACHED".equals(t.getResolutionSlaStatus()) || "OVERDUE".equals(t.getResolutionSlaStatus())).count();

            long compliantTickets = list.stream().filter(t -> {
                return !("BREACHED".equals(t.getAckSlaStatus()) || "OVERDUE".equals(t.getAckSlaStatus()) ||
                         "BREACHED".equals(t.getResponseSlaStatus()) || "OVERDUE".equals(t.getResponseSlaStatus()) ||
                         "BREACHED".equals(t.getResolutionSlaStatus()) || "OVERDUE".equals(t.getResolutionSlaStatus()));
            }).count();

            double complianceRate = total > 0 ? ((double) compliantTickets / total) * 100.0 : 100.0;

            Map<String, Object> techMap = new HashMap<>();
            techMap.put("technician", techName);
            techMap.put("totalTickets", total);
            techMap.put("ackMet", ackMet);
            techMap.put("ackBreached", ackBreached);
            techMap.put("respMet", respMet);
            techMap.put("respBreached", respBreached);
            techMap.put("resMet", resMet);
            techMap.put("resBreached", resBreached);
            techMap.put("complianceRate", Math.round(complianceRate * 10.0) / 10.0);

            performanceList.add(techMap);
        }

        // Sort by compliance rate descending, then total tickets descending
        performanceList.sort((a, b) -> {
            int comp = Double.compare((Double) b.get("complianceRate"), (Double) a.get("complianceRate"));
            if (comp != 0) return comp;
            return Long.compare((Long) b.get("totalTickets"), (Long) a.get("totalTickets"));
        });

        return performanceList;
    }

    public List<Ticket> getSlaReports(String startDate, String endDate, String technician, 
                                     String severity, String performance, String roleHeader, String zoneHeader) {
        List<Ticket> tickets = getFilteredTickets(roleHeader, zoneHeader);
        
        return tickets.stream()
                .filter(t -> {
                    // 1. Date Range filter (created_at)
                    if (startDate != null && !startDate.isEmpty()) {
                        try {
                            Instant start = Instant.parse(startDate);
                            if (t.getCreatedAt() == null || t.getCreatedAt().isBefore(start)) return false;
                        } catch (Exception ex) {
                            // ignore invalid date formats
                        }
                    }
                    if (endDate != null && !endDate.isEmpty()) {
                        try {
                            Instant end = Instant.parse(endDate);
                            if (t.getCreatedAt() == null || t.getCreatedAt().isAfter(end)) return false;
                        } catch (Exception ex) {
                            // ignore
                        }
                    }

                    // 2. Technician filter
                    if (technician != null && !technician.isEmpty() && !"all".equalsIgnoreCase(technician)) {
                        if (t.getTechnician() == null || !t.getTechnician().equalsIgnoreCase(technician)) return false;
                    }

                    // 3. Severity filter
                    if (severity != null && !severity.isEmpty() && !"all".equalsIgnoreCase(severity)) {
                        if (t.getPriority() == null || !t.getPriority().equalsIgnoreCase(severity)) return false;
                    }

                    // 4. SLA Performance filter
                    if (performance != null && !performance.isEmpty() && !"all".equalsIgnoreCase(performance)) {
                        boolean isBreached = "BREACHED".equals(t.getAckSlaStatus()) || "OVERDUE".equals(t.getAckSlaStatus()) ||
                                             "BREACHED".equals(t.getResponseSlaStatus()) || "OVERDUE".equals(t.getResponseSlaStatus()) ||
                                             "BREACHED".equals(t.getResolutionSlaStatus()) || "OVERDUE".equals(t.getResolutionSlaStatus());
                        
                        if ("compliant".equalsIgnoreCase(performance) && isBreached) return false;
                        if ("breached".equalsIgnoreCase(performance) && !isBreached) return false;
                    }

                    return true;
                })
                .collect(Collectors.toList());
    }
}
