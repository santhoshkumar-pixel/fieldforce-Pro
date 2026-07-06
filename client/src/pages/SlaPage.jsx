import { useState, useEffect, useMemo } from "react";
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  FileText, 
  Search, 
  Printer, 
  AlertCircle, 
  Filter, 
  Calendar, 
  ShieldAlert,
  ChevronDown
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import SlaTimer from "../components/SlaTimer";
import Badge, { severityVariant } from "../components/ui/Badge";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { api } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { getUserPlace } from "../utils/roleHelpers";

export default function SlaPage() {
  const { user } = useAuth();
  const userPlace = useMemo(() => getUserPlace(user), [user]);
  const isTechnician = user?.role === "Field Technician" || user?.role === "Technician";

  // State
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, technicians, reports
  const [tickets, setTickets] = useState([]);
  const [techPerf, setTechPerf] = useState([]);
  const [metrics, setMetrics] = useState({
    totalTickets: 0,
    assignedTickets: 0,
    slaCompliantTickets: 0,
    complianceRate: 100,
    closedSlaComplianceRate: 100,
    closedTicketsCount: 0,
    resolvedWithinSlaCount: 0,
    avgResponseTimeMins: 0,
    avgResolutionTimeMins: 0,
    ackMet: 0, ackBreached: 0, ackPending: 0, ackOverdue: 0,
    respMet: 0, respBreached: 0, respPending: 0, respOverdue: 0,
    resMet: 0, resBreached: 0, resPending: 0, resOverdue: 0,
    totalSlaBreached: 0,
    totalSlaOverdue: 0,
    totalSlaPending: 0,
    totalSlaMet: 0,
    severityCounts: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }
  });
  const [loading, setLoading] = useState(true);
  
  // Reports Filter State
  const [filterTech, setFilterTech] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterPerformance, setFilterPerformance] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportTickets, setReportTickets] = useState([]);
  const [fetchingReport, setFetchingReport] = useState(false);

  // Load dashboard data
  const loadDashboardData = async (isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true);
      }
      const [fetchedTickets, fetchedMetrics, fetchedTech] = await Promise.all([
        api.tickets.getAll(),
        api.sla.getMetrics(),
        api.sla.getTechnicianPerformance()
      ]);

      // Apply client-side role/region filters for raw tickets list
      const filteredRawTickets = (fetchedTickets || []).filter((t) => {
        if (isTechnician) {
          return t.technician === user?.name;
        }
        if (userPlace) {
          const siteLower = (t.site || "").toLowerCase();
          const customerLower = (t.customer || "").toLowerCase();
          const matchesBhutan = siteLower.includes("thimphu") || siteLower.includes("paro") || siteLower.includes("bhutan") ||
                               customerLower.includes("thimphu") || customerLower.includes("paro") || customerLower.includes("bhutan");
          const ticketRegion = matchesBhutan ? "Bhutan" : "Goa";
          return ticketRegion === userPlace;
        }
        return true;
      });

      setTickets(filteredRawTickets);
      
      if (fetchedMetrics) {
        setMetrics(fetchedMetrics);
      }
      if (fetchedTech) {
        setTechPerf(fetchedTech);
      }
    } catch (err) {
      console.error("Failed to load SLA dashboard data:", err);
    } finally {
      if (isInitial) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadDashboardData(true);
    // Poll every 10 seconds to keep live countdowns / statuses synced silently
    const pollId = setInterval(() => loadDashboardData(false), 10000);
    return () => clearInterval(pollId);
  }, [user, userPlace, isTechnician]);

  // Load report data
  const handleGenerateReport = async () => {
    try {
      setFetchingReport(true);
      const params = {};
      if (filterTech !== "all") params.technician = filterTech;
      if (filterSeverity !== "all") params.severity = filterSeverity;
      if (filterPerformance !== "all") params.performance = filterPerformance;
      if (startDate) params.startDate = new Date(startDate).toISOString();
      if (endDate) params.endDate = new Date(endDate).toISOString();

      const data = await api.sla.getReports(params);
      
      // Apply client-side role/region restrictions to report if present
      const filteredData = (data || []).filter((t) => {
        if (isTechnician) {
          return t.technician === user?.name;
        }
        if (userPlace) {
          const siteLower = (t.site || "").toLowerCase();
          const matchesBhutan = siteLower.includes("thimphu") || siteLower.includes("paro") || siteLower.includes("bhutan");
          const ticketRegion = matchesBhutan ? "Bhutan" : "Goa";
          return ticketRegion === userPlace;
        }
        return true;
      });
      setReportTickets(filteredData);
    } catch (err) {
      console.error("Failed to generate SLA report:", err);
    } finally {
      setFetchingReport(false);
    }
  };

  // Run report initially when transitioning to reports tab
  useEffect(() => {
    if (activeTab === "reports") {
      handleGenerateReport();
    }
  }, [activeTab]);

  // Extracted unique technicians for report dropdown
  const techniciansList = useMemo(() => {
    const list = new Set();
    tickets.forEach(t => {
      if (t.technician && t.technician !== "Unassigned") {
        list.add(t.technician);
      }
    });
    return Array.from(list).sort();
  }, [tickets]);

  // Proactive Alerts: Pending Critical/High severity tickets near breach (< 15 mins)
  const breachWarnings = useMemo(() => {
    return tickets.filter(t => {
      if (t.status === "COMPLETED" || t.status === "REJECTED") return false;
      const now = new Date().getTime();
      
      const deadlines = [
        t.ackSlaStatus === "PENDING" ? new Date(t.ackDeadline).getTime() : null,
        t.responseSlaStatus === "PENDING" ? new Date(t.responseDeadline).getTime() : null,
        t.resolutionSlaStatus === "PENDING" ? new Date(t.resolutionDeadline).getTime() : null
      ].filter(d => d !== null);

      if (deadlines.length === 0) return false;
      const minDeadline = Math.min(...deadlines);
      const remainingMs = minDeadline - now;

      // Imminent breach warning: remaining time > 0 and < 15 minutes
      return remainingMs > 0 && remainingMs < 15 * 60 * 1000;
    });
  }, [tickets]);

  // Format Helper for durations in minutes
  const formatDuration = (mins) => {
    if (mins === null || mins === undefined || isNaN(mins) || mins === 0) return "—";
    if (mins < 1) return `${Math.round(mins * 60)} secs`;
    if (mins < 60) return `${Math.round(mins * 10) / 10} mins`;
    const hrs = Math.floor(mins / 60);
    const remainingMins = Math.round(mins % 60);
    return remainingMins > 0 ? `${hrs}h ${remainingMins}m` : `${hrs}h`;
  };

  // KPI Metrics calculation for reports dynamically
  const reportMetrics = useMemo(() => {
    if (reportTickets.length === 0) return null;
    
    let closedCount = 0;
    let resolvedWithinSla = 0;
    let totalRespMs = 0;
    let respCount = 0;
    let totalResMs = 0;
    let resCount = 0;
    
    reportTickets.forEach(t => {
      const isClosed = t.status === "COMPLETED" || t.status === "RESOLVED";
      if (isClosed) {
        closedCount++;
        if (t.resolutionSlaStatus === "MET") {
          resolvedWithinSla++;
        }
      }
      
      if (t.reachedSiteAt && t.sentAt) {
        const diff = new Date(t.reachedSiteAt).getTime() - new Date(t.sentAt).getTime();
        if (diff >= 0) {
          totalRespMs += diff;
          respCount++;
        }
      }
      
      if (t.resolvedAt && t.createdAt) {
        const diff = new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime();
        if (diff >= 0) {
          totalResMs += diff;
          resCount++;
        }
      }
    });
    
    const compliance = closedCount > 0 ? (resolvedWithinSla / closedCount) * 100 : 100;
    const avgResp = respCount > 0 ? totalRespMs / (1000 * 60) / respCount : 0;
    const avgRes = resCount > 0 ? totalResMs / (1000 * 60) / resCount : 0;
    
    return {
      compliance: Math.round(compliance * 10) / 10,
      avgResponse: Math.round(avgResp * 10) / 10,
      avgResolution: Math.round(avgRes * 10) / 10,
      closedCount,
      resolvedWithinSla
    };
  }, [reportTickets]);

  // Format Helper
  const formatDateTime = (isoString) => {
    if (!isoString) return "—";
    const d = new Date(isoString);
    return d.toLocaleString("en-IN", { 
      day: "2-digit", 
      month: "short", 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:p-0">
      {/* Page Header */}
      <div className="print:hidden">
        <PageHeader 
          title="SLA Monitoring Dashboard" 
          subtitle="Real-time Operational SLA tracking, alerts, and compliance reporting"
        />
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-800 print:hidden">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-semibold transition ${
            activeTab === "dashboard"
              ? "border-sky-505 text-sky-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Clock className="h-4 w-4" />
          Live SLA Dashboard
        </button>
        {!isTechnician && (
          <button
            onClick={() => setActiveTab("technicians")}
            className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-semibold transition ${
              activeTab === "technicians"
                ? "border-sky-505 text-sky-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Users className="h-4 w-4" />
            Technician Performance
          </button>
        )}
        <button
          onClick={() => setActiveTab("reports")}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-semibold transition ${
            activeTab === "reports"
              ? "border-sky-505 text-sky-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <FileText className="h-4 w-4" />
          SLA Compliance Reports
        </button>
      </div>

      {loading && activeTab !== "reports" ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-sky-500"></div>
        </div>
      ) : (
        <>
          {/* LIVE SLA DASHBOARD TAB */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Primary Performance KPIs */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-sky-400" />
                  SLA Performance KPIs
                </h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <StatCard
                    label="SLA Compliance %"
                    value={`${metrics.closedSlaComplianceRate != null ? metrics.closedSlaComplianceRate : 100}%`}
                    subtitle={`${metrics.resolvedWithinSlaCount || 0} of ${metrics.closedTicketsCount || 0} closed tickets resolved within SLA`}
                    tone={(metrics.closedSlaComplianceRate || 100) >= 90 ? "emerald" : (metrics.closedSlaComplianceRate || 100) >= 75 ? "amber" : "rose"}
                    icon={TrendingUp}
                  />
                  <StatCard
                    label="Avg Response Time"
                    value={formatDuration(metrics.avgResponseTimeMins)}
                    subtitle="Avg (On Site Time - Assigned Time)"
                    tone="sky"
                    icon={Clock}
                  />
                  <StatCard
                    label="Avg Resolution Time"
                    value={formatDuration(metrics.avgResolutionTimeMins)}
                    subtitle="Avg (Resolved Time - Created Time)"
                    tone="violet"
                    icon={CheckCircle}
                  />
                </div>
              </div>

              {/* Real-time Operations Tracker */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-sky-400" />
                  Real-time SLA Operations
                </h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <StatCard
                    label="Active Monitored Tickets"
                    value={metrics.totalTickets}
                    subtitle="All open and assigned tickets"
                    tone="sky"
                    icon={FileText}
                  />
                  <StatCard
                    label="SLA Breaches"
                    value={metrics.totalSlaBreached}
                    subtitle="Actions completed past deadline"
                    tone="rose"
                    icon={AlertTriangle}
                  />
                  <StatCard
                    label="Overdue Active SLAs"
                    value={metrics.totalSlaOverdue}
                    subtitle="Deadlines missed, action pending"
                    tone="red"
                    icon={AlertCircle}
                  />
                </div>
              </div>

              {/* Warnings and Live Status grid */}
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Warnings Column */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Proactive SLA Alerts Panel */}
                  <Card className="border-rose-500/30 bg-slate-900/60 backdrop-blur-md">
                    <CardHeader 
                      title="SLA Breach Warnings" 
                      subtitle="Critical/High SLAs with less than 15 mins remaining"
                      className="border-b border-rose-500/20"
                    />
                    <CardBody className="max-h-[380px] overflow-y-auto space-y-3 p-4">
                      {breachWarnings.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                          <CheckCircle className="h-10 w-10 text-emerald-500/40 mb-2" />
                          <p className="text-sm font-medium text-slate-400">All clear!</p>
                          <p className="text-xs">No active tickets near SLA breach.</p>
                        </div>
                      ) : (
                        breachWarnings.map(t => (
                          <div 
                            key={t.id} 
                            className="flex flex-col gap-2 rounded-xl border border-rose-500/30 bg-rose-500/5 p-3 animate-pulse"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-rose-400 tracking-wide">{t.id}</span>
                              <Badge variant="danger">{t.priority}</Badge>
                            </div>
                            <p className="text-xs font-semibold text-white truncate">{t.customer} — {t.site}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {t.ackSlaStatus === "PENDING" && (
                                <SlaTimer deadline={t.ackDeadline} status={t.ackSlaStatus} actionLabel="Ack" />
                              )}
                              {t.responseSlaStatus === "PENDING" && (
                                <SlaTimer deadline={t.responseDeadline} status={t.responseSlaStatus} actionLabel="Resp" />
                              )}
                              {t.resolutionSlaStatus === "PENDING" && (
                                <SlaTimer deadline={t.resolutionDeadline} status={t.resolutionSlaStatus} actionLabel="Res" />
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </CardBody>
                  </Card>

                  {/* Severity Breakdown Panel */}
                  <Card className="glass-card">
                    <CardHeader title="Severity SLA Counts" subtitle="SLA tickets by priority class" />
                    <CardBody className="p-4 space-y-4">
                      {Object.entries(metrics.severityCounts).map(([priority, count]) => {
                        const colors = {
                          CRITICAL: { text: "text-rose-400", bar: "bg-rose-500" },
                          HIGH: { text: "text-orange-400", bar: "bg-orange-500" },
                          MEDIUM: { text: "text-amber-400", bar: "bg-amber-500" },
                          LOW: { text: "text-sky-400", bar: "bg-sky-500" }
                        };
                        const maxVal = Math.max(...Object.values(metrics.severityCounts), 1);
                        const pct = (count / maxVal) * 100;
                        return (
                          <div key={priority} className="space-y-1">
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className={colors[priority]?.text}>{priority}</span>
                              <span className="text-slate-300">{count} tickets</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${colors[priority]?.bar}`} 
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </CardBody>
                  </Card>
                </div>

                {/* Ticket Details/Timers Column */}
                <div className="lg:col-span-2">
                  <Card className="glass-card">
                    <CardHeader 
                      title="Live Ticket SLA Tracker" 
                      subtitle="Real-time monitoring of all active operational SLAs"
                    />
                    <CardBody className="p-0 overflow-x-auto">
                      <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-slate-900/80 text-xs font-bold uppercase tracking-wider text-slate-400">
                          <tr>
                            <th className="px-6 py-4">Ticket / Customer</th>
                            <th className="px-4 py-4">Severity</th>
                            <th className="px-4 py-4">Status</th>
                            <th className="px-4 py-4">SLA Deadlines</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {tickets.length === 0 ? (
                            <tr>
                              <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                                No tickets found matching region/role criteria.
                              </td>
                            </tr>
                          ) : (
                            tickets.map(t => (
                              <tr key={t.id} className="hover:bg-slate-800/25 transition">
                                <td className="px-6 py-4">
                                  <div className="font-semibold text-white">{t.id}</div>
                                  <div className="text-xs text-slate-400 truncate max-w-[200px]">{t.customer} — {t.site}</div>
                                  <div className="text-[10px] text-slate-500">Tech: {t.technician || "Unassigned"}</div>
                                </td>
                                <td className="px-4 py-4">
                                  <Badge variant={severityVariant(t.priority)}>{t.priority}</Badge>
                                </td>
                                <td className="px-4 py-4">
                                  <span className="capitalize text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                                    {t.status?.toLowerCase().replace("_", " ")}
                                  </span>
                                </td>
                                <td className="px-4 py-4 space-y-1.5 py-3">
                                  <div className="flex flex-col gap-1">
                                    <SlaTimer deadline={t.ackDeadline} status={t.ackSlaStatus} actionLabel="Ack" />
                                    <SlaTimer deadline={t.responseDeadline} status={t.responseSlaStatus} actionLabel="Resp" />
                                    <SlaTimer deadline={t.resolutionDeadline} status={t.resolutionSlaStatus} actionLabel="Res" />
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </CardBody>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* TECHNICIAN PERFORMANCE TAB */}
          {activeTab === "technicians" && !isTechnician && (
            <Card className="glass-card">
              <CardHeader 
                title="Technician SLA Compliance" 
                subtitle="SLA compliance leaderboard based on completed and pending assignments"
              />
              <CardBody className="p-0 overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-900/80 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-6 py-4">Technician</th>
                      <th className="px-4 py-4 text-center">Total Tickets</th>
                      <th className="px-4 py-4 text-center text-emerald-400">Ack Met / Breached</th>
                      <th className="px-4 py-4 text-center text-amber-400">Response Met / Breached</th>
                      <th className="px-4 py-4 text-center text-sky-400">Resolution Met / Breached</th>
                      <th className="px-6 py-4 text-right">Compliance Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {techPerf.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                          No technician data available.
                        </td>
                      </tr>
                    ) : (
                      techPerf.map((tech, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/25 transition">
                          <td className="px-6 py-4 font-semibold text-white">{tech.technician}</td>
                          <td className="px-4 py-4 text-center">{tech.totalTickets}</td>
                          <td className="px-4 py-4 text-center font-semibold">
                            <span className="text-emerald-400">{tech.ackMet}</span>
                            <span className="text-slate-500"> / </span>
                            <span className={tech.ackBreached > 0 ? "text-rose-400" : "text-slate-500"}>{tech.ackBreached}</span>
                          </td>
                          <td className="px-4 py-4 text-center font-semibold">
                            <span className="text-emerald-400">{tech.respMet}</span>
                            <span className="text-slate-500"> / </span>
                            <span className={tech.respBreached > 0 ? "text-rose-400" : "text-slate-500"}>{tech.respBreached}</span>
                          </td>
                          <td className="px-4 py-4 text-center font-semibold">
                            <span className="text-emerald-400">{tech.resMet}</span>
                            <span className="text-slate-500"> / </span>
                            <span className={tech.resBreached > 0 ? "text-rose-400" : "text-slate-500"}>{tech.resBreached}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span 
                              className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                                tech.complianceRate >= 90 
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                  : tech.complianceRate >= 75
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              }`}
                            >
                              {tech.complianceRate}%
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </CardBody>
            </Card>
          )}

          {/* REPORTS GENERATOR TAB */}
          {activeTab === "reports" && (
            <div className="space-y-6">
              {/* Filter form */}
              <Card className="glass-card print:hidden">
                <CardHeader title="Report Filtering Parameters" subtitle="Configure filter parameters to pull SLA compliance datasets" />
                <CardBody className="p-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Date Range Start */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" /> Start Date
                      </label>
                      <input 
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                    {/* Date Range End */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" /> End Date
                      </label>
                      <input 
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                    {/* Technician Dropdown */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400">Technician</label>
                      <div className="relative">
                        <select
                          value={filterTech}
                          onChange={(e) => setFilterTech(e.target.value)}
                          disabled={isTechnician}
                          className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 pr-8 text-sm text-white focus:border-sky-500 focus:outline-none"
                        >
                          {isTechnician ? (
                            <option value={user?.name}>{user?.name}</option>
                          ) : (
                            <>
                              <option value="all">All Technicians</option>
                              {techniciansList.map(tech => (
                                <option key={tech} value={tech}>{tech}</option>
                              ))}
                            </>
                          )}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-3 h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                    {/* Severity dropdown */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400">Severity</label>
                      <div className="relative">
                        <select
                          value={filterSeverity}
                          onChange={(e) => setFilterSeverity(e.target.value)}
                          className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 pr-8 text-sm text-white focus:border-sky-500 focus:outline-none"
                        >
                          <option value="all">All Severities</option>
                          <option value="CRITICAL">Critical</option>
                          <option value="HIGH">High</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="LOW">Low</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-3 h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* SLA Performance Filter */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400 font-semibold">SLA Performance</label>
                      <div className="relative">
                        <select
                          value={filterPerformance}
                          onChange={(e) => setFilterPerformance(e.target.value)}
                          className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 pr-8 text-sm text-white focus:border-sky-500 focus:outline-none"
                        >
                          <option value="all">All Performance States</option>
                          <option value="compliant">SLA Compliant (All Met/Pending)</option>
                          <option value="breached">SLA Breached (Any Breached/Overdue)</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-3 h-4 w-4 text-slate-400" />
                      </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="sm:col-span-2 lg:col-span-3 flex items-end justify-end gap-3 pt-3">
                      <button
                        type="button"
                        onClick={handleGenerateReport}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 transition"
                      >
                        <Filter className="h-4 w-4" />
                        Apply Filters
                      </button>
                      <button
                        type="button"
                        onClick={printReport}
                        disabled={reportTickets.length === 0}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        <Printer className="h-4 w-4" />
                        Print Report
                      </button>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Report Output */}
              <Card className="glass-card print:border-none print:shadow-none print:bg-transparent">
                <CardHeader 
                  title="SLA Compliance Report Output" 
                  subtitle={`Showing ${reportTickets.length} tickets satisfying filter parameters`}
                  className="print:text-black print:p-0"
                />
                <CardBody className="p-0 overflow-x-auto print:overflow-visible">
                  {!fetchingReport && reportTickets.length > 0 && reportMetrics && (
                    <div className="grid grid-cols-3 gap-4 border-b border-slate-800 bg-slate-900/30 p-5 print:bg-slate-50 print:border-slate-300 print:text-black">
                      <div className="text-center sm:text-left">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 print:text-slate-500">SLA Compliance Rate</div>
                        <div className="mt-1 text-2xl font-extrabold text-emerald-400 print:text-emerald-700">{reportMetrics.compliance}%</div>
                        <div className="text-[10px] text-slate-500 print:text-slate-600">
                          {reportMetrics.resolvedWithinSla} of {reportMetrics.closedCount} closed tickets met SLA
                        </div>
                      </div>
                      <div className="text-center sm:text-left border-l border-slate-800 pl-4 print:border-slate-300">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 print:text-slate-500">Avg Response Time</div>
                        <div className="mt-1 text-2xl font-extrabold text-sky-400 print:text-sky-700">{formatDuration(reportMetrics.avgResponse)}</div>
                        <div className="text-[10px] text-slate-500 print:text-slate-600">On Site - Assigned</div>
                      </div>
                      <div className="text-center sm:text-left border-l border-slate-800 pl-4 print:border-slate-300">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 print:text-slate-500">Avg Resolution Time</div>
                        <div className="mt-1 text-2xl font-extrabold text-violet-400 print:text-violet-700">{formatDuration(reportMetrics.avgResolution)}</div>
                        <div className="text-[10px] text-slate-500 print:text-slate-600">Resolved - Created</div>
                      </div>
                    </div>
                  )}
                  {fetchingReport ? (
                    <div className="flex h-32 items-center justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-sky-500"></div>
                    </div>
                  ) : reportTickets.length === 0 ? (
                    <div className="px-6 py-12 text-center text-slate-500 print:text-black">
                      No records found. Select filters and click Apply.
                    </div>
                  ) : (
                    <table className="w-full text-left text-sm text-slate-300 print:text-black print:table-auto">
                      <thead className="bg-slate-900/80 text-xs font-bold uppercase tracking-wider text-slate-400 print:bg-slate-200 print:text-black">
                        <tr>
                          <th className="px-6 py-4">Ticket ID</th>
                          <th className="px-4 py-4">Customer & Site</th>
                          <th className="px-4 py-4 text-center">Severity</th>
                          <th className="px-4 py-4">Technician</th>
                          <th className="px-4 py-4">Created At</th>
                          <th className="px-4 py-4">Ack SLA</th>
                          <th className="px-4 py-4">Response SLA</th>
                          <th className="px-4 py-4">Resolution SLA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 print:divide-slate-300">
                        {reportTickets.map(t => {
                          const getStatusClass = (status) => {
                            if (status === "MET") return "text-emerald-400 font-bold print:text-emerald-700";
                            if (status === "BREACHED" || status === "OVERDUE") return "text-rose-400 font-bold print:text-rose-700";
                            return "text-amber-400 print:text-amber-700";
                          };
                          return (
                            <tr key={t.id} className="hover:bg-slate-800/25 transition print:hover:bg-transparent">
                              <td className="px-6 py-4 font-mono font-bold text-white print:text-black">{t.id}</td>
                              <td className="px-4 py-4">
                                <div className="text-white font-semibold print:text-black">{t.customer}</div>
                                <div className="text-xs text-slate-400 print:text-slate-600">{t.site}</div>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className="print:border print:border-black print:px-1.5 print:py-0.5 print:rounded">
                                  {t.priority}
                                </span>
                              </td>
                              <td className="px-4 py-4">{t.technician || "Unassigned"}</td>
                              <td className="px-4 py-4 text-xs font-mono">{formatDateTime(t.createdAt)}</td>
                              <td className="px-4 py-4">
                                <span className={getStatusClass(t.ackSlaStatus)}>{t.ackSlaStatus}</span>
                                <div className="text-[10px] text-slate-500 print:text-slate-600">
                                  {t.acceptedAt ? `Accepted: ${formatDateTime(t.acceptedAt)}` : `Deadline: ${formatDateTime(t.ackDeadline)}`}
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <span className={getStatusClass(t.responseSlaStatus)}>{t.responseSlaStatus}</span>
                                <div className="text-[10px] text-slate-500 print:text-slate-600">
                                  {t.reachedSiteAt ? `Reached: ${formatDateTime(t.reachedSiteAt)}` : `Deadline: ${formatDateTime(t.responseDeadline)}`}
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <span className={getStatusClass(t.resolutionSlaStatus)}>{t.resolutionSlaStatus}</span>
                                <div className="text-[10px] text-slate-500 print:text-slate-600">
                                  {t.resolvedAt ? `Resolved: ${formatDateTime(t.resolvedAt)}` : `Deadline: ${formatDateTime(t.resolutionDeadline)}`}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </CardBody>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
