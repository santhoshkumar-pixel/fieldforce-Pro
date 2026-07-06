import { useEffect, useState, useMemo } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  BarChart3,
  CalendarClock,
 ChevronRight,
 Clock,
 Cpu,
 Home,
 Layers,
 LogOut,
 Map as MapIcon,
 Shield,
 UserRound,
 Users,
 Settings,
 X,
 Mail,
 Briefcase,
 MapPin,
 Phone,
 Sun,
 Moon,
 Upload,
 Bell,
 AlertTriangle,
 Info,
 Ticket,
 Menu,
 Package,
 BookOpen,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { navItems } from "../data/mockData";
import UniversalSearch from "../components/UniversalSearch";

const iconMap = {
 dashboard: Home,
 clipboard: Layers,
 ticket: Ticket,
 cpu: Cpu,
 map: MapIcon,
 clock: Clock,
 usersRound: UserRound,
 calendarClock: CalendarClock,
 users: Users,
 shield: Shield,
 chart: BarChart3,
 package: Package,
 bookOpen: BookOpen,
 briefcase: Briefcase,
 health: Activity,
};

function NavItem({ item, isDarkMode, onClick, isCollapsed }) {
 const Icon = iconMap[item.icon] || ChevronRight;
 return (
  <NavLink
    to={item.path}
    end={item.path === "/"}
    onClick={onClick}
    title={isCollapsed ? item.label : undefined}
    className={({ isActive }) =>
      `flex items-center border border-transparent transition-all duration-305 ${
        isCollapsed ? "justify-center h-10 w-10 p-0 mx-auto rounded-xl gap-0" : "gap-2.5 rounded-xl px-3 py-1.5 text-[13px] w-full"
      } ${
        isActive
          ? "active-nav-item shadow-sm font-bold"
          : isDarkMode 
            ? "text-zinc-400 hover:bg-zinc-800/60 hover:text-white" 
            : "text-black hover:bg-slate-800 hover:text-black font-semibold"
      }`
    }
  >
    <Icon className="h-5 w-5 shrink-0" />
    <span className={`truncate transition-all duration-305 ${isCollapsed ? "max-w-0 opacity-0 overflow-hidden ml-0" : "max-w-[150px] opacity-100 ml-0.5"}`}>
      {item.label}
    </span>
  </NavLink>
 );
}

const pageTitles = {
 "/": "Dashboard",
 "/tickets": "Tickets",
 "/activity-logs": "Activity Logs",
 "/devices": "Devices",
 "/map": "Goa Map",
 "/sla": "SLA Monitor",
 "/teams": "Schemes",
 "/users": "User Management",
 "/attendance": "Attendance",
 "/rbac": "Settings & RBAC",
 "/analytics": "Analytics",
 "/inventory": "Warehouse System",
 "/training": "Training Portal",
 "/training/material": "Training Content",
 "/training/quiz": "Knowledge Quiz",
 "/health": "System Health",
};

const navItemPermissions = {
  "/": null,
  "/tickets": "tickets.view",
  "/activity-logs": "__activity_logs_restricted__",
  "/devices": ["devices.view", "devices.monitor"],
  "/map": null,
  "/sla": "sla.view",
  "/attendance": "attendance.view",
  "/teams": ["teams.view", "teams.manage"],
  "/users": ["users.view", "users.manage"],
  "/rbac": ["rbac.view", "rbac.manage"],
  "/analytics": "analytics.view",
  "/inventory": "inventory.view",
  "/training": "training.view",
  "/health": null,
};

/* Roles that may see the Activity Logs page */
const ACTIVITY_LOGS_ROLES = ["Super Admin", "Operational Manager"];

const notifTypeConfig = {
 escalation: { icon: AlertTriangle, color: "text-rose-400" },
 sla: { icon: Bell, color: "text-amber-400" },
 device: { icon: Cpu, color: "text-sky-400" },
 ticket: { icon: Ticket, color: "text-emerald-400" },
 alert: { icon: AlertTriangle, color: "text-orange-400" },
 info: { icon: Info, color: "text-slate-400" },
};

