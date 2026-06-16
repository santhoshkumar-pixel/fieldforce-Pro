import { X, Check, CheckCircle, Send, Clock, User, AlertCircle, MapPin, ClipboardList } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

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

const getGroupedDevices = (ticket) => {
 if (!ticket) return [];
 if (!ticket.deviceId) {
 const legacy = parseDevicesString(ticket.site);
 if (legacy.length > 0) {
 const DEVICE_NAMES = ["Ace", "Mini", "Fastscan", "Go"];
 const isDev = legacy.some(d => DEVICE_NAMES.includes(d.name));
 if (isDev) {
 return legacy.map(d => ({ ...d, ids: "—" }));
 }
 }
 if (ticket.deviceName) {
 return [{
 name: ticket.deviceName,
 count: 1,
 ids: "—"
 }];
 }
 return [];
 }

 const ids = ticket.deviceId.split(",").map(id => id.trim()).filter(Boolean);
 const names = ticket.deviceName ? ticket.deviceName.split(",").map(n => n.trim()).filter(Boolean) : [];

 const groups = {};
 ids.forEach((id, idx) => {
 const 
<truncated 15490 bytes>
rounded-lg border border-slate-700 bg-slate-900/60 px-2.5 py-1.5 text-xs font-semibold text-slate-300">
 <Clock className="h-3.5 w-3.5" />
 Assigned
 </span>
 )}
 {(ticket.status === "ACCEPTED" || ticket.status === "TRAVELLING") && (
 <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1.5 text-xs font-semibold text-blue-400">
 <Check className="h-3.5 w-3.5" />
 Accepted
 </span>
 )}
 {ticket.status === "REJECTED" && (
 <span className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs font-semibold text-red-400">
 <X className="h-3.5 w-3.5" />
 Rejected
 </span>
 )}
 {ticket.status === "REVIEW" && (
 <span className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1.5 text-xs font-semibold text-violet-400">
 <MapPin className="h-3.5 w-3.5" />
 Reached
 </span>
 )}
 {ticket.status === "REVIEWED" && (
 <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs font-semibold text-amber-400">
 <CheckCircle className="h-3.5 w-3.5" />
 Reviewed
 </span>
 )}
 {ticket.status === "COMPLETED" && (
 <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-400">
 <CheckCircle className="h-3.5 w-3.5" />
 Completed
 </span>
 )}
 </div>
 )}

 <button
 type="button"
 onClick={onClose}
 className="px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white "
 >
 Close
 </button>
 </div>
 </div>
 </div>
 </div>
 );
}

The above content shows the entire, complete file contents of the requested file.
