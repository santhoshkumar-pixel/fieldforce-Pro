import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Battery, Plus, Radio, Search, Wifi } from "lucide-react";
import AddDeviceModal from "../components/devices/AddDeviceModal";
import KpiDetailModal from "../components/KpiDetailModal";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import Badge, { deviceStatusVariant } from "../components/ui/Badge";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { getDeviceHealthDetail } from "../data/kpiDetails";
import { useDevice } from "../context/DeviceContext";
import { buildDeviceHealthStats, nextDeviceId } from "../utils/deviceHelpers";
import { useAuth } from "../context/AuthContext";
import { getUserPlace } from "../utils/roleHelpers";
import CustomSelect from "../components/ui/CustomSelect";

const toneMap = {
 Total: "indigo",
 Deployed: "violet",
 Online: "emerald",
 Offline: "slate",
 Warning: "amber",
};

export default function DevicesPage() {
  const { devices: deviceList, addDevice, updateDevice } = useDevice();
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();
  
  const isSuperAdmin = user?.role === "Super Admin";
  const isTechOrSupport = user?.role === "Field Technician" || user?.role === "Technician";

 const userPlace = useMemo(() => getUserPlace(user), [user]);

 const placeDevices = useMemo(() => {
 if (!userPlace) return deviceList;
 return deviceList.filter((d) => {
 if (!d || !d.site) return false;
 if (userPlace === "Goa") {
 const nonGoaSites = [
 "San Jose HQ",
 "Frankfurt Data Center",
 "Singapore Tech Hub",
 "Sydney Terminal",
 "São Paulo Solar Hub",
 "London Operations Center"
 ];
 return !nonGoaSites.includes(d.site);
 } else if (userPlace === "Bhutan") {
 return d.site.toLowerCase().includes("thimphu") || d.site.toLowerCase().includes("paro") || d.site.toLowerCase().includes("bhutan");
 }
 return d.site.toLowerCase().includes(userPlace.toLowerCase());
 });
 }, [deviceList, userPlace]);

 const [search, setSearch] = useState("");
 const [statusFilter, setStatusFilter] = useState("all");
 const [typeFilter, setTypeFilter] = useState("all");
 const [cpFilter, setCpFilter] = useState("all");
 const [detailModal, setDetailModal] = useState(null);
 const [activeStat, setActiveStat] = useState(null);
 const [addModalOpen, setAddModalOpen] = useState(false);
 const [toast, setToast] = useState(null);

 const healthStats = useMemo(
 () => buildDeviceHealthStats(placeDevices),
 [placeDevices]
 );

 const uniqueTypes = useMemo(() => {
 const types = placeDevices.map((d) => d.type).filter(Boolean);
 return Array.from(new Set(types)).sort();
 }, [placeDevices]);

 const uniqueCps = useMemo(() => {
 const sites = placeDevices.map((d) => d.site).filter(Boolean);
 return Array.from(new Set(sites)).sort();
 }, [placeDevices]);

  const statusOptions = useMemo(() => [
    { value: "all", label: "All statuses" },
    { value: "Online", label: "Online" },
    { value: "Offline", label: "Offline" },
    { value: "Warning", label: "Warning" },
  ], []);

  const typeOptions = useMemo(() => [
    { value: "all", label: "All Types" },
    ...uniqueTypes.map((t) => ({ value: t, label: t })),
  ], [uniqueTypes]);

  const cpOptions = useMemo(() => [
    { value: "all", label: "All CPs" },
    ...uniqueCps.map((c) => ({ value: c, label: c })),
  ], [uniqueCps]);

 const filtered = placeDevices.filter((d) => {
 const q = search.toLowerCase();
 const matchesSearch =
 !q ||
 d.id.toLowerCase().includes(q) ||
 d.name.toLowerCase().includes(q) ||
 (d.site && d.site.toLowerCase().includes(q));
 const matchesStatus = statusFilter === "all" || d.status === statusFilter;
 const matchesType = typeFilter === "all" || d.type === typeFilter;
 const matchesCp = cpFilter === "all" || d.site === cpFilter;
 return matchesSearch && matchesStatus && matchesType && matchesCp;
 });

 const showToast = (msg) => {
 setToast(msg);
 setTimeout(() => setToast(null), 3000);
 };

  const openStatDetail = (label) => {
    const rawDetail = getDeviceHealthDetail(label, placeDevices);
    if (rawDetail) {
      const mappedRows = rawDetail.rows.map((row) => {
        const d = placeDevices.find(dev => dev.id === row.id);
        if (!d) return row;
        return {
          id: d.id,
          col2: d.type,
          col3: d.site || "—",
          col4: (
            <Badge variant={d.site && d.site.trim() !== "" ? "success" : "muted"}>
              {d.site && d.site.trim() !== "" ? "Deployed" : "Not Deployed"}
            </Badge>
          ),
          col5: (
            <Badge variant={deviceStatusVariant(d.status)}>
              {d.status}
            </Badge>
          ),
          col6: (
            <div className="flex flex-col gap-0.5 text-xs text-slate-300">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mr-1">Pick:</span>
                <span className="font-mono">{d.pickDate || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mr-1">Drop:</span>
                <span className="font-mono">{d.dropDate || "—"}</span>
              </div>
            </div>
          ),
          extra: (
            <span className="text-slate-300">
              {d.status === "Online" || d.status === "Offline" 
                ? `${d.status} (${d.statusDurationDays || 0} Days)` 
                : `${d.status} (${d.statusDurationDays || 0} Days)`}
            </span>
          )
        };
      });

      const updatedDetail = {
        ...rawDetail,
        columns: ["Device ID", "Type", "CP", "Deployed", "Status", "Date Range", "Availability Duration"],
        rows: mappedRows
      };

      setActiveStat(label);
      setDetailModal(updatedDetail);
      setStatusFilter(label === "Total" || label === "Deployed" ? "all" : label);
    }
  };

 const handleAddDevice = (data) => {
 const newDevice = {
 id: nextDeviceId(deviceList),
 ...data,
 };
 addDevice(newDevice);
 showToast(`Device ${newDevice.id} — ${newDevice.name} added`);
 };

 return (
 <div className="space-y-6">
 {toast && (
 <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">
 {toast}
 </div>
 )}

 <PageHeader
 title="IoT Device Management"
 action={
 !isTechOrSupport && hasPermission("devices.configure") && (
 <button
 type="button"
 onClick={() => setAddModalOpen(true)}
 className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-500"
 >
 <Plus className="h-4 w-4" />
 Add device
 </button>
 )
 }
 />

 <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
 {healthStats.map((d) => (
 <StatCard
 key={d.label}
 label={d.label}
 value={d.value}
 tone={toneMap[d.label] || "slate"}
 active={activeStat === d.label}
 onClick={() => openStatDetail(d.label)}
 />
 ))}
 </div>

 <Card className="glass-card">
 <CardHeader
 title="Device Inventory"
 subtitle={`${filtered.length} of ${deviceList.length} devices`}
 />
 <CardBody>
 <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
 <div className="relative flex-1">
 <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
 <input
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Search device ID, name, CP…"
className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-slate-100 outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
 />
 </div>
 <CustomSelect
  value={statusFilter}
  onChange={(e) => setStatusFilter(e.target.value)}
  options={statusOptions}
  className="text-slate-100 !px-4 !py-2.5 !rounded-2xl !border-slate-700 bg-slate-950 text-sm font-normal"
  dropdownClassName="bg-slate-950 border-slate-700 text-sm font-normal w-full"
  containerClassName="w-full lg:w-48"
  fullWidth
 />
 <CustomSelect
  value={typeFilter}
  onChange={(e) => setTypeFilter(e.target.value)}
  options={typeOptions}
  className="text-slate-100 !px-4 !py-2.5 !rounded-2xl !border-slate-700 bg-slate-950 text-sm font-normal"
  dropdownClassName="bg-slate-950 border-slate-700 text-sm font-normal w-full"
  containerClassName="w-full lg:w-48"
  fullWidth
 />
 <CustomSelect
  value={cpFilter}
  onChange={(e) => setCpFilter(e.target.value)}
  options={cpOptions}
  className="text-slate-100 !px-4 !py-2.5 !rounded-2xl !border-slate-700 bg-slate-950 text-sm font-normal"
  dropdownClassName="bg-slate-950 border-slate-700 text-sm font-normal w-full"
  containerClassName="w-full lg:w-48"
  fullWidth
 />
 </div>

 <div className="overflow-x-auto">
 <table className="w-full min-w-[640px] text-left text-sm device-inventory-table">
  <thead className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
  <tr>
  <th className="pb-3 pr-4 whitespace-nowrap">Device ID</th>
  <th className="pb-3 pr-4 whitespace-nowrap">Type</th>
  <th className="pb-3 pr-4 whitespace-nowrap">CP</th>
  <th className="pb-3 pr-4 whitespace-nowrap">Deployed</th>
  <th className="pb-3 pr-4 whitespace-nowrap">Status</th>
  <th className="pb-3 pr-4 whitespace-nowrap">Date Range</th>
  <th className="pb-3 pr-4 whitespace-nowrap">Availability Duration</th>
  </tr>
  </thead>
 <tbody>
 {filtered.map((d) => (
 <tr
 key={d.id}
 className="border-b border-slate-800/60 hover:bg-slate-900/30"
 >
 <td className="py-4 pr-4 whitespace-nowrap">
  <button
  type="button"
  onClick={() => navigate(`/devices/${d.id}`)}
  className="font-semibold text-sky-400 hover:text-sky-300 hover:underline text-left cursor-pointer"
  >
  {d.id}
  </button>
 </td>
 <td className="py-4 pr-4 text-slate-300 whitespace-nowrap">{d.type}</td>
 <td className="py-4 pr-4 text-slate-300 whitespace-nowrap">{d.site}</td>
 <td className="py-4 pr-4 whitespace-nowrap">
 <Badge variant={d.site && d.site.trim() !== "" ? "success" : "muted"}>
 {d.site && d.site.trim() !== "" ? "Deployed" : "Not Deployed"}
 </Badge>
 </td>
 <td className="py-4 pr-4 whitespace-nowrap">
 <Badge variant={deviceStatusVariant(d.status)}>
 {d.status}
 </Badge>
 </td>
  <td className="py-4 pr-4 whitespace-nowrap">
    <div className="flex flex-col gap-1 text-xs text-slate-300">
      <div>
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mr-1.5">Pick:</span>
        <span className="font-mono">{d.pickDate || "—"}</span>
      </div>
      <div>
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mr-1.5">Drop:</span>
        <span className="font-mono">{d.dropDate || "—"}</span>
      </div>
    </div>
  </td>
 <td className="py-4 pr-4 text-slate-300 whitespace-nowrap">
 {d.status === "Online" || d.status === "Offline" 
 ? `${d.status} (${d.statusDurationDays || 0} Days)` 
 : `${d.status} (${d.statusDurationDays || 0} Days)`}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 {filtered.length === 0 && (
 <p className="py-12 text-center text-slate-500">
 No devices match your filters.
 </p>
 )}
 </div>
 </CardBody>
 </Card>

 <AddDeviceModal
 open={addModalOpen}
 onClose={() => setAddModalOpen(false)}
 onSubmit={handleAddDevice}
 suggestedId={nextDeviceId(deviceList)}
 isSuperAdmin={isSuperAdmin}
 />

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
