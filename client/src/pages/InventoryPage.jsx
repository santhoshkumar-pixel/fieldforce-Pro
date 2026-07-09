import { useMemo, useState, useEffect } from "react";
import { 
  Battery, 
  Plus, 
  Search, 
  Wifi, 
  Layers,
  Cpu, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertTriangle, 
  Boxes, 
  Truck, 
  RotateCcw,
  X,
  Edit2,
  Trash2,
  Eye,
  UserCheck,
  Wrench,
  FileText,
  Clock,
  Ban,
  HelpCircle,
  LayoutDashboard,
  Package
} from "lucide-react";
import AddDeviceModal from "../components/devices/AddDeviceModal";
import DeviceAssignmentModal from "../components/devices/DeviceAssignmentModal";
import DeviceMaintenanceModal from "../components/devices/DeviceMaintenanceModal";
import TicketDetailsModal from "../components/tickets/TicketDetailsModal";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import Badge from "../components/ui/Badge";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { useDevice } from "../context/DeviceContext";
import { useAuth } from "../context/AuthContext";
import { getUserPlace } from "../utils/roleHelpers";
import { api } from "../utils/api";
import CustomSelect from "../components/ui/CustomSelect";
import { useNavigate } from "react-router-dom";

const toneMap = {
  Total: "indigo",
  InStock: "emerald",
  Deployed: "violet",
  LowBattery: "rose"
};

const COMPONENT_CATEGORIES = [
  "Screens",
  "Batteries",
  "Sensors",
  "Cables",
  "Chargers",
  "Boards"
];

const parseDeviceIdsAndNames = (deviceIdStr, deviceNameStr) => {
  if (!deviceIdStr) return { devices: [], components: [] };
  const ids = String(deviceIdStr).split(",").map(id => id.trim()).filter(Boolean);
  const names = deviceNameStr ? String(deviceNameStr).split(",").map(n => n.trim()).filter(Boolean) : [];
  
  const parsedDevices = [];
  const parsedComponents = [];
  
  ids.forEach((id, index) => {
    const name = names[index] || id;
    const nameStr = String(name);
    if (id.startsWith("COMP-")) {
      const qtyMatch = id.match(/\((\d+)\)/);
      const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
      const cleanId = id.replace(/\s*\(\d+\)/, "");
      parsedComponents.push({
        id: cleanId,
        name: nameStr.replace(/\s*\(x\d+\)/, "").replace(/\s*\(\d+\)/, ""),
        qty
      });
    } else {
      parsedDevices.push({
        id,
        name: nameStr
      });
    }
  });
  
  return { devices: parsedDevices, components: parsedComponents };
};

const EMPTY_TICKET_MARKERS = new Set(["", "-", "NEW", String.fromCharCode(8212)]);

const isLinkedTicketId = (ticketId) => {
  const value = String(ticketId || "").trim();
  return Boolean(value) && !EMPTY_TICKET_MARKERS.has(value);
};

const parseUsablePastTime = (...values) => {
  const futureGraceMs = 24 * 60 * 60 * 1000;
  const latestAllowed = Date.now() + futureGraceMs;

  for (const value of values) {
    if (!value) continue;
    const time = new Date(value).getTime();
    if (Number.isFinite(time) && time <= latestAllowed) {
      return time;
    }
  }

  return 0;
};

const formatAssignmentDate = (ticket, fallback) => {
  const dateValue = ticket?.sentAt || ticket?.createdAt || fallback;
  const time = dateValue ? new Date(dateValue).getTime() : NaN;
  return Number.isFinite(time)
    ? new Date(time).toISOString().split("T")[0]
    : fallback || String.fromCharCode(8212);
};

const formatHistoryDateTime = (value) => {
  const time = value ? new Date(value).getTime() : NaN;
  return Number.isFinite(time) ? new Date(time).toLocaleString() : value || String.fromCharCode(8212);
};

const getNumericOrder = (value) => {
  const parsed = Number(value);
  if (Number.isFinite(parsed)) return parsed;
  const digits = String(value || "").match(/\d+/g);
  return digits ? Number(digits.join("")) : 0;
};

