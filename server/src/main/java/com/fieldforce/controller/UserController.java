package com.fieldforce.controller;

import com.fieldforce.model.User;
import com.fieldforce.model.Role;
import com.fieldforce.repository.UserRepository;
import com.fieldforce.repository.RoleRepository;
import com.fieldforce.service.PermissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PermissionService permissionService;

    // --- Users API ---
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader) {
        if (roleHeader == null || (!permissionService.hasPermission(roleHeader, "users.view") && !permissionService.hasPermission(roleHeader, "users.manage"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        List<User> all = userRepository.findAll();
        if (zoneHeader != null && !zoneHeader.isEmpty()) {
            all = all.stream()
                .filter(u -> permissionService.hasRegionAccess(roleHeader, zoneHeader, u.getZone()))
                .collect(java.util.stream.Collectors.toList());
        }
        return ResponseEntity.ok(all);
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<?> getUserById(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader) {
        if (roleHeader == null || (!permissionService.hasPermission(roleHeader, "users.view") && !permissionService.hasPermission(roleHeader, "users.manage"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        return userRepository.findById(id).map(user -> {
            if (!permissionService.hasRegionAccess(roleHeader, zoneHeader, user.getZone())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: cross-region access not allowed"));
            }
            return ResponseEntity.ok(user);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/users")
    public ResponseEntity<?> createUser(
            @RequestBody User user,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader) {
        if (roleHeader == null || !permissionService.hasPermission(roleHeader, "users.manage")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        if (!permissionService.hasRegionAccess(roleHeader, zoneHeader, user.getZone())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: cannot create user in a different region"));
        }
        if (user.getEmail() != null && userRepository.findByEmail(user.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "A user with email '" + user.getEmail() + "' already exists."));
        }
        if (user.getId() == null || user.getId().isEmpty()) {
            user.setId("U-" + System.currentTimeMillis());
        }
        if (user.getPassword() == null || user.getPassword().isEmpty()) {
            user.setPassword("password123");
        }
        User saved = userRepository.save(user);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(
            @PathVariable String id,
            @RequestBody User userDetails,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader) {
        if (roleHeader == null || !permissionService.hasPermission(roleHeader, "users.manage")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        if (!permissionService.hasRegionAccess(roleHeader, zoneHeader, userDetails.getZone())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: cannot update user to a different region"));
        }
        return userRepository.findById(id).map(user -> {
            if (!permissionService.hasRegionAccess(roleHeader, zoneHeader, user.getZone())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: cannot modify user in a different region"));
            }
            user.setName(userDetails.getName());
            user.setEmail(userDetails.getEmail());
            if (userDetails.getPassword() != null && !userDetails.getPassword().isEmpty()) {
                user.setPassword(userDetails.getPassword());
            }
            user.setRole(userDetails.getRole());
            user.setTeam(userDetails.getTeam());
            user.setStatus(userDetails.getStatus());
            user.setZone(userDetails.getZone());
            user.setMobile(userDetails.getMobile());
            user.setAvatar(userDetails.getAvatar());
            user.setInactiveDateTime(userDetails.getInactiveDateTime());
            user.setInactivatedBy(userDetails.getInactivatedBy());
            user.setInactivityReason(userDetails.getInactivityReason());
            User saved = userRepository.save(user);
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Zone", required = false) String zoneHeader) {
        if (roleHeader == null || !permissionService.hasPermission(roleHeader, "users.manage")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        return userRepository.findById(id).map(user -> {
            if (!permissionService.hasRegionAccess(roleHeader, zoneHeader, user.getZone())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: cannot delete user in a different region"));
            }
            userRepository.delete(user);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/roles")
    public ResponseEntity<?> getAllRoles(@RequestHeader(value = "X-User-Role", required = false) String roleHeader) {
        if (roleHeader == null || (!permissionService.hasPermission(roleHeader, "rbac.view") && !permissionService.hasPermission(roleHeader, "rbac.manage"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        List<Role> roles = roleRepository.findAll();
        List<User> activeUsers = userRepository.findAll().stream()
            .filter(u -> !"Inactive".equalsIgnoreCase(u.getStatus()))
            .collect(java.util.stream.Collectors.toList());
        for (Role role : roles) {
            long count = activeUsers.stream()
                .filter(u -> role.getName().equalsIgnoreCase(u.getRole()))
                .count();
            role.setUsersCount((int) count);
        }
        return ResponseEntity.ok(roles);
    }

    @PutMapping("/roles/{id}")
    @Transactional
    public ResponseEntity<?> updateRole(@PathVariable String id, @RequestBody Role roleDetails, @RequestHeader(value = "X-User-Role", required = false) String roleHeader) {
        if (roleHeader == null || !permissionService.hasPermission(roleHeader, "rbac.manage")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        return roleRepository.findById(id).map(role -> {
            if (roleDetails.getName() != null) {
                role.setName(roleDetails.getName());
            }
            role.setDescription(roleDetails.getDescription());
            role.setPermissions(roleDetails.getPermissions());
            if (roleDetails.getUsersCount() != null) {
                role.setUsersCount(roleDetails.getUsersCount());
            }
            if (roleDetails.isSuperAdmin() != role.isSuperAdmin()) {
                role.setSuperAdmin(roleDetails.isSuperAdmin());
            }
            Role saved = roleRepository.save(role);
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/roles")
    @Transactional
    public ResponseEntity<?> createRole(@RequestBody Role role, @RequestHeader(value = "X-User-Role", required = false) String roleHeader) {
        if (roleHeader == null || !permissionService.hasPermission(roleHeader, "rbac.manage")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        if (role.getId() == null || role.getId().isEmpty()) {
            role.setId("role-" + role.getName().toLowerCase().trim().replace(" ", "-"));
        }
        if (roleRepository.existsById(role.getId())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Role already exists"));
        }
        Role saved = roleRepository.save(role);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @DeleteMapping("/roles/{id}")
    @Transactional
    public ResponseEntity<?> deleteRole(@PathVariable String id, @RequestHeader(value = "X-User-Role", required = false) String roleHeader) {
        if (roleHeader == null || !permissionService.hasPermission(roleHeader, "rbac.manage")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: insufficient permissions"));
        }
        return roleRepository.findById(id).map(role -> {
            roleRepository.delete(role);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
