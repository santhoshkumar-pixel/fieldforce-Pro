import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAttendance } from "../context/AttendanceContext";
import { useRegion, ALL_REGIONS } from "../context/RegionContext";
import { getUserPlace, getZoneRegion } from "../utils/roleHelpers";
import {
  Bar,
  BarChart,
  ComposedChart,
  Line,
  Area,
  AreaChart,
  Pie,
  PieChart,
  Cell,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
 ArrowRight,
 MapPin,
 Coffee,
 LogIn,
 LogOut,
 Radio,
 Clock,
 Globe,
 Users,
 Ticket,
 Cpu,
 ChevronRight,
 LayoutGrid,
 CheckCircle2,
 AlertTriangle,
 TrendingUp,
 X,
 Check,
 Search,
} from "lucide-react";
import KpiCard from "../components/KpiCard";
import KpiDetailModal from "../components/KpiDetailModal";
import PageHeader from "../components/PageHeader";
import SlaTimer from "../components/SlaTimer";
import Badge, { severityVariant, deviceStatusVariant } from "../components/ui/Badge";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import TicketDetailsModal from "../components/tickets/TicketDetailsModal";
import DeviceDetailsModal from "../components/devices/DeviceDetailsModal";
import {
 getDashboardKpiDetail,
 getDeviceHealthDetail,
} from "../data/kpiDetails";
import {
 analytics,
 deviceHealth,
 kpis,
 recentTickets,
 technicianWorkload,
 teams,
 users,
 tickets,
} from "../data/mockData";
import { api } from "../utils/api";
import {
 initialTechnicianShifts,
 operationalZones,
 shiftStatuses,
} from "../data/attendanceData";
import {
 computeBreakDuration,
 computeShiftDuration,
 formatDuration,
 formatTimestamp,
} from "../utils/shiftTimer";

function statusBadge(shiftStatus) {
 if (shiftStatus === shiftStatuses.ON_SHIFT) return "success";
 if (shiftStatus === shiftStatuses.ON_BREAK) return "warning";
 return "muted";
}

function statusLabel(shiftStatus) {
 if (shiftStatus === shiftStatuses.ON_SHIFT) return "Active Shift";
 if (shiftStatus === shiftStatuses.ON_BREAK) return "On Break";
 return "Off Shift";
}

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function generateHeatmapData(regionName) {
  // Deterministic seed based on region name
  const seed = regionName ? regionName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) : 42;
  
  return DAYS_OF_WEEK.map((day, dayIndex) => {
    const hours = Array.from({ length: 24 }, (_, hour) => {
      // Base hourly distribution: peaks around business hours, quieter at night
      let baseVal = 0;
      if (hour >= 9 && hour <= 17) {
        baseVal = 8;
      } else if (hour >= 18 && hour <= 22) {
        baseVal = 4;
      } else {
        baseVal = 1;
      }

      // Day of week variation (weekends have lower activity)
      let dayFactor = 1.0;
      if (day === "Saturday") dayFactor = 0.45;
      else if (day === "Sunday") dayFactor = 0.25;
      else if (day === "Wednesday" || day === "Thursday") dayFactor = 1.25;

      // Deterministic pseudo-random variation
      const noiseSeed = (seed * 37 + dayIndex * 19 + hour * 11) % 100;
      const noise = (noiseSeed / 100) * 6 - 3; // range -3 to +3

      let count = Math.max(0, Math.round(baseVal * dayFactor + noise));

      // Specific requirement examples to show distinct behavior
      if (day === "Monday" && hour === 22) {
        count = 15;
      } else if (day === "Wednesday" && hour === 14) {
        count = 25;
      } else if (day === "Friday" && hour === 16) {
        count = 22;
      } else if (day === "Tuesday" && hour === 10) {
        count = 18;
      }

      return { hour, count };
    });
    return { day, hours };
  });
}

