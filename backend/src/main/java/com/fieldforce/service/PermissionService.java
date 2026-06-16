package com.fieldforce.service;

import com.fieldforce.model.Role;
import com.fieldforce.repository.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.Collections;
import java.util.List;

@Service
public class PermissionService {
    @Autowired
    private RoleRepository roleRepository;

    private String normalizeRole(String roleName) {
        if (roleName == null) {
            return null;
        }
        String trimmed = roleName.trim();
        if ("Technician".equalsIgnoreCase(trimmed)) {
            return "Technician";
        }
        if ("Field Technician".equalsIgnoreCase(trimmed)) {
            return "Field Technician";
        }
        if ("Admin".equalsIgnoreCase(trimmed) || "Scheme PC".equalsIgnoreCase(trimmed) || "Scheme Admin".equalsIgnoreCase(trimmed) || "Scheme CP".equalsIgnoreCase(trimmed) || "Operational Manager".equalsIgnoreCase(trimmed) || "Project Manager".equalsIgnoreCase(trimmed)) {
            return "Operational Manager";
        }
        if ("Warehouse".equalsIgnoreCase(trimmed) || "Warehouse Manager".equalsIgnoreCase(trimmed)) {
            return "Warehouse Manager";
        }
        return trimmed;
    }

    public List<String> getPermissionsForRole(String roleName) {
        String normalized = normalizeRole(roleName);
        if (normalized == null) {
            return Collections.emptyList();
        }
        // Super Admin gets wildcard permission
        if ("Super Admin".equalsIgnoreCase(normalized) || "Super Admin".equalsIgnoreCase(roleName)) {
            return Collections.singletonList("*.*");
        }
        // Find role and return its permission list, or empty list if not found
        final String finalRoleName = normalized;
        return roleRepository.findAll().stream()
                .filter(r -> r.getName().equalsIgnoreCase(finalRoleName) || 
                             r.getName().equalsIgnoreCase(roleName) || 
                             r.getId().equalsIgnoreCase(roleName) || 
                             r.getId().equalsIgnoreCase("role-" + roleName.toLowerCase().trim().replace(" ", "-")) ||
                             (roleName.toLowerCase().trim().startsWith("role-") && r.getId().equalsIgnoreCase(roleName)) ||
                             (finalRoleName.toLowerCase().trim().startsWith("role-") && r.getId().equalsIgnoreCase(finalRoleName)))
                .findFirst()
                .map(Role::getPermissions)
                .orElse(Collections.emptyList());
    }

    public boolean hasPermission(String roleName, String requiredPermission) {
        if (roleName == null || roleName.isEmpty()) {
            return false;
        }
        if ("Super Admin".equalsIgnoreCase(roleName)) {
            return true;
        }
        List<String> permissions = getPermissionsForRole(roleName);
        if (permissions.isEmpty()) {
            return false;
        }

        for (String perm : permissions) {
            if ("*.*".equals(perm) || "*".equals(perm) || perm.equalsIgnoreCase(requiredPermission)) {
                return true;
            }
            if (perm.endsWith(".*") && perm.contains(".")) {
                String baseModule = perm.split("\\.")[0];
                String reqModule = requiredPermission.split("\\.")[0];
                if (baseModule.equalsIgnoreCase(reqModule)) {
                    return true;
                }
            }
        }
        return false;
    }

    public String getZoneRegion(String zone) {
        if (zone == null) return null;
        String z = zone.toLowerCase().trim();
        if (z.contains("goa") ||
            z.contains("panaji") ||
            z.contains("mapusa") ||
            z.contains("margao") ||
            z.contains("vasco") ||
            z.contains("ponda") ||
            z.contains("bicholim")) {
            return "Goa";
        }
        if (z.contains("bhutan") || z.contains("thimphu") || z.contains("paro")) {
            return "Bhutan";
        }
        return null;
    }

    public boolean hasRegionAccess(String roleHeader, String zoneHeader, String entityZoneOrSite) {
        if (roleHeader == null) return false;
        
        String normalized = normalizeRole(roleHeader);
        String finalRole = (normalized != null) ? normalized : roleHeader;
        String originalRole = roleHeader.trim();

        // Unrestricted roles can access all regions
        if ("Super Admin".equalsIgnoreCase(finalRole) ||
            "Super Admin".equalsIgnoreCase(originalRole) ||
            "Admin".equalsIgnoreCase(originalRole) ||
            "Scheme Admin".equalsIgnoreCase(originalRole) ||
            "Scheme PC".equalsIgnoreCase(originalRole) ||
            "Scheme CP".equalsIgnoreCase(originalRole) ||
            "Warehouse Manager".equalsIgnoreCase(finalRole) ||
            "Warehouse".equalsIgnoreCase(finalRole) ||
            "Technical Support".equalsIgnoreCase(finalRole) ||
            "Product Management".equalsIgnoreCase(finalRole)) {
            return true;
        }

        // Restricted roles (like Operational Manager or Technician)
        String userRegion = getZoneRegion(zoneHeader);
        String entityRegion = getZoneRegion(entityZoneOrSite);
        if (userRegion == null) return true; // no zone restriction means allow all
        if (entityRegion == null) return true; // allow global/non-region items if any
        return userRegion.equalsIgnoreCase(entityRegion);
    }
}
