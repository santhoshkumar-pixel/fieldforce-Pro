import { useState, useEffect, useMemo } from "react";
import { X, Check, CheckCircle, Send, Clock, User, AlertCircle, AlertTriangle, MapPin, ClipboardList, Phone, Headphones, Package, Play } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../utils/api";
import DeviceDetailsModal from "../devices/DeviceDetailsModal";

const parseDevicesString = (siteStr) => {
  if (!siteStr) return [];
  // Strip Counter prefix if it exists
  const cleanSite = siteStr.replace(/^Counter:\s*/i, "").trim();
  // split by comma
  return cleanSite.split(",").map(item => {
    const match = item.trim().match(/^(.+?)(?:\s*\((\d+)\))?$/);
    if (match) {
      return {
        name: match[1].trim(),
        count: match[2] ? parseInt(match[2], 10) : 1
      };
    }
    return { name: item.trim(), count: 1 };
  }).filter(d => d.name);
};

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

const getGroupedDevices = (ticket) => {
  if (!ticket) return [];
  const deviceIdStr = String(ticket.deviceId || "").trim();
  const deviceNameStr = String(ticket.deviceName || "").trim();
  if (!deviceIdStr) {
    const legacy = parseDevicesString(ticket.site);
    if (legacy.length > 0) {
      const DEVICE_NAMES = ["Ace", "Mini", "Fastscan", "Go"];
      const isDev = legacy.some(d => DEVICE_NAMES.includes(d.name));
      if (isDev) {
        return legacy.map(d => ({ ...d, ids: "—" }));
      }
    }
    if (deviceNameStr) {
      return [{
        name: deviceNameStr,
        count: 1,
        ids: "—"
      }];
    }
    return [];
  }

  const ids = deviceIdStr.split(",").map(id => id.trim()).filter(Boolean);
  const names = deviceNameStr.split(",").map(n => n.trim()).filter(Boolean);

  const groups = {};
  ids.forEach((id, idx) => {
    const name = names[idx] || names[0] || "Unknown";
    if (!groups[name]) {
      groups[name] = [];
    }
    groups[name].push(id);
  });

  return Object.entries(groups).map(([name, deviceIds]) => ({
    name,
    count: deviceIds.length,
    ids: deviceIds.join(", ")
  }));
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

function StatusBadge({ status }) {
  const config = {
    ACCEPTED: { dot: "bg-blue-400", text: "text-blue-400" },
    TRAVELLING: { dot: "bg-violet-400", text: "text-violet-400" },
    ASSIGNED: { dot: "bg-slate-400", text: "text-slate-300" },
    COMPLETED: { dot: "bg-emerald-400", text: "text-emerald-400" },
    REJECTED: { dot: "bg-red-400", text: "text-red-400" },
    UNASSIGNED: { dot: "bg-amber-400", text: "text-amber-400" },
    ESCALATED: { dot: "bg-red-500", text: "text-red-400" },
    REVIEW: { dot: "bg-violet-400", text: "text-violet-400" },
    REVIEWED: { dot: "bg-amber-450", text: "text-amber-400" },
  };
  const c = config[status] || config.ASSIGNED;
  const isRejected = status === "REJECTED";
  return (
    <span className={`inline-flex items-center gap-2 text-xs font-semibold uppercase ${c.text}`}>
      {isRejected ? (
        <X className="h-3.5 w-3.5 stroke-[3] text-red-400 shrink-0" />
      ) : (
        <span className={`h-2.5 w-2.5 rounded-full ${c.dot} `} />
      )}
      {status}
    </span>
  );
}

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

const formatLogDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${day}-${month}-${year} ${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
  } catch {
    return dateStr;
  }
};