function ActivityHeatmapCard({ selectedRegion }) {
  const regionName = selectedRegion ? selectedRegion.name : "All Regions";
  const heatmapData = useMemo(() => generateHeatmapData(regionName), [regionName]);

  const maxCount = useMemo(() => {
    let max = 0;
    heatmapData.forEach(row => {
      row.hours.forEach(h => {
        if (h.count > max) max = h.count;
      });
    });
    return max || 1;
  }, [heatmapData]);

  const dayShortNames = {
    "Monday": "Mon",
    "Tuesday": "Tue",
    "Wednesday": "Wed",
    "Thursday": "Thu",
    "Friday": "Fri",
    "Saturday": "Sat",
    "Sunday": "Sun"
  };

  const getCellStyles = (count, maxCount) => {
    const isDark = document.documentElement.classList.contains('dark');

    if (count === 0) {
      return {
        backgroundColor: isDark ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.02)",
        color: isDark ? "rgba(148, 163, 184, 0.35)" : "rgba(100, 116, 139, 0.35)",
        borderColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)"
      };
    }

    const ratio = count / maxCount;
    const bgOpacity = 0.15 + ratio * 0.7;
    const borderOpacity = 0.15 + ratio * 0.45;

    let textColor = "#ffffff";
    if (ratio <= 0.45) {
      textColor = isDark ? "#c084fc" : "#6d28d9";
    }

    return {
      backgroundColor: `rgba(139, 92, 246, ${bgOpacity})`,
      borderColor: `rgba(139, 92, 246, ${borderOpacity})`,
      color: textColor
    };
  };

  return (
    <Card className="glass-card">
      <CardHeader
        title={`Activity Heatmap — ${regionName}`}
      />
      <CardBody className="p-6">
        {/* Heatmap Grid */}
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[900px] select-none">
            {/* Hours header (X-axis) */}
            <div className="flex items-center mb-2">
              <div className="w-16 flex-shrink-0 text-right pr-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                Day
              </div>
              <div className="flex-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(24, minmax(0, 1fr))', gap: '4px' }}>
                {Array.from({ length: 24 }).map((_, hour) => (
                  <div key={hour} className="text-center text-[10px] font-bold text-slate-500 font-mono">
                    {String(hour).padStart(2, '0')}
                  </div>
                ))}
              </div>
            </div>

            {/* Days rows (Y-axis) */}
            <div className="space-y-1">
              {heatmapData.map((row) => (
                <div key={row.day} className="flex items-center">
                  <div className="w-16 flex-shrink-0 text-right pr-4 text-xs font-bold text-slate-300">
                    {dayShortNames[row.day]}
                  </div>
                  <div className="flex-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(24, minmax(0, 1fr))', gap: '4px' }}>
                    {row.hours.map((hourData) => (
                      <div
                        key={hourData.hour}
                        title={`${row.day} at ${String(hourData.hour).padStart(2, '0')}:00 — ${hourData.count} activities`}
                        className="aspect-square rounded-lg flex items-center justify-center text-xs font-bold font-mono transition-all duration-200 cursor-pointer border"
                        style={getCellStyles(hourData.count, maxCount)}
                      >
                        {hourData.count}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* X-axis title */}
            <div className="flex justify-center mt-4 text-xs font-bold uppercase tracking-wider text-slate-500">
              Hours of the Day (00:00 - 23:00)
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

// Region selector card shown at the top for Super Admin
function RegionSelectorCard({ selectedRegion, onSelect }) {
 return (
 <div className="rounded-3xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl p-6 shadow-2xl">
 <div className="flex items-center gap-3 mb-5">
 <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-sky-500/10 border border-violet-500/30">
 <Globe className="h-5 w-5 text-violet-400" />
 </div>
 <div>
 <h2 className="text-lg font-bold text-white">Region Overview</h2>
 <p className="text-xs text-slate-400">Select a region to filter all dashboard data</p>
 </div>
 {selectedRegion && (
 <button
 onClick={() => onSelect(null)}
 className="ml-auto flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white "
 >
 <LayoutGrid className="h-3.5 w-3.5" />
 All Regions
 </button>
 )}
 </div>

 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {/* All Regions summary card */}
  <button
  onClick={() => onSelect(null)}
  className={`relative text-left rounded-2xl border p-5 ${
  !selectedRegion
  ? "bg-gradient-to-br from-violet-500/20 to-sky-500/10 border-violet-400/50 shadow-lg"
  : "border-slate-800/80 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70"
  }`}
  >
  {!selectedRegion && (
  <span className="absolute top-3 right-3 flex h-2 w-2 rounded-full bg-violet-400">
  <span className=" absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
  </span>
  )}
  <div className="flex items-center gap-2 mb-4">
  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/20 border border-violet-500/30">
  <Globe className="h-5 w-5 text-violet-400" />
  </div>
  <div>
  <p className="font-bold text-white text-base leading-tight">All Regions</p>
  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Global View</p>
  </div>
  </div>

  <div className="grid grid-cols-2 gap-2">
  <div className="rounded-xl bg-slate-950/40 p-2.5">
  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Teams</p>
  <p className="text-xl font-bold text-white mt-0.5">{teams.length}</p>
  </div>
  <div className="rounded-xl bg-slate-950/40 p-2.5">
  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Users</p>
  <p className="text-xl font-bold text-white mt-0.5">{users.length}</p>
  </div>
  <div className="rounded-xl bg-slate-950/40 p-2.5">
  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Open</p>
  <p className="text-xl font-bold text-amber-400 mt-0.5">{tickets.filter(t => !["Resolved","Closed"].includes(t.status)).length}</p>
  </div>
  <div className="rounded-xl bg-slate-950/40 p-2.5">
  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Critical</p>
  <p className="text-xl font-bold text-rose-400 mt-0.5">{tickets.filter(t => t.severity === "Critical").length}</p>
  </div>
  </div>
  <div className={`mt-3 flex items-center justify-between text-xs font-semibold ${!selectedRegion ? "text-violet-400" : "text-slate-500"}`}>
  <span>{!selectedRegion ? "Currently viewing" : "View all"}</span>
  <ChevronRight className="h-3.5 w-3.5" />
  </div>
  </button>
 {ALL_REGIONS.map((region) => {
 const isActive = selectedRegion?.id === region.id;
 const regionTeams = teams.filter((t) =>
 region.zones.some((z) => t.zone.toLowerCase().includes(z.toLowerCase()) || t.place?.toLowerCase() === region.name.toLowerCase())
 );
 const regionUsers = users.filter((u) =>
 region.zones.some((z) => u.zone?.toLowerCase().includes(z.toLowerCase()))
 );
 const regionTickets = tickets.filter((t) =>
 region.zones.some((z) => t.zone?.toLowerCase().includes(z.toLowerCase()))
 );
 const openTickets = regionTickets.filter((t) => !["Resolved", "Closed"].includes(t.status)).length;
 const criticalCount = regionTickets.filter((t) => t.severity === "Critical").length;

 return (
 <button
 key={region.id}
 onClick={() => onSelect(isActive ? null : region.id)}
 className={`relative group text-left rounded-2xl border p-5 ${
 isActive
 ? region.activeBg + " shadow-lg"
 : "border-slate-800/80 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70"
 }`}
 >
 {isActive && (
 <span className="absolute top-3 right-3 flex h-2 w-2 rounded-full bg-sky-400">
 <span className=" absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
 </span>
 )}
 <div className="flex items-center gap-2 mb-4">
 <span className="text-3xl">{region.flag}</span>
 <div>
 <p className="font-bold text-white text-base leading-tight">{region.name}</p>
 <p className="text-[10px] text-slate-400 uppercase tracking-wider">{region.capital}</p>
 </div>
 </div>
 <div className="grid grid-cols-2 gap-2">
 <div className="rounded-xl bg-slate-950/40 p-2.5">
 <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Teams</p>
 <p className="text-xl font-bold text-white mt-0.5">{regionTeams.length}</p>
 </div>
 <div className="rounded-xl bg-slate-950/40 p-2.5">
 <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Users</p>
 <p className="text-xl font-bold text-white mt-0.5">{regionUsers.length}</p>
 </div>
 <div className="rounded-xl bg-slate-950/40 p-2.5">
 <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Open</p>
 <p className={`text-xl font-bold mt-0.5 ${openTickets > 0 ? "text-amber-400" : "text-emerald-400"}`}>{openTickets}</p>
 </div>
 <div className="rounded-xl bg-slate-950/40 p-2.5">
 <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Critical</p>
 <p className={`text-xl font-bold mt-0.5 ${criticalCount > 0 ? "text-rose-400" : "text-slate-400"}`}>{criticalCount}</p>
 </div>
 </div>
 <div className={`mt-3 flex items-center justify-between text-xs font-semibold ${isActive ? "text-sky-400" : "text-slate-500 group-hover:text-slate-300"}`}>
 <span>{isActive ? "Viewing this region" : "Click to filter"}</span>
 <ChevronRight className="h-3.5 w-3.5" />
 </div>
 </button>
 );
 })}
 </div>
 </div>
 );
}

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

export default function DashboardPage() {
 const { user, isSuperAdmin } = useAuth();
 const isTechnician = user?.role === "Technician" || user?.role === "Field Technician" || user?.role === "Tech Support";
 const { selectedRegion, setSelectedRegionId } = useRegion();

 const userPlace = useMemo(() => {
 if (isSuperAdmin) {
 return selectedRegion ? selectedRegion.name : null; // null = all regions
 }
 return getUserPlace(user);
 }, [user, isSuperAdmin, selectedRegion]);

 const getTicketPlace = (t) => {
 if (!t) return "Goa";
 const zoneLower = (t.zone || "").toLowerCase();
 if (
 zoneLower.includes("thimphu") || zoneLower.includes("paro") || zoneLower.includes("bhutan") ||
 (t.siteName || "").toLowerCase().includes("thimphu") ||
 (t.siteName || "").toLowerCase().includes("paro")
 ) {
 return "Bhutan";
 }
 return "Goa";
 };

 const [detailModal, setDetailModal] = useState(null);
 const [activeKpiId, setActiveKpiId] = useState(null);

 const {
 shifts,
 selectedId,
 setSelectedId,
 punchIn,
 punchOut,
 startBreak,
 endBreak,
 } = useAttendance();

  const [tick, setTick] = useState(0);
  const [toast, setToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [techSearchQuery, setTechSearchQuery] = useState("");
  const [recentTicketsList, setRecentTicketsList] = useState(recentTickets);
  const [deviceHealthList, setDeviceHealthList] = useState(deviceHealth);
  const [allTickets, setAllTickets] = useState([]);
  const [allDevices, setAllDevices] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [detailsModalTicket, setDetailsModalTicket] = useState(null);
  const [deviceAssignments, setDeviceAssignments] = useState([]);
  const [componentUsageLogs, setComponentUsageLogs] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [linkedTicket, setLinkedTicket] = useState(null);
  const [isLoadingLinkedTicket, setIsLoadingLinkedTicket] = useState(false);
  const navigate = useNavigate();

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

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const isZoneInRegion = (zone, regionName) => {
    if (!zone || !regionName) return true;
    const z = zone.toLowerCase();
    if (regionName === "Goa") {
      return z.includes("goa") || ["north goa", "south goa", "central goa", "all goa"].includes(z);
    }
    if (regionName === "Bhutan") {
      return z.includes("bhutan") || z === "thimphu" || z === "paro";
    }
    return z.includes(regionName.toLowerCase());
  };

  const filteredShifts = useMemo(() => {
    if (!userPlace) return shifts;
    return shifts.filter((s) => {
      if (!s || !s.zone) return false;
      return isZoneInRegion(s.zone, userPlace);
    });
  }, [shifts, userPlace]);

  useEffect(() => {
    if (filteredShifts.length > 0) {
      const isCurrentValid = filteredShifts.some((s) => s.userId === selectedId);
      if (!isCurrentValid) {
        setSelectedId(filteredShifts[0].userId);
      }
    } else {
      setSelectedId(null);
    }
  }, [filteredShifts, selectedId, setSelectedId]);

  const fetchDashboardData = async () => {
    try {
      const [ticketsData, devicesData, usersData, assignsData, logsData] = await Promise.all([
        api.tickets.getAll(),
        api.devices.getAll(),
        api.users.getAll().catch(() => []),
        api.devices.getAssignments().catch(() => []),
        api.components.getUsageLogs().catch(() => []),
      ]);

      if (assignsData) {
        setDeviceAssignments(assignsData);
      }
      if (logsData) {
        setComponentUsageLogs(logsData);
      }

      if (usersData) {
        setAllUsers(usersData);
      }

      if (ticketsData) {
        setAllTickets(ticketsData);
        const filteredTickets = ticketsData.filter((t) => {
          if (user?.role === "Field Technician" || user?.role === "Technician") {
            return t.technician === user?.name;
          }
          if (user?.role === "Tech Support") {
            const isTechSupportEscalated = (
              t.status === "ESCALATED" ||
              t.status === "TECH_SUPPORT_IN_PROGRESS" ||
              t.status === "TECH_SUPPORT_COMPLETED" ||
              t.status === "COMPLETED"
            ) && (t.escalationType === "TECH_SUPPORT" || t.escalatedToRole === "TECH_SUPPORT");
            return isTechSupportEscalated || t.technician === user?.name;
          }
          if (!userPlace) return true;
          return getTicketPlace(t) === userPlace;
        });
        setRecentTicketsList(filteredTickets.slice(0, 4));
      }

      if (devicesData) {
        setAllDevices(devicesData);
        const filteredDevices = devicesData.filter((d) => {
          if (!userPlace) return true;
          if (!d || !d.site) return false;
          if (userPlace === "Goa") {
            const nonGoaSites = [
              "San Jose HQ",
              "Frankfurt Data Center",
              "Singapore Tech Hub",
              "Sydney Terminal",
              "São Paulo Solar Hub",
              "London Operations Center",
            ];
            return !nonGoaSites.includes(d.site);
          } else if (userPlace === "Bhutan") {
            return (
              d.site.toLowerCase().includes("thimphu") ||
              d.site.toLowerCase().includes("paro") ||
              d.site.toLowerCase().includes("bhutan")
            );
          }
          return d.site.toLowerCase().includes(userPlace.toLowerCase());
        });

        const counts = { Online: 0, Offline: 0, Warning: 0, Damaged: 0 };
        filteredDevices.forEach((d) => {
          const status = d.status === "Critical" || String(d.status || "").toLowerCase().includes("maintenance")
            ? "Damaged"
            : d.status;
          if (counts[status] !== undefined) counts[status]++;
        });

        setDeviceHealthList([
          { label: "Online", value: counts.Online, tone: "emerald" },
          { label: "Offline", value: counts.Offline, tone: "slate" },
          { label: "Warning", value: counts.Warning, tone: "amber" },
          { label: "Damaged", value: counts.Damaged, tone: "rose" },
        ]);
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [userPlace]);

  const handleAccept = async (id) => {
    try {
      await api.tickets.updateStatus(id, "TRAVELLING");
      showToast("Ticket accepted — technician is now travelling");
      fetchDashboardData();
    } catch (err) {
      showToast("Error accepting ticket");
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.tickets.updateStatus(id, status);
      showToast(`Status updated to ${status}`);
      fetchDashboardData();
    } catch (err) {
      showToast("Error updating ticket status");
    }
  };

  const handleComplete = async (id) => {
    try {
      await api.tickets.updateStatus(id, "COMPLETED");
      showToast(`Ticket ${id} marked as Completed`);
      fetchDashboardData();
    } catch (err) {
      showToast("Error completing ticket");
    }
  };

  const handleReject = async (id) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;
    try {
      await api.tickets.reject(id, reason);
      showToast(`Ticket ${id} rejected`);
      fetchDashboardData();
    } catch (err) {
      showToast("Error rejecting ticket");
    }
  };

  const handleSend = () => {
    showToast("Please manage ticket dispatch on the Tickets page.");
  };

  const filteredDevices = useMemo(() => {
    return allDevices.filter((d) => {
      if (!userPlace) return true;
      if (!d || !d.site) return false;
      if (userPlace === "Goa") {
        const nonGoaSites = [
          "San Jose HQ",
          "Frankfurt Data Center",
          "Singapore Tech Hub",
          "Sydney Terminal",
          "São Paulo Solar Hub",
          "London Operations Center",
        ];
        return !nonGoaSites.includes(d.site);
      } else if (userPlace === "Bhutan") {
        return (
          d.site.toLowerCase().includes("thimphu") ||
          d.site.toLowerCase().includes("paro") ||
          d.site.toLowerCase().includes("bhutan")
        );
      }
      return d.site.toLowerCase().includes(userPlace.toLowerCase());
    });
  }, [allDevices, userPlace]);

  const displayedTickets = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const filtered = allTickets.filter((t) => {
      // Warehouse Escalation visibility rule: visible only to Super Admin, Creator, Region Warehouse Manager, and Assigned/Escalated technician
      if (t.status === "ESCALATED" && t.escalationType === "WAREHOUSE") {
        const isCreator = t.createdBy === user?.name;
        const isSuperAdmin = user?.role === "Super Admin";
        const isParticularWarehouseManager =
          user?.role === "Warehouse Manager" &&
          getZoneRegion(user?.zone) === getZoneRegion(t.site);
        const isAssignedOrEscalatedBy = t.technician === user?.name || t.escalatedBy === user?.name;
        if (!(isSuperAdmin || isCreator || isParticularWarehouseManager || isAssignedOrEscalatedBy)) {
          return false;
        }
      }

      if (user?.role === "Field Technician" || user?.role === "Technician") {
        if (t.status === "ESCALATED" && t.escalationType === "WAREHOUSE") {
          return t.technician === user?.name || t.escalatedBy === user?.name;
        }
        return t.technician === user?.name;
      }
      if (user?.role === "Tech Support") {
        const isTechSupportEscalated = (
          t.status === "ESCALATED" || 
          t.status === "TECH_SUPPORT_IN_PROGRESS" || 
          t.status === "TECH_SUPPORT_COMPLETED" ||
          t.status === "COMPLETED"
        ) && (t.escalationType === "TECH_SUPPORT" || t.escalatedToRole === "TECH_SUPPORT");
        return isTechSupportEscalated || t.technician === user?.name;
      }
      return !userPlace || getTicketPlace(t) === userPlace;
    });
    if (!q) return filtered.slice(0, 4);
    return filtered.filter((t) => (
      t.id.toLowerCase().includes(q) ||
      (t.siteName && t.siteName.toLowerCase().includes(q)) ||
      (t.deviceName && t.deviceName.toLowerCase().includes(q)) ||
      (t.assignedTo && t.assignedTo.toLowerCase().includes(q)) ||
      (t.technician && t.technician.toLowerCase().includes(q)) ||
      (t.issue && t.issue.toLowerCase().includes(q))
    ));
  }, [allTickets, searchQuery, user, userPlace]);

  const displayedDevices = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return filteredDevices;
    return filteredDevices.filter(d => 
      d.id.toLowerCase().includes(q) ||
      (d.type && d.type.toLowerCase().includes(q)) ||
      (d.status && d.status.toLowerCase().includes(q)) ||
      (d.site && d.site.toLowerCase().includes(q))
    );
  }, [filteredDevices, searchQuery]);

  const displayedShifts = useMemo(() => {
    const q = techSearchQuery.toLowerCase().trim();
    if (!q) return filteredShifts;
    return filteredShifts.filter(s => 
      s.name.toLowerCase().includes(q) ||
      (s.team && s.team.toLowerCase().includes(q)) ||
      (s.zone && s.zone.toLowerCase().includes(q))
    );
  }, [filteredShifts, techSearchQuery]);

  const computedKpis = useMemo(() => {
    const filteredTickets = allTickets.filter((t) => {
      if (user?.role === "Field Technician" || user?.role === "Technician") {
        return t.technician === user?.name;
      }
      if (user?.role === "Tech Support") {
        const isTechSupportEscalated = (
          t.status === "ESCALATED" || 
          t.status === "TECH_SUPPORT_IN_PROGRESS" || 
          t.status === "TECH_SUPPORT_COMPLETED" ||
          t.status === "COMPLETED"
        ) && (t.escalationType === "TECH_SUPPORT" || t.escalatedToRole === "TECH_SUPPORT");
        return isTechSupportEscalated || t.technician === user?.name;
      }
      return !userPlace || getTicketPlace(t) === userPlace;
    });

    const openTicketsCount = filteredTickets.filter(
      (t) => t.status !== "COMPLETED" && t.status !== "REJECTED"
    ).length;
    const assignedCount = filteredTickets.filter(
      (t) => t.status === "ASSIGNED" || t.status === "ACCEPTED" || t.status === "TRAVELLING"
    ).length;
    const completedCount = filteredTickets.filter((t) => t.status === "COMPLETED").length;
    const escalatedCount = filteredTickets.filter((t) => t.status === "ESCALATED").length;
    const slaBreachesCount = filteredTickets.filter(
      (t) => t.slaOverdue || t.slaTime === "OVERDUE"
    ).length;
    const activeTechsCount = filteredShifts.filter(
      (s) => s.shiftStatus === "on_shift"
    ).length;

    return kpis.map((kpi) => {
      if (kpi.id === "open-tickets") return { ...kpi, value: openTicketsCount };
      if (kpi.id === "assigned-today") return { ...kpi, value: assignedCount };
      if (kpi.id === "completed-today") return { ...kpi, value: completedCount };
      if (kpi.id === "sla-breaches") return { ...kpi, value: slaBreachesCount };
      if (kpi.id === "escalated") return { ...kpi, value: escalatedCount };
      if (kpi.id === "active-technicians") return { ...kpi, value: activeTechsCount };
      return kpi;
    });
  }, [allTickets, filteredShifts, userPlace]);

  const monthlyTicketTrend = useMemo(() => {
    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const today = new Date();
    const last12Months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      last12Months.push({
        name: MONTHS[d.getMonth()],
        monthIndex: d.getMonth(),
        year: d.getFullYear(),
        assigned: 0,
        resolved: 0,
        hasReal: false
      });
    }

    const regionalTickets = allTickets.filter(t => {
      if (user?.role === "Field Technician" || user?.role === "Technician") {
        return t.technician === user?.name;
      }
      if (user?.role === "Tech Support") {
        const isTechSupportEscalated = (
          t.status === "ESCALATED" || 
          t.status === "TECH_SUPPORT_IN_PROGRESS" || 
          t.status === "TECH_SUPPORT_COMPLETED" ||
          t.status === "COMPLETED"
        ) && (t.escalationType === "TECH_SUPPORT" || t.escalatedToRole === "TECH_SUPPORT");
        return isTechSupportEscalated || t.technician === user?.name;
      }
      return !userPlace || getTicketPlace(t) === userPlace;
    });

    regionalTickets.forEach(t => {
      // Try multiple date fields in priority order
      const dateStr = t.createdAt || t.reportedAt || t.sentAt || t.updatedAt;
      if (!dateStr) return;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return;
      const tMonth = d.getMonth();
      const tYear = d.getFullYear();

      const bucket = last12Months.find(b => b.monthIndex === tMonth && b.year === tYear);
      if (bucket) {
        bucket.assigned += 1;
        bucket.hasReal = true;
        if (t.status === "COMPLETED" || t.status === "RESOLVED") {
          bucket.resolved += 1;
        }
      }
    });

    // Regional baseline for mock fill (per-month variance for realism)
    const regionKey = userPlace || "Global";
    const baseMap = {
      Goa:    { assigned: 42, resolved: 35 },
      Bhutan: { assigned: 18, resolved: 14 },
      Global: { assigned: 60, resolved: 49 },
    };
    const base = baseMap[regionKey] || baseMap.Global;
    // Season-like variance using sinusoidal pattern
    const getMockCount = (monthIndex) => {
      const variance = Math.round(Math.sin((monthIndex / 12) * Math.PI * 2 + 1) * (base.assigned * 0.25));
      const assigned = Math.max(5, base.assigned + variance);
      const resolved = Math.max(3, Math.round(assigned * (0.78 + Math.random() * 0.12)));
      return { assigned, resolved };
    };

    // Fill empty months with mock data so all 12 bars are visible
    return last12Months.map(m => {
      if (m.hasReal) {
        return { name: m.name, assigned: m.assigned, resolved: m.resolved, real: true };
      }
      const mock = getMockCount(m.monthIndex);
      return { name: m.name, assigned: mock.assigned, resolved: mock.resolved, real: false };
    });
  }, [allTickets, userPlace, user]);

 const openKpiDetail = (kpiId) => {
 const detail = getDashboardKpiDetail(kpiId);
 if (detail) {
 setActiveKpiId(kpiId);
 setDetailModal(detail);
 }
 };

 const openDeviceDetail = (label) => {
 const detail = getDeviceHealthDetail(label);
 if (detail) {
 setActiveKpiId(null);
 setDetailModal(detail);
 }
 };

 const closeModal = () => {
 setDetailModal(null);
 setActiveKpiId(null);
 };

 const showToast = (msg) => {
 if (!msg) return;
 setToast(msg);
 setTimeout(() => setToast(null), 2800);
 };

 // Personal Shift
 const myTech =
 shifts.find((s) => s.userId === user?.id) ||
 (user
 ? {
 userId: user.id,
 name: user.name,
 team: user.team || "Operations Control",
 zone: user.zone || "Goa",
 role: user.role || "Admin",
 shiftStatus: shiftStatuses.OFF_SHIFT,
 online: false,
 punchInAt: null,
 punchOutAt: null,
 breakStartAt: null,
 totalBreakMs: 0,
 gpsLat: null,
 gpsLng: null,
 gpsAddress: null,
 }
 : null);
 const myShiftMs = myTech ? computeShiftDuration(myTech) : 0;
 const myBreakMs = myTech ? computeBreakDuration(myTech) : 0;

 const canMyPunchIn = myTech?.shiftStatus === shiftStatuses.OFF_SHIFT;
 const canMyPunchOut =
 myTech?.shiftStatus === shiftStatuses.ON_SHIFT ||
 myTech?.shiftStatus === shiftStatuses.ON_BREAK;
 const canMyBreakStart = myTech?.shiftStatus === shiftStatuses.ON_SHIFT;
 const canMyBreakEnd = myTech?.shiftStatus === shiftStatuses.ON_BREAK;

 const handleMyPunchIn = async () => {
 if (!user?.id) return;
 showToast(await punchIn(user.id));
 };
 const handleMyPunchOut = async () => {
 if (!user?.id) return;
 showToast(await punchOut(user.id));
 };
 const handleMyBreakStart = async () => {
 if (!user?.id) return;
 showToast(await startBreak(user.id));
 };
 const handleMyBreakEnd = async () => {
 if (!user?.id) return;
 showToast(await endBreak(user.id));
 };

 // Simulation
 const selectedTech = filteredShifts.find((s) => s.userId === selectedId) ?? filteredShifts[0];
 const simShiftMs = selectedTech ? computeShiftDuration(selectedTech) : 0;
 const simBreakMs = selectedTech ? computeBreakDuration(selectedTech) : 0;

 const canSimPunchIn = selectedTech?.shiftStatus === shiftStatuses.OFF_SHIFT;
 const canSimPunchOut =
 selectedTech?.shiftStatus === shiftStatuses.ON_SHIFT ||
 selectedTech?.shiftStatus === shiftStatuses.ON_BREAK;
 const canSimBreakStart = selectedTech?.shiftStatus === shiftStatuses.ON_SHIFT;
 const canSimBreakEnd = selectedTech?.shiftStatus === shiftStatuses.ON_BREAK;

 const handleSimPunchIn = async () => { if (selectedTech) showToast(await punchIn(selectedTech.userId)); };
 const handleSimPunchOut = async () => { if (selectedTech) showToast(await punchOut(selectedTech.userId)); };
 const handleSimBreakStart = async () => { if (selectedTech) showToast(await startBreak(selectedTech.userId)); };
 const handleSimBreakEnd = async () => { if (selectedTech) showToast(await endBreak(selectedTech.userId)); };

  void tick;

  const filteredUsersForCharts = useMemo(() => {
    if (!userPlace) return allUsers;
    return allUsers.filter(u => {
      if (!u || !u.zone) return false;
      const uPlace = u.zone && (u.zone.toLowerCase().includes("goa") || ["north goa", "south goa", "central goa", "goa"].includes(u.zone.toLowerCase())) ? "Goa" : "Bhutan";
      return uPlace === userPlace;
    });
  }, [allUsers, userPlace]);

  const employeeRoleData = useMemo(() => {
    const roles = {
      "Super Admin": 0,
      "Operational Manager": 0,
      "Technician": 0,
      "Warehouse Manager": 0,
      "Product Management": 0,
      "Other": 0,
    };

    filteredUsersForCharts.forEach(u => {
      const role = u.role || "";
      if (role === "Super Admin" || role === "Admin") {
        roles["Super Admin"]++;
      } else if (role === "Operational Manager" || role === "Scheme PC" || role === "Scheme Admin") {
        roles["Operational Manager"]++;
      } else if (role === "Field Technician" || role === "Technician" || role === "Tech") {
        roles["Technician"]++;
      } else if (role === "Warehouse Manager" || role === "Warehouse") {
        roles["Warehouse Manager"]++;
      } else if (role === "Product Management") {
        roles["Product Management"]++;
      } else {
        roles["Other"]++;
      }
    });

    return [
      { name: "Super Admin", count: roles["Super Admin"] },
      { name: "Operational Manager", count: roles["Operational Manager"] },
      { name: "Technician", count: roles["Technician"] },
      { name: "Warehouse Manager", count: roles["Warehouse Manager"] },
      { name: "Product Management", count: roles["Product Management"] },
      { name: "Other", count: roles["Other"] },
    ];
  }, [filteredUsersForCharts]);

  const deviceCategoryData = useMemo(() => {
    const categories = {
      "FastScan": 0,
      "Mini": 0,
      "Ace": 0,
      "Go": 0,
    };

    filteredDevices.forEach(d => {
      const typeLower = (d.type || "").toLowerCase().trim();
      
      if (typeLower === "fastscan") {
        categories["FastScan"]++;
      } else if (typeLower === "mini") {
        categories["Mini"]++;
      } else if (typeLower === "ace") {
        categories["Ace"]++;
      } else if (typeLower === "go") {
        categories["Go"]++;
      } else {
        if (typeLower.includes("fastscan")) categories["FastScan"]++;
        else if (typeLower.includes("mini")) categories["Mini"]++;
        else if (typeLower.includes("ace")) categories["Ace"]++;
        else if (typeLower.includes("go")) categories["Go"]++;
      }
    });

    return [
      { name: "FastScan", value: categories["FastScan"] },
      { name: "Mini", value: categories["Mini"] },
      { name: "Ace", value: categories["Ace"] },
      { name: "Go", value: categories["Go"] },
    ];
  }, [filteredDevices]);

 // Region label for display
 const regionLabel = selectedRegion ? `${selectedRegion.flag} ${selectedRegion.name} Region` : "All Regions";

 return (
 <div className="space-y-6">
 {toast && (
 <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-slate-800 px-4 py-3 text-sm text-white shadow-lg ring-1 ring-slate-700">
 {toast}
 </div>
 )}

  <PageHeader
  title={isSuperAdmin ? `Operations Dashboard — ${regionLabel}` : "Operations Dashboard"}
  />

  {/* Dashboard Search Bar */}
  <div className="relative max-w-md">
    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
    <input
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder="Search tickets, devices, or technicians..."
      className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-slate-100 outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20"
    />
  </div>

   {/* Super Admin Region Selector & Heatmap */}
   {isSuperAdmin && (
     <>
       <RegionSelectorCard
         selectedRegion={selectedRegion}
         onSelect={setSelectedRegionId}
       />
       <ActivityHeatmapCard selectedRegion={selectedRegion} />
     </>
   )}

 {/* Personal Shift & Punch Control — hidden for Super Admin */}
 {!isSuperAdmin && (
 <Card className="glass-card">
 <CardHeader title="My Shift & Punch Control" />
 <CardBody className="p-5">
 {myTech ? (
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
 {/* Profile and Status */}
 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <h4 className="font-bold text-white text-base">{myTech.name}</h4>
 <Badge variant={statusBadge(myTech.shiftStatus)}>
 {statusLabel(myTech.shiftStatus)}
 </Badge>
 </div>
 <p className="text-xs text-slate-400">{myTech.team} · {myTech.role || "Operator"}</p>
 <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-xs space-y-2">
 <div className="flex items-center justify-between text-slate-400">
 <span>Last GPS Log</span>
 <span className="font-mono text-sky-400">
 {myTech.gpsLat && myTech.gpsLng
 ? `${myTech.gpsLat.toFixed(4)}, ${myTech.gpsLng.toFixed(4)}`
 : "—"}
 </span>
 </div>
 {myTech.gpsAddress ? (
 <p className="text-slate-300 font-medium">{myTech.gpsAddress}</p>
 ) : (
 <p className="text-slate-500 italic">No GPS coordinates captured</p>
 )}
 </div>
 </div>

 {/* Timers */}
 <div className="space-y-3">
 <div className="grid grid-cols-2 gap-3">
 <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
 <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-500">Shift Time</span>
 <span className="block font-mono text-base font-bold text-sky-400 mt-1">
 {!myTech.punchInAt ? "—" : formatDuration(myShiftMs)}
 </span>
 </div>
 <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
 <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-500">Break Time</span>
 <span className={`block font-mono text-base font-bold mt-1 ${myTech.shiftStatus === shiftStatuses.ON_BREAK ? "text-amber-400 " : "text-slate-500"}`}>
 {myTech.shiftStatus === shiftStatuses.ON_BREAK
 ? formatDuration(myBreakMs)
 : formatDuration(myTech.totalBreakMs || 0)}
 </span>
 </div>
 </div>
 <div className="space-y-1 text-xs text-slate-400">
 <div className="flex justify-between">
 <span>Punched In:</span>
 <span className="text-slate-200">{formatTimestamp(myTech.punchInAt)}</span>
 </div>
 <div className="flex justify-between">
 <span>Punched Out:</span>
 <span className="text-slate-200">{formatTimestamp(myTech.punchOutAt)}</span>
 </div>
 </div>
 </div>

 {/* Actions */}
 <div className="space-y-2">
 <div className="grid grid-cols-2 gap-2">
 <button type="button" disabled={!canMyPunchIn} onClick={handleMyPunchIn}
 className="flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-30 disabled:cursor-not-allowed ">
 <LogIn className="h-3.5 w-3.5" /> Punch In
 </button>
 <button type="button" disabled={!canMyPunchOut} onClick={handleMyPunchOut}
 className="flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-30 disabled:cursor-not-allowed ">
 <LogOut className="h-3.5 w-3.5" /> Punch Out
 </button>
 </div>
 <div className="grid grid-cols-2 gap-2">
 <button type="button" disabled={!canMyBreakStart} onClick={handleMyBreakStart}
 className="flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-semibold border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 disabled:opacity-30 disabled:cursor-not-allowed ">
 <Coffee className="h-3.5 w-3.5" /> Start Break
 </button>
 <button type="button" disabled={!canMyBreakEnd} onClick={handleMyBreakEnd}
 className="flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-semibold border border-sky-500/40 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 disabled:opacity-30 disabled:cursor-not-allowed ">
 <Radio className="h-3.5 w-3.5" /> End Break
 </button>
 </div>
 </div>
 </div>
 ) : (
 <div className="text-center text-slate-500 py-6">
 <Clock className="h-10 w-10 text-slate-600 mx-auto mb-2 stroke-[1.5]" />
 <p className="text-sm font-semibold">No Record Available</p>
 </div>
 )}
 </CardBody>
 </Card>
 )}

  {!isSuperAdmin && user?.role === "Operational Manager" && (
    <ActivityHeatmapCard selectedRegion={{ name: userPlace }} />
  )}

 {/* KPI Cards */}
 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
 {computedKpis.map((kpi) => (
 <KpiCard
 key={kpi.id}
 {...kpi}
 active={activeKpiId === kpi.id}
 onClick={() => openKpiDetail(kpi.id)}
 />
 ))}
 </div>



  {/* Monitoring & Devices row */}
  <div className="grid gap-6 xl:grid-cols-3">
  <Card className={`${isTechnician ? "xl:col-span-3" : "xl:col-span-2"} glass-card`}>
 <CardHeader
 title={`Live Ticket Monitoring${selectedRegion ? ` — ${selectedRegion.name}` : ""}`}
 action={
 <Link to="/tickets" className="flex items-center gap-1 text-sm text-sky-400 hover:text-sky-300">
 View all <ArrowRight className="h-4 w-4" />
 </Link>
 }
 />
 <CardBody className="p-0">
 <div className="overflow-x-auto">
 <table className="w-full min-w-[640px] text-left text-sm">
 <thead className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
 <tr>
 <th className="px-5 py-3">Ticket</th>
 <th className="px-5 py-3">Site / Device</th>
 <th className="px-5 py-3">Severity</th>
 <th className="px-5 py-3">Status</th>
 <th className="px-5 py-3">Assigned User</th>
 <th className="px-5 py-3">SLA</th>
 </tr>
 </thead>
 <tbody>
 {displayedTickets.length > 0 ? (
 displayedTickets.map((t) => (
 <tr key={t.id} className="border-b border-slate-800/60 hover:bg-slate-900/40">
  <td className="px-5 py-4 font-medium text-white">
    <button 
      type="button" 
      onClick={() => setDetailsModalTicket(t)} 
      className="text-sky-400 hover:text-sky-300 font-semibold hover:underline cursor-pointer text-left"
    >
      {t.id}
    </button>
    <p className="text-xs text-slate-500">{t.zone}</p>
  </td>
 <td className="px-5 py-4">
 <p className="text-slate-200">{t.siteName}</p>
 <p className="text-xs text-slate-500">{t.deviceName}</p>
 </td>
 <td className="px-5 py-4">
 <Badge variant={severityVariant(t.severity)}>{t.severity}</Badge>
 </td>
 <td className="px-5 py-4">
    {(() => {
      const isWarehouseEscalated = t.status === "ESCALATED" && t.escalationType === "WAREHOUSE";
      const displayStatus = isWarehouseEscalated ? "PENDING" : t.status;
      return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold uppercase ${
          displayStatus === "REJECTED" ? "text-red-400" :
          displayStatus === "COMPLETED" ? "text-emerald-400" : 
          displayStatus === "PENDING" ? "text-amber-400" : "text-slate-300"
        }`}>
          {displayStatus === "REJECTED" && <X className="h-3 w-3 stroke-[3] text-red-400 shrink-0" />}
          {displayStatus === "COMPLETED" && <Check className="h-3.5 w-3.5 stroke-[3] text-emerald-400 shrink-0" />}
          {displayStatus}
        </span>
      );
    })()}
  </td>
 <td className="px-5 py-4 text-slate-200 whitespace-nowrap">
 {t.assignedTo || t.technician || t.technicianName || t.assignedUser || t.assignee || "—"}
 </td>
 <td className="px-5 py-4">
 <SlaTimer remaining={t.slaRemaining} health={t.slaHealth} />
 </td>
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan={5} className="px-5 py-10 text-center text-slate-500 text-sm">
 No tickets found for {selectedRegion?.name || "this region"}
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </CardBody>
 </Card>

  {!isTechnician && (
  <Card className="glass-card">
  <CardHeader
  title="Device Inventory"
  action={
  <Link to="/devices" className="flex items-center gap-1 text-sm text-sky-400 hover:text-sky-300">
  View all <ArrowRight className="h-4 w-4" />
  </Link>
  }
  />
  <CardBody className="p-0">
  <div className="max-h-[380px] overflow-y-auto">
  <table className="w-full text-left text-sm">
  <thead className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500 sticky top-0 bg-slate-950/95 backdrop-blur-sm z-10">
  <tr>
  <th className="px-5 py-3">Device ID</th>
  <th className="px-5 py-3">Type</th>
  <th className="px-5 py-3 text-right">Status</th>
  </tr>
  </thead>
  <tbody>
  {displayedDevices.length > 0 ? (
  displayedDevices.map((d) => (
  <tr key={d.id} className="border-b border-slate-800/60 hover:bg-slate-900/40">
  <td className="px-5 py-4 font-medium text-white">
  <button
  type="button"
  onClick={() => navigate(`/devices/${d.id}`)}
  className="text-sky-400 hover:text-sky-300 font-semibold hover:underline cursor-pointer text-left"
  >
  {d.id}
  </button>
  </td>
  <td className="px-5 py-4 text-slate-350">{d.type}</td>
  <td className="px-5 py-4 text-right whitespace-nowrap">
  <Badge variant={deviceStatusVariant(d.status)}>{d.status}</Badge>
  </td>
  </tr>
  ))
  ) : (
  <tr>
  <td colSpan={3} className="px-5 py-10 text-center text-slate-500 text-sm">
  No devices found for {selectedRegion?.name || "this region"}
  </td>
  </tr>
  )}
  </tbody>
  </table>
  </div>
  </CardBody>
  </Card>
  )}
  </div>

 {/* Ticket Trends */}
 <Card className="glass-card">
  <CardHeader
    title="Ticket Trends"
    subtitle="Assigned vs resolved — last 12 months"
  />
  <CardBody>
  <div className="h-[360px]">
  <ResponsiveContainer width="100%" height="100%">
    <ComposedChart data={monthlyTicketTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
      <defs>
        <linearGradient id="assignedGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#818cf8" stopOpacity={1} />
          <stop offset="100%" stopColor="#6366f1" stopOpacity={0.7} />
        </linearGradient>
        <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" stopOpacity={1} />
          <stop offset="100%" stopColor="#10b981" stopOpacity={0.7} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" vertical={false} />
      <XAxis
        dataKey="name"
        tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }}
        axisLine={{ stroke: "rgba(148,163,184,0.2)" }}
        tickLine={false}
      />
      <YAxis
        tick={{ fill: "#94a3b8", fontSize: 11 }}
        axisLine={false}
        tickLine={false}
        width={32}
      />
      <Tooltip
        contentStyle={{
          background: "rgba(15,23,42,0.92)",
          border: "1px solid rgba(99,102,241,0.3)",
          borderRadius: "10px",
          backdropFilter: "blur(8px)",
          padding: "10px 14px",
        }}
        labelStyle={{ color: "#c7d2fe", fontWeight: 700, marginBottom: 4 }}
        itemStyle={{ color: "#e2e8f0", fontSize: 12 }}
        cursor={{ fill: "rgba(99,102,241,0.06)" }}
      />
      <Legend
        wrapperStyle={{ paddingTop: 12, fontSize: 12, color: "#94a3b8" }}
        iconType="circle"
        iconSize={8}
      />
      <Bar
        dataKey="assigned"
        name="Assigned"
        fill="url(#assignedGrad)"
        radius={[4, 4, 0, 0]}
        maxBarSize={32}
      />
      <Bar
        dataKey="resolved"
        name="Resolved"
        fill="url(#resolvedGrad)"
        radius={[4, 4, 0, 0]}
        maxBarSize={32}
      />
      <Line
        type="monotone"
        dataKey="resolved"
        stroke="#34d399"
        strokeWidth={2}
        dot={false}
        name="Resolved Trend"
        legendType="none"
        strokeDasharray="4 3"
        strokeOpacity={0.6}
      />
    </ComposedChart>
  </ResponsiveContainer>
  </div>
  </CardBody>
 </Card>

 {/* Side-by-Side Distribution Charts */}
  {!isTechnician && (
  <div className="grid gap-6 md:grid-cols-2">
  {/* Employee Role Distribution Area Chart */}
  <Card className="glass-card">
  <CardHeader
  title="Employee Role Distribution"
  subtitle="Personnel counts classified by role"
  />
  <CardBody>
  <div className="h-[280px]">
  <ResponsiveContainer width="100%" height="100%">
  <AreaChart data={employeeRoleData}>
  <defs>
  <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stopColor="#c084fc" stopOpacity={0.4}/>
    <stop offset="95%" stopColor="#9333ea" stopOpacity={0.05}/>
  </linearGradient>
  </defs>
  <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-stroke)" />
  <XAxis dataKey="name" stroke="var(--axis-stroke)" fontSize={11} />
  <YAxis stroke="var(--axis-stroke)" fontSize={11} />
  <Tooltip
  contentStyle={{
  background: "var(--tooltip-bg)",
  border: "1px solid var(--tooltip-border)",
  borderRadius: "0px",
  }}
  labelStyle={{ color: "var(--tooltip-text)" }}
  itemStyle={{ color: "var(--tooltip-text)" }}
  />
    <Area type="monotone" dataKey="count" stroke="#c084fc" fillOpacity={1} fill="url(#areaColor)" name="Employees" />
  </AreaChart>
  </ResponsiveContainer>
  </div>
  </CardBody>
  </Card>

  {/* Device Category Distribution Pie Chart */}
  <Card className="glass-card">
  <CardHeader
  title="Device Category Distribution"
  subtitle="IoT fleet split by device category"
  />
  <CardBody className="flex flex-col justify-between">
  <div className="h-[230px]">
  <ResponsiveContainer width="100%" height="100%">
  <PieChart>
  <Pie
  data={deviceCategoryData}
  cx="50%"
  cy="50%"
  innerRadius={60}
  outerRadius={85}
  paddingAngle={5}
  dataKey="value"
  >
  {deviceCategoryData.map((entry, index) => {
    const COLORS = ["#9333ea", "#c084fc", "#a1a1aa", "#d8b4fe"];
   return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />;
  })}
  </Pie>
  <Tooltip
  contentStyle={{
  background: "var(--tooltip-bg)",
  border: "1px solid var(--tooltip-border)",
  borderRadius: "0px",
  }}
  itemStyle={{ color: "var(--tooltip-text)" }}
  />
  </PieChart>
  </ResponsiveContainer>
  </div>
  <div className="grid grid-cols-2 gap-2 mt-2 text-xs font-semibold">
  {deviceCategoryData.map((d, i) => {
   const COLORS = ["bg-violet-400", "bg-violet-600", "bg-zinc-400", "bg-violet-300"];
  return (
  <div key={d.name} className="flex items-center gap-2 text-slate-350">
  <span className={`h-2.5 w-2.5 rounded-full ${COLORS[i % COLORS.length]}`} />
  <span className="truncate">{d.name}: {d.value}</span>
  </div>
  );
  })}
  </div>
  </CardBody>
  </Card>
  </div>
  )}

 {/* Technician Shifts & Punch Control */}
 {!isTechnician && (
 <Card className="glass-card">
 <CardHeader title="Technician Shifts & Punch Control" />
 <CardBody className="p-0">
 <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800/80 min-h-[360px]">
 {/* Left: Technicians list */}
  <div className="p-4 flex flex-col max-h-[380px] overflow-hidden">
    {/* Search Bar */}
    <div className="relative mb-3 shrink-0">
      <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
      <input
        value={techSearchQuery}
        onChange={(e) => setTechSearchQuery(e.target.value)}
        placeholder="Search technicians..."
        className="w-full rounded-xl border border-slate-700 bg-slate-950 py-1.5 pl-9 pr-3 text-xs text-slate-100 outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20"
      />
    </div>
    {/* List Container */}
    <div className="space-y-2 overflow-y-auto flex-1 pr-1">
      {displayedShifts.length > 0 ? displayedShifts.map((tech) => {
        const workload = technicianWorkload.find((w) => w.name === tech.name) || { assigned: 0, completed: 0 };
        const total = workload.assigned + workload.completed;
        const pct = total > 0 ? (workload.completed / total) * 100 : 0;
        return (
          <button key={tech.id} type="button" onClick={() => setSelectedId(tech.id)}
            className={`w-full rounded-2xl border p-3.5 text-left ${selectedId === tech.id ? "border-sky-500/50 bg-slate-800/85" : "border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70"}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-white text-sm">{tech.name}</p>
                <p className="mt-0.5 text-xs text-slate-400">{tech.team}</p>
              </div>
              <Badge variant={statusBadge(tech.shiftStatus)}>{statusLabel(tech.shiftStatus)}</Badge>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-slate-400">
                <MapPin className="h-3.5 w-3.5 text-sky-400" />
                {tech.zone}
              </div>
              {tech.shiftStatus !== shiftStatuses.OFF_SHIFT && (
                <span className="font-mono text-xs font-bold text-sky-400">
                  {formatDuration(computeShiftDuration(tech))}
                </span>
              )}
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                <span>Jobs Done: {workload.completed}/{total}</span>
                <span>{Math.round(pct)}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-950">
                <div className="h-full rounded-full bg-sky-500 " style={{ width: `${pct}%` }} />
              </div>
            </div>
          </button>
        );
      }) : (
        <div className="flex flex-col items-center justify-center h-40 text-slate-500">
          <Users className="h-8 w-8 text-slate-700 mb-2" />
          <p className="text-sm">No technicians in {selectedRegion?.name || "this region"}</p>
        </div>
      )}
    </div>
  </div>

 {/* Right: Control panel */}
 <div className="p-5 flex flex-col justify-between bg-slate-950/20">
 {selectedTech ? (
 <div className="space-y-4 flex-1 flex flex-col justify-between">
 <div>
 <div className="flex items-center justify-between">
 <h4 className="font-bold text-white text-base">{selectedTech.name}</h4>
 <div className="flex items-center gap-1.5 text-xs text-slate-400">
 <MapPin className="h-3.5 w-3.5 text-sky-400" />
 {selectedTech.zone}
 </div>
 </div>
 <p className="text-xs text-slate-500 mt-0.5">Role: {selectedTech.role || "Field Technician"}</p>

 <div className="grid grid-cols-2 gap-3 mt-4">
 <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
 <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-500">Shift Time</span>
 <span className="block font-mono text-base font-bold text-sky-400 mt-1">
 {!selectedTech.punchInAt ? "—" : formatDuration(simShiftMs)}
 </span>
 </div>
 <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
 <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-500">Break Time</span>
 <span className={`block font-mono text-base font-bold mt-1 ${selectedTech.shiftStatus === shiftStatuses.ON_BREAK ? "text-amber-400 " : "text-slate-500"}`}>
 {selectedTech.shiftStatus === shiftStatuses.ON_BREAK
 ? formatDuration(simBreakMs)
 : formatDuration(selectedTech.totalBreakMs || 0)}
 </span>
 </div>
 </div>

 <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-xs space-y-2">
 <div className="flex items-center justify-between text-slate-400">
 <span>Last GPS Log</span>
 <span className="font-mono">
 {selectedTech.gpsLat && selectedTech.gpsLng
 ? `${selectedTech.gpsLat.toFixed(4)}, ${selectedTech.gpsLng.toFixed(4)}`
 : "—"}
 </span>
 </div>
 {selectedTech.gpsAddress ? (
 <p className="text-slate-300 font-medium">{selectedTech.gpsAddress}</p>
 ) : (
 <p className="text-slate-500 italic">No GPS coordinates captured</p>
 )}
 </div>

 <div className="mt-4 space-y-1.5 text-xs text-slate-400">
 <div className="flex justify-between">
 <span>Punched In:</span>
 <span className="text-slate-200">{formatTimestamp(selectedTech.punchInAt)}</span>
 </div>
 <div className="flex justify-between">
 <span>Punched Out:</span>
 <span className="text-slate-200">{formatTimestamp(selectedTech.punchOutAt)}</span>
 </div>
 </div>
 </div>

 {!isSuperAdmin && (
<div className="mt-6 space-y-2 max-w-md">
 <div className="grid grid-cols-2 gap-2">
 <button type="button" disabled={!canSimPunchIn} onClick={handleSimPunchIn}
 className="flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-30 disabled:cursor-not-allowed ">
 <LogIn className="h-3.5 w-3.5" /> Punch In
 </button>
 <button type="button" disabled={!canSimPunchOut} onClick={handleSimPunchOut}
 className="flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-30 disabled:cursor-not-allowed ">
 <LogOut className="h-3.5 w-3.5" /> Punch Out
 </button>
 </div>
 <div className="grid grid-cols-2 gap-2">
 <button type="button" disabled={!canSimBreakStart} onClick={handleSimBreakStart}
 className="flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-semibold border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 disabled:opacity-30 disabled:cursor-not-allowed ">
 <Coffee className="h-3.5 w-3.5" /> Start Break
 </button>
 <button type="button" disabled={!canSimBreakEnd} onClick={handleSimBreakEnd}
 className="flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-semibold border border-sky-500/40 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 disabled:opacity-30 disabled:cursor-not-allowed ">
 <Radio className="h-3.5 w-3.5" /> End Break
 </button>
 </div>
  </div>
  )}
 </div>
 ) : (
 <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 p-6">
 <Clock className="h-10 w-10 text-slate-600 mb-2 stroke-[1.5]" />
 <p className="text-sm font-semibold">No Shift Record Found</p>
 <p className="text-xs text-slate-600 mt-1">
 Select a technician from the directory list to inspect shift status.
 </p>
 </div>
 )}
 </div>
 </div>
 </CardBody>
 </Card>
 )}

  {/* KPI Detail Modal */}
  <KpiDetailModal
    open={Boolean(detailModal)}
    onClose={closeModal}
    detail={detailModal}
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
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
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

  <TicketDetailsModal
    open={Boolean(detailsModalTicket)}
    ticket={
      detailsModalTicket
        ? allTickets.find((t) => t.id === detailsModalTicket.id) || detailsModalTicket
        : null
    }
    currentUser={user}
    onClose={() => setDetailsModalTicket(null)}
    onAccept={handleAccept}
    onReject={handleReject}
    onSend={handleSend}
    onStartTravel={(id) => handleUpdateStatus(id, "TRAVELLING")}
    onComplete={handleComplete}
    onUpdateStatus={handleUpdateStatus}
  />

</div>
  );
}
