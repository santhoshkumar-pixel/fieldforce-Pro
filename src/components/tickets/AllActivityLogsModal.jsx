import { useState, useEffect, useMemo } from "react";
import { X, Clock, Search, MapPin, User, ChevronRight } from "lucide-react";
import { api } from "../../utils/api";
import Badge from "../ui/Badge";

const formatDateTime = (tsStr) => {
  if (!tsStr) return "—";
  try {
    const d = new Date(tsStr);
    if (isNaN(d.getTime())) return tsStr;
    
    const day = String(d.getDate()).padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedHours = String(hours).padStart(2, "0");
    
    return `${day}-${month}-${year} ${formattedHours}:${minutes} ${ampm}`;
  } catch {
    return tsStr;
  }
};

const formatLogEvent = (log) => {
  const action = (log.action || "").toUpperCase();
  const desc = log.description || "";

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


const getStatusVariant = (status) => {
  const map = {
    ASSIGNED: "info",
    ACCEPTED: "info",
    TRAVELLING: "info",
    REVIEW: "warning", // Reached
    REVIEWED: "warning", // Reviewed
    COMPLETED: "success",
    REJECTED: "danger",
    UNASSIGNED: "muted",
    ESCALATED: "danger",
  };
  return map[status] || "default";
};

const getStatusLabel = (status) => {
  const map = {
    ASSIGNED: "Pending",
    ACCEPTED: "Pending",
    TRAVELLING: "Pending",
    REVIEW: "Reached",
    REVIEWED: "Reviewed",
    COMPLETED: "Completed",
    REJECTED: "Rejected",
    UNASSIGNED: "Unassigned",
    ESCALATED: "Escalated",
  };
  return map[status] || status;
};

export default function AllActivityLogsModal({ open, onClose }) {
  const [tickets, setTickets] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (open) {
      setLoading(true);
      Promise.all([api.tickets.getAll(), api.tickets.getAllLogs()])
        .then(([allTickets, allLogs]) => {
          setTickets(allTickets || []);
          setLogs(allLogs || []);
        })
        .catch(err => {
          console.error("Failed to load logs and tickets:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open]);

  const groupedTickets = useMemo(() => {
    return tickets.map(ticket => {
      // Find and sort logs chronologically (ascending) for this specific ticket
      const ticketLogs = logs
        .filter(log => log.ticketId === ticket.id)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      return {
        ...ticket,
        logsList: ticketLogs
      };
    }).filter(t => t.logsList.length > 0);
  }, [tickets, logs]);

  const filteredTickets = useMemo(() => {
    let result = groupedTickets;

    // Filter by Tab
    if (activeTab === "pending") {
      result = result.filter(t => ["ASSIGNED", "ACCEPTED", "TRAVELLING", "UNASSIGNED"].includes(t.status));
    } else if (activeTab === "reached") {
      result = result.filter(t => t.status === "REVIEW");
    } else if (activeTab === "reviewed") {
      result = result.filter(t => t.status === "REVIEWED");
    } else if (activeTab === "completed") {
      result = result.filter(t => t.status === "COMPLETED");
    } else if (activeTab === "rejected") {
      result = result.filter(t => t.status === "REJECTED");
    }

    // Filter by Search Query
    const q = searchQuery.toLowerCase();
    if (q) {
      result = result.filter(t => 
        t.id.toLowerCase().includes(q) ||
        (t.customer && t.customer.toLowerCase().includes(q)) ||
        (t.technician && t.technician.toLowerCase().includes(q)) ||
        (t.issue && t.issue.toLowerCase().includes(q))
      );
    }

    return result;
  }, [groupedTickets, activeTab, searchQuery]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/80 fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/40 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Clock className="h-5 w-5 text-sky-400" />
            <div>
              <h2 className="text-lg font-bold text-white">System Activity Logs</h2>
              <p className="text-xs text-slate-400">Chronological ticket lifecycle movements</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filters and Search */}
        <div className="px-6 py-4 border-b border-slate-850 space-y-4 bg-slate-950/20">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Ticket ID, CP, Technician, or Description..."
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-2 pl-10 pr-4 text-xs text-slate-100 outline-none focus:border-sky-500/50"
            />
          </div>

          {/* Filters/Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "all", label: "All Tickets" },
              { id: "pending", label: "Pending" },
              { id: "reached", label: "Reached" },
              { id: "reviewed", label: "Reviewed" },
              { id: "completed", label: "Completed" },
              { id: "rejected", label: "Rejected" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  activeTab === tab.id
                    ? "bg-sky-500/10 text-sky-400 border-sky-500/30"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-750"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content timeline */}
        <div className="px-6 py-4 overflow-y-auto flex-1 space-y-6 bg-slate-950/5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-sky-500" />
              <span className="text-xs italic">Loading lifecycle history...</span>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center text-xs text-slate-500 italic py-16">
              No tickets found matching current filters.
            </div>
          ) : (
            filteredTickets.map(ticket => (
              <div key={ticket.id} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 space-y-4">
                {/* Ticket header summary */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-850 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-sky-400">{ticket.id}</span>
                      <Badge variant={getStatusVariant(ticket.status)}>
                        {getStatusLabel(ticket.status)}
                      </Badge>
                    </div>
                    <p className="text-xs font-semibold text-slate-200 mt-1">
                      {ticket.customer} - {ticket.issue && ticket.issue !== "—" ? ticket.issue : "Device Operation"}
                    </p>
                  </div>
                  <div className="text-right text-[10px] text-slate-400 space-y-0.5">
                    <div className="flex items-center gap-1 sm:justify-end">
                      <User className="h-3 w-3 text-slate-500" />
                      <span className="font-medium">Assigned: {ticket.technician || "Unassigned"}</span>
                    </div>
                    {ticket.completedAt && (
                      <p className="text-slate-500">Completed: {formatDateTime(ticket.completedAt)}</p>
                    )}
                  </div>
                </div>

                {/* Ticket Timeline */}
                <div className="relative border-l-2 border-slate-850 pl-5 ml-2.5 space-y-5">
                  {ticket.logsList.map((log) => {
                    const eventTitle = formatLogEvent(log);
                    const isRejection = log.action === "REJECTED";
                    const isCompletion = log.action === "COMPLETED";
                    const isCreation = log.action === "CREATED";
                    const dotColor = isRejection ? "bg-red-500 ring-red-500/20" : isCompletion ? "bg-emerald-500 ring-emerald-500/20" : isCreation ? "bg-sky-500 ring-sky-500/20" : "bg-slate-500 ring-slate-700/20";
                    return (
                      <div key={log.id} className="relative text-xs">
                        {/* Timeline dot */}
                        <div className={`absolute -left-[27px] top-1 h-2 w-2 rounded-full ${dotColor} ring-4`} />

                        <div className="flex flex-col text-xs">
                          <div className="flex items-center justify-between text-slate-400 font-mono text-[10px] mb-0.5">
                            <span className="text-slate-500 font-medium">{formatDateTime(log.timestamp)}</span>
                          </div>
                          
                          <div className="text-slate-200 font-semibold text-xs">
                            {eventTitle}
                          </div>
                          
                          {isRejection && log.description.includes("\n") ? (
                            <div className="mt-1 text-[11px] text-red-400/90 pl-2.5 border-l border-red-500/20 italic whitespace-pre-line font-medium">
                              {log.description.split("\n").slice(1).join("\n").replace(/^Reason:\s*/i, "")}
                            </div>
                          ) : (
                            log.description && !log.description.toLowerCase().startsWith(eventTitle.toLowerCase()) && (
                              <div className="mt-0.5 text-[11px] text-slate-500 pl-0.5 font-medium">
                                {log.description}
                              </div>
                            )
                          )}
                          
                          {log.lat && log.lng && (
                            <div className="flex items-center gap-1 mt-1 text-[9px] text-slate-500 font-mono">
                              <MapPin className="h-2.5 w-2.5" />
                              <span>{log.lat.toFixed(4)}, {log.lng.toFixed(4)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-slate-800 bg-slate-950/50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-2.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
