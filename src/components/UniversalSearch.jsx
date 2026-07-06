import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
 Search, X, Cpu, ClipboardList, Users, Bell, BookOpen, BarChart3,
 CornerDownLeft, Clock, ChevronRight, Package, CalendarClock,
 CheckSquare, AlertTriangle, Loader2, ShieldAlert,
 Sparkles, History
} from "lucide-react";
import { api } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import TicketDetailsModal from "./tickets/TicketDetailsModal";
import DeviceDetailsModal from "./devices/DeviceDetailsModal";
import Badge from "./ui/Badge";

// ─────────────────────────────────────────────────────────────────────────────
// RBAC Role Definitions
// ─────────────────────────────────────────────────────────────────────────────
const ADMIN_ROLES = ["Super Admin", "Operational Manager"];
const MANAGER_ROLES = ["Super Admin", "Operational Manager", "Warehouse Manager"];
const OPERATIONAL_MANAGER_ROLES = ["Super Admin", "Operational Manager"];
const TECHNICIAN_ROLES = ["Field Technician", "Technician"];

function isAdmin(user) { return ADMIN_ROLES.includes(user?.role); }
function isManager(user) { return MANAGER_ROLES.includes(user?.role); }
function isOperationalManager(user) { return OPERATIONAL_MANAGER_ROLES.includes(user?.role); }
function isTechnician(user) { return TECHNICIAN_ROLES.includes(user?.role); }

/**
 * applyRBAC: Filters raw API data down to what the logged-in user is allowed to see.
 * This runs BEFORE search so a technician can never see another technician's results.
 */
function applyRBAC(rawData, user) {
 if (!user) return { tickets: [], devices: [], users: [], teams: [], training: [], notifications: [], attendanceShifts: [], attendanceHistory: [] };

 // ── ADMIN: sees everything (full access permissions) ──
 if (isAdmin(user)) return rawData;

 // ── NORMAL USERS (Non-Admin): strictly see only their own details, notifications, and search results ──
 const myName = user.name || "";
 const myId = user.id;

 // 1. User search visibility: normal users only see their own user record
 const scopedUsers = (rawData.users || []).filter(u => u.id === myId || u.email === user.email);

 // 2. Search results visibility: normal users only see their own tickets/devices/attendance
 const scopedTickets = (rawData.tickets || []).filter(t => 
 t.technician === myName || t.assignedTo === myName || t.technicianId === myId
 );
 
 const mySites = scopedTickets.map(t => (t.site || t.siteName || "").toLowerCase()).filter(Boolean);
 const scopedDevices = (rawData.devices || []).filter(d => {
 const dSite = (d.site || d.siteName || "").toLowerCase();
 return mySites.some(site => dSite.includes(site));
 });

 // 3. Notifications visibility: normal users only see their own notifications
 const scopedNotifications = (rawData.notifications || []).filter(n => n.userId === myId || n.recipientId === myId);

 return {
 tickets: scopedTickets,
 devices: scopedDevices,
 users: scopedUsers,
 teams: [], // Normal users cannot search or see teams list
 training: rawData.training || [], // Global training portal resources are visible
 notifications: scopedNotifications,
 attendanceShifts: (rawData.attendanceShifts || []).filter(s => s.userId === myId || s.name === myName),
 attendanceHistory:(rawData.attendanceHistory || []).filter(h => h.technicianId === myId || h.technicianName === myName),
 };
}

