import { useState, useEffect, useMemo } from "react";
import { Plus, Users, Search, UserCog, ArrowLeft, ChevronRight, X, Clock, Layers, Shield, Cpu, Radio, Wifi, Battery, Briefcase, User, MoreVertical, Trash2, ArrowUpDown, ChevronUp, ChevronDown, RotateCcw, RefreshCw } from "lucide-react";
import clsx from "clsx";
import PageHeader from "../components/PageHeader";
import Badge from "../components/ui/Badge";
import { useAuth } from "../context/AuthContext";
import { useAttendance } from "../context/AttendanceContext";
import { getUserPlace } from "../utils/roleHelpers";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { api } from "../utils/api";
import CustomSelect from "../components/ui/CustomSelect";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

function getUserStatus(u, shifts = []) {
 const shift = shifts.find((s) => s.userId === u.id);
 if (shift) {
 if (shift.shiftStatus === "on_break") return "Break";
 if (shift.shiftStatus === "on_shift") return "On Shift";
 if (shift.shiftStatus === "off_shift") return "Off Shift";
 }
 return u.status;
}

function getUserStatusVariant(status) {
 if (status === "On Shift" || status === "Active") return "success";
 if (status === "Break") return "warning";
 return "muted";
}

function roleBadge(role) {
 if (role === "Operational Manager" || role === "Admin") return "info";
 if (role === "Warehouse Manager" || role === "Warehouse") return "muted";
 if (role === "Technical Support") return "success";
 if (role === "Field Technician" || role === "Technician") return "info";
 return "muted";
}

const teamColors = [
 "glass-card",
 "glass-card",
 "glass-card",
 "glass-card",
 "glass-card",
 "glass-card",
 "glass-card",
 "glass-card",
 "glass-card"
];

function deviceStatusVariant(status) {
 const map = {
 Online: "success",
 Offline: "muted",
 Warning: "warning",
 Critical: "danger",
 "Maintenance Required": "info",
 };
 return map[status] || "default";
}

