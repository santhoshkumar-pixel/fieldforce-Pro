import {
  tickets as initialTickets,
  deviceInventory as initialDevices,
  teams as initialTeams,
  users as initialUsers,
  roles as initialRoles,
  notifications as initialNotifications,
  technicianWorkload,
  mockUsers,
} from "../data/mockData";

import {
  initialTechnicianShifts,
  initialAttendanceHistory,
} from "../data/attendanceData";

import axiosInstance from "../api/axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8080";

// Mutable in-memory stores for mock fallback mode
let mockTicketsList = [...initialTickets];
let mockDevicesList = [...initialDevices];
let mockTeamsList = [...initialTeams];
let mockUsersList = [...initialUsers];
let mockRolesList = [...initialRoles];
let mockNotificationsList = [...initialNotifications];
let mockShiftsList = [...initialTechnicianShifts];
let mockAttendanceHistoryList = [...initialAttendanceHistory];
let mockTrainingList = [
  {
    id: "TRN-101",
    title: "Field Operator Safety Protocol",
    description: "Essential safety guidelines and PPE protocols for field technicians.",
    type: "Document",
    role: "All Roles",
    duration: "15 mins",
    difficulty: "Easy",
    url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    uploadedAt: "2026-05-10",
  },
  {
    id: "TRN-102",
    title: "IoT Pressure Sensor Calibration",
    description: "Step-by-step guide to calibrating Ace and Mini series pressure sensors.",
    type: "Video",
    role: "Field Technician",
    duration: "25 mins",
    difficulty: "Medium",
    url: "https://www.w3schools.com/html/mov_bbb.mp4",
    uploadedAt: "2026-05-14",
  },
];

let mockComponentsList = [
  { id: 1, name: "Premium HD Screen", category: "Screens", quantity: 12, minLimit: 5, warehouse: "Goa Warehouse", region: "Goa", status: "In Stock", lastUpdated: "2026-06-25" },
  { id: 2, name: "Li-Ion 5000mAh Battery", category: "Batteries", quantity: 20, minLimit: 8, warehouse: "Goa Warehouse", region: "Goa", status: "In Stock", lastUpdated: "2026-06-26" },
  { id: 3, name: "Ultra-Sonic Range Sensor", category: "Sensors", quantity: 15, minLimit: 6, warehouse: "Goa Warehouse", region: "Goa", status: "In Stock", lastUpdated: "2026-06-27" },
  { id: 4, name: "Heavy-Duty Type-C Cable", category: "Cables", quantity: 4, minLimit: 10, warehouse: "Goa Warehouse", region: "Goa", status: "Low Stock", lastUpdated: "2026-06-28" },
  { id: 5, name: "USB-C Fast Charger 18W", category: "Chargers", quantity: 30, minLimit: 10, warehouse: "Goa Warehouse", region: "Goa", status: "In Stock", lastUpdated: "2026-06-29" },
  { id: 6, name: "Main Processing Board v2", category: "Boards", quantity: 8, minLimit: 3, warehouse: "Goa Warehouse", region: "Goa", status: "In Stock", lastUpdated: "2026-06-29" },
  { id: 7, name: "Premium HD Screen", category: "Screens", quantity: 8, minLimit: 5, warehouse: "Bhutan Warehouse", region: "Bhutan", status: "In Stock", lastUpdated: "2026-06-25" },
  { id: 8, name: "Li-Ion 5000mAh Battery", category: "Batteries", quantity: 15, minLimit: 8, warehouse: "Bhutan Warehouse", region: "Bhutan", status: "In Stock", lastUpdated: "2026-06-26" },
  { id: 9, name: "Ultra-Sonic Range Sensor", category: "Sensors", quantity: 3, minLimit: 6, warehouse: "Bhutan Warehouse", region: "Bhutan", status: "Low Stock", lastUpdated: "2026-06-27" },
  { id: 10, name: "Heavy-Duty Type-C Cable", category: "Cables", quantity: 25, minLimit: 10, warehouse: "Bhutan Warehouse", region: "Bhutan", status: "In Stock", lastUpdated: "2026-06-28" },
  { id: 11, name: "USB-C Fast Charger 18W", category: "Chargers", quantity: 2, minLimit: 5, warehouse: "Bhutan Warehouse", region: "Bhutan", status: "Low Stock", lastUpdated: "2026-06-29" },
  { id: 12, name: "Main Processing Board v2", category: "Boards", quantity: 1, minLimit: 3, warehouse: "Bhutan Warehouse", region: "Bhutan", status: "Low Stock", lastUpdated: "2026-06-29" }
];

