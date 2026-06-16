import { useState } from "react";
import {
 AlertTriangle,
 Bell,
 Cpu,
 Info,
 Ticket,
 X,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import { Card, CardBody } from "../components/ui/Card";
import { useNotifications } from "../context/NotificationContext";

const typeConfig = {
 escalation: { icon: AlertTriangle, color: "text-rose-400" },
 sla: { icon: Bell, color: "text-amber-400" },
 device: { icon: Cpu, color: "text-sky-400" },
 ticket: { icon: Ticket, color: "text-emerald-400" },
 alert: { icon: AlertTriangle, color: "text-orange-400" },
 info: { icon: Info, color: "text-slate-400" },
};

/** Read saved media from localStorage for a given notification ID */
function getNotifMedia(notifId) {
 try {
 const raw = localStorage.getItem(`notif_media_${notifId}`);
 return raw ? JSON.parse(raw) : null;
 } catch {
 return null;
 }
}

export default function NotificationsPage() {
 const { notifications, unreadCount, markAllRead, markAsRead } = useNotifications();
 const [selectedMedia, setSelectedMedia] = useState(null);

 return (
 <div className="space-y-6">
 <PageHeader
 title="Notification Center"
 description="Operational alerts including SLA warnings, device offline events, escalations, and team updates."
 action={
 <button
 type="button"
 onClick={markAllRead}
 className="rounded-2xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-900"
 >
 Mark all read ({unreadCount})
 </button>
 }
 />

 <Card>
 <CardBody className="divide-y divide-slate-800 p-0">
 {notifications.length === 0 && (
 <p className="py-12 text-center text-sm text-slate-500">No notifications yet.</p>
 )}
 {notifications.map((n) => {
 const config = typeConfig[n.type] || typeConfig.info;
 const Icon = config.icon;
 const hasMedia = Boolean(getNotifMedia(n.id));
 return (
 <div
 key={n.id}
 onClick={() => markAsRead(n.id)}
 className={`cursor-pointer px-5 py-4 hover:bg-slate-900/40 ${
 n.unread ? "bg-slate-900/50" : ""
 }`}
 >
 <div className="flex gap-4">
 <div
 className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-800 ${config.color}`}
 >
 <Icon className="h-5 w-5" />
 </div>
 <div className="min-w-0 flex-1">
 <div className="flex items-start justify-between gap-4">
 <p
 className={`text-sm ${
 n.unread ? "font-medium text-white" : "text-slate-300"
 }`}
 >
 {n.title}
 </p>
 {hasMedia && (
 <button
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 setSelectedMedia(getNotifMedia(n.id));
 }}
 className="shrink-0 rounded-xl bg-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-sky-500 shadow-md hover:shadow-sky-500/20"
 >
 View
 </button>
 )}
 </div>
 <p className="mt-1 text-xs text-slate-500">{n.timeLabel || n.time}</p>
 </div>
 {n.unread && (
 <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-sky-500" />
 )}
 </div>
 </div>
 );
 })}
 </CardBody>
 </Card>

 {/* Full Media Modal */}
 {selectedMedia && (
 <div
 className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md"
 onClick={() => setSelectedMedia(null)}
 role="presentation"
 >
 <div
 className="relative flex max-h-[90vh] max-w-5xl flex-col items-center justify-center rounded-3xl border border-slate-800 bg-slate-900/50 p-2 shadow-2xl shadow-black/80"
 onClick={(e) => e.stopPropagation()}
 role="dialog"
 aria-label="Full screen media view"
 >
 <button
 type="button"
 onClick={() => setSelectedMedia(null)}
 className="absolute -top-3 -right-3 rounded-full bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 hover:text-white z-10 border border-slate-700 shadow-lg"
 >
 <X className="h-5 w-5" />
 </button>

 <div className="overflow-hidden rounded-2xl">
 {selectedMedia.mediaType === "video" ? (
 <video
 src={selectedMedia.dataUrl}
 controls
 autoPlay
 className="max-h-[80vh] max-w-full rounded-2xl object-contain"
 />
 ) : (
 <img
 src={selectedMedia.dataUrl}
 alt="Attachment Full View"
 className="max-h-[80vh] max-w-full rounded-2xl object-contain"
 />
 )}
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
