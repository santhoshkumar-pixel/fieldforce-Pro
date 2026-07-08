package com.fieldforce.config;

import com.fieldforce.service.PermissionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class PermissionInterceptor implements HandlerInterceptor {

    @Autowired
    private PermissionService permissionService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // 1. Bypass OPTIONS preflight requests to avoid breaking CORS
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String path = request.getRequestURI();
        String method = request.getMethod().toUpperCase();

        // 2. Bypass public endpoints
        if (path.startsWith("/api/auth/login") || path.equals("/api/health") || path.startsWith("/api/health/")) {
            return true;
        }

        // 3. Extract user role header
        String roleHeader = request.getHeader("X-User-Role");

        // 4. Resolve required permission based on path and method
        String requiredPermission = resolveRequiredPermission(path, method);

        if (requiredPermission != null) {
            if (roleHeader == null || roleHeader.isEmpty() || !permissionService.hasPermission(roleHeader, requiredPermission)) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\": \"403 Access Denied: Insufficient permissions for " + requiredPermission + "\"}");
                return false;
            }
        }

        return true;
    }

    private String resolveRequiredPermission(String path, String method) {
        // Strip API prefix if present
        String apiPrefix = "/api/";
        if (path.startsWith(apiPrefix)) {
            path = path.substring(apiPrefix.length());
        }

        // 1. Auth endpoints
        if (path.startsWith("auth/me")) {
            return "tickets.view"; // Basic view permission to ensure user is logged in
        }
        if (path.startsWith("auth/permissions")) {
            return null; // Allowed for any logged in user
        }

        // 2. Roles & Permissions (RBAC)
        if (path.startsWith("roles") || path.startsWith("permissions")) {
            if ("GET".equals(method)) {
                return "rbac.view";
            } else {
                return "rbac.manage";
            }
        }

        // 3. Tickets
        if (path.startsWith("tickets")) {
            if ("GET".equals(method)) {
                return "tickets.view";
            }
            if (path.contains("/escalate")) {
                return "tickets.escalate";
            }
            if (path.contains("/override")) {
                return "tickets.override";
            }
            return "tickets.update";
        }

        // 4. Users
        if (path.startsWith("users")) {
            if ("GET".equals(method)) {
                return "users.view";
            }
            return "users.manage";
        }

        // 5. Teams (Schemes)
        if (path.startsWith("teams")) {
            if ("GET".equals(method)) {
                return "teams.view";
            }
            return "teams.manage";
        }

        // 6. Devices
        if (path.startsWith("devices")) {
            if ("GET".equals(method)) {
                return "devices.view";
            }
            return "devices.configure";
        }

        // 7. Components & Inventory
        if (path.startsWith("components") || path.startsWith("inventory")) {
            if ("GET".equals(method)) {
                return "inventory.view";
            }
            return "inventory.manage";
        }

        // 8. Attendance
        if (path.startsWith("attendance")) {
            return "attendance.view";
        }

        // 9. Training
        if (path.startsWith("training")) {
            if ("GET".equals(method)) {
                return "training.view";
            }
            return "training.manage";
        }

        // 10. SLA
        if (path.startsWith("sla")) {
            if ("GET".equals(method)) {
                return "sla.view";
            }
            return "sla.configure";
        }

        // 11. Analytics
        if (path.startsWith("analytics")) {
            if ("GET".equals(method)) {
                return "analytics.view";
            }
            return "analytics.export";
        }

        return null;
    }
}