// Full sidebar for Super Admin (Attendance visible but no punch in/out)
const superAdminSidebarCategories = [
 {
 title: "Overview",
 items: [
 { label: "Dashboard", path: "/", icon: "dashboard" },
 { label: "Map", path: "/map", icon: "map" },
 ],
 },
 {
 title: "Operations",
 items: [
 { label: "Tickets", path: "/tickets", icon: "ticket" },
 { label: "Activity Logs", path: "/activity-logs", icon: "clipboard" },
 { label: "Devices", path: "/devices", icon: "cpu" },
 { label: "SLA Monitor", path: "/sla", icon: "clock" },
 { label: "Attendance", path: "/attendance", icon: "calendarClock" },
 ],
 },
 {
 title: "Field Force",
 items: [
 { label: "User Management", path: "/users", icon: "usersRound" },
 { label: "Schemes", path: "/teams", icon: "briefcase" },
 { label: "Warehouse System", path: "/inventory", icon: "package" },
 ],
 },
 {
 title: "Management",
 items: [
 { label: "Settings & RBAC", path: "/rbac", icon: "shield" },
 { label: "Analytics", path: "/analytics", icon: "chart" },

 ],
 },
 {
 title: "Learning",
 items: [
 { label: "Training Portal", path: "/training", icon: "bookOpen" },
 ],
 },
];

const sidebarCategories = [
 {
 title: "Overview",
 items: [
 { label: "Dashboard", path: "/", icon: "dashboard" },
 { label: "Map", path: "/map", icon: "map" },
 ],
 },
 {
 title: "Operations",
 items: [
 { label: "Tickets", path: "/tickets", icon: "ticket" },
 { label: "Activity Logs", path: "/activity-logs", icon: "clipboard" },
 { label: "Devices", path: "/devices", icon: "cpu" },
 { label: "SLA Monitor", path: "/sla", icon: "clock" },
 { label: "Attendance", path: "/attendance", icon: "calendarClock" },
 ],
 },
 {
 title: "Field Force",
 items: [
 { label: "User Management", path: "/users", icon: "usersRound" },
 { label: "Schemes", path: "/teams", icon: "briefcase" },
 { label: "Warehouse System", path: "/inventory", icon: "package" },
 ],
 },
 {
 title: "Management",
 items: [
 { label: "Settings & RBAC", path: "/rbac", icon: "shield" },
 { label: "Analytics", path: "/analytics", icon: "chart" },

 ],
 },
 {
 title: "Learning",
 items: [
 { label: "Training Portal", path: "/training", icon: "bookOpen" },
 ],
 },
];

