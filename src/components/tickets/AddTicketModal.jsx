import { useEffect, useState, useMemo } from "react";
import { X, Search } from "lucide-react";
import { dispatchPriorities } from "../../data/dispatchTickets";
import { useDevice } from "../../context/DeviceContext";
import CustomSelect from "../ui/CustomSelect";

const inputClass =
 "mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20";

const CP_OPTIONS = [
 "CP-001 (Panaji Center)",
 "CP-002 (Margao Hub)",
 "CP-003 (Mapusa Hub)",
 "CP-004 (Vasco Center)",
 "CP-005 (Ponda Station)",
];

const JOB_TYPE_OPTIONS = [
  { value: "", label: "Select job type" },
  { value: "deployments", label: "Deployments" },
  { value: "service_repairs", label: "Issue Resolution" },
  { value: "schedule_maintenance", label: "Schedule Maintenance" },
  { value: "predictive_maintenance", label: "Predictive Maintenance" },
];

const DEVICE_OPTIONS = ["Ace", "Mini", "Fastscan", "Go"];

const getTodayDateString = () => {
 const d = new Date();
 const year = d.getFullYear();
 const month = String(d.getMonth() + 1).padStart(2, "0");
 const day = String(d.getDate()).padStart(2, "0");
 return `${year}-${month}-${day}`;
};

const getCurrentTimeString = () => {
 const d = new Date();
 const hours = String(d.getHours()).padStart(2, "0");
 const minutes = String(d.getMinutes()).padStart(2, "0");
 return `${hours}:${minutes}`;
};

const formatSelectedDateTime = (dateStr, timeStr) => {
 if (!dateStr || !timeStr) return "—";
 try {
 const d = new Date(`${dateStr}T${timeStr}`);
 if (isNaN(d.getTime())) return `${dateStr} ${timeStr}`;
 return d.toLocaleString("en-US", {
 weekday: "short",
 year: "numeric",
 month: "short",
 day: "numeric",
 hour: "2-digit",
 minute: "2-digit",
 hour12: true,
 });
 } catch {
 return `${dateStr} ${timeStr}`;
 }
};


