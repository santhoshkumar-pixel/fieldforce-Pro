package com.fieldforce.controller;

import com.fieldforce.model.Team;
import com.fieldforce.repository.TeamRepository;
import com.fieldforce.service.PermissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/teams")
public class TeamController {

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private PermissionService permissionService;

    @GetMapping
    public ResponseEntity<?> getAllTeams(
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader) {
        if (roleHeader == null || !permissionService.hasPermission(roleHeader, "teams.view")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        List<Team> all = teamRepository.findAll();
        if (zoneHeader != null && !zoneHeader.isEmpty()) {
            all = all.stream()
                .filter(t -> permissionService.hasRegionAccess(roleHeader, zoneHeader, t.getZone()))
                .collect(java.util.stream.Collectors.toList());
        }
        return ResponseEntity.ok(all);
    }

    @PostMapping
    public ResponseEntity<?> createTeam(
            @RequestBody Team team,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader) {
        if (roleHeader == null || !permissionService.hasPermission(roleHeader, "teams.manage")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        if (!permissionService.hasRegionAccess(roleHeader, zoneHeader, team.getZone())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: cannot create team in a different region"));
        }
        if (team.getId() == null || team.getId().isEmpty()) {
            team.setId("T-" + (teamRepository.count() + 1));
        }
        Team saved = teamRepository.save(team);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTeam(
            @PathVariable String id,
            @RequestBody Team teamDetails,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader) {
        if (roleHeader == null || !permissionService.hasPermission(roleHeader, "teams.manage")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        if (!permissionService.hasRegionAccess(roleHeader, zoneHeader, teamDetails.getZone())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: cannot update team to a different region"));
        }
        return teamRepository.findById(id).map(team -> {
            if (!permissionService.hasRegionAccess(roleHeader, zoneHeader, team.getZone())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: cannot modify team in a different region"));
            }
            team.setName(teamDetails.getName());
            team.setZone(teamDetails.getZone());
            team.setLead(teamDetails.getLead());
            team.setMembers(teamDetails.getMembers());
            team.setOpenTickets(teamDetails.getOpenTickets());
            team.setSlaCompliance(teamDetails.getSlaCompliance());
            team.setPlace(teamDetails.getPlace());
            Team saved = teamRepository.save(team);
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTeam(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader) {
        if (roleHeader == null || !permissionService.hasPermission(roleHeader, "teams.manage")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        return teamRepository.findById(id).map(team -> {
            if (!permissionService.hasRegionAccess(roleHeader, zoneHeader, team.getZone())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: cannot delete team in a different region"));
            }
            teamRepository.delete(team);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