const formatLogEvent = (log) => {
  const action = (log.action || "").toUpperCase();
  const desc = log.description || "";

  if (desc.startsWith("Mark as Completed by")) {
    return desc.split("\n")[0];
  }
  if (action === "TECH_SUPPORT_IN_PROGRESS") {
    return "Tech Support Started";
  }

  if (action === "REASSIGNED") {
    const match = desc.match(/to\s+([^by\n]+?)(?:\s+by|$)/i);
    const tech = match ? match[1].trim() : "technician";
    return `Reassigned to ${tech}`;
  }

  if (action === "ASSIGNED") {
    const match = desc.match(/Assigned to\s+([^by\n]+?)(?:\s+by|$)/i);
    const tech = match ? match[1].trim() : "technician";
    return `Assigned to ${tech}`;
  }

  if (action === "REJECTED") {
    const match = desc.match(/Rejected by\s+([^\n]+)/i);
    const tech = match ? match[1].trim() : "technician";
    return `Rejected by ${tech}`;
  }

  if (action === "REVIEW" || desc.includes("arrived on-site") || desc.includes("Reached")) {
    return "Reached Site";
  }

  if (action === "REVIEWED" || desc.includes("Reviewed")) {
    return "Reviewed";
  }

  if (action === "COMPLETED" || desc.includes("Completed")) {
    return "Completed";
  }

  if (action === "ACCEPTED" || desc.includes("accepted")) {
    return "Accepted";
  }

  if (action === "TRAVELLING" || desc.includes("travel")) {
    return "Travelling to Site";
  }

  if (action === "CREATED") {
    return "Ticket Created";
  }

  return desc.split("\n")[0] || action;
};


