package com.fieldforce.controller;

import com.fieldforce.model.User;
import com.fieldforce.model.Role;
import com.fieldforce.repository.UserRepository;
import com.fieldforce.repository.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.fieldforce.service.PermissionService;
import java.util.List;
import java.util.Map;
import java.util.Optional;


@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PermissionService permissionService;

    public static class LoginRequest {
        private String email;
        private String password;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class LoginResponse {
        private String id;
        private String name;
        private String email;
        private String role;
        private String team;
        private String status;
        private String zone;
        private String avatar;
        private List<String> permissions;
        private boolean isSuperAdmin;

        public LoginResponse(User user, List<String> permissions) {
            this.id = user.getId();
            this.name = user.getName();
            this.email = user.getEmail();
            this.role = user.getRole();
            this.team = user.getTeam();
            this.status = user.getStatus();
            this.zone = user.getZone();
            this.permissions = permissions;
            
            // Use database avatar if available; otherwise build avatar initials
            if (user.getAvatar() != null && !user.getAvatar().isEmpty()) {
                this.avatar = user.getAvatar();
            } else if (user.getName() != null && !user.getName().isEmpty()) {
                String[] parts = user.getName().split("\\s+");
                StringBuilder initials = new StringBuilder();
                for (String part : parts) {
                    if (!part.isEmpty()) {
                        initials.append(part.charAt(0));
                    }
                }
                this.avatar = initials.toString().toUpperCase();
            } else {
                this.avatar = "U";
            }
        }

        // Getters and Setters
        public String getId() { return id; }
        public String getName() { return name; }
        public String getEmail() { return email; }
        public String getRole() { return role; }
        public String getTeam() { return team; }
        public String getStatus() { return status; }
        public String getZone() { return zone; }
        public String getAvatar() { return avatar; }
        public List<String> getPermissions() { return permissions; }
        public boolean isSuperAdmin() { return isSuperAdmin; }
        public void setSuperAdmin(boolean isSuperAdmin) { this.isSuperAdmin = isSuperAdmin; }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        if (request.getEmail() == null || request.getPassword() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and password are required"));
        }

        String email = request.getEmail().trim();

        // Early Super Admin shortcut
        if ("superadmin@fieldforce.io".equalsIgnoreCase(email)) {
            // Retrieve or create super admin user
            User superUser = userRepository.findByEmail(email).orElseGet(() -> {
                User u = new User();
                u.setId("U-999");
                u.setName("Ravi Kumar");
                u.setEmail(email);
                u.setPassword("superadmin123");
                u.setRole("Super Admin");
                u.setTeam("Executive");
                u.setStatus("Active");
                u.setZone("Global");
                u.setAvatar("RK");
                return userRepository.save(u);
            });
            if ("Inactive".equalsIgnoreCase(superUser.getStatus())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Your account is marked as Inactive. Access denied."));
            }
            List<String> permissions = permissionService.getPermissionsForRole(superUser.getRole());
            LoginResponse resp = new LoginResponse(superUser, permissions);
            resp.setSuperAdmin(true);
            return ResponseEntity.ok(resp);
        }
        String password = request.getPassword().trim();

        // 1. Check database for user matching email
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if ("Inactive".equalsIgnoreCase(user.getStatus())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Your account is marked as Inactive. Access denied."));
            }
            System.out.println("Attempt login for email=" + email + ", storedPassword=" + user.getPassword());
            // Super Admin bypass: allow login if role is Super Admin and password matches the seeded value
            if ("Super Admin".equalsIgnoreCase(user.getRole())) {
                if (!"superadmin123".equals(password)) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid Super Admin credentials"));
                }
                // proceed with Super Admin login
                String roleName = user.getRole();
                // Retrieve permissions via PermissionService
                List<String> permissions = permissionService.getPermissionsForRole(roleName);
                LoginResponse resp = new LoginResponse(user, permissions);
                resp.setSuperAdmin(true);
                return ResponseEntity.ok(resp);
            }
            if (user.getPassword().trim().equals(password)) {
                System.out.println("Provided password: " + password);
                String roleName = user.getRole();
                if ("Technician".equalsIgnoreCase(roleName) || "Field Technician".equalsIgnoreCase(roleName)) {
                    roleName = "Field Technician";
                } else if ("Admin".equalsIgnoreCase(roleName) || "Scheme PC".equalsIgnoreCase(roleName) || "Scheme Admin".equalsIgnoreCase(roleName) || "Scheme CP".equalsIgnoreCase(roleName) || "Operational Manager".equalsIgnoreCase(roleName) || "Project Manager".equalsIgnoreCase(roleName)) {
                    roleName = "Operational Manager";
                } else if ("Warehouse".equalsIgnoreCase(roleName) || "Warehouse Manager".equalsIgnoreCase(roleName)) {
                    roleName = "Warehouse Manager";
                }

                // Retrieve permissions via PermissionService
                List<String> permissions = permissionService.getPermissionsForRole(roleName);

                // Build response and set super admin flag
                LoginResponse resp = new LoginResponse(user, permissions);
                resp.setSuperAdmin("Super Admin".equalsIgnoreCase(user.getRole()));
                return ResponseEntity.ok(resp);
            }
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid email or password"));
    }

    @GetMapping("/permissions")
    public ResponseEntity<?> getPermissions(@RequestHeader(value = "X-User-Role", required = false) String roleHeader) {
        if (roleHeader == null || roleHeader.isEmpty()) {
            return ResponseEntity.ok(Map.of("permissions", java.util.Collections.emptyList()));
        }
        List<String> permissions = permissionService.getPermissionsForRole(roleHeader);
        return ResponseEntity.ok(Map.of("permissions", permissions));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
            @RequestHeader(value = "X-User-Email", required = false) String userEmailHeader) {
        
        String identifier = (userIdHeader != null && !userIdHeader.isEmpty()) ? userIdHeader : userEmailHeader;
        if (identifier == null || identifier.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "401 Unauthorized"));
        }
        
        Optional<User> userOpt = (userIdHeader != null && !userIdHeader.isEmpty()) 
            ? userRepository.findById(userIdHeader) 
            : userRepository.findByEmail(userEmailHeader);
            
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
        }
        
        User user = userOpt.get();
        List<String> permissions = permissionService.getPermissionsForRole(user.getRole());
        LoginResponse resp = new LoginResponse(user, permissions);
        resp.setSuperAdmin("Super Admin".equalsIgnoreCase(user.getRole()));
        return ResponseEntity.ok(resp);
    }
}