function EmployeeAreaChart({ data }) {
  const chartData = data.map(item => ({
    name: item.label,
    count: item.value
  }));

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-slate-350">Employee Role Distribution</h4>
      <div className="h-[180px] w-full rounded-2xl border border-slate-800 bg-slate-955/40 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="areaColorTeams" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#c084fc" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#9333ea" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#6b21a8" />
            <XAxis dataKey="name" stroke="#c084fc" fontSize={10} tickLine={false} />
            <YAxis stroke="#c084fc" fontSize={10} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: "#1a052e",
                border: "1px solid #6b21a8",
                borderRadius: "0px",
              }}
              labelStyle={{ color: "#f8fafc" }}
              itemStyle={{ color: "#f8fafc" }}
            />
            <Area type="monotone" dataKey="count" stroke="#c084fc" fillOpacity={1} fill="url(#areaColorTeams)" name="Employees" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function DeviceCategoryPieChart({ data }) {
  const chartData = data.map(item => ({
    name: item.label,
    value: item.value
  }));

  const COLORS = ["#9333ea", "#c084fc", "#a1a1aa", "#d8b4fe"];

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-slate-350">Device Category Distribution</h4>
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-955/40 p-4 h-[180px]">
        <div className="h-full w-[120px] flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={25}
                outerRadius={45}
                paddingAngle={4}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#1a052e",
                  border: "1px solid #6b21a8",
                  borderRadius: "0px",
                }}
                labelStyle={{ color: "#f8fafc" }}
                itemStyle={{ color: "#f8fafc" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] font-semibold w-full">
          {chartData.map((d, i) => {
            const COLOR_CLASSES = ["bg-purple-400", "bg-purple-600", "bg-zinc-400", "bg-purple-300"];
            return (
              <div key={d.name} className="flex items-center gap-1.5 text-slate-400 truncate">
                <span className={`h-2 w-2 rounded-full shrink-0 ${COLOR_CLASSES[i % COLOR_CLASSES.length]}`} />
                <span className="truncate">{d.name}: {d.value}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const placesMetadata = {
 Goa: {
 name: "Goa",
 country: "India",
 description: "Coastal operational hub monitoring urban and industrial IoT devices.",
 accent: "from-sky-500/20 to-indigo-500/20 border-sky-500/30 text-sky-400",
 glow: "shadow-sky-500/10",
 icon: "🌴",
 },
 Bhutan: {
 name: "Bhutan",
 country: "South Asia",
 description: "Himalayan expansion zone tracking environmental sensors and gateways.",
 accent: "from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400",
 glow: "shadow-amber-500/10",
 icon: "🏔️",
 },
};

const getPlaceMeta = (placeName) => {
 return placesMetadata[placeName] || {
 name: placeName,
 country: "Regional Hub",
 description: `Regional field teams and operations in ${placeName}.`,
 accent: "from-teal-500/20 to-emerald-500/20 border-teal-500/30 text-teal-400",
 glow: "shadow-teal-500/10",
 icon: "🌐",
 };
};

export default function TeamsPage({ defaultTab = "teams" }) {
 const { user, hasPermission, isSuperAdmin } = useAuth();
 const { shifts } = useAttendance();
 const isTechOrSupport = user?.role === "Field Technician" || user?.role === "Technician";
 const canManageTeams = hasPermission("teams.manage") && !isTechOrSupport;
 const canManageUsers = hasPermission("users.manage") && !isTechOrSupport;
 const userPlace = useMemo(() => getUserPlace(user), [user]);

 const [activeTab, setActiveTab] = useState(defaultTab);
 useEffect(() => {
   setActiveTab(defaultTab);
 }, [defaultTab]);
 const [userDirectoryTab, setUserDirectoryTab] = useState("active"); // "active" or "inactive"
 const [isInactivateConfirmOpen, setIsInactivateConfirmOpen] = useState(false);
 const [inactivationReasonText, setInactivationReasonText] = useState("");
 const [userToInactivate, setUserToInactivate] = useState(null);
 const [search, setSearch] = useState("");
 const [selectedPlace, setSelectedPlace] = useState(() => getUserPlace(user));
 const [activeDropdown, setActiveDropdown] = useState(null);
 const [teamsList, setTeamsList] = useState([]);
 const [usersList, setUsersList] = useState([]);
 const [devicesList, setDevicesList] = useState([]);
 const [analyticsSearch, setAnalyticsSearch] = useState("");
 const [analyticsTypeFilter, setAnalyticsTypeFilter] = useState("all");
 const [analyticsTableTab, setAnalyticsTableTab] = useState("users");
 const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
 const [newUser, setNewUser] = useState({
 name: "",
 email: "",
 mobile: "",
 role: "Field Technician",
 zone: "Goa",
 });
 const [addUserError, setAddUserError] = useState("");
 const [isSavingUser, setIsSavingUser] = useState(false);

 const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
 const [editingUser, setEditingUser] = useState(null);
 const [editUserError, setEditUserError] = useState("");
 const [isSavingEditUser, setIsSavingEditUser] = useState(false);

 // Column Filters State
 const [colUserFilter, setColUserFilter] = useState("");
 const [colRoleFilter, setColRoleFilter] = useState("all");
 const [colTeamFilter, setColTeamFilter] = useState("all");
 const [colZoneFilter, setColZoneFilter] = useState("all");
 const [colStatusFilter, setColStatusFilter] = useState("all");

 // Sorting State
 const [sortColumn, setSortColumn] = useState(null); // 'user', 'role', 'team', 'zone', 'status'
 const [sortDirection, setSortDirection] = useState(null); // 'asc', 'desc'

 const handleSort = (column) => {
 if (sortColumn === column) {
 if (sortDirection === "asc") {
 setSortDirection("desc");
 } else if (sortDirection === "desc") {
 setSortColumn(null);
 setSortDirection(null);
 }
 } else {
 setSortColumn(column);
 setSortDirection("asc");
 }
 };

 const handleClearAllFilters = () => {
 setColUserFilter("");
 setColRoleFilter("all");
 setColTeamFilter("all");
 setColZoneFilter("all");
 setColStatusFilter("all");
 setSortColumn(null);
 setSortDirection(null);
 setSearch("");
 };

 // Operational Control Employees Column Filters & Sorting
 const [colEmpUserFilter, setColEmpUserFilter] = useState("");
 const [colEmpRoleFilter, setColEmpRoleFilter] = useState("all");
 const [colEmpTeamFilter, setColEmpTeamFilter] = useState("all");
 const [colEmpZoneFilter, setColEmpZoneFilter] = useState("all");
 const [colEmpStatusFilter, setColEmpStatusFilter] = useState("all");
 const [sortEmpColumn, setSortEmpColumn] = useState(null); // 'user', 'role', 'team', 'zone', 'status'
 const [sortEmpDirection, setSortEmpDirection] = useState(null); // 'asc', 'desc'

 const handleEmpSort = (column) => {
 if (sortEmpColumn === column) {
 if (sortEmpDirection === "asc") {
 setSortEmpDirection("desc");
 } else if (sortEmpDirection === "desc") {
 setSortEmpColumn(null);
 setSortEmpDirection(null);
 }
 } else {
 setSortEmpColumn(column);
 setSortEmpDirection("asc");
 }
 };

 const handleClearEmpFilters = () => {
 setColEmpUserFilter("");
 setColEmpRoleFilter("all");
 setColEmpTeamFilter("all");
 setColEmpZoneFilter("all");
 setColEmpStatusFilter("all");
 setSortEmpColumn(null);
 setSortEmpDirection(null);
 };

 // Operational Control Devices Column Filters & Sorting
 const [colDevIdFilter, setColDevIdFilter] = useState("");
 const [colDevTypeFilter, setColDevTypeFilter] = useState("all");
 const [colDevSiteFilter, setColDevSiteFilter] = useState("all");
 const [colDevStatusFilter, setColDevStatusFilter] = useState("all");
 const [colDevConnFilter, setColDevConnFilter] = useState("");
 const [sortDevColumn, setSortDevColumn] = useState(null); // 'id', 'type', 'site', 'status', 'connectivity'
 const [sortDevDirection, setSortDevDirection] = useState(null); // 'asc', 'desc'

 const handleDevSort = (column) => {
 if (sortDevColumn === column) {
 if (sortDevDirection === "asc") {
 setSortDevDirection("desc");
 } else if (sortDevDirection === "desc") {
 setSortDevColumn(null);
 setSortDevDirection(null);
 }
 } else {
 setSortDevColumn(column);
 setSortDevDirection("asc");
 }
 };

 const handleClearDevFilters = () => {
 setColDevIdFilter("");
 setColDevTypeFilter("all");
 setColDevSiteFilter("all");
 setColDevStatusFilter("all");
 setColDevConnFilter("");
 setSortDevColumn(null);
 setSortDevDirection(null);
 };

 useEffect(() => {
 if (isAddUserModalOpen) {
 setNewUser({
 name: "",
 email: "",
 mobile: "",
 role: "Field Technician",
 zone: userPlace || selectedPlace || "Goa",
 });
 setAddUserError("");
 setIsSavingUser(false);
 }
 }, [isAddUserModalOpen, userPlace, selectedPlace]);
 
 // Modals / Panels State
 const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
 const [isManagePanelOpen, setIsManagePanelOpen] = useState(false);
 const [editingTeam, setEditingTeam] = useState(null);
 
 const [newTeam, setNewTeam] = useState({
 name: "",
 place: "Goa",
 customPlace: "",
 zone: "",
 lead: "",
 members: 0,
 openTickets: 0,
 slaCompliance: 100,
 });

 const fetchTeamsAndUsers = async () => {
 try {
 const [teamsData, usersData, devicesData] = await Promise.all([
 api.teams.getAll(),
 api.users.getAll(),
 api.devices.getAll()
 ]);
 setTeamsList(teamsData || []);
 setUsersList(usersData || []);
 setDevicesList(devicesData || []);
 } catch (err) {
 console.error("Failed to load teams/users/devices:", err);
 }
 };

 useEffect(() => {
 fetchTeamsAndUsers();
 }, []);

 useEffect(() => {
 setAnalyticsSearch("");
 setAnalyticsTypeFilter("all");
 setAnalyticsTableTab("users");
 }, [selectedPlace]);

 const uniqueRoles = useMemo(() => {
 const roles = usersList.map((u) => u.role).filter(Boolean);
 return Array.from(new Set(roles)).sort();
 }, [usersList]);

 const uniqueTeams = useMemo(() => {
 const teams = usersList.map((u) => u.team).filter(Boolean);
 return Array.from(new Set(teams)).sort();
 }, [usersList]);

 const uniqueZones = useMemo(() => {
 const zones = usersList.map((u) => u.zone).filter(Boolean);
 return Array.from(new Set(zones)).sort();
 }, [usersList]);

 const uniqueStatuses = useMemo(() => {
 const statuses = usersList.map((u) => getUserStatus(u, shifts)).filter(Boolean);
 return Array.from(new Set(statuses)).sort();
 }, [usersList, shifts]);

 const filteredUsers = useMemo(() => {
 // 1. Start with regional filter
 let result = usersList.filter((u) => {
 if (userPlace) {
 const uPlace = u.zone && (u.zone.toLowerCase().includes("goa") || ["north goa", "south goa", "central goa", "goa"].includes(u.zone.toLowerCase())) ? "Goa" : "Bhutan";
 if (uPlace !== userPlace) return false;
 }
 const isUserInactive = u.status === "Inactive";
 if (userDirectoryTab === "active" && isUserInactive) return false;
 if (userDirectoryTab === "inactive" && !isUserInactive) return false;
 return true;
 });

 // 2. Apply global search
 if (search.trim()) {
 const q = search.toLowerCase();
 result = result.filter((u) => 
 u.name.toLowerCase().includes(q) ||
 u.email.toLowerCase().includes(q) ||
 (u.team && u.team.toLowerCase().includes(q))
 );
 }

 // 3. Apply column-wise filters
 if (colUserFilter.trim()) {
 const q = colUserFilter.toLowerCase();
 result = result.filter((u) => 
 u.name.toLowerCase().includes(q) ||
 u.email.toLowerCase().includes(q) ||
 (u.mobile && u.mobile.toLowerCase().includes(q))
 );
 }

 if (userDirectoryTab !== "inactive") {
 if (colRoleFilter !== "all") {
 result = result.filter((u) => u.role === colRoleFilter);
 }

 if (colTeamFilter !== "all") {
 result = result.filter((u) => {
 if (colTeamFilter === "Unassigned") {
 return !u.team || u.team === "Unassigned";
 }
 return u.team === colTeamFilter;
 });
 }

 if (colZoneFilter !== "all") {
 result = result.filter((u) => u.zone === colZoneFilter);
 }
 }

 if (colStatusFilter !== "all" && userDirectoryTab !== "inactive") {
 result = result.filter((u) => getUserStatus(u, shifts) === colStatusFilter);
 }

 // 4. Apply sorting
 if (sortColumn && sortDirection) {
 result.sort((a, b) => {
 let valA = "";
 let valB = "";

 if (sortColumn === "user") {
 valA = a.name || "";
 valB = b.name || "";
 } else if (sortColumn === "role") {
 valA = a.role || "";
 valB = b.role || "";
 } else if (sortColumn === "team") {
 valA = a.team || "";
 valB = b.team || "";
 } else if (sortColumn === "zone") {
 valA = a.zone || "";
 valB = b.zone || "";
 } else if (sortColumn === "status") {
 valA = getUserStatus(a, shifts) || "";
 valB = getUserStatus(b, shifts) || "";
 }

 const comparison = valA.localeCompare(valB, undefined, { sensitivity: "base" });
 return sortDirection === "asc" ? comparison : -comparison;
 });
 }

 return result;
 }, [
 usersList,
 userPlace,
 user,
 search,
 colUserFilter,
 colRoleFilter,
 colTeamFilter,
 colZoneFilter,
 colStatusFilter,
 sortColumn,
 sortDirection,
 shifts,
 userDirectoryTab
 ]);

 // Calculate unique places and their metrics dynamically
 const places = Array.from(new Set(teamsList.map((t) => t.place || "Goa")))
 .filter((placeName) => !userPlace || placeName === userPlace)
 .map((placeName) => {
 const placeTeams = teamsList.filter((t) => (t.place || "Goa") === placeName);
 const totalMembers = placeTeams.reduce((sum, t) => sum + (t.members || 0), 0);
 const totalOpenTickets = placeTeams.reduce((sum, t) => sum + (t.openTickets || 0), 0);
 const avgSla = Math.round(
 placeTeams.reduce((sum, t) => sum + (t.slaCompliance || 100), 0) / (placeTeams.length || 1)
 );

 return {
 name: placeName,
 teamsCount: placeTeams.length,
 totalMembers,
 totalOpenTickets,
 avgSla,
 ...getPlaceMeta(placeName),
 };
 });

 const placeTeams = useMemo(() => {
 if (!selectedPlace) return [];
 return teamsList.filter((t) => (t.place || "Goa") === selectedPlace);
 }, [teamsList, selectedPlace]);

 const placeTeamNames = useMemo(() => {
 return placeTeams.map((t) => t.name);
 }, [placeTeams]);

 const placeUsers = useMemo(() => {
 if (!selectedPlace) return [];
 return usersList.filter((u) => {
 if (u.status === "Inactive") return false;
 if (u.zone === selectedPlace) return true;
 if (selectedPlace === "Goa" && ["North Goa", "Central Goa", "South Goa", "Goa"].includes(u.zone)) return true;
 if (u.team && placeTeamNames.includes(u.team)) return true;
 return false;
 });
 }, [usersList, selectedPlace, placeTeamNames]);

 const placeDevices = useMemo(() => {
 if (!selectedPlace) return [];
 return devicesList.filter((d) => {
 if (!d || !d.site) return false;
 if (selectedPlace === "Goa") {
 const nonGoaSites = [
 "San Jose HQ",
 "Frankfurt Data Center",
 "Singapore Tech Hub",
 "Sydney Terminal",
 "São Paulo Solar Hub",
 "London Operations Center"
 ];
 return !nonGoaSites.includes(d.site);
 } else if (selectedPlace === "Bhutan") {
 return d.site.toLowerCase().includes("thimphu") || d.site.toLowerCase().includes("paro") || d.site.toLowerCase().includes("bhutan");
 }
 return d.site.toLowerCase().includes(selectedPlace.toLowerCase());
 });
 }, [devicesList, selectedPlace]);

 const uniquePlaceRoles = useMemo(() => {
 const roles = placeUsers.map((u) => u.role).filter(Boolean);
 return Array.from(new Set(roles)).sort();
 }, [placeUsers]);

 const uniquePlaceTeams = useMemo(() => {
 const teams = placeUsers.map((u) => u.team).filter(Boolean);
 return Array.from(new Set(teams)).sort();
 }, [placeUsers]);

 const uniquePlaceZones = useMemo(() => {
 const zones = placeUsers.map((u) => u.zone).filter(Boolean);
 return Array.from(new Set(zones)).sort();
 }, [placeUsers]);

 const uniquePlaceStatuses = useMemo(() => {
 const statuses = placeUsers.map((u) => getUserStatus(u, shifts)).filter(Boolean);
 return Array.from(new Set(statuses)).sort();
 }, [placeUsers, shifts]);

 // Unique values for place devices
 const uniquePlaceDevTypes = useMemo(() => {
 const types = placeDevices.map((d) => d.type).filter(Boolean);
 return Array.from(new Set(types)).sort();
 }, [placeDevices]);

 const uniquePlaceDevSites = useMemo(() => {
 const sites = placeDevices.map((d) => d.site).filter(Boolean);
 return Array.from(new Set(sites)).sort();
 }, [placeDevices]);

 const uniquePlaceDevStatuses = useMemo(() => {
 const statuses = placeDevices.map((d) => d.status).filter(Boolean);
 return Array.from(new Set(statuses)).sort();
 }, [placeDevices]);

 const filteredPlaceUsers = useMemo(() => {
 let result = [...placeUsers];

 // Apply column filters
 if (colEmpUserFilter.trim()) {
 const q = colEmpUserFilter.toLowerCase();
 result = result.filter((u) =>
 u.name.toLowerCase().includes(q) ||
 u.email.toLowerCase().includes(q)
 );
 }

 if (colEmpRoleFilter !== "all") {
 result = result.filter((u) => u.role === colEmpRoleFilter);
 }

 if (colEmpTeamFilter !== "all") {
 result = result.filter((u) => {
 if (colEmpTeamFilter === "Unassigned") {
 return !u.team || u.team === "Unassigned";
 }
 return u.team === colEmpTeamFilter;
 });
 }

 if (colEmpZoneFilter !== "all") {
 result = result.filter((u) => u.zone === colEmpZoneFilter);
 }

 if (colEmpStatusFilter !== "all") {
 result = result.filter((u) => getUserStatus(u, shifts) === colEmpStatusFilter);
 }

 // Apply sorting
 if (sortEmpColumn && sortEmpDirection) {
 result.sort((a, b) => {
 let valA = "";
 let valB = "";

 if (sortEmpColumn === "user") {
 valA = a.name || "";
 valB = b.name || "";
 } else if (sortEmpColumn === "role") {
 valA = a.role || "";
 valB = b.role || "";
 } else if (sortEmpColumn === "team") {
 valA = a.team || "";
 valB = b.team || "";
 } else if (sortEmpColumn === "zone") {
 valA = a.zone || "";
 valB = b.zone || "";
 } else if (sortEmpColumn === "status") {
 valA = getUserStatus(a, shifts) || "";
 valB = getUserStatus(b, shifts) || "";
 }

 const comparison = valA.localeCompare(valB, undefined, { sensitivity: "base" });
 return sortEmpDirection === "asc" ? comparison : -comparison;
 });
 }

 return result;
 }, [placeUsers, colEmpUserFilter, colEmpRoleFilter, colEmpTeamFilter, colEmpZoneFilter, colEmpStatusFilter, sortEmpColumn, sortEmpDirection, shifts]);

 const filteredPlaceDevices = useMemo(() => {
 let result = [...placeDevices];

 // Apply column filters
 if (colDevIdFilter.trim()) {
 const q = colDevIdFilter.toLowerCase();
 result = result.filter((d) =>
 d.id.toLowerCase().includes(q) ||
 d.name.toLowerCase().includes(q)
 );
 }

 if (colDevTypeFilter !== "all") {
 result = result.filter((d) => d.type === colDevTypeFilter);
 }

 if (colDevSiteFilter !== "all") {
 result = result.filter((d) => d.site === colDevSiteFilter);
 }

 if (colDevStatusFilter !== "all") {
 result = result.filter((d) => d.status === colDevStatusFilter);
 }

 if (colDevConnFilter.trim()) {
 const q = colDevConnFilter.toLowerCase();
 result = result.filter((d) =>
 d.connectivity.toLowerCase().includes(q) ||
 String(d.battery).includes(q)
 );
 }

 // Apply sorting
 if (sortDevColumn && sortDevDirection) {
 result.sort((a, b) => {
 let valA = "";
 let valB = "";

 if (sortDevColumn === "id") {
 valA = a.id || "";
 valB = b.id || "";
 } else if (sortDevColumn === "type") {
 valA = a.type || "";
 valB = b.type || "";
 } else if (sortDevColumn === "site") {
 valA = a.site || "";
 valB = b.site || "";
 } else if (sortDevColumn === "status") {
 valA = a.status || "";
 valB = b.status || "";
 } else if (sortDevColumn === "connectivity") {
 valA = a.connectivity || "";
 valB = b.connectivity || "";
 }

 const comparison = valA.localeCompare(valB, undefined, { sensitivity: "base" });
 return sortDevDirection === "asc" ? comparison : -comparison;
 });
 }

 return result;
 }, [placeDevices, colDevIdFilter, colDevTypeFilter, colDevSiteFilter, colDevStatusFilter, colDevConnFilter, sortDevColumn, sortDevDirection]);

 const handleCreateTeam = async (e) => {
 e.preventDefault();
 const finalPlace = newTeam.place === "CUSTOM" ? newTeam.customPlace : newTeam.place;
 if (!finalPlace.trim() || !newTeam.name.trim() || !newTeam.lead.trim() || !newTeam.zone.trim()) {
 return;
 }

 try {
 const created = {
 name: newTeam.name,
 place: finalPlace,
 zone: newTeam.zone,
 lead: newTeam.lead,
 members: newTeam.members,
 openTickets: newTeam.openTickets,
 slaCompliance: newTeam.slaCompliance,
 };
 
 await api.teams.create(created);
 setSelectedPlace(finalPlace);
 setIsCreateModalOpen(false);
 fetchTeamsAndUsers();

 // Reset state
 setNewTeam({
 name: "",
 place: "Goa",
 customPlace: "",
 zone: "",
 lead: "",
 members: 0,
 openTickets: 0,
 slaCompliance: 100,
 });
 } catch (err) {
 console.error("Error creating team:", err);
 }
 };

 const handleAddUser = async (e) => {
 e.preventDefault();
 if (!newUser.name.trim() || !newUser.email.trim() || !newUser.role.trim() || !newUser.zone.trim()) {
 setAddUserError("All required fields must be filled.");
 return;
 }
 setIsSavingUser(true);
 setAddUserError("");
 try {
 const createdUser = {
 name: newUser.name,
 email: newUser.email,
 mobile: newUser.mobile,
 role: newUser.role,
 zone: newUser.zone,
 status: "Active",
 team: "Unassigned"
 };
 await api.users.create(createdUser);
 setIsAddUserModalOpen(false);
 fetchTeamsAndUsers();
 setNewUser({
 name: "",
 email: "",
 mobile: "",
 role: "Field Technician",
 zone: "Goa",
 });
 } catch (err) {
 console.error("Error creating user:", err);
 setAddUserError(err.message || "Failed to create user. Please verify user details.");
 } finally {
 setIsSavingUser(false);
 }
 };

  const handleOpenEditUserModal = (u) => {
    setEditingUser({
      id: u.id,
      name: u.name || "",
      email: u.email || "",
      mobile: u.mobile || "",
      role: u.role || "Field Technician",
      zone: u.zone || "Goa",
      status: u.status || "Active",
      team: u.team || "Unassigned"
    });
    setEditUserError("");
    setIsSavingEditUser(false);
    setIsEditUserModalOpen(true);
  };

  const handleConfirmInactivate = async (e) => {
    e.preventDefault();
    if (!inactivationReasonText.trim()) return;
    setIsSavingEditUser(true);
    try {
      const updatedUser = {
        ...editingUser,
        status: "Inactive",
        inactiveDateTime: new Date().toISOString(),
        inactivatedBy: user?.name || "Admin",
        inactivityReason: inactivationReasonText
      };
      await api.users.update(editingUser.id, updatedUser);
      setIsInactivateConfirmOpen(false);
      setIsEditUserModalOpen(false);
      setEditingUser(null);
      fetchTeamsAndUsers();
    } catch (err) {
      console.error("Error inactivating user:", err);
      setEditUserError(err.message || "Failed to inactivate user.");
    } finally {
      setIsSavingEditUser(false);
    }
  };

  const handleReactivateUser = async (u) => {
    if (!window.confirm(`Are you sure you want to reactivate user "${u.name}"?`)) return;
    try {
      const updatedUser = {
        ...u,
        status: "Active",
        inactiveDateTime: null,
        inactivatedBy: null,
        inactivityReason: null
      };
      await api.users.update(u.id, updatedUser);
      fetchTeamsAndUsers();
    } catch (err) {
      console.error("Error reactivating user:", err);
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    if (!editingUser || !editingUser.name.trim() || !editingUser.email.trim() || !editingUser.role.trim() || !editingUser.zone.trim()) {
      setEditUserError("All required fields must be filled.");
      return;
    }
    
    // Check if status is transitioning to Inactive
    const originalUser = usersList.find(u => u.id === editingUser.id);
    if (editingUser.status === "Inactive" && originalUser?.status !== "Inactive") {
      setUserToInactivate(editingUser);
      setInactivationReasonText("");
      setIsInactivateConfirmOpen(true);
      return;
    }

    setIsSavingEditUser(true);
    setEditUserError("");
    try {
      await api.users.update(editingUser.id, editingUser);
      setIsEditUserModalOpen(false);
      fetchTeamsAndUsers();
    } catch (err) {
      console.error("Error updating user:", err);
      setEditUserError(err.message || "Failed to update user. Please verify user details.");
    } finally {
      setIsSavingEditUser(false);
    }
  };

 // Manage Team settings update
 const handleUpdateTeam = async (updatedFields) => {
 if (!editingTeam) return;
 
 try {
 const updated = { ...editingTeam, ...updatedFields };
 await api.teams.update(editingTeam.id, updated);
 setEditingTeam(updated);
 fetchTeamsAndUsers();
 } catch (err) {
 console.error("Error updating team:", err);
 }
 };

 // Add squad member
 const handleAddTeamMember = async (userId) => {
 if (!editingTeam) return;
 const userToUpdate = usersList.find((u) => u.id === userId);
 if (!userToUpdate) return;
 
 try {
 await api.users.update(userId, { ...userToUpdate, team: editingTeam.name });
 const updatedTeam = { ...editingTeam, members: (editingTeam.members || 0) + 1 };
 await api.teams.update(editingTeam.id, updatedTeam);
 setEditingTeam(updatedTeam);
 fetchTeamsAndUsers();
 } catch (err) {
 console.error("Error adding member:", err);
 }
 };

 // Remove squad member
 const handleRemoveTeamMember = async (userId) => {
 if (!editingTeam) return;
 const userToUpdate = usersList.find((u) => u.id === userId);
 if (!userToUpdate) return;
 
 try {
 await api.users.update(userId, { ...userToUpdate, team: "Unassigned" });
 const updatedTeam = { ...editingTeam, members: Math.max(0, (editingTeam.members || 0) - 1) };
 await api.teams.update(editingTeam.id, updatedTeam);
 setEditingTeam(updatedTeam);
 fetchTeamsAndUsers();
 } catch (err) {
 console.error("Error removing member:", err);
 }
 };

 // Delete team
 const handleDeleteTeam = async (teamId) => {
 try {
 await api.teams.delete(teamId);
 setIsManagePanelOpen(false);
 setEditingTeam(null);
 fetchTeamsAndUsers();
 } catch (err) {
 console.error("Error deleting team:", err);
 }
 };

 const openManagePanel = (team) => {
 if (!team) return;
 setEditingTeam({ ...team });
 setIsManagePanelOpen(true);
 };

 const closeManagePanel = () => {
 setIsManagePanelOpen(false);
 setEditingTeam(null);
 };

 const headerAction = (
 <div className="flex flex-wrap items-center gap-3 sm:justify-end">
 {/* Action Button */}
 {activeTab === "teams" ? (
 canManageTeams && selectedPlace !== null && (
 <button
 type="button"
 onClick={() => {
 setNewTeam({ ...newTeam, place: selectedPlace });
 setIsCreateModalOpen(true);
 }}
 className="flex items-center gap-2 rounded-2xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-500 shadow-lg shadow-sky-950/20 "
 >
 <Plus className="h-4 w-4" />
 Create Team
 </button>
 )
 ) : (
 canManageUsers && (
 <button
 type="button"
 onClick={() => setIsAddUserModalOpen(true)}
 className="flex items-center gap-2 rounded-2xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-500 shadow-lg shadow-sky-950/20 "
 >
 <Plus className="h-4 w-4" />
 Add user
 </button>
 )
 )}
 </div>
 );

 return (
 <div className="space-y-6">
 <PageHeader
 title={
 (selectedPlace !== null && !userPlace) ? (
 <span className="inline-flex items-center gap-3">
 <button
 onClick={() => setSelectedPlace(null)}
 className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900/80 border border-slate-800/80 text-slate-350 hover:text-white hover:bg-slate-800 shadow-sm"
 aria-label="Back to Regions"
 >
 <ArrowLeft className="h-4 w-4" />
 </button>
 <span>{activeTab === "teams" ? "Schemes" : "User Management"}</span>
 </span>
 ) : (
 activeTab === "teams" ? "Schemes" : "User Management"
 )
 }
 action={headerAction}
 />

  {activeTab === "teams" ? (
    teamsList.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <RefreshCw className="h-6 w-6 animate-spin text-violet-500" />
        <span className="text-xs text-slate-500 font-medium">Loading Schemes...</span>
      </div>
    ) : selectedPlace === null ? (
 /* Place Overview (Rows Format) */
 <div className="flex flex-col gap-4">
 {places.map((place) => (
 <div
 key={place.name}
 onClick={() => setSelectedPlace(place.name)}
 className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-lg backdrop-blur-md cursor-pointer hover:border-sky-500/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 group"
 >
 {/* Background gradient hint */}
 <div className={`absolute -right-16 -top-16 h-36 w-36 rounded-full bg-gradient-to-br ${place.accent} opacity-5 blur-2xl group-hover:opacity-10 `} />

 {/* Left: Name and Country */}
 <div className="flex-1 min-w-[150px]">
 <h3 className="text-lg font-bold text-white group-hover:text-sky-400 ">
 {place.name}
 </h3>
 <p className="text-xs text-slate-500 font-medium mt-0.5">{place.country}</p>
 </div>

 {/* Center: Description */}
 <div className="flex-[3] max-w-2xl">
 <p className="text-sm text-slate-400 leading-relaxed line-clamp-2 sm:line-clamp-1">
 {place.description}
 </p>
 </div>

 {/* Right: Chevron */}
 <div className="flex items-center justify-end">
 <div className="h-8 w-8 rounded-xl bg-slate-800/60 flex items-center justify-center text-slate-400 group-hover:bg-sky-500/20 group-hover:text-sky-400 ">
 <ChevronRight className="h-4 w-4" />
 </div>
 </div>
 </div>
 ))}
 </div>
 ) : (
 /* Teams List for Selected Place */
 <div className="space-y-6">
 {/* Overview Card */}
 <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 shadow-lg backdrop-blur-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
 <div className="flex items-center gap-4">
 <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400">
 <Briefcase className="h-7 w-7" />
 </div>
 <div>
 <h3 className="text-xl font-bold text-white">
 {selectedPlace} Operations Control
 </h3>
 <p className="text-xs text-slate-400 mt-1">
 Regional Lead: <strong className="text-slate-200">{selectedPlace === "Goa" ? "Priya Nair" : (places.find(p => p.name === selectedPlace)?.lead || "Tashi Dorji")}</strong> (Operations Director)
 </p>
 </div>
 </div>
 <div className="flex flex-wrap gap-4 text-sm font-semibold">
 <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 px-4 py-2 text-center min-w-[110px]">
 <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Total Employees</p>
 <p className="text-base text-white mt-0.5">{placeUsers.length}</p>
 </div>
 <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 px-4 py-2 text-center min-w-[110px]">
 <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Active Devices</p>
 <p className="text-base text-white mt-0.5">{placeDevices.length}</p>
 </div>
 <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 px-4 py-2 text-center min-w-[110px]">
 <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Avg SLA Rate</p>
 <p className="text-base text-emerald-400 mt-0.5">
 {places.find(p => p.name === selectedPlace)?.avgSla || 100}%
 </p>
 </div>
 </div>
 </div>

 {/* Employee Role Analytics Grid */}
 <div className="space-y-3">
 <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Employee Role Breakdown</h4>
 <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">

 {/* Technicians */}
 <div className="rounded-3xl glass-card p-5 flex items-center justify-between group ">
 <div>
 <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Technicians</p>
 <p className="text-2xl font-extrabold text-white mt-1">
 {placeUsers.filter(u => u.role === "Field Technician" || u.role === "Technician").length}
 </p>
 </div>
 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
 <UserCog className="h-5 w-5" />
 </div>
 </div>

 {/* Warehouses */}
 <div className="rounded-3xl glass-card p-5 flex items-center justify-between group ">
 <div>
 <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Warehouses</p>
 <p className="text-2xl font-extrabold text-white mt-1">
 {placeUsers.filter(u => u.role === "Warehouse" || u.role === "Warehouse Manager").length}
 </p>
 </div>
 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
 <Layers className="h-5 w-5" />
 </div>
 </div>

 {/* Operational Managers */}
 <div className="rounded-3xl glass-card p-5 flex items-center justify-between group ">
 <div>
 <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Operational Managers</p>
 <p className="text-2xl font-extrabold text-white mt-1">
 {placeUsers.filter(u => u.role === "Operational Manager").length}
 </p>
 </div>
 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
 <Clock className="h-5 w-5" />
 </div>
 </div>
 </div>
 </div>

 {/* Device Analytics Section */}
 <div className="space-y-3">
 <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Device Analytics</h4>
 <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
 {/* ACE */}
 <div className="rounded-3xl glass-card p-5 flex items-center justify-between group ">
 <div>
 <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total ACE Devices</p>
 <p className="text-2xl font-extrabold text-white mt-1">
 {placeDevices.filter(d => d.type === "Ace").length}
 </p>
 </div>
 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
 <Cpu className="h-5 w-5" />
 </div>
 </div>

 {/* Mini */}
 <div className="rounded-3xl glass-card p-5 flex items-center justify-between group ">
 <div>
 <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Mini Devices</p>
 <p className="text-2xl font-extrabold text-white mt-1">
 {placeDevices.filter(d => d.type === "Mini").length}
 </p>
 </div>
 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
 <Radio className="h-5 w-5" />
 </div>
 </div>

 {/* FastScan */}
 <div className="rounded-3xl glass-card p-5 flex items-center justify-between group ">
 <div>
 <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total FastScan Devices</p>
 <p className="text-2xl font-extrabold text-white mt-1">
 {placeDevices.filter(d => d.type === "FastScan").length}
 </p>
 </div>
 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
 <Wifi className="h-5 w-5" />
 </div>
 </div>

 {/* Go */}
 <div className="rounded-3xl glass-card p-5 flex items-center justify-between group ">
 <div>
 <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Go Devices</p>
 <p className="text-2xl font-extrabold text-white mt-1">
 {placeDevices.filter(d => d.type === "Go").length}
 </p>
 </div>
 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/10 text-pink-400">
 <Battery className="h-5 w-5" />
 </div>
 </div>
 </div>
 </div>

 {/* Charts Grid */}
 <div className="grid gap-6 md:grid-cols-2">
  <Card className="glass-card">
  <CardBody>
  {placeUsers.length > 0 ? (
  <EmployeeAreaChart 
  data={[
  { label: "Technician", value: placeUsers.filter(u => u.role === "Field Technician" || u.role === "Technician").length, gradient: "from-sky-500 to-sky-300" },
  { label: "Warehouse", value: placeUsers.filter(u => u.role === "Warehouse" || u.role === "Warehouse Manager").length, gradient: "from-indigo-500 to-indigo-300" },
  { label: "Operational Manager", value: placeUsers.filter(u => u.role === "Operational Manager").length, gradient: "from-rose-500 to-rose-300" }
  ]}
  />
  ) : (
  <div className="flex flex-col items-center justify-center h-[180px] text-slate-500 text-xs">
    No Employee Data Available
  </div>
  )}
  </CardBody>
  </Card>
  
  <Card className="glass-card">
  <CardBody>
  {placeDevices.length > 0 ? (
  <DeviceCategoryPieChart 
  data={[
  { label: "ACE Sensors", value: placeDevices.filter(d => d.type === "Ace").length, gradient: "from-emerald-500 to-emerald-300" },
  { label: "Mini Gateways", value: placeDevices.filter(d => d.type === "Mini").length, gradient: "from-violet-500 to-violet-300" },
  { label: "FastScan Mod.", value: placeDevices.filter(d => d.type === "FastScan").length, gradient: "from-sky-500 to-sky-300" },
  { label: "Go Monitors", value: placeDevices.filter(d => d.type === "Go").length, gradient: "from-pink-500 to-pink-300" }
  ]}
  />
  ) : (
  <div className="flex flex-col items-center justify-center h-[180px] text-slate-500 text-xs">
    No Device Data Available
  </div>
  )}
  </CardBody>
  </Card>
  </div>

 {/* Squads & Teams List */}
 <div className="space-y-3">
 <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Operational Squads & Teams</h4>
 <div className="grid gap-4 md:grid-cols-2">
 {teamsList
 .filter((team) => (team.place || "Goa") === selectedPlace)
 .map((team, idx) => (
 <Card key={team.id} className={teamColors[idx % teamColors.length]}>
 <CardBody>
 <div className="flex items-start justify-between gap-3">
 <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-sky-400">
 <Users className="h-6 w-6" />
 </div>
 <div className="flex items-center gap-2 relative">
 <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">
 {team.zone}
 </span>
 {canManageTeams && (
 <div className="relative">
 <button
 type="button"
 onClick={() => setActiveDropdown(activeDropdown === team.id ? null : team.id)}
 className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-white cursor-pointer"
 title="Actions"
 >
 <MoreVertical className="h-4 w-4" />
 </button>
 {activeDropdown === team.id && (
 <>
 <div 
 className="fixed inset-0 z-10" 
 onClick={(e) => {
 e.stopPropagation();
 setActiveDropdown(null);
 }}
 />
 <div className="absolute right-0 mt-1.5 z-20 w-32 rounded-xl border border-slate-800 bg-slate-900 py-1 shadow-xl">
 <button
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 setActiveDropdown(null);
 openManagePanel(team);
 }}
 className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"
 >
 <UserCog className="h-3.5 w-3.5" />
 Edit
 </button>
 <button
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 setActiveDropdown(null);
 if (window.confirm(`Are you sure you want to delete team "${team.name}"?`)) {
 handleDeleteTeam(team.id);
 }
 }}
 className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-rose-450 hover:bg-rose-500/10 hover:text-rose-400"
 >
 <Trash2 className="h-3.5 w-3.5" />
 Delete
 </button>
 </div>
 </>
 )}
 </div>
 )}
 </div>
 </div>
 <h3 className="mt-4 text-lg font-semibold text-white">
 {team.name}
 </h3>
 <p className="mt-1 text-sm text-slate-400">
 Lead: {team.lead}
 </p>
 <div className="mt-6 grid grid-cols-3 gap-3 text-center">
 <div className="rounded-2xl border border-slate-800 bg-slate-900/50 py-3">
 <p className="text-xl font-semibold text-white">
 {team.members}
 </p>
 <p className="text-xs text-slate-500">Members</p>
 </div>
 <div className="rounded-2xl border border-slate-800 bg-slate-900/50 py-3">
 <p className="text-xl font-semibold text-sky-300">
 {team.openTickets}
 </p>
 <p className="text-xs text-slate-500">Open tickets</p>
 </div>
 <div className="rounded-2xl border border-slate-800 bg-slate-900/50 py-3">
 <p className="text-xl font-semibold text-emerald-300">
 {team.slaCompliance}%
 </p>
 <p className="text-xs text-slate-500">SLA compliance</p>
 </div>
 </div>
 </CardBody>
 </Card>
 ))}
 </div>
 </div>

 {/* Employees & Devices Table Section */}
 <Card className="glass-card">
 <CardHeader
 title={
 <div className="flex items-center gap-4">
 <button
 onClick={() => {
 setAnalyticsTableTab("users");
 setAnalyticsSearch("");
 setAnalyticsTypeFilter("all");
 }}
 className={clsx(
 "text-sm font-semibold pb-1 border-b-2 ",
 analyticsTableTab === "users" ? "border-sky-500 text-sky-400" : "border-transparent text-slate-400"
 )}
 >
 Employees List
 </button>
 <button
 onClick={() => {
 setAnalyticsTableTab("devices");
 setAnalyticsSearch("");
 setAnalyticsTypeFilter("all");
 }}
 className={clsx(
 "text-sm font-semibold pb-1 border-b-2 ",
 analyticsTableTab === "devices" ? "border-sky-500 text-sky-400" : "border-transparent text-slate-400"
 )}
 >
 Devices List
 </button>
 </div>
 }
 />
 <CardBody>
 <div className="overflow-x-auto">
 {analyticsTableTab === "users" ? (
 /* Employees Table */
 (() => {
 return (
 <div>
 <table className="w-full min-w-[700px] text-left text-sm">
 <thead className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
 {/* Sorting Header Row */}
 <tr className="bg-slate-900/40 dark:bg-slate-900/60">
 <th className="pb-3 pr-4 whitespace-nowrap pl-4">
 <button
 type="button"
 onClick={() => handleEmpSort("user")}
 className="flex items-center gap-1.5 hover:text-white uppercase font-bold tracking-wider "
 >
 User
 {sortEmpColumn === "user" ? (
 sortEmpDirection === "asc" ? <ChevronUp className="h-3.5 w-3.5 text-sky-400" /> : <ChevronDown className="h-3.5 w-3.5 text-sky-400" />
 ) : (
 <ArrowUpDown className="h-3 w-3 text-slate-500 opacity-50 hover:opacity-100" />
 )}
 </button>
 </th>
 <th className="pb-3 pr-4 whitespace-nowrap">
 <button
 type="button"
 onClick={() => handleEmpSort("role")}
 className="flex items-center gap-1.5 hover:text-white uppercase font-bold tracking-wider "
 >
 Role
 {sortEmpColumn === "role" ? (
 sortEmpDirection === "asc" ? <ChevronUp className="h-3.5 w-3.5 text-sky-400" /> : <ChevronDown className="h-3.5 w-3.5 text-sky-400" />
 ) : (
 <ArrowUpDown className="h-3 w-3 text-slate-500 opacity-50 hover:opacity-100" />
 )}
 </button>
 </th>
 <th className="pb-3 pr-4 whitespace-nowrap">
 <button
 type="button"
 onClick={() => handleEmpSort("team")}
 className="flex items-center gap-1.5 hover:text-white uppercase font-bold tracking-wider "
 >
 Team
 {sortEmpColumn === "team" ? (
 sortEmpDirection === "asc" ? <ChevronUp className="h-3.5 w-3.5 text-sky-400" /> : <ChevronDown className="h-3.5 w-3.5 text-sky-400" />
 ) : (
 <ArrowUpDown className="h-3 w-3 text-slate-500 opacity-50 hover:opacity-100" />
 )}
 </button>
 </th>
 <th className="pb-3 pr-4 whitespace-nowrap">
 <button
 type="button"
 onClick={() => handleEmpSort("zone")}
 className="flex items-center gap-1.5 hover:text-white uppercase font-bold tracking-wider "
 >
 Zone
 {sortEmpColumn === "zone" ? (
 sortEmpDirection === "asc" ? <ChevronUp className="h-3.5 w-3.5 text-sky-400" /> : <ChevronDown className="h-3.5 w-3.5 text-sky-400" />
 ) : (
 <ArrowUpDown className="h-3 w-3 text-slate-500 opacity-50 hover:opacity-100" />
 )}
 </button>
 </th>
 <th className="pb-3 pr-4 whitespace-nowrap">
 <button
 type="button"
 onClick={() => handleEmpSort("status")}
 className="flex items-center gap-1.5 hover:text-white uppercase font-bold tracking-wider "
 >
 Status
 {sortEmpColumn === "status" ? (
 sortEmpDirection === "asc" ? <ChevronUp className="h-3.5 w-3.5 text-sky-400" /> : <ChevronDown className="h-3.5 w-3.5 text-sky-400" />
 ) : (
 <ArrowUpDown className="h-3.5 w-3.5 text-slate-500 opacity-50 hover:opacity-100" />
 )}
 </button>
 </th>
 <th className="pb-3 pr-4 whitespace-nowrap text-left text-xs uppercase font-bold text-slate-500">Actions</th>
 </tr>

 {/* Filtering Row */}
 <tr className="bg-slate-900/10 border-b border-slate-800">
 <th className="py-2.5 pr-4 pl-4">
 <div className="relative">
 <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
 <input
 type="text"
 value={colEmpUserFilter}
 onChange={(e) => setColEmpUserFilter(e.target.value)}
 placeholder="Filter User..."
 className="w-full rounded-xl border border-slate-700 bg-slate-950/60 py-1.5 pl-8 pr-3 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-violet-500/50"
 />
 </div>
 </th>
 <th className="py-2.5 pr-4">
 <CustomSelect
 value={colEmpRoleFilter}
 onChange={(e) => setColEmpRoleFilter(e.target.value)}
 options={[
 { value: "all", label: "All Roles" },
 ...uniquePlaceRoles.map((role) => ({ value: role, label: role }))
 ]}
 fullWidth
 className="py-1.5 px-2 text-xs text-slate-100 border-slate-800 bg-slate-950/60"
 />
 </th>
 <th className="py-2.5 pr-4">
 <CustomSelect
 value={colEmpTeamFilter}
 onChange={(e) => setColEmpTeamFilter(e.target.value)}
 options={[
 { value: "all", label: "All Teams" },
 { value: "Unassigned", label: "Unassigned" },
 ...uniquePlaceTeams.filter(t => t && t !== "Unassigned").map((team) => ({ value: team, label: team }))
 ]}
 fullWidth
 className="py-1.5 px-2 text-xs text-slate-100 border-slate-800 bg-slate-950/60"
 />
 </th>
 <th className="py-2.5 pr-4">
 <CustomSelect
 value={colEmpZoneFilter}
 onChange={(e) => setColEmpZoneFilter(e.target.value)}
 options={[
 { value: "all", label: "All Zones" },
 ...uniquePlaceZones.map((zone) => ({ value: zone, label: zone }))
 ]}
 fullWidth
 className="py-1.5 px-2 text-xs text-slate-100 border-slate-800 bg-slate-950/60"
 />
 </th>
 <th className="py-2.5 pr-4">
 <CustomSelect
 value={colEmpStatusFilter}
 onChange={(e) => setColEmpStatusFilter(e.target.value)}
 options={[
 { value: "all", label: "All Statuses" },
 ...uniquePlaceStatuses.map((status) => ({ value: status, label: status }))
 ]}
 fullWidth
 className="w-full text-xs text-slate-100 border-slate-800 bg-slate-950/60"
 />
 </th>
 <th className="py-2.5 pr-4">
 <button
 type="button"
 onClick={handleClearEmpFilters}
 title="Reset Filters"
 className="flex h-7 w-7 items-center justify-center rounded-xl border border-slate-700 bg-slate-950/40 text-slate-400 hover:text-white hover:bg-slate-800 shrink-0 cursor-pointer"
 >
 <RotateCcw className="h-3 w-3" />
 </button>
 </th>
 </tr>
 </thead>
 <tbody>
 {filteredPlaceUsers.map((u) => {
 const currentStatus = getUserStatus(u, shifts);
 return (
 <tr key={u.id} className="border-b border-slate-800/60 hover:bg-slate-900/30 fade-in-50 ">
 <td className="py-4 pr-4 pl-4 whitespace-nowrap">
 <p className="font-medium text-white">{u.name}</p>
 <p className="text-xs text-slate-500">{u.email}</p>
 </td>
 <td className="py-4 pr-4 whitespace-nowrap">
 <Badge variant={roleBadge(u.role)}>{u.role}</Badge>
 </td>
 <td className="py-4 pr-4 text-slate-300 whitespace-nowrap">{u.team || "—"}</td>
 <td className="py-4 pr-4 text-slate-300 whitespace-nowrap">{u.zone}</td>
 <td className="py-4 pr-4 whitespace-nowrap">
 <Badge variant={getUserStatusVariant(currentStatus)}>
 {currentStatus}
 </Badge>
 </td>
 <td className="py-4 pr-4">
 <button
 type="button"
 onClick={() => handleOpenEditUserModal(u)}
 className="flex items-center gap-1 rounded-xl border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-900 cursor-pointer"
 >
 <UserCog className="h-3.5 w-3.5" />
 Edit
 </button>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 {filteredPlaceUsers.length === 0 && (
 <p className="py-8 text-center text-slate-500 text-sm">No matching employees found in {selectedPlace}.</p>
 )}
 </div>
 );
 })()
 ) : (
 /* Devices Table */
 (() => {
 return (
 <div>
 <table className="w-full min-w-[700px] text-left text-sm">
 <thead className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
 {/* Sorting Header Row */}
 <tr className="bg-slate-900/40 dark:bg-slate-900/60">
 <th className="pb-3 pr-4 whitespace-nowrap pl-4">
 <button
 type="button"
 onClick={() => handleDevSort("id")}
 className="flex items-center gap-1.5 hover:text-white uppercase font-bold tracking-wider "
 >
 Device ID
 {sortDevColumn === "id" ? (
 sortDevDirection === "asc" ? <ChevronUp className="h-3.5 w-3.5 text-sky-400" /> : <ChevronDown className="h-3.5 w-3.5 text-sky-400" />
 ) : (
 <ArrowUpDown className="h-3 w-3 text-slate-500 opacity-50 hover:opacity-100" />
 )}
 </button>
 </th>
 <th className="pb-3 pr-4 whitespace-nowrap">
 <button
 type="button"
 onClick={() => handleDevSort("type")}
 className="flex items-center gap-1.5 hover:text-white uppercase font-bold tracking-wider "
 >
 Type
 {sortDevColumn === "type" ? (
 sortDevDirection === "asc" ? <ChevronUp className="h-3.5 w-3.5 text-sky-400" /> : <ChevronDown className="h-3.5 w-3.5 text-sky-400" />
 ) : (
 <ArrowUpDown className="h-3 w-3 text-slate-500 opacity-50 hover:opacity-100" />
 )}
 </button>
 </th>
 <th className="pb-3 pr-4 whitespace-nowrap">
 <button
 type="button"
 onClick={() => handleDevSort("site")}
 className="flex items-center gap-1.5 hover:text-white uppercase font-bold tracking-wider "
 >
 CP Site
 {sortDevColumn === "site" ? (
 sortDevDirection === "asc" ? <ChevronUp className="h-3.5 w-3.5 text-sky-400" /> : <ChevronDown className="h-3.5 w-3.5 text-sky-400" />
 ) : (
 <ArrowUpDown className="h-3 w-3 text-slate-500 opacity-50 hover:opacity-100" />
 )}
 </button>
 </th>
 <th className="pb-3 pr-4 whitespace-nowrap">
 <button
 type="button"
 onClick={() => handleDevSort("status")}
 className="flex items-center gap-1.5 hover:text-white uppercase font-bold tracking-wider "
 >
 Status
 {sortDevColumn === "status" ? (
 sortDevDirection === "asc" ? <ChevronUp className="h-3.5 w-3.5 text-sky-400" /> : <ChevronDown className="h-3.5 w-3.5 text-sky-400" />
 ) : (
 <ArrowUpDown className="h-3 w-3 text-slate-500 opacity-50 hover:opacity-100" />
 )}
 </button>
 </th>
 <th className="pb-3 pr-4 whitespace-nowrap">
 <button
 type="button"
 onClick={() => handleDevSort("connectivity")}
 className="flex items-center gap-1.5 hover:text-white uppercase font-bold tracking-wider "
 >
 Connectivity
 {sortDevColumn === "connectivity" ? (
 sortDevDirection === "asc" ? <ChevronUp className="h-3.5 w-3.5 text-sky-400" /> : <ChevronDown className="h-3.5 w-3.5 text-sky-400" />
 ) : (
 <ArrowUpDown className="h-3 w-3 text-slate-500 opacity-50 hover:opacity-100" />
 )}
 </button>
 </th>
 </tr>

 {/* Filtering Row */}
 <tr className="bg-slate-900/10 border-b border-slate-800">
 <th className="py-2.5 pr-4 pl-4">
 <div className="relative">
 <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
 <input
 type="text"
 value={colDevIdFilter}
 onChange={(e) => setColDevIdFilter(e.target.value)}
 placeholder="Filter Device..."
 className="w-full rounded-xl border border-slate-700 bg-slate-950/60 py-1.5 pl-8 pr-3 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-violet-500/50"
 />
 </div>
 </th>
 <th className="py-2.5 pr-4">
 <select
 value={colDevTypeFilter}
 onChange={(e) => setColDevTypeFilter(e.target.value)}
 className="w-full rounded-xl border border-slate-700 bg-slate-950/60 py-1.5 px-2 text-xs text-slate-100 outline-none focus:border-violet-500/50 cursor-pointer"
 >
 <option value="all">All Types</option>
 {uniquePlaceDevTypes.map((type) => (
 <option key={type} value={type}>{type}</option>
 ))}
 </select>
 </th>
 <th className="py-2.5 pr-4">
 <select
 value={colDevSiteFilter}
 onChange={(e) => setColDevSiteFilter(e.target.value)}
 className="w-full rounded-xl border border-slate-700 bg-slate-950/60 py-1.5 px-2 text-xs text-slate-100 outline-none focus:border-violet-500/50 cursor-pointer"
 >
 <option value="all">All CPs</option>
 {uniquePlaceDevSites.map((site) => (
 <option key={site} value={site}>{site}</option>
 ))}
 </select>
 </th>
 <th className="py-2.5 pr-4">
 <select
 value={colDevStatusFilter}
 onChange={(e) => setColDevStatusFilter(e.target.value)}
 className="w-full rounded-xl border border-slate-700 bg-slate-950/60 py-1.5 px-2 text-xs text-slate-100 outline-none focus:border-violet-500/50 cursor-pointer"
 >
 <option value="all">All Statuses</option>
 {uniquePlaceDevStatuses.map((status) => (
 <option key={status} value={status}>{status}</option>
 ))}
 </select>
 </th>
 <th className="py-2.5 pr-4">
 <div className="flex items-center gap-1.5">
 <input
 type="text"
 value={colDevConnFilter}
 onChange={(e) => setColDevConnFilter(e.target.value)}
 placeholder="Filter Conn..."
 className="flex-1 rounded-xl border border-slate-700 bg-slate-950/60 py-1.5 px-2 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-violet-500/50"
 />
 <button
 type="button"
 onClick={handleClearDevFilters}
 title="Reset Filters"
 className="flex h-7 w-7 items-center justify-center rounded-xl border border-slate-700 bg-slate-950/40 text-slate-400 hover:text-white hover:bg-slate-800 shrink-0"
 >
 <RotateCcw className="h-3 w-3" />
 </button>
 </div>
 </th>
 </tr>
 </thead>
 <tbody>
 {filteredPlaceDevices.map((d) => (
 <tr key={d.id} className="border-b border-slate-800/60 hover:bg-slate-900/30 fade-in-50 ">
 <td className="py-4 pr-4 pl-4 whitespace-nowrap">
 <p className="font-semibold text-sky-400 hover:text-sky-300 hover:underline text-left cursor-pointer">{d.id}</p>
 <p className="text-xs text-slate-500">{d.name}</p>
 </td>
 <td className="py-4 pr-4 text-slate-300 whitespace-nowrap">{d.type}</td>
 <td className="py-4 pr-4 text-slate-350 whitespace-nowrap">{d.site || "—"}</td>
 <td className="py-4 pr-4 whitespace-nowrap">
 <Badge variant={deviceStatusVariant(d.status)}>{d.status}</Badge>
 </td>
 <td className="py-4 pr-4 text-slate-350 whitespace-nowrap">
 {d.connectivity} ({d.battery}%)
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 {filteredPlaceDevices.length === 0 && (
 <p className="py-8 text-center text-slate-500 text-sm">No matching devices found in {selectedPlace}.</p>
 )}
 </div>
 );
 })()
 )}
 </div>
 </CardBody>
 </Card>
 </div>
 )
) : (
 /* User Directory Tab */
 <Card className="glass-card">
   <CardHeader 
     title={
       <div className="flex items-center gap-4">
         <button
           onClick={() => setUserDirectoryTab("active")}
           className={clsx(
             "text-sm font-semibold pb-1 border-b-2 ",
             userDirectoryTab === "active" ? "border-sky-500 text-sky-400" : "border-transparent text-slate-400"
           )}
         >
           Active Users
         </button>
         <button
           onClick={() => setUserDirectoryTab("inactive")}
           className={clsx(
             "text-sm font-semibold pb-1 border-b-2 ",
             userDirectoryTab === "inactive" ? "border-sky-500 text-sky-400" : "border-transparent text-slate-400"
           )}
         >
           Inactive Users
         </button>
       </div>
     }
     subtitle={`${filteredUsers.length} accounts`} 
   />
   <CardBody>
     <div className="overflow-x-auto">
       {userDirectoryTab === "active" ? (
         <table className="w-full min-w-[700px] text-left text-sm">
           <thead className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
             {/* Sorting Header Row */}
             <tr className="bg-slate-900/40 dark:bg-slate-900/60">
               <th className="pb-3 pr-4 whitespace-nowrap pl-4">
                 <button
                   type="button"
                   onClick={() => handleSort("user")}
                   className="flex items-center gap-1.5 hover:text-white uppercase font-bold tracking-wider "
                 >
                   User
                   {sortColumn === "user" ? (
                     sortDirection === "asc" ? <ChevronUp className="h-3.5 w-3.5 text-sky-400" /> : <ChevronDown className="h-3.5 w-3.5 text-sky-400" />
                   ) : (
                     <ArrowUpDown className="h-3.5 w-3.5 text-slate-500 opacity-50 hover:opacity-100" />
                   )}
                 </button>
               </th>
               <th className="pb-3 pr-4 whitespace-nowrap">
                 <button
                   type="button"
                   onClick={() => handleSort("role")}
                   className="flex items-center gap-1.5 hover:text-white uppercase font-bold tracking-wider "
                 >
                   Role
                   {sortColumn === "role" ? (
                     sortDirection === "asc" ? <ChevronUp className="h-3.5 w-3.5 text-sky-400" /> : <ChevronDown className="h-3.5 w-3.5 text-sky-400" />
                   ) : (
                     <ArrowUpDown className="h-3.5 w-3.5 text-slate-500 opacity-50 hover:opacity-100" />
                   )}
                 </button>
               </th>
               <th className="pb-3 pr-4 whitespace-nowrap">
                 <button
                   type="button"
                   onClick={() => handleSort("team")}
                   className="flex items-center gap-1.5 hover:text-white uppercase font-bold tracking-wider "
                 >
                   Team
                   {sortColumn === "team" ? (
                     sortDirection === "asc" ? <ChevronUp className="h-3.5 w-3.5 text-sky-400" /> : <ChevronDown className="h-3.5 w-3.5 text-sky-400" />
                   ) : (
                     <ArrowUpDown className="h-3.5 w-3.5 text-slate-500 opacity-50 hover:opacity-100" />
                   )}
                 </button>
               </th>
               <th className="pb-3 pr-4 whitespace-nowrap">
                 <button
                   type="button"
                   onClick={() => handleSort("zone")}
                   className="flex items-center gap-1.5 hover:text-white uppercase font-bold tracking-wider "
                 >
                   Zone
                   {sortColumn === "zone" ? (
                     sortDirection === "asc" ? <ChevronUp className="h-3.5 w-3.5 text-sky-400" /> : <ChevronDown className="h-3.5 w-3.5 text-sky-400" />
                   ) : (
                     <ArrowUpDown className="h-3.5 w-3.5 text-slate-500 opacity-50 hover:opacity-100" />
                   )}
                 </button>
               </th>
               <th className="pb-3 pr-4 whitespace-nowrap">
                 <button
                   type="button"
                   onClick={() => handleSort("status")}
                   className="flex items-center gap-1.5 hover:text-white uppercase font-bold tracking-wider "
                 >
                   Status
                   {sortColumn === "status" ? (
                     sortDirection === "asc" ? <ChevronUp className="h-3.5 w-3.5 text-sky-400" /> : <ChevronDown className="h-3.5 w-3.5 text-sky-400" />
                   ) : (
                     <ArrowUpDown className="h-3.5 w-3.5 text-slate-500 opacity-50 hover:opacity-100" />
                   )}
                 </button>
               </th>
               <th className="pb-3 whitespace-nowrap pr-4">Actions</th>
             </tr>

             {/* Filtering Row */}
             <tr className="bg-slate-900/10 border-b border-slate-800">
               <th className="py-2.5 pr-4 pl-4">
                 <div className="relative">
                   <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                   <input
                     type="text"
                     value={colUserFilter}
                     onChange={(e) => setColUserFilter(e.target.value)}
                     placeholder="Filter User..."
                     className="w-full rounded-xl border border-slate-700 bg-slate-950/60 py-1.5 pl-8 pr-3 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-violet-500/50"
                   />
                 </div>
               </th>
               <th className="py-2.5 pr-4">
                 <select
                   value={colRoleFilter}
                   onChange={(e) => setColRoleFilter(e.target.value)}
                   className="w-full rounded-xl border border-slate-700 bg-slate-950/60 py-1.5 px-2 text-xs text-slate-100 outline-none focus:border-violet-500/50 cursor-pointer"
                 >
                   <option value="all">All Roles</option>
                   {uniqueRoles.map((role) => (
                     <option key={role} value={role}>{role}</option>
                   ))}
                 </select>
               </th>
               <th className="py-2.5 pr-4">
                 <select
                   value={colTeamFilter}
                   onChange={(e) => setColTeamFilter(e.target.value)}
                   className="w-full rounded-xl border border-slate-700 bg-slate-950/60 py-1.5 px-2 text-xs text-slate-100 outline-none focus:border-violet-500/50 cursor-pointer"
                 >
                   <option value="all">All Teams</option>
                   <option value="Unassigned">Unassigned</option>
                   {uniqueTeams.filter(t => t && t !== "Unassigned").map((team) => (
                     <option key={team} value={team}>{team}</option>
                   ))}
                 </select>
               </th>
               <th className="py-2.5 pr-4">
                 <select
                   value={colZoneFilter}
                   onChange={(e) => setColZoneFilter(e.target.value)}
                   className="w-full rounded-xl border border-slate-700 bg-slate-950/60 py-1.5 px-2 text-xs text-slate-100 outline-none focus:border-violet-500/50 cursor-pointer"
                 >
                   <option value="all">All Zones</option>
                   {uniqueZones.map((zone) => (
                     <option key={zone} value={zone}>{zone}</option>
                   ))}
                 </select>
               </th>
               <th className="py-2.5 pr-4">
                 <select
                   value={colStatusFilter}
                   onChange={(e) => setColStatusFilter(e.target.value)}
                   className="w-full rounded-xl border border-slate-700 bg-slate-950/60 py-1.5 px-2 text-xs text-slate-100 outline-none focus:border-violet-500/50 cursor-pointer"
                 >
                   <option value="all">All Statuses</option>
                   {uniqueStatuses.map((status) => (
                     <option key={status} value={status}>{status}</option>
                   ))}
                 </select>
               </th>
               <th className="py-2.5 pr-4">
                 <button
                   type="button"
                   onClick={handleClearAllFilters}
                   title="Reset Filters"
                   className="flex items-center justify-center gap-1 rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                 >
                   <RotateCcw className="h-3 w-3" />
                   Reset
                 </button>
               </th>
             </tr>
           </thead>
           <tbody>
             {filteredUsers.map((u) => (
               <tr
                 key={u.id}
                 className="border-b border-slate-800/60 hover:bg-slate-900/30"
               >
                 <td className="py-4 pr-4 pl-4">
                   <p className="font-medium text-white">{u.name}</p>
                   <p className="text-xs text-slate-500">
                     {u.email} {u.mobile && <span className="text-slate-600 ml-1.5">· {u.mobile}</span>}
                   </p>
                 </td>
                 <td className="py-4 pr-4">
                   <Badge variant={roleBadge(u.role)}>{u.role}</Badge>
                 </td>
                 <td className="py-4 pr-4 text-slate-300">{u.team || "—"}</td>
                 <td className="py-4 pr-4 text-slate-300">{u.zone}</td>
                 <td className="py-4 pr-4">
                   <Badge variant={getUserStatusVariant(getUserStatus(u, shifts))}>
                     {getUserStatus(u, shifts)}
                   </Badge>
                 </td>
                 <td className="py-4 pr-4">
                   <button
                     type="button"
                     onClick={() => handleOpenEditUserModal(u)}
                     className="flex items-center gap-1 rounded-xl border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-900 cursor-pointer"
                   >
                     <UserCog className="h-3.5 w-3.5" />
                     Edit
                   </button>
                 </td>
               </tr>
             ))}
           </tbody>
         </table>
       ) : (
         <table className="w-full min-w-[700px] text-left text-sm">
           <thead className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
             <tr className="bg-slate-900/40 dark:bg-slate-900/60">
               <th className="pb-3 pr-4 pl-4 whitespace-nowrap">User Name</th>
               <th className="pb-3 pr-4 whitespace-nowrap">Role</th>
               <th className="pb-3 pr-4 whitespace-nowrap">Inactive Date & Time</th>
               <th className="pb-3 pr-4 whitespace-nowrap">Inactivated By</th>
               <th className="pb-3 pr-4 whitespace-nowrap">Reason for Inactivation</th>
               <th className="pb-3 pr-4 whitespace-nowrap">User Status</th>
               <th className="pb-3 whitespace-nowrap pr-4">Actions</th>
             </tr>
           </thead>
           <tbody>
             {filteredUsers.map((u) => (
               <tr
                 key={u.id}
                 className="border-b border-slate-800/60 hover:bg-slate-900/30"
               >
                 <td className="py-4 pr-4 pl-4">
                   <p className="font-medium text-white">{u.name}</p>
                   <p className="text-xs text-slate-500">
                     {u.email} {u.mobile && <span className="text-slate-600 ml-1.5">· {u.mobile}</span>}
                   </p>
                 </td>
                 <td className="py-4 pr-4">
                   <Badge variant={roleBadge(u.role)}>{u.role}</Badge>
                 </td>
                 <td className="py-4 pr-4 text-slate-300 whitespace-nowrap">
                   {u.inactiveDateTime ? new Date(u.inactiveDateTime).toLocaleString("en-US", {
                     month: "short",
                     day: "numeric",
                     year: "numeric",
                     hour: "2-digit",
                     minute: "2-digit",
                     hour12: true,
                   }) : "—"}
                 </td>
                 <td className="py-4 pr-4 text-slate-300">{u.inactivatedBy || "—"}</td>
                 <td className="py-4 pr-4 text-slate-400 max-w-xs truncate" title={u.inactivityReason}>
                   {u.inactivityReason || "—"}
                 </td>
                 <td className="py-4 pr-4">
                   <Badge variant="muted">{u.status || "Inactive"}</Badge>
                 </td>
                 <td className="py-4 pr-4">
                   <button
                     type="button"
                     onClick={() => handleReactivateUser(u)}
                     className="flex items-center gap-1 rounded-xl border border-emerald-800 bg-emerald-950/25 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-900 hover:text-emerald-350 cursor-pointer"
                   >
                     <RotateCcw className="h-3.5 w-3.5" />
                     Reactivate
                   </button>
                 </td>
               </tr>
             ))}
           </tbody>
         </table>
       )}
       {filteredUsers.length === 0 && (
         <p className="py-8 text-center text-slate-500 text-sm">No matching users found.</p>
       )}
     </div>
   </CardBody>
 </Card>
 )}

 {/* Create Team Modal */}
 {isCreateModalOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 backdrop-blur-md p-4 py-8">
 <div className="w-full max-w-lg max-h-[calc(100vh-4rem)] overflow-y-auto border border-slate-800 bg-slate-900/95 rounded-3xl p-6 shadow-2xl relative flex flex-col gap-5">
 <button
 onClick={() => setIsCreateModalOpen(false)}
 className="absolute top-4 right-4 text-slate-400 hover:text-white rounded-xl p-1.5 hover:bg-slate-800/50 "
 >
 <X className="h-5 w-5" />
 </button>

 <div>
 <h3 className="text-xl font-bold text-white">
 Create New {selectedPlace === null ? "Region" : "Team"}
 </h3>
 <p className="text-xs text-slate-400 mt-1">
 Configure and deploy a new field response {selectedPlace === null ? "region" : "team"}.
 </p>
 </div>

 <form onSubmit={handleCreateTeam} className="space-y-4">
 <div className="space-y-1.5">
 <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
 {selectedPlace === null ? "Region Name" : "Team Name"}
 </label>
 <input
 type="text"
 required
 placeholder={selectedPlace === null ? "e.g. Goa Coastal, Bhutan North" : "e.g. Vasco Delta, Thimphu Gamma"}
 value={newTeam.name}
 onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
 className="w-full rounded-2xl border border-slate-805 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-violet-500/50 "
 />
 </div>

 <div className="grid gap-4 sm:grid-cols-2">
 <div className="space-y-1.5">
 <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Region / Place</label>
 <select
 value={newTeam.place}
 onChange={(e) => setNewTeam({ ...newTeam, place: e.target.value })}
 className="w-full rounded-2xl border border-slate-805 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-violet-500/50 cursor-pointer"
 >
 <option value="Goa">Goa</option>
 <option value="Bhutan">Bhutan</option>
 <option value="CUSTOM">Add New Place...</option>
 </select>
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Operational Zone</label>
 <input
 type="text"
 required
 placeholder="e.g. North Goa, East Paro"
 value={newTeam.zone}
 onChange={(e) => setNewTeam({ ...newTeam, zone: e.target.value })}
 className="w-full rounded-2xl border border-slate-850 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-violet-500/50 "
 />
 </div>
 </div>

 {newTeam.place === "CUSTOM" && (
 <div className="space-y-1.5">
 <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Custom Place Name</label>
 <input
 type="text"
 required
 placeholder="e.g. Singapore, London"
 value={newTeam.customPlace}
 onChange={(e) => setNewTeam({ ...newTeam, customPlace: e.target.value })}
 className="w-full rounded-2xl border border-slate-850 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-violet-500/50 "
 />
 </div>
 )}

 <div className="space-y-1.5">
 <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Team Lead</label>
 <input
 type="text"
 required
 placeholder="e.g. Sonam Dorji"
 value={newTeam.lead}
 onChange={(e) => setNewTeam({ ...newTeam, lead: e.target.value })}
 className="w-full rounded-2xl border border-slate-850 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-violet-500/50 "
 />
 </div>

 <div className="grid gap-4 sm:grid-cols-3">
 <div className="space-y-1.5">
 <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Members</label>
 <input
 type="number"
 min="0"
 placeholder="0"
 value={newTeam.members || ""}
 onChange={(e) => setNewTeam({ ...newTeam, members: parseInt(e.target.value) || 0 })}
 className="w-full rounded-2xl border border-slate-850 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-violet-500/50 "
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Open Tickets</label>
 <input
 type="number"
 min="0"
 placeholder="0"
 value={newTeam.openTickets || ""}
 onChange={(e) => setNewTeam({ ...newTeam, openTickets: parseInt(e.target.value) || 0 })}
 className="w-full rounded-2xl border border-slate-850 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-violet-500/50 "
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">SLA Compliance %</label>
 <input
 type="number"
 min="0"
 max="100"
 placeholder="100"
 value={newTeam.slaCompliance || ""}
 onChange={(e) => setNewTeam({ ...newTeam, slaCompliance: parseInt(e.target.value) || 0 })}
 className="w-full rounded-2xl border border-slate-850 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-violet-500/50 "
 />
 </div>
 </div>



 <div className="flex items-center justify-end gap-3 pt-4">
 <button
 type="button"
 onClick={() => setIsCreateModalOpen(false)}
 className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-900 "
 >
 Cancel
 </button>
 <button
 type="submit"
 className="rounded-2xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 shadow-lg shadow-sky-950/20"
 >
 Create Team
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* Add User Modal */}
 {isAddUserModalOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 backdrop-blur-md p-4 py-8">
 <div className="w-full max-w-lg max-h-[calc(100vh-4rem)] overflow-y-auto border border-slate-800 bg-slate-900/95 rounded-3xl p-6 shadow-2xl relative flex flex-col gap-5">
 <button
 onClick={() => setIsAddUserModalOpen(false)}
 className="absolute top-4 right-4 text-slate-400 hover:text-white rounded-xl p-1.5 hover:bg-slate-800/50 "
 >
 <X className="h-5 w-5" />
 </button>

 <div>
 <h3 className="text-xl font-bold text-white">
 Add New User
 </h3>
 <p className="text-xs text-slate-400 mt-1">
 Configure and invite a new member to the operational field force.
 </p>
 </div>

 <form onSubmit={handleAddUser} className="space-y-4">
 {addUserError && (
 <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
 {addUserError}
 </div>
 )}
 <div className="space-y-1.5">
 <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
 User Name
 </label>
 <input
 type="text"
 required
 placeholder="e.g. Sonam Dorji"
 value={newUser.name}
 onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
 className="w-full rounded-2xl border border-slate-850 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-violet-500/50 "
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
 Mobile Number
 </label>
 <input
 type="tel"
 required
 placeholder="e.g. +91 98765 43210"
 value={newUser.mobile}
 onChange={(e) => setNewUser({ ...newUser, mobile: e.target.value })}
 className="w-full rounded-2xl border border-slate-850 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-violet-500/50 "
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
 Email Address
 </label>
 <input
 type="email"
 required
 placeholder="e.g. user@fieldforce.io"
 value={newUser.email}
 onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
 className="w-full rounded-2xl border border-slate-850 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-violet-500/50 "
 />
 </div>

 <div className="grid gap-4 sm:grid-cols-2">
 <div className="space-y-1.5">
 <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Role</label>
 <select
 value={newUser.role}
 onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
 className="w-full rounded-2xl border border-slate-850 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-violet-500/50 cursor-pointer"
 >
 <option value="Operational Manager">Operational Manager</option>
 <option value="Field Technician">Field Technician</option>
 <option value="Warehouse Manager">Warehouse Manager</option>
 <option value="Technician">Technician</option>
 </select>
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Scheme / Region</label>
 <select
 value={newUser.zone}
 onChange={(e) => setNewUser({ ...newUser, zone: e.target.value })}
 className="w-full rounded-2xl border border-slate-850 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-violet-500/50 cursor-pointer"
 >
 {userPlace ? (
 <option value={userPlace}>{userPlace}</option>
 ) : (
 <>
 <option value="Goa">Goa</option>
 <option value="Bhutan">Bhutan</option>
 </>
 )}
 </select>
 </div>
 </div>

 <div className="flex items-center justify-end gap-3 pt-4">
 <button
 type="button"
 onClick={() => setIsAddUserModalOpen(false)}
 className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-900 "
 >
 Cancel
 </button>
 <button
 type="submit"
 disabled={isSavingUser}
 className="rounded-2xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 shadow-lg shadow-sky-950/20 disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {isSavingUser ? "Adding..." : "Add User"}
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

  {/* Edit User Modal */}
  {isEditUserModalOpen && editingUser && (
  <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 backdrop-blur-md p-4 py-8">
  <div className="w-full max-w-lg max-h-[calc(100vh-4rem)] overflow-y-auto border border-slate-800 bg-slate-900/95 rounded-3xl p-6 shadow-2xl relative flex flex-col gap-5">
  <button
  onClick={() => setIsEditUserModalOpen(false)}
  className="absolute top-4 right-4 text-slate-400 hover:text-white rounded-xl p-1.5 hover:bg-slate-800/50 "
  >
  <X className="h-5 w-5" />
  </button>

  <div>
  <h3 className="text-xl font-bold text-white">
  Edit User
  </h3>
  <p className="text-xs text-slate-400 mt-1">
  Modify user details and update status configuration.
  </p>
  </div>

  <form onSubmit={handleEditUser} className="space-y-4">
  {editUserError && (
  <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
  {editUserError}
  </div>
  )}
  <div className="space-y-1.5">
  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
  User Name
  </label>
  <input
  type="text"
  required
  placeholder="e.g. Sonam Dorji"
  value={editingUser.name}
  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
  className="w-full rounded-2xl border border-slate-850 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-violet-500/50 "
  />
  </div>

  <div className="space-y-1.5">
  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
  Mobile Number
  </label>
  <input
  type="tel"
  required
  placeholder="e.g. +91 98765 43210"
  value={editingUser.mobile}
  onChange={(e) => setEditingUser({ ...editingUser, mobile: e.target.value })}
  className="w-full rounded-2xl border border-slate-850 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-violet-500/50 "
  />
  </div>

  <div className="space-y-1.5">
  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
  Email Address
  </label>
  <input
  type="email"
  required
  placeholder="e.g. user@fieldforce.io"
  value={editingUser.email}
  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
  className="w-full rounded-2xl border border-slate-850 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-violet-500/50 "
  />
  </div>

  <div className="grid gap-4 sm:grid-cols-2">
  <div className="space-y-1.5">
  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Role</label>
  <select
  value={editingUser.role}
  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
  className="w-full rounded-2xl border border-slate-850 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-violet-500/50 cursor-pointer"
  >
  <option value="Operational Manager">Operational Manager</option>
  <option value="Field Technician">Field Technician</option>
  <option value="Warehouse Manager">Warehouse Manager</option>
  <option value="Technician">Technician</option>
  </select>
  </div>

  <div className="space-y-1.5">
  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Scheme / Region</label>
  <select
  value={editingUser.zone}
  onChange={(e) => setEditingUser({ ...editingUser, zone: e.target.value })}
  className="w-full rounded-2xl border border-slate-850 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-violet-500/50 cursor-pointer"
  >
  {userPlace ? (
  <option value={userPlace}>{userPlace}</option>
  ) : (
  <>
  <option value="Goa">Goa</option>
  <option value="Bhutan">Bhutan</option>
  </>
  )}
  </select>
  </div>
  </div>

  {/* Status select - Only for Super Admin */}
  {isSuperAdmin && (
  <div className="space-y-1.5">
  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Account Status</label>
  <select
  value={editingUser.status}
  onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
  className="w-full rounded-2xl border border-slate-850 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-violet-500/50 cursor-pointer"
  >
  <option value="Active">Active</option>
  <option value="Inactive">Inactive</option>
  </select>
  </div>
  )}

  <div className="flex items-center justify-end gap-3 pt-4">
  <button
  type="button"
  onClick={() => setIsEditUserModalOpen(false)}
  className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-900 cursor-pointer"
  >
  Cancel
  </button>
  <button
  type="submit"
  className="rounded-2xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 shadow-lg shadow-sky-950/20 cursor-pointer"
  >
  Save Changes
  </button>
  </div>
  </form>
  </div>
  </div>
  )}

 {/* Manage Team Slide-over Drawer */}
 {isManagePanelOpen && editingTeam && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm px-4 py-8">
 {/* Overlay click to close */}
 <div className="absolute inset-0 cursor-default" onClick={closeManagePanel} />
 
 <div
 onClick={(e) => e.stopPropagation()}
 className="relative z-20 w-full max-w-3xl max-h-[calc(100vh-4rem)] rounded-none bg-slate-900/95 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto"
 >
 <div className="space-y-6">
 <div className="flex items-center justify-between pb-4 border-b border-slate-800">
 <div>
 <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">
 {editingTeam.place}
 </span>
 <h3 className="text-xl font-bold text-white mt-2">Manage Team</h3>
 </div>
 <button
 onClick={() => setIsManagePanelOpen(false)}
 className="text-slate-400 hover:text-white rounded-xl p-1.5 hover:bg-slate-800/50 "
 >
 <X className="h-5 w-5" />
 </button>
 </div>

 {/* Form & Settings Section */}
 <div className="space-y-4">
 <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Team Settings</h4>
 
 <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
 <div className="space-y-1">
 <label className="text-xs font-semibold text-slate-400">Team Name</label>
 <input
 type="text"
 value={editingTeam.name}
 onChange={(e) => handleUpdateTeam({ name: e.target.value })}
 className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-violet-500/50 "
 />
 </div>
 
 <div className="grid gap-3 sm:grid-cols-2">
 <div className="space-y-1">
 <label className="text-xs font-semibold text-slate-400">Team Lead</label>
 <input
 type="text"
 value={editingTeam.lead}
 onChange={(e) => handleUpdateTeam({ lead: e.target.value })}
 className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-violet-500/50 "
 />
 </div>
 
 <div className="space-y-1">
 <label className="text-xs font-semibold text-slate-400">Zone</label>
 <input
 type="text"
 value={editingTeam.zone}
 onChange={(e) => handleUpdateTeam({ zone: e.target.value })}
 className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-violet-500/50 "
 />
 </div>
 </div>
 </div>
 </div>

 {/* Team Stats Summary */}
 <div className="grid grid-cols-3 gap-3 text-center">
 <div className="rounded-2xl border border-slate-800 bg-slate-950/20 py-2.5">
 <p className="text-lg font-bold text-white">{editingTeam.members}</p>
 <p className="text-[10px] text-slate-500 uppercase tracking-wider">Members</p>
 </div>
 <div className="rounded-2xl border border-slate-800 bg-slate-950/20 py-2.5">
 <p className="text-lg font-bold text-sky-400">{editingTeam.openTickets}</p>
 <p className="text-[10px] text-slate-500 uppercase tracking-wider">Tickets</p>
 </div>
 <div className="rounded-2xl border border-slate-800 bg-slate-950/20 py-2.5">
 <p className="text-lg font-bold text-emerald-400">{editingTeam.slaCompliance}%</p>
 <p className="text-[10px] text-slate-500 uppercase tracking-wider">SLA Comp</p>
 </div>
 </div>

 {/* Team Members List */}
 <div className="space-y-3">
 <div className="flex items-center justify-between">
 <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Members</h4>
 
 {/* Dropdown to add a member */}
 <select
 onChange={(e) => {
 if (e.target.value) {
 handleAddTeamMember(e.target.value);
 e.target.value = ""; // Reset
 }
 }}
 className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-sky-400 font-semibold outline-none hover:border-sky-500/40 cursor-pointer "
 >
 <option value="">+ Add Member</option>
 {usersList
 .filter((u) => {
 if (u.team === editingTeam.name) return false;
 if (userPlace) {
 const uPlace = u.zone && (u.zone.toLowerCase().includes("goa") || ["north goa", "south goa", "central goa", "goa"].includes(u.zone.toLowerCase())) ? "Goa" : "Bhutan";
 if (uPlace !== userPlace) return false;
 }
 return true;
 })
 .map((u) => (
 <option key={u.id} value={u.id}>
 {u.name} ({u.role})
 </option>
 ))}
 </select>
 </div>

 <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
 {usersList.filter((u) => u.team === editingTeam.name).length === 0 ? (
 <div className="text-center py-6 text-sm text-slate-500 border border-dashed border-slate-800 rounded-2xl">
 No assigned members. Use the dropdown to add users.
 </div>
 ) : (
 usersList
 .filter((u) => u.team === editingTeam.name)
 .map((member) => (
 <div
 key={member.id}
 className="flex items-center justify-between p-3 rounded-2xl border border-slate-800 bg-slate-950/30 text-xs hover:border-slate-750 "
 >
 <div className="flex items-center gap-3">
 <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-sky-400 font-semibold uppercase">
 {member.name.split(" ").map(n => n[0]).join("")}
 </div>
 <div>
 <p className="font-semibold text-white">{member.name}</p>
 <p className="text-[10px] text-slate-500">{member.role} · {member.email}</p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <span className={`inline-block h-1.5 w-1.5 rounded-full ${
 getUserStatus(member, shifts) === "Active" || getUserStatus(member, shifts) === "On Shift"
 ? "bg-emerald-400"
 : getUserStatus(member, shifts) === "Break"
 ? "bg-amber-400"
 : "bg-slate-550"
 }`} />
 <button
 onClick={() => handleRemoveTeamMember(member.id)}
 className="text-rose-400 hover:text-rose-300 font-semibold px-2 py-1 rounded hover:bg-rose-500/10 "
 >
 Remove
 </button>
 </div>
 </div>
 ))
 )}
 </div>
 </div>
 </div>
 </div>
 </div>
 )}

  {/* Inactivation Confirmation Modal */}
  {isInactivateConfirmOpen && userToInactivate && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/90 backdrop-blur-md p-4">
      <div className="w-full max-w-md border border-slate-800 bg-slate-900/95 rounded-3xl p-6 shadow-2xl relative flex flex-col gap-5">
        <button
          onClick={() => {
            setIsInactivateConfirmOpen(false);
            setUserToInactivate(null);
          }}
          className="absolute top-4 right-4 text-slate-400 hover:text-white rounded-xl p-1.5 hover:bg-slate-800/50 "
        >
          <X className="h-5 w-5" />
        </button>

        <div>
          <h3 className="text-xl font-bold text-white">
            Confirm Inactivation
          </h3>
          <p className="text-xs text-slate-450 mt-1">
            Please provide a valid reason for marking user <strong className="text-white">{userToInactivate.name}</strong> as Inactive.
          </p>
        </div>

        <form onSubmit={handleConfirmInactivate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Reason for Inactivation
            </label>
            <textarea
              required
              rows={3}
              placeholder="Provide detail description of the inactivation reason..."
              value={inactivationReasonText}
              onChange={(e) => setInactivationReasonText(e.target.value)}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder-slate-655 outline-none focus:border-rose-500/50 "
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsInactivateConfirmOpen(false);
                setUserToInactivate(null);
              }}
              className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-900 "
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-2xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-500 shadow-lg shadow-rose-950/20"
            >
              Inactivate User
            </button>
          </div>
        </form>
      </div>
    </div>
  )}
  </div>
  );
}