export default function AddTicketModal({
 open,
 onClose,
 onSubmit,
 technicians,
 ticket,
 allTickets = [],
 mode = "add",
}) {
 const { devices } = useDevice();
 const [jobType, setJobType] = useState("");
 const [customer, setCustomer] = useState("");
 const [site, setSite] = useState("");
 const [technician, setTechnician] = useState("");
 const [priority, setPriority] = useState("MEDIUM");
 const [issue, setIssue] = useState("");
 const [date, setDate] = useState(getTodayDateString());
 const [time, setTime] = useState(getCurrentTimeString());

 const [cp, setCp] = useState("");
 const [device, setDevice] = useState("");
 const [counter, setCounter] = useState(1);
 const [deviceNumber, setDeviceNumber] = useState("");
 
 const [selectedDeviceIdsMap, setSelectedDeviceIdsMap] = useState({
 Ace: [],
 Mini: [],
 Fastscan: [],
 Go: [],
 });

 const [searchTerms, setSearchTerms] = useState({
 Ace: "",
 Mini: "",
 Fastscan: "",
 Go: "",
 });

 const selectedDevices = useMemo(() => {
 return {
 Ace: selectedDeviceIdsMap.Ace?.length || 0,
 Mini: selectedDeviceIdsMap.Mini?.length || 0,
 Fastscan: selectedDeviceIdsMap.Fastscan?.length || 0,
 Go: selectedDeviceIdsMap.Go?.length || 0,
 };
 }, [selectedDeviceIdsMap]);

 const totalSelectedCount = useMemo(() => {
 return Object.values(selectedDevices).reduce((sum, count) => sum + count, 0);
 }, [selectedDevices]);

 const isResend = mode === "resend";
 const isSendOnly = mode === "send";

 useEffect(() => {
 if (open) {
 const currentJobType = ticket?.jobType ?? "";
 setJobType(currentJobType);
 setCustomer(ticket?.customer ?? "");
 setSite(ticket?.site ?? "");
 setTechnician(ticket?.technician ?? "");
 setPriority(ticket?.priority ?? "MEDIUM");
 setIssue(ticket?.issue ?? "");

 // Reset specific states first
 setCp("");
 setDevice("");
 setCounter(1);
 setDeviceNumber("");
 setSelectedDeviceIdsMap({ Ace: [], Mini: [], Fastscan: [], Go: [] });
 setSearchTerms({ Ace: "", Mini: "", Fastscan: "", Go: "" });

 if (ticket?.sentAt) {
 const d = new Date(ticket.sentAt);
 const year = d.getFullYear();
 const month = String(d.getMonth() + 1).padStart(2, "0");
 const day = String(d.getDate()).padStart(2, "0");
 setDate(`${year}-${month}-${day}`);
 
 const hours = String(d.getHours()).padStart(2, "0");
 const minutes = String(d.getMinutes()).padStart(2, "0");
 setTime(`${hours}:${minutes}`);
 } else {
 setDate(getTodayDateString());
 setTime(getCurrentTimeString());
 }

 if (["deployments", "services", "service_repairs", "schedule_maintenance", "predictive_maintenance"].includes(currentJobType)) {
 setCp(ticket?.customer ?? "");
 
 // Populate the issue textarea if there is a custom description
 const issueStr = ticket?.issue ?? "";
 const descMatch = issueStr.match(/\. Description:\s*(.*)$/);
 if (descMatch) {
 setIssue(descMatch[1]);
 } else {
 // If it doesn't match the combined template but has a custom string, display it
 if (issueStr && 
 !issueStr.startsWith("Deployment of") && 
 !issueStr.startsWith("Service request") && 
 !issueStr.startsWith("Issue resolution request") && 
 !issueStr.startsWith("Scheduled maintenance") &&
 !issueStr.startsWith("Predictive maintenance")) {
 setIssue(issueStr);
 } else {
 setIssue("");
 }
 }

 const initialIdsMap = { Ace: [], Mini: [], Fastscan: [], Go: [] };
 if (ticket?.deviceId) {
 const ids = ticket.deviceId.split(",").map(id => id.trim()).filter(Boolean);
 const names = ticket.deviceName ? ticket.deviceName.split(",").map(n => n.trim()).filter(Boolean) : [];
 ids.forEach((id, idx) => {
 const devObj = devices.find(d => d.id === id);
 if (devObj && initialIdsMap[devObj.type]) {
 initialIdsMap[devObj.type].push(id);
 } else {
 const name = names[idx] || names[0] || "";
 if (initialIdsMap[name]) {
 initialIdsMap[name].push(id);
 }
 }
 });
 } else {
 // Fallback parsing from legacy site count string
 const legacySelected = { Ace: 0, Mini: 0, Fastscan: 0, Go: 0 };
 let foundAny = false;
 
 DEVICE_OPTIONS.forEach((dev) => {
 const regex = new RegExp(`${dev}\\s*\\((\\d+)\\)`);
 const match = issueStr.match(regex);
 if (match) {
 legacySelected[dev] = parseInt(match[1], 10);
 foundAny = true;
 }
 });
 
 // Also check site string if not found in issue
 if (!foundAny && ticket?.site) {
 DEVICE_OPTIONS.forEach((dev) => {
 const regex = new RegExp(`${dev}\\s*\\((\\d+)\\)`);
 const match = ticket.site.match(regex);
 if (match) {
 legacySelected[dev] = parseInt(match[1], 10);
 foundAny = true;
 }
 });
 }
 
 if (!foundAny) {
 // Handle legacy single-device fallback
 const legacyDev = ticket?.deviceName ?? "";
 if (DEVICE_OPTIONS.includes(legacyDev)) {
 const qty = ticket?.deviceId ? ticket.deviceId.split(",").length : 1;
 legacySelected[legacyDev] = qty;
 }
 }
 
 DEVICE_OPTIONS.forEach((devName) => {
 const count = legacySelected[devName] || 0;
 if (count > 0) {
 const matching = devices.filter(d => d.type === devName && (d.site === (ticket.customer || cp) || !d.site || d.site === "Not Deployed"));
 initialIdsMap[devName] = matching.slice(0, count).map(d => d.id);
 }
 });
 }
 setSelectedDeviceIdsMap(initialIdsMap);
 }
 }
 }, [open, ticket, devices]);

 useEffect(() => {
 const isAddMode = mode === "add";
 if (isAddMode && jobType) {
 setSelectedDeviceIdsMap({ Ace: [], Mini: [], Fastscan: [], Go: [] });
 }
 }, [cp, jobType, mode]);

 if (!open) return null;

 const title =
 mode === "resend"
 ? "Resend ticket to technician"
 : mode === "send"
 ? "Assign & send ticket"
 : "Add new ticket";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!jobType) {
      alert("Please select a job type.");
      return;
    }
    if ((isSendOnly || isResend) && !technician) {
      alert("Please assign a technician.");
      return;
    }

    const selectedSentAt = technician ? new Date(`${date}T${time}`).toISOString() : null;

    if (["deployments", "services", "service_repairs", "schedule_maintenance", "predictive_maintenance"].includes(jobType)) {
      if (!cp) {
        alert("Please select a CP.");
        return;
      }
      const activeDevices = Object.entries(selectedDevices)
        .filter(([_, count]) => count > 0)
        .map(([name, count]) => `${name} (${count})`);

      const allSelectedIds = [];
      const allSelectedNames = [];
      Object.entries(selectedDeviceIdsMap).forEach(([type, ids]) => {
        ids.forEach(id => {
          allSelectedIds.push(id);
          allSelectedNames.push(type);
        });
      });

      if (allSelectedIds.length === 0) {
        if (jobType === "deployments") {
          alert("Please select at least one device and specify the count.");
        } else {
          alert("Please select at least one device and device ID.");
        }
        return;
      }

 const activeDevicesStr = activeDevices.join(", ");
 const deviceIdStr = allSelectedIds.join(", ");
 const deviceNameStr = allSelectedNames.join(", ");

 let issuePrefix = "";
 if (jobType === "deployments") issuePrefix = "Deployment of devices";
 else if (jobType === "services") issuePrefix = "Service request for devices";
 else if (jobType === "service_repairs") issuePrefix = "Issue resolution request for devices";
 else if (jobType === "schedule_maintenance") issuePrefix = "Scheduled maintenance for devices";
 else if (jobType === "predictive_maintenance") issuePrefix = "Predictive maintenance for devices";

 const resolvedIssue = issue.trim() 
 ? `${issuePrefix}: ${activeDevicesStr}. Description: ${issue.trim()}` 
 : `${issuePrefix}: ${activeDevicesStr}`;

 onSubmit({
 customer: cp,
 site: activeDevicesStr,
 technician: technician || null,
 priority,
 issue: resolvedIssue,
 jobType,
 deviceId: deviceIdStr || null,
 deviceName: deviceNameStr || "",
 sentAt: selectedSentAt,
 });
 } else {
 if (!customer.trim()) return;
 onSubmit({
 customer: customer.trim(),
 site: site.trim() || "—",
 technician: technician || null,
 priority,
 issue: issue.trim(),
 jobType: jobType || "service_repairs",
 deviceId: null,
 deviceName: "",
 sentAt: selectedSentAt,
 });
 }
 onClose();
 };


 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
 <div
 className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/50"
 role="dialog"
 aria-labelledby="add-ticket-title"
 >
 <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
 <h2 id="add-ticket-title" className="text-lg font-semibold text-white">
 {title}
 </h2>
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
  Select job type *
  <CustomSelect
  value={jobType}
  onChange={(e) => setJobType(e.target.value)}
  options={JOB_TYPE_OPTIONS}
  className="mt-1 w-full text-slate-100 !px-3 !py-2 !rounded-xl !border-slate-700 bg-slate-950 text-[13px] font-normal"
  dropdownClassName="w-full bg-slate-950 border-slate-700 text-sm font-normal"
  fullWidth
  />
  </label>

  {jobType && ["deployments", "services", "service_repairs", "schedule_maintenance", "predictive_maintenance"].includes(jobType) && (
  <>
  <label className="block text-sm font-medium text-slate-300">
  Select CP *
  <CustomSelect
  value={cp}
  onChange={(e) => setCp(e.target.value)}
  options={[
  { value: "", label: "Select CP" },
  ...CP_OPTIONS.map((c) => ({ value: c, label: c })),
  ]}
  className="mt-1 w-full text-slate-100 !px-3 !py-2 !rounded-xl !border-slate-700 bg-slate-950 text-[13px] font-normal"
  dropdownClassName="w-full bg-slate-950 border-slate-700 text-sm font-normal"
  fullWidth
  />
  </label>

 <div className="space-y-3">
 <div className="flex items-center justify-between">
 <span className="block text-sm font-medium text-slate-350">
 {jobType === "deployments" ? "Select Devices & Quantities *" : "Assigned Devices & Device IDs"}
 </span>
 {totalSelectedCount > 0 && (
 <span className="text-[11px] font-bold text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-lg border border-sky-500/20">
 Total Selected: {totalSelectedCount}
 </span>
 )}
 </div>
 
 {jobType !== "deployments" && cp && devices.filter(d => d.site === cp).length === 0 ? (
 <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
 <p className="text-xs text-amber-400 font-semibold">
 No deployed devices available for this CP.
 </p>
 <p className="text-[10px] text-slate-500 mt-1">
 Please deploy devices at this CP first using a Deployment ticket.
 </p>
 </div>
 ) : (
 <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-4 max-h-[280px] overflow-y-auto">
 {DEVICE_OPTIONS.map((devName) => {
 const selectedList = selectedDeviceIdsMap[devName] || [];

 let visibleDevices = [];
 if (jobType === "deployments") {
 visibleDevices = devices.filter(
 (d) =>
 d.type === devName &&
 (!d.site ||
 d.site.trim() === "" ||
 d.site === "Not Deployed" ||
 d.site === cp ||
 selectedList.includes(d.id))
 );
 } else {
 visibleDevices = devices.filter(
 (d) => d.type === devName && d.site === cp
 );
 }

 const searchVal = searchTerms[devName] || "";
 const filteredDevices = visibleDevices.filter((d) =>
 d.id.toLowerCase().includes(searchVal.toLowerCase()) ||
 selectedList.includes(d.id)
 );

 if (jobType !== "deployments" && visibleDevices.length === 0) {
 return null;
 }

 return (
 <div key={devName} className="space-y-2 border-b border-slate-800/40 pb-3 last:border-0 last:pb-0">
 {jobType === "deployments" ? (
 <div className="flex items-center justify-between py-1 w-full">
 <div className="flex flex-col">
 <span className="text-xs font-bold text-slate-200">
 {devName}
 </span>
 <span className="text-[10px] text-slate-500 font-normal">
 ({visibleDevices.length} available in warehouse)
 </span>
 </div>

 <div className="flex items-center gap-3">
 {selectedList.length > 0 ? (
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={() => {
 setSelectedDeviceIdsMap((prev) => ({
 ...prev,
 [devName]: visibleDevices
 .slice(0, Math.max(1, selectedList.length - 1))
 .map((d) => d.id),
 }));
 }}
 className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-950 text-sm font-bold text-slate-100 hover:bg-slate-800 "
 >
 -
 </button>
 <span className="w-8 text-center text-sm font-semibold text-white font-mono">
 {selectedList.length}
 </span>
 <button
 type="button"
 onClick={() => {
 setSelectedDeviceIdsMap((prev) => ({
 ...prev,
 [devName]: visibleDevices
 .slice(0, Math.min(visibleDevices.length, selectedList.length + 1))
 .map((d) => d.id),
 }));
 }}
 disabled={selectedList.length >= visibleDevices.length}
 className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-bold ${
 selectedList.length >= visibleDevices.length
 ? "border-slate-850 bg-slate-900/60 text-slate-600 cursor-not-allowed"
 : "border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-800"
 }`}
 >
 +
 </button>
 </div>
 ) : (
 <button
 type="button"
 onClick={() => {
 setSelectedDeviceIdsMap((prev) => ({
 ...prev,
 [devName]: visibleDevices.length > 0 ? [visibleDevices[0].id] : [],
 }));
 }}
 disabled={visibleDevices.length === 0}
 className={`px-3 py-1.5 rounded-xl border text-xs font-semibold ${
 visibleDevices.length === 0
 ? "border-slate-850 bg-slate-900/60 text-slate-600 cursor-not-allowed"
 : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-white"
 }`}
 >
 {visibleDevices.length === 0 ? "Unavailable" : "Select"}
 </button>
 )}
 </div>
 </div>
 ) : (
 <>
 <div className="flex items-center justify-between gap-2">
 <span className="text-xs font-bold text-slate-200 whitespace-nowrap">
 {devName}
 <span className="ml-1 text-[10px] text-slate-500 font-normal">
 ({selectedList.length} of {visibleDevices.length} selected)
 </span>
 </span>
 
 {visibleDevices.length > 3 && (
 <div className="relative w-36">
 <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
 <input
 type="text"
 placeholder={`Search ${devName}...`}
 value={searchVal}
 onChange={(e) =>
 setSearchTerms((prev) => ({
 ...prev,
 [devName]: e.target.value,
 }))
 }
 className="w-full rounded-lg border border-slate-800 bg-slate-950 py-1 pl-7 pr-2 text-[10px] text-slate-200 outline-none focus:border-sky-500/50"
 />
 </div>
 )}
 </div>

 {filteredDevices.length === 0 ? (
 <p className="text-[10px] text-slate-650 italic pl-1">
 {visibleDevices.length === 0 
 ? `No ${devName} devices available`
 : `No matches for "${searchVal}"`}
 </p>
 ) : (
 <div className="flex flex-wrap gap-1.5 pt-1">
 {filteredDevices.map((d) => {
 const isSel = selectedList.includes(d.id);
 return (
 <button
 key={d.id}
 type="button"
 onClick={() => {
 setSelectedDeviceIdsMap((prev) => {
 const current = prev[devName] || [];
 const next = current.includes(d.id)
 ? current.filter((x) => x !== d.id)
 : [...current, d.id];
 return { ...prev, [devName]: next };
 });
 }}
 className={`px-2.5 py-1 rounded-xl border text-[11px] font-mono font-medium ${
 isSel
 ? "border-sky-500 bg-sky-500/20 text-sky-400 font-bold shadow-[0_0_12px_rgba(168,85,247,0.15)]"
 : "border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200"
 }`}
 >
 {d.id}
 </button>
 );
 })}
 </div>
 )}
 </>
 )}
 </div>
 );
 })}
 </div>
 )}

 {totalSelectedCount > 0 && (
 <div className="mt-3 rounded-2xl border border-sky-500/20 bg-sky-500/5 p-3.5 space-y-1.5 fade-in slide-in-from-top-1 ">
 <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
 Selected Devices Summary
 </span>
 <div className="divide-y divide-slate-800/40">
 {Object.entries(selectedDeviceIdsMap).map(([type, ids]) => {
 if (ids.length === 0) return null;
 return (
 <div key={type} className="flex justify-between py-1.5 text-xs">
 <span className="font-semibold text-slate-200">{type} ({ids.length})</span>
 {jobType !== "deployments" && (
 <span className="font-mono text-slate-400 text-right max-w-[70%] break-all">
 {ids.join(", ")}
 </span>
 )}
 </div>
 );
 })}
 </div>
 </div>
 )}
 </div>

 <label className="block text-sm font-medium text-slate-300">
 Description (Reason for adding ticket) {jobType !== "deployments" && "*"}
 <textarea
 value={issue}
 onChange={(e) => setIssue(e.target.value)}
 rows={3}
 className={inputClass}
 placeholder="Describe the issue or reason for creating this ticket..."
 required={mode === "add" && jobType !== "deployments"}
 />
 </label>
 </>
 )}

 <label className="block text-sm font-medium text-slate-300">
 Priority
 <CustomSelect
 value={priority}
 onChange={(e) => setPriority(e.target.value)}
 options={dispatchPriorities.map((p) => ({ value: p, label: p }))}
 className="mt-1 w-full text-slate-100 !px-3 !py-2 !rounded-xl !border-slate-700 bg-slate-950 text-[13px] font-normal"
 dropdownClassName="w-full bg-slate-950 border-slate-700 text-sm font-normal"
 fullWidth
 />
 </label>

 <label className="block text-sm font-medium text-slate-300">
 Assign technician
 {!isSendOnly && !isResend && (
 <span className="ml-1 font-normal text-slate-500">(optional)</span>
 )}
 {(isSendOnly || isResend) && (
 <span className="ml-1 text-red-400">*</span>
 )}
 <CustomSelect
 value={technician}
 onChange={(e) => setTechnician(e.target.value)}
 options={[
 { value: "", label: mode === "add" ? "Unassigned — assign later" : "Select technician" },
 ...technicians.map((name) => ({ value: name, label: name })),
 ]}
 className="mt-1 w-full text-slate-100 !px-3 !py-2 !rounded-xl !border-slate-700 bg-slate-950 text-[13px] font-normal"
 dropdownClassName="w-full bg-slate-950 border-slate-700 text-sm font-normal"
 fullWidth
 />
 </label>

 <div className="grid grid-cols-2 gap-4">
 <label className="block text-sm font-medium text-slate-300">
 Date *
 <input
 type="date"
 value={date}
 onChange={(e) => setDate(e.target.value)}
 className={inputClass}
 required
 />
 </label>
 <label className="block text-sm font-medium text-slate-300">
 Time *
 <input
 type="time"
 value={time}
 onChange={(e) => setTime(e.target.value)}
 className={inputClass}
 required
 />
 </label>
 </div>

 <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-sm text-slate-400">
 <span className="font-medium text-slate-300">Selected Schedule:</span>
 <span className="font-semibold text-sky-400 font-mono">
 {formatSelectedDateTime(date, time)}
 </span>
 </div>

 <p className="text-xs text-slate-500">
 {technician
 ? "Ticket will be created as ASSIGNED and sent to the technician."
 : "Ticket will be created as UNASSIGNED. Use Send in the table to assign later."}
 </p>

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
 {jobType === "deployments"
 ? "Assign"
 : mode === "resend"
 ? "Resend ticket"
 : mode === "send"
 ? "Assign & send"
 : "Add ticket"}
 </button>
 </div>
 </form>
 </div>
 </div>
 );
}