export default function InventoryPage() {
  const { devices: deviceList, addDevice, updateDevice, deleteDevice, refreshDevices } = useDevice();
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();

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

  // ─── Tabs State ────────────────────────────────────
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard" | "devices" | "components"

  // ─── Device states ─────────────────────────────────
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [assignDeviceTarget, setAssignDeviceTarget] = useState(null);
  const [maintenanceDeviceTarget, setMaintenanceDeviceTarget] = useState(null);
  const [editingDevice, setEditingDevice] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [toast, setToast] = useState(null);
  const [usageLogs, setUsageLogs] = useState([]);
  const [deviceAssignments, setDeviceAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [linkedTicket, setLinkedTicket] = useState(null);
  const [isLoadingLinkedTicket, setIsLoadingLinkedTicket] = useState(false);
  const [detailsModalTicket, setDetailsModalTicket] = useState(null);
  const [allTickets, setAllTickets] = useState([]);

  useEffect(() => {
    if (!selectedAssignment) {
      setLinkedTicket(null);
      return;
    }
    const tId = selectedAssignment.ticketId;
    if (tId && tId !== "—" && tId !== "NEW") {
      const found = allTickets.find(t => t.id === tId);
      if (found) {
        setLinkedTicket(found);
      } else {
        setIsLoadingLinkedTicket(true);
        api.tickets.getById(tId)
          .then(t => {
            if (t) setLinkedTicket(t);
          })
          .catch(err => console.error("Error fetching linked ticket:", err))
          .finally(() => setIsLoadingLinkedTicket(false));
      }
    } else {
      setLinkedTicket(null);
    }
  }, [selectedAssignment, allTickets]);

  const parsedHardware = useMemo(() => {
    if (!linkedTicket) return { devices: [], components: [] };
    return parseDeviceIdsAndNames(linkedTicket.deviceId, linkedTicket.deviceName);
  }, [linkedTicket]);

  // Dashboard sub-tab state (for the device list inside dashboard)
  const [dashTab, setDashTab] = useState("all"); // "all" | "goa" | "bhutan"
  const [dashStatusFilter, setDashStatusFilter] = useState("all"); // "all" | "available" | "deployed"
  const [deployingDevice, setDeployingDevice] = useState(null);
  const [targetSite, setTargetSite] = useState("");
  const [isSubmittingDeployment, setIsSubmittingDeployment] = useState(false);

  // ─── Component (Spare Parts) States ────────────────
  const [components, setComponents] = useState([]);
  const [loadingComponents, setLoadingComponents] = useState(false);
  const [componentsError, setComponentsError] = useState(null);
  const [componentsSearch, setComponentsSearch] = useState("");
  const [componentsRegionFilter, setComponentsRegionFilter] = useState("all");
  const [componentsStatusFilter, setComponentsStatusFilter] = useState("all");
  const [componentsCategoryFilter, setComponentsCategoryFilter] = useState("all");
  const [addComponentOpen, setAddComponentOpen] = useState(false);
  const [newCompData, setNewCompData] = useState({ name: "", category: "Screens", quantity: 0, minLimit: 5, warehouse: "Goa Warehouse", region: "Goa" });
  const [editingComponent, setEditingComponent] = useState(null);
  const [editCompData, setEditCompData] = useState({});
  const [adjustTarget, setAdjustTarget] = useState(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustNote, setAdjustNote] = useState("");
  const [logUsageTarget, setLogUsageTarget] = useState(null);
  const [usageQty, setUsageQty] = useState(1);
  const [usageNote, setUsageNote] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadAssignmentsAndLogs = async () => {
    try {
      const [logs, assigns, tix] = await Promise.all([
        api.components.getUsageLogs().catch(() => []),
        api.devices.getAssignments().catch(() => []),
        api.tickets.getAll().catch(() => [])
      ]);
      setUsageLogs(logs || []);
      setDeviceAssignments(assigns || []);
      setAllTickets(tix || []);
    } catch (err) {
      console.error("Failed to load assignments or usage logs:", err);
    }
  };

  // ─── Load components ────────────────────────────────
  const loadComponents = async () => {
    setLoadingComponents(true);
    setComponentsError(null);
    try {
      const data = await api.components.getAll();
      if (data && data.error) {
        throw new Error(data.error);
      }
      if (!Array.isArray(data)) {
        throw new Error("Components inventory response is not in a valid list format.");
      }
      // ── Client-side de-duplication: merge any duplicate name+region rows ──
      const merged = [];
      data.forEach((c) => {
        if (!c || !c.name) return;
        const cNameClean = String(c.name).trim().toLowerCase();
        const cRegionClean = String(c.region || "").trim().toLowerCase();
        const existing = merged.find(
          (m) =>
            m && m.name &&
            String(m.name).trim().toLowerCase() === cNameClean &&
            String(m.region || "").trim().toLowerCase() === cRegionClean
        );
        if (existing) {
          existing.quantity = (existing.quantity || 0) + (c.quantity || 0);
          existing.status =
            existing.quantity <= 0
              ? "Out of Stock"
              : existing.quantity < existing.minLimit
              ? "Low Stock"
              : "In Stock";
        } else {
          merged.push({ ...c });
        }
      });
      setComponents(merged);
      await loadAssignmentsAndLogs();
    } catch (err) {
      console.error("Failed to load components:", err);
      setComponentsError(err.message || "Unable to load components from the warehouse API.");
    } finally {
      setLoadingComponents(false);
    }
  };

  useEffect(() => {
    loadComponents();
  }, []);

  // ─── Helper: resolve region from role ──────────────
  const getResolvedUserRegion = () => userPlace || "Goa";

  // ─── Dashboard KPI stats (all regional devices) ────────────
  const stats = useMemo(() => {
    const total = regionalDevices.length;
    const available = regionalDevices.filter(d => d.status === "Available" || d.status === "Online").length;
    const assigned = regionalDevices.filter(d => d.status === "Assigned").length;
    const damaged = regionalDevices.filter(d => d.status === "Damaged").length;
    const lost = regionalDevices.filter(d => d.status === "Lost" || d.status === "Offline").length;
    return { total, available, assigned, damaged, lost };
  }, [regionalDevices]);

  // ─── Stock Distribution (for dashboard) ────────────
  const stockDistribution = useMemo(() => {
    const types = ["ACE", "GO", "MINI", "Fastscan"];
    return types.map(type => {
      const inStock = warehouseStock.filter(d => d.type === type || d.name?.toUpperCase().includes(type)).length;
      const totalInRegion = regionalDevices.filter(d => d.type === type || d.name?.toUpperCase().includes(type)).length;
      return {
        type,
        inStock,
        total: totalInRegion,
        percent: totalInRegion > 0 ? Math.round((inStock / totalInRegion) * 100) : 0
      };
    });
  }, [warehouseStock, regionalDevices]);

  // ─── Device type/status filter options ─────────────
  const uniqueTypes = useMemo(() => {
    const types = regionalDevices.map((d) => d.type).filter(Boolean);
    return Array.from(new Set(types)).sort();
  }, [regionalDevices]);

  const typeOptions = useMemo(() => [
    { value: "all", label: "All Types" },
    ...uniqueTypes.map((t) => ({ value: t, label: t })),
  ], [uniqueTypes]);

  const statusOptions = useMemo(() => [
    { value: "all", label: "All Statuses" },
    { value: "Available", label: "Available" },
    { value: "Assigned", label: "Assigned" },
    { value: "Online", label: "Online" },
    { value: "Offline", label: "Offline" },
    { value: "Lost", label: "Lost" },
    { value: "Damaged", label: "Damaged" },
  ], []);

  // ─── Device filtered list ───────────────────────────
  const filteredDevices = useMemo(() => {
    return regionalDevices.filter((d) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        d.id?.toLowerCase().includes(q) ||
        d.name?.toLowerCase().includes(q) ||
        d.type?.toLowerCase().includes(q) ||
        d.assignedToName?.toLowerCase().includes(q) ||
        d.status?.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || d.status === statusFilter;
      const matchesType = typeFilter === "all" || d.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [regionalDevices, search, statusFilter, typeFilter]);

  // ─── Dashboard device list (region sub-tab) ──────────
  const goaDevices = useMemo(() => {
    return deviceList.filter(d => {
      if (!d?.site) return false;
      const nonGoaSites = ["San Jose HQ", "Frankfurt Data Center", "Singapore Tech Hub", "Sydney Terminal", "São Paulo Solar Hub", "London Operations Center"];
      return !nonGoaSites.includes(d.site) && !d.site.toLowerCase().includes("bhutan") && !d.site.toLowerCase().includes("thimphu") && !d.site.toLowerCase().includes("paro");
    });
  }, [deviceList]);

  const bhutanDevices = useMemo(() => {
    return deviceList.filter(d => {
      if (!d?.site) return false;
      return d.site.toLowerCase().includes("bhutan") || d.site.toLowerCase().includes("thimphu") || d.site.toLowerCase().includes("paro");
    });
  }, [deviceList]);

  const dashCurrentList = useMemo(() => {
    if (dashTab === "goa") return goaDevices;
    if (dashTab === "bhutan") return bhutanDevices;
    return deviceList; // "all"
  }, [dashTab, deviceList, goaDevices, bhutanDevices]);

  const filteredDashItems = useMemo(() => {
    return dashCurrentList.filter((d) => {
      const q = search.toLowerCase();
      const matchSearch = !q || d.id?.toLowerCase().includes(q) || d.name?.toLowerCase().includes(q) || d.site?.toLowerCase().includes(q);
      const matchStatus =
        dashStatusFilter === "all" ||
        (dashStatusFilter === "available" && (d.status === "Available" || d.status === "Online")) ||
        (dashStatusFilter === "assigned" && d.status === "Assigned") ||
        (dashStatusFilter === "damaged" && d.status === "Damaged") ||
        (dashStatusFilter === "lost" && (d.status === "Lost" || d.status === "Offline"));
      return matchSearch && matchStatus;
    });
  }, [dashCurrentList, search, dashStatusFilter]);

  // ─── Component stats ────────────────────────────────
  const componentStats = useMemo(() => {
    const filtered = components.filter(c => user?.role === "Super Admin" || c.region === getResolvedUserRegion());
    const goaStock = filtered.filter(c => c.region === "Goa").reduce((s, c) => s + c.quantity, 0);
    const bhutanStock = filtered.filter(c => c.region === "Bhutan").reduce((s, c) => s + c.quantity, 0);
    return {
      total: filtered.length,
      lowStock: filtered.filter(c => c.quantity < c.minLimit).length,
      goaStock,
      bhutanStock,
    };
  }, [components, user]);

  const filteredComponents = useMemo(() => {
    const regionFiltered = user?.role === "Super Admin"
      ? components
      : components.filter(c => c.region === getResolvedUserRegion());
    return regionFiltered.filter(c => {
      const q = componentsSearch.toLowerCase();
      const matchSearch = !q || c.name?.toLowerCase().includes(q) || c.category?.toLowerCase().includes(q);
      const matchRegion = componentsRegionFilter === "all" || c.region === componentsRegionFilter;
      const matchStatus = componentsStatusFilter === "all" ||
        (componentsStatusFilter === "Low Stock" && c.quantity < c.minLimit) ||
        (componentsStatusFilter === "In Stock" && c.quantity >= c.minLimit);
      const matchCategory = componentsCategoryFilter === "all" || c.category === componentsCategoryFilter;
      return matchSearch && matchRegion && matchStatus && matchCategory;
    });
  }, [components, user, componentsSearch, componentsRegionFilter, componentsStatusFilter, componentsCategoryFilter]);

  // ─── Device Handlers ───────────────────────────────
  const handleAddStock = async (data) => {
    const newDevice = { ...data, site: warehouseSiteName };
    await addDevice(newDevice);
    showToast(`New device checked into ${warehouseSiteName}`);
  };

  const handleDeploySubmit = async (e) => {
    e.preventDefault();
    if (!targetSite.trim() || !deployingDevice) return;
    setIsSubmittingDeployment(true);
    try {
      await api.devices.update(deployingDevice.id, { ...deployingDevice, site: targetSite.trim(), lastSync: "Just now" });
      setDeployingDevice(null);
      refreshDevices();
      showToast(`Device ${deployingDevice.id} deployed to ${targetSite}`);
    } catch (err) {
      showToast("Error deploying device");
    } finally {
      setIsSubmittingDeployment(false);
    }
  };

  const handleCheckIn = async (device) => {
    try {
      await api.devices.update(device.id, { ...device, site: warehouseSiteName, status: "Online", lastSync: "Just now" });
      refreshDevices();
      showToast(`Device ${device.id} checked back into ${warehouseSiteName}`);
    } catch (err) {
      showToast("Error checking in device");
    }
  };

  const handleReturnDevice = async (device) => {
    try {
      await api.devices.return(device.id, {});
      refreshDevices();
      showToast(`Device ${device.id} returned successfully`);
    } catch (err) {
      showToast("Error returning device");
    }
  };

  const handleAssignDevice = async (assignData) => {
    if (!assignDeviceTarget) return;
    try {
      await api.devices.assign(assignDeviceTarget.id, assignData);
      setAssignDeviceTarget(null);
      refreshDevices();
      showToast(`Device ${assignDeviceTarget.id} assigned to ${assignData.assigneeName}`);
    } catch (err) {
      showToast("Error assigning device: " + err.message);
    }
  };

  const handleMaintenanceSubmit = async (data) => {
    if (!maintenanceDeviceTarget) return;
    try {
      await api.devices.requestMaintenance(maintenanceDeviceTarget.id, data);
      setMaintenanceDeviceTarget(null);
      refreshDevices();
      showToast(`Maintenance requested for ${maintenanceDeviceTarget.id}`);
    } catch (err) {
      showToast("Error requesting maintenance");
    }
  };

  const startEditing = (device) => {
    setEditingDevice(device);
    setEditFormData({
      name: device.name || "",
      type: device.type || "ACE",
      status: device.status || "Available",
      firmware: device.firmware || "",
      purchaseDate: device.purchaseDate || "",
      warrantyExpiryDate: device.warrantyExpiryDate || "",
    });
  };

  const handleEditDeviceSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.devices.update(editingDevice.id, { ...editingDevice, ...editFormData });
      setEditingDevice(null);
      refreshDevices();
      showToast(`Device ${editingDevice.id} updated`);
    } catch (err) {
      showToast("Error updating device");
    }
  };

  const handleDeleteDevice = async (id) => {
    if (!window.confirm(`Delete device ${id}?`)) return;
    try {
      await api.devices.delete(id);
      refreshDevices();
      showToast(`Device ${id} deleted`);
    } catch (err) {
      showToast("Error deleting device");
    }
  };

  // ─── Component Handlers ────────────────────────────
  const handleAddComponent = async (e) => {
    e.preventDefault();
    try {
      const incomingName = (newCompData.name || "").trim().toLowerCase();
      const incomingRegion = (newCompData.region || "").trim().toLowerCase();

      // ── De-duplication check: if same name + region exists, merge quantity ──
      const duplicate = components.find(
        (c) =>
          c && c.name &&
          String(c.name).trim().toLowerCase() === incomingName &&
          String(c.region || "").trim().toLowerCase() === incomingRegion
      );

      if (duplicate) {
        const mergedQty = (duplicate.quantity || 0) + (newCompData.quantity || 0);
        const mergedMinLimit = newCompData.minLimit != null ? newCompData.minLimit : duplicate.minLimit;
        await api.components.update(duplicate.id, {
          ...duplicate,
          quantity: mergedQty,
          minLimit: mergedMinLimit,
          status:
            mergedQty <= 0
              ? "Out of Stock"
              : mergedQty < mergedMinLimit
              ? "Low Stock"
              : "In Stock",
          lastUpdated: new Date().toISOString().split("T")[0],
        });
        await loadComponents();
        setAddComponentOpen(false);
        showToast(
          `${duplicate.name} (${duplicate.region}) already exists — quantity updated to ${mergedQty}`
        );
        return;
      }

      await api.components.create({ ...newCompData, name: newCompData.name.trim() });
      await loadComponents();
      setAddComponentOpen(false);
      showToast(`${newCompData.name} added to inventory`);
    } catch (err) {
      showToast("Error adding component: " + err.message);
    }
  };

  const handleEditComponent = async (e) => {
    e.preventDefault();
    try {
      await api.components.update(editingComponent.id, editCompData);
      await loadComponents();
      setEditingComponent(null);
      showToast(`${editCompData.name} updated`);
    } catch (err) {
      showToast("Error updating component");
    }
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    try {
      await api.components.adjustStock(adjustTarget.id, { quantityChange: parseInt(adjustQty), note: adjustNote });
      await loadComponents();
      setAdjustTarget(null);
      setAdjustQty(0);
      setAdjustNote("");
      showToast(`Stock adjusted for ${adjustTarget.name}`);
    } catch (err) {
      showToast("Error adjusting stock");
    }
  };

  const handleLogUsage = async (e) => {
    e.preventDefault();
    try {
      await api.components.logUsage(logUsageTarget.id, { quantityUsed: parseInt(usageQty), notes: usageNote });
      await loadComponents();
      setLogUsageTarget(null);
      setUsageQty(1);
      setUsageNote("");
      showToast(`Usage logged for ${logUsageTarget.name}`);
    } catch (err) {
      showToast("Error logging usage");
    }
  };

  const handleDeleteComponent = async (id) => {
    if (!window.confirm("Delete this component?")) return;
    try {
      await api.components.delete(id);
      await loadComponents();
      showToast("Component deleted");
    } catch (err) {
      showToast("Error deleting component");
    }
  };

  const handleOpenComponentHistory = (component) => {
    navigate(`/inventory/component-history/${component.id}`, { state: { component } });
  };

  const handleOpenHistoryTicket = async (ticketId) => {
    const existing = allTickets.find((t) => t.id === ticketId);
    if (existing) {
      setDetailsModalTicket(existing);
      return;
    }

    try {
      const ticket = await api.tickets.getById(ticketId);
      if (ticket) {
        setDetailsModalTicket(ticket);
      }
    } catch (err) {
      showToast("Unable to load ticket details");
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-slate-900 border border-sky-500/30 px-5 py-3.5 text-sm text-sky-400 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="h-5 w-5 text-sky-400" />
          <span>{toast}</span>
        </div>
      )}

      <PageHeader title="Warehouse System" />

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-800 pb-px gap-1">
        {[
          { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
          { id: "components", label: "Components Inventory", icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 px-1 mr-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "border-sky-500 text-sky-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ──────────── TAB: DASHBOARD ──────────── */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* KPI Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Devices"
              value={stats.total}
              tone="indigo"
              icon={Cpu}
              onClick={() => {
                setDashTab("all");
                setDashStatusFilter("all");
                setSearch("");
              }}
            />
            <StatCard
              label="Available"
              value={stats.available}
              tone="emerald"
              icon={CheckCircle2}
              onClick={() => {
                setDashTab("all");
                setDashStatusFilter("available");
                setSearch("");
              }}
            />
            <StatCard
              label="Damaged"
              value={stats.damaged}
              tone="rose"
              icon={AlertTriangle}
              onClick={() => {
                setDashTab("all");
                setDashStatusFilter("damaged");
                setSearch("");
              }}
            />
            <StatCard
              label="Lost / Offline"
              value={stats.lost}
              tone="rose"
              icon={Ban}
              onClick={() => {
                setDashTab("all");
                setDashStatusFilter("lost");
                setSearch("");
              }}
            />
          </div>



          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left column */}
            <div className="space-y-6 lg:col-span-1">
              {/* Stock Distribution */}
              <Card className="glass-card">
                <CardHeader title="Stock Distribution" subtitle="Warehouse availability relative to overall region" />
                <CardBody>
                  <div className="space-y-4">
                    {stockDistribution.map((item) => (
                      <div key={item.type} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-350">{item.type} Modules</span>
                          <span className="text-slate-100">
                            {item.inStock} <span className="text-slate-500">/ {item.total} in region ({item.percent}%)</span>
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-950/60 border border-slate-900">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-sky-500 to-sky-400"
                            style={{ width: `${item.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>

              {/* Warehouse Quick Info */}
              <Card className="glass-card">
                <CardHeader title="Warehouse Quick Info" subtitle="Operations directory configurations" />
                <CardBody className="text-sm text-slate-400 space-y-3 leading-relaxed">
                  <p>
                    As a <strong className="text-slate-200">Warehouse Manager</strong>, you oversee check-ins and field deployments for {userPlace || "global"} operations.
                  </p>
                  <div className="rounded-2xl bg-slate-950/60 border border-slate-900 p-3.5 text-xs flex flex-col gap-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-bold uppercase">Location</span>
                      <span className="text-slate-100 font-semibold">{warehouseSiteName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-bold uppercase">Region</span>
                      <span className="text-slate-100 font-semibold">{userPlace || "Global"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-bold uppercase">Region Code</span>
                      <span className="text-sky-400 font-mono font-semibold">{userPlace ? `${userPlace.substring(0, 3).toUpperCase()}-WH` : "GLO-WH"}</span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Right column: Device list with sub-tabs */}
            <div className="lg:col-span-2">
              <Card className="glass-card">
                <CardHeader
                  title={
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setDashTab("all")}
                        className={`text-sm font-semibold pb-1 border-b-2 cursor-pointer ${dashTab === "all" ? "border-sky-500 text-sky-400" : "border-transparent text-slate-400"}`}
                      >
                        All Regions ({regionalDevices.length})
                      </button>
                      <button
                        onClick={() => setDashTab("goa")}
                        className={`text-sm font-semibold pb-1 border-b-2 cursor-pointer ${dashTab === "goa" ? "border-emerald-500 text-emerald-400" : "border-transparent text-slate-400"}`}
                      >
                        Goa ({goaDevices.length})
                      </button>
                      <button
                        onClick={() => setDashTab("bhutan")}
                        className={`text-sm font-semibold pb-1 border-b-2 cursor-pointer ${dashTab === "bhutan" ? "border-violet-500 text-violet-400" : "border-transparent text-slate-400"}`}
                      >
                        Bhutan ({bhutanDevices.length})
                      </button>
                    </div>
                  }
                  subtitle="Perform stock checks, deploy modules, or return field items back to storage."
                />
                <CardBody>
                  {/* Search */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search device ID, name or location..."
                      className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-2 pl-10 pr-4 text-sm text-slate-100 outline-none focus:border-sky-500/50"
                    />
                  </div>
                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[950px] text-left text-sm">
                      <thead className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="pb-3 pr-4 whitespace-nowrap">Device ID</th>
                          <th className="pb-3 pr-4 whitespace-nowrap">Model Name</th>
                          <th className="pb-3 pr-4 whitespace-nowrap">Type</th>
                          <th className="pb-3 pr-4 whitespace-nowrap">Current Holder</th>
                          <th className="pb-3 pr-4 whitespace-nowrap">Location</th>
                          <th className="pb-3 pr-4 whitespace-nowrap">Status</th>
                          <th className="pb-3 whitespace-nowrap text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDashItems.map((d) => (
                          <tr key={d.id} className="border-b border-slate-800/60 hover:bg-slate-900/20">
                            <td className="py-3.5 pr-4 whitespace-nowrap font-mono font-bold">
                              <button
                                type="button"
                                onClick={() => navigate(`/devices/${d.id}`)}
                                className="text-sky-400 hover:underline hover:text-sky-300"
                              >
                                {d.id}
                              </button>
                            </td>
                            <td className="py-3.5 pr-4 font-semibold text-slate-200 whitespace-nowrap">{d.name}</td>
                            <td className="py-3.5 pr-4 text-slate-400 whitespace-nowrap">{d.type}</td>
                            <td className="py-3.5 pr-4 whitespace-nowrap">
                              {d.assignedToName ? (
                                <div className="flex flex-col">
                                  <span className="font-semibold text-slate-200">{d.assignedToName}</span>
                                  <span className="text-[10px] text-slate-500 uppercase">{d.assignedToType}</span>
                                </div>
                              ) : (
                                <span className="text-slate-600">Unassigned</span>
                              )}
                            </td>
                            <td className="py-3.5 pr-4 whitespace-nowrap">
                              {d.site?.toLowerCase().includes("warehouse") ? (
                                <span className="text-emerald-400 inline-flex items-center gap-1 text-xs">
                                  <Boxes className="h-3.5 w-3.5" />
                                  {d.site}
                                </span>
                              ) : (
                                <span className="text-sky-400 inline-flex items-center gap-1 text-xs">
                                  <Truck className="h-3.5 w-3.5" />
                                  {d.site}
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 pr-4 whitespace-nowrap">
                              <Badge variant={d.status === "Available" || d.status === "Online" ? "success" : d.status === "Assigned" ? "info" : "danger"}>
                                {d.status}
                              </Badge>
                            </td>
                            <td className="py-3.5 whitespace-nowrap text-right">
                              {hasPermission("inventory.manage") && (
                                <div className="flex items-center justify-end gap-1.5">
                                  {d.site?.toLowerCase().includes("warehouse") && (
                                    <>


                                    </>
                                  )}
                                  {(d.status === "Lost" || d.status === "Damaged" || d.status === "Offline") && (
                                    <button
                                      type="button"
                                      onClick={() => handleReturnDevice(d)}
                                      title="Return from field to warehouse"
                                      className="rounded-xl bg-violet-500/10 px-2.5 py-1.5 text-xs font-semibold text-violet-400 hover:bg-violet-500 hover:text-white"
                                    >
                                      Return
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => startEditing(d)}
                                    title="Edit device"
                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteDevice(d.id)}
                                    title="Delete device"
                                    className="rounded-lg p-1.5 text-rose-400 hover:bg-rose-500/10"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                        {filteredDashItems.length === 0 && (
                          <tr>
                            <td colSpan={9} className="py-10 text-center text-slate-500 text-sm">No items found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      )}


      {/* ──────────── TAB: COMPONENTS INVENTORY ──────────── */}
      {activeTab === "components" && (
        <div className="space-y-6">
          {componentsError ? (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-8 text-center max-w-xl mx-auto mt-10">
              <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto mb-4" />
              <h4 className="text-base font-bold text-slate-100 mb-2">Failed to Load Components Inventory</h4>
              <p className="text-sm text-slate-450 mb-6">{componentsError}</p>
              <button
                onClick={loadComponents}
                className="rounded-2xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 transition cursor-pointer"
              >
                Retry Loading
              </button>
            </div>
          ) : (
            <>
              {/* KPI Dashboard */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Total Spare Parts" value={componentStats.total} tone="indigo" icon={Boxes} onClick={() => { setComponentsSearch(""); setComponentsRegionFilter("all"); setComponentsStatusFilter("all"); setComponentsCategoryFilter("all"); }} />
                <StatCard label="Low Stock Items" value={componentStats.lowStock} tone={componentStats.lowStock > 0 ? "rose" : "emerald"} icon={AlertTriangle} onClick={() => setComponentsStatusFilter("Low Stock")} />
                <StatCard label="Goa Stock (units)" value={componentStats.goaStock} tone="sky" icon={CheckCircle2} onClick={() => { if (user?.role === "Super Admin" || getResolvedUserRegion() === "Goa") setComponentsRegionFilter("Goa"); }} />
                <StatCard label="Bhutan Stock (units)" value={componentStats.bhutanStock} tone="violet" icon={CheckCircle2} onClick={() => { if (user?.role === "Super Admin" || getResolvedUserRegion() === "Bhutan") setComponentsRegionFilter("Bhutan"); }} />
              </div>

              {/* Low Stock Warning */}
              {components.some(c => c.name && (c.quantity || 0) < (c.minLimit || 5)) && (
                <div className="flex gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-rose-450">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />
                  <div>
                    <h5 className="font-semibold text-sm text-rose-400">Low Stock Alert</h5>
                    <p className="text-xs mt-0.5 text-rose-400/80">
                      The following components are running low:{" "}
                      {components.filter(c => c.name && (c.quantity || 0) < (c.minLimit || 5)).map(c => `${c.name} (${c.quantity || 0})`).join(", ")}
                    </p>
                  </div>
                </div>
              )}

          <Card className="glass-card">
            <CardHeader
              title="Spare Parts Inventory"
              subtitle="Track and manage individual device components across region warehouses."
              action={
                (user?.role === "Super Admin" || user?.role === "Warehouse Manager") && (
                  <button
                    type="button"
                    onClick={() => {
                      const resolvedRegion = getResolvedUserRegion();
                      setNewCompData({
                        name: "",
                        category: "Screens",
                        quantity: 0,
                        minLimit: 5,
                        warehouse: user?.role === "Warehouse Manager" ? (resolvedRegion === "Goa" ? "Goa Warehouse" : "Bhutan Warehouse") : "Goa Warehouse",
                        region: user?.role === "Warehouse Manager" ? resolvedRegion : "Goa"
                      });
                      setAddComponentOpen(true);
                    }}
                    className="flex items-center gap-2 rounded-2xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 shadow-lg shadow-sky-950/20 transition-all cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    Add Component
                  </button>
                )
              }
            />
            <CardBody>
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 animate-none pointer-events-none" />
                  <input
                    value={componentsSearch}
                    onChange={(e) => setComponentsSearch(e.target.value)}
                    placeholder="Search spare part name or category..."
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-slate-100 outline-none focus:border-sky-500/50"
                  />
                </div>
                {user?.role === "Super Admin" && (
                  <CustomSelect
                    value={componentsRegionFilter}
                    onChange={(e) => setComponentsRegionFilter(e.target.value)}
                    options={[{ value: "all", label: "All Regions" }, { value: "Goa", label: "Goa" }, { value: "Bhutan", label: "Bhutan" }]}
                    className="text-slate-100 !px-3 !py-2.5 !rounded-2xl !border-slate-700 bg-slate-950 text-sm font-normal"
                    dropdownClassName="bg-slate-950 border-slate-700 text-sm font-normal w-full"
                    containerClassName="w-full sm:w-36"
                    fullWidth
                  />
                )}
                <CustomSelect
                  value={componentsStatusFilter}
                  onChange={(e) => setComponentsStatusFilter(e.target.value)}
                  options={[{ value: "all", label: "All Stock" }, { value: "Low Stock", label: "Low Stock" }, { value: "In Stock", label: "In Stock" }]}
                  className="text-slate-100 !px-3 !py-2.5 !rounded-2xl !border-slate-700 bg-slate-950 text-sm font-normal"
                  dropdownClassName="bg-slate-950 border-slate-700 text-sm font-normal w-full"
                  containerClassName="w-full sm:w-36"
                  fullWidth
                />
                <CustomSelect
                  value={componentsCategoryFilter}
                  onChange={(e) => setComponentsCategoryFilter(e.target.value)}
                  options={[{ value: "all", label: "All Categories" }, ...COMPONENT_CATEGORIES.map(c => ({ value: c, label: c }))]}
                  className="text-slate-100 !px-3 !py-2.5 !rounded-2xl !border-slate-700 bg-slate-950 text-sm font-normal"
                  dropdownClassName="bg-slate-950 border-slate-700 text-sm font-normal w-full"
                  containerClassName="w-full sm:w-40"
                  fullWidth
                />
              </div>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[750px] text-left text-sm">
                  <thead className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="pb-3 pr-4 whitespace-nowrap">Component</th>
                      <th className="pb-3 pr-4 whitespace-nowrap">Category</th>
                      <th className="pb-3 pr-4 whitespace-nowrap">Warehouse</th>
                      <th className="pb-3 pr-4 whitespace-nowrap">Region</th>
                      <th className="pb-3 pr-4 whitespace-nowrap">Qty</th>
                      <th className="pb-3 pr-4 whitespace-nowrap">Min Limit</th>
                      <th className="pb-3 pr-4 whitespace-nowrap">Stock Status</th>
                      {(user?.role === "Super Admin" || user?.role === "Warehouse Manager") && (
                        <th className="pb-3 whitespace-nowrap text-right">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredComponents.map((c) => (
                      <tr key={c.id} className="border-b border-slate-800/60 hover:bg-slate-900/20">
                        <td className="py-4 pr-4 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenComponentHistory(c)}
                            className="font-semibold text-slate-100 hover:text-sky-400 hover:underline"
                            title="View component history"
                          >
                            {c.name}
                          </button>
                        </td>
                        <td className="py-4 pr-4 text-slate-400 whitespace-nowrap">{c.category}</td>
                        <td className="py-4 pr-4 text-slate-400 whitespace-nowrap">{c.warehouse}</td>
                        <td className="py-4 pr-4 whitespace-nowrap">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${c.region === "Goa" ? "bg-sky-500/15 text-sky-400" : "bg-violet-500/15 text-violet-400"}`}>
                            {c.region}
                          </span>
                        </td>
                        <td className="py-4 pr-4 font-bold whitespace-nowrap">
                          <span className={c.quantity < c.minLimit ? "text-rose-400" : "text-emerald-400"}>{c.quantity}</span>
                        </td>
                        <td className="py-4 pr-4 text-slate-500 whitespace-nowrap">{c.minLimit}</td>
                        <td className="py-4 pr-4 whitespace-nowrap">
                          <Badge variant={c.quantity < c.minLimit ? "danger" : "success"}>
                            {c.quantity < c.minLimit ? "Low Stock" : "In Stock"}
                          </Badge>
                        </td>
                        {(user?.role === "Super Admin" || user?.role === "Warehouse Manager") && (
                          <td className="py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => { setEditingComponent(c); setEditCompData({ name: c.name, category: c.category, minLimit: c.minLimit, warehouse: c.warehouse, region: c.region }); }}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                                title="Edit"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => { setAdjustTarget(c); setAdjustQty(0); setAdjustNote(""); }}
                                className="rounded-xl bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500 hover:text-white"
                                title="Adjust Stock"
                              >
                                Adjust
                              </button>
                              <button
                                type="button"
                                onClick={() => { setLogUsageTarget(c); setUsageQty(1); setUsageNote(""); }}
                                className="rounded-xl bg-sky-500/10 px-2.5 py-1.5 text-xs font-semibold text-sky-400 hover:bg-sky-500 hover:text-white"
                                title="Log Usage"
                              >
                                Use
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteComponent(c.id)}
                                className="rounded-lg p-1.5 text-rose-400 hover:bg-rose-500/10"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                    {filteredComponents.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500">No components found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {loadingComponents && (
                <p className="text-center text-slate-500 text-sm py-6">Loading spare parts...</p>
              )}
            </CardBody>
          </Card>
        </>
        )}
        </div>
      )}

      {/* ══════ MODALS ══════ */}

      {/* Deployment Modal (Dashboard) */}
      {deployingDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-slate-100 mb-2">Deploy Device {deployingDevice.id}</h3>
            <p className="text-xs text-slate-400 mb-4">Allocate this {deployingDevice.type} module to an active field site.</p>
            <form onSubmit={handleDeploySubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">Target Site Name</label>
                <input
                  required
                  placeholder="e.g. Mapusa Water Plant"
                  value={targetSite}
                  onChange={(e) => setTargetSite(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-sky-500/50"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setDeployingDevice(null)} className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-900">Cancel</button>
                <button type="submit" disabled={isSubmittingDeployment} className="rounded-2xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 shadow-lg disabled:opacity-50">
                  {isSubmittingDeployment ? "Deploying..." : "Confirm Deployment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Device */}
      {editingDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-lg font-bold text-slate-100">Edit Device {editingDevice.id}</h3>
              <button onClick={() => setEditingDevice(null)} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEditDeviceSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase block mb-1">Name</label>
                  <input required value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase block mb-1">Type (Model)</label>
                  <select value={editFormData.type} onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none">
                    <option value="ACE">ACE</option>
                    <option value="GO">GO</option>
                    <option value="MINI">MINI</option>
                    <option value="Fastscan">Fastscan</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase block mb-1">Firmware</label>
                  <input value={editFormData.firmware} onChange={(e) => setEditFormData({ ...editFormData, firmware: e.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase block mb-1">Status</label>
                  <select value={editFormData.status} onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none">
                    <option value="Available">Available</option>
                    <option value="Online">Online</option>
                    <option value="Lost">Lost</option>
                    <option value="Damaged">Damaged</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setEditingDevice(null)} className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-900">Cancel</button>
                <button type="submit" className="rounded-2xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 shadow-lg">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Component */}
      {addComponentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-lg font-bold text-slate-100">Add Spare Part</h3>
              <button onClick={() => setAddComponentOpen(false)} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddComponent} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-300 uppercase block mb-1">Component Name</label>
                  <input required value={newCompData.name} onChange={(e) => setNewCompData({ ...newCompData, name: e.target.value })} placeholder="e.g. LCD Screen 7-inch" className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase block mb-1">Category</label>
                  <select value={newCompData.category} onChange={(e) => setNewCompData({ ...newCompData, category: e.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none">
                    {COMPONENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {user?.role === "Super Admin" ? (
                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase block mb-1">Region</label>
                    <select value={newCompData.region} onChange={(e) => setNewCompData({ ...newCompData, region: e.target.value, warehouse: e.target.value === "Goa" ? "Goa Warehouse" : "Bhutan Warehouse" })} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none">
                      <option value="Goa">Goa</option>
                      <option value="Bhutan">Bhutan</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase block mb-1">Region</label>
                    <input value={newCompData.region} disabled className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-400 outline-none" />
                  </div>
                )}
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase block mb-1">Initial Quantity</label>
                  <input type="number" min="0" value={newCompData.quantity} onChange={(e) => setNewCompData({ ...newCompData, quantity: parseInt(e.target.value) || 0 })} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase block mb-1">Min Stock Limit</label>
                  <input type="number" min="0" value={newCompData.minLimit} onChange={(e) => setNewCompData({ ...newCompData, minLimit: parseInt(e.target.value) || 0 })} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setAddComponentOpen(false)} className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-900">Cancel</button>
                <button type="submit" className="rounded-2xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 shadow-lg">Add Component</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Component */}
      {editingComponent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-lg font-bold text-slate-100">Edit Component</h3>
              <button onClick={() => setEditingComponent(null)} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEditComponent} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-300 uppercase block mb-1">Component Name</label>
                  <input required value={editCompData.name} onChange={(e) => setEditCompData({ ...editCompData, name: e.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase block mb-1">Category</label>
                  <select value={editCompData.category} onChange={(e) => setEditCompData({ ...editCompData, category: e.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none">
                    {COMPONENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase block mb-1">Min Stock Limit</label>
                  <input type="number" min="0" value={editCompData.minLimit} onChange={(e) => setEditCompData({ ...editCompData, minLimit: parseInt(e.target.value) || 0 })} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setEditingComponent(null)} className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-900">Cancel</button>
                <button type="submit" className="rounded-2xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 shadow-lg">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Adjust Stock */}
      {adjustTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-lg font-bold text-slate-100">Adjust Stock — {adjustTarget.name}</h3>
              <button onClick={() => setAdjustTarget(null)} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAdjustStock} className="space-y-4">
              <p className="text-sm text-slate-400">Current quantity: <strong className="text-slate-100">{adjustTarget.quantity}</strong></p>
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase block mb-1">Quantity Change (+ or -)</label>
                <input type="number" value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} placeholder="e.g. 10 or -5" className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase block mb-1">Note (Optional)</label>
                <input value={adjustNote} onChange={(e) => setAdjustNote(e.target.value)} placeholder="e.g. Restocked from supplier" className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none" />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setAdjustTarget(null)} className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-900">Cancel</button>
                <button type="submit" className="rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 shadow-lg">Apply Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Log Usage */}
      {logUsageTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-lg font-bold text-slate-100">Log Usage — {logUsageTarget.name}</h3>
              <button onClick={() => setLogUsageTarget(null)} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleLogUsage} className="space-y-4">
              <p className="text-sm text-slate-400">Current quantity: <strong className="text-slate-100">{logUsageTarget.quantity}</strong></p>
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase block mb-1">Quantity Used</label>
                <input type="number" min="1" max={logUsageTarget.quantity} value={usageQty} onChange={(e) => setUsageQty(e.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase block mb-1">Notes (Optional)</label>
                <input value={usageNote} onChange={(e) => setUsageNote(e.target.value)} placeholder="e.g. Replaced screen for DEV-001" className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none" />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setLogUsageTarget(null)} className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-900">Cancel</button>
                <button type="submit" className="rounded-2xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 shadow-lg">Log Consumption</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Device Assignment Modal */}
      <DeviceAssignmentModal
        open={!!assignDeviceTarget}
        onClose={() => setAssignDeviceTarget(null)}
        device={assignDeviceTarget}
        onAssign={handleAssignDevice}
      />

      {/* Device Maintenance Modal */}
      <DeviceMaintenanceModal
        open={!!maintenanceDeviceTarget}
        onClose={() => setMaintenanceDeviceTarget(null)}
        device={maintenanceDeviceTarget}
        onSubmit={handleMaintenanceSubmit}
      />

      {/* Add Device Modal */}
      <AddDeviceModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleAddStock}
      />

      {/* Assignment Details Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setSelectedAssignment(null)} />
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-850 bg-slate-950/40 px-6 py-4">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                  selectedAssignment.type === "Device" ? "bg-sky-500/10 text-sky-400 border border-sky-500/20" : "bg-violet-500/10 text-violet-400 border border-violet-500/20"
                }`}>
                  {selectedAssignment.type}
                </span>
                <h3 className="text-base font-bold text-slate-100">Assignment Details</h3>
              </div>
              <button onClick={() => setSelectedAssignment(null)} className="rounded-xl p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-3 text-left">
                {isLoadingLinkedTicket ? (
                  <div className="text-center py-4 text-xs text-slate-400">Loading ticket details...</div>
                ) : linkedTicket ? (
                  <>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Ticket ID</span>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-mono font-semibold text-sky-400">{linkedTicket.id}</span>
                        <button
                          onClick={() => {
                            setDetailsModalTicket(linkedTicket);
                            setSelectedAssignment(null);
                          }}
                          className="text-xs text-sky-400 hover:text-sky-300 font-semibold hover:underline"
                        >
                          View Full Ticket Details
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-slate-850 pt-2.5">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Assigned Person</span>
                        <span className="text-xs font-semibold text-slate-200">{linkedTicket.technician || "—"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Assignment Date</span>
                        <span className="text-xs font-semibold text-slate-200">
                          {linkedTicket.sentAt ? new Date(linkedTicket.sentAt).toLocaleString() : (linkedTicket.createdAt ? new Date(linkedTicket.createdAt).toLocaleString() : selectedAssignment.dateTime)}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-slate-850 pt-2.5">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Device Name(s)</span>
                      <div className="mt-1 space-y-1">
                        {parsedHardware.devices.length > 0 ? (
                          parsedHardware.devices.map((dev) => (
                            <div key={dev.id} className="text-xs font-semibold text-slate-200">
                              {dev.name} <span className="text-[10px] text-slate-500 font-mono">({dev.id})</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-slate-550 italic">None assigned</span>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-slate-850 pt-2.5">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Component Name(s)</span>
                      <div className="mt-1 space-y-1">
                        {parsedHardware.components.length > 0 ? (
                          parsedHardware.components.map((comp) => (
                            <div key={comp.id} className="text-xs font-semibold text-slate-200 flex justify-between">
                              <span>{comp.name}</span>
                              <span className="text-xs text-slate-400 font-medium">Qty: {comp.qty}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-slate-550 italic">None assigned</span>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-bold">Item Name</span>
                      <span className="text-sm font-semibold text-slate-100">{selectedAssignment.name}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 border-t border-slate-850 pt-2.5">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Quantity</span>
                        <span className="text-xs font-semibold text-slate-200">{selectedAssignment.quantity}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Status</span>
                        <span className="text-xs font-semibold text-slate-200">{selectedAssignment.status}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-slate-850 pt-2.5">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Assigned Person</span>
                        <span className="text-xs font-semibold text-slate-200">{selectedAssignment.person}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Assigned Date</span>
                        <span className="text-xs font-semibold text-slate-200">{selectedAssignment.dateTime}</span>
                      </div>
                    </div>

                    <div className="border-t border-slate-850 pt-2.5">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Ticket ID</span>
                      <span className="text-xs font-mono font-semibold text-sky-400 block mt-1">{selectedAssignment.ticketId}</span>
                    </div>
                  </>
                )}

                {selectedAssignment.original.reason && (
                  <div className="border-t border-slate-850 pt-2.5">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Reason / Remarks</span>
                    <span className="text-xs text-slate-350 leading-relaxed block mt-0.5">{selectedAssignment.original.reason}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-850 bg-slate-950/20 px-6 py-4">
              <button
                onClick={() => setSelectedAssignment(null)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 py-2.5 text-xs font-semibold text-slate-350 hover:bg-slate-900 hover:text-white"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Details Modal */}
      <TicketDetailsModal
        open={Boolean(detailsModalTicket)}
        ticket={
          detailsModalTicket
            ? allTickets.find((t) => t.id === detailsModalTicket.id) || detailsModalTicket
            : null
        }
        onClose={() => setDetailsModalTicket(null)}
        onComplete={() => {}}
        currentUser={user}
        onEscalate={() => {}}
      />
    </div>
  );
}