let mockComponentUsageLogsList = [
  { id: 1, componentId: 1, componentName: "Premium HD Screen", quantity: 1, deviceId: "MCH901", ticketId: "TK-1001", reason: "Damaged screen replacement", loggedBy: "Sanjay Dutt", dateLogged: "2026-06-28" },
  { id: 2, componentId: 2, componentName: "Li-Ion 5000mAh Battery", quantity: 2, deviceId: "MCH874", ticketId: "TK-1001", reason: "Battery degrade replacement", loggedBy: "Rahul Roy", dateLogged: "2026-06-29" }
];

let mockDeviceAssignmentsList = [
  { id: 1, deviceId: "DEV-1002", deviceName: "ACE Smart Module", assigneeType: "Technician", assigneeId: "meera@fieldforce.io", assigneeName: "Meera Rao", assignedBy: "System", assignmentDate: "2026-06-28", returnDate: "", status: "ACTIVE", ticketId: "TK-1002" },
  { id: 2, deviceId: "DEV-1003", deviceName: "MINI IoT Tracker", assigneeType: "Technician", assigneeId: "meera@fieldforce.io", assigneeName: "Meera Rao", assignedBy: "System", assignmentDate: "2026-06-29", returnDate: "", status: "ACTIVE", ticketId: "TK-1003" }
];