const getTimelineUserName = (log, ticket) => {
  if (log.performedBy) {
    if (log.action === "CREATED") return log.performedBy;
  }
  
  const action = (log.action || "").toUpperCase();
  const desc = log.description || "";
  
  if (action === "ASSIGNED") {
    const match = desc.match(/Assigned to\s+([^by\n]+?)(?:\s+by|$)/i);
    if (match) return match[1].trim();
    const match2 = desc.match(/assigned to\s+([^(\n]+?)(?:\s+\(|$)/i);
    if (match2) return match2[1].trim();
    if (ticket && ticket.technician) return ticket.technician;
  }
  
  if (action === "REASSIGNED") {
    const match = desc.match(/to\s+([^by\n]+?)(?:\s+by|$)/i);
    if (match) return match[1].trim();
    if (ticket && ticket.technician) return ticket.technician;
  }
  
  if (action === "REJECTED") {
    const match = desc.match(/Rejected by\s+([^\n]+)/i);
    if (match) return match[1].trim();
  }
  
  if (action === "REVIEWED") {
    const match = desc.match(/reviewed by\s+([^\n]+)/i);
    if (match) return match[1].trim();
    const match2 = desc.match(/by\s+([^\n]+)/i);
    if (match2) return match2[1].trim();
  }
  
  if (action === "COMPLETED") {
    const match = desc.match(/Completed by\s+([^\n]+)/i);
    if (match) return match[1].trim();
    const match2 = desc.match(/by\s+([^\n]+)/i);
    if (match2) return match2[1].trim();
  }

  if (log.performedBy) return log.performedBy;
  if (desc.includes("by ")) {
    const match = desc.match(/by\s+([^\n]+)/i);
    if (match) return match[1].trim();
  }
  if (desc.includes("Technician ")) {
    const match = desc.match(/Technician\s+([^accepted|started|arrived\n]+?)(?:\s+(?:accepted|started|arrived)|$)/i);
    if (match) return match[1].trim();
  }
  
  return ticket?.technician || log.performedBy || "System";
};

export default function TicketDetailsModal({
  open,
  ticket,
  currentUser,
  onClose,
  onAccept,
  onReject,
  onSend,
  onStartTravel,
  onComplete,
  onEscalate,
  onUpdateStatus,
}) {
  const { hasPermission } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [loadingDevice, setLoadingDevice] = useState(false);

  const handleDeviceIdClick = async (deviceId) => {
    setLoadingDevice(true);
    try {
      const dev = await api.devices.getById(deviceId);
      setSelectedDevice(dev);
    } catch (err) {
      console.error("Failed to load device details:", err);
    } finally {
      setLoadingDevice(false);
    }
  };

  const fetchLogs = () => {
    if (ticket?.id) {
      setLoadingLogs(true);
      api.tickets.getLogs(ticket.id)
        .then(data => {
          setLogs(data || []);
        })
        .catch(err => {
          console.error("Failed to fetch ticket logs:", err);
        })
        .finally(() => {
          setLoadingLogs(false);
        });
    }
  };

  useEffect(() => {
    if (open && ticket?.id) {
      fetchLogs();
    } else {
      setLogs([]);
    }
  }, [open, ticket?.id]);

  const { devices: reassignedDevs, components: reassignedComps } = useMemo(() => {
    return parseReassignedDevicesAndComponents(ticket);
  }, [ticket]);

  if (!open || !ticket) return null;

  const isTechSupportEscalated = ticket.escalationType === "TECH_SUPPORT" || ticket.escalatedToRole === "TECH_SUPPORT";
  const isTechSupportUser = currentUser?.role === "Tech Support" && ticket.status === "ESCALATED" && isTechSupportEscalated;
  const isAssignedTech = ticket.technician === currentUser?.name && (currentUser?.role === "Field Technician" || currentUser?.role === "Technician");
  const isAuthorizedToComplete = isAssignedTech || isTechSupportUser;
  const shouldShowCheckbox = (
    (isAuthorizedToComplete && (
      ticket.status === "REVIEWED" ||
      (ticket.status === "PENDING" && ticket.escalationType === "WAREHOUSE") ||
      (ticket.status === "ESCALATED" && isTechSupportEscalated)
    )) || 
    ticket.status === "COMPLETED"
  ) && ticket.status !== "REJECTED";
  const groupedDevices = getGroupedDevices(ticket);

  const handleCheckboxChange = async (e) => {
    if (!isAuthorizedToComplete) return;
    if (e.target.checked) {
      try {
        await onComplete(ticket.id);
        fetchLogs();
      } catch (err) {
        console.error("Failed to complete ticket:", err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm ">
      <div className="w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/80 fade-in zoom-in-95 ">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/40 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <ClipboardList className="h-5 w-5 text-sky-400" />
            <div>
              <h2 className="text-lg font-bold text-white">Ticket Details</h2>
              <p className="text-xs text-slate-400">ID: {ticket.id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white "
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-y-5 gap-x-4 border-b border-slate-850 pb-5">
            {/* Ticket ID */}
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Ticket ID
              </span>
              <span className="mt-1 block font-mono text-sm font-bold text-sky-400">
                {ticket.id}
              </span>
            </div>

            {/* Customer / CP */}
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                {ticket.jobType === "services" ||
                ticket.jobType === "maintainance" ||
                ticket.jobType === "deployments" ||
                ticket.jobType === "service_repairs" ||
                ticket.jobType === "schedule_maintenance" ||
                ticket.jobType === "predictive_maintenance"
                  ? "CP Name"
                  : "CP"}
              </span>
              <span className="mt-1 block text-sm font-semibold text-white">
                {ticket.customer}
              </span>
            </div>

            {/* Technician */}
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Technician
              </span>
              <span className="mt-1 block text-sm font-medium text-slate-200">
                {ticket.technician || (
                  <span className="text-slate-500 italic">Unassigned</span>
                )}
              </span>
            </div>

            {/* Priority */}
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Priority
              </span>
              <PriorityBadge priority={ticket.priority} />
            </div>

            {/* Status */}
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Status
              </span>
              <StatusBadge status={ticket.status} />
            </div>

            {/* SLA Time */}
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                SLA Time
              </span>
              <span
                className={`mt-1 block font-mono text-sm font-bold ${
                  ticket.slaOverdue || ticket.slaTime === "OVERDUE"
                    ? "text-red-400"
                    : ticket.status === "COMPLETED"
                    ? "text-emerald-400"
                    : "text-rose-400"
                }`}
              >
                {ticket.slaTime}
              </span>
            </div>

            {/* Ticket Created */}
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Ticket Created
              </span>
              <span className="mt-1 block font-mono text-xs font-medium text-slate-300">
                {ticket.createdAt
                  ? formatTicketDateTime(ticket.createdAt)
                  : ticket.sentAt
                  ? formatTicketDateTime(
                      new Date(
                        new Date(ticket.sentAt).getTime() - 2 * 60 * 60 * 1000
                      ).toISOString()
                    )
                  : formatTicketDateTime(
                      new Date(
                        new Date().getTime() - 4 * 60 * 60 * 1000
                      ).toISOString()
                    )}
              </span>
            </div>

            {/* Assign Date */}
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Assign Date
              </span>
              <span className="mt-1 block font-mono text-xs font-medium text-slate-300">
                {ticket.sentAt ? formatTicketDateTime(ticket.sentAt) : <span className="text-slate-500">—</span>}
              </span>
            </div>

            {/* Accepted Date */}
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Accepted Date
              </span>
              <span className="mt-1 block font-mono text-xs font-medium text-slate-300">
                {ticket.respondedAt &&
                ["ACCEPTED", "TRAVELLING", "COMPLETED", "REVIEW", "REVIEWED"].includes(ticket.status) ? (
                  formatTicketDateTime(ticket.respondedAt)
                ) : ticket.sentAt &&
                ["ACCEPTED", "TRAVELLING", "COMPLETED", "REVIEW", "REVIEWED"].includes(ticket.status) ? (
                  formatTicketDateTime(
                    new Date(
                      new Date(ticket.sentAt).getTime() + 15 * 60 * 1000
                    ).toISOString()
                  )
                ) : (
                  <span className="text-slate-500">—</span>
                )}
              </span>
            </div>

            {/* Completed Date */}
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Completed Date
              </span>
              <span className="mt-1 block font-mono text-xs font-medium text-slate-300">
                {ticket.completedAt && (ticket.status === "COMPLETED" || ticket.status === "TECH_SUPPORT_COMPLETED") ? (
                  formatTicketDateTime(ticket.completedAt)
                ) : ticket.status === "COMPLETED" ? (
                  formatTicketDateTime(
                    new Date(
                      new Date().getTime() - 30 * 60 * 1000
                    ).toISOString()
                  )
                ) : (
                  <span className="text-slate-500">—</span>
                )}
              </span>
            </div>

            {/* Completed By */}
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Completed By
              </span>
              <span className="mt-1 block text-xs font-medium text-slate-300">
                {ticket.completedBy || ticket.completedByUserId || (
                  <span className="text-slate-500">—</span>
                )}
              </span>
            </div>
          </div>

          {/* More details (Site, Devices & Issue) if available */}
          <div className="space-y-4">
            {!(groupedDevices.length > 0) && ticket.site && ticket.site !== "—" && (
              <div>
                <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  Site / Location
                </span>
                <span className="mt-1 block text-sm text-slate-350 bg-slate-950/30 rounded-xl px-3 py-2 border border-slate-800">
                  {ticket.site}
                </span>
              </div>
            )}

            {/* Devices Section in Table Format */}
            {reassignedDevs.length > 0 || reassignedComps.length > 0 ? (
              <div className="space-y-4">
                {reassignedDevs.length > 0 && (
                  <div>
                    <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                      <ClipboardList className="h-3.5 w-3.5 text-slate-400" />
                      Selected Devices
                    </span>
                    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/30 divide-y divide-slate-800/40 p-3 space-y-2">
                      {reassignedDevs.map((d, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs text-slate-350 first:pt-0 pt-2 bg-slate-900/10 hover:bg-slate-900/20">
                          <span className="font-semibold text-slate-200">{d.name}</span>
                          <button
                            type="button"
                            onClick={() => handleDeviceIdClick(d.id)}
                            className="font-mono text-sky-400 hover:text-sky-300 hover:underline cursor-pointer font-bold"
                          >
                            {d.id}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {reassignedComps.length > 0 && (
                  <div>
                    <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                      <Package className="h-3.5 w-3.5 text-slate-400" />
                      Selected Components
                    </span>
                    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/30 divide-y divide-slate-800/40 p-3 space-y-2">
                      {reassignedComps.map((c, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs text-slate-350 first:pt-0 pt-2">
                          <span className="font-semibold text-slate-200">{c.name}</span>
                          <span className="text-sky-400 font-mono font-bold">Qty: {c.qty}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              groupedDevices.length > 0 && (
                <div>
                  <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    <ClipboardList className="h-3.5 w-3.5 text-slate-400" />
                    Devices
                  </span>
                  <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/30">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/40">
                          <th className="px-4 py-2 font-semibold text-slate-400">Device Name</th>
                          <th className="px-4 py-2 font-semibold text-slate-400 text-center">
                            {ticket.jobType === "deployments" ? "Number of Devices" : "Quantity"}
                          </th>
                          {ticket.jobType !== "deployments" && (
                            <th className="px-4 py-2 font-semibold text-slate-400 text-right">Device ID(s)</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {groupedDevices.map((d, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/20">
                            <td className="px-4 py-2.5 font-medium text-slate-200">{d.name}</td>
                            <td className="px-4 py-2.5 text-center font-mono text-slate-300 font-semibold">{d.count}</td>
                            {ticket.jobType !== "deployments" && (
                              <td className="px-4 py-2.5 text-right font-mono text-slate-300 font-semibold">
                                {d.ids ? d.ids.split(",").map((id, index, array) => {
                                  const cleanId = id.trim();
                                  return (
                                    <span key={cleanId}>
                                      <button
                                        type="button"
                                        onClick={() => handleDeviceIdClick(cleanId)}
                                        className="text-sky-400 hover:text-sky-300 hover:underline cursor-pointer font-bold inline-block"
                                      >
                                        {cleanId}
                                      </button>
                                      {index < array.length - 1 && <span className="text-slate-400">, </span>}
                                    </span>
                                  );
                                }) : "—"}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            )}

            {ticket.issue && (
              <div>
                <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <AlertCircle className="h-3.5 w-3.5 text-slate-400" />
                  Description / Reason for adding
                </span>
                <span className="mt-1 block text-sm text-slate-350 bg-slate-950/30 rounded-xl px-3 py-2 border border-slate-800 whitespace-pre-line">
                  {ticket.issue}
                </span>
              </div>
            )}

            {ticket.rejectReason && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-3.5 py-3">
                <span className="block text-xs font-semibold uppercase tracking-wider text-red-400">
                  Rejection Reason
                </span>
                <span className="mt-1 block text-sm text-red-300 font-medium">
                  {ticket.rejectReason}
                </span>
              </div>
            )}

            {ticket.status === "ESCALATED" && ticket.escalatedReason && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3.5 py-3 space-y-1">
                <span className="block text-xs font-semibold uppercase tracking-wider text-amber-400">
                  Escalation Reason
                </span>
                <span className="mt-1 block text-sm text-amber-300 font-medium">
                  {ticket.escalatedReason}
                </span>
                <div className="flex justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-850">
                  <span>Escalated by: {ticket.escalatedBy || "Technician"}</span>
                  {ticket.escalatedAt && (
                    <span>{new Date(ticket.escalatedAt).toLocaleString()}</span>
                  )}
                </div>
              </div>
            )}

            {ticket.status === "ESCALATED" && isTechSupportEscalated && (
              <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sky-400">
                  <Phone className="h-4 w-4" />
                  <span className="font-semibold text-xs uppercase tracking-wider">Tech Support Details</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 block">Contact Name</span>
                    <span className="text-slate-200 font-medium">Aarav Mehta</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Phone Number</span>
                    <span className="text-sky-300 font-mono font-medium">+91 98765 43100</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 block">Support Desk</span>
                    <span className="text-slate-200 font-medium">IoT & Hardware Diagnostics (24/7 Desk)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Completed Checkbox */}
            {shouldShowCheckbox && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/20 p-4">
                <div className="flex items-center gap-3">
                  {isAuthorizedToComplete ? (
                    <label className="flex items-center gap-3 cursor-pointer text-slate-200 w-full">
                      <input
                        type="checkbox"
                        className="h-5 w-5 rounded border-slate-850 bg-slate-900 text-sky-500 focus:ring-sky-550 focus:ring-offset-slate-900 focus:ring-2 disabled:opacity-50"
                        id="ticket-completed-checkbox"
                        checked={ticket.status === "COMPLETED"}
                        disabled={ticket.status === "COMPLETED"}
                        onChange={handleCheckboxChange}
                      />
                      <span className="text-sm font-semibold select-none">
                        {ticket.status === "COMPLETED" ? "Completed" : "Mark as Completed"}
                      </span>
                    </label>
                  ) : (
                    <div className="flex items-center gap-3 text-slate-400 w-full opacity-60">
                      <input
                        type="checkbox"
                        className="h-5 w-5 rounded border-slate-850 bg-slate-900 text-sky-500 cursor-not-allowed"
                        id="ticket-completed-checkbox-view"
                        checked={ticket.status === "COMPLETED"}
                        disabled
                      />
                      <span className="text-sm font-semibold select-none">
                        {ticket.status === "COMPLETED" ? "Completed" : "In Progress"} (View-Only)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Rejected Indicator */}
            {ticket.status === "REJECTED" && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                <div className="flex items-center gap-3 text-red-400 font-semibold select-none">
                  <X className="h-5 w-5 text-red-500 shrink-0" />
                  <span className="text-sm">Rejected (Cannot be completed)</span>
                </div>
              </div>
            )}

            {/* Ticket Activity Logs */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/15 p-4">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                Ticket Logs & Activity History
              </span>
              {loadingLogs ? (
                <div className="text-xs text-slate-500 italic py-2">Loading ticket history...</div>
              ) : logs.length === 0 ? (
                <div className="text-xs text-slate-500 italic py-2 font-mono">No activity logs recorded yet.</div>
              ) : (
                <div className="relative border-l-2 border-slate-800/85 pl-5 ml-2.5 space-y-5 max-h-[240px] overflow-y-auto pr-1">
                  {logs.map((log) => {
                    const eventTitle = formatLogEvent(log);
                    const isRejection = log.action === "REJECTED";
                    const isCompletion = log.action === "COMPLETED";
                    const isCreation = log.action === "CREATED";
                    const dotColor = isRejection ? "bg-red-500 ring-red-500/20" : isCompletion ? "bg-emerald-500 ring-emerald-500/20" : isCreation ? "bg-sky-500 ring-sky-500/20" : "bg-slate-505 ring-slate-700/20";
                    return (
                      <div key={log.id} className="relative text-xs">
                        {/* Dot on timeline */}
                        <div className={`absolute -left-[27px] top-1 h-2 w-2 rounded-full ${dotColor} ring-4`} />

                        <div className="flex flex-col text-xs space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold text-slate-400">
                              {formatLogDate(log.timestamp)}
                            </span>
                            <span className="text-slate-600 font-bold">•</span>
                            <span className="font-semibold text-slate-200">
                              {eventTitle}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 font-medium">
                            <span className="flex items-center gap-1">
                              <span className="text-slate-500">User:</span>
                              <span className="font-bold text-slate-300">{getTimelineUserName(log, ticket)}</span>
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className="flex items-center gap-1">
                              <span className="text-slate-500">Ref:</span>
                              <span className="font-mono text-slate-300">{log.ticketId || ticket.id}</span>
                            </span>
                          </div>
                          {isRejection && log.description.includes("\n") ? (
                            <p className="mt-0.5 text-[11px] text-red-400/90 pl-2.5 border-l-2 border-red-500/20 italic whitespace-pre-line">
                              {log.description.split("\n").slice(1).join("\n").replace(/^Reason:\s*/i, "")}
                            </p>
                          ) : (
                            log.description && !log.description.toLowerCase().startsWith(eventTitle.toLowerCase()) && (
                              <p className="mt-0.5 text-[11px] text-slate-500 pl-0.5">
                                {log.description}
                              </p>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer with Actions */}
        <div className="flex flex-col border-t border-slate-800 bg-slate-950/50 px-6 py-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Actions
          </span>
          <div className="flex flex-wrap items-center gap-3">
            {ticket.status === "UNASSIGNED" && hasPermission("tickets.assign") && (
              <button
                type="button"
                onClick={() => {
                  onSend(ticket);
                  onClose();
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 shadow-lg shadow-sky-600/20"
              >
                <Send className="h-4 w-4" />
                Assign Technician
              </button>
            )}

            {ticket.status === "ASSIGNED" && isAssignedTech && hasPermission("tickets.update") && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onAccept(ticket.id);
                    onClose();
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/20"
                >
                  <Check className="h-4 w-4" />
                  Accept Job
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onReject(ticket.id);
                    onClose();
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-500 shadow-lg shadow-rose-600/20"
                >
                  <X className="h-4 w-4" />
                  Reject Job
                </button>
              </>
            )}

            {ticket.status === "ACCEPTED" && isAssignedTech && hasPermission("tickets.update") && (
              <button
                type="button"
                onClick={() => {
                  onStartTravel(ticket.id);
                  onClose();
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 shadow-lg shadow-violet-600/20"
              >
                <Clock className="h-4 w-4" />
                Start Travel
              </button>
            )}
            {ticket.status === "TRAVELLING" && isAssignedTech && hasPermission("tickets.update") && (
              <span className="text-sm text-slate-400 italic py-1">
                Please complete travel updates from the ticket list actions.
              </span>
            )}

            {ticket.status === "ESCALATED" && isTechSupportEscalated && currentUser?.role === "Tech Support" && (
              <button
                type="button"
                onClick={async () => {
                  if (onUpdateStatus) {
                    await onUpdateStatus(ticket.id, "TECH_SUPPORT_IN_PROGRESS");
                    fetchLogs();
                  }
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 shadow-lg shadow-sky-600/20"
              >
                <Play className="h-4 w-4" />
                Start
              </button>
            )}

            {ticket.status === "TECH_SUPPORT_IN_PROGRESS" && currentUser?.role === "Tech Support" && (
              <button
                type="button"
                onClick={async () => {
                  if (onUpdateStatus) {
                    await onUpdateStatus(ticket.id, "TECH_SUPPORT_COMPLETED");
                    fetchLogs();
                  }
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/20"
              >
                <Check className="h-4 w-4" />
                Mark as Completed
              </button>
            )}

            {(ticket.status === "REVIEWED" || ticket.status === "TECH_SUPPORT_COMPLETED") && isAssignedTech && hasPermission("tickets.update") && (
              <>
                <button
                  type="button"
                  onClick={async () => {
                    await onComplete(ticket.id);
                    fetchLogs();
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/20"
                >
                  <Check className="h-4 w-4" />
                  Complete Ticket
                </button>
                {ticket.status === "REVIEWED" && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onEscalate) {
                        onEscalate(ticket);
                      }
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-500 shadow-lg shadow-amber-600/20"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Escalate Ticket
                  </button>
                )}
              </>
            )}

            {ticket.status === "ESCALATED" && (currentUser?.role === "Super Admin" || currentUser?.role === "Warehouse Manager") && (hasPermission("tickets.assign") || hasPermission("tickets.update")) && (
              <button
                type="button"
                onClick={() => {
                  onSend(ticket);
                  onClose();
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 shadow-lg shadow-sky-600/20"
              >
                <Send className="h-4 w-4" />
                Resend / Reassign Ticket
              </button>
            )}

            {["COMPLETED", "REJECTED"].includes(ticket.status) && (
              <span className="text-sm text-slate-400 italic py-1">
                No active actions available for this ticket state.
              </span>
            )}

            {ticket.status === "ESCALATED" && !(currentUser?.role === "Super Admin" || currentUser?.role === "Warehouse Manager" || currentUser?.role === "Tech Support") && (
              <span className="text-sm text-slate-400 italic py-1">
                Ticket escalated. Awaiting reassignment by Warehouse Manager / Super Admin.
              </span>
            )}

            {(ticket.status === "TECH_SUPPORT_IN_PROGRESS" || ticket.status === "TECH_SUPPORT_COMPLETED") && currentUser?.role !== "Tech Support" && !isAssignedTech && (
              <span className="text-sm text-slate-400 italic py-1">
                Ticket is being handled by Tech Support.
              </span>
            )}

            <button
              type="button"
              onClick={onClose}
              className="ml-auto px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>
        </div>
      </div>
      {selectedDevice && (
        <DeviceDetailsModal
          open={Boolean(selectedDevice)}
          device={selectedDevice}
          onClose={() => setSelectedDevice(null)}
        />
      )}
    </div>
  );
}
