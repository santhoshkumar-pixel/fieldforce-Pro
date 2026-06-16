import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import KpiDetailModal from "../components/KpiDetailModal";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import SlaTimer from "../components/SlaTimer";
import Badge, { severityVariant } from "../components/ui/Badge";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { getSlaHealthDetail } from "../data/kpiDetails";
import { api } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { getUserPlace } from "../utils/roleHelpers";

export default function SlaPage() {
 const { user } = useAuth();
 const userPlace = useMemo(() => getUserPlace(user), [user]);

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
 const [detailModal, setDetailModal] = useState(null);
 const [activeStat, setActiveStat] = useState(null);

 useEffect(() => {
 const fetchSlaTickets = async () => {
 try {
 const data = await api.tickets.getAll();
 setTicketList(data || []);
 } catch (err) {
 console.error("Failed to load SLA tickets:", err);
 }
 };
 fetchSlaTickets();
 }, []);

 const isTechnician = user?.role === "Field Technician" || user?.role === "Technician";

 const slaTicketsList = useMemo(() => {
 return ticketList
 .filter((t) => {
 if (isTechnician) {
 if (t.technician !== user?.name) return false;
 } else if (userPlace && getTicketPlace(t) !== userPlace) {
 return false;
 }
 return t.slaHealth !== "healthy" && t.slaHealth !== null && t.slaHealth !== undefined;
 })
 .map((t) => ({
 ...t,
 breachRisk: t.slaHealth === "critical" ? "Breach Imminent" : "At Risk",
 assignedTo: t.technician || "Unassigned",
 siteName: t.site,
 issueType: t.issue
 }));
 }, [ticketList, userPlace, user, isTechnician]);

 const critical = useMemo(() => slaTicketsList.filter((t) => t.slaHealth === "critical"), [slaTicketsList]);
 const warning = useMemo(() => slaTicketsList.filter((t) => t.slaHealth === "warning"), [slaTicketsList]);

 const openDetail = (type) => {
 const detail = getSlaHealthDetail(type);
 if (detail) {
 setActiveStat(type);
 setDetailModal(detail);
 }
 };

 return (
 <div className="space-y-6">
 <PageHeader
 title="SLA Monitoring"
 />

 <div className="grid gap-4 sm:grid-cols-3">
 <StatCard
 label="Healthy"
 value={124}
 subtitle="Within SLA window"
 tone="emerald"
 active={activeStat === "healthy"}
 onClick={() => openDetail("healthy")}
 />
 <StatCard
 label="Warning"
 value={warning.length}
 subtitle="Approaching breach"
 tone="amber"
 active={activeStat === "warning"}
 onClick={() => openDetail("warning")}
 />
 <StatCard
 label="Critical / Breached"
 value={critical.length + 7}
 subtitle="7 breaches today"
 tone="rose"
 active={activeStat === "critical"}
 onClick={() => openDetail("critical")}
 />
 </div>

 <Card className="glass-card">
 <CardHeader
 title="At-Risk Tickets"
 subtitle="Tickets requiring immediate admin attention"
 />
 <CardBody className="space-y-3">
 {slaTicketsList.map((t) => (
 <div
 key={t.id}
 className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:flex-row sm:items-center sm:justify-between"
 >
 <div className="flex items-start gap-3">
 <AlertTriangle
 className={`mt-0.5 h-5 w-5 shrink-0 ${
 t.slaHealth === "critical"
 ? "text-rose-400"
 : "text-amber-400"
 }`}
 />
 <div>
 <p className="font-medium text-white">
 {t.id} — {t.siteName}
 </p>
 <p className="text-sm text-slate-400">
 {t.issueType} · {t.assignedTo}
 </p>
 <div className="mt-2 flex gap-2">
 <Badge variant={severityVariant(t.severity)}>
 {t.severity}
 </Badge>
 <Badge variant="danger">{t.breachRisk}</Badge>
 </div>
 </div>
 </div>
 <div className="flex items-center gap-4">
 <SlaTimer remaining={t.slaRemaining} health={t.slaHealth} />
 <Link
 to="/tickets"
 className="text-sm text-sky-400 hover:text-sky-300"
 >
 Manage
 </Link>
 </div>
 </div>
 ))}
 </CardBody>
 </Card>

 <KpiDetailModal
 open={Boolean(detailModal)}
 onClose={() => {
 setDetailModal(null);
 setActiveStat(null);
 }}
 detail={detailModal}
 />
 </div>
 );
}
