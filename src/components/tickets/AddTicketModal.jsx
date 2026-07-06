import { useEffect, useState, useMemo } from "react";
import { X, Search, Clock, Package, ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import { dispatchPriorities } from "../../data/dispatchTickets";
import { useDevice } from "../../context/DeviceContext";
import CustomSelect from "../ui/CustomSelect";
import { api } from "../../utils/api";
import { getZoneRegion } from "../../utils/roleHelpers";

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

const DEVICE_OPTIONS = ["ACE", "MINI", "FAST SCAN", "GO"];
const DISPLAY_NAMES = {
  "ACE": "Ace",
  "MINI": "Mini",
  "FAST SCAN": "Fastscan",
  "GO": "Go"
};

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

const isWarehouseSite = (site) => String(site || "").toLowerCase().includes("warehouse");

const isTicketAssignableDevice = (device) => {
  const status = String(device?.status || "").toLowerCase();
  return [
    "available",
    "not deployed",
    "in stock",
    "maintenance completed",
    "critical",
    "maintenance",
    "maintenance required",
  ].includes(status) || (status === "online" && isWarehouseSite(device?.site));
};

const aggregateComponentsByRegion = (components) => {
  const grouped = new Map();
  components.forEach((component) => {
    const key = [
      String(component?.name || "").trim().toLowerCase(),
      String(component?.category || "").trim().toLowerCase(),
      String(component?.region || "").trim().toLowerCase(),
    ].join("|");
    const quantity = Number(component?.quantity || 0);
    const existing = grouped.get(key);
    if (existing) {
      existing.quantity += quantity;
      existing.sourceIds = [...(existing.sourceIds || [existing.id]), component.id];
      existing.minLimit = Math.min(existing.minLimit || component.minLimit || 0, component.minLimit || existing.minLimit || 0);
    } else {
      grouped.set(key, {
        ...component,
        quantity,
        sourceIds: [component.id],
      });
    }
  });
  return Array.from(grouped.values()).filter((component) => component.quantity > 0);
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
  const isWarehouseEscalatedReassign = mode === "resend" && ticket?.status === "ESCALATED" && ticket?.escalationType === "WAREHOUSE";

  const [componentsList, setComponentsList] = useState([]);
  const [loadingComp, setLoadingComp] = useState(false);
  const [selectedType, setSelectedType] = useState("device");
  const [reassignSelectedDevices, setReassignSelectedDevices] = useState([]);
  const [reassignSelectedComponents, setReassignSelectedComponents] = useState({});
  const [selectedComponents, setSelectedComponents] = useState({});
  const [deviceSearch, setDeviceSearch] = useState("");
  const [componentSearch, setComponentSearch] = useState("");
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
    ACE: [],
    MINI: [],
    "FAST SCAN": [],
    GO: [],
  });

  const [searchTerms, setSearchTerms] = useState({
    ACE: "",
    MINI: "",
    "FAST SCAN": "",
    GO: "",
  });

  const selectedDevices = useMemo(() => {
    return {
      ACE: selectedDeviceIdsMap.ACE?.length || 0,
      MINI: selectedDeviceIdsMap.MINI?.length || 0,
      "FAST SCAN": selectedDeviceIdsMap["FAST SCAN"]?.length || 0,
      GO: selectedDeviceIdsMap.GO?.length || 0,
    };
  }, [selectedDeviceIdsMap]);

 const totalSelectedCount = useMemo(() => {
 return Object.values(selectedDevices).reduce((sum, count) => sum + count, 0);
 }, [selectedDevices]);

 const selectedComponentEntries = useMemo(() => Object.values(selectedComponents), [selectedComponents]);
 const selectedComponentCount = useMemo(
   () => selectedComponentEntries.reduce((sum, entry) => sum + (entry.qty || 0), 0),
   [selectedComponentEntries]
 );

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
 setSelectedDeviceIdsMap({ ACE: [], MINI: [], "FAST SCAN": [], GO: [] });
 setSearchTerms({ ACE: "", MINI: "", "FAST SCAN": "", GO: "" });
 setSelectedComponents({});

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

 const initialIdsMap = { ACE: [], MINI: [], "FAST SCAN": [], GO: [] };
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
  const legacySelected = { ACE: 0, MINI: 0, "FAST SCAN": 0, GO: 0 };
  let foundAny = false;
  
  DEVICE_OPTIONS.forEach((dev) => {
    const pattern = dev === "FAST SCAN" ? "Fast\\s*scan|Fastscan|FAST\\s*SCAN" : dev;
    const regex = new RegExp(`${pattern}\\s*\\((\\d+)\\)`, "i");
    const match = issueStr.match(regex);
    if (match) {
      legacySelected[dev] = parseInt(match[1], 10);
      foundAny = true;
    }
  });
  
  // Also check site string if not found in issue
  if (!foundAny && ticket?.site) {
    DEVICE_OPTIONS.forEach((dev) => {
      const pattern = dev === "FAST SCAN" ? "Fast\\s*scan|Fastscan|FAST\\s*SCAN" : dev;
      const regex = new RegExp(`${pattern}\\s*\\((\\d+)\\)`, "i");
      const match = ticket.site.match(regex);
      if (match) {
        legacySelected[dev] = parseInt(match[1], 10);
        foundAny = true;
      }
    });
  }
  
  if (!foundAny) {
    // Handle legacy single-device fallback
    const legacyDev = (ticket?.deviceName ?? "").toUpperCase();
    const matchedDev = DEVICE_OPTIONS.find(d => d === legacyDev || (d === "FAST SCAN" && (legacyDev === "FASTSCAN" || legacyDev === "FAST SCAN")));
    if (matchedDev) {
      const qty = ticket?.deviceId ? ticket.deviceId.split(",").length : 1;
      legacySelected[matchedDev] = qty;
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
       setSelectedDeviceIdsMap({ ACE: [], MINI: [], "FAST SCAN": [], GO: [] });
     }
   }, [cp, jobType, mode]);

   useEffect(() => {
      if (open && (isWarehouseEscalatedReassign || mode === "add")) {
        setReassignSelectedDevices([]);
        setReassignSelectedComponents({});
        setDeviceSearch("");
        setComponentSearch("");
        setLoadingComp(true);
        api.components.getAll()
          .then(data => {
            setComponentsList(data || []);
          })
          .catch(err => {
            console.error("Failed to load components:", err);
          })
          .finally(() => {
            setLoadingComp(false);
          });
      }
    }, [open, isWarehouseEscalatedReassign, mode]);

    const ticketRegion = useMemo(() => {
      if (!ticket) return "";
      const region = getZoneRegion(ticket.site) || getZoneRegion(ticket.customer) || getZoneRegion(ticket.zone);
      if (region) return region;
      const siteStr = String(ticket.site || "").toLowerCase();
      if (siteStr.includes("goa")) return "Goa";
      if (siteStr.includes("bhutan")) return "Bhutan";
      return "";
    }, [ticket]);

    // Derive region from the current form 'site' or 'cp' field for new tickets
    const formSiteRegion = useMemo(() => {
      if (cp) {
        const region = getZoneRegion(cp);
        if (region) return region;
      }
      const s = (site || "").toLowerCase();
      const regionFromSite = getZoneRegion(s);
      if (regionFromSite) return regionFromSite;
      if (s.includes("goa")) return "Goa";
      if (s.includes("bhutan")) return "Bhutan";
      
      const c = (cp || "").toLowerCase();
      if (c.includes("goa") || c.includes("panaji") || c.includes("mapusa") || c.includes("margao") || c.includes("vasco") || c.includes("ponda") || c.includes("bicholim")) return "Goa";
      if (c.includes("bhutan") || c.includes("thimphu") || c.includes("paro")) return "Bhutan";
      return "";
    }, [site, cp]);

    const regionDevices = useMemo(() => {
      const effectiveRegion = formSiteRegion || ticketRegion || "Goa";
      return devices.filter(d => {
        const devRegion = d.site && (d.site.toLowerCase().includes("goa") || ["panaji", "mapusa", "margao", "vasco", "ponda", "bicholim"].some(h => d.site.toLowerCase().includes(h))) ? "Goa" : "Bhutan";
        return devRegion.toLowerCase() === effectiveRegion.toLowerCase() && isTicketAssignableDevice(d);
      });
    }, [devices, formSiteRegion, ticketRegion]);

    const regionComponents = useMemo(() => {
      const effectiveRegion = formSiteRegion || ticketRegion || "Goa";
      return aggregateComponentsByRegion(componentsList).filter(c => {
        const compRegion = c.region || "";
        return compRegion.toLowerCase() === effectiveRegion.toLowerCase() && c.quantity > 0;
      });
    }, [componentsList, formSiteRegion, ticketRegion]);

    const filteredRegionDevices = useMemo(() => {
      const q = deviceSearch.toLowerCase().trim();
      if (!q) return regionDevices;
      return regionDevices.filter(d => 
        d.name.toLowerCase().includes(q) || 
        d.id.toLowerCase().includes(q)
      );
    }, [regionDevices, deviceSearch]);

    const filteredRegionComponents = useMemo(() => {
      const q = componentSearch.toLowerCase().trim();
      if (!q) return regionComponents;
      return regionComponents.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.category.toLowerCase().includes(q)
      );
    }, [regionComponents, componentSearch]);

    const filteredAvailableComponents = useMemo(() => {
      const q = componentSearch.toLowerCase().trim();
      // Resolve effective region: prefer form's site, fall back to ticket site
      const effectiveRegion = formSiteRegion || ticketRegion;

      let base = aggregateComponentsByRegion(componentsList);

      if (effectiveRegion) {
        // Show only components from the matching warehouse region
        base = base.filter(c => (c.region || "").toLowerCase() === effectiveRegion.toLowerCase());
      } else {
        // No region known yet — de-duplicate by name, keep entry with highest stock
        const seen = new Map();
        base.forEach(c => {
          const existing = seen.get(c.name);
          if (!existing || c.quantity > existing.quantity) {
            seen.set(c.name, c);
          }
        });
        base = Array.from(seen.values());
      }

      if (!q) return base;
      return base.filter((c) =>
        c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)
      );
    }, [componentsList, componentSearch, formSiteRegion, ticketRegion]);

 if (!open) return null;

  const title =
  isWarehouseEscalatedReassign
  ? "Reassign Ticket (Warehouse Escalation)"
  : mode === "resend"
  ? "Resend ticket to technician"
  : mode === "send"
  ? "Assign & send ticket"
  : "Add new ticket";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isWarehouseEscalatedReassign) {
      if (!technician) {
        alert("Please select a technician to reassign the ticket.");
        return;
      }
      if (reassignSelectedDevices.length === 0 && Object.keys(reassignSelectedComponents).length === 0) {
        alert("Please select at least one device or component.");
        return;
      }

      // Format deviceId and deviceName strings linking all selected items
      const deviceIdStr = [
        ...reassignSelectedDevices.map(d => d.id),
        ...Object.entries(reassignSelectedComponents).map(([id, { qty }]) => `COMP-${id} (${qty})`)
      ].join(", ");

      const deviceNameStr = [
        ...reassignSelectedDevices.map(d => d.name),
        ...Object.values(reassignSelectedComponents).map(({ comp, qty }) => `${comp.name} (x${qty})`)
      ].join(", ");

      onSubmit({
        customer: ticket.customer,
        site: ticket.site,
        technician: technician || null,
        priority: ticket.priority,
        issue: ticket.issue,
        jobType: ticket.jobType,
        deviceId: deviceIdStr || null,
        deviceName: deviceNameStr || "",
        sentAt: ticket.sentAt || new Date().toISOString(),
        reassignItemType: "multiple",
        selectedDevices: reassignSelectedDevices,
        selectedComponents: Object.values(reassignSelectedComponents),
      });
      onClose();
      return;
    }

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
        .map(([name, count]) => `${DISPLAY_NAMES[name] || name} (${count})`);

      const allSelectedIds = [];
      const allSelectedNames = [];
      const allSelectedDevicePayload = [];
      Object.entries(selectedDeviceIdsMap).forEach(([type, ids]) => {
        ids.forEach(id => {
          const deviceRecord = devices.find((d) => d.id === id);
          allSelectedIds.push(id);
          allSelectedNames.push(type);
          if (deviceRecord) {
            allSelectedDevicePayload.push({
              id: deviceRecord.id,
              name: deviceRecord.name || deviceRecord.id,
              type,
            });
          }
        });
      });

      const selectedComponentPayload = Object.values(selectedComponents).map(({ comp, qty }) => ({
        id: String(comp.id),
        name: comp.name,
        qty,
      }));

      if (allSelectedIds.length === 0 && selectedComponentPayload.length === 0) {
        if (jobType === "deployments") {
          alert("Please select at least one device and specify the count.");
        } else {
          alert("Please select at least one device and device ID.");
        }
        return;
      }

 const activeDevicesStr = activeDevices.join(", ");
 const deviceIdStr = [
   ...allSelectedIds,
   ...selectedComponentPayload.map((item) => `COMP-${item.id} (${item.qty})`),
 ].join(", ");
 const deviceNameStr = [
   ...allSelectedDevicePayload.map((item) => item.name),
   ...selectedComponentPayload.map((item) => `${item.name} (x${item.qty})`),
 ].join(", ");

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
 site: cp,
 technician: technician || null,
 priority,
 issue: resolvedIssue,
 jobType,
 deviceId: deviceIdStr || null,
 deviceName: deviceNameStr || "",
 sentAt: selectedSentAt,
 selectedDevices: allSelectedDevicePayload,
 selectedComponents: selectedComponentPayload,
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
 selectedDevices: [],
 selectedComponents: Object.values(selectedComponents).map(({ comp, qty }) => ({
   id: String(comp.id),
   name: comp.name,
   qty,
 })),
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
    {isWarehouseEscalatedReassign ? (
      <div className="space-y-4">
        {/* Select Technician */}
        <label className="block text-sm font-medium text-slate-300">
          Reassign Technician *
          <CustomSelect
            value={technician}
            onChange={(e) => setTechnician(e.target.value)}
            options={[
              { value: "", label: "Select technician" },
              ...technicians.map((name) => ({ value: name, label: name })),
            ]}
            className="mt-1 w-full text-slate-100 !px-3 !py-2 !rounded-xl !border-slate-700 bg-slate-950 text-[13px] font-normal"
            dropdownClassName="w-full bg-slate-950 border-slate-700 text-sm font-normal"
            fullWidth
          />
        </label>        {/* Devices & Components list */}
        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
          <span className="block text-sm font-medium text-slate-350">
            Select Reassigned Devices & Components *
          </span>
          
          {/* Tabs */}
          <div className="flex gap-2 rounded-xl bg-slate-900 p-1">
            <button
              type="button"
              onClick={() => { setSelectedType("device"); }}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                selectedType === "device"
                  ? "bg-sky-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Devices ({regionDevices.length})
            </button>
            <button
              type="button"
              onClick={() => { setSelectedType("component"); }}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                selectedType === "component"
                  ? "bg-sky-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Components ({regionComponents.length})
            </button>
          </div>

          {/* Search Inputs */}
          {selectedType === "device" ? (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search devices by name or ID..."
                value={deviceSearch}
                onChange={(e) => setDeviceSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-9 pr-4 text-xs text-slate-200 outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20"
              />
              {deviceSearch && (
                <button
                  type="button"
                  onClick={() => setDeviceSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-500 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search components by name or category..."
                value={componentSearch}
                onChange={(e) => setComponentSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-9 pr-4 text-xs text-slate-200 outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20"
              />
              {componentSearch && (
                <button
                  type="button"
                  onClick={() => setComponentSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-500 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {/* List */}
          <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1">
            {loadingComp ? (
              <p className="text-xs text-slate-500 text-center py-4">Loading components...</p>
            ) : selectedType === "device" ? (
              filteredRegionDevices.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No matching devices in region warehouse.</p>
              ) : (
                 filteredRegionDevices.map(d => {
                  const isSelected = reassignSelectedDevices.some(item => item.id === d.id);
                  return (
                    <button
                      type="button"
                      key={d.id}
                      onClick={() => {
                        setReassignSelectedDevices(prev => {
                          if (prev.some(item => item.id === d.id)) {
                            return prev.filter(item => item.id !== d.id);
                          } else {
                            return [...prev, d];
                          }
                        });
                      }}
                      className={`w-full text-left p-3 rounded-xl border text-xs flex justify-between items-center transition ${
                        isSelected
                          ? "border-violet-500 bg-violet-100"
                          : "border-violet-200 bg-white hover:border-violet-400"
                      }`}
                    >
                      <div>
                        <span className="font-semibold block text-violet-850">{d.name}</span>
                        <span className="text-[10px] text-violet-500 font-mono block">ID: {d.id}</span>
                        <span className="text-[9px] text-violet-500 font-normal block">
                          Region: {d.site && (d.site.toLowerCase().includes("goa") || ["panaji", "mapusa", "margao", "vasco", "ponda", "bicholim"].some(h => d.site.toLowerCase().includes(h))) ? "Goa" : "Bhutan"} • Status: {d.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold ${isSelected ? "bg-violet-600 text-white" : "bg-violet-100 text-violet-600"}`}>
                          {d.type}
                        </span>
                        {isSelected && (
                          <span className="bg-violet-600 text-white h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold">
                            ✓
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )
            ) : (
              filteredRegionComponents.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No matching components in region warehouse.</p>
              ) : (
                filteredRegionComponents.map(c => {
                  const selectedVal = reassignSelectedComponents[c.id];
                  const isSelected = !!selectedVal;
                  return (
                    <div
                      key={c.id}
                      className={`w-full p-3 rounded-xl border text-xs flex justify-between items-center transition ${
                        isSelected
                          ? "border-violet-500 bg-violet-100"
                          : "border-violet-200 bg-white hover:border-violet-400"
                      }`}
                    >
                      <div>
                        <span className="font-semibold block text-violet-800">{c.name}</span>
                        <span className="text-[10px] text-violet-500">
                          Category: {c.category} • {parseInt(c.quantity, 10)} available • Region: {c.region || "Goa"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isSelected ? (
                          <div className="flex items-center gap-1.5 rounded-lg bg-violet-600 border border-violet-500 p-1 relative z-10">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setReassignSelectedComponents(prev => {
                                  const current = prev[c.id];
                                  if (!current) return prev;
                                  const next = { ...prev };
                                  if (current.qty <= 1) {
                                    delete next[c.id];
                                  } else {
                                    next[c.id] = { comp: c, qty: current.qty - 1 };
                                  }
                                  return next;
                                });
                              }}
                              className="h-7 w-7 flex items-center justify-center rounded-md bg-violet-500 hover:bg-violet-400 active:bg-violet-300 text-white font-bold cursor-pointer select-none"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-8 text-center text-sm font-bold text-white font-mono select-none">{selectedVal.qty}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setReassignSelectedComponents(prev => {
                                  const current = prev[c.id];
                                  if (!current) return prev;
                                  const next = { ...prev };
                                  next[c.id] = { comp: c, qty: current.qty + 1 };
                                  return next;
                                });
                              }}
                              className="h-7 w-7 flex items-center justify-center rounded-md bg-violet-500 hover:bg-violet-400 active:bg-violet-300 text-white font-bold cursor-pointer select-none"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setReassignSelectedComponents(prev => ({
                                ...prev,
                                [c.id]: { comp: c, qty: 1 }
                              }));
                            }}
                            className="bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-lg text-[11px] font-bold text-white transition cursor-pointer"
                          >
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>
        </div>

        {/* Selected Items (Cart) */}
        {(reassignSelectedDevices.length > 0 || Object.keys(reassignSelectedComponents).length > 0) && (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
              <div className="flex items-center gap-2 text-sky-400 font-semibold text-xs uppercase tracking-wider">
                <ShoppingCart className="h-4 w-4" />
                <span>Selected Items (Cart)</span>
              </div>
              <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-lg border border-sky-500/20">
                {reassignSelectedDevices.length + Object.values(reassignSelectedComponents).reduce((sum, item) => sum + item.qty, 0)} items
              </span>
            </div>
            
            <div className="max-h-[140px] overflow-y-auto space-y-2 pr-1 divide-y divide-slate-800/30">
              {/* Selected Devices */}
              {reassignSelectedDevices.map(d => (
                <div key={d.id} className="flex justify-between items-center py-2 text-xs first:pt-0">
                  <div>
                    <span className="font-semibold text-slate-200 block">{d.name}</span>
                    <span className="text-[9px] text-slate-500 font-mono">ID: {d.id} | Device</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setReassignSelectedDevices(prev => prev.filter(item => item.id !== d.id));
                    }}
                    className="p-1 rounded-lg text-rose-450 hover:bg-rose-500/10 transition"
                    title="Remove device"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              
              {/* Selected Components */}
              {Object.values(reassignSelectedComponents).map(({ comp, qty }) => (
                <div key={comp.id} className="flex justify-between items-center py-2 text-xs">
                  <div>
                    <span className="font-semibold text-slate-200 block">{comp.name}</span>
                    <span className="text-[9px] text-slate-500">Stock Limit: {comp.quantity} | Component</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 rounded-lg bg-slate-900 border border-slate-800 p-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setReassignSelectedComponents(prev => {
                            const next = { ...prev };
                            if (qty <= 1) {
                              delete next[comp.id];
                            } else {
                              next[comp.id] = { comp, qty: qty - 1 };
                            }
                            return next;
                          });
                        }}
                        className="h-5 w-5 flex items-center justify-center rounded text-slate-400 hover:bg-slate-800 hover:text-white"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-5 text-center text-xs font-semibold text-white font-mono">{qty}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setReassignSelectedComponents(prev => {
                            const next = { ...prev };
                            next[comp.id] = { comp, qty: Math.min(comp.quantity, qty + 1) };
                            return next;
                          });
                        }}
                        disabled={qty >= comp.quantity}
                        className="h-5 w-5 flex items-center justify-center rounded text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setReassignSelectedComponents(prev => {
                          const next = { ...prev };
                          delete next[comp.id];
                          return next;
                        });
                      }}
                      className="p-1 rounded-lg text-rose-450 hover:bg-rose-500/10 transition"
                      title="Remove component"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-750 bg-slate-950 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 shadow-lg shadow-sky-600/25"
          >
            Reassign Ticket
          </button>
        </div>
      </div>
    ) : (
      <>
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
  isTicketAssignableDevice(d) &&
  (!d.site ||
  d.site.trim() === "" ||
  d.site === "Not Deployed" ||
  isWarehouseSite(d.site) ||
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
     {DISPLAY_NAMES[devName] || devName}
   </span>
  <span className="text-[10px] text-slate-500 font-normal">
  ({visibleDevices.length} available in warehouse)
  </span>
  {visibleDevices.length > 0 && (
  <span className="mt-1 max-w-[260px] text-[10px] text-slate-500 font-mono break-words">
  {visibleDevices.map((d) => d.id).join(", ")}
  </span>
  )}
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
  {DISPLAY_NAMES[devName] || devName}
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
  <p className="text-center text-[10px] text-slate-600 py-2">No matching devices found</p>
  ) : (
  <div className="mt-2 grid grid-cols-2 gap-2">
  {filteredDevices.map((d) => {
  const isSelected = selectedList.includes(d.id);
  return (
  <button
  key={d.id}
  type="button"
  onClick={() => {
  setSelectedDeviceIdsMap((prev) => {
  const current = prev[devName] || [];
  const next = current.includes(d.id)
  ? current.filter((id) => id !== d.id)
  : [...current, d.id];
  return { ...prev, [devName]: next };
  });
  }}
  className={`flex flex-col items-start rounded-xl border p-3 text-left transition w-full ${
  isSelected
  ? "border-sky-500 bg-sky-500/10 text-white"
  : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-white"
  }`}
  >
    <div className="flex justify-between items-center w-full">
      <span className="font-semibold text-xs text-white">{d.name || devName}</span>
      <span className="text-[9px] text-slate-500 font-normal shrink-0">
        {d.status}
      </span>
    </div>
    <div className="flex justify-between items-center w-full mt-1.5 text-[9px] text-slate-400 font-mono">
      <span>ID: {d.id}</span>
      <span className="text-sky-400">
        Region: {d.site && (d.site.toLowerCase().includes("goa") || ["panaji", "mapusa", "margao", "vasco", "ponda", "bicholim"].some(h => d.site.toLowerCase().includes(h))) ? "Goa" : "Bhutan"}
      </span>
    </div>
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
     <span className="font-semibold text-slate-200">{DISPLAY_NAMES[type] || type} ({ids.length})</span>
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

  <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-slate-300">Link spare parts</span>
      {selectedComponentCount > 0 && (
        <span className="rounded-lg border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold text-sky-400">
          {selectedComponentCount} units selected
        </span>
      )}
    </div>
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      <input
        type="text"
        value={componentSearch}
        onChange={(e) => setComponentSearch(e.target.value)}
        placeholder="Search spare part..."
        className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2 pl-10 pr-3 text-sm text-slate-200 outline-none focus:border-sky-500/50"
      />
    </div>
    {loadingComp ? (
      <p className="text-sm text-slate-500">Loading spare parts…</p>
    ) : filteredAvailableComponents.length === 0 ? (
      <p className="text-sm text-slate-500">No spare parts available right now.</p>
    ) : (
      <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
        {filteredAvailableComponents.map((comp) => {
          const selectedEntry = selectedComponents[comp.id];
          const qty = selectedEntry?.qty || 0;
          return (
            <div key={comp.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2">
              <div>
                <p className="text-sm font-semibold text-white">{comp.name}</p>
                <p className="text-xs text-slate-500">
                  {comp.category} • {comp.quantity} available • Region: {comp.region || "Goa"}
                  {!formSiteRegion && !ticketRegion && comp.warehouse && (
                    <span className="ml-1 text-sky-500/70">({comp.warehouse})</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedComponents((prev) => {
                      const next = { ...prev };
                      if (!next[comp.id]) {
                        next[comp.id] = { comp, qty: 1 };
                      } else if (next[comp.id].qty > 1) {
                        next[comp.id] = { ...next[comp.id], qty: next[comp.id].qty - 1 };
                      } else {
                        delete next[comp.id];
                      }
                      return next;
                    });
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-6 text-center text-sm font-semibold text-white">{qty}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedComponents((prev) => {
                      const next = { ...prev };
                      const currentQty = next[comp.id]?.qty || 0;
                      next[comp.id] = { comp, qty: Math.min(comp.quantity, currentQty + 1) };
                      return next;
                    });
                  }}
                  disabled={qty >= comp.quantity}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
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
      </>
    )}
  </form>
 </div>
 </div>
 );
}
