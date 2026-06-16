import { useMemo, useState } from "react";
import { 
 Battery, 
 Plus, 
 Radio, 
 Search, 
 Wifi, 
 Layers, 
 Cpu, 
 ArrowUpRight, 
 CheckCircle2, 
 AlertTriangle, 
 Settings, 
 Boxes, 
 Truck, 
 RotateCcw,
 Sliders,
 ChevronRight
} from "lucide-react";
import AddDeviceModal from "../components/devices/AddDeviceModal";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import Badge, { deviceStatusVariant } from "../components/ui/Badge";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { useDevice } from "../context/DeviceContext";
import { useAuth } from "../context/AuthContext";
import { getUserPlace } from "../utils/roleHelpers";
import { api } from "../utils/api";

const toneMap = {
 Total: "indigo",
 InStock: "emerald",
 Deployed: "violet",
 Maintenance: "amber",
 LowBattery: "rose"
};

export default function InventoryPage() {
 const { devices: deviceList, addDevice, refreshDevices } = useDevice();
 const { user, hasPermission } = useAuth();
 
 const userPlace = useMemo(() => getUserPlace(user), [user]);

 // Determine current warehouse site name
 const warehouseSiteName = useMemo(() => {
 return userPlace ? `${userPlace} Warehouse` : "All Warehouses";
 }, [userPlace]);

 // Filter devices belonging to user's region
 const regionalDevices = useMemo(() => {
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

 // Split regional devices into Warehouse stock vs Deployed field assets
 const warehouseStock = useMemo(() => {
 return regionalDevices.filter(d => d.site.toLowerCase().includes("warehouse"));
 }, [regionalDevices]);

 const deployedAssets = useMemo(() => {
 return regionalDevices.filter(d => !d.site.toLowerCase().includes("warehouse"));
 }, [regionalDevices]);

 // State hooks
 const [activeTab, setActiveTab] = useState("instock"); // "instock" | "deployed" | "all"
 const [search, setSearch] = useState("");
 const [statusFilter, setStatusFilter] = useState("all");
 const [typeFilter, setTypeFilter] = useState("all");
 const [addModalOpen, setAddModalOpen] = useState(false);
 const [deployingDevice, setDeployingDevice] = useState(null);
 const [targetSite, setTargetSite] = useState("");
 const [isSubmittingDeployment, setIsSubmittingDeployment] = useState(false);
 const [toast, setToast] = useState(null);

 const showToast = (msg) => {
 setToast(msg);
 setTimeout(() => setToast(null), 3000);
 };

 // Build warehouse statistics
 const stats = useMemo(() => {
 const total = warehouseStock.length;
 const available = warehouseStock.filter(d => d.status === "Online").length;
 const maintenance = warehouseStock.filter(d => d.status === "Maintenance Required" || d.status === "Critical").length;
 const lowBattery = warehouseStock.filter(d => d.battery < 30).length;

 return {
 total,
 available,
 deployed: deployedAssets.length,
 maintenance,
 lowBattery
 };
 }, [warehouseStock, deployedAssets]);

 // Device types and unique options
 const uniqueTypes = useMemo(() => {
 const types = regionalDevices.map((d) => d.type).filter(Boolean);
 return Array.from(new Set(types)).sort();
 }, [regionalDevices]);

 // Filter lists based on tab and filters
 const currentList = useMemo(() => {
 if (activeTab === "instock") return warehouseStock;
 if (activeTab === "deployed") return deployedAssets;
 return regionalDevices;
 }, [activeTab, warehouseStock, deployedAssets, regionalDevices]);

 const filteredItems = useMemo(() => {
 return currentList.filter((d) => {
 const q = search.toLowerCase();
 const matchesSearch =
 !q ||
 d.id.toLowerCase().includes(q) ||
 d.name.toLowerCase().includes(q) ||
 (d.site && d.site.toLowerCase().includes(q));
 const matchesStatus = statusFilter === "all" || d.status === statusFilter;
 const matchesType = typeFilter === "all" || d.type === typeFilter;
 return matchesSearch && matchesStatus && matchesType;
 });
 }, [currentList, search, statusFilter, typeFilter]);

 // Handle checking in a device to the warehouse
 const handleCheckIn = async (device) => {
 try {
 const updated = {
 ...device,
 site: warehouseSiteName,
 status: "Online", // Automatically mark as online/available upon check-in
 lastSync: "Just now"
 };
 await api.devices.update(device.id, updated);
 refreshDevices();
 showToast(`Device ${device.id} checked back into ${warehouseSiteName}`);
 } catch (err) {
 console.error("Failed to check-in device:", err);
 showToast("Error checking in device");
 }
 };

 // Handle opening the deployment modal
 const openDeployment = (device) => {
 setDeployingDevice(device);
 setTargetSite("");
 };

 // Submit device deployment
 const handleDeploySubmit = async (e) => {
 e.preventDefault();
 if (!targetSite.trim() || !deployingDevice) return;

 setIsSubmittingDeployment(true);
 try {
 const updated = {
 ...deployingDevice,
 site: targetSite.trim(),
 lastSync: "Just now"
 };
 await api.devices.update(deployingDevice.id, updated);
 setDeployingDevice(null);
 refreshDevices();
 showToast(`Device ${deployingDevice.id} successfully deployed to ${targetSite}`);
 } catch (err) {
 console.error("Failed to deploy device:", err);
 showToast("Error deploying device");
 } finally {
 setIsSubmittingDeployment(false);
 }
 };

 // Add stock item to warehouse site
 const handleAddStock = async (data) => {
 const newDevice = {
 ...data,
 site: warehouseSiteName // Force location to local warehouse
 };
 await addDevice(newDevice);
 showToast(`New stock item ${newDevice.type} checked into ${warehouseSiteName}`);
 };

 // Device Stock Distribution counts
 const stockDistribution = useMemo(() => {
 const types = ["Ace", "Mini", "Fastscan", "Go"];
 return types.map(type => {
 const inStock = warehouseStock.filter(d => d.type === type).length;
 const totalInRegion = regionalDevices.filter(d => d.type === type).length;
 return {
 type,
 inStock,
 total: totalInRegion,
 percent: totalInRegion > 0 ? Math.round((inStock / totalInRegion) * 100) : 0
 };
 });
 }, [warehouseStock, regionalDevices]);

 return (
 <div className="space-y-6">
 {/* Toast Alert */}
 {toast && (
 <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-slate-900 border border-sky-500/30 px-5 py-3.5 text-sm text-sky-400 shadow-2xl backdrop-blur-xl fade-in slide-in-from-bottom-5 ">
 <CheckCircle2 className="h-5 w-5 text-sky-400" />
 <span>{toast}</span>
 </div>
 )}

 <PageHeader
 title={userPlace ? `${userPlace} Warehouse Inventory` : "Global Warehouse Inventory"}
 action={
 hasPermission("inventory.manage") && (
 <button
 type="button"
 onClick={() => setAddModalOpen(true)}
 className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-950/20 "
 >
 <Plus className="h-4 w-4" />
 Check-in Stock
 </button>
 )
 }
 />

 {/* KPI Stats Cards */}
 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
 <StatCard
 label="Total Stock Items"
 value={stats.total}
 tone={toneMap.Total}
 icon={Boxes}
 />
 <StatCard
 label="Ready/Available"
 value={stats.available}
 tone={toneMap.InStock}
 icon={CheckCircle2}
 />
 <StatCard
 label="Deployed Assets"
 value={stats.deployed}
 tone={toneMap.Deployed}
 icon={Truck}
 />
 <StatCard
 label="Stock in Maintenance"
 value={stats.maintenance}
 tone={toneMap.Maintenance}
 icon={AlertTriangle}
 />
 <StatCard
 label="Low Battery Alert"
 value={stats.lowBattery}
 tone={toneMap.LowBattery}
 icon={Battery}
 />
 </div>

 <div className="grid gap-6 lg:grid-cols-3">
 {/* Left column: Stock Distribution and Quick Tasks */}
 <div className="space-y-6 lg:col-span-1">
 {/* Stock Distribution */}
 <Card className="glass-card">
 <CardHeader 
 title="Stock Distribution" 
 subtitle="Warehouse availability relative to overall region" 
 />
 <CardBody>
 <div className="space-y-4">
 {stockDistribution.map((item) => (
 <div key={item.type} className="space-y-1.5">
 <div className="flex items-center justify-between text-xs font-semibold">
 <span className="text-slate-350">{item.type} Modules</span>
 <span className="text-white">
 {item.inStock} <span className="text-slate-500">/ {item.total} in region ({item.percent}%)</span>
 </span>
 </div>
 <div className="h-2 w-full overflow-hidden rounded-full bg-slate-950/60 border border-slate-900">
 <div
 className="h-full rounded-full bg-gradient-to-r from-sky-500 to-sky-400 "
 style={{ width: `${item.percent}%` }}
 />
 </div>
 </div>
 ))}
 </div>
 </CardBody>
 </Card>

 {/* Quick Actions */}
 <Card className="glass-card">
 <CardHeader title="Warehouse Quick Info" subtitle="Operations directory configurations" />
 <CardBody className="text-sm text-slate-400 space-y-3 leading-relaxed">
 <p>
 As a <strong className="text-slate-200">Warehouse Manager</strong>, you oversee check-ins and field deployments for {userPlace || "global"} operations.
 </p>
 <div className="rounded-2xl bg-slate-950/60 border border-slate-900 p-3.5 text-xs flex flex-col gap-2">
 <div className="flex justify-between">
 <span className="text-slate-500 font-bold uppercase">Location</span>
 <span className="text-white font-semibold">{warehouseSiteName}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-slate-500 font-bold uppercase">Operational Manager</span>
 <span className="text-white font-semibold">Priya Nair</span>
 </div>
 <div className="flex justify-between">
 <span className="text-slate-500 font-bold uppercase">Region Code</span>
 <span className="text-sky-400 font-mono font-semibold">{userPlace ? `${userPlace.substring(0, 3).toUpperCase()}-WH` : "GLO-WH"}</span>
 </div>
 </div>
 </CardBody>
 </Card>
 </div>

 {/* Right column: Inventory Management List */}
 <div className="lg:col-span-2">
 <Card className="glass-card">
 <CardHeader
 title={
 <div className="flex items-center gap-4">
 <button
 onClick={() => setActiveTab("instock")}
 className={`text-sm font-semibold pb-1 border-b-2 ${
 activeTab === "instock" ? "border-emerald-500 text-emerald-400" : "border-transparent text-slate-400"
 }`}
 >
 Warehouse Stock ({warehouseStock.length})
 </button>
 <button
 onClick={() => setActiveTab("deployed")}
 className={`text-sm font-semibold pb-1 border-b-2 ${
 activeTab === "deployed" ? "border-sky-500 text-sky-400" : "border-transparent text-slate-400"
 }`}
 >
 Deployed Fields ({deployedAssets.length})
 </button>
 <button
 onClick={() => setActiveTab("all")}
 className={`text-sm font-semibold pb-1 border-b-2 ${
 activeTab === "all" ? "border-slate-500 text-white" : "border-transparent text-slate-400"
 }`}
 >
 All Regional ({regionalDevices.length})
 </button>
 </div>
 }
 subtitle="Perform stock checks, deploy modules, or return field items back to storage."
 />
 <CardBody>
 {/* Search & Filters */}
 <div className="flex flex-col gap-3 sm:flex-row mb-4">
 <div className="relative flex-1">
 <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
 <input
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Search device ID, name or location..."
 className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-2 pl-10 pr-4 text-sm text-slate-100 outline-none focus:border-sky-500/50"
 />
 </div>
 <div className="flex gap-2">
 <select
 value={typeFilter}
 onChange={(e) => setTypeFilter(e.target.value)}
 className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500/50"
 >
 <option value="all">All Types</option>
 {uniqueTypes.map((t) => (
 <option key={t} value={t}>
 {t}
 </option>
 ))}
 </select>
 <select
 value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value)}
 className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500/50"
 >
 <option value="all">All Statuses</option>
 <option value="Online">Online</option>
 <option value="Offline">Offline</option>
 <option value="Warning">Warning</option>
 <option value="Critical">Critical</option>
 <option value="Maintenance Required">Maintenance</option>
 </select>
 </div>
 </div>

 {/* Table */}
 <div className="overflow-x-auto">
 <table className="w-full min-w-[700px] text-left text-sm">
 <thead className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
 <tr>
 <th className="pb-3 pr-4 whitespace-nowrap">Device Info</th>
 <th className="pb-3 pr-4 whitespace-nowrap">Type</th>
 <th className="pb-3 pr-4 whitespace-nowrap">Location (CP)</th>
 <th className="pb-3 pr-4 whitespace-nowrap">Diagnostics</th>
 <th className="pb-3 pr-4 whitespace-nowrap">Status</th>
 <th className="pb-3 whitespace-nowrap">Actions</th>
 </tr>
 </thead>
 <tbody>
 {filteredItems.map((d) => (
 <tr key={d.id} className="border-b border-slate-800/60 hover:bg-slate-900/20 ">
 <td className="py-4 pr-4 whitespace-nowrap">
 <p className="font-semibold text-white">{d.id}</p>
 <p className="text-xs text-slate-500">FW: {d.firmware || "v1.0.0"}</p>
 </td>
 <td className="py-4 pr-4 text-slate-300 whitespace-nowrap">{d.type}</td>
 <td className="py-4 pr-4 text-slate-350 font-medium whitespace-nowrap">
 {d.site.toLowerCase().includes("warehouse") ? (
 <span className="text-emerald-400 inline-flex items-center gap-1">
 <Boxes className="h-3.5 w-3.5" />
 {d.site}
 </span>
 ) : (
 <span className="text-sky-400 inline-flex items-center gap-1">
 <Truck className="h-3.5 w-3.5" />
 {d.site}
 </span>
 )}
 </td>
 <td className="py-4 pr-4 whitespace-nowrap">
 <div className="flex items-center gap-2 text-xs text-slate-400">
 <span className="inline-flex items-center gap-0.5">
 <Battery className={`h-3.5 w-3.5 ${d.battery < 30 ? "text-rose-500" : "text-emerald-500"}`} />
 {d.battery}%
 </span>
 <span className="inline-flex items-center gap-0.5">
 <Wifi className="h-3.5 w-3.5 text-slate-500" />
 {d.connectivity}
 </span>
 </div>
 </td>
 <td className="py-4 pr-4 whitespace-nowrap">
 <Badge variant={deviceStatusVariant(d.status)}>{d.status}</Badge>
 </td>
 <td className="py-4 whitespace-nowrap">
 {hasPermission("inventory.manage") && (
 d.site.toLowerCase().includes("warehouse") ? (
 <button
 type="button"
 onClick={() => openDeployment(d)}
 className="flex items-center gap-1 rounded-xl bg-sky-600/10 px-3 py-1.5 text-xs font-semibold text-sky-400 hover:bg-sky-600 hover:text-white "
 >
 <ArrowUpRight className="h-3.5 w-3.5" />
 Deploy
 </button>
 ) : (
 <button
 type="button"
 onClick={() => handleCheckIn(d)}
 className="flex items-center gap-1 rounded-xl bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-900 hover:text-white "
 >
 <RotateCcw className="h-3.5 w-3.5" />
 Check-in
 </button>
 )
 )}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 {filteredItems.length === 0 && (
 <p className="py-12 text-center text-slate-500 text-sm">No items matching current filters found.</p>
 )}
 </div>
 </CardBody>
 </Card>
 </div>
 </div>

 {/* Deployment Allocation Modal */}
 {deployingDevice && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
 <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
 <h3 className="text-lg font-bold text-white mb-2">Deploy Device {deployingDevice.id}</h3>
 <p className="text-xs text-slate-400 mb-4">
 Allocate this {deployingDevice.type} module to an active field Charging Point (CP) site.
 </p>
 <form onSubmit={handleDeploySubmit} className="space-y-4">
 <div>
 <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
 Target CP Site Name
 </label>
 <input
 required
 placeholder="e.g. Mapusa Water Plant"
 value={targetSite}
 onChange={(e) => setTargetSite(e.target.value)}
 className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-sky-500/50 "
 />
 </div>
 <div className="flex justify-end gap-3 pt-2">
 <button
 type="button"
 onClick={() => setDeployingDevice(null)}
 className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-900 "
 >
 Cancel
 </button>
 <button
 type="submit"
 disabled={isSubmittingDeployment}
 className="rounded-2xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 shadow-lg shadow-sky-950/20 disabled:opacity-50"
 >
 {isSubmittingDeployment ? "Deploying..." : "Confirm Deployment"}
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* Add stock / Check-in Modal */}
 <AddDeviceModal
 open={addModalOpen}
 onClose={() => setAddModalOpen(false)}
 onSubmit={handleAddStock}
 />
 </div>
 );
}
