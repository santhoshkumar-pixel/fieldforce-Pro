import {
  deviceInventory,
  slaTickets,
  technicianWorkload,
  tickets,
} from "./mockData";
import { initialDispatchTickets } from "./dispatchTickets";

export const KPI_IDS = {
  OPEN_TICKETS: "open-tickets",
  ASSIGNED_TODAY: "assigned-today",
  COMPLETED_TODAY: "completed-today",
  SLA_BREACHES: "sla-breaches",
  ESCALATED: "escalated",
  ACTIVE_TECHNICIANS: "active-technicians",
  AVG_RESOLUTION: "avg-resolution",
  UPCOMING_JOBS: "upcoming-jobs",
};

const openStatuses = [
  "Assigned",
  "Acknowledged",
  "Travelling",
  "On Site",
  "Diagnosing",
  "Repair In Progress",
  "Waiting for Spare",
  "Escalated",
  "Verification Pending",
];

function ticketRows(list) {
  return list.map((t) => ({
    id: t.id,
    col2: t.siteName,
    col3: t.assignedTo,
    col4: t.severity,
    col5: t.status,
    extra: t.slaRemaining,
  }));
}

function dispatchRows(list) {
  return list.map((t) => ({
    id: t.id,
    col2: t.customer,
    col3: t.technician || "—",
    col4: t.priority,
    col5: t.status,
    extra: t.slaTime,
  }));
}

function deviceRows(list) {
  return list.map((d) => ({
    id: d.id,
    col2: d.name,
    col3: d.site,
    col4: d.type,
    col5: d.status,
    extra: d.lastSync,
  }));
}

function techRows(list) {
  return list.map((t) => ({
    id: t.name,
    col2: t.zone,
    col3: String(t.assigned),
    col4: String(t.completed),
    col5: t.status,
    extra: "—",
  }));
}

/** Dashboard KPI drill-down content */
export function getDashboardKpiDetail(kpiId) {
  const open = tickets.filter((t) => openStatuses.includes(t.status));
  const assignedToday = [
    ...tickets.filter((t) => t.status === "Assigned"),
    ...initialDispatchTickets.filter((t) =>
      ["ASSIGNED", "ACCEPTED", "TRAVELLING"].includes(t.status)
    ),
  ];
  const completedToday = [
    ...tickets.filter((t) => ["Resolved", "Closed", "Verification Pending"].includes(t.status)),
    ...initialDispatchTickets.filter((t) => t.status === "COMPLETED"),
  ];
  const breaches = tickets.filter((t) => t.slaHealth === "critical");
  const escalated = tickets.filter((t) => t.status === "Escalated");

  const configs = {
    [KPI_IDS.OPEN_TICKETS]: {
      title: "Open Tickets",
      description: `${open.length} shown · 138 total open across all zones`,
      columns: ["Ticket", "Site", "Technician", "Severity", "Status", "SLA"],
      rows: ticketRows(open),
      link: "/tickets",
    },
    [KPI_IDS.ASSIGNED_TODAY]: {
      title: "Assigned Today",
      description: "Tickets assigned to field technicians today",
      columns: ["Ticket", "Site / Customer", "Technician", "Priority", "Status", "SLA"],
      rows: [
        ...ticketRows(tickets.filter((t) => t.status === "Assigned")),
        ...dispatchRows(
          initialDispatchTickets.filter((t) =>
            ["ASSIGNED", "ACCEPTED", "TRAVELLING"].includes(t.status)
          )
        ),
      ],
      link: "/tickets",
    },
    [KPI_IDS.COMPLETED_TODAY]: {
      title: "Completed Today",
      description: "Tickets resolved or closed today",
      columns: ["Ticket", "Site / Customer", "Technician", "Priority", "Status", "SLA"],
      rows: [
        ...ticketRows(
          tickets.filter((t) =>
            ["Resolved", "Closed", "Verification Pending"].includes(t.status)
          )
        ),
        ...dispatchRows(
          initialDispatchTickets.filter((t) => t.status === "COMPLETED")
        ),
      ],
      link: "/tickets",
    },
    [KPI_IDS.SLA_BREACHES]: {
      title: "SLA Breaches",
      description: "Tickets that breached SLA window today",
      columns: ["Ticket", "Site", "Technician", "Severity", "Status", "SLA Left"],
      rows: ticketRows(breaches),
      link: "/sla",
    },
    [KPI_IDS.ESCALATED]: {
      title: "Escalated Tickets",
      description: "Issues escalated for admin action",
      columns: ["Ticket", "Site", "Technician", "Severity", "Status", "SLA"],
      rows: [
        ...ticketRows(escalated),
        ...dispatchRows(
          initialDispatchTickets.filter((t) => t.status === "ESCALATED")
        ),
      ],
      link: "/tickets",
    },
    [KPI_IDS.ACTIVE_TECHNICIANS]: {
      title: "Active Technicians",
      description: "Technicians currently on shift or handling tickets",
      columns: ["Name", "Zone", "Assigned", "Completed", "Status", ""],
      rows: techRows(technicianWorkload),
      link: "/attendance",
    },
     [KPI_IDS.AVG_RESOLUTION]: {
      title: "Avg Resolution Time",
      description: "Recent ticket resolution performance (3h 14m team average)",
      columns: ["Ticket", "Site", "Technician", "Severity", "Status", "Est. time"],
      rows: ticketRows(tickets).map((r) => ({
        ...r,
        extra: ["2h 40m", "3h 05m", "3h 22m", "3h 48m", "4h 10m", "2h 55m"][
          ticketRows(tickets).indexOf(r) % 6
        ],
      })),
      link: "/analytics",
    },
    [KPI_IDS.UPCOMING_JOBS]: {
      title: "Upcoming Jobs",
      description: "Unassigned or scheduled jobs awaiting dispatch",
      columns: ["Job ID", "Customer / CP", "Technician", "Priority", "Status", "SLA Left"],
      rows: dispatchRows(
        initialDispatchTickets.filter((t) => t.status === "UNASSIGNED")
      ),
      link: "/tickets",
    },
  };

  return configs[kpiId] || null;
}

