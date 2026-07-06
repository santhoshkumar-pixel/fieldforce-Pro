package com.fieldforce.controller;

import com.fieldforce.model.AttendanceShift;
import com.fieldforce.model.AttendanceEvent;
import com.fieldforce.model.User;
import com.fieldforce.repository.AttendanceShiftRepository;
import com.fieldforce.repository.AttendanceEventRepository;
import com.fieldforce.repository.UserRepository;
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
@RequestMapping("/api/attendance")
public class AttendanceController {

    @Autowired
    private AttendanceShiftRepository shiftRepository;

    @Autowired
    private AttendanceEventRepository eventRepository;

    @Autowired
    private PermissionService permissionService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/shifts")
    public ResponseEntity<?> getAllShifts(
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader) {
        if (roleHeader == null || !permissionService.hasPermission(roleHeader, "attendance.view")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        List<AttendanceShift> all = shiftRepository.findAll();
        List<String> inactiveUserIds = userRepository.findAll().stream()
            .filter(u -> "Inactive".equalsIgnoreCase(u.getStatus()))
            .map(User::getId)
            .collect(java.util.stream.Collectors.toList());
        all = all.stream()
            .filter(s -> !inactiveUserIds.contains(s.getUserId()))
            .collect(java.util.stream.Collectors.toList());
        if (zoneHeader != null && !zoneHeader.isEmpty()) {
            all = all.stream()
                .filter(s -> permissionService.hasRegionAccess(roleHeader, zoneHeader, s.getZone()))
                .collect(java.util.stream.Collectors.toList());
        }
        return ResponseEntity.ok(all);
    }

    @GetMapping("/history")
    public ResponseEntity<?> getHistory(
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader) {
        if (roleHeader == null || !permissionService.hasPermission(roleHeader, "attendance.view")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        List<AttendanceEvent> all = eventRepository.findAllByOrderByTimestampDesc();
        List<String> inactiveUserIds = userRepository.findAll().stream()
            .filter(u -> "Inactive".equalsIgnoreCase(u.getStatus()))
            .map(User::getId)
            .collect(java.util.stream.Collectors.toList());
        all = all.stream()
            .filter(e -> !inactiveUserIds.contains(e.getTechnicianId()))
            .collect(java.util.stream.Collectors.toList());
        if (zoneHeader != null && !zoneHeader.isEmpty()) {
            all = all.stream()
                .filter(e -> permissionService.hasRegionAccess(roleHeader, zoneHeader, e.getZone()))
                .collect(java.util.stream.Collectors.toList());
        }
        return ResponseEntity.ok(all);
    }

    @PostMapping("/shifts")
    public ResponseEntity<?> createOrUpdateShift(
            @RequestBody AttendanceShift shift, 
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader) {
        if (roleHeader == null || (!permissionService.hasPermission(roleHeader, "attendance.view") && !permissionService.hasPermission(roleHeader, "attendance.manage"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        if (!permissionService.hasRegionAccess(roleHeader, zoneHeader, shift.getZone())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: cannot modify shift outside your region"));
        }
        AttendanceShift saved = shiftRepository.save(shift);
        return ResponseEntity.ok(saved);
    }

    public static class PunchRequest {
        private String techId;
        private Double lat;
        private Double lng;
        private String address;

        public String getTechId() { return techId; }
        public void setTechId(String techId) { this.techId = techId; }
        public Double getLat() { return lat; }
        public void setLat(Double lat) { this.lat = lat; }
        public Double getLng() { return lng; }
        public void setLng(Double lng) { this.lng = lng; }
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
    }

    @PostMapping("/punch-in")
    public ResponseEntity<?> punchIn(
            @RequestBody PunchRequest request,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Name", required = false) String nameHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader) {
        if (roleHeader == null || (!permissionService.hasPermission(roleHeader, "attendance.view") && !permissionService.hasPermission(roleHeader, "attendance.manage"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        Optional<AttendanceShift> shiftOpt = shiftRepository.findById(request.getTechId());
        if (shiftOpt.isEmpty()) {
            // Auto-create a shift record for users without a pre-seeded row
            AttendanceShift newShift = new AttendanceShift();
            newShift.setUserId(request.getTechId());
            // Prefer user lookup, fall back to headers
            Optional<User> userOpt = userRepository.findById(request.getTechId());
            if (userOpt.isPresent()) {
                User u = userOpt.get();
                newShift.setName(u.getName());
                newShift.setTeam(u.getTeam() != null ? u.getTeam() : "Operations");
                newShift.setZone(u.getZone() != null ? u.getZone() : (zoneHeader != null ? zoneHeader : "Goa"));
            } else {
                newShift.setName(nameHeader != null ? nameHeader : request.getTechId());
                newShift.setTeam("Operations");
                newShift.setZone(zoneHeader != null ? zoneHeader : "Goa");
            }
            newShift.setShiftStatus("off_shift");
            newShift.setOnline(false);
            newShift.setTotalBreakMs(0L);
            shiftRepository.save(newShift);
            shiftOpt = shiftRepository.findById(request.getTechId());
        }

        AttendanceShift shift = shiftOpt.get();
        if (!"off_shift".equalsIgnoreCase(shift.getShiftStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Technician is already punched in"));
        }

        Instant now = Instant.now();
        Double lat = request.getLat() != null ? request.getLat() : 15.4989 + (Math.random() - 0.5) * 0.02;
        Double lng = request.getLng() != null ? request.getLng() : 73.8278 + (Math.random() - 0.5) * 0.02;
        String address = request.getAddress() != null ? request.getAddress() : shift.getZone() + " — GPS punch in";

        shift.setShiftStatus("on_shift");
        shift.setOnline(true);
        shift.setPunchInAt(now);
        shift.setPunchOutAt(null);
        shift.setBreakStartAt(null);
        shift.setGpsLat(lat);
        shift.setGpsLng(lng);
        shift.setGpsAddress(address);
        shiftRepository.save(shift);

        // Audit event log
        AttendanceEvent event = new AttendanceEvent(
                "ATT-" + System.currentTimeMillis() + "-1",
                shift.getUserId(),
                shift.getName(),
                "PUNCH_IN",
                now,
                lat,
                lng,
                address,
                shift.getZone()
        );
        eventRepository.save(event);

        return ResponseEntity.ok(Map.of("message", shift.getName() + " punched in successfully", "shift", shift));
    }

    @PostMapping("/punch-out")
    public ResponseEntity<?> punchOut(
            @RequestBody PunchRequest request,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Name", required = false) String nameHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader) {
        if (roleHeader == null || (!permissionService.hasPermission(roleHeader, "attendance.view") && !permissionService.hasPermission(roleHeader, "attendance.manage"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        Optional<AttendanceShift> shiftOpt = shiftRepository.findById(request.getTechId());
        if (shiftOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No shift record found for this user. Please punch in first."));
        }

        AttendanceShift shift = shiftOpt.get();
        if ("off_shift".equalsIgnoreCase(shift.getShiftStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Technician is already punched out"));
        }

        Instant now = Instant.now();
        long extraBreak = 0;
        if ("on_break".equalsIgnoreCase(shift.getShiftStatus()) && shift.getBreakStartAt() != null) {
            extraBreak = now.toEpochMilli() - shift.getBreakStartAt().toEpochMilli();
        }

        Double lat = request.getLat() != null ? request.getLat() : shift.getGpsLat();
        Double lng = request.getLng() != null ? request.getLng() : shift.getGpsLng();
        String address = request.getAddress() != null ? request.getAddress() : shift.getZone() + " — GPS punch out";

        shift.setShiftStatus("off_shift");
        shift.setOnline(false);
        shift.setPunchOutAt(now);
        shift.setBreakStartAt(null);
        shift.setTotalBreakMs((shift.getTotalBreakMs() != null ? shift.getTotalBreakMs() : 0) + extraBreak);
        shift.setGpsLat(lat);
        shift.setGpsLng(lng);
        shift.setGpsAddress(address);
        shiftRepository.save(shift);

        // Audit event log
        AttendanceEvent event = new AttendanceEvent(
                "ATT-" + System.currentTimeMillis() + "-2",
                shift.getUserId(),
                shift.getName(),
                "PUNCH_OUT",
                now,
                lat,
                lng,
                address,
                shift.getZone()
        );
        eventRepository.save(event);

        return ResponseEntity.ok(Map.of("message", shift.getName() + " punched out successfully", "shift", shift));
    }

    @PostMapping("/break-start")
    public ResponseEntity<?> startBreak(
            @RequestBody PunchRequest request,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader) {
        if (roleHeader == null || (!permissionService.hasPermission(roleHeader, "attendance.view") && !permissionService.hasPermission(roleHeader, "attendance.manage"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        Optional<AttendanceShift> shiftOpt = shiftRepository.findById(request.getTechId());
        if (shiftOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No shift record found. Please punch in first."));
        }

        AttendanceShift shift = shiftOpt.get();
        if (!"on_shift".equalsIgnoreCase(shift.getShiftStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Technician is not in active shift"));
        }

        Instant now = Instant.now();
        Double lat = request.getLat() != null ? request.getLat() : shift.getGpsLat();
        Double lng = request.getLng() != null ? request.getLng() : shift.getGpsLng();
        String address = request.getAddress() != null ? request.getAddress() : shift.getZone() + " — break start";

        shift.setShiftStatus("on_break");
        shift.setBreakStartAt(now);
        shiftRepository.save(shift);

        // Audit event log
        AttendanceEvent event = new AttendanceEvent(
                "ATT-" + System.currentTimeMillis() + "-3",
                shift.getUserId(),
                shift.getName(),
                "BREAK_START",
                now,
                lat,
                lng,
                address,
                shift.getZone()
        );
        eventRepository.save(event);

        return ResponseEntity.ok(Map.of("message", shift.getName() + " break started", "shift", shift));
    }

    @PostMapping("/break-end")
    public ResponseEntity<?> endBreak(
            @RequestBody PunchRequest request,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader) {
        if (roleHeader == null || (!permissionService.hasPermission(roleHeader, "attendance.view") && !permissionService.hasPermission(roleHeader, "attendance.manage"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        Optional<AttendanceShift> shiftOpt = shiftRepository.findById(request.getTechId());
        if (shiftOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No shift record found. Please punch in first."));
        }

        AttendanceShift shift = shiftOpt.get();
        if (!"on_break".equalsIgnoreCase(shift.getShiftStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Technician is not on break"));
        }

        Instant now = Instant.now();
        long breakMs = shift.getBreakStartAt() != null ? now.toEpochMilli() - shift.getBreakStartAt().toEpochMilli() : 0L;

        Double lat = request.getLat() != null ? request.getLat() : shift.getGpsLat();
        Double lng = request.getLng() != null ? request.getLng() : shift.getGpsLng();
        String address = request.getAddress() != null ? request.getAddress() : shift.getZone() + " — break end";

        shift.setShiftStatus("on_shift");
        shift.setBreakStartAt(null);
        shift.setTotalBreakMs((shift.getTotalBreakMs() != null ? shift.getTotalBreakMs() : 0L) + breakMs);
        shiftRepository.save(shift);

        // Audit event log
        AttendanceEvent event = new AttendanceEvent(
                "ATT-" + System.currentTimeMillis() + "-4",
                shift.getUserId(),
                shift.getName(),
                "BREAK_END",
                now,
                lat,
                lng,
                address,
                shift.getZone()
        );
        eventRepository.save(event);

        return ResponseEntity.ok(Map.of("message", shift.getName() + " break ended", "shift", shift));
    }
}
