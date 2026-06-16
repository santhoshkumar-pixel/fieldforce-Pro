const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8081";

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  let roleHeader = null;
  let nameHeader = null;
  let zoneHeader = null;
  let emailHeader = null;
  try {
    const sessionStr = sessionStorage.getItem("fieldforce_admin_session");
    if (sessionStr) {
      const sessionUser = JSON.parse(sessionStr);
      if (sessionUser && sessionUser.role) {
        roleHeader = sessionUser.role;
      }
      if (sessionUser && sessionUser.name) {
        nameHeader = sessionUser.name;
      }
      if (sessionUser && sessionUser.zone) {
        zoneHeader = sessionUser.zone;
      }
      if (sessionUser && sessionUser.email) {
        emailHeader = sessionUser.email;
      }
    }
  } catch (e) {
    console.error("Error reading session storage:", e);
  }

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (roleHeader) {
    headers["X-User-Role"] = roleHeader;
  }
  if (nameHeader) {
    headers["X-User-Name"] = nameHeader;
  }
  if (zoneHeader) {
    headers["X-User-Zone"] = zoneHeader;
  }
  if (emailHeader) {
    headers["X-User-Email"] = emailHeader;
  }


  const config = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body !== "string") {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
    }

    // Return null or empty if content length is 0 or status is 204
    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    throw error;
  }
}

export const api = {
  auth: {
    login: (email, password) => 
      request("/api/auth/login", {
        method: "POST",
        body: { email, password },
      }),
    getPermissions: () => request("/api/auth/permissions"),
  },

  users: {
    getAll: () => request("/api/users"),
    getById: (id) => request(`/api/users/${id}`),
    create: (user) => request("/api/users", { method: "POST", body: user }),
    update: (id, user) => request(`/api/users/${id}`, { method: "PUT", body: user }),
    delete: (id) => request(`/api/users/${id}`, { method: "DELETE" }),
  },

  roles: {
    getAll: () => request("/api/roles"),
    update: (id, role) => request(`/api/roles/${id}`, { method: "PUT", body: role }),
  },

  tickets: {
    getAll: () => request("/api/tickets"),
    getById: (id) => request(`/api/tickets/${id}`),
    getLogs: (id) => request(`/api/tickets/${id}/logs`),
    getAllLogs: () => request("/api/tickets/all-logs"),

    create: (ticket) => request("/api/tickets", { method: "POST", body: ticket }),
    update: (id, ticket) => request(`/api/tickets/${id}`, { method: "PUT", body: ticket }),
    updateStatus: (id, status) => 
      request(`/api/tickets/${id}/status`, {
        method: "PATCH",
        body: { status },
      }),
    reject: (id, reason) => 
      request(`/api/tickets/${id}/reject`, {
        method: "PATCH",
        body: { reason },
      }),
    delete: (id) => request(`/api/tickets/${id}`, { method: "DELETE" }),
  },

  devices: {
    getAll: () => request("/api/devices"),
    getById: (id) => request(`/api/devices/${id}`),
    create: (device) => request("/api/devices", { method: "POST", body: device }),
    update: (id, device) => request(`/api/devices/${id}`, { method: "PUT", body: device }),
    delete: (id) => request(`/api/devices/${id}`, { method: "DELETE" }),
  },

  teams: {
    getAll: () => request("/api/teams"),
    create: (team) => request("/api/teams", { method: "POST", body: team }),
    update: (id, team) => request(`/api/teams/${id}`, { method: "PUT", body: team }),
    delete: (id) => request(`/api/teams/${id}`, { method: "DELETE" }),
  },

  attendance: {
    getShifts: () => request("/api/attendance/shifts"),
    getHistory: () => request("/api/attendance/history"),
    getActivities: (userId) => request(`/api/attendance/activities/${userId}`),
    createOrUpdateShift: (shift) => 
      request("/api/attendance/shifts", {
        method: "POST",
        body: shift,
      }),
    punchIn: (techId, gps = {}) => 
      request("/api/attendance/punch-in", {
        method: "POST",
        body: { techId, ...gps },
      }),
    punchOut: (techId, gps = {}) => 
      request("/api/attendance/punch-out", {
        method: "POST",
        body: { techId, ...gps },
      }),
    startBreak: (techId, gps = {}) => 
      request("/api/attendance/break-start", {
        method: "POST",
        body: { techId, ...gps },
      }),
    endBreak: (techId, gps = {}) => 
      request("/api/attendance/break-end", {
        method: "POST",
        body: { techId, ...gps },
      }),
  },

  notifications: {
    getAll: () => request("/api/notifications"),
    create: (notif) => request("/api/notifications", { method: "POST", body: notif }),
    markAsRead: (id) => request(`/api/notifications/${id}/read`, { method: "PATCH" }),
    markAllAsRead: () => request("/api/notifications/read-all", { method: "POST" }),
  },

  training: {
    getAll: (role) => request(`/api/training${role ? `?role=${encodeURIComponent(role)}` : ""}`),
    create: (material) => request("/api/training", { method: "POST", body: material }),
    delete: (id) => request(`/api/training/${id}`, { method: "DELETE" }),
    uploadFile: async (file) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`${API_BASE_URL}/api/training/upload`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("File upload failed");
      }
      return await response.json();
    },
  },
};
