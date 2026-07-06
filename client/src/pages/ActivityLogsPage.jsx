import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Clock,
  Search,
  MapPin,
  User,
  Ticket,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  UserX,
  Hash,
  Calendar,
  AlertTriangle,
  X,
} from "lucide-react";
import { api } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { getUserPlace } from "../utils/roleHelpers";
import Badge from "../components/ui/Badge";
import PageHeader from "../components/PageHeader";
import { Card, CardBody } from "../components/ui/Card";

/* ─── helpers ─────────────────────────────────────────────────── */

const formatDateTime = (tsStr) => {
  if (!tsStr) return "—";
  try {
    const d = new Date(tsStr);
    if (isNaN(d.getTime())) return tsStr;
    const day = String(d.getDate()).padStart(2, "0");
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${day}-${month}-${year} ${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
  } catch {
    return tsStr;
  }
};

const formatLogEvent = (log) => {
  const action = (log.action || "").toUpperCase();
  const desc = log.description || "";
  if (action === "REASSIGNED") {
    const match = desc.match(/to\s+([^by\n]+?)(?:\s+by|$)/i);
    return `Reassigned to ${match ? match[1].trim() : "technician"}`;
  }
  if (action === "ASSIGNED") {
    const match = desc.match(/Assigned to\s+([^by\n]+?)(?:\s+by|$)/i);
    return `Assigned to ${match ? match[1].trim() : "technician"}`;
  }
  if (action === "REJECTED") {
    const match = desc.match(/Rejected by\s+([^\n]+)/i);
    return `Rejected by ${match ? match[1].trim() : "technician"}`;
  }
  if (action === "REVIEW" || desc.includes("arrived on-site") || desc.includes("Reached"))
    return "Reached Site";
  if (action === "REVIEWED" || desc.includes("Reviewed")) return "Reviewed";
  if (action === "COMPLETED" || desc.includes("Completed")) return "Completed";
  if (action === "ACCEPTED" || desc.includes("accepted")) return "Accepted";
  if (action === "TRAVELLING" || desc.includes("travel")) return "Travelling to Site";
  if (action === "CREATED") return "Ticket Created";
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


const getStatusVariant = (status) => {
  const map = {
    ASSIGNED: "info", ACCEPTED: "info", TRAVELLING: "info",
    REVIEW: "warning", REVIEWED: "warning",
    COMPLETED: "success", REJECTED: "danger",
    UNASSIGNED: "muted", ESCALATED: "danger",
  };
  return map[status] || "default";
};

const getStatusLabel = (status) => {
  const map = {
    ASSIGNED: "Pending", ACCEPTED: "Pending", TRAVELLING: "Pending",
    REVIEW: "Reached", REVIEWED: "Reviewed",
    COMPLETED: "Completed", REJECTED: "Rejected",
    UNASSIGNED: "Unassigned", ESCALATED: "Escalated",
  };
  return map[status] || status;
};

const dotCss = (log) => {
  const a = log.action;
  if (a === "REJECTED")   return "bg-rose-500   ring-rose-500/20   border-rose-500/40";
  if (a === "COMPLETED")  return "bg-emerald-500 ring-emerald-500/20 border-emerald-500/40";
  if (a === "CREATED")    return "bg-sky-500     ring-sky-500/20    border-sky-500/40";
  if (a === "TRAVELLING") return "bg-violet-500  ring-violet-500/20 border-violet-500/40";
  if (a === "REVIEW" || a === "REVIEWED") return "bg-amber-500 ring-amber-500/20 border-amber-500/40";
  return "bg-slate-500 ring-slate-700/20 border-slate-500/40";
};

const statusChipStyle = (status) => {
  if (status === "COMPLETED")
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-400";
  if (["REJECTED", "ESCALATED"].includes(status))
    return "border-rose-500/40 bg-rose-500/10 text-rose-400";
  if (["REVIEW", "REVIEWED"].includes(status))
    return "border-amber-500/40 bg-amber-500/10 text-amber-400";
  return "border-sky-500/40 bg-sky-500/10 text-sky-400";
};

/** Extract rejecting person's name from a REJECTED log */
const extractRejector = (log) => {
  const desc = log.description || "";
  const match = desc.match(/Rejected by\s+([^\n]+)/i);
  if (match) return match[1].trim();
  if (log.performedBy) return log.performedBy;
  if (log.technicianName) return log.technicianName;
  return "Unknown";
};

/** Extract rejection reason from description */
const extractReason = (desc) => {
  if (!desc) return null;
  if (desc.includes("\n")) {
    return desc.split("\n").slice(1).join("\n").replace(/^Reason:\s*/i, "").trim();
  }
  return null;
};

/* ─── Rejected Persons View ───────────────────────────────────── */

function RejectedPersonsView({ logs, tickets, searchQuery }) {
  const [selectedPersonName, setSelectedPersonName] = useState(null);

  // Build a map: personName → array of { ticketId, ticketInfo, log }
  const rejectedMap = useMemo(() => {
    const rejectedLogs = logs.filter((l) => l.action === "REJECTED");
    const map = {};

    rejectedLogs.forEach((log) => {
      const person = extractRejector(log);
      const ticket = tickets.find((t) => t.id === log.ticketId);

      if (!map[person]) {
        map[person] = { name: person, rejections: [] };
      }
      map[person].rejections.push({
        ticketId: log.ticketId,
        ticket,
        log,
        reason: extractReason(log.description),
        timestamp: log.timestamp,
      });
    });

    // Sort rejections within each person by newest first
    Object.values(map).forEach((p) => {
      p.rejections.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    });

    return Object.values(map).sort((a, b) => b.rejections.length - a.rejections.length);
  }, [logs, tickets]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return rejectedMap;
    return rejectedMap.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.rejections.some((r) => r.ticketId.toLowerCase().includes(q))
    );
  }, [rejectedMap, searchQuery]);

  // Reset selected person if search query changes
  useEffect(() => {
    setSelectedPersonName(null);
  }, [searchQuery]);

  const selectedPerson = useMemo(() => {
    if (!selectedPersonName) return null;
    return rejectedMap.find(p => p.name === selectedPersonName);
  }, [rejectedMap, selectedPersonName]);

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
        <UserX className="h-12 w-12 text-slate-700" />
        <p className="text-sm font-semibold">No rejection records found</p>
        <p className="text-xs text-slate-600">No users have rejected tickets yet.</p>
      </div>
    );
  }

  // 1. DETAIL VIEW: If a person is selected, show their rejections list
  if (selectedPerson) {
    return (
      <div className="space-y-4 animate-fadeIn">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedPersonName(null)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 cursor-pointer"
          >
            <ArrowRight className="h-4 w-4 rotate-180 text-slate-400" />
            Back to Ticket Rejections
          </button>
          
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Rejection History
          </span>
        </div>

        {/* Selected Person Card Header */}
        <div className="rounded-2xl border border-rose-500/15 bg-rose-500/5 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/15 border border-rose-500/25">
              <span className="text-lg font-extrabold text-rose-400">
                {selectedPerson.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-bold text-white">{selectedPerson.name}</p>
              <p className="text-[11px] text-rose-400/80 font-medium">
                {selectedPerson.rejections.length} ticket{selectedPerson.rejections.length !== 1 ? "s" : ""} rejected
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5">
            <XCircle className="h-3.5 w-3.5 text-rose-400" />
            <span className="text-xs font-bold text-rose-300">{selectedPerson.rejections.length} Total</span>
          </div>
        </div>

        {/* List of rejected tickets for this person */}
        <div className="space-y-3">
          {selectedPerson.rejections.map((r) => (
            <div key={r.log.id} className="rounded-2xl border border-slate-800 bg-slate-950/20 p-5 flex flex-wrap items-start gap-4 hover:border-slate-700 transition-all">
              {/* Ticket ID + status */}
              <div className="min-w-[120px]">
                <Link
                  to={`/activity-logs/${r.ticketId}`}
                  className="font-mono text-sm font-extrabold text-rose-400 hover:text-rose-300 hover:underline cursor-pointer block"
                >
                  {r.ticketId}
                </Link>
                {r.ticket && (
                  <Badge variant={getStatusVariant(r.ticket.status)} className="mt-1.5 text-[10px]">
                    {getStatusLabel(r.ticket.status)}
                  </Badge>
                )}
              </div>

              {/* Ticket info */}
              <div className="flex-1 min-w-[160px]">
                {r.ticket ? (
                  <>
                    <p className="text-xs font-bold text-slate-200">
                      {r.ticket.customer || "Unknown Customer"}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                      {r.ticket.issue && r.ticket.issue !== "—" ? r.ticket.issue : "Device Operation"}
                    </p>
                    {r.ticket.siteName && (
                      <p className="flex items-center gap-1 text-[10px] text-slate-500 mt-1">
                        <MapPin className="h-2.5 w-2.5" />
                        {r.ticket.siteName}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-slate-600 italic">Ticket details unavailable</p>
                )}
              </div>

              {/* Rejection reason */}
              {r.reason && (
                <div className="flex-1 min-w-[180px]">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-rose-400 mb-1">
                    <AlertTriangle className="h-3 w-3" />
                    Reason
                  </p>
                  <p className="text-xs text-rose-300/80 italic border-l-2 border-rose-500/30 pl-2.5 font-medium leading-relaxed">
                    {r.reason}
                  </p>
                </div>
              )}

              {/* Timestamp */}
              <div className="text-right shrink-0">
                <p className="flex items-center gap-1 text-[10px] text-slate-500 font-mono justify-end">
                  <Calendar className="h-2.5 w-2.5 text-slate-600" />
                  {formatDateTime(r.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. LIST VIEW: Show the list of Rejected Persons
  return (
    <div className="space-y-3 animate-fadeIn">
      {/* Summary stat row */}
      <div className="flex flex-wrap gap-4 mb-2">
        <div className="flex items-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/5 px-4 py-2.5">
          <UserX className="h-4 w-4 text-rose-400" />
          <span className="text-xs font-bold text-rose-300">{filtered.length} Ticket Rejections</span>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-2.5">
          <XCircle className="h-4 w-4 text-rose-400" />
          <span className="text-xs font-bold text-slate-300">
            {filtered.reduce((sum, p) => sum + p.rejections.length, 0)} Total Rejections
          </span>
        </div>
      </div>

      {/* List of Persons as full-width horizontal rows */}
      <div className="space-y-2">
        {filtered.map((person, i) => (
          <button
            key={person.name}
            onClick={() => setSelectedPersonName(person.name)}
            className="w-full text-left px-5 py-4 rounded-2xl border border-slate-800 bg-slate-950/20 text-slate-400 hover:border-rose-500/20 hover:bg-slate-950/40 transition-all cursor-pointer flex items-center justify-between gap-4 hover:scale-[1.005]"
          >
            {/* Person avatar & name */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <span className="text-sm font-extrabold text-rose-400">
                  {person.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200">{person.name}</p>
                <p className="text-[10px] text-slate-500 font-medium">Rank #{i + 1}</p>
              </div>
            </div>

            {/* Rejection count badge */}
            <div className="flex items-center gap-4 shrink-0">
              <span className="text-[10px] bg-rose-950/40 border border-rose-500/20 px-2.5 py-1 rounded-xl text-rose-300 font-bold uppercase tracking-wider">
                {person.rejections.length} {person.rejections.length === 1 ? "rejection" : "rejections"}
              </span>
              <ChevronRight className="h-4 w-4 text-slate-600 hover:text-rose-400" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Main component ──────────────────────────────────────────── */

export default function ActivityLogsPage() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userPlace = useMemo(() => getUserPlace(user), [user]);

  const getTicketPlace = (t) => {
    if (!t) return "Goa";
    const siteLower = (t.site || t.siteName || "").toLowerCase();
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

  const [tickets, setTickets]         = useState([]);
  const [logs, setLogs]               = useState([]);
  const [loading, setLoading]         = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab]     = useState("all");
  const [selectedId, setSelectedId]   = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page to 1 when filters or tabs change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.tickets.getAll(), api.tickets.getAllLogs()])
      .then(([allTickets, allLogs]) => {
        const filteredTickets = allTickets ? allTickets.filter(t => !userPlace || getTicketPlace(t) === userPlace) : [];
        const filteredLogs = allLogs ? allLogs.filter(l => filteredTickets.some(t => t.id === l.ticketId)) : [];
        setTickets(filteredTickets);
        setLogs(filteredLogs);
      })
      .catch((err) => console.error("Failed to load logs:", err))
      .finally(() => setLoading(false));
  }, [userPlace]);

  const isRejectedPersonsTab = activeTab === "rejected-persons";

  /* tickets that have at least one log */
  const groupedTickets = useMemo(() =>
    tickets.map(t => ({
      ...t,
      logsList: logs
        .filter(l => l.ticketId === t.id)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
    })).filter(t => t.logsList.length > 0),
  [tickets, logs]);

  /* filtered list for horizontal chips (all non-rejected-persons tabs) */
  const filteredTickets = useMemo(() => {
    if (isRejectedPersonsTab) return [];
    let res = groupedTickets;
    if (activeTab === "pending")   res = res.filter(t => ["ASSIGNED","ACCEPTED","TRAVELLING","UNASSIGNED"].includes(t.status));
    if (activeTab === "reached")   res = res.filter(t => t.status === "REVIEW");
    if (activeTab === "reviewed")  res = res.filter(t => t.status === "REVIEWED");
    if (activeTab === "completed") res = res.filter(t => t.status === "COMPLETED");
    if (activeTab === "rejected")  res = res.filter(t => t.status === "REJECTED");

    const q = searchQuery.toLowerCase();
    if (q) {
      res = res.filter(t =>
        t.id.toLowerCase().includes(q) ||
        (t.customer   && t.customer.toLowerCase().includes(q)) ||
        (t.technician && t.technician.toLowerCase().includes(q)) ||
        (t.issue      && t.issue.toLowerCase().includes(q))
      );
    }
    return res;
  }, [groupedTickets, activeTab, searchQuery, isRejectedPersonsTab]);

  /* auto-select first ticket when list changes */
  useEffect(() => {
    if (isRejectedPersonsTab) return;
    if (filteredTickets.length === 0) { setSelectedId(null); return; }
    const still = filteredTickets.find(t => t.id === selectedId);
    if (!still) setSelectedId(filteredTickets[0].id);
  }, [filteredTickets, isRejectedPersonsTab]);

  const selectedTicket = filteredTickets.find(t => t.id === selectedId) || null;

  const detailTicket = useMemo(() => {
    if (!ticketId) return null;
    const t = tickets.find(x => x.id === ticketId);
    if (!t) return null;
    return {
      ...t,
      logsList: logs
        .filter(l => l.ticketId === t.id)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
    };
  }, [tickets, logs, ticketId]);

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(filteredTickets.length / ITEMS_PER_PAGE);

  // Auto-adjust page if current page exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTickets.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTickets, currentPage]);

  /* count rejected persons for badge */
  const rejectedPersonsCount = useMemo(() => {
    const names = new Set(
      logs.filter(l => l.action === "REJECTED").map(l => extractRejector(l))
    );
    return names.size;
  }, [logs]);

  const TABS = [
    { id: "all",              label: "All Tickets" },
    { id: "pending",          label: "Pending" },
    { id: "reached",          label: "Reached" },
    { id: "reviewed",         label: "Reviewed" },
    { id: "completed",        label: "Completed" },
    { id: "rejected",         label: "Rejected" },
    { id: "rejected-persons", label: "Ticket Rejections", badge: rejectedPersonsCount, danger: true },
  ];

  /* ── render ── */
  if (ticketId) {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-32 text-slate-500 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
          <span className="text-xs italic">Loading ticket logs…</span>
        </div>
      );
    }

    if (!detailTicket) {
      return (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/activity-logs")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 cursor-pointer"
            >
              <ArrowRight className="h-4 w-4 rotate-180 text-slate-400" />
              Back to Activity Logs
            </button>
          </div>
          <Card className="glass-card">
            <CardBody className="p-8 text-center text-slate-500 space-y-3">
              <AlertCircle className="h-12 w-12 text-rose-500 mx-auto" />
              <p className="text-sm font-semibold text-white">Ticket Logs Not Found</p>
              <p className="text-xs text-slate-600">
                The ticket with ID <span className="font-mono text-slate-400 font-bold">{ticketId}</span> could not be found or has no activity logs.
              </p>
            </CardBody>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/activity-logs")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 cursor-pointer"
          >
            <ArrowRight className="h-4 w-4 rotate-180 text-slate-400" />
            Back to Activity Logs
          </button>

          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Ticket Details & Lifecycle History
          </span>
        </div>

        <Card className="glass-card">
          <CardBody className="p-6 space-y-6">
            {/* Ticket Summary Header */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-base font-extrabold text-sky-400 tracking-tight">
                      {detailTicket.id}
                    </span>
                    <Badge variant={getStatusVariant(detailTicket.status)} className="inline-flex items-center gap-1">
                      {detailTicket.status === "REJECTED" && <X className="h-3 w-3 stroke-[3]" />}
                      {getStatusLabel(detailTicket.status)}
                    </Badge>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      {detailTicket.logsList.length} events
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-200">
                    {detailTicket.customer} &mdash;{" "}
                    {detailTicket.issue && detailTicket.issue !== "—"
                      ? detailTicket.issue
                      : "Device Operation"}
                  </p>
                  {detailTicket.siteName && (
                    <p className="flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="h-3.5 w-3.5" />
                      {detailTicket.siteName}
                    </p>
                  )}
                </div>

                <div className="text-right text-xs text-slate-400 space-y-1">
                  <div className="flex items-center gap-1.5 justify-end">
                    <User className="h-3.5 w-3.5 text-slate-500" />
                    <span className="font-medium">
                      {detailTicket.technician || "Unassigned"}
                    </span>
                  </div>
                  {detailTicket.completedAt && (
                    <p className="text-slate-500">
                      Completed: {formatDateTime(detailTicket.completedAt)}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 justify-end text-slate-500">
                    <Clock className="h-3 w-3" />
                    <span>
                      Started:{" "}
                      {detailTicket.logsList[0]
                        ? formatDateTime(detailTicket.logsList[0].timestamp)
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="relative border-l-2 border-slate-800 pl-6 ml-3 space-y-6">
              {detailTicket.logsList.map((log, idx) => {
                const eventTitle   = formatLogEvent(log);
                const isRejection  = log.action === "REJECTED";
                const isCompletion = log.action === "COMPLETED";
                const isCreation   = log.action === "CREATED";
                const isLast       = idx === detailTicket.logsList.length - 1;

                return (
                  <div key={log.id} className="relative">
                    <div className={`absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full ring-4 border ${dotCss(log)}`} />

                    <div className={`rounded-2xl border p-4 space-y-1.5 transition-all ${
                      isRejection  ? "border-rose-500/20 bg-rose-500/5" :
                      isCompletion ? "border-emerald-500/20 bg-emerald-500/5" :
                      isCreation   ? "border-sky-500/20 bg-sky-500/5" :
                      "border-slate-800 bg-slate-950/30"
                    }`}>
                      <p className="font-mono text-[10px] text-slate-500">
                        {formatDateTime(log.timestamp)}
                      </p>
                      <p className={`text-sm font-bold ${
                        isRejection  ? "text-rose-300" :
                        isCompletion ? "text-emerald-300" :
                        isCreation   ? "text-sky-300" :
                        "text-slate-100"
                      }`}>
                        {isRejection  && <XCircle      className="inline h-4 w-4 mr-1.5 mb-0.5 text-rose-400" />}
                        {isCompletion && <CheckCircle2 className="inline h-4 w-4 mr-1.5 mb-0.5 text-emerald-400" />}
                        {isCreation   && <AlertCircle  className="inline h-4 w-4 mr-1.5 mb-0.5 text-sky-400" />}
                        {eventTitle}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1">
                          <span className="text-slate-500">User:</span>
                          <span className="font-bold text-slate-300">{getTimelineUserName(log, detailTicket)}</span>
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="flex items-center gap-1">
                          <span className="text-slate-500">Ref:</span>
                          <span className="font-mono text-slate-300">{log.ticketId || detailTicket.id}</span>
                        </span>
                      </div>
                      {isRejection && log.description.includes("\n") && (
                        <p className="text-xs text-rose-400/80 pl-3 border-l-2 border-rose-500/30 italic">
                          {log.description.split("\n").slice(1).join("\n").replace(/^Reason:\s*/i, "")}
                        </p>
                      )}
                      {!isRejection && log.description &&
                        !log.description.toLowerCase().startsWith(eventTitle.toLowerCase()) && (
                          <p className="text-xs text-slate-500 font-medium">{log.description}</p>
                        )}
                      {log.lat && log.lng && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono mt-1">
                          <MapPin className="h-3 w-3" />
                          {log.lat.toFixed(4)}, {log.lng.toFixed(4)}
                        </div>
                      )}
                    </div>

                    {!isLast && (
                      <div className="flex items-center mt-1 ml-0.5">
                        <ArrowRight className="h-3 w-3 text-slate-700 rotate-90 ml-[-2px]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Activity Logs"
        description="Browse ticket lifecycle history. Click a Ticket ID to view its full activity timeline."
      />

      <Card className="glass-card">
        <CardBody className="p-6 space-y-5">

          {/* ── Search & Tabs ── */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isRejectedPersonsTab
                    ? "Search person name or Ticket ID…"
                    : "Search Ticket ID, CP, Technician, or Issue…"
                }
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-xs text-slate-100 outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === tab.id
                      ? tab.danger
                        ? "bg-rose-500/15 text-rose-300 border-rose-500/40"
                        : "bg-sky-500/10 text-sky-400 border-sky-500/30"
                      : tab.danger
                      ? "bg-slate-950 border-rose-900/40 text-rose-400/70 hover:text-rose-300 hover:border-rose-500/30"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                  }`}
                >
                  {tab.danger && <UserX className="h-3.5 w-3.5" />}
                  {tab.label}
                  {tab.badge > 0 && (
                    <span className={`ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                      activeTab === tab.id ? "bg-rose-500/30 text-rose-200" : "bg-rose-900/60 text-rose-400"
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Loading ── */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
              <span className="text-xs italic">Loading lifecycle history…</span>
            </div>

          ) : isRejectedPersonsTab ? (
            /* ══ Rejected Persons View ══ */
            <RejectedPersonsView
              logs={logs}
              tickets={tickets}
              searchQuery={searchQuery}
            />

          ) : filteredTickets.length === 0 ? (
            <div className="text-center text-xs text-slate-500 italic py-20">
              No activity logs found matching the current search / filters.
            </div>

          ) : (
            <div className="space-y-4">
              {/* ── Horizontal Ticket ID List ── */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                  <Ticket className="h-3.5 w-3.5" />
                  Ticket IDs — {filteredTickets.length} found
                </p>

                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                  {paginatedTickets.map(ticket => {
                    return (
                      <button
                        key={ticket.id}
                        onClick={() => navigate(`/activity-logs/${ticket.id}`)}
                        className="w-full text-left px-5 py-3.5 rounded-2xl border border-slate-800 bg-slate-950/20 text-slate-400 hover:border-slate-700 hover:bg-slate-950/40 transition-all cursor-pointer flex items-center justify-between gap-4 hover:scale-[1.005]"
                      >
                        {/* Left section: Status Dot + Ticket ID */}
                        <div className="flex items-center gap-3 min-w-[140px]">
                          <span className={`h-2 w-2 rounded-full shrink-0 ${
                            ticket.status === "COMPLETED" ? "bg-emerald-400 shadow-[0_0_8px_rgba(168,85,247,0.5)]" :
                            ticket.status === "REJECTED"  ? "bg-rose-400 shadow-[0_0_8px_rgba(168,85,247,0.5)]" :
                            ["REVIEW","REVIEWED"].includes(ticket.status) ? "bg-amber-400 shadow-[0_0_8px_rgba(168,85,247,0.5)]" :
                            "bg-sky-400 shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                          }`} />
                          <span className="font-mono text-xs font-extrabold tracking-tight text-slate-200 hover:text-sky-400">
                            {ticket.id}
                          </span>
                        </div>

                        {/* Mid-left section: Customer Info */}
                        <div className="flex-1 min-w-[150px] truncate">
                          <span className="text-xs font-bold text-slate-200">
                            {ticket.customer || "Unknown Customer"}
                          </span>
                        </div>

                        {/* Mid-right section: Issue */}
                        <div className="flex-1 min-w-[180px] hidden sm:block truncate">
                          <span className="text-xs text-slate-400 font-medium">
                            {ticket.issue && ticket.issue !== "—" ? ticket.issue : "Device Operation"}
                          </span>
                        </div>

                        {/* Right section: Technician */}
                        <div className="min-w-[120px] text-right hidden md:block truncate">
                          <span className="text-xs text-slate-500 font-medium">
                            {ticket.technician || "Unassigned"}
                          </span>
                        </div>

                        {/* Far-right section: Event count & badge */}
                        <div className="flex items-center gap-4 shrink-0">
                          <span className={`inline-flex items-center gap-1 text-[10px] bg-slate-900/60 border border-slate-800 px-2.5 py-1 rounded-xl text-slate-400 font-bold uppercase tracking-wider ${ticket.status === "REJECTED" ? "text-rose-400 border-rose-500/20 bg-rose-500/5" : ""}`}>
                            {ticket.status === "REJECTED" && <X className="h-3 w-3 text-rose-400 stroke-[3]" />}
                            {getStatusLabel(ticket.status)}
                          </span>
                          <span className="text-[11px] font-mono font-bold text-slate-500 min-w-[60px] text-right">
                            {ticket.logsList.length} {ticket.logsList.length === 1 ? "event" : "events"}
                          </span>
                          <ChevronRight className="h-4 w-4 text-slate-600 hover:text-sky-400" />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-slate-800/60 mt-4">
                    <p className="text-xs text-slate-500 font-semibold tracking-wide">
                      Showing <span className="font-extrabold text-slate-300">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{" "}
                      <span className="font-extrabold text-slate-300">{Math.min(currentPage * ITEMS_PER_PAGE, filteredTickets.length)}</span> of{" "}
                      <span className="font-extrabold text-slate-300">{filteredTickets.length}</span> tickets
                    </p>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:border-slate-700 disabled:opacity-40 disabled:hover:text-slate-400 disabled:hover:border-slate-800 cursor-pointer disabled:cursor-not-allowed transition-all animate-none"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>

                      {Array.from({ length: totalPages }, (_, idx) => {
                        const pageNum = idx + 1;
                        const isPageActive = pageNum === currentPage;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`min-w-[32px] h-8 px-2.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                              isPageActive
                                ? "bg-sky-500/10 border-sky-500/40 text-sky-400 shadow-md shadow-sky-500/5"
                                : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:border-slate-700 disabled:opacity-40 disabled:hover:text-slate-400 disabled:hover:border-slate-800 cursor-pointer disabled:cursor-not-allowed transition-all animate-none"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
