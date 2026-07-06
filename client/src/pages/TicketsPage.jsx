import { useMemo, useState, useEffect } from "react";
import {
  Check,
  CheckCircle,
  Clock,
  Filter,
  Headphones,
  MapPin,
  Phone,
  Plus,
  Search,
  Send,
  X,
  Play,
  AlertTriangle,
} from "lucide-react";
import AddTicketModal from "../components/tickets/AddTicketModal";
import RejectTicketModal from "../components/tickets/RejectTicketModal";
import EscalateTicketModal from "../components/tickets/EscalateTicketModal";
import TicketDetailsModal from "../components/tickets/TicketDetailsModal";
import ReachedModal from "../components/tickets/ReachedModal";
import ReviewModal from "../components/tickets/ReviewModal";
import CustomSelect from "../components/ui/CustomSelect";
import { useNavigate } from "react-router-dom";
import {
  dispatchPriorities,
  dispatchStatusOptions,
} from "../data/dispatchTickets";
import { api } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { getUserPlace, getZoneRegion } from "../utils/roleHelpers";
import { useDevice } from "../context/DeviceContext";

const ACTIVE_STATUSES = ["ASSIGNED", "ACCEPTED", "TRAVELLING", "REVIEW", "REVIEWED"];

const isTechSupportTicket = (ticket) =>
  ticket?.escalationType === "TECH_SUPPORT" || ticket?.escalatedToRole === "TECH_SUPPORT";

const isTechSupportVisibleStatus = (status) =>
  ["ESCALATED", "TECH_SUPPORT_IN_PROGRESS", "TECH_SUPPORT_COMPLETED", "COMPLETED"].includes(status);

const isTechSupportTicketVisibleForUser = (ticket, user) => {
  if (!isTechSupportTicket(ticket) || !isTechSupportVisibleStatus(ticket.status)) return false;
  const ownerId = String(ticket.assignedTechSupportId || "").trim();
  const isAvailable = ticket.status === "ESCALATED" && !ownerId;
  const isOwnedByUser = ownerId && (
    ownerId === String(user?.id || "") ||
    ownerId.toLowerCase() === String(user?.name || "").toLowerCase()
  );
  const isCompletedByUser = ticket.completedBy &&
    String(ticket.completedBy).toLowerCase() === String(user?.name || "").toLowerCase();
  return isAvailable || isOwnedByUser || isCompletedByUser;
};

const isCompletedTicket = (ticket) =>
  ticket?.status === "COMPLETED" ||
  ticket?.status === "TECH_SUPPORT_COMPLETED" ||
  Boolean(ticket?.completedAt);

const parseReassignedDevicesAndComponents = (ticket) => {
  if (!ticket) return { devices: [], components: [] };
  const deviceIdStr = String(ticket.deviceId || "").trim();
  const deviceNameStr = String(ticket.deviceName || "").trim();
  if (!deviceIdStr) return { devices: [], components: [] };
  
  const ids = deviceIdStr.split(",").map(id => id.trim()).filter(Boolean);
  const names = deviceNameStr.split(",").map(n => n.trim()).filter(Boolean);
  
  const parsedDevices = [];
  const parsedComponents = [];
  
  ids.forEach((id, idx) => {
    const name = names[idx] || names[0] || "Unknown";
    const nameStr = String(name);
    if (id.startsWith("COMP-")) {
      const qtyMatch = id.match(/\((\d+)\)/);
      const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
      const cleanId = id.replace(/\s*\(\d+\)/, "");
      parsedComponents.push({
        id: cleanId,
        name: nameStr.replace(/\s*\(x\d+\)/, ""),
        qty
      });
    } else {
      parsedDevices.push({
        id,
        name: nameStr
      });
    }
  });
  
  return { devices: parsedDevices, components: parsedComponents };
};