// ─────────────────────────────────────────────────────────────────────────────
// Role-aware suggestions
// ─────────────────────────────────────────────────────────────────────────────
function getSuggestions(user) {
  if (isAdmin(user)) {
    return [
      { label: "How do I create a ticket?", query: "How do I create a ticket?" },
      { label: "Where can I view completed activities?", query: "Where can I view completed activities?" },
      { label: "How do I assign a device?", query: "How do I assign a device?" },
      { label: "How do I check SLA violations?", query: "How do I check SLA violations?" },
      { label: "How do I create a user?", query: "How do I create a user?" },
      { label: "How do I add inventory stock?", query: "How do I add inventory stock?" },
    ];
  }
  return [
    { label: "How do I check my score?", query: "How do I check my score?" },
    { label: "How do I enroll in a course?", query: "How do I enroll in a course?" },
    { label: "How do I mark attendance?", query: "How do I mark attendance?" },
    { label: "What is Ticket Management?", query: "What is Ticket Management?" },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function levenshtein(a, b) {
 const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
 for (let j = 1; j <= b.length; j++) dp[0][j] = j;
 for (let i = 1; i <= a.length; i++)
 for (let j = 1; j <= b.length; j++)
 dp[i][j] = Math.min(dp[i-1][j]+1, dp[i][j-1]+1, dp[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
 return dp[a.length][b.length];
}

function fuzzyMatch(word, target) {
 if (!word || !target) return false;
 word = word.toLowerCase().trim();
 target = target.toLowerCase().trim();
 if (target.includes(word) || word.includes(target)) return true;
 const maxD = word.length <= 4 ? 1 : 2;
 if (Math.abs(word.length - target.length) > maxD) return false;
 return levenshtein(word, target) <= maxD;
}

function getDateStr(q) {
 const now = new Date();
 if (q.includes("today")) return now.toISOString().slice(0, 10);
 if (q.includes("tomorrow")) { const d = new Date(now); d.setDate(d.getDate()+1); return d.toISOString().slice(0, 10); }
 if (q.includes("yesterday")) { const d = new Date(now); d.setDate(d.getDate()-1); return d.toISOString().slice(0, 10); }
 const months = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
 const mi = months.findIndex(m => q.includes(m));
 if (mi !== -1) {
 const dm = q.match(/\b\d{1,2}\b/);
 if (dm) return `${now.getFullYear()}-${String(mi+1).padStart(2,"0")}-${String(parseInt(dm[0])).padStart(2,"0")}`;
 }
 const iso = q.match(/\b\d{4}-\d{2}-\d{2}\b/);
 return iso ? iso[0] : null;
}

function sameDate(dateStr, target) {
 if (!dateStr || !target) return false;
 try {
 const d = new Date(dateStr);
 if (isNaN(d.getTime())) return false;
 return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}` === target;
 } catch { return false; }
}

// ─────────────────────────────────────────────────────────────────────────────
// NLP Search Parser (pure, module-level — no stale closures)
// Receives RBAC-filtered data, so role enforcement is already done upstream.
// ─────────────────────────────────────────────────────────────────────────────
function parseSearch(rawQuery, scopedData, user) {
 const q = rawQuery.toLowerCase().trim();
 const words = q.split(/\s+/).filter(Boolean);
 const has = (w) => words.some(ww => fuzzyMatch(w, ww));
 const queryDate = getDateStr(q);

 // ── TICKETS ──────────────────────────────────────────────────────────────
 let ticketMatches = (scopedData.tickets || []).filter(t => {
 if (!t) return false;
 const id = (t.id || "").toLowerCase();
 if (q.includes(id)) return true;
 const fields = [t.id, t.customer, t.site, t.siteName, t.issue, t.technician, t.assignedTo, t.jobType, t.deviceName, t.zone].filter(Boolean);
 const kw = words.some(w => fields.some(f => fuzzyMatch(w, f)));

 let priority = true;
 if (has("critical")||has("severe")) priority = t.priority==="CRITICAL";
 else if (has("high")) priority = t.priority==="HIGH";
 else if (has("medium")) priority = t.priority==="MEDIUM";
 else if (has("low")) priority = t.priority==="LOW";

 let status = true;
 if (has("completed")||has("resolved")||has("done")||has("closed")) status = t.status==="COMPLETED";
 else if (has("accepted")||has("acknowledged")||has("started")) status = ["ACCEPTED","TRAVELLING","REVIEW"].includes(t.status);
 else if (has("travelling")||has("transit")) status = t.status==="TRAVELLING";
 else if (has("unassigned")||has("pending")||has("open")) status = t.status==="UNASSIGNED";
 else if (has("escalated")||has("breached")||has("overdue")||has("sla")) status = t.status==="ESCALATED" || t.slaOverdue;
 else if (has("rejected")||has("declined")) status = t.status==="REJECTED";

 let dateMatch = true;
 if (queryDate) dateMatch = sameDate(t.createdAt || t.sentAt || t.reportedAt, queryDate);

 const filterWords = ["today","tomorrow","yesterday","critical","severe","high","medium","low",
 "completed","resolved","done","closed","accepted","started","travelling","transit",
 "unassigned","pending","open","escalated","breached","overdue","sla","rejected","declined",
 "my","me","do","i","have","assigned","to","ticket","tickets","task","tasks","job","jobs",
 "jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
 const rem = words.filter(w => !filterWords.includes(w));
 const hasExplicitFilter = queryDate || has("critical")||has("severe")||has("high")||has("medium")||
 has("low")||has("completed")||has("resolved")||has("done")||has("accepted")||has("started")||
 has("travelling")||has("unassigned")||has("pending")||has("open")||has("escalated")||
 has("breached")||has("overdue")||has("sla")||has("rejected");

 if (hasExplicitFilter) {
 const remMatch = rem.length === 0 || rem.some(w => fields.some(f => fuzzyMatch(w, f)));
 return priority && status && dateMatch && remMatch;
 }
 return kw;
 });

 // Tomorrow fallback — show active tickets if no tomorrow matches
 if (q.includes("tomorrow") && ticketMatches.length === 0) {
 ticketMatches = (scopedData.tickets || []).filter(t => t && !["COMPLETED","REJECTED"].includes(t.status));
 }

 // ── TASKS (active tickets ≠ completed/rejected) ────────────────────────
 const taskMatches = (has("task")||has("tasks")||has("todo")||has("job")||has("work")||has("checklist"))
 ? (scopedData.tickets || []).filter(t => t && !["COMPLETED","REJECTED"].includes(t.status))
 : [];

 // ── DEVICES ──────────────────────────────────────────────────────────────
 const deviceMatches = (scopedData.devices || []).filter(d => {
 if (!d) return false;
 if ((d.site||d.siteName||"").toLowerCase().includes("warehouse")) return false;
 if (q.includes((d.id||"").toLowerCase())) return true;
 const fields = [d.id, d.name, d.type, d.firmware, d.connectivity, d.site, d.siteName, d.zone].filter(Boolean);
 const kw = words.some(w => fields.some(f => fuzzyMatch(w, f)));

 let status = true;
 if (has("offline")||has("down")||has("disconnected")) status = d.status==="Offline";
 else if (has("online")||has("connected")) status = d.status==="Online";
 else if (has("critical")||has("danger")) status = d.status==="Damaged";
 else if (has("warning")) status = d.status==="Warning";

 let battery = true;
 if (has("battery") && (has("low")||has("dead")||has("empty"))) battery = (d.battery||100) <= 25;

 const hasExplicit = has("offline")||has("down")||has("disconnected")||has("online")||has("connected")||
 has("critical")||has("danger")||has("warning")||(has("battery")&&(has("low")||has("dead")||has("empty")));
 if (hasExplicit) {
 const fw = ["offline","down","disconnected","online","connected","critical","danger","warning","battery","low","dead","empty","device","devices","sensor","sensors","iot"];
 const rem = words.filter(w => !fw.includes(w));
 return status && battery && (rem.length===0 || rem.some(w => fields.some(f => fuzzyMatch(w,f))));
 }
 return kw;
 });

 // ── INVENTORY (warehouse devices) ─────────────────────────────────────
 const inventoryMatches = (isManager(user) || isAdmin(user))
 ? (scopedData.devices || []).filter(d => {
 if (!d) return false;
 const site = (d.site || d.siteName || "").toLowerCase();
 if (!site.includes("warehouse")) return false;
 const fields = [d.id, d.name, d.type, d.connectivity, d.site, d.siteName].filter(Boolean);
 return q.includes((d.id||"").toLowerCase()) || words.some(w => fields.some(f => fuzzyMatch(w, f)));
 })
 : [];

 // ── USERS ──────────────────────────────────────────────────────────────
 const userMatches = (scopedData.users || []).filter(u => {
 if (!u) return false;
 const fields = [u.name, u.email, u.role, u.team, u.zone, u.mobile].filter(Boolean);
 const kw = words.some(w => fields.some(f => fuzzyMatch(w, f)));

 let status = true;
 if (has("active")||has("online")) status = ["Active","On Shift"].includes(u.status);
 else if (has("shift")||has("working")||has("duty")) status = u.status==="On Shift";
 else if (has("break")) status = ["Break","On Break"].includes(u.status);
 else if (has("inactive")||has("offline")) status = ["Inactive","Off Shift"].includes(u.status);
 const hasExplicit = has("active")||has("online")||has("shift")||has("working")||has("duty")||has("break")||has("inactive");
 return hasExplicit ? status && (kw || words.length <= 2) : kw;
 });

 // ── TEAMS ──────────────────────────────────────────────────────────────
 const teamMatches = (scopedData.teams || []).filter(t => {
 if (!t) return false;
 const fields = [t.name, t.zone, t.lead, t.place].filter(Boolean);
 return words.some(w => fields.some(f => fuzzyMatch(w, f)));
 });

 // ── TRAINING (available to all roles) ────────────────────────────────
 const trainingMatches = (scopedData.training || []).filter(m => {
 if (!m) return false;
 const fields = [m.title, m.description, m.targetedRole, m.contentType].filter(Boolean);
 const kw = words.some(w => fields.some(f => fuzzyMatch(w, f)));
 if (has("pdf")||has("document")) return kw && (m.contentType||"").toLowerCase().includes("pdf");
 if (has("video")||has("mp4")) return kw && (m.contentType||"").toLowerCase().includes("video");
 return kw;
 });

 // ── NOTIFICATIONS ────────────────────────────────────────────────────
 const notifMatches = (scopedData.notifications || []).filter(n => {
 if (!n) return false;
 const fields = [n.title, n.type, n.timeLabel].filter(Boolean);
 const kw = words.some(w => fields.some(f => fuzzyMatch(w, f)));
 if (has("unread")||has("new")) return n.unread === true && (kw || words.length <= 2);
 if (has("read")||has("old")) return n.unread === false && (kw || words.length <= 2);
 return kw;
 });

 // ── REPORTS (only for admin/manager/operational manager) ──────────────
 const reportMatches = [];
 if ((isAdmin(user) || isManager(user) || isOperationalManager(user)) &&
 (has("report")||has("analytic")||has("chart")||has("performance")||has("trend")||has("metric")||has("sla"))) {
 const list = [
 { name:"SLA Trend Analysis Report", path:"/analytics", desc:"Avg response times & weekly SLA compliance.", keywords:["sla","compliance","trend","response"] },
 { name:"Technician Workload Performance", path:"/analytics", desc:"Resolved counts, fix rates & individual workloads.", keywords:["technician","workload","performance","fix"] },
 { name:"IoT Device Health Analytics", path:"/devices", desc:"Firmware, connectivity & device status.", keywords:["device","health","battery","telemetry"] },
 { name:"Attendance Logs & Audits", path:"/attendance",desc:"Shift history, GPS coordinates & break stats.", keywords:["attendance","audit","shift","gps"] },
 { name:"Inventory Stock Distribution", path:"/inventory", desc:"Warehouse counts, low stock alerts.", keywords:["inventory","stock","distribution","warehouse"] },
 ];
 list.forEach(r => {
 if (has("report")||has("analytics")||words.some(w=>fuzzyMatch(w,r.name)||r.keywords.some(k=>fuzzyMatch(w,k))))
 reportMatches.push(r);
 });
 }

 // ── ATTENDANCE ────────────────────────────────────────────────────────
 const attendanceMatches = [];
 const isAttQ = has("attendance")||has("shift")||has("punch")||has("break")||has("clock")||has("duty")||has("working");
 // Only admin/operational manager can search other people by name; technicians only see self
 const canSearchByName = isAdmin(user) || isOperationalManager(user) || isManager(user);
 const queriedUser = canSearchByName
 ? (scopedData.users||[]).find(u => (u.name||"") && q.includes((u.name||"").toLowerCase()))
 : null;

 if (isAttQ || queriedUser) {
 (scopedData.attendanceShifts||[]).forEach(s => {
 let match = false;
if (queriedUser && (s.userId===queriedUser.id || s.name===queriedUser.name)) match = true;
 else if (!queriedUser && isAttQ) {
 if ((has("active")||has("on"))&&s.shiftStatus==="on_shift") match = true;
 else if (has("break")&&s.shiftStatus==="on_break") match = true;
 else if ((has("off")||has("out"))&&s.shiftStatus==="off_shift") match = true;
 else if (!has("active")&&!has("break")&&!has("off")&&!has("out")) match = true;
 }
 if (match) attendanceMatches.push({
 type:"shift", id:s.userId, name:s.name, team:s.team, zone:s.zone,
 status: s.shiftStatus==="on_shift"?"Active Shift":s.shiftStatus==="on_break"?"On Break":"Off Shift",
 statusRaw:s.shiftStatus, punchInAt:s.punchInAt, gpsAddress:s.gpsAddress,
 });
 });
 let logCount = 0;
 (scopedData.attendanceHistory||[]).forEach(h => {
 if (logCount >= 5) return;
 let match = false;
 if (queriedUser && (h.technicianId===queriedUser.id || h.technicianName===queriedUser.name)) match = true;
 else if (!queriedUser && isAttQ) {
 if (has("punch")&&has("in")&&h.type==="PUNCH_IN") match = true;
 else if (has("punch")&&has("out")&&h.type==="PUNCH_OUT") match = true;
 else if (has("break")&&["BREAK_START","BREAK_END"].includes(h.type)) match = true;
 else if (!has("in")&&!has("out")&&!has("break")) match = true;
 }
 if (match) {
 attendanceMatches.push({
 type:"log", id:h.id, name:h.technicianName||"Technician",
 eventType: h.type==="PUNCH_IN"?"Punch In":h.type==="PUNCH_OUT"?"Punch Out":h.type==="BREAK_START"?"Start Break":"End Break",
 typeRaw:h.type, timestamp:h.timestamp, gpsAddress:h.gpsAddress, zone:h.zone,
 });
 logCount++;
 }
 });
 }

 // ── Title ─────────────────────────────────────────────────────────────
 let title = "Search Results";
 if (q.includes("today")&&(q.includes("ticket")||q.includes("task")||q.includes("have")))
 title = isTechnician(user) ? "My Tickets for Today" : "All Tickets for Today";
 else if (q.includes("tomorrow")&&(q.includes("ticket")||q.includes("task")||q.includes("have")))
 title = isTechnician(user) ? "My Upcoming Tickets" : "Scheduled Tickets (Tomorrow)";
 else if (q.includes("offline")||q.includes("down")) title = "Offline Devices";
 else if (q.includes("shift")||q.includes("technician")) title = "Technicians on Shift";

 return {
 title,
 results: {
 Tickets: ticketMatches,
 Tasks: taskMatches,
 Devices: deviceMatches,
 Inventory: inventoryMatches,
 Users: userMatches,
 Teams: teamMatches,
 Training: trainingMatches,
 Notifications: notifMatches,
 Reports: reportMatches,
 Attendance: attendanceMatches,
 },
 };
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// AI Assistant Intent Knowledge Base
// ─────────────────────────────────────────────────────────────────────────────
const INTENTS = [
  // ── 1. DASHBOARD ──
  {
    id: "dashboard_what_is",
    question: "What is Dashboard?",
    description: "Dashboard is the main overview page where you can view key statistics, recent activities, pending tasks, ticket summaries, attendance, device status, and performance metrics.",
    navigationPath: "Sidebar → Dashboard",
    keywords: ["what", "is", "dashboard", "overview", "use", "used", "for"],
    steps: [
      "Navigate to the main page to see the overview.",
      "Observe widgets showing ticket counts, recent activity logs, and device metrics.",
      "Monitor real-time compliance and performance charts."
    ],
    buttonText: "Open Dashboard",
    targetPath: "/",
    related: ["dashboard_how_to_open", "dashboard_info_available"]
  },
  {
    id: "dashboard_how_to_open",
    question: "How do I open Dashboard?",
    description: "Click Dashboard from the left sidebar menu.",
    navigationPath: "Sidebar → Dashboard",
    keywords: ["how", "do", "i", "open", "dashboard", "navigate", "go"],
    steps: [
      "Locate the left sidebar navigation menu.",
      "Click on the 'Dashboard' link (indicated by the home icon) to return to the home screen."
    ],
    buttonText: "Open Dashboard",
    targetPath: "/",
    related: ["dashboard_what_is", "dashboard_info_available"]
  },
  {
    id: "dashboard_info_available",
    question: "What information is available on the Dashboard?",
    description: "Ticket counts, activity summaries, attendance statistics, device status, SLA alerts, inventory information, and analytics charts.",
    navigationPath: "Sidebar → Dashboard",
    keywords: ["what", "information", "available", "on", "dashboard", "data", "stats"],
    steps: [
      "Open the Dashboard from the sidebar.",
      "Review the numeric badges for tickets, pending tasks, and active technicians.",
      "Inspect the live charts for SLA breaches and device battery status."
    ],
    buttonText: "Open Dashboard",
    targetPath: "/",
    related: ["dashboard_what_is", "dashboard_how_to_open"]
  },
  // ── 2. MAP ──
  {
    id: "map_what_is",
    question: "What is the Map module?",
    description: "The Map module displays the geographical locations of technicians, devices, activities, tickets, and assigned regions.",
    navigationPath: "Sidebar → Map",
    keywords: ["what", "is", "map", "module", "geographical", "locations"],
    steps: [
      "Navigate to the Map module using the sidebar link.",
      "Review live status markers for technicians and IoT devices.",
      "Observe spatial distribution of service tickets and regional boundaries."
    ],
    buttonText: "Open Map Module",
    targetPath: "/map",
    related: ["map_view_techs", "map_find_activities"]
  },
  {
    id: "map_view_techs",
    question: "How do I view technician locations?",
    description: "Open Map → Select Technician View.",
    navigationPath: "Map → Select Technician View",
    keywords: ["how", "view", "technician", "locations", "tech", "where", "see"],
    steps: [
      "Open the Map page from the sidebar menu.",
      "Click the 'Technician View' control tab on the map overlay.",
      "Hover over individual technician pins to view names, connection status, and current task info."
    ],
    buttonText: "Open Map Module",
    targetPath: "/map",
    related: ["map_what_is", "map_find_activities"]
  },
  {
    id: "map_find_activities",
    question: "How do I find activities near a location?",
    description: "Open Map and use the location filters.",
    navigationPath: "Map → Location Filters",
    keywords: ["how", "find", "activities", "near", "location", "filter"],
    steps: [
      "Navigate to the Map module.",
      "Locate the filtering tools at the top of the map interface.",
      "Set your location filter parameters to show nearby activities, tickets, or devices."
    ],
    buttonText: "Open Map Module",
    targetPath: "/map",
    related: ["map_what_is", "map_view_techs"]
  },
  // ── 3. TICKETS ──
  {
    id: "tickets_what_is",
    question: "What is Ticket Management?",
    description: "Ticket Management is used to create, assign, track, update, and resolve service tickets.",
    navigationPath: "Sidebar → Tickets",
    keywords: ["what", "is", "ticket", "management", "pending", "show", "tickets"],
    steps: [
      "Go to the Tickets page from the left sidebar.",
      "Create new support tickets or update existing assignments.",
      "Filter tickets by priority, status, or assignee."
    ],
    buttonText: "Open Ticket Management",
    targetPath: "/tickets",
    related: ["tickets_create", "tickets_assign", "tickets_close"]
  },
  {
    id: "tickets_create",
    question: "How do I create a ticket?",
    description: "Tickets → Create Ticket → Fill details → Submit.",
    navigationPath: "Tickets → Create Ticket Button",
    keywords: ["how", "create", "ticket", "raise", "add", "new"],
    steps: [
      "Go to the Tickets page from the navigation bar.",
      "Click the 'Create Ticket' action button in the upper menu.",
      "Fill in client contact, site location, hardware type, and problem details.",
      "Submit the form to assign or queue the ticket."
    ],
    buttonText: "Open Ticket Management",
    targetPath: "/tickets",
    related: ["tickets_what_is", "tickets_assign", "tickets_close"]
  },
  {
    id: "tickets_assign",
    question: "How do I assign a ticket?",
    description: "Open Ticket → Assign Technician → Select Technician → Save.",
    navigationPath: "Tickets → Select Ticket → Assign",
    keywords: ["how", "assign", "ticket", "dispatch", "technician"],
    steps: [
      "Navigate to the Tickets screen and select the ticket you want to delegate.",
      "Click on the ticket row or click 'Edit' to open details.",
      "Locate the 'Assign Technician' dropdown field.",
      "Select a technician active in that zone and click 'Save'."
    ],
    buttonText: "Open Ticket Management",
    targetPath: "/tickets",
    related: ["tickets_what_is", "tickets_create", "tickets_close"]
  },
  {
    id: "tickets_close",
    question: "How do I close a ticket?",
    description: "Open Ticket → Change Status to Completed/Closed → Save.",
    navigationPath: "Tickets → Select Ticket → Complete",
    keywords: ["how", "close", "ticket", "complete", "resolve", "status"],
    steps: [
      "Open the target ticket details modal from the tickets list.",
      "Select the status dropdown and change status to 'Completed' or 'Closed'.",
      "Optionally log the resolution details and submit verification documents.",
      "Save the ticket state to update records."
    ],
    buttonText: "Open Ticket Management",
    targetPath: "/tickets",
    related: ["tickets_what_is", "tickets_create", "tickets_assign"]
  },
  // ── 4. ACTIVITY LOGS ──
  {
    id: "activity_what_is",
    question: "What are Activity Logs?",
    description: "Activity Logs store records of all user actions and system activities.",
    navigationPath: "Sidebar → Activity Logs",
    keywords: ["what", "are", "activity", "logs", "audit", "trail", "history"],
    steps: [
      "Navigate to the Activity Logs page in the sidebar.",
      "Review the chronological list of technician check-ins, punches, and actions.",
      "Use search criteria to verify specific log entries."
    ],
    buttonText: "Open Activity Logs",
    targetPath: "/activity-logs",
    related: ["activity_view_completed", "activity_view_rejected", "activity_filter"]
  },
  {
    id: "activity_view_completed",
    question: "How do I view completed activities?",
    description: "Activity Logs → Completed Activities.",
    navigationPath: "Activity Logs → Completed Activities Filter",
    keywords: ["how", "view", "completed", "activities", "where", "see"],
    steps: [
      "Open the Activity Logs page.",
      "Apply the 'Completed Activities' filter or click on the corresponding tab.",
      "Scan the list of completed assignments, punches, and ticket updates."
    ],
    buttonText: "Open Activity Logs",
    targetPath: "/activity-logs",
    related: ["activity_what_is", "activity_view_rejected", "activity_filter"]
  },
  {
    id: "activity_view_rejected",
    question: "How do I view rejected activities?",
    description: "Activity Logs → Rejected Activities.",
    navigationPath: "Activity Logs → Rejected Activities Filter",
    keywords: ["how", "view", "rejected", "activities", "declined", "denied"],
    steps: [
      "Open the Activity Logs module.",
      "Select the 'Rejected Activities' filter option.",
      "Observe the entries flagged as rejected and read any attached supervisor comments."
    ],
    buttonText: "Open Activity Logs",
    targetPath: "/activity-logs",
    related: ["activity_what_is", "activity_view_completed", "activity_filter"]
  },
  {
    id: "activity_filter",
    question: "Can I filter activities?",
    description: "Yes, by date, user, status, role, and activity type.",
    navigationPath: "Activity Logs → Filter Controls",
    keywords: ["can", "i", "filter", "activities", "search", "date", "user", "status", "role"],
    steps: [
      "Go to the Activity Logs screen.",
      "Open the filter panel to select parameters such as Date, User, Status, Role, and Activity Type.",
      "Click apply to update the view."
    ],
    buttonText: "Open Activity Logs",
    targetPath: "/activity-logs",
    related: ["activity_what_is", "activity_view_completed", "activity_view_rejected"]
  },
  // ── 5. DEVICES ──
  {
    id: "devices_what_is",
    question: "What is Device Management?",
    description: "Device Management is used to register, monitor, assign, and track devices.",
    navigationPath: "Sidebar → Devices",
    keywords: ["what", "is", "device", "management", "register", "monitor", "track"],
    steps: [
      "Navigate to the Devices page.",
      "Track live telemetry status, battery levels, and connectivity stats.",
      "Manage hardware associations with clients and locations."
    ],
    buttonText: "Open Device Management",
    targetPath: "/devices",
    related: ["devices_add", "devices_assign", "devices_view_inactive"]
  },
  {
    id: "devices_add",
    question: "How do I add a new device?",
    description: "Devices → Add Device → Enter details → Save.",
    navigationPath: "Devices → Add Device Button",
    keywords: ["how", "add", "new", "device", "register", "hardware", "iot"],
    steps: [
      "Navigate to the Devices management section.",
      "Click the 'Add Device' button at the top right.",
      "Enter the device details including ID, model type, firmware version, and communication module.",
      "Save the record."
    ],
    buttonText: "Open Device Management",
    targetPath: "/devices",
    related: ["devices_what_is", "devices_assign", "devices_view_inactive"]
  },
  {
    id: "devices_assign",
    question: "How do I assign a device?",
    description: "Open Device → Assign User → Select User → Save.",
    navigationPath: "Devices → Select Device → Assign User",
    keywords: ["how", "assign", "device", "link", "connect", "technician"],
    steps: [
      "Select the specific device from the Devices list to open its details.",
      "Click the 'Assign User' or 'Assign Site' action.",
      "Choose the target technician or user from the list.",
      "Confirm and save the changes."
    ],
    buttonText: "Open Device Management",
    targetPath: "/devices",
    related: ["devices_what_is", "devices_add", "devices_view_inactive"]
  },
  {
    id: "devices_view_inactive",
    question: "How do I view inactive devices?",
    description: "Devices → Filter → Inactive Devices.",
    navigationPath: "Devices → Status Filters",
    keywords: ["how", "view", "inactive", "devices", "offline", "disconnected"],
    steps: [
      "Open the Devices module.",
      "Locate the status filters dropdown.",
      "Select 'Inactive Devices' (or Offline/Disconnected) to narrow down the hardware list."
    ],
    buttonText: "Open Device Management",
    targetPath: "/devices",
    related: ["devices_what_is", "devices_add", "devices_assign"]
  },
  // ── 6. SLA MONITOR ──
  {
    id: "sla_what_is",
    question: "What is SLA Monitor?",
    description: "SLA Monitor tracks service deadlines and response times.",
    navigationPath: "Sidebar → SLA Monitor",
    keywords: ["what", "is", "sla", "monitor", "service", "deadline", "compliance"],
    steps: [
      "Navigate to the SLA Monitor screen from the sidebar.",
      "Inspect real-time target status for all assigned tickets.",
      "Identify tickets at risk of breach before deadlines expire."
    ],
    buttonText: "Open SLA Monitor",
    targetPath: "/sla",
    related: ["sla_importance", "sla_check_violations", "sla_upcoming_deadlines"]
  },
  {
    id: "sla_importance",
    question: "Why is SLA important?",
    description: "It ensures tickets are resolved within the required time limits.",
    navigationPath: "Sidebar → SLA Monitor",
    keywords: ["why", "sla", "important", "purpose", "value", "significance"],
    steps: [
      "Review the SLA policy and compliance metrics in the SLA Monitor.",
      "Note how missing SLAs directly impacts contract penalties and support quality.",
      "Maintain active dispatch priority to prevent tickets from going overdue."
    ],
    buttonText: "Open SLA Monitor",
    targetPath: "/sla",
    related: ["sla_what_is", "sla_check_violations", "sla_upcoming_deadlines"]
  },
  {
    id: "sla_check_violations",
    question: "How do I check SLA violations?",
    description: "SLA Monitor → Violated Tickets.",
    navigationPath: "SLA Monitor → Violated Tickets Tab",
    keywords: ["how", "check", "sla", "violations", "breach", "overdue"],
    steps: [
      "Open the SLA Monitor screen.",
      "Apply the 'Violated Tickets' filter or select the corresponding list tab.",
      "Review the tickets that have violated response or resolution time limits."
    ],
    buttonText: "Open SLA Monitor",
    targetPath: "/sla",
    related: ["sla_what_is", "sla_importance", "sla_upcoming_deadlines"]
  },
  {
    id: "sla_upcoming_deadlines",
    question: "How do I view approaching SLA deadlines?",
    description: "SLA Monitor → Upcoming Deadlines.",
    navigationPath: "SLA Monitor → Upcoming Deadlines Tab",
    keywords: ["how", "view", "approaching", "sla", "deadlines", "upcoming", "soon"],
    steps: [
      "Open the SLA Monitor.",
      "Switch to the 'Upcoming Deadlines' tab.",
      "Sort tickets by remaining time to focus dispatch on critical items."
    ],
    buttonText: "Open SLA Monitor",
    targetPath: "/sla",
    related: ["sla_what_is", "sla_importance", "sla_check_violations"]
  },
  // ── 7. ATTENDANCE ──
  {
    id: "attendance_what_is",
    question: "What is Attendance Management?",
    description: "Attendance Management tracks employee attendance, check-ins, and working hours.",
    navigationPath: "Sidebar → Attendance",
    keywords: ["what", "is", "attendance", "management", "track", "hours", "shift"],
    steps: [
      "Go to the Attendance page from the sidebar menu.",
      "Review active technician shifts and historical punch logs.",
      "Check working hours and geographic location maps for field staff."
    ],
    buttonText: "Open Attendance",
    targetPath: "/attendance",
    related: ["attendance_mark", "attendance_view_reports", "attendance_check_absent"]
  },
  {
    id: "attendance_mark",
    question: "How do I mark attendance?",
    description: "Attendance → Check In.",
    navigationPath: "Attendance → Check In Button",
    keywords: ["how", "mark", "attendance", "check", "in", "out", "punch"],
    steps: [
      "Navigate to the Attendance page.",
      "Click the 'Check In' button to log your start time and location.",
      "Click 'Check Out' or 'Start Break' as needed throughout your shift."
    ],
    buttonText: "Open Attendance",
    targetPath: "/attendance",
    related: ["attendance_what_is", "attendance_view_reports", "attendance_check_absent"]
  },
  {
    id: "attendance_view_reports",
    question: "How do I view attendance reports?",
    description: "Attendance → Reports.",
    navigationPath: "Attendance → Reports Panel",
    keywords: ["how", "view", "attendance", "reports", "history", "logs"],
    steps: [
      "Open the Attendance page.",
      "Click on the 'Reports' or 'History' tab.",
      "Filter by dates or technician names to view summaries of hours worked."
    ],
    buttonText: "Open Attendance",
    targetPath: "/attendance",
    related: ["attendance_what_is", "attendance_mark", "attendance_check_absent"]
  },
  {
    id: "attendance_check_absent",
    question: "How do I check absent employees?",
    description: "Attendance → Absent Employees.",
    navigationPath: "Attendance → Absent List",
    keywords: ["how", "check", "absent", "employees", "staff", "missing"],
    steps: [
      "Go to the Attendance screen.",
      "Select the 'Absent Employees' list tab.",
      "Review which scheduled staff have not punched in for their shift today."
    ],
    buttonText: "Open Attendance",
    targetPath: "/attendance",
    related: ["attendance_what_is", "attendance_mark", "attendance_view_reports"]
  },
  // ── 8. USER MANAGEMENT ──
  {
    id: "users_what_is",
    question: "What is User Management?",
    description: "User Management is used to create, update, manage, and deactivate users.",
    navigationPath: "Sidebar → User Management",
    keywords: ["what", "is", "user", "management", "admin", "take", "me", "to"],
    steps: [
      "Navigate to the User Management page (located under Field Force in the sidebar).",
      "Manage technician profiles, contact details, and organization roles.",
      "Reset passwords or deactivate users from the user roster."
    ],
    buttonText: "Open User Management",
    targetPath: "/users",
    related: ["users_create", "users_reset_password", "users_deactivate"]
  },
  {
    id: "users_create",
    question: "How do I create a user?",
    description: "User Management → Add User → Enter Details → Save.",
    navigationPath: "User Management → Add User Button",
    keywords: ["how", "create", "user", "add", "new", "register", "technician"],
    steps: [
      "Go to the User Management page.",
      "Click the 'Add User' button on the management bar.",
      "Input user personal details, contact number, role, and regional zone.",
      "Save the details to activate the account."
    ],
    buttonText: "Open User Management",
    targetPath: "/users",
    related: ["users_what_is", "users_reset_password", "users_deactivate"]
  },
  {
    id: "users_reset_password",
    question: "How do I reset a user's password?",
    description: "Open User → Reset Password.",
    navigationPath: "User Management → Select User → Reset Password",
    keywords: ["how", "reset", "user", "password", "creds", "change"],
    steps: [
      "Open the User Management roster and find the specific user.",
      "Click on their profile row to open the details modal.",
      "Click the 'Reset Password' action button.",
      "Confirm to generate a temporary security credential."
    ],
    buttonText: "Open User Management",
    targetPath: "/users",
    related: ["users_what_is", "users_create", "users_deactivate"]
  },
  {
    id: "users_deactivate",
    question: "How do I deactivate a user?",
    description: "Open User → Deactivate User.",
    navigationPath: "User Management → Select User → Deactivate",
    keywords: ["how", "deactivate", "user", "remove", "disable", "suspend"],
    steps: [
      "Select the target user from the User Management list.",
      "In their profile modal, click the 'Deactivate User' button.",
      "Confirm to revoke all application access rights for the account."
    ],
    buttonText: "Open User Management",
    targetPath: "/users",
    related: ["users_what_is", "users_create", "users_reset_password"]
  },
  // ── 9. SCHEME MANAGEMENT ──
  {
    id: "schemes_what_is",
    question: "What is Scheme Management?",
    description: "Scheme Management is used to manage government or organizational schemes and their related activities.",
    navigationPath: "Sidebar → Scheme Management",
    keywords: ["what", "is", "scheme", "management", "programs", "government"],
    steps: [
      "Open the Scheme Management page (via the Schemes sidebar link).",
      "Monitor program definitions, assigned zones, and team goals.",
      "Review scheme performance metrics and user participation."
    ],
    buttonText: "Open Scheme Management",
    targetPath: "/teams",
    related: ["schemes_create", "schemes_assign_users", "schemes_monitor_progress"]
  },
  {
    id: "schemes_create",
    question: "How do I create a new scheme?",
    description: "Scheme Management → Add Scheme → Save.",
    navigationPath: "Scheme Management → Add Scheme Button",
    keywords: ["how", "create", "new", "scheme", "add", "program"],
    steps: [
      "Go to the Scheme Management screen.",
      "Click on the 'Add Scheme' button.",
      "Fill in the scheme name, description, timeline, and goals.",
      "Save to launch the scheme definition."
    ],
    buttonText: "Open Scheme Management",
    targetPath: "/teams",
    related: ["schemes_what_is", "schemes_assign_users", "schemes_monitor_progress"]
  },
  {
    id: "schemes_assign_users",
    question: "How do I assign users to a scheme?",
    description: "Open Scheme → Assign Users.",
    navigationPath: "Scheme Management → Select Scheme → Assign Users",
    keywords: ["how", "assign", "users", "scheme", "link", "technicians"],
    steps: [
      "Select the desired scheme from the Scheme Management list.",
      "Locate and click the 'Assign Users' action.",
      "Choose the field force technicians or teams to link to the scheme.",
      "Save assignments."
    ],
    buttonText: "Open Scheme Management",
    targetPath: "/teams",
    related: ["schemes_what_is", "schemes_create", "schemes_monitor_progress"]
  },
  {
    id: "schemes_monitor_progress",
    question: "How do I monitor scheme progress?",
    description: "Scheme Dashboard → Progress Reports.",
    navigationPath: "Scheme Management → Progress Reports",
    keywords: ["how", "monitor", "scheme", "progress", "track", "reports"],
    steps: [
      "Navigate to the Scheme Dashboard.",
      "Click on 'Progress Reports' or view the active completion status charts.",
      "Review target completion counts and filter by operational zones."
    ],
    buttonText: "Open Scheme Management",
    targetPath: "/teams",
    related: ["schemes_what_is", "schemes_create", "schemes_assign_users"]
  },
  // ── 10. INVENTORY ──
  {
    id: "inventory_what_is",
    question: "What is Inventory Management?",
    description: "Inventory Management tracks stock, materials, devices, and warehouse operations.",
    navigationPath: "Sidebar → Inventory",
    keywords: ["what", "is", "inventory", "management", "stock", "warehouse", "explain"],
    steps: [
      "Go to the Inventory page from the sidebar menu.",
      "Audit active warehouse storage items, quantities, and serials.",
      "Manage stock dispatch requests and low stock warnings."
    ],
    buttonText: "Open Inventory",
    targetPath: "/inventory",
    related: ["inventory_add_stock", "inventory_issue_stock", "inventory_check_low", "inventory_view_history"]
  },
  {
    id: "inventory_add_stock",
    question: "How do I add stock?",
    description: "Inventory → Add Stock.",
    navigationPath: "Inventory → Add Stock Button",
    keywords: ["how", "add", "stock", "inventory", "receive", "parts"],
    steps: [
      "Navigate to the Inventory portal.",
      "Click the 'Add Stock' button.",
      "Specify item catalog model, quantity, serial numbers, and warehouse bin.",
      "Submit the update to increase stock."
    ],
    buttonText: "Open Inventory",
    targetPath: "/inventory",
    related: ["inventory_what_is", "inventory_issue_stock", "inventory_check_low", "inventory_view_history"]
  },
  {
    id: "inventory_issue_stock",
    question: "How do I issue stock?",
    description: "Inventory → Issue Stock.",
    navigationPath: "Inventory → Issue Stock Button",
    keywords: ["how", "issue", "stock", "inventory", "dispatch", "give"],
    steps: [
      "Go to the Inventory page.",
      "Click the 'Issue Stock' action button.",
      "Select the recipient technician, quantity, and reference ticket.",
      "Confirm to record the stock movement."
    ],
    buttonText: "Open Inventory",
    targetPath: "/inventory",
    related: ["inventory_what_is", "inventory_add_stock", "inventory_check_low", "inventory_view_history"]
  },
  {
    id: "inventory_check_low",
    question: "How do I check low stock items?",
    description: "Inventory → Low Stock Report.",
    navigationPath: "Inventory → Low Stock Report Tab",
    keywords: ["how", "check", "low", "stock", "items", "report", "alerts"],
    steps: [
      "Open the Inventory page.",
      "Navigate to the 'Low Stock Report' tab or view warnings highlighted in red.",
      "Identify components falling below defined safety thresholds."
    ],
    buttonText: "Open Inventory",
    targetPath: "/inventory",
    related: ["inventory_what_is", "inventory_add_stock", "inventory_issue_stock", "inventory_view_history"]
  },
  {
    id: "inventory_view_history",
    question: "How do I view stock movement history?",
    description: "Inventory → Stock History.",
    navigationPath: "Inventory → Stock History Tab",
    keywords: ["how", "view", "stock", "movement", "history", "logs", "transfers"],
    steps: [
      "Navigate to the Inventory page.",
      "Click on the 'Stock History' or 'Audit Logs' tab.",
      "Filter by item type or user to audit all addition and dispatch entries."
    ],
    buttonText: "Open Inventory",
    targetPath: "/inventory",
    related: ["inventory_what_is", "inventory_add_stock", "inventory_issue_stock", "inventory_check_low"]
  },
  // ── 11. SETTINGS & RBAC ──
  {
    id: "rbac_what_is",
    question: "What is Settings & RBAC?",
    description: "This module controls application settings and Role-Based Access Control (RBAC).",
    navigationPath: "Sidebar → Settings & RBAC",
    keywords: ["what", "is", "settings", "rbac", "permissions", "roles"],
    steps: [
      "Go to the Settings & RBAC page from the sidebar.",
      "Modify app-wide parameters and security rules.",
      "Control user access permissions based on role definitions."
    ],
    buttonText: "Open Settings & RBAC",
    targetPath: "/rbac",
    related: ["rbac_explanation", "rbac_create_role", "rbac_assign_permissions"]
  },
  {
    id: "rbac_explanation",
    question: "What is RBAC?",
    description: "RBAC allows permissions based on user roles.",
    navigationPath: "Sidebar → Settings & RBAC",
    keywords: ["what", "is", "rbac", "meaning", "stands", "explanation"],
    steps: [
      "Open Settings & RBAC page.",
      "Note how roles (e.g., Admin, Field Technician) determine navigation access.",
      "Verify mapped system permissions per role."
    ],
    buttonText: "Open Settings & RBAC",
    targetPath: "/rbac",
    related: ["rbac_what_is", "rbac_create_role", "rbac_assign_permissions"]
  },
  {
    id: "rbac_create_role",
    question: "How do I create a role?",
    description: "Settings & RBAC → Roles → Add Role.",
    navigationPath: "Settings & RBAC → Roles Tab → Add Role",
    keywords: ["how", "create", "role", "new", "settings", "rbac"],
    steps: [
      "Navigate to the Settings & RBAC section.",
      "Select the 'Roles' tab.",
      "Click the 'Add Role' action.",
      "Input a unique role title and save."
    ],
    buttonText: "Open Settings & RBAC",
    targetPath: "/rbac",
    related: ["rbac_what_is", "rbac_explanation", "rbac_assign_permissions"]
  },
  {
    id: "rbac_assign_permissions",
    question: "How do I assign permissions?",
    description: "Roles → Select Role → Assign Permissions.",
    navigationPath: "Settings & RBAC → Roles → Assign Permissions",
    keywords: ["how", "assign", "permissions", "roles", "rules"],
    steps: [
      "Go to Settings & RBAC and navigate to the Roles list.",
      "Select the role you wish to modify.",
      "Select checkmarks on individual permissions (e.g., tickets.view, users.manage).",
      "Click save to apply the access control rules globally."
    ],
    buttonText: "Open Settings & RBAC",
    targetPath: "/rbac",
    related: ["rbac_what_is", "rbac_explanation", "rbac_create_role"]
  },
  // ── 12. ANALYTICS ──
  {
    id: "analytics_what_is",
    question: "What is Analytics?",
    description: "Analytics provides reports, charts, KPIs, trends, and performance insights.",
    navigationPath: "Sidebar → Analytics",
    keywords: ["what", "is", "analytics", "charts", "kpis", "trends"],
    steps: [
      "Go to the Analytics page from the sidebar menu.",
      "Review graphical charts showing SLA compliance and dispatch workloads.",
      "Inspect regional KPIs and technician performance averages."
    ],
    buttonText: "Open Analytics",
    targetPath: "/analytics",
    related: ["analytics_generate_reports", "analytics_view_perf", "analytics_export_reports"]
  },
  {
    id: "analytics_generate_reports",
    question: "How do I generate reports?",
    description: "Analytics → Reports → Select Filters → Generate.",
    navigationPath: "Analytics → Reports Tab → Generate",
    keywords: ["how", "generate", "reports", "analytics", "compile"],
    steps: [
      "Navigate to the Analytics dashboard.",
      "Open the 'Reports' tab.",
      "Apply date range, region, and team filters.",
      "Click the 'Generate' button to compile the report data."
    ],
    buttonText: "Open Analytics",
    targetPath: "/analytics",
    related: ["analytics_what_is", "analytics_view_perf", "analytics_export_reports"]
  },
  {
    id: "analytics_view_perf",
    question: "How do I view technician performance?",
    description: "Analytics → Performance Dashboard.",
    navigationPath: "Analytics → Performance Dashboard Tab",
    keywords: ["how", "view", "technician", "performance", "speed", "fix"],
    steps: [
      "Open the Analytics section.",
      "Navigate to the 'Performance Dashboard' or workload statistics widget.",
      "Analyze average ticket resolution time, compliance percentage, and tickets completed."
    ],
    buttonText: "Open Analytics",
    targetPath: "/analytics",
    related: ["analytics_what_is", "analytics_generate_reports", "analytics_export_reports"]
  },
  {
    id: "analytics_export_reports",
    question: "How do I export reports?",
    description: "Analytics → Export → Excel/PDF.",
    navigationPath: "Analytics → Export Buttons",
    keywords: ["how", "export", "reports", "excel", "pdf", "download"],
    steps: [
      "Go to the Analytics reports view.",
      "Locate the 'Export' buttons at the top right of your charts or tables.",
      "Choose your preferred file format (Excel or PDF).",
      "Click to download the compiled file locally."
    ],
    buttonText: "Open Analytics",
    targetPath: "/analytics",
    related: ["analytics_what_is", "analytics_generate_reports", "analytics_view_perf"]
  },
  // ── 13. TRAINING PORTAL ──
  {
    id: "training_what_is",
    question: "What is the Training Portal?",
    description: "The Training Portal provides learning materials, courses, assessments, and quizzes.",
    navigationPath: "Sidebar → Training Portal",
    keywords: ["what", "is", "training", "portal", "learning", "materials"],
    steps: [
      "Navigate to the Training Portal in the sidebar.",
      "Browse the catalog of technical guides, pdfs, and video tutorials.",
      "Take certification quizzes and review test scores."
    ],
    buttonText: "Open Training Portal",
    targetPath: "/training",
    related: ["training_enroll", "training_take_quiz", "training_check_score", "training_download_certs"]
  },
  {
    id: "training_enroll",
    question: "How do I enroll in a course?",
    description: "Training Portal → Courses → Enroll.",
    navigationPath: "Training Portal → Courses List → Enroll",
    keywords: ["how", "enroll", "course", "training", "start", "study"],
    steps: [
      "Go to the Training Portal page.",
      "Open the 'Courses' or catalog tab.",
      "Select a learning module and click the 'Enroll' action button."
    ],
    buttonText: "Open Training Portal",
    targetPath: "/training",
    related: ["training_what_is", "training_take_quiz", "training_check_score", "training_download_certs"]
  },
  {
    id: "training_take_quiz",
    question: "How do I take a quiz?",
    description: "Training Portal → Quiz → Start Quiz.",
    navigationPath: "Training Portal → Quiz Section → Start Quiz",
    keywords: ["how", "take", "quiz", "test", "start", "exam"],
    steps: [
      "Open the Training Portal.",
      "Go to the 'Quiz' section tab.",
      "Select your enrolled quiz module and click 'Start Quiz'."
    ],
    buttonText: "Open Training Portal",
    targetPath: "/training",
    related: ["training_what_is", "training_enroll", "training_check_score", "training_download_certs"]
  },
  {
    id: "training_check_score",
    question: "How do I check my score?",
    description: "Training Portal → Results.",
    navigationPath: "Training Portal → Results Page",
    keywords: ["how", "check", "score", "results", "marks", "see"],
    steps: [
      "Navigate to the Training Portal.",
      "Select the 'Results' or history tab.",
      "Review your points, scores, and completion timestamps."
    ],
    buttonText: "Open Training Portal",
    targetPath: "/training",
    related: ["training_what_is", "training_enroll", "training_take_quiz", "training_download_certs"]
  },
  {
    id: "training_download_certs",
    question: "How do I download certificates?",
    description: "Training Portal → Certificates → Download.",
    navigationPath: "Training Portal → Certificates List → Download",
    keywords: ["how", "download", "certificates", "certs", "save", "pdf"],
    steps: [
      "Go to the Training Portal.",
      "Select the 'Certificates' tab.",
      "Click the 'Download' icon on any of your completed certifications to download the PDF."
    ],
    buttonText: "Open Training Portal",
    targetPath: "/training",
    related: ["training_what_is", "training_enroll", "training_take_quiz", "training_download_certs"]
  }
];

function matchQueryToIntent(queryText) {
  if (!queryText || !queryText.trim()) return null;
  const q = queryText.toLowerCase().trim();
  const cleanQ = q.replace(/[?.!,]/g, "");
  const words = cleanQ.split(/\s+/).filter(Boolean);
  
  let bestIntent = null;
  let maxScore = 0;
  
  for (const intent of INTENTS) {
    let score = 0;
    
    const questionClean = intent.question.toLowerCase().replace(/[?.!,]/g, "");
    if (cleanQ.includes(questionClean)) {
      score += 15;
    } else if (questionClean.includes(cleanQ) && cleanQ.length > 5) {
      score += 10;
    }
    
    for (const w of words) {
      for (const kw of intent.keywords) {
        if (w === kw) {
          score += 3;
        } else if (fuzzyMatch(w, kw)) {
          score += 1.5;
        } else if (kw.includes(w) && w.length >= 3) {
          score += 1;
        }
      }
    }
    
    // Add specific bonuses for example queries from the user
    if (intent.id === "tickets_create" && (q.includes("create") || q.includes("add")) && q.includes("ticket")) {
      score += 5;
    }
    if (intent.id === "activity_view_completed" && q.includes("completed") && q.includes("activit")) {
      score += 5;
    }
    if (intent.id === "devices_assign" && q.includes("assign") && q.includes("device")) {
      score += 5;
    }
    if (intent.id === "sla_check_violations" && q.includes("sla") && q.includes("violation")) {
      score += 5;
    }
    if (intent.id === "users_create" && (q.includes("create") || q.includes("add")) && q.includes("user")) {
      score += 5;
    }
    if (intent.id === "inventory_add_stock" && (q.includes("add") || q.includes("stock") || q.includes("inventory"))) {
      score += 5;
    }
    if (intent.id === "rbac_create_role" && (q.includes("create") || q.includes("role"))) {
      score += 5;
    }
    if (intent.id === "analytics_generate_reports" && q.includes("generate") && q.includes("report")) {
      score += 5;
    }
    if (intent.id === "training_enroll" && q.includes("enroll") && q.includes("training")) {
      score += 5;
    }
    if (intent.id === "attendance_view_reports" && q.includes("attendance") && q.includes("report")) {
      score += 5;
    }
    if (intent.id === "tickets_what_is" && q.includes("pending") && q.includes("ticket")) {
      score += 5;
    }
    if (intent.id === "devices_what_is" && q.includes("device") && q.includes("management")) {
      score += 5;
    }
    if (intent.id === "users_what_is" && q.includes("user") && q.includes("management")) {
      score += 5;
    }
    if (intent.id === "inventory_what_is" && q.includes("inventory")) {
      score += 2;
    }
    if (intent.id === "dashboard_what_is" && q.includes("dashboard")) {
      score += 2;
    }
    
    if (score > maxScore) {
      maxScore = score;
      bestIntent = intent;
    }
  }
  
  return maxScore >= 3.0 ? bestIntent : null;
}

export default function UniversalSearch() {
  const { user, hasPermission } = useAuth();
  const { notifications: listNotifications } = useNotifications();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const history = localStorage.getItem("recent-searches");
    if (history) {
      try {
        setRecentSearches(JSON.parse(history));
      } catch {
        setRecentSearches([]);
      }
    }
  }, []);

  const saveSearch = useCallback((q) => {
    if (!q || !q.trim()) return;
    const trimmed = q.trim();
    setRecentSearches(prev => {
      const filtered = prev.filter(x => x.toLowerCase() !== trimmed.toLowerCase());
      const next = [trimmed, ...filtered].slice(0, 5);
      localStorage.setItem("recent-searches", JSON.stringify(next));
      return next;
    });
  }, []);

  const aiMatch = useMemo(() => {
    return matchQueryToIntent(query);
  }, [query]);

  const matchingIntents = useMemo(() => {
    if (!query.trim()) return [];
    return INTENTS.filter(item => {
      const qLower = query.toLowerCase();
      return item.question.toLowerCase().includes(qLower) ||
             item.keywords.some(kw => fuzzyMatch(qLower, kw));
    }).slice(0, 3);
  }, [query]);

 // Raw data from API (full)
 const [rawData, setRawData] = useState({
 tickets:[], devices:[], users:[], teams:[], training:[],
 notifications:[], attendanceShifts:[], attendanceHistory:[],
 });

 // RBAC-scoped data (filtered by role)
 const [scopedData, setScopedData] = useState(null);

 const [results, setResults] = useState(null);
 const [activeTicket, setActiveTicket] = useState(null);
 const [activeDevice, setActiveDevice] = useState(null);
 const [toast, setToast] = useState("");

 const inputRef = useRef(null);
 const containerRef = useRef(null);

 // ── Keyboard shortcuts ──────────────────────────────────────────────────
 useEffect(() => {
 const onKey = (e) => {
 if ((e.ctrlKey||e.metaKey) && e.key==="k") {
 e.preventDefault();
 setIsOpen(true);
 setTimeout(() => inputRef.current?.focus(), 50);
 }
 if (e.key==="Escape") { setIsOpen(false); setQuery(""); setResults(null); }
 };
 window.addEventListener("keydown", onKey);
 return () => window.removeEventListener("keydown", onKey);
 }, []);
 // ── Fetch data once on mount ─────────────────────────────────────────────
 useEffect(() => {
 (async () => {
 setLoading(true);
 try {
 const [tickets, devices, users, teams, training, notifications, attendanceShifts, attendanceHistory] = await Promise.all([
 hasPermission("tickets.view") ? api.tickets.getAll().catch(() => []) : Promise.resolve([]),
 hasPermission("devices.view") ? api.devices.getAll().catch(() => []) : Promise.resolve([]),
 hasPermission("users.view") ? api.users.getAll().catch(() => []) : Promise.resolve([]),
 hasPermission("teams.view") ? api.teams.getAll().catch(() => []) : Promise.resolve([]),
 hasPermission("training.view") ? api.training.getAll().catch(() => []) : Promise.resolve([]),
 api.notifications.getAll().catch(() => []),
 hasPermission("attendance.view") ? api.attendance.getShifts().catch(() => []) : Promise.resolve([]),
 hasPermission("attendance.view") ? api.attendance.getHistory().catch(() => []) : Promise.resolve([]),
 ]);
 const loaded = {
 tickets: Array.isArray(tickets) ? tickets : [],
 devices: Array.isArray(devices) ? devices : [],
 users: Array.isArray(users) ? users : [],
 teams: Array.isArray(teams) ? teams : [],
 training: Array.isArray(training) ? training : [],
 notifications: (Array.isArray(notifications)&&notifications.length) ? notifications : (listNotifications||[]),
 attendanceShifts: Array.isArray(attendanceShifts) ? attendanceShifts : [],
 attendanceHistory: Array.isArray(attendanceHistory) ? attendanceHistory : [],
 };
 setRawData(loaded);
 } catch(e) { console.error("Search fetch error:", e); }
 finally { setLoading(false); }
 })();
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, []);

 // ── Apply RBAC whenever raw data or user changes ─────────────────────────
 useEffect(() => {
 if (!user) { setScopedData(null); return; }
 setScopedData(applyRBAC(rawData, user));
 }, [rawData, user]);

 // ── Run NLP search when query or scoped data changes ─────────────────────
 useEffect(() => {
 if (!query.trim() || !scopedData) { setResults(null); return; }
 try { setResults(parseSearch(query, scopedData, user)); }
 catch(e) { console.error("Search parse error:", e); setResults(null); }
 }, [query, scopedData, user]);

 // ── Focus input when dropdown opens ─────────────────────────────────────
 useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 50); }, [isOpen]);

 // ── Toast ────────────────────────────────────────────────────────────────
 const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

 // ── Ticket actions ────────────────────────────────────────────────────────
 const updateTicketStatus = useCallback(async (id, status) => {
 try {
 await api.tickets.updateStatus(id, status);
 showToast(`Status updated to ${status}`);
 const t = await api.tickets.getAll();
 setRawData(p => ({...p, tickets: Array.isArray(t)?t:[]}));
 } catch { showToast("Failed to update status"); }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, []);

 const rejectTicket = useCallback(async (id, reason) => {
 try {
 await api.tickets.reject(id, reason);
 showToast("Ticket rejected");
 const t = await api.tickets.getAll();
 setRawData(p => ({...p, tickets: Array.isArray(t)?t:[]}));
 } catch { showToast("Failed to reject ticket"); }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, []);

 const hasAnyResults = results && Object.values(results.results).some(a => a.length > 0);
 const SUGGESTIONS = getSuggestions(user);
 const dropPos = containerRef.current ? containerRef.current.getBoundingClientRect() : { bottom: 80, left: 0 };

 // Role label for the access badge
 const roleLabel = isAdmin(user) ? "Full Access" :
 isManager(user) ? `${user.role} Access` :
 isOperationalManager(user) ? `Team Scope · ${user.team}` :
 isTechnician(user) ? `Personal Scope · ${user.name}` : "Restricted";
 const roleBadgeColor = isAdmin(user)
 ? "text-sky-600 bg-sky-50 border-sky-200 dark:text-sky-400 dark:bg-sky-950/60 dark:border-sky-800/60"
 : isManager(user)
 ? "text-violet-650 bg-violet-50 border-violet-200 dark:text-violet-400 dark:bg-violet-950/60 dark:border-violet-800/60"
 : isOperationalManager(user)
 ? "text-emerald-650 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/60 dark:border-emerald-800/60"
 : "text-amber-650 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/60 dark:border-amber-800/60";

 // ── RENDER ────────────────────────────────────────────────────────────────
 return (
 <>
     {/* ── Search bar (header) ── */}
  <div ref={containerRef} className="relative w-full md:flex-1 mx-2 md:mx-4 order-last md:order-none mt-3 md:mt-0" style={{zIndex:100}}>
  <div style={{ borderRadius: "9999px" }} className={`universal-search-bar relative flex items-center rounded-full border transition-all duration-305 h-12 md:h-[52px] ${isOpen ? "border-violet-500/70 shadow-lg shadow-violet-950/40 ring-1 ring-violet-500/30 bg-slate-950/85" : "border-slate-800/60 bg-slate-950/60 hover:border-violet-500/40 hover:shadow-violet-500/10 shadow-md"}`}>
   <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-violet-500 dark:text-violet-400 pointer-events-none shrink-0" />
   <input
   ref={inputRef}
   type="text"
   value={query}
   onFocus={() => setIsOpen(true)}
   onChange={(e) => {
     let val = e.target.value;
     if (/[\u0c00-\u0c7f]/.test(val)) {
       showToast("Only English input is supported");
       val = val.replace(/[\u0c00-\u0c7f]/g, "");
     }
     setQuery(val);
     if (!isOpen) setIsOpen(true);
   }}
   onKeyDown={(e) => {
   if (e.key === "Escape") { setIsOpen(false); setQuery(""); setResults(null); }
   if (e.key === "Enter") {
     e.preventDefault();
     if (query.trim()) saveSearch(query);
   }
   }}
   placeholder="Ask the AI Assistant... e.g. 'How do I create a ticket?'"
   className="w-full h-full bg-transparent pl-12 md:pl-14 pr-12 md:pr-14 text-sm md:text-base font-semibold text-white placeholder-slate-400 outline-none rounded-full"
   />
       <div className="absolute right-4 md:right-5 top-1/2 -translate-y-1/2 flex items-center gap-2 md:gap-2.5">
      {loading && <Loader2 className="h-4.5 w-4.5 text-violet-400 animate-spin" />}
      {!loading && query && (
        <button onClick={() => { setQuery(""); setResults(null); inputRef.current?.focus(); }}
        className="p-1.5 rounded-full text-slate-355 dark:text-slate-400 hover:text-slate-100 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer">
        <X className="h-4.5 w-4.5" />
        </button>
      )}
    </div>
   </div>
   </div>

{/* ── Portal: backdrop + dropdown ── */}
 {isOpen && createPortal(
 <>
 {/* Backdrop */}
 <div
 style={{ position:"fixed", inset:0, zIndex:9990 }}
 onClick={() => { setIsOpen(false); setQuery(""); setResults(null); }}
 />

     {/* Dropdown */}
  <div
  onClick={(e) => e.stopPropagation()}
  className="border border-slate-800 bg-slate-950/95 shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col "
  style={{
  position:"fixed",
  top: dropPos.bottom + 8,
  left: windowWidth < 1024 ? (windowWidth - (windowWidth < 640 ? windowWidth - 32 : Math.min(Math.max(dropPos.width, 440), windowWidth - 32))) / 2 : Math.min(dropPos.left, Math.max(16, windowWidth - Math.min(Math.max(dropPos.width, 440), windowWidth - 32) - 16)),
  width: windowWidth < 640 ? "calc(100vw - 32px)" : Math.min(Math.max(dropPos.width, 440), windowWidth - 32),
  maxWidth: "calc(100vw - 32px)",
  maxHeight: "78vh",
  zIndex: 9999,
  borderRadius: "24px",
  }}
  >
  {/* Header */}
  <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800/60 shrink-0 bg-slate-900/30">
  <Sparkles className="h-4 w-4 text-violet-400 shrink-0 animate-pulse" />
  <span className="text-xs font-bold text-violet-400 uppercase tracking-wider flex-1">
  {query ? (aiMatch ? "AI Assistant Answer" : (results ? results.title : "Searching…")) : "AI Assistant & Search"}
  </span>
  {/* RBAC scope badge */}
  <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border ${roleBadgeColor}`}>
  <ShieldAlert className="h-2.5 w-2.5" />
  {roleLabel}
  </span>
  {toast && (
  <span className="text-[10px] text-violet-450 font-semibold bg-violet-950/30 border border-violet-850/50 px-2 py-0.5 rounded-lg">{toast}</span>
  )}
  <button onClick={() => { setIsOpen(false); setQuery(""); setResults(null); }}
  className="text-slate-400 hover:text-slate-200 dark:hover:text-white shrink-0 cursor-pointer">
  <X className="h-4 w-4" />
  </button>
  </div>



  {/* Body */}
  <div className="overflow-y-auto flex-1 p-4 space-y-4 bg-transparent">

  {/* Loading */}
  {loading && (
  <div className="flex items-center justify-center py-10 gap-3 text-slate-400">
  <Loader2 className="h-5 w-5 text-violet-400 animate-spin" />
  <span className="text-sm font-semibold">Loading data…</span>
  </div>
  )}

  {/* Suggestions (no query) */}
  {!loading && !query && (
  <div className="space-y-4">
    {/* Recent Searches */}
    {recentSearches.length > 0 && (
      <div className="space-y-2 border-b border-slate-800/60 pb-3">
        <div className="flex justify-between items-center px-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-300 dark:text-slate-400 flex items-center gap-1.5">
            <History className="h-3 w-3" /> Recent Searches
          </p>
          <button
            onClick={() => { setRecentSearches([]); localStorage.removeItem("recent-searches"); }}
            className="text-[9px] font-bold text-rose-450 hover:text-rose-400 hover:underline uppercase cursor-pointer"
          >
            Clear History
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {recentSearches.map((s, i) => (
            <button
              key={i}
              onClick={() => { setQuery(s); inputRef.current?.focus(); }}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700/60 bg-slate-800/40 px-3 py-1.5 text-xs text-slate-200 dark:text-slate-300 hover:border-violet-500/40 hover:text-slate-100 dark:hover:text-white cursor-pointer transition-all"
            >
              <Clock className="h-3 w-3 text-slate-550" />
              <span>{s}</span>
            </button>
          ))}
        </div>
      </div>
    )}

    {/* Try asking suggestions */}
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-300 dark:text-slate-400 px-1">Try asking the AI Assistant…</p>
      <div className="grid gap-2 grid-cols-2">
      {SUGGESTIONS.map((s, i) => (
      <button
      key={i}
      onClick={() => { setQuery(s.query); inputRef.current?.focus(); }}
      className="flex w-full items-center justify-between rounded-xl border border-slate-700/60 bg-slate-800/40 px-3 py-2.5 text-left text-xs font-semibold text-slate-200 dark:text-slate-355 hover:border-violet-500/50 hover:bg-slate-800/80 dark:hover:bg-slate-800/50 cursor-pointer"
      >
      <span className="truncate">{s.label}</span>
      <ChevronRight className="h-3.5 w-3.5 text-slate-550 shrink-0 ml-2" />
      </button>
      ))}
      </div>
    </div>
  </div>
  )}

  {/* AI Assistant guidance card */}
  {!loading && query && aiMatch && (() => {
    const hasRequiredRole = !aiMatch.rolePermissions || aiMatch.rolePermissions.includes(user?.role);
    return (
      <div className="border border-slate-700/60 dark:border-violet-500/30 bg-slate-800/40 dark:bg-gradient-to-br dark:from-violet-950/20 dark:to-slate-900/40 rounded-2xl p-6 shadow-lg space-y-4">
        {/* Answer Details */}
        
        {/* Question */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-slate-300 dark:text-slate-400 uppercase tracking-wider">Question</p>
          <p className="text-xs font-bold text-slate-100 dark:text-white bg-slate-800/60 border border-slate-700/50 px-3.5 py-2.5 rounded-xl italic">
            "{aiMatch.question}"
          </p>
        </div>

        {/* Description */}
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-300 dark:text-slate-400 uppercase tracking-wider">About This Feature</p>
          <p className="text-xs text-slate-200 dark:text-slate-300 leading-relaxed font-semibold bg-slate-800/60 border border-slate-700/50 px-3.5 py-3 rounded-xl shadow-sm">
            {aiMatch.description}
          </p>
        </div>


        {/* Navigation Path */}
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-300 dark:text-slate-400 uppercase tracking-wider">Navigation Path</p>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-100 dark:text-slate-200 bg-slate-800/60 border border-slate-700/50 px-3.5 py-2.5 rounded-xl shadow-sm">
            <CornerDownLeft className="h-3.5 w-3.5 text-violet-500 dark:text-violet-400 rotate-180 shrink-0" />
            <span>{aiMatch.navigationPath}</span>
          </div>
        </div>

        {/* Answer Steps */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-slate-300 dark:text-slate-400 uppercase tracking-wider">Step-by-Step Instructions</p>
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-4 shadow-sm space-y-3">
            <div className="space-y-2.5 text-slate-250 text-xs font-bold">
              {aiMatch.steps.map((step, idx) => (
                <div key={idx} className="flex gap-3 items-start">
                  <span className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white border border-violet-500/20 dark:bg-violet-900/50 dark:text-violet-300 dark:border-violet-750/30 shadow-sm">
                    {idx + 1}
                  </span>
                  <span className="leading-5 pt-0.5 text-slate-100 dark:text-slate-200">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions Section */}
        <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800/60">
          <button
            onClick={() => {
              saveSearch(query);
              setIsOpen(false);
              navigate(aiMatch.targetPath);
            }}
            className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-xl text-xs shadow-md animate-glow-pulse cursor-pointer w-full sm:w-auto text-center justify-center"
          >
            <span>{aiMatch.buttonText}</span>
            <ChevronRight className="h-4 w-4 shrink-0" />
          </button>



          {aiMatch.related && aiMatch.related.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] text-slate-300 dark:text-slate-400 uppercase tracking-wider font-bold mr-1">Related:</span>
              {aiMatch.related.map(relId => {
                const relIntent = INTENTS.find(x => x.id === relId);
                if (!relIntent) return null;
                return (
                  <button
                    key={relId}
                    onClick={() => { setQuery(relIntent.question); inputRef.current?.focus(); }}
                    className="text-[10px] text-violet-650 dark:text-violet-400 hover:text-violet-850 dark:hover:text-white bg-slate-850 border border-slate-700/80 hover:border-violet-500/50 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
                  >
                    {relIntent.buttonText.replace("Open ", "").replace("Go to ", "").replace("Navigate to ", "")}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  })()}

  {/* Auto-complete suggestions list */}
  {!loading && query && !aiMatch && matchingIntents.length > 0 && (
    <div className="space-y-2 border border-slate-800/80 bg-slate-900/20 rounded-2xl p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Suggested Questions</p>
      <div className="space-y-1.5">
        {matchingIntents.map(item => (
          <button
            key={item.id}
            onClick={() => { setQuery(item.question); inputRef.current?.focus(); }}
            className="flex w-full items-center justify-between rounded-xl border border-slate-800/60 bg-slate-900/30 px-3 py-2 text-left text-xs font-semibold text-slate-350 hover:border-violet-500/50 hover:bg-slate-800/50 cursor-pointer"
          >
            <span>{item.question}</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-550" />
          </button>
        ))}
      </div>
    </div>
  )}

  {/* No results */}
  {!loading && query && !aiMatch && !hasAnyResults && (
  <div className="flex flex-col items-center py-10 gap-3 text-slate-400">
  <AlertTriangle className="h-8 w-8 opacity-45 text-violet-400" />
  <p className="text-sm font-semibold text-slate-300">No matches found</p>
  <p className="text-xs">Try asking the AI Assistant a question like "How do I create a ticket?"</p>
  </div>
  )}

{/* Results */}
 {!loading && hasAnyResults && (
 <div className="space-y-5">

 {/* TICKETS */}
 {results.results.Tickets?.length > 0 && (
 <section className="space-y-2">
 <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
 <ClipboardList className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" /> Tickets ({results.results.Tickets.length})
 </h4>
 <div className="grid gap-2 grid-cols-2">
 {results.results.Tickets.map(t => (
 <button key={t.id} onClick={() => { setIsOpen(false); setActiveTicket(t); }}
 className="flex flex-col rounded-xl border border-slate-800/60 bg-slate-900/30 p-3 text-left hover:bg-slate-800/50 hover:border-sky-500/50 gap-1.5 cursor-pointer">
 <div className="flex items-center justify-between gap-2 w-full">
 <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">{t.id}</span>
 <Badge variant={t.status === "COMPLETED" ? "success" : ["ESCALATED", "REJECTED"].includes(t.status) ? "danger" : "warning"} className="inline-flex items-center gap-1">
   {t.status === "REJECTED" && <X className="h-3 w-3 stroke-[3]" />}
   {t.status}
 </Badge>
 </div>
 <span className="text-xs font-semibold text-slate-200 dark:text-white truncate w-full">{t.customer}</span>
 <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate w-full">{t.site||t.siteName}</p>
 <div className="flex items-center justify-between border-t border-slate-800/40 pt-1.5 text-[10px] text-slate-400 w-full">
 <span>Priority: <strong className="text-slate-350">{t.priority}</strong></span>
 <span className="truncate ml-2">{t.technician||t.assignedTo||"Unassigned"}</span>
 </div>
 </button>
 ))}
 </div>
 </section>
 )}

 {/* TASKS */}
 {results.results.Tasks?.length > 0 && (
 <section className="space-y-2">
 <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
 <CheckSquare className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Field Tasks ({results.results.Tasks.length})
 </h4>
 <div className="space-y-1.5">
 {results.results.Tasks.map(t => (
 <button key={`task-${t.id}`} onClick={() => { setIsOpen(false); setActiveTicket(t); }}
 className="flex w-full items-center justify-between rounded-xl border border-slate-800/60 bg-slate-900/30 px-3 py-2.5 text-left hover:bg-slate-800/50 hover:border-emerald-500/50 cursor-pointer">
 <div className="flex items-center gap-3 min-w-0">
 <CheckSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
 <div className="min-w-0">
 <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400 mr-2">{t.id}</span>
 <span className="text-xs text-slate-200 dark:text-white">{t.customer}</span>
 <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{t.issue}</p>
 </div>
 </div>
 <Badge variant="warning">{t.status}</Badge>
 </button>
 ))}
 </div>
 </section>
 )}

 {/* DEVICES */}
 {results.results.Devices?.length > 0 && (
 <section className="space-y-2">
 <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
 <Cpu className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" /> IoT Devices ({results.results.Devices.length})
 </h4>
 <div className="grid gap-2 grid-cols-2">
 {results.results.Devices.map(d => (
 <button key={d.id} onClick={() => { setIsOpen(false); setActiveDevice(d); }}
 className="flex flex-col rounded-xl border border-slate-800/60 bg-slate-900/30 p-3 text-left hover:bg-slate-800/50 hover:border-teal-500/50 gap-1.5 cursor-pointer">
 <div className="flex items-center justify-between gap-2 w-full">
 <span className="font-mono text-xs font-bold text-teal-600 dark:text-teal-400">{d.id}</span>
 <Badge variant={d.status === "Online" ? "success" : d.status === "Damaged" ? "danger" : "warning"}>{d.status}</Badge>
 </div>
 <span className="text-xs font-semibold text-slate-200 dark:text-white truncate w-full">{d.name}</span>
 <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate w-full">{d.site||d.siteName}</p>
 <div className="flex items-center justify-between border-t border-slate-800/40 pt-1.5 text-[10px] text-slate-400 w-full">
 <span>Conn: <strong className="text-slate-350">{d.connectivity||"—"}</strong></span>
 <span>Battery: <strong className="text-slate-350">{d.battery}%</strong></span>
 </div>
 </button>
 ))}
 </div>
 </section>
 )}

 {/* INVENTORY */}
 {results.results.Inventory?.length > 0 && (
 <section className="space-y-2">
 <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
 <Package className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" /> Inventory &amp; Stock ({results.results.Inventory.length})
 </h4>
 <div className="grid gap-2 grid-cols-2">
 {results.results.Inventory.map(d => (
 <button key={`inv-${d.id}`} onClick={() => { setIsOpen(false); setActiveDevice(d); }}
 className="flex flex-col rounded-xl border border-slate-800/60 bg-slate-900/30 p-3 text-left hover:bg-slate-800/50 hover:border-indigo-500/50 gap-1.5 cursor-pointer">
 <div className="flex items-center justify-between gap-2 w-full">
 <span className="font-mono text-xs font-bold text-indigo-650 dark:text-indigo-450">{d.id}</span>
 <Badge variant="muted">WAREHOUSE</Badge>
 </div>
 <span className="text-xs font-semibold text-slate-200 dark:text-white truncate w-full">{d.name}</span>
 <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate w-full">{d.type}</p>
 </button>
 ))}
 </div>
 </section>
 )}

 {/* USERS */}
 {results.results.Users?.length > 0 && (
 <section className="space-y-2">
 <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
 <Users className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" /> Users &amp; Personnel ({results.results.Users.length})
 </h4>
 <div className="space-y-1.5">
 {results.results.Users.map(u => (
 <div key={u.id} onClick={() => { setIsOpen(false); navigate("/users"); }}
 className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-900/30 p-3 hover:bg-slate-800/50 hover:border-violet-500/50 cursor-pointer">
 <div>
 <span className="text-xs font-semibold text-slate-200 dark:text-white block">{u.name}</span>
 <span className="text-[10px] text-slate-400">{u.role} · {u.email}</span>
 </div>
 <Badge variant={["Active","On Shift"].includes(u.status) ? "success" : u.status === "Break" ? "warning" : "muted"}>{u.status}</Badge>
 </div>
 ))}
 </div>
 </section>
 )}

 {/* ATTENDANCE */}
 {results.results.Attendance?.length > 0 && (
 <section className="space-y-2">
 <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
 <CalendarClock className="h-3.5 w-3.5 text-pink-650 dark:text-pink-400" /> Attendance ({results.results.Attendance.length})
 </h4>
 <div className="space-y-2">
 {results.results.Attendance.map((att, i) => (
 <div key={`att-${i}`} onClick={() => { setIsOpen(false); navigate("/attendance"); }}
 className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-900/30 p-3 hover:bg-slate-800/50 cursor-pointer">
 <div>
 <span className="text-xs font-semibold text-slate-200 dark:text-white">{att.name}</span>
 <p className="text-[10px] text-slate-400">{att.gpsAddress||att.zone||"No Address"}</p>
 </div>
 <Badge variant={att.statusRaw==="on_shift"||att.typeRaw==="PUNCH_IN"?"success":att.statusRaw==="on_break"?"warning":"muted"}>
 {att.status||att.eventType}
 </Badge>
 </div>
 ))}
 </div>
 </section>
 )}

 {/* TEAMS */}
 {results.results.Teams?.length > 0 && (
 <section className="space-y-2">
 <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
 <Users className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" /> Teams ({results.results.Teams.length})
 </h4>
 <div className="space-y-1.5">
 {results.results.Teams.map(team => (
 <div key={team.id} onClick={() => { setIsOpen(false); navigate("/teams"); }}
 className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-900/30 p-3 hover:bg-slate-800/50 hover:border-orange-500/50 cursor-pointer">
 <div>
 <span className="text-xs font-semibold text-slate-200 dark:text-white block">{team.name}</span>
 <span className="text-[10px] text-slate-400">Lead: {team.lead} · {team.zone}</span>
 </div>
 <Badge variant="info">{team.place}</Badge>
 </div>
 ))}
 </div>
 </section>
 )}

 {/* TRAINING */}
 {results.results.Training?.length > 0 && (
 <section className="space-y-2">
 <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
 <BookOpen className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" /> LMS Training ({results.results.Training.length})
 </h4>
 <div className="space-y-1.5">
 {results.results.Training.map(m => (
 <div key={m.id} onClick={() => { setIsOpen(false); navigate("/training"); }}
 className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-900/30 p-3 hover:bg-slate-800/50 hover:border-amber-500/50 cursor-pointer">
 <div>
 <span className="text-xs font-semibold text-slate-200 dark:text-white block">{m.title}</span>
 <span className="text-[10px] text-slate-400">{m.description||"LMS training resource"}</span>
 </div>
 <Badge variant="muted">{m.contentType}</Badge>
 </div>
 ))}
 </div>
 </section>
 )}

 {/* NOTIFICATIONS */}
 {results.results.Notifications?.length > 0 && (
 <section className="space-y-2">
 <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
 <Bell className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" /> Notifications ({results.results.Notifications.length})
 </h4>
 <div className="space-y-1.5">
 {results.results.Notifications.map(n => (
 <div key={n.id} onClick={() => { setIsOpen(false); navigate("/notifications"); }}
 className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-900/30 p-3 hover:bg-slate-800/50 hover:border-rose-500/50 cursor-pointer">
 <div className="min-w-0 flex-1">
 <span className="text-xs font-semibold text-slate-200 dark:text-white block truncate">{n.title}</span>
 <span className="text-[10px] text-slate-400">{n.time||n.timeLabel}</span>
 </div>
 {n.unread && <span className="h-2 w-2 rounded-full bg-sky-500 shrink-0 ml-2" />}
 </div>
 ))}
 </div>
 </section>
 )}

 {/* REPORTS */}
 {results.results.Reports?.length > 0 && (
 <section className="space-y-2">
 <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
 <BarChart3 className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" /> Reports &amp; Analytics ({results.results.Reports.length})
 </h4>
 <div className="space-y-1.5">
 {results.results.Reports.map((r, i) => (
 <div key={i} onClick={() => { setIsOpen(false); navigate(r.path); }}
 className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-900/30 p-3 hover:bg-slate-800/50 hover:border-cyan-500/50 cursor-pointer">
 <div>
 <span className="text-xs font-semibold text-slate-200 dark:text-white block">{r.name}</span>
 <span className="text-[10px] text-slate-400">{r.desc}</span>
 </div>
 <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
 </div>
 ))}
 </div>
 </section>
 )}

 </div>
 )}
 </div>

 {/* Footer */}
 <div className="flex items-center justify-between border-t border-slate-800/60 px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 bg-slate-900/30">
 <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> Universal NLP Search v2.0</span>
 <div className="flex items-center gap-3">
 <span className="flex items-center gap-1"><CornerDownLeft className="h-3 w-3 stroke-[2.5]" /> Select</span>
 <span>ESC to Close</span>
 </div>
 </div>
 </div>
 </>,
 document.body
 )}

 {/* Modals */}
 <TicketDetailsModal
 open={Boolean(activeTicket)}
 ticket={activeTicket}
 onClose={() => setActiveTicket(null)}
 onAccept={async (id) => updateTicketStatus(id, "ACCEPTED")}
 onReject={async (id) => { const r = window.prompt("Enter rejection reason:"); if (r) rejectTicket(id, r); }}
 onSend={() => navigate("/tickets")}
 onStartTravel={async (id) => updateTicketStatus(id, "TRAVELLING")}
 onComplete={async (id) => updateTicketStatus(id, "COMPLETED")}
 />
 <DeviceDetailsModal
 open={Boolean(activeDevice)}
 device={activeDevice}
 onClose={() => setActiveDevice(null)}
 />
 </>
 );
}

