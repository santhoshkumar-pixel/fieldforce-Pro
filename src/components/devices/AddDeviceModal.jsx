import { useEffect, useState } from "react";
import { X } from "lucide-react";

const DEVICE_STATUSES = [
 "Online",
 "Offline",
 "Warning",
 "Critical",
 "Maintenance Required",
];

const CONNECTIVITY_OPTIONS = ["LTE", "WiFi", "LoRa", "Ethernet", "None"];

const DEVICE_TYPES = ["FastScan", "Mini", "Ace", "Go"];

const inputClass =
 "mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20";

export default function AddDeviceModal({ open, onClose, onSubmit, suggestedId, isSuperAdmin }) {
  const [type, setType] = useState("Ace");
  const [site, setSite] = useState("");
  const [status, setStatus] = useState("Online");
  const [firmware, setFirmware] = useState("v1.0.0");
  const [connectivity, setConnectivity] = useState("LTE");
  const [battery, setBattery] = useState("100");
  const [pickDate, setPickDate] = useState("");
  const [dropDate, setDropDate] = useState("");

  useEffect(() => {
    if (open) {
      setType("Ace");
      setSite("");
      setStatus("Online");
      setFirmware("v1.0.0");
      setConnectivity("LTE");
      setBattery("100");
      setPickDate("");
      setDropDate("");
    }
  }, [open]);

 if (!open) return null;

 const handleSubmit = (e) => {
 e.preventDefault();

 const batteryNum = Math.min(100, Math.max(0, parseInt(battery, 10) || 0));

 onSubmit({
 name: type,
 type: type === "Other" ? "Custom Device" : type,
 site: site.trim() || "",
 status,
 firmware: firmware.trim() || "v1.0.0",
 connectivity,
 battery: batteryNum,
 lastSync: "Just now",
 pickDate: pickDate || null,
 dropDate: dropDate || null,
 });
 onClose();
 };

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
 <div
 className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/50"
 role="dialog"
 aria-labelledby="add-device-title"
 >
 <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
 <div>
 <h2 id="add-device-title" className="text-lg font-semibold text-white">
 Add new device
 </h2>
 {suggestedId && (
 <p className="mt-0.5 text-xs text-slate-500">ID: {suggestedId}</p>
 )}
 </div>
 <button
 type="button"
 onClick={onClose}
 className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
 >
 <X className="h-5 w-5" />
 </button>
 </div>

 <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">


 <label className="block text-sm font-medium text-slate-300">
 Device type
 <select
 value={type}
 onChange={(e) => setType(e.target.value)}
 className={inputClass}
 >
 {DEVICE_TYPES.map((t) => (
 <option key={t} value={t}>
 {t}
 </option>
 ))}
 </select>
 </label>

 <label className="block text-sm font-medium text-slate-300">
 Deployment CP (optional)
 <input
 value={site}
 onChange={(e) => setSite(e.target.value)}
 className={inputClass}
 placeholder="e.g. Panaji EV Hub"
 />
 </label>

 <div className="grid gap-4 sm:grid-cols-2">
 <label className="block text-sm font-medium text-slate-300">
 Status
 <select
 value={status}
 onChange={(e) => setStatus(e.target.value)}
 className={inputClass}
 >
 {DEVICE_STATUSES.map((s) => (
 <option key={s} value={s}>
 {s}
 </option>
 ))}
 </select>
 </label>

 <label className="block text-sm font-medium text-slate-300">
 Connectivity
 <select
 value={connectivity}
 onChange={(e) => setConnectivity(e.target.value)}
 className={inputClass}
 >
 {CONNECTIVITY_OPTIONS.map((c) => (
 <option key={c} value={c}>
 {c}
 </option>
 ))}
 </select>
 </label>
 </div>

 <div className="grid gap-4 sm:grid-cols-2">
 <label className="block text-sm font-medium text-slate-300">
 Firmware version
 <input
 value={firmware}
 onChange={(e) => setFirmware(e.target.value)}
 className={inputClass}
 placeholder="v3.2.1"
 />
 </label>

 <label className="block text-sm font-medium text-slate-300">
 Battery %
 <input
 type="number"
 min={0}
 max={100}
 value={battery}
 onChange={(e) => setBattery(e.target.value)}
 className={inputClass}
 />
 </label>
 </div>



 <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
 <button
 type="button"
 onClick={onClose}
 className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
 >
 Cancel
 </button>
 <button
 type="submit"
 className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
 >
 Add device
 </button>
 </div>
 </form>
 </div>
 </div>
 );
}