/** Device health stat drill-down */
export function getDeviceHealthDetail(label, devices = deviceInventory) {
  if (label === "Total") {
    return {
      title: "Total Devices",
      description: `${devices.length} total devices in inventory`,
      columns: ["Device ID", "Name", "Site", "Type", "Status", "Last sync"],
      rows: deviceRows(devices),
      link: "/devices",
    };
  }
  if (label === "Deployed") {
    const deployed = devices.filter((d) => d.site && d.site.trim() !== "");
    return {
      title: "Deployed Devices",
      description: `${deployed.length} devices deployed at customer sites`,
      columns: ["Device ID", "Name", "Site", "Type", "Status", "Last sync"],
      rows: deviceRows(deployed),
      link: "/devices",
    };
  }

  const statusMap = {
    Online: "Online",
    Offline: "Offline",
    Warning: "Warning",
    Critical: "Critical",
    Maintenance: "Maintenance Required",
  };
  const status = statusMap[label] || label;
  const filtered = devices.filter((d) => d.status === status);

  return {
    title: `${label} Devices`,
    description: `${filtered.length} devices in inventory · ${deviceInventory.filter((d) => d.status === status).length} listed below`,
    columns: ["Device ID", "Name", "Site", "Type", "Status", "Last sync"],
    rows: deviceRows(filtered),
    link: "/devices",
  };
}

/** SLA monitor stat drill-down */
export function getSlaHealthDetail(type) {
  const healthy = tickets.filter((t) => t.slaHealth === "healthy");
  const warning = slaTickets.filter((t) => t.slaHealth === "warning");
  const critical = slaTickets.filter((t) => t.slaHealth === "critical");

  const configs = {
    healthy: {
      title: "Healthy SLA",
      description: "124 tickets within SLA window",
      columns: ["Ticket", "Site", "Technician", "Severity", "Status", "SLA Left"],
      rows: ticketRows(healthy),
      link: "/sla",
    },
    warning: {
      title: "SLA Warning",
      description: "Tickets approaching SLA breach",
      columns: ["Ticket", "Site", "Technician", "Severity", "Risk", "SLA Left"],
      rows: ticketRows(warning).map((r) => ({ ...r, col5: "At Risk" })),
      link: "/sla",
    },
    critical: {
      title: "Critical / Breached SLA",
      description: "7 breaches today · immediate attention required",
      columns: ["Ticket", "Site", "Technician", "Severity", "Risk", "SLA Left"],
      rows: ticketRows(critical).map((r) => ({
        ...r,
        col5: "Breach Imminent",
      })),
      link: "/sla",
    },
  };

  return configs[type] || null;
}