const syncInventoryForTicket = async (ticket, newStatus, newDeviceIdStr, newDeviceNameStr) => {
  if (!api.isMockMode) {
    // Rely on backend database sync when backend is online to prevent duplicate assignments/usage logs
    return;
  }
  try {
    const oldDeviceIds = ticket?.deviceId
      ? String(ticket.deviceId).split(",").map(id => id.trim()).filter(Boolean)
      : [];
    const newDeviceIds = newDeviceIdStr
      ? String(newDeviceIdStr).split(",").map(id => id.trim()).filter(Boolean)
      : [];

    const technician = ticket?.technician || null;

    // 1. If status becomes COMPLETED:
    if (newStatus === "COMPLETED") {
      // All devices on this ticket become "Online"
      for (const id of oldDeviceIds) {
        if (!id.startsWith("COMP-")) {
          try {
            const dev = await api.devices.getById(id);
            if (dev) {
              await api.devices.update(id, { ...dev, status: "Online" });
            }
          } catch (e) {
            console.error("Failed to set device status to Online:", id, e);
          }
        }
      }
    }
    // 2. If status becomes REJECTED:
    else if (newStatus === "REJECTED") {
      // Return all devices to "Available"
      for (const id of oldDeviceIds) {
        if (!id.startsWith("COMP-")) {
          try {
            await api.devices.return(id, { returnDate: new Date().toISOString().split("T")[0] });
          } catch (e) {
            console.error("Failed to return device:", id, e);
          }
        }
      }
    }
    // 3. If ticket is updated / reassigned / changed:
    else {
      // Find devices that were removed (present in old but not in new)
      const removedDeviceIds = oldDeviceIds.filter(id => !newDeviceIds.includes(id));
      for (const id of removedDeviceIds) {
        if (!id.startsWith("COMP-")) {
          try {
            await api.devices.return(id, { returnDate: new Date().toISOString().split("T")[0] });
          } catch (e) {
            console.error("Failed to return removed device:", id, e);
          }
        }
      }

      // If technician is assigned:
      if (technician) {
        const oldTech = ticket?.technician || null;
        const techChanged = oldTech !== technician;

        for (const id of newDeviceIds) {
          if (!id.startsWith("COMP-")) {
            // Assign if it's new OR if technician changed
            if (!oldDeviceIds.includes(id) || techChanged) {
              try {
                await api.devices.assign(id, {
                  assigneeType: "Technician",
                  assigneeId: technician,
                  assigneeName: technician,
                  assignedBy: "System",
                  assignmentDate: new Date().toISOString().split("T")[0],
                  returnDate: "",
                  ticketId: ticket ? ticket.id : "NEW"
                });
              } catch (e) {
                console.error("Failed to assign device:", id, e);
              }
            }
          } else {
            // Component: only use/reduce quantity if it was not already in the old list
            if (!oldDeviceIds.includes(id)) {
              try {
                const qtyMatch = id.match(/\((\d+)\)/);
                const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
                const cleanId = id.replace(/\s*\(\d+\)/, "");
                await api.components.use(cleanId, {
                  quantity: qty,
                  deviceId: ticket ? ticket.id : "NEW",
                  reason: `Assigned to ticket`,
                });
              } catch (e) {
                console.error("Failed to use component:", id, e);
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("Failed to sync inventory for ticket:", err);
  }
};

const formatTicketDateTime = (sentAtStr) => {
  if (!sentAtStr) return "—";
  try {
    const d = new Date(sentAtStr);
    if (isNaN(d.getTime())) return sentAtStr;
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return sentAtStr;
  }
};

function PriorityBadge({ priority }) {
  const styles = {
    HIGH: "bg-orange-500/90 text-white",
    CRITICAL: "bg-red-600 text-white",
    MEDIUM: "bg-amber-500/90 text-white",
    LOW: "bg-emerald-600 text-white",
  };
  return (
    <span
      className={`inline-block rounded px-2.5 py-1 text-xs font-bold uppercase ${styles[priority] || "bg-slate-600 text-white"}`}
    >
      {priority}
    </span>
  );
}

function StatusCell({ ticket, user }) {
  const config = {
    ACCEPTED: { dot: "bg-blue-400", text: "text-blue-400" },
    TRAVELLING: { dot: "bg-violet-400", text: "text-violet-400" },
    ASSIGNED: { dot: "bg-slate-400", text: "text-slate-300" },
    COMPLETED: { dot: "bg-emerald-400", text: "text-emerald-400" },
    REJECTED: { dot: "bg-red-400", text: "text-red-400" },
    UNASSIGNED: { dot: "bg-amber-400", text: "text-amber-400" },
    ESCALATED: { dot: "bg-red-500", text: "text-red-400" },
    REVIEW: { dot: "bg-amber-400", text: "text-amber-400" },
    REVIEWED: { dot: "bg-amber-500", text: "text-amber-500" },
    PENDING: { dot: "bg-amber-500", text: "text-amber-400" },
    TECH_SUPPORT_IN_PROGRESS: { dot: "bg-sky-400", text: "text-sky-400" },
    TECH_SUPPORT_COMPLETED: { dot: "bg-emerald-400", text: "text-emerald-400" },
  };

  let displayStatus = ticket.status;
  if (ticket.status === "ESCALATED" && isTechSupportTicket(ticket)) {
    displayStatus = "PENDING";
  }
  if (ticket.status === "ESCALATED" && ticket.escalationType === "WAREHOUSE") {
    const isCreator = ticket.createdBy === user?.name;
    const isSuperAdmin = user?.role === "Super Admin";
    const isParticularWarehouseManager =
      user?.role === "Warehouse Manager" &&
      getZoneRegion(user?.zone) === getZoneRegion(ticket.site);
    const isAssignedOrEscalatedBy = ticket.technician === user?.name || ticket.escalatedBy === user?.name;
      
    if (isSuperAdmin || isCreator || isParticularWarehouseManager || isAssignedOrEscalatedBy) {
      displayStatus = "PENDING";
    }
  }

  const c = config[displayStatus] || config.ASSIGNED;
  const isRejected = displayStatus === "REJECTED";
  const labelMap = {
    TECH_SUPPORT_IN_PROGRESS: "TECH SUPPORT IN PROGRESS",
    TECH_SUPPORT_COMPLETED: "TECH SUPPORT COMPLETED",
  };
  return (
    <span className={`inline-flex items-center gap-2 text-xs font-semibold uppercase ${c.text}`}>
      {isRejected ? (
        <X className="h-3 w-3 stroke-[3] text-red-400 shrink-0" />
      ) : (
        <span className={`h-2 w-2 rounded-full ${c.dot} animate-pulse`} />
      )}
      {labelMap[displayStatus] || displayStatus}
    </span>
  );
}

function SummaryPill({ label, value, variant }) {
  const variants = {
    default: "border-slate-700 bg-slate-900/80 text-slate-200",
    active: "border-sky-500/30 bg-sky-500/10 text-sky-300",
    escalated: "border-red-500/30 bg-red-500/10 text-red-300",
    unassigned: "border-orange-500/30 bg-orange-500/10 text-orange-300",
    success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium ${variants[variant] || variants.default}`}
    >
      {label}: <strong>{value}</strong>
    </span>
  );
}

export default function TicketsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshDevices } = useDevice();
  const userPlace = useMemo(() => getUserPlace(user), [user]);

  const isTechOrSupport = user?.role === "Technical Support" || user?.role === "Tech Support" || user?.role === "Field Technician" || user?.role === "Technician";
  const isAdminOrSchemeAdmin = user?.role === "Super Admin" || user?.role === "Operational Manager" || user?.role === "Warehouse Manager";

  const getTicketPlace = (t) => {
    if (!t) return "Goa";
    const siteLower = (t.site || "").toLowerCase();
    const customerLower = (t.customer || "").toLowerCase();
    const issueLower = (t.issue || "").toLowerCase();
    
    if (
      siteLower.includes("thimphu") || siteLower.includes("paro") || siteLower.includes("bhutan") ||
      customerLower.includes("thimphu") || customerLower.includes("paro") || customerLower.includes("bhutan") ||
      issueLower.includes("thimphu") || issueLower.includes("paro") || issueLower.includes("bhutan")
    ) {
      return "Bhutan";
    }
    return "Goa";
  };

  const [ticketList, setTicketList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [technicianFilter, setTechnicianFilter] = useState("all");
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [ticketModalMode, setTicketModalMode] = useState("add");
  const [rejectModal, setRejectModal] = useState({ open: false, ticketId: null, ticket: null });
  const [escalateModal, setEscalateModal] = useState({ open: false, ticketId: null, ticket: null });
  const [reachedModal, setReachedModal] = useState({ open: false, ticketId: null, ticket: null });
  const [reviewModal, setReviewModal] = useState({ open: false, ticketId: null, ticket: null });
  const [reviewedTickets, setReviewedTickets] = useState(new Set());
  const [editingTicket, setEditingTicket] = useState(null);
  const [toast, setToast] = useState(null);
  const [detailsModalTicket, setDetailsModalTicket] = useState(null);
  const [warehouseCompleteModal, setWarehouseCompleteModal] = useState({ open: false, ticket: null });
  const [techSupportModal, setTechSupportModal] = useState({ open: false, ticket: null });

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchTickets = async () => {
    try {
      const data = await api.tickets.getAll();
      setTicketList(data || []);
      refreshDevices();
    } catch (err) {
      console.error("Failed to load tickets:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await api.users.getAll();
      setUsersList(data || []);
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  };

  useEffect(() => {
    fetchTickets();
    // Only fetch users if the current user has permission to view them
    const techRoles = ["Field Technician", "Technician", "Technical Support", "Tech Support"];
    if (!techRoles.includes(user?.role)) {
      fetchUsers();
    }
  }, []);

  const technicians = useMemo(() => {
    return usersList
      .filter((u) => {
        const isTech = u.role === "Field Technician" || u.role === "Technician";
        if (!isTech) return false;
        if (u.status === "Inactive") return false;
        if (userPlace) {
          const uPlace = u.zone && (u.zone.toLowerCase().includes("goa") || ["north goa", "south goa", "central goa", "goa"].includes(u.zone.toLowerCase())) ? "Goa" : "Bhutan";
          return uPlace === userPlace;
        }
        return true;
      })
      .map((u) => u.name);
  }, [usersList, userPlace]);

  const placeTickets = useMemo(() => {
    let filtered = ticketList;
    if (user?.role === "Field Technician" || user?.role === "Technician") {
      filtered = ticketList.filter((t) => {
        if (t.status === "ESCALATED" && t.escalationType === "WAREHOUSE") {
          return t.technician === user?.name || t.escalatedBy === user?.name;
        }
        return t.technician === user?.name;
      });
    } else if (user?.role === "Tech Support") {
      filtered = ticketList.filter((t) => {
        const isTechSupportEscalated = isTechSupportTicket(t) && isTechSupportVisibleStatus(t.status);
        return isTechSupportEscalated || t.technician === user?.name;
      });
    } else if (userPlace) {
      filtered = ticketList.filter((t) => getTicketPlace(t) === userPlace);
    }

    // Filter warehouse-escalated tickets: visible only to Super Admin, Creator, Region Warehouse Manager, and Assigned/Escalated technician
    filtered = filtered.filter((t) => {
      if (t.status === "ESCALATED" && t.escalationType === "WAREHOUSE") {
        const isCreator = t.createdBy === user?.name;
        const isSuperAdmin = user?.role === "Super Admin";
        const isParticularWarehouseManager =
          user?.role === "Warehouse Manager" &&
          getZoneRegion(user?.zone) === getZoneRegion(t.site);
        const isAssignedOrEscalatedBy = t.technician === user?.name || t.escalatedBy === user?.name;
        return isSuperAdmin || isCreator || isParticularWarehouseManager || isAssignedOrEscalatedBy;
      }
      return true;
    });

    return filtered;
  }, [ticketList, userPlace, user]);

  const uniqueCustomers = useMemo(() => {
    const customers = placeTickets.map((t) => t.customer).filter(Boolean);
    return Array.from(new Set(customers)).sort();
  }, [placeTickets]);

  const uniqueTechnicians = useMemo(() => {
    const techs = placeTickets.map((t) => t.technician).filter(Boolean);
    return Array.from(new Set(techs)).sort();
  }, [placeTickets]);

  const handlePillClick = (filterVal) => {
    setStatusFilter(prev => prev === filterVal ? "all" : filterVal);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return placeTickets.filter((t) => {
      const matchSearch =
        !q ||
        t.id.toLowerCase().includes(q) ||
        t.customer.toLowerCase().includes(q) ||
        (t.technician && t.technician.toLowerCase().includes(q));
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && ACTIVE_STATUSES.includes(t.status)) ||
        t.status === statusFilter;
      const matchPriority =
        priorityFilter === "all" || t.priority === priorityFilter;
      const matchCustomer =
        customerFilter === "all" || t.customer === customerFilter;
      const matchTechnician =
        technicianFilter === "all" ||
        (technicianFilter === "unassigned" && !t.technician) ||
        t.technician === technicianFilter;
      return matchSearch && matchStatus && matchPriority && matchCustomer && matchTechnician;
    });
  }, [placeTickets, search, statusFilter, priorityFilter, customerFilter, technicianFilter]);

  const stats = useMemo(
    () => ({
      total: placeTickets.length,
      active: placeTickets.filter((t) => ACTIVE_STATUSES.includes(t.status)).length,
      escalated: placeTickets.filter((t) => t.status === "ESCALATED").length,
      unassigned: placeTickets.filter((t) => t.status === "UNASSIGNED").length,
    }),
    [placeTickets]
  );

  const statusOptions = useMemo(() => {
    return [
      { value: "all", label: "All Statuses" },
      ...dispatchStatusOptions.map(s => ({ value: s, label: s }))
    ];
  }, []);

  const priorityOptions = useMemo(() => {
    return [
      { value: "all", label: "All Priorities" },
      ...dispatchPriorities.map(p => ({ value: p, label: p }))
    ];
  }, []);

  const customerOptions = useMemo(() => {
    return [
      { value: "all", label: "All CP" },
      ...uniqueCustomers.map(c => ({ value: c, label: c }))
    ];
  }, [uniqueCustomers]);

  const technicianOptions = useMemo(() => {
    return [
      { value: "all", label: "All" },
      { value: "unassigned", label: "Unassigned" },
      ...uniqueTechnicians.map(t => ({ value: t, label: t }))
    ];
  }, [uniqueTechnicians]);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const ticket = ticketList.find(t => t.id === id);
      if (ticket) {
        await syncInventoryForTicket(ticket, newStatus, ticket.deviceId, ticket.deviceName);
      }
      await api.tickets.updateStatus(id, newStatus);
      showToast(`Status updated to ${newStatus}`);
      fetchTickets();
    } catch (err) {
      showToast("Error updating ticket status");
    }
  };

  const handleAddTicket = async ({ customer, site, technician, priority, issue, jobType, deviceId, deviceName, sentAt, reassignItemType, reassignItemId, selectedDevices = [], selectedComponents = [] }) => {
    const assigned = Boolean(technician);
    const resolvedSentAt = sentAt || (assigned ? new Date().toISOString() : null);
    const normalizedSelectedDevices = Array.isArray(selectedDevices) ? selectedDevices : [];
    const normalizedSelectedComponents = Array.isArray(selectedComponents) ? selectedComponents : [];
    const resolvedDeviceId = deviceId || [
      ...normalizedSelectedDevices.map((item) => item.id),
      ...normalizedSelectedComponents.map((item) => `COMP-${item.id} (${item.qty || 1})`),
    ].join(", ") || null;
    const resolvedDeviceName = deviceName || [
      ...normalizedSelectedDevices.map((item) => item.name || item.id),
      ...normalizedSelectedComponents.map((item) => `${item.name} (x${item.qty || 1})`),
    ].join(", ");

    if (
      editingTicket &&
      (ticketModalMode === "resend" || ticketModalMode === "send")
    ) {
      try {
        const isWarehouseEscalatedReassign = editingTicket.status === "ESCALATED" && editingTicket.escalationType === "WAREHOUSE";
        const newStatus = isWarehouseEscalatedReassign ? "PENDING" : "ASSIGNED";

        // Sync inventory automatically (handles device assignments, returns, component usages, etc.)
        await syncInventoryForTicket(
          editingTicket,
          newStatus,
          resolvedDeviceId,
          resolvedDeviceName
        );

        await api.tickets.update(editingTicket.id, {
          ...editingTicket,
          customer,
          site,
          technician,
          priority,
          issue,
          status: newStatus,
          sentAt: resolvedSentAt,
          respondedAt: null,
          rejectReason: null,
          slaTime: "03:00",
          slaOverdue: false,
          jobType: jobType || editingTicket.jobType || "service_repairs",
          deviceId: resolvedDeviceId,
          deviceName: resolvedDeviceName,
          selectedDevices: normalizedSelectedDevices,
          selectedComponents: normalizedSelectedComponents,
        });
        showToast(
          ticketModalMode === "resend"
            ? `Ticket ${editingTicket.id} resent to ${technician}`
            : `Ticket ${editingTicket.id} assigned to ${technician}`
        );
        setEditingTicket(null);
        fetchTickets();
      } catch (err) {
        showToast("Error assigning ticket");
      }
      return;
    }

    try {
      const newTicket = {
        customer,
        site,
        technician: technician || null,
        priority,
        issue: issue || "—",
        status: assigned ? "ASSIGNED" : "UNASSIGNED",
        slaTime: assigned ? "03:00" : "—",
        slaOverdue: false,
        sentAt: resolvedSentAt,
        respondedAt: null,
        rejectReason: null,
        jobType: jobType || "service_repairs",
        deviceId: resolvedDeviceId,
        deviceName: resolvedDeviceName,
        selectedDevices: normalizedSelectedDevices,
        selectedComponents: normalizedSelectedComponents,
      };
      const created = await api.tickets.create(newTicket);
      
      // Sync inventory for the newly created ticket
      await syncInventoryForTicket(created, newTicket.status, newTicket.deviceId, newTicket.deviceName);
      setTicketList((prev) => [
        created,
        ...prev.filter((ticket) => ticket.id !== created.id),
      ]);

      showToast(
        assigned
          ? `Ticket ${created.id} added and assigned to ${technician}`
          : `Ticket ${created.id} added — unassigned`
      );
      await fetchTickets();
    } catch (err) {
      showToast(err.message || "Error creating ticket");
    }
  };

  const handleAccept = async (id) => {
    try {
      await api.tickets.updateStatus(id, "TRAVELLING");
      showToast("Ticket accepted — technician is now travelling");
      fetchTickets();
    } catch (err) {
      showToast("Error accepting ticket");
    }
  };

  const handleReachedSubmit = async ({ ticketId, message, mediaFileName, mediaDataUrl, mediaType }) => {
    const ticket = reachedModal.ticket;
    const techName = ticket?.technician || user?.name || "A technician";
    const customerName = ticket?.customer || "the requester";
    try {
      await api.tickets.updateStatus(ticketId, {
        status: "REVIEW",
        message,
        mediaFileName,
        mediaDataUrl,
        mediaType
      });

      showToast(`Ticket ${ticketId} is now under Review — ${customerName} notified`);
      setReachedModal({ open: false, ticketId: null, ticket: null });
      fetchTickets();
    } catch (err) {
      showToast("Error updating ticket status");
    }
  };

  const handleReviewSubmit = async ({ ticketId, message, mediaFileName, mediaDataUrl, mediaType }) => {
    const ticket = reviewModal.ticket;
    const techName = ticket?.technician || user?.name || "A technician";
    const customerName = ticket?.customer || "the requester";
    try {
      await api.tickets.updateStatus(ticketId, {
        status: "REVIEWED",
        message,
        mediaFileName,
        mediaDataUrl,
        mediaType
      });

      // Mark this ticket as review-submitted locally so Complete button appears
      setReviewedTickets((prev) => new Set([...prev, ticketId]));
      showToast(`Review submitted for ${ticketId} — ${customerName} notified`);
      setReviewModal({ open: false, ticketId: null, ticket: null });
      fetchTickets();
    } catch (err) {
      showToast("Error submitting review");
    }
  };

  const handleComplete = async (id) => {
    try {
      const ticket = ticketList.find(t => t.id === id);
      if (ticket) {
        await syncInventoryForTicket(ticket, "COMPLETED", ticket.deviceId, ticket.deviceName);
      }
      await api.tickets.updateStatus(id, "COMPLETED");
      setReviewedTickets((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      showToast(`Ticket ${id} marked as Completed`);
      fetchTickets();
    } catch (err) {
      showToast("Error completing ticket");
    }
  };

  const handleRejectConfirm = async (reason) => {
    const id = rejectModal.ticketId;
    const ticket = rejectModal.ticket;
    try {
      if (ticket) {
        await syncInventoryForTicket(ticket, "REJECTED", ticket.deviceId, ticket.deviceName);
      }
      await api.tickets.reject(id, reason);

      const creatorName = ticket?.createdBy || ticket?.customer || "the requester";
      showToast(`Ticket rejected — notification sent to ${creatorName}`);
      setRejectModal({ open: false, ticketId: null, ticket: null });
      fetchTickets();
    } catch (err) {
      showToast("Error rejecting ticket");
    }
  };

  const handleEscalateConfirm = async (reason, escalationType) => {
    const id = escalateModal.ticketId;
    const ticket = escalateModal.ticket;
    try {
      await api.tickets.escalate(id, reason, escalationType);

      showToast(`Ticket ${id} escalated successfully`);
      setEscalateModal({ open: false, ticketId: null, ticket: null });
      fetchTickets();
    } catch (err) {
      showToast("Error escalating ticket");
    }
  };

  const openTicketModal = (mode, ticket = null) => {
    setTicketModalMode(mode);
    setEditingTicket(ticket);
    setTicketModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/60 shadow-lg shadow-slate-950/30">
        <div className="flex flex-col gap-4 border-b border-slate-800 bg-slate-950/80 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Ticket Management</h2>
          </div>
          {!isTechOrSupport && (
            <button
              type="button"
              onClick={() => openTicketModal("add")}
              className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-500"
            >
              <Plus className="h-4 w-4" />
              Add ticket
            </button>
          )}
        </div>

        <div className="border-b border-slate-800 bg-slate-950/50 px-5 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ticket ID or CP..."
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-slate-100 outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
            <CustomSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={statusOptions}
              className="px-4 py-2.5 text-sm w-full lg:w-48"
              dropdownClassName="w-48"
            />
            <CustomSelect
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              options={priorityOptions}
              className="px-4 py-2.5 text-sm w-full lg:w-48"
              dropdownClassName="w-48"
            />
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 p-2.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              title="Filters"
            >
              <Filter className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className="focus:outline-none"
              aria-label="Filter: Total"
            >
              <SummaryPill label="Total" value={stats.total} variant="default" />
            </button>

            <button
              type="button"
              onClick={() => handlePillClick("active")}
              className="focus:outline-none"
              aria-label="Filter: Active"
              style={{ display: "contents" }}
            >
              <SummaryPill
                label="Active"
                value={stats.active}
                variant={statusFilter === "active" ? "active" : "default"}
              />
            </button>

            <button
              type="button"
              onClick={() => handlePillClick("ESCALATED")}
              className="focus:outline-none"
              aria-label="Filter: Escalated"
              style={{ display: "contents" }}
            >
              <SummaryPill
                label="Escalated"
                value={stats.escalated}
                variant={statusFilter === "ESCALATED" ? "escalated" : "default"}
              />
            </button>

            <button
              type="button"
              onClick={() => handlePillClick("UNASSIGNED")}
              className="focus:outline-none"
              aria-label="Filter: Unassigned"
              style={{ display: "contents" }}
            >
              <SummaryPill
                label="Unassigned"
                value={stats.unassigned}
                variant={statusFilter === "UNASSIGNED" ? "unassigned" : "default"}
              />
            </button>

            <button
              type="button"
              onClick={() => handlePillClick("COMPLETED")}
              className="focus:outline-none"
              aria-label="Filter: Resolved"
              style={{ display: "contents" }}
            >
              <SummaryPill
                label="Resolved"
                value={placeTickets.filter((t) => t.status === "COMPLETED").length}
                variant={statusFilter === "COMPLETED" ? "success" : "default"}
              />
            </button>

          </div>
        </div>

        <div className="overflow-x-auto bg-slate-950/40">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60">
                 <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">
                   TICKET ID
                 </th>
                 <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span>CUSTOMER (CP)</span>
                      <CustomSelect
                        value={customerFilter}
                        onChange={(e) => setCustomerFilter(e.target.value)}
                        options={customerOptions}
                        className="px-2 py-1 text-[11px] font-medium"
                        dropdownClassName="w-56"
                      />
                    </div>
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span>TECHNICIAN</span>
                      <CustomSelect
                        value={technicianFilter}
                        onChange={(e) => setTechnicianFilter(e.target.value)}
                        options={technicianOptions}
                        className="px-2 py-1 text-[11px] font-medium"
                        dropdownClassName="w-48"
                      />
                    </div>
                 </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">
                   PRIORITY
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">
                   STATUS
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">
                   SLA TIME
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">
                   TICKET CREATED
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">
                   ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const isAssignedTech = t.technician === user?.name && (user?.role === "Field Technician" || user?.role === "Technician");
                return (
                  <tr
                    key={t.id}
                    className="border-b border-slate-800/60 hover:bg-slate-900/40"
                  >
                    <td className="px-5 py-4 whitespace-nowrap">
                      <button
                        type="button"
                        className="font-semibold text-sky-400 hover:text-sky-300 hover:underline"
                        title={
                          t.rejectReason
                            ? `Rejected: ${t.rejectReason}`
                            : t.site
                        }
                        onClick={() => setDetailsModalTicket(t)}
                      >
                        {t.id}
                      </button>
                    </td>
                    <td className="px-5 py-4 font-medium text-white whitespace-nowrap">
                      {t.customer}
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-200 whitespace-nowrap">
                      {t.technician || (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <StatusCell ticket={t} user={user} />
                    </td>
                    <td
                      className={`px-5 py-4 font-mono text-sm font-semibold tabular-nums whitespace-nowrap ${
                        t.slaOverdue || t.slaTime === "OVERDUE"
                           ? "text-red-400"
                           : t.status === "COMPLETED"
                             ? "text-emerald-400"
                             : "text-rose-400"
                      }`}
                    >
                      {t.slaTime}
                    </td>
                    <td className="px-5 py-4 text-slate-350 font-mono text-xs whitespace-nowrap">
                      {t.createdAt
                        ? formatTicketDateTime(t.createdAt)
                        : t.sentAt
                          ? formatTicketDateTime(
                              new Date(
                                new Date(t.sentAt).getTime() - 2 * 60 * 60 * 1000
                              ).toISOString()
                            )
                          : formatTicketDateTime(
                              new Date(
                                new Date().getTime() - 4 * 60 * 60 * 1000
                              ).toISOString()
                            )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap items-center gap-3">
                        {/* 1. Normal active workflow buttons (only if not completed) */}
                        {t.status !== "COMPLETED" && (
                          <>
                            {t.status === "UNASSIGNED" && (
                              <button
                                type="button"
                                onClick={() => openTicketModal("send", t)}
                                className="inline-flex items-center gap-1 rounded-lg bg-sky-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-sky-500"
                              >
                                <Send className="h-3.5 w-3.5" />
                                Send
                              </button>
                            )}
                            {t.status === "ASSIGNED" && isAssignedTech && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleAccept(t.id)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20"
                                  title="Accept ticket — technician starts travelling"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  Accept
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setRejectModal({ open: true, ticketId: t.id, ticket: t })
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg border border-red-500/40 bg-red-500/10 px-2.5 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/20"
                                  title="Reject ticket"
                                >
                                  <X className="h-3.5 w-3.5" />
                                  Reject
                                </button>
                              </>
                            )}
                            {t.status === "REJECTED" && (t.createdBy === user?.name || (!t.createdBy && isAdminOrSchemeAdmin)) && (
                              <button
                                type="button"
                                onClick={() => openTicketModal("resend", t)}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-600 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                              >
                                <Send className="h-3.5 w-3.5" />
                                Resend
                              </button>
                            )}
                            {t.status === "ESCALATED" && t.escalationType === "WAREHOUSE" && (
                              user?.role === "Super Admin" ||
                              t.createdBy === user?.name ||
                              (user?.role === "Warehouse Manager" && getZoneRegion(user?.zone) === getZoneRegion(t.site))
                            ) && (
                              <button
                                type="button"
                                onClick={() => openTicketModal("resend", t)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-600/40 bg-amber-600/10 px-2.5 py-1.5 text-xs font-semibold text-amber-350 hover:bg-amber-600/25"
                                title="Reassign ticket"
                              >
                                <Send className="h-3.5 w-3.5 text-amber-400" />
                                Pending/Reassign
                              </button>
                            )}
                            {t.status === "TRAVELLING" && isAssignedTech && (
                              <button
                                type="button"
                                onClick={() => setReachedModal({ open: true, ticketId: t.id, ticket: t })}
                                className="inline-flex items-center gap-1 rounded-lg border border-violet-500/40 bg-violet-500/10 px-2.5 py-1.5 text-xs font-semibold text-violet-350 hover:bg-violet-500/20"
                              >
                                <MapPin className="h-3.5 w-3.5" />
                                Reached
                              </button>
                            )}
                            {t.status === "REVIEW" && !reviewedTickets.has(t.id) && isAssignedTech && (
                              <button
                                type="button"
                                onClick={() => setReviewModal({ open: true, ticketId: t.id, ticket: t })}
                                className="inline-flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20"
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                Review
                              </button>
                            )}
                          </>
                        )}

                        {/* 2. Completion Checkbox */}
                        {(() => {
                          const isCompleted = t.status === "COMPLETED";
                          const isRejected = t.status === "REJECTED";
                          const isAssigned = t.technician === user?.name;
                          const isTechSupportUser = user?.role === "Tech Support";
                          const isSupportTicket = isTechSupportTicket(t);
                          const isSupportCompleted = isSupportTicket && isCompletedTicket(t);

                          if (isSupportCompleted || isCompleted) {
                            return (
                              <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 select-none">
                                <Check className="h-3.5 w-3.5" />
                                Completed
                              </span>
                            );
                          }

                          if (isRejected) {
                            return (
                              <span className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-400 select-none">
                                <X className="h-3.5 w-3.5" />
                                Rejected
                              </span>
                            );
                          }

                          if (t.status === "ESCALATED" && t.escalationType === "WAREHOUSE" && (user?.role === "Field Technician" || user?.role === "Technician")) {
                            return (
                              <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400 select-none">
                                <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                                Pending
                              </span>
                            );
                          }

                          if (isTechSupportUser && isSupportTicket) {
                            if (t.status === "ESCALATED") {
                              return (
                                <div className="flex flex-col items-start gap-1.5">
                                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400 select-none">
                                    <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                                    Pending
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStatus(t.id, "TECH_SUPPORT_IN_PROGRESS")}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/40 bg-sky-500/10 px-2.5 py-1.5 text-xs font-semibold text-sky-300 hover:bg-sky-500/20"
                                    title="Start resolving escalated ticket"
                                  >
                                    <Play className="h-3.5 w-3.5" />
                                    Start
                                  </button>
                                </div>
                              );
                            }
                            if (t.status === "TECH_SUPPORT_IN_PROGRESS") {
                              return (
                                <div className="flex flex-col items-start gap-1.5">
                                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-500/30 bg-slate-500/10 px-2.5 py-1 text-xs font-semibold text-slate-300 select-none">
                                    Not Completed
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStatus(t.id, "TECH_SUPPORT_COMPLETED")}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20"
                                    title="Mark escalated ticket as completed"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                    Mark as Completed
                                  </button>
                                </div>
                              );
                            }
                            if (t.status === "TECH_SUPPORT_COMPLETED") {
                              return (
                                <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 select-none">
                                  Completed by Support
                                </span>
                              );
                            }
                          }

                          if (isAssigned || (isTechSupportUser && t.technician === user?.name)) {
                            if (t.status === "TECH_SUPPORT_COMPLETED") {
                              return (
                                <button
                                  type="button"
                                  onClick={() => handleComplete(t.id)}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  Mark as Completed
                                </button>
                              );
                            }
                            
                            const isWarehousePending = t.status === "PENDING" && t.escalationType === "WAREHOUSE";
                            const showEscalate = t.status !== "ESCALATED" && t.status !== "TECH_SUPPORT_IN_PROGRESS" && t.status !== "TECH_SUPPORT_COMPLETED";
                            
                            if (
                              t.status === "REVIEWED" || 
                              (t.status === "REVIEW" && reviewedTickets.has(t.id)) ||
                              isWarehousePending
                            ) {
                              return (
                                <div className="flex items-center gap-2">
                                  {isWarehousePending ? (
                                    <button
                                      type="button"
                                      onClick={() => setWarehouseCompleteModal({ open: true, ticket: t })}
                                      className="inline-flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20"
                                    >
                                      <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                                      Pending
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleComplete(t.id)}
                                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20"
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                      Mark as Completed
                                    </button>
                                  )}
                                  {showEscalate && (
                                    <button
                                      type="button"
                                      onClick={() => setEscalateModal({ open: true, ticketId: t.id, ticket: t })}
                                      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20"
                                      title="Escalate ticket"
                                    >
                                      <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                                      Escalated
                                    </button>
                                  )}
                                </div>
                              );
                            }
                          }

                          return null;
                        })()}

                        {/* Visual Workflow Status Indicators for Super Admin / Scheme Admin / Admin (only if not completed) */}
                        {isAdminOrSchemeAdmin && t.status !== "UNASSIGNED" && t.status !== "COMPLETED" && t.status !== "REJECTED" && (
                          <>
                            {t.status === "ASSIGNED" && (
                              <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/60 px-2.5 py-1 text-xs font-semibold text-slate-300">
                                <Clock className="h-3.5 w-3.5" />
                                Assigned
                              </span>
                            )}
                            {(t.status === "ACCEPTED" || t.status === "TRAVELLING") && (
                              <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-400">
                                <Check className="h-3.5 w-3.5" />
                                Accepted
                              </span>
                            )}
                            {t.status === "REVIEW" && !reviewedTickets.has(t.id) && (
                              <span className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-xs font-semibold text-violet-400">
                                <MapPin className="h-3.5 w-3.5" />
                                Reached
                              </span>
                            )}
                            {(t.status === "REVIEWED" || (t.status === "REVIEW" && reviewedTickets.has(t.id))) && (
                              <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400">
                                <CheckCircle className="h-3.5 w-3.5" />
                                Reviewed
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="py-12 text-center text-slate-500">No tickets found.</p>
          )}
        </div>
      </div>

      <AddTicketModal
        open={ticketModalOpen}
        onClose={() => {
          setTicketModalOpen(false);
          setEditingTicket(null);
        }}
        onSubmit={handleAddTicket}
        technicians={technicians}
        ticket={editingTicket}
        mode={
          ticketModalMode === "resend"
            ? "resend"
            : ticketModalMode === "send"
              ? "send"
              : "add"
        }
      />

      <RejectTicketModal
        open={rejectModal.open}
        ticketId={rejectModal.ticketId}
        ticket={rejectModal.ticket}
        onClose={() => setRejectModal({ open: false, ticketId: null, ticket: null })}
        onConfirm={handleRejectConfirm}
      />

      <EscalateTicketModal
        open={escalateModal.open}
        ticketId={escalateModal.ticketId}
        ticket={escalateModal.ticket}
        onClose={() => setEscalateModal({ open: false, ticketId: null, ticket: null })}
        onConfirm={handleEscalateConfirm}
      />

      <ReachedModal
        open={reachedModal.open}
        ticketId={reachedModal.ticketId}
        onClose={() => setReachedModal({ open: false, ticketId: null })}
        onSubmit={handleReachedSubmit}
      />

      <ReviewModal
        open={reviewModal.open}
        ticketId={reviewModal.ticketId}
        onClose={() => setReviewModal({ open: false, ticketId: null })}
        onSubmit={handleReviewSubmit}
      />

      <TicketDetailsModal
        open={Boolean(detailsModalTicket)}
        ticket={
          detailsModalTicket
            ? ticketList.find((t) => t.id === detailsModalTicket.id) || detailsModalTicket
            : null
        }
        currentUser={user}
        onClose={() => setDetailsModalTicket(null)}
        onAccept={handleAccept}
        onReject={(id) => {
          const t = ticketList.find((tk) => tk.id === id);
          setRejectModal({ open: true, ticketId: id, ticket: t || null });
        }}
        onSend={(t) => openTicketModal(t.status === "REJECTED" || t.status === "ESCALATED" ? "resend" : "send", t)}
        onStartTravel={(id) => handleUpdateStatus(id, "TRAVELLING")}
        onComplete={(id) => handleComplete(id)}
        onEscalate={(t) => {
          setEscalateModal({ open: true, ticketId: t.id, ticket: t });
          setDetailsModalTicket(null);
        }}
        onUpdateStatus={handleUpdateStatus}
      />

      {/* Focused Completion Modal for Warehouse Reassigned Tickets */}
      {warehouseCompleteModal.open && warehouseCompleteModal.ticket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/80">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/40 px-6 py-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Warehouse Assignment Completion</h3>
              </div>
              <button
                type="button"
                onClick={() => setWarehouseCompleteModal({ open: false, ticket: null })}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              <p className="text-xs text-slate-400 leading-relaxed">
                Please review the devices and components assigned by the Warehouse Manager. Once verified, click <strong>Mark as Completed</strong> to close this ticket.
              </p>

              {/* Assigned Devices */}
              {(() => {
                const parsed = parseReassignedDevicesAndComponents(warehouseCompleteModal.ticket);
                return (
                  <div className="space-y-4">
                    {parsed.devices.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Assigned Devices</h4>
                        <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 space-y-2">
                          {parsed.devices.map((d, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs text-slate-350 first:pt-0 pt-2 border-b border-slate-800/40 last:border-b-0 pb-2 last:pb-0">
                              <span className="font-semibold text-slate-200">{d.name}</span>
                              <span className="font-mono text-sky-400 font-bold">{d.id}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {parsed.components.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Assigned Components</h4>
                        <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 space-y-2">
                          {parsed.components.map((c, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs text-slate-350 first:pt-0 pt-2 border-b border-slate-800/40 last:border-b-0 pb-2 last:pb-0">
                              <span className="font-semibold text-slate-200">{c.name}</span>
                              <span className="text-sky-400 font-mono font-bold">Qty: {c.qty}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 border-t border-slate-800 bg-slate-950/20 px-6 py-4">
              <button
                type="button"
                onClick={() => setWarehouseCompleteModal({ open: false, ticket: null })}
                className="flex-1 rounded-xl border border-slate-700 bg-slate-800/50 py-2.5 text-xs font-semibold text-slate-350 hover:bg-slate-800 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const ticketId = warehouseCompleteModal.ticket.id;
                  setWarehouseCompleteModal({ open: false, ticket: null });
                  await handleComplete(ticketId);
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/20"
              >
                <Check className="h-4 w-4" />
                Mark as Completed
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Focused Modal for Tech Support Details */}
      {techSupportModal.open && techSupportModal.ticket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/80">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/40 px-6 py-4">
              <div className="flex items-center gap-2">
                <Headphones className="h-5 w-5 text-violet-400" />
                <h3 className="text-base font-bold text-white">Tech Support Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setTechSupportModal({ open: false, ticket: null })}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 space-y-3">
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                  <div>
                    <span className="text-slate-500 block">Ticket ID</span>
                    <span className="text-violet-300 font-mono font-semibold">{techSupportModal.ticket.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Current Status</span>
                    <span className="text-slate-200 font-medium">
                      {String(techSupportModal.ticket.status || "PENDING").replace(/_/g, " ")}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Customer</span>
                    <span className="text-slate-200 font-medium">{techSupportModal.ticket.customer || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Site</span>
                    <span className="text-slate-200 font-medium">{techSupportModal.ticket.site || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Received Date</span>
                    <span className="text-slate-200 font-medium">
                      {formatTicketDateTime(
                        techSupportModal.ticket.escalationDate ||
                        techSupportModal.ticket.escalatedAt ||
                        techSupportModal.ticket.createdAt
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Completed Date</span>
                    <span className="text-slate-200 font-medium">
                      {techSupportModal.ticket.completedAt
                        ? formatTicketDateTime(techSupportModal.ticket.completedAt)
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sky-400">
                  <Phone className="h-4 w-4" />
                  <span className="font-semibold text-xs uppercase tracking-wider">Tech Support Contact Card</span>
                </div>
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                  <div>
                    <span className="text-slate-500 block">Contact Name</span>
                    <span className="text-slate-200 font-medium">Aarav Mehta</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Phone Number</span>
                    <span className="text-sky-300 font-mono font-medium">+91 98765 43100</span>
                  </div>
                  <div className="col-span-2 border-t border-slate-800/60 pt-2.5">
                    <span className="text-slate-500 block">Support Desk</span>
                    <span className="text-slate-200 font-medium">IoT & Hardware Diagnostics (24/7 Desk)</span>
                  </div>
                </div>
              </div>

              {techSupportModal.ticket.escalatedReason && (
                <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-4 space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Escalation Reason
                  </span>
                  <span className="block text-xs text-slate-350 bg-slate-900/10 p-2.5 rounded-lg border border-slate-850 font-medium">
                    {techSupportModal.ticket.escalatedReason}
                  </span>
                </div>
              )}

              <p className="text-xs text-slate-400 leading-relaxed text-center">
                After discussing the issue and implementing the solution, click <strong>Mark as Completed</strong> to close this ticket.
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 border-t border-slate-800 bg-slate-950/20 px-6 py-4">
              <button
                type="button"
                onClick={() => setTechSupportModal({ open: false, ticket: null })}
                className="flex-1 rounded-xl border border-slate-700 bg-slate-800/50 py-2.5 text-xs font-semibold text-slate-350 hover:bg-slate-800 hover:text-white"
              >
                Close
              </button>
              <button
                type="button"
                onClick={async () => {
                  const ticketId = techSupportModal.ticket.id;
                  setTechSupportModal({ open: false, ticket: null });
                  await handleUpdateStatus(ticketId, "TECH_SUPPORT_COMPLETED");
                }}
                disabled={techSupportModal.ticket.status === "TECH_SUPPORT_COMPLETED" || techSupportModal.ticket.status === "COMPLETED"}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/20"
              >
                <Check className="h-4 w-4" />
                Mark as Completed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

