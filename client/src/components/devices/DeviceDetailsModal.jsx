import { X, Cpu, Wifi, Battery, MapPin, Clock, ShieldAlert, Settings2, Info } from "lucide-react";
import Badge, { deviceStatusVariant } from "../ui/Badge";

export default function DeviceDetailsModal({ open, device, onClose }) {
 if (!open || !device) return null;

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm ">
 <div className="w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/80 fade-in zoom-in-95 ">
 {/* Header */}
 <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/40 px-6 py-4">
 <div className="flex items-center gap-2.5">
 <Cpu className="h-5 w-5 text-sky-400" />
 <div>
 <h2 className="text-lg font-bold text-white">Device Details</h2>
 <p className="text-xs text-slate-400">ID: {device.id}</p>
 </div>
 </div>
 <button
 type="button"
 onClick={onClose}
 className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
 >
 <X className="h-5 w-5" />
 </button>
 </div>

 {/* Content */}
 <div className="px-6 py-6 space-y-6 overflow-y-auto flex-1">
 {/* Metadata Grid */}
 <div className="grid grid-cols-2 gap-y-5 gap-x-4 border-b border-slate-805 pb-5">
 {/* Device ID */}
 <div>
 <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
 Device ID
 </span>
 <span className="mt-1 block font-mono text-sm font-bold text-sky-400">
 {device.id}
 </span>
 </div>

 {/* Device Name */}
 <div>
 <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
 Device Name
 </span>
 <span className="mt-1 block text-sm font-semibold text-white">
 {device.name}
 </span>
 </div>

 {/* Device Type */}
 <div>
 <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
 Device Type
 </span>
 <span className="mt-1 block text-sm font-medium text-slate-200">
 {device.type}
 </span>
 </div>

 {/* Firmware Version */}
 <div>
 <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
 Firmware Version
 </span>
 <span className="mt-1 block font-mono text-sm font-medium text-slate-300">
 {device.firmware || "—"}
 </span>
 </div>

 {/* Status */}
 <div>
 <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
 Status
 </span>
 <Badge variant={deviceStatusVariant(device.status)}>
 {device.status}
 </Badge>
 </div>

 {/* Connectivity */}
 <div>
 <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
 Connectivity Type
 </span>
 <span className="mt-1 flex items-center gap-1 text-sm font-medium text-slate-200">
 <Wifi className="h-4 w-4 text-sky-400" />
 {device.connectivity || "—"}
 </span>
 </div>

 {/* Battery Status */}
 <div>
 <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
 Battery Level
 </span>
 <span className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-white">
 <Battery className={`h-4 w-4 ${device.battery > 20 ? "text-emerald-400" : "text-rose-500"}`} />
 {device.battery}%
 </span>
 </div>

 {/* Last Synced */}
 <div>
 <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
 Last Heartbeat
 </span>
 <span className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-350">
 <Clock className="h-3.5 w-3.5 text-slate-400" />
 {device.lastSync || "—"}
 </span>
 </div>

 {/* Pick Date */}
 <div>
 <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
 Pick Date
 </span>
 <span className="mt-1 block text-sm font-semibold text-white">
 {device.pickDate || "—"}
 </span>
 </div>

 {/* Drop Date */}
 <div>
 <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
 Drop Date
 </span>
 <span className="mt-1 block text-sm font-semibold text-white">
 {device.dropDate || "—"}
 </span>
 </div>
 </div>

 {/* Location & Deployment info */}
 <div className="space-y-4">
 <div>
 <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
 <MapPin className="h-3.5 w-3.5 text-slate-400" />
 Deployment Site
 </span>
 <span className="mt-1 block text-sm text-slate-300 bg-slate-950/30 rounded-xl px-3 py-2 border border-slate-800">
 {device.site || <span className="text-slate-500 italic">Not Deployed</span>}
 </span>
 </div>

 {/* Premium Simulated Details for IoT Dashboard */}
 <div className="rounded-2xl border border-slate-800 bg-slate-950/20 p-4 space-y-3">
 <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
 <Settings2 className="h-3.5 w-3.5 text-sky-400" />
 Hardware Performance Telemetry
 </span>
 <div className="grid grid-cols-2 gap-3 text-xs">
 <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-2.5">
 <p className="text-slate-500 uppercase tracking-wider text-[9px] font-bold">Signal Uptime</p>
 <p className="text-white font-semibold mt-0.5">{device.status === "Offline" ? "0%" : "99.85%"}</p>
 </div>
 <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-2.5">
 <p className="text-slate-500 uppercase tracking-wider text-[9px] font-bold">Signal Strength</p>
 <p className="text-white font-semibold mt-0.5">{device.status === "Offline" ? "None" : device.connectivity === "LTE" ? "-65 dBm" : "-72 dBm"}</p>
 </div>
 <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-2.5">
 <p className="text-slate-500 uppercase tracking-wider text-[9px] font-bold">Packet Loss</p>
 <p className="text-white font-semibold mt-0.5">{device.status === "Offline" ? "100%" : device.status === "Damaged" ? "5.42%" : "0.01%"}</p>
 </div>
 <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-2.5">
 <p className="text-slate-500 uppercase tracking-wider text-[9px] font-bold">Health Status</p>
 <p className="text-white font-semibold mt-0.5">{device.status === "Online" ? "Healthy" : device.status}</p>
 </div>
 </div>
 </div>

 {device.status === "Damaged" && (
 <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-3.5 py-3 flex items-start gap-2.5">
 <ShieldAlert className="h-4.5 w-4.5 text-rose-400 shrink-0 mt-0.5" />
 <div>
 <span className="block text-xs font-semibold uppercase tracking-wider text-rose-400">
 System Alert
 </span>
 <span className="mt-0.5 block text-xs text-rose-300 font-medium">
 This unit has breached temperature thresholds or report rate cycles. Field dispatch advised.
 </span>
 </div>
 </div>
 )}
 </div>
 </div>

 {/* Footer */}
 <div className="flex border-t border-slate-800 bg-slate-950/50 px-6 py-4 justify-end gap-3">
 <button
 type="button"
 onClick={onClose}
 className="rounded-xl bg-slate-800 hover:bg-slate-700 px-5 py-2 text-sm font-semibold text-slate-200 cursor-pointer"
 >
 Close
 </button>
 </div>
 </div>
 </div>
 );
}