function getMockFallback(endpoint, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const body = options.body ? (typeof options.body === "string" ? JSON.parse(options.body) : options.body) : {};

  // Auth
  if (endpoint === "/api/auth/login") {
    const normEmail = (body.email || "").trim().toLowerCase();
    const userKey = Object.keys(mockUsers).find((k) => k.toLowerCase() === normEmail);
    if (userKey) return mockUsers[userKey];
    return mockUsers["admin@fieldforce.io"];
  }
  if (endpoint === "/api/auth/permissions") {
    return { permissions: ["*.*"] };
  }

  // Users
  if (endpoint === "/api/users") {
    if (method === "GET") return [...mockUsersList];
    if (method === "POST") {
      const newUser = { id: `U-${Date.now().toString().slice(-4)}`, ...body };
      mockUsersList.unshift(newUser);
      return newUser;
    }
  }
  if (endpoint.startsWith("/api/users/")) {
    const id = endpoint.split("/")[3];
    if (method === "GET") return mockUsersList.find((u) => u.id === id) || mockUsersList[0];
    if (method === "PUT") {
      mockUsersList = mockUsersList.map((u) => (u.id === id ? { ...u, ...body } : u));
      return mockUsersList.find((u) => u.id === id);
    }
    if (method === "DELETE") {
      mockUsersList = mockUsersList.filter((u) => u.id !== id);
      return { success: true };
    }
  }

  // Roles
  if (endpoint === "/api/roles") return [...mockRolesList];
  if (endpoint.startsWith("/api/roles/")) {
    const id = endpoint.split("/")[3];
    if (method === "PUT") {
      mockRolesList = mockRolesList.map((r) => (r.id === id ? { ...r, ...body } : r));
      return mockRolesList.find((r) => r.id === id);
    }
  }

  // Tickets
  if (endpoint === "/api/tickets") {
    if (method === "GET") return [...mockTicketsList];
    if (method === "POST") {
      const newTicket = {
        id: `TK-${Math.floor(1000 + Math.random() * 9000)}`,
        status: "Assigned",
        reportedAt: new Date().toISOString(),
        ...body,
      };
      mockTicketsList.unshift(newTicket);
      return newTicket;
    }
  }
  if (endpoint === "/api/tickets/all-logs") return [];
  if (endpoint.startsWith("/api/tickets/")) {
    const parts = endpoint.split("/");
    const id = parts[3];
    if (parts[4] === "logs") return [];
    if (parts[4] === "status") {
      const now = new Date().toISOString();
      let sessionUser = {};
      try {
        sessionUser = JSON.parse(sessionStorage.getItem("fieldforce_admin_session") || "{}");
      } catch {
        sessionUser = {};
      }
      const actorName = sessionUser.name || "Current User";
      const actorId = sessionUser.id || actorName;
      mockTicketsList = mockTicketsList.map((t) => {
        if (t.id !== id) return t;
        const next = { ...t, status: body.status };
        if (body.status === "TECH_SUPPORT_IN_PROGRESS") {
          next.escalatedToRole = "TECH_SUPPORT";
          next.assignedTechSupportId = next.assignedTechSupportId || actorId;
        }
        if (body.status === "TECH_SUPPORT_COMPLETED") {
          next.escalatedToRole = "TECH_SUPPORT";
          next.assignedTechSupportId = next.assignedTechSupportId || actorId;
          next.completedBy = actorName;
          next.completedByUserId = actorId;
          next.completedAt = now;
        }
        if (body.status === "COMPLETED") {
          next.completedBy = actorName;
          next.completedByUserId = actorId;
          next.completedAt = now;
        }
        return next;
      });
      return mockTicketsList.find((t) => t.id === id);
    }
    if (parts[4] === "reject") {
      mockTicketsList = mockTicketsList.map((t) => (t.id === id ? { ...t, status: "Rejected", rejectionReason: body.reason } : t));
      return mockTicketsList.find((t) => t.id === id);
    }
    if (parts[4] === "escalate") {
      const isTechSupport = body.escalationType === "TECH_SUPPORT";
      const now = new Date().toISOString();
      mockTicketsList = mockTicketsList.map((t) => (t.id === id ? { 
        ...t, 
        status: "ESCALATED", 
        escalatedReason: body.reason, 
        escalationType: body.escalationType || "WAREHOUSE",
        escalatedToRole: isTechSupport ? "TECH_SUPPORT" : "WAREHOUSE",
        escalatedToUserId: isTechSupport ? "ALL_TECH_SUPPORT" : null,
        assignedTechSupportId: null,
        escalatedBy: "Current User",
        escalatedAt: now,
        escalationDate: now
      } : t));
      return mockTicketsList.find((t) => t.id === id);
    }
    if (method === "GET") return mockTicketsList.find((t) => t.id === id) || mockTicketsList[0];
    if (method === "PUT") {
      mockTicketsList = mockTicketsList.map((t) => (t.id === id ? { ...t, ...body } : t));
      return mockTicketsList.find((t) => t.id === id);
    }
    if (method === "DELETE") {
      mockTicketsList = mockTicketsList.filter((t) => t.id !== id);
      return { success: true };
    }
  }

  // Devices
  if (endpoint === "/api/devices") {
    if (method === "GET") return [...mockDevicesList];
    if (method === "POST") {
      const newDev = { id: `DEV-${Date.now().toString().slice(-4)}`, status: "Online", ...body };
      mockDevicesList.unshift(newDev);
      return newDev;
    }
  }
  if (endpoint === "/api/devices/assignments") return [...mockDeviceAssignmentsList];
  if (endpoint === "/api/devices/maintenance") return [];
  if (endpoint.startsWith("/api/devices/reports")) return [];
  if (endpoint.startsWith("/api/devices/")) {
    const parts = endpoint.split("/");
    const id = parts[3];
    if (parts[4] === "assignments") return mockDeviceAssignmentsList.filter(a => a.deviceId === id);
    if (parts[4] === "assign") {
      const now = new Date();
      const assignedAt = body.assignedAt || now.toISOString();
      const assignmentDate = body.assignmentDate || now.toISOString().split("T")[0];
      const devObj = mockDevicesList.find((d) => d.id === id);
      // Derive region from device's site field
      const devRegion = body.region ||
        (devObj?.site?.toLowerCase().includes("goa") ? "Goa" :
         devObj?.site?.toLowerCase().includes("bhutan") ? "Bhutan" : "Goa");
      const updatedDevice = {
        ...devObj,
        status: "Assigned",
        assignedToType: body.assigneeType || "Technician",
        assignedToId: body.assigneeId,
        assignedToName: body.assigneeName,
        assignmentDate,
        assignedAt,
        region: devRegion,
        ticketId: body.ticketId || null,
      };
      mockDevicesList = mockDevicesList.map((d) => (d.id === id ? updatedDevice : d));
      const existingAssign = mockDeviceAssignmentsList.find((a) => a.deviceId === id && a.status === "ACTIVE");
      if (existingAssign) {
        Object.assign(existingAssign, {
          assigneeType: body.assigneeType || "Technician",
          assigneeId: body.assigneeId,
          assigneeName: body.assigneeName,
          assignedBy: body.assignedBy || "System",
          assignmentDate,
          assignedAt,
          region: devRegion,
          returnDate: body.returnDate || "",
          status: "ACTIVE",
          ticketId: body.ticketId || existingAssign.ticketId || "NEW",
        });
      } else {
        const newAssign = {
          id: mockDeviceAssignmentsList.length + 1,
          deviceId: id,
          deviceName: updatedDevice ? updatedDevice.name : "Device",
          assigneeType: body.assigneeType || "Technician",
          assigneeId: body.assigneeId,
          assigneeName: body.assigneeName,
          assignedBy: body.assignedBy || "System",
          assignmentDate,
          assignedAt,
          region: devRegion,
          returnDate: body.returnDate || "",
          status: "ACTIVE",
          ticketId: body.ticketId || "NEW",
        };
        mockDeviceAssignmentsList.unshift(newAssign);
      }
      return updatedDevice;
    }
    if (parts[4] === "return") {
      const updatedDevice = {
        ...mockDevicesList.find((d) => d.id === id),
        status: "Available",
        assignedToType: null,
        assignedToId: null,
        assignedToName: null,
        assignmentDate: null,
        ticketId: null,
      };
      mockDevicesList = mockDevicesList.map((d) => (d.id === id ? updatedDevice : d));
      const activeAssign = mockDeviceAssignmentsList.find(a => a.deviceId === id && a.status === "ACTIVE");
      if (activeAssign) {
        activeAssign.status = "RETURNED";
        activeAssign.returnDate = body?.returnDate || new Date().toISOString().split("T")[0];
      }
      return updatedDevice;
    }
    if (parts[4] === "maintenance") return { success: true };
    if (method === "GET") return mockDevicesList.find((d) => d.id === id) || mockDevicesList[0];
    if (method === "PUT") {
      mockDevicesList = mockDevicesList.map((d) => (d.id === id ? { ...d, ...body } : d));
      return mockDevicesList.find((d) => d.id === id);
    }
    if (method === "DELETE") {
      mockDevicesList = mockDevicesList.filter((d) => d.id !== id);
      return { success: true };
    }
  }

  // Teams
  if (endpoint === "/api/teams") {
    if (method === "GET") return [...mockTeamsList];
    if (method === "POST") {
      const newTeam = { id: `TM-${Date.now().toString().slice(-4)}`, ...body };
      mockTeamsList.unshift(newTeam);
      return newTeam;
    }
  }
  if (endpoint.startsWith("/api/teams/")) {
    const id = endpoint.split("/")[3];
    if (method === "PUT") {
      mockTeamsList = mockTeamsList.map((t) => (t.id === id ? { ...t, ...body } : t));
      return mockTeamsList.find((t) => t.id === id);
    }
    if (method === "DELETE") {
      mockTeamsList = mockTeamsList.filter((t) => t.id !== id);
      return { success: true };
    }
  }

  // Attendance
  if (endpoint === "/api/attendance/shifts") {
    if (method === "GET") return [...mockShiftsList];
    if (method === "POST") {
      const idx = mockShiftsList.findIndex((s) => s.userId === body.userId);
      if (idx >= 0) {
        mockShiftsList[idx] = { ...mockShiftsList[idx], ...body };
        return mockShiftsList[idx];
      } else {
        mockShiftsList.push(body);
        return body;
      }
    }
  }
  if (endpoint === "/api/attendance/history") return [...mockAttendanceHistoryList];
  if (endpoint.startsWith("/api/attendance/activities/")) return [];
  if (endpoint.startsWith("/api/attendance/punch") || endpoint.startsWith("/api/attendance/break")) {
    const techId = body.techId;
    const shift = mockShiftsList.find((s) => s.userId === techId || s.id === techId);
    if (shift) {
      if (endpoint.includes("punch-in")) {
        shift.shiftStatus = "ON_SHIFT";
        shift.online = true;
        shift.punchInAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (endpoint.includes("punch-out")) {
        shift.shiftStatus = "OFF_SHIFT";
        shift.online = false;
        shift.punchOutAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (endpoint.includes("break-start")) {
        shift.shiftStatus = "ON_BREAK";
      } else if (endpoint.includes("break-end")) {
        shift.shiftStatus = "ON_SHIFT";
      }
      return shift;
    }
    return { success: true };
  }

  // Notifications
  if (endpoint === "/api/notifications") {
    if (method === "GET") return [...mockNotificationsList];
    if (method === "POST") {
      const newNotif = { id: `N-${Date.now()}`, unread: true, timestamp: "Just now", ...body };
      mockNotificationsList.unshift(newNotif);
      return newNotif;
    }
  }
  if (endpoint === "/api/notifications/read-all") {
    mockNotificationsList = mockNotificationsList.map((n) => ({ ...n, unread: false }));
    return { success: true };
  }
  if (endpoint.startsWith("/api/notifications/")) {
    const id = endpoint.split("/")[3];
    mockNotificationsList = mockNotificationsList.map((n) => (n.id === id ? { ...n, unread: false } : n));
    return { success: true };
  }

  // Training
  if (endpoint.startsWith("/api/training")) {
    if (endpoint === "/api/training/upload") {
      return { url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" };
    }
    if (method === "GET") return [...mockTrainingList];
    if (method === "POST") {
      const newMaterial = { id: `TRN-${Date.now().toString().slice(-4)}`, uploadedAt: new Date().toISOString().split("T")[0], ...body };
      mockTrainingList.unshift(newMaterial);
      return newMaterial;
    }
  }

  // SLA
  if (endpoint === "/api/sla/metrics") {
    return {
      totalTickets: mockTicketsList.length,
      assignedTickets: mockTicketsList.filter(t => t.technician && t.technician !== "Unassigned").length,
      slaCompliantTickets: mockTicketsList.filter(t => !t.slaOverdue).length,
      complianceRate: 95.2,
      closedSlaComplianceRate: 94.5,
      closedTicketsCount: mockTicketsList.filter(t => t.status === "COMPLETED").length,
      resolvedWithinSlaCount: mockTicketsList.filter(t => t.status === "COMPLETED" && !t.slaOverdue).length,
      avgResponseTimeMins: 14.5,
      avgResolutionTimeMins: 165.0,
      totalSlaBreached: mockTicketsList.filter(t => t.slaOverdue).length,
      totalSlaOverdue: 0,
      totalSlaPending: mockTicketsList.filter(t => t.status !== "COMPLETED").length,
      totalSlaMet: mockTicketsList.filter(t => t.status === "COMPLETED" && !t.slaOverdue).length,
      severityCounts: {
        CRITICAL: mockTicketsList.filter(t => (t.priority || "").toUpperCase() === "CRITICAL").length,
        HIGH: mockTicketsList.filter(t => (t.priority || "").toUpperCase() === "HIGH").length,
        MEDIUM: mockTicketsList.filter(t => (t.priority || "").toUpperCase() === "MEDIUM").length,
        LOW: mockTicketsList.filter(t => (t.priority || "").toUpperCase() === "LOW").length
      }
    };
  }
  if (endpoint === "/api/sla/technicians") {
    return [
      { technician: "Rohit Kumar", totalTickets: 6, ackMet: 5, ackBreached: 1, respMet: 6, respBreached: 0, resMet: 4, resBreached: 2, complianceRate: 83.3 },
      { technician: "Ayesha Patel", totalTickets: 5, ackMet: 5, ackBreached: 0, respMet: 4, respBreached: 1, resMet: 3, resBreached: 2, complianceRate: 80.0 },
      { technician: "Vikram Singh", totalTickets: 7, ackMet: 6, ackBreached: 1, respMet: 5, respBreached: 2, resMet: 2, resBreached: 5, complianceRate: 71.4 },
      { technician: "Meera Rao", totalTickets: 9, ackMet: 9, ackBreached: 0, respMet: 9, respBreached: 0, resMet: 9, resBreached: 0, complianceRate: 100.0 },
      { technician: "Sameer Desai", totalTickets: 3, ackMet: 3, ackBreached: 0, respMet: 3, respBreached: 0, resMet: 3, resBreached: 0, complianceRate: 100.0 }
    ];
  }
  if (endpoint.startsWith("/api/sla/reports")) return [...mockTicketsList];

  // Components Fallbacks
  if (endpoint === "/api/components") {
    if (method === "GET") {
      // ── Return de-duplicated list (merge same name+region entries) ──
      const deduped = [];
      mockComponentsList.forEach((c) => {
        const existing = deduped.find(
          (m) =>
            m.name.trim().toLowerCase() === c.name.trim().toLowerCase() &&
            (m.region || "").trim().toLowerCase() === (c.region || "").trim().toLowerCase()
        );
        if (existing) {
          existing.quantity = (existing.quantity || 0) + (c.quantity || 0);
          existing.status =
            existing.quantity <= 0
              ? "Out of Stock"
              : existing.quantity < existing.minLimit
              ? "Low Stock"
              : "In Stock";
        } else {
          deduped.push({ ...c });
        }
      });
      return deduped;
    }
    if (method === "POST") {
      const incomingName = (body.name || "").trim().toLowerCase();
      const incomingRegion = (body.region || "").trim().toLowerCase();
      // ── De-duplication: if same component name + region already exists,
      //    add the new quantity to the existing entry instead of creating a row.
      const existing = mockComponentsList.find(
        (c) =>
          c.name.trim().toLowerCase() === incomingName &&
          (c.region || "").trim().toLowerCase() === incomingRegion
      );
      if (existing) {
        existing.quantity = (existing.quantity || 0) + (body.quantity || 0);
        existing.minLimit = body.minLimit != null ? body.minLimit : existing.minLimit;
        existing.status =
          existing.quantity <= 0
            ? "Out of Stock"
            : existing.quantity < existing.minLimit
            ? "Low Stock"
            : "In Stock";
        existing.lastUpdated = new Date().toISOString().split("T")[0];
        return existing;
      }
      const newComp = {
        id: mockComponentsList.length + 1,
        ...body,
        name: body.name.trim(),
        status:
          body.quantity <= 0
            ? "Out of Stock"
            : body.quantity < body.minLimit
            ? "Low Stock"
            : "In Stock",
        lastUpdated: new Date().toISOString().split("T")[0],
      };
      mockComponentsList.push(newComp);
      return newComp;
    }
  }
  if (endpoint === "/api/components/usage-logs") {
    if (method === "GET") return [...mockComponentUsageLogsList];
  }
  if (endpoint.startsWith("/api/components/")) {
    const parts = endpoint.split("/");
    const id = parseInt(parts[3]);
    if (parts[4] === "history") {
      const selected = mockComponentsList.find((c) => c.id === id);
      if (!selected) return [];
      const relatedIds = new Set(
        mockComponentsList
          .filter((c) =>
            String(c.name || "").trim().toLowerCase() === String(selected.name || "").trim().toLowerCase() &&
            String(c.category || "").trim().toLowerCase() === String(selected.category || "").trim().toLowerCase() &&
            String(c.region || "").trim().toLowerCase() === String(selected.region || "").trim().toLowerCase()
          )
          .map((c) => c.id)
      );
      return mockComponentUsageLogsList
        .filter((log) => relatedIds.has(log.componentId) && log.ticketId)
        .map((log) => {
          const ticket = mockTicketsList.find((t) => t.id === log.ticketId);
          const parsed = ticket ? String(ticket.deviceId || "").split(",").map((item) => item.trim()).filter(Boolean) : [];
          const names = ticket ? String(ticket.deviceName || "").split(",").map((item) => item.trim()) : [];
          const deviceNames = parsed
            .map((deviceId, index) => ({ deviceId, name: names[index] || deviceId }))
            .filter((item) => !item.deviceId.startsWith("COMP-"))
            .map((item) => `${item.name} (${item.deviceId})`);
          return {
            id: log.id,
            ticketId: log.ticketId,
            assignedPerson: ticket?.technician || log.loggedBy || "-",
            assignmentDateTime: ticket?.sentAt || ticket?.createdAt || log.assignedAt || log.dateLogged,
            deviceNames,
            componentNames: [log.componentName || selected.name],
            quantityUsed: log.quantity,
            region: selected.region,
            warehouse: selected.warehouse,
            reason: log.reason || `Assigned to ticket ${log.ticketId}`,
            loggedBy: log.loggedBy,
          };
        });
    }
    if (parts[4] === "use") {
      const qty = body.quantity;
      const now = new Date();
      const assignedAt = body.assignedAt || now.toISOString();
      const comp = mockComponentsList.find((c) => c.id === id);
      if (comp) {
        comp.quantity = Math.max(0, comp.quantity - qty);
        comp.status = comp.quantity <= 0 ? "Out of Stock" : (comp.quantity < comp.minLimit ? "Low Stock" : "In Stock");
        comp.lastUpdated = now.toISOString().split("T")[0];
        // Store enriched link data on the component itself
        comp.ticketId = body.ticketId || body.deviceId || null;
        comp.assignedTicketId = body.ticketId || body.deviceId || null;
        comp.assignedPerson = body.person || body.loggedBy || null;
        comp.assignedAt = assignedAt;
        // Build enriched usage log entry
        const newLog = {
          id: mockComponentUsageLogsList.length + 1,
          componentId: id,
          componentName: comp.name,
          category: comp.category,
          quantity: qty,
          ticketId: body.ticketId || null,
          deviceId: body.deviceId || body.ticketId || null,
          reason: body.reason || "Assigned to ticket",
          loggedBy: body.person || body.loggedBy || "System",
          person: body.person || body.loggedBy || "System",
          region: body.region || comp.region || "",
          warehouse: comp.warehouse || "",
          assignedAt,
          dateLogged: now.toISOString().split("T")[0],
        };
        mockComponentUsageLogsList.unshift(newLog);
        return newLog;
      }
      return { success: true };
    }
    if (parts[4] === "adjust") {
      const change = body.quantityChange;
      const comp = mockComponentsList.find((c) => c.id === id);
      if (comp) {
        comp.quantity = Math.max(0, comp.quantity + change);
        comp.status = comp.quantity <= 0 ? "Out of Stock" : (comp.quantity < comp.minLimit ? "Low Stock" : "In Stock");
        comp.lastUpdated = new Date().toISOString().split("T")[0];
        if (change < 0) {
          const newLog = { id: mockComponentUsageLogsList.length + 1, componentId: id, componentName: comp.name, quantity: Math.abs(change), deviceId: null, reason: "Manual stock adjustment", loggedBy: "Admin", dateLogged: new Date().toISOString().split("T")[0] };
          mockComponentUsageLogsList.unshift(newLog);
        }
        return comp;
      }
      return { success: true };
    }
    if (method === "PUT") {
      mockComponentsList = mockComponentsList.map((c) => (c.id === id ? { ...c, ...body, status: body.quantity <= 0 ? "Out of Stock" : (body.quantity < body.minLimit ? "Low Stock" : "In Stock"), lastUpdated: new Date().toISOString().split("T")[0] } : c));
      return mockComponentsList.find((c) => c.id === id);
    }
    if (method === "DELETE") {
      mockComponentsList = mockComponentsList.filter((c) => c.id !== id);
      return { success: true };
    }
  }

  // ── Unified Last-Assigned endpoint ─────────────────────────────────────────
  if (endpoint === "/api/inventory/last-assigned") {
    const items = [];

    // Device assignments (ACTIVE only, most recent first)
    mockDeviceAssignmentsList
      .filter(a => a.status === "ACTIVE")
      .forEach(a => {
        items.push({
          id: `device-${a.id}`,
          type: "Device",
          name: a.deviceName || `Device ${a.deviceId}`,
          deviceId: a.deviceId,
          quantity: 1,
          ticketId: a.ticketId || "—",
          person: a.assigneeName || "—",
          region: a.region || "—",
          warehouse: a.region ? `${a.region} Warehouse` : "—",
          assignedAt: a.assignedAt || (a.assignmentDate ? new Date(a.assignmentDate).toISOString() : new Date().toISOString()),
          dateTime: a.assignmentDate || "—",
          status: "ACTIVE",
        });
      });

    // Component usage logs (all, most recent first)
    mockComponentUsageLogsList.forEach(c => {
      items.push({
        id: `component-${c.id}`,
        type: "Component",
        name: c.componentName,
        category: c.category || "",
        quantity: c.quantity || 1,
        ticketId: c.ticketId || c.deviceId || "—",
        person: c.person || c.loggedBy || "—",
        region: c.region || "—",
        warehouse: c.warehouse || (c.region ? `${c.region} Warehouse` : "—"),
        assignedAt: c.assignedAt || (c.dateLogged ? new Date(c.dateLogged).toISOString() : new Date().toISOString()),
        dateTime: c.dateLogged || "—",
        status: "ASSIGNED",
      });
    });

    // Sort newest first
    items.sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
    return items;
  }

  return [];
}

async function request(endpoint, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const config = {
    method,
    url: endpoint,
    headers: options.headers || {},
  };

  if (options.body) {
    config.data = options.body;
  }

  try {
    const response = await axiosInstance(config);
    api.isMockMode = false;
    return response.data;
  } catch (error) {
    if (error.response) {
      const errorData = error.response.data || {};
      const errObj = new Error(errorData.error || `HTTP error! Status: ${error.response.status}`);
      errObj.isHttpError = true;
      throw errObj;
    }
    // Return mock data fallback when backend fetch fails or is offline
    api.isMockMode = true;
    return getMockFallback(endpoint, options);
  }
}

export const api = {
  isMockMode: false,
  auth: {
    login: (email, password) =>
      request("/api/auth/login", {
        method: "POST",
        body: { email, password },
      }),
    getPermissions: () => request("/api/auth/permissions"),
    getMe: () => request("/api/auth/me"),
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
    getPermissions: (id) => request(`/api/roles/${id}/permissions`),
    updatePermissions: (id, permissions) => request(`/api/roles/${id}/permissions`, { method: "PUT", body: permissions }),
  },

  permissions: {
    getAll: () => request("/api/permissions"),
  },

  tickets: {
    getAll: () => request("/api/tickets"),
    getById: (id) => request(`/api/tickets/${id}`),
    getLogs: (id) => request(`/api/tickets/${id}/logs`),
    getAllLogs: () => request("/api/tickets/all-logs"),

    create: (ticket) => request("/api/tickets", { method: "POST", body: ticket }),
    update: (id, ticket) => request(`/api/tickets/${id}`, { method: "PUT", body: ticket }),
    updateStatus: (id, payload) => {
      const body = typeof payload === "string" ? { status: payload } : payload;
      return request(`/api/tickets/${id}/status`, {
        method: "PATCH",
        body,
      });
    },
    reject: (id, reason) =>
      request(`/api/tickets/${id}/reject`, {
        method: "PATCH",
        body: { reason },
      }),
    escalate: (id, reason, escalationType) =>
      request(`/api/tickets/${id}/escalate`, {
        method: "PATCH",
        body: { reason, escalationType },
      }),
    delete: (id) => request(`/api/tickets/${id}`, { method: "DELETE" }),
  },

  devices: {
    getAll: () => request("/api/devices"),
    getById: (id) => request(`/api/devices/${id}`),
    create: (device) => request("/api/devices", { method: "POST", body: device }),
    update: (id, device) => request(`/api/devices/${id}`, { method: "PUT", body: device }),
    delete: (id) => request(`/api/devices/${id}`, { method: "DELETE" }),
    assign: (id, payload) => request(`/api/devices/${id}/assign`, { method: "POST", body: payload }),
    return: (id, payload) => request(`/api/devices/${id}/return`, { method: "POST", body: payload }),
    getAssignments: () => request("/api/devices/assignments"),
    getDeviceAssignments: (id) => request(`/api/devices/${id}/assignments`),
    maintenance: (id, payload) => request(`/api/devices/${id}/maintenance`, { method: "POST", body: payload }),
    completeMaintenance: (logId, payload) => request(`/api/devices/maintenance/${logId}/complete`, { method: "PUT", body: payload }),
    getAllMaintenanceLogs: () => request("/api/devices/maintenance"),
    reports: {
      inventory: () => request("/api/devices/reports/inventory"),
      assignments: () => request("/api/devices/reports/assignments"),
      maintenance: () => request("/api/devices/reports/maintenance"),
      lostDamaged: () => request("/api/devices/reports/lost-damaged"),
    },
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
      try {
        const response = await axiosInstance.post("/api/training/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        return response.data;
      } catch (err) {
        return { url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" };
      }
    },
  },

  sla: {
    getMetrics: () => request("/api/sla/metrics"),
    getTechnicianPerformance: () => request("/api/sla/technicians"),
    getReports: (params = {}) => {
      const query = new URLSearchParams(
        Object.entries(params).filter(([_, v]) => v != null && v !== "")
      ).toString();
      return request(`/api/sla/reports${query ? `?${query}` : ""}`);
    },
  },
  components: {
    getAll: () => request("/api/components"),
    getUsageLogs: () => request("/api/components/usage-logs"),
    getHistory: (id) => request(`/api/components/${id}/history`),
    // create: merges quantity if same name+region already exists (see mock handler)
    create: (comp) => request("/api/components", { method: "POST", body: comp }),
    update: (id, comp) => request(`/api/components/${id}`, { method: "PUT", body: comp }),
    delete: (id) => request(`/api/components/${id}`, { method: "DELETE" }),
    use: (id, payload) => request(`/api/components/${id}/use`, { method: "POST", body: payload }),
    adjust: (id, payload) => request(`/api/components/${id}/adjust`, { method: "POST", body: payload }),
    // aliases used by InventoryPage
    adjustStock: (id, payload) => request(`/api/components/${id}/adjust`, { method: "POST", body: payload }),
    logUsage: (id, payload) => request(`/api/components/${id}/use`, { method: "POST", body: payload }),
  },

  // Unified inventory last-assigned feed (devices + components, sorted newest first)
  inventory: {
    getLastAssigned: () => request("/api/inventory/last-assigned"),
  },
  health: {
    getDiagnostics: () => request("/api/health/diagnostics"),
  },
};