export default function AdminLayout() {
 const location = useLocation();
 const navigate = useNavigate();
 const { user, logout, updateUser, hasPermission, isSuperAdmin, refreshPermissions } = useAuth();
 const { notifications: listNotifications, unreadCount: unread, markAllRead, markAsRead } = useNotifications();
 const [isProfileOpen, setIsProfileOpen] = useState(false);
 const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
 const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
  return localStorage.getItem("sidebar-collapsed") === "true";
  });
  const [isHovered, setIsHovered] = useState(false);
  const showExpanded = true;
 const [isDarkMode, setIsDarkMode] = useState(() => {
 const saved = localStorage.getItem("theme");
 return saved !== null ? saved === "dark" : true;
 });
 const [profileData, setProfileData] = useState({
 name: user?.name || "",
 email: user?.email || "",
 mobile: user?.mobile || "",
 });

 const toggleSidebar = () => {
 setIsSidebarCollapsed(prev => {
 const next = !prev;
 localStorage.setItem("sidebar-collapsed", String(next));
 return next;
 });
 };

 useEffect(() => {
 if (user) {
 setProfileData({
 name: user.name || "",
 email: user.email || "",
 mobile: user.mobile || "",
 });
 }
 }, [user]);

 const handleAvatarUpload = (e) => {
 const file = e.target.files?.[0];
 if (!file) return;

 const reader = new FileReader();
 reader.onload = (event) => {
 const dataUrl = event.target.result;
 updateUser({ avatar: dataUrl });
 };
 reader.readAsDataURL(file);
 };

 const handleSaveChanges = () => {
 updateUser({
 name: profileData.name,
 email: profileData.email,
 mobile: profileData.mobile,
 avatar: (user?.avatar && (user.avatar.startsWith("data:") || user.avatar.includes("/")))
 ? user.avatar
 : profileData.name.split(" ").map(n => n[0]).join("").toUpperCase()
 });
 setIsProfileOpen(false);
 };

 useEffect(() => {
 if (isDarkMode) {
 document.documentElement.classList.add("dark");
 document.documentElement.style.colorScheme = "dark";
 localStorage.setItem("theme", "dark");
 } else {
 document.documentElement.classList.remove("dark");
 document.documentElement.style.colorScheme = "light";
 localStorage.setItem("theme", "light");
 }
 }, [isDarkMode]);

  const hasPagePermission = (path) => {
  // Activity Logs is only for Super Admin and Scheme CP
  if (path === "/activity-logs" || path.startsWith("/activity-logs/")) {
    return ACTIVITY_LOGS_ROLES.includes(user?.role);
  }

  // Super Admin has access to all other pages
  if (isSuperAdmin) return true;

  if (path === "/unauthorized") return true;

  const required = navItemPermissions[path];
  if (!required) return true;
  return hasPermission(required);
  };

 useEffect(() => {
 refreshPermissions();
 }, [location.pathname, refreshPermissions]);

 useEffect(() => {
 if (location.pathname !== "/unauthorized" && location.pathname !== "/" && !hasPagePermission(location.pathname)) {
 navigate("/unauthorized", { replace: true });
 }
 }, [location.pathname, user]);

  const categoriesWithPermissions = useMemo(() => {
  // Pick the right sidebar definition based on role
  let source;
  if (isSuperAdmin) {
    source = superAdminSidebarCategories;     // Super Admin — includes Activity Logs
  } else if (user?.role === "Operational Manager") {
    source = superAdminSidebarCategories;     // Operational Manager — includes Activity Logs
  } else {
    source = sidebarCategories;               // All other roles — NO Activity Logs
  }
  return source
    .map((cat) => ({
    ...cat,
    items: cat.items.filter((item) => hasPagePermission(item.path)),
    }))
    .filter((cat) => cat.items.length > 0);
  }, [user]);

 const handleLogout = () => {
 logout();
 navigate("/login");
 };
  return (
  <div className="h-screen bg-slate-900/30 dark:bg-slate-950/45 text-slate-100 bg-glow-container overflow-hidden">
  <div className="mx-auto flex h-full w-full max-w-none flex-col gap-0 p-0 overflow-hidden">
  <header className="relative z-20 flex flex-wrap md:flex-nowrap items-center justify-between gap-4 rounded-none border-b border-slate-800/80 bg-slate-900/80 p-4 shadow-[0_0_50px_rgba(15,23,42,0.25)] backdrop-blur-xl shrink-0">
 {/* Left: logo + title */}
 <div className="flex min-w-0 flex-shrink-0 items-center gap-4">
 <button
 type="button"
 onClick={() => setIsMobileMenuOpen(true)}
 style={{ borderRadius: "12px" }}
 className="header-btn flex h-12 w-12 md:h-[52px] md:w-[52px] shrink-0 items-center justify-center rounded-[14px] border border-slate-800/60 bg-slate-950/60 text-slate-300 shadow-md hover:bg-slate-900 hover:border-violet-500/40 hover:shadow-violet-500/10 xl:hidden cursor-pointer transition-all duration-305"
 title="Open Menu"
 >
 <Menu className="h-5 w-5" />
 </button>
 <div className="flex h-12 md:h-[52px] items-center min-w-0">
 <h1 className="text-2xl font-bold text-white leading-tight truncate sm:text-3xl gradient-title">
 FieldForce Pro
 </h1>
 </div>
 </div>

 <UniversalSearch />

 {/* Right: notifications + profile — always in one row, never wraps under title */}
 <div className="flex shrink-0 items-center gap-3">
 {/* Notification Bell */}
 <div className="relative">
 <button
 type="button"
 onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
 style={{ borderRadius: "12px" }}
 className="header-btn relative flex h-12 w-12 md:h-[52px] md:w-[52px] items-center justify-center rounded-[14px] border border-slate-800/60 bg-slate-950/60 text-slate-300 shadow-md hover:bg-slate-950/20 hover:border-violet-500/40 hover:shadow-violet-500/10 cursor-pointer transition-all duration-305"
 title="Notifications"
 >
 <Bell className="h-5 w-5" />
 {unread > 0 && (
 <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white ring-2 ring-slate-950">
 {unread}
 </span>
 )}
 </button>

 {isNotificationsOpen && (
 <>
 <div
 className="fixed inset-0 z-40"
 onClick={() => setIsNotificationsOpen(false)}
 />
 <div className="absolute right-0 top-full mt-3 z-50 w-80 rounded-3xl border border-slate-800 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-xl">
 <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-2">
 <h3 className="font-semibold text-white">Notifications</h3>
 {unread > 0 && (
 <button
 onClick={markAllRead}
 className="text-xs font-medium text-sky-400 hover:text-sky-300"
 >
 Mark all read
 </button>
 )}
 </div>
 <div className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
 {listNotifications.length === 0 ? (
 <p className="py-6 text-center text-xs text-slate-500">
 No notifications
 </p>
 ) : (
 listNotifications.slice(0, 5).map((n) => {
 const config = notifTypeConfig[n.type] || notifTypeConfig.info;
 const Icon = config.icon;
 return (
 <div
 key={n.id}
 onClick={() => markAsRead(n.id)}
 className={`flex cursor-pointer gap-3 rounded-2xl border p-3 ${
 n.unread
 ? "border-sky-500/20 bg-slate-950/80 hover:border-sky-500/40"
 : "border-slate-800/60 bg-slate-950/20 hover:border-slate-800/80"
 }`}
 >
 <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-800/80 ${config.color}`}>
 <Icon className="h-4 w-4" />
 </div>
 <div className="min-w-0 flex-1">
 <p className={`text-left text-xs ${n.unread ? "font-semibold text-white" : "text-slate-400"}`}>
 {n.title}
 </p>
 <p className="mt-1 text-left text-[10px] text-slate-500">{n.time}</p>
 </div>
 {n.unread && (
 <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
 )}
 </div>
 );
 })
 )}
 </div>
 <div className="mt-3 border-t border-slate-800 pt-2">
 <NavLink
 to="/notifications"
 onClick={() => setIsNotificationsOpen(false)}
 className="block text-center text-xs font-semibold text-sky-400 hover:text-sky-300"
 >
 View all notifications
 </NavLink>
 </div>
 </div>
 </>
 )}
 </div>

 {/* Profile */}
 <div
 onClick={() => setIsProfileOpen(true)}
 style={{ borderRadius: "12px" }}
 className="header-btn flex h-12 md:h-[52px] cursor-pointer items-center gap-3 rounded-[14px] border border-slate-800/60 bg-slate-950/60 px-4 text-slate-200 shadow-md hover:bg-slate-950/20 hover:border-violet-500/40 hover:shadow-violet-500/10 transition-all duration-305"
 >
 <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-xs font-semibold overflow-hidden border border-primary/20 bg-primary/10 text-primary">
 {user?.avatar && (user.avatar.startsWith("data:") || user.avatar.includes("/")) ? (
 <img src={user.avatar} alt="Avatar" className="h-full w-full object-cover" />
 ) : (
 user?.avatar
 )}
 </div>
 <div className="hidden sm:block">
 <p className="text-xs text-slate-400">Signed in as</p>
 <p className="text-sm font-semibold text-white leading-tight">
 {user?.name}
 </p>
 </div>
 <button
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 handleLogout();
 }}
 title="Sign out"
 className="ml-1 rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
 >
 <LogOut className="h-4 w-4" />
 </button>
 </div>
 </div>
 </header>
   <div className="flex flex-1 min-h-0 overflow-hidden">
   <aside
     onMouseEnter={() => setIsHovered(true)}
     onMouseLeave={() => setIsHovered(false)}
     className={`hidden xl:block rounded-none border-r border-slate-800 bg-slate-950/60 backdrop-blur-xl overflow-y-auto xl:self-stretch max-h-full transition-all duration-300 ease-in-out shrink-0 ${
       showExpanded ? "w-[250px] p-4" : "w-20 p-3"
     }`}
   >
  <div className="flex flex-col gap-1">
  {categoriesWithPermissions.map((cat) => (
  <div key={cat.title} className="flex flex-col gap-1">
  <nav className="flex flex-col gap-1">
  {cat.items.map((item) => (
  <NavItem
  key={item.path}
  item={item}
  isDarkMode={isDarkMode}
  isCollapsed={!showExpanded}
  />
  ))}
  </nav>
  </div>
  ))}
  </div>

 </aside>

 {isMobileMenuOpen && (
 <div
 className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm xl:hidden"
 onClick={() => setIsMobileMenuOpen(false)}
 />
 )}

 <aside
 className={`fixed inset-y-0 left-0 z-50 w-72 transform border-r border-slate-800 bg-slate-950 p-5 shadow-2xl xl:hidden ${
 isMobileMenuOpen ? "" : "-translate-x-full"
 }`}
 >
  <div className="mb-6 flex items-center justify-end border-b border-slate-800 pb-3">
  <button
  type="button"
  onClick={() => setIsMobileMenuOpen(false)}
  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white "
  title="Close Menu"
  >
  <X className="h-5 w-5" />
  </button>
  </div>
 <div className="flex flex-col gap-1">
 {categoriesWithPermissions.map((cat) => (
 <div key={cat.title} className="flex flex-col gap-1">
 <nav className="flex flex-col gap-1">
 {cat.items.map((item) => (
 <NavItem
 key={item.path}
 item={item}
 isDarkMode={isDarkMode}
 onClick={() => setIsMobileMenuOpen(false)}
 />
 ))}
 </nav>
 </div>
 ))}
 </div>
 </aside>

   <main className="flex-1 min-w-0 h-full overflow-y-auto p-6">
   <Outlet />
   </main>
 </div>

 {/* Profile Modal */}
 {isProfileOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm px-4 py-8 overflow-y-auto">
 {/* Overlay click to close */}
 <div className="absolute inset-0 cursor-default" onClick={() => setIsProfileOpen(false)} />
 
 <div
 onClick={(e) => e.stopPropagation()}
 className="relative z-20 w-full max-w-2xl max-h-[calc(100vh-4rem)] rounded-3xl border border-slate-800 bg-slate-950/95 p-8 shadow-2xl overflow-y-auto"
 >
 <button
 onClick={() => setIsProfileOpen(false)}
 className="absolute top-6 right-6 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl p-1.5 "
 >
 <X className="h-5 w-5" />
 </button>

 <div className="space-y-6">
 {/* Profile Header */}
 <div className="space-y-4 pb-6 border-b border-slate-800">
 <h2 className="text-3xl font-bold text-white">Profile Settings</h2>
 
 {/* Avatar Upload */}
 <div className="flex items-center gap-4">
 <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-3xl font-bold text-primary overflow-hidden border border-primary/25">
 {user?.avatar && (user.avatar.startsWith("data:") || user.avatar.includes("/")) ? (
 <img src={user.avatar} alt="Avatar" className="h-full w-full object-cover" />
 ) : (
 profileData.name.split(" ").map((n) => n[0]).join("")
 )}
 </div>
 <label className="flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2 text-sm font-semibold cursor-pointer">
 <Upload className="h-4 w-4" />
 Upload Photo
 <input
 type="file"
 accept="image/*"
 onChange={handleAvatarUpload}
 className="hidden"
 />
 </label>
 </div>
 </div>

 {/* Editable Profile Fields */}
 <div className="space-y-4">
 <h3 className="text-lg font-semibold text-white flex items-center gap-2">
 <UserRound className="h-5 w-5 text-primary" />
 Account Information
 </h3>
 
 <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
 {/* Name Field */}
 <div className="space-y-1.5">
 <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
 <input
 type="text"
 value={profileData.name}
 onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
 className="w-full rounded-xl border border-slate-800 bg-slate-950 text-white focus:border-sky-500/50 px-4 py-2.5 text-sm outline-none "
 />
 </div>

 {/* Email Field */}
 <div className="space-y-1.5">
 <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
 <input
 type="email"
 value={profileData.email}
 onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
 className="w-full rounded-xl border border-slate-800 bg-slate-950 text-white focus:border-sky-500/50 px-4 py-2.5 text-sm outline-none "
 />
 </div>

 {/* Mobile Number Field */}
 <div className="space-y-1.5">
 <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mobile Number</label>
 <input
 type="tel"
 value={profileData.mobile}
 onChange={(e) => setProfileData({ ...profileData, mobile: e.target.value })}
 placeholder="e.g. +91 98765 43210"
 className="w-full rounded-xl border border-slate-800 bg-slate-950 text-white placeholder-slate-600 focus:border-sky-500/50 px-4 py-2.5 text-sm outline-none "
 />
 </div>
 </div>
 </div>

 {/* Display Info */}
 <div className="space-y-4">
 <h3 className="text-lg font-semibold text-white flex items-center gap-2">
 <Briefcase className="h-5 w-5 text-emerald-400" />
 Organization
 </h3>
 
 <div className="grid gap-3 sm:grid-cols-2">
 <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
 <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Role</p>
 <p className="text-lg font-semibold text-white">{user?.role}</p>
 </div>
 <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
 <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Team</p>
 <p className="text-lg font-semibold text-white">{user?.team}</p>
 </div>
 <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
 <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Zone</p>
 <p className="text-lg font-semibold text-white">{user?.zone}</p>
 </div>
 </div>
 </div>

 {/* Theme & Settings */}
 <div className="space-y-4">
 <h3 className="text-lg font-semibold text-white flex items-center gap-2">
 <Settings className="h-5 w-5 text-violet-400" />
 Preferences & Settings
 </h3>
 
 <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
 {/* Theme Toggle */}
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 {isDarkMode ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
 <span className="font-semibold text-white">{isDarkMode ? "Dark" : "Light"} Mode</span>
 </div>
 <button
 onClick={() => setIsDarkMode(!isDarkMode)}
 className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
 isDarkMode ? "bg-primary" : "bg-slate-700"
 }`}
 >
 <span
 className="inline-block h-6 w-6 transform rounded-full bg-white"
 />
 </button>
 </div>

 {/* Notifications Setting */}
 <div className="flex items-center justify-between pt-3 border-t border-slate-800">
 <span className="font-semibold text-white">Push Notifications</span>
 <button className="relative inline-flex h-8 w-14 items-center rounded-full bg-primary">
 <span className="inline-block h-6 w-6 transform rounded-full bg-white" />
 </button>
 </div>

 {/* Email Alerts */}
 <div className="flex items-center justify-between pt-3 border-t border-slate-800">
 <span className="font-semibold text-white">Email Alerts</span>
 <button className="relative inline-flex h-8 w-14 items-center rounded-full bg-primary">
 <span className="inline-block h-6 w-6 transform rounded-full bg-white" />
 </button>
 </div>
 </div>
 </div>

 {/* Action Buttons */}
 <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-800">
 <button
 type="button"
 onClick={() => {
 setIsProfileOpen(false);
 handleLogout();
 }}
 className="rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 px-5 py-2.5 text-sm font-semibold "
 >
 Sign Out
 </button>
 <div className="flex-1" />
 <button
 type="button"
 onClick={() => setIsProfileOpen(false)}
 className="rounded-2xl border border-slate-800 bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-900 px-5 py-2.5 text-sm font-semibold min-w-[100px]"
 >
 Cancel
 </button>
 <button
 type="button"
 onClick={handleSaveChanges}
 className="rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/80 shadow-lg min-w-[120px]"
 >
 Save Changes
 </button>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 );
}

