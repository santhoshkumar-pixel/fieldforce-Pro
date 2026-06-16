import { useState, useEffect, useMemo } from "react";
import { Plus, Shield, Settings, User, Sliders, Save, RotateCcw } from "lucide-react";
import clsx from "clsx";
import PageHeader from "../components/PageHeader";
import Badge from "../components/ui/Badge";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { permissionModules } from "../data/mockData";
import { useAuth } from "../context/AuthContext";
import { getUserPlace } from "../utils/roleHelpers";
import { api } from "../utils/api";

export default function RbacPage() {
 const { user, updateUser, isSuperAdmin } = useAuth();
 const userPlace = useMemo(() => getUserPlace(user), [user]);

 const [activeTab, setActiveTab] = useState("settings");
 const [rolesList, setRolesList] = useState([]);
 const [selectedRole, setSelectedRole] = useState(null);

 const [editedPermissions, setEditedPermissions] = useState([]);
 const [saving, setSaving] = useState(false);
 const [saveSuccess, setSaveSuccess] = useState("");

 useEffect(() => {
 const fetchRoles = async () => {
 try {
 const data = await api.roles.getAll();
 setRolesList(data || []);
 if (data && data.length > 0) {
 setSelectedRole(data[0]);
 }
 } catch (err) {
 console.error("Failed to load roles:", err);
 }
 };
 fetchRoles();
 }, []);

 useEffect(() => {
 if (selectedRole) {
 setEditedPermissions(selectedRole.permissions || []);
 }
 }, [selectedRole]);

 const isModuleFullyGranted = (moduleName) => {
 const baseModule = moduleName.toLowerCase();
 const modObj = permissionModules.find(m => m.module.toLowerCase() === baseModule);
 if (!modObj) return false;

 return modObj.permissions.every(perm =>
 editedPermissions.some(
 (p) =>
 p === perm ||
 p === "*.*" ||
 p === "*" ||
 (p.endsWith(".*") && p.split(".")[0] === baseModule)
 )
 );
 };

 const handleTogglePermission = (perm) => {
 if (!isSuperAdmin) return;
 
 let nextPermissions = [...editedPermissions];
 const baseModule = perm.split(".")[0];
 const wildcard = `${baseModule}.*`;

 // Expand global wildcards if present
 if (nextPermissions.includes("*.*") || nextPermissions.includes("*")) {
 nextPermissions = nextPermissions.filter(p => p !== "*.*" && p !== "*");
 permissionModules.forEach(mod => {
 mod.permissions.forEach(p => {
 nextPermissions.push(p);
 });
 });
 } else if (nextPermissions.includes(wildcard)) {
 // Expand module wildcard if present
 nextPermissions = nextPermissions.filter(p => p !== wildcard);
 const modObj = permissionModules.find(m => m.module.toLowerCase() === baseModule);
 if (modObj) {
 modObj.permissions.forEach(p => {
 nextPermissions.push(p);
 });
 }
 }

 if (nextPermissions.includes(perm)) {
 nextPermissions = nextPermissions.filter(p => p !== perm);
 } else {
 nextPermissions.push(perm);
 }

 setEditedPermissions(nextPermissions);
 };

 const handleToggleModule = (moduleName) => {
 if (!isSuperAdmin) return;

 const baseModule = moduleName.toLowerCase();
 const modObj = permissionModules.find(m => m.module.toLowerCase() === baseModule);
 if (!modObj) return;

 const isFullyGranted = isModuleFullyGranted(moduleName);
 let nextPermissions = [...editedPermissions];
 const wildcard = `${baseModule}.*`;

 // Expand global wildcards if present
 if (nextPermissions.includes("*.*") || nextPermissions.includes("*")) {
 nextPermissions = nextPermissions.filter(p => p !== "*.*" && p !== "*");
 permissionModules.forEach(mod => {
 mod.permissions.forEach(p => {
 nextPermissions.push(p);
 });
 });
 }

 // Remove the wildcard if present
 nextPermissions = nextPermissions.filter(p => p !== wildcard);

 if (isFullyGranted) {
 nextPermissions = nextPermissions.filter(p => !modObj.permissions.includes(p));
 } else {
 modObj.permissions.forEach(p => {
 if (!nextPermissions.includes(p)) {
 nextPermissions.push(p);
 }
 });
 }

 setEditedPermissions(nextPermissions);
 };

 const handleResetPermissions = () => {
 if (selectedRole) {
 setEditedPermissions(selectedRole.permissions || []);
 }
 };

 const handleSavePermissions = async () => {
 if (!selectedRole || !isSuperAdmin) return;
 setSaving(true);
 setSaveSuccess("");
 try {
 const updatedRole = await api.roles.update(selectedRole.id, {
 ...selectedRole,
 permissions: editedPermissions,
 });
 setRolesList(prev => prev.map(r => r.id === selectedRole.id ? updatedRole : r));
 setSelectedRole(updatedRole);
 setSaveSuccess("Permissions saved successfully!");
 setTimeout(() => setSaveSuccess(""), 4000);
 } catch (err) {
 console.error("Failed to save permissions:", err);
 } finally {
 setSaving(false);
 }
 };

 // Settings form local state seeded from user profile
 const [operationalZone, setOperationalZone] = useState(user?.zone || "Goa");
 const [soundNotifications, setSoundNotifications] = useState(true);
 const [desktopAlerts, setDesktopAlerts] = useState(true);
 const [successMessage, setSuccessMessage] = useState("");

 const handleApplyChanges = () => {
 updateUser({ zone: operationalZone });
 setSuccessMessage("System configurations and preferences applied successfully.");
 setTimeout(() => setSuccessMessage(""), 4000);
 };

 const headerAction = (
 <div className="flex items-center gap-3 sm:justify-end">
 {/* Tab Switcher */}
 <div className="bg-slate-900/60 p-1 border border-slate-800/80 rounded-2xl flex items-center gap-1">
 <button
 onClick={() => setActiveTab("settings")}
 className={clsx(
 "px-3.5 py-1.5 rounded-xl text-xs font-semibold ",
 activeTab === "settings"
 ? "bg-sky-500/20 text-sky-400 border border-sky-500/30 shadow-sm"
 : "text-slate-400 hover:text-white hover:bg-slate-800/40 border border-transparent"
 )}
 >
 System Settings
 </button>
 <button
 onClick={() => setActiveTab("rbac")}
 className={clsx(
 "px-3.5 py-1.5 rounded-xl text-xs font-semibold ",
 activeTab === "rbac"
 ? "bg-sky-500/20 text-sky-400 border border-sky-500/30 shadow-sm"
 : "text-slate-400 hover:text-white hover:bg-slate-800/40 border border-transparent"
 )}
 >
 Access Control
 </button>
 </div>

 {activeTab === "rbac" && (
 <button
 type="button"
 className="flex items-center gap-2 rounded-2xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 shadow-lg shadow-sky-950/20"
 >
 <Plus className="h-4 w-4" />
 Create role
 </button>
 )}
 </div>
 );

 return (
 <div className="space-y-6">
 <PageHeader
 title="Settings & RBAC"
 description={
 activeTab === "rbac"
 ? "Create custom roles, assign module-level permissions, and manage role-based access across FieldForce."
 : "Configure default operational divisions, user profiles, and sound/visual telemetry alert parameters."
 }
 action={headerAction}
 />

 {activeTab === "rbac" ? (
 <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
 <div className="space-y-3">
 {rolesList.map((role) => (
 <button
 key={role.id}
 type="button"
 onClick={() => setSelectedRole(role)}
 className={clsx(
 "w-full rounded-3xl border p-4 text-left cursor-pointer",
 selectedRole?.id === role.id
 ? "border-sky-500/50 bg-slate-900/80"
 : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
 )}
 >
 <div className="flex items-center gap-3">
 <Shield className="h-5 w-5 text-sky-400" />
 <div>
 <p className="font-semibold text-white">{role.name}</p>
 <p className="text-xs text-slate-500">{role.usersCount || role.users || 0} users</p>
 </div>
 </div>
 <p className="mt-2 text-sm text-slate-400">{role.description}</p>
 </button>
 ))}
 </div>

 {selectedRole ? (
 <Card className="glass-card">
 <CardHeader
 title={`Permissions — ${selectedRole.name}`}
 subtitle="Module.action format per PRD"
 />
 <CardBody className="space-y-6">
 {saveSuccess && (
 <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3.5 text-xs font-semibold text-emerald-350">
 {saveSuccess}
 </div>
 )}
 <div>
 <p className="text-xs uppercase tracking-wider text-slate-500">
 Assigned permissions
 </p>
 <div className="mt-3 flex flex-wrap gap-2">
 {editedPermissions?.map((p) => (
 <Badge key={p} variant="info">
 {p}
 </Badge>
 ))}
 {(!editedPermissions || editedPermissions.length === 0) && (
 <span className="text-xs text-slate-500 italic">No permissions assigned.</span>
 )}
 </div>
 </div>

 <div>
 <p className="mb-3 text-xs uppercase tracking-wider text-slate-500">
 Permission matrix
 </p>
 <div className="space-y-4">
 {permissionModules.map((mod) => (
 <div
 key={mod.module}
 className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4"
 >
 <div className="flex justify-between items-center mb-3">
 <p className="font-medium text-white">{mod.module}</p>
 {isSuperAdmin && (
 <button
 type="button"
 onClick={() => handleToggleModule(mod.module)}
 className="text-xs font-semibold text-sky-400 hover:text-sky-300 cursor-pointer"
 >
 {isModuleFullyGranted(mod.module) ? "Revoke All" : "Grant All"}
 </button>
 )}
 </div>
 <div className="flex flex-wrap gap-2">
 {mod.permissions.map((perm) => {
 const granted = editedPermissions?.some(
 (p) =>
 p === perm ||
 p === "*.*" ||
 p === "*" ||
 (p.replace(".*", "").split(".")[0] ===
 perm.split(".")[0] &&
 p.endsWith(".*"))
 ) || false;
 
 if (isSuperAdmin) {
 return (
 <button
 key={perm}
 type="button"
 onClick={() => handleTogglePermission(perm)}
 className={clsx(
 "rounded-full px-2.5 py-1 font-mono text-xs cursor-pointer border ",
 granted
 ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25 ring-1 ring-emerald-500/20"
 : "bg-slate-800 text-slate-500 border-slate-700 hover:bg-slate-700/60"
 )}
 >
 {perm}
 </button>
 );
 } else {
 return (
 <span
 key={perm}
 className={clsx(
 "rounded-full px-2.5 py-1 font-mono text-xs border",
 granted
 ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 ring-1 ring-emerald-500/20"
 : "bg-slate-800 text-slate-500 border-transparent"
 )}
 >
 {perm}
 </span>
 );
 }
 })}
 </div>
 </div>
 ))}
 </div>
 </div>

 {isSuperAdmin && (
 <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
 <button
 type="button"
 onClick={handleResetPermissions}
 disabled={saving}
 className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs font-semibold text-slate-350 hover:text-white hover:bg-slate-900 disabled:opacity-50 cursor-pointer"
 >
 <RotateCcw className="h-3.5 w-3.5" />
 Reset
 </button>
 <button
 type="button"
 onClick={handleSavePermissions}
 disabled={saving}
 className="inline-flex items-center gap-1.5 rounded-2xl bg-sky-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-sky-500 shadow-lg shadow-sky-950/20 disabled:opacity-50 cursor-pointer"
 >
 {saving ? "Saving..." : (
 <>
 <Save className="h-3.5 w-3.5" />
 Save Changes
 </>
 )}
 </button>
 </div>
 )}
 </CardBody>
 </Card>
 ) : (
 <div className="flex items-center justify-center p-12 border border-slate-850 bg-slate-950/20 rounded-3xl">
 <p className="text-slate-500 text-sm">Loading role details...</p>
 </div>
 )}
 </div>
 ) : (
 <div className="grid gap-6 max-w-4xl">
 {successMessage && (
 <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3.5 text-xs font-semibold text-emerald-300">
 {successMessage}
 </div>
 )}

 <div className="grid gap-6 md:grid-cols-12">
 {/* Profile Overview Card */}
 <div className="md:col-span-4 space-y-4">
 <Card className="glass-card">
 <CardHeader title="Operator Profile" subtitle="Active account details" />
 <CardBody className="flex flex-col items-center text-center py-6 space-y-3">
 <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-800 text-sky-400 text-xl font-bold border border-slate-700 overflow-hidden">
 {user?.avatar && (user.avatar.startsWith("data:") || user.avatar.includes("/")) ? (
 <img src={user.avatar} alt="Avatar" className="h-full w-full object-cover" />
 ) : (
 user?.avatar
 )}
 </div>
 <div>
 <h4 className="text-base font-bold text-white">{user?.name}</h4>
 <p className="text-xs text-sky-400 font-semibold">{user?.role}</p>
 <p className="mt-1.5 text-xs text-slate-500 font-mono">{user?.email}</p>
 </div>
 </CardBody>
 </Card>
 </div>

 {/* Form Settings Card */}
 <div className="md:col-span-8">
 <Card className="glass-card">
 <CardHeader title="System Configurations" subtitle="Fine-tune workspace thresholds" />
 <CardBody className="space-y-6">
 {/* Division / Zone selection */}
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
 Operational Division
 </label>
 <select
 value={operationalZone}
 onChange={(e) => setOperationalZone(e.target.value)}
 className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 text-sm cursor-pointer"
 >
 {!userPlace ? (
 <>
 <optgroup label="Goa Operations">
 <option value="Goa">All Goa (Default)</option>
 <option value="North Goa">North Goa Division</option>
 <option value="Central Goa">Central Goa Division</option>
 <option value="South Goa">South Goa Division</option>
 </optgroup>
 <optgroup label="Bhutan Operations">
 <option value="Bhutan">All Bhutan</option>
 <option value="Thimphu">Thimphu Division</option>
 <option value="Paro">Paro Division</option>
 </optgroup>
 </>
 ) : userPlace === "Bhutan" ? (
 <>
 <option value="Bhutan">All Bhutan</option>
 <option value="Thimphu">Thimphu Division</option>
 <option value="Paro">Paro Division</option>
 </>
 ) : (
 <>
 <option value="Goa">All Goa (Default)</option>
 <option value="North Goa">North Goa Division</option>
 <option value="Central Goa">Central Goa Division</option>
 <option value="South Goa">South Goa Division</option>
 </>
 )}
 </select>
 <span className="block text-[11px] text-slate-500">
 Changes the default telemetry context scope mapped on initial logins.
 </span>
 </div>

 {/* Toggle preferences checkboxes */}
 <div className="space-y-3 pt-2">
 <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
 Telemetry Preferences
 </label>
 <div className="space-y-3 rounded-2xl border border-slate-850 bg-slate-950/20 p-4 max-w-md">
 <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer select-none">
 <span className="font-semibold">Sound Notifications</span>
 <input
 type="checkbox"
 checked={soundNotifications}
 onChange={(e) => setSoundNotifications(e.target.checked)}
 className="rounded border-slate-800 bg-slate-950 text-sky-500 focus:ring-0 focus:ring-offset-0 h-4 w-4"
 />
 </label>
 <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer select-none">
 <span className="font-semibold">Desktop Alerts</span>
 <input
 type="checkbox"
 checked={desktopAlerts}
 onChange={(e) => setDesktopAlerts(e.target.checked)}
 className="rounded border-slate-800 bg-slate-950 text-sky-500 focus:ring-0 focus:ring-offset-0 h-4 w-4"
 />
 </label>
 <label className="flex items-center justify-between text-xs text-slate-300 opacity-50 select-none">
 <span className="font-semibold">Real-time Sync Stream</span>
 <input
 type="checkbox"
 checked
 disabled
 className="rounded border-slate-800 bg-slate-950 text-sky-500 focus:ring-0 focus:ring-offset-0 h-4 w-4"
 />
 </label>
 </div>
 </div>

 {/* Apply changes action button */}
 <div className="pt-4 border-t border-slate-800 flex justify-end">
 <button
 type="button"
 onClick={handleApplyChanges}
 className="rounded-2xl bg-sky-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-sky-500 shadow-lg shadow-sky-950/25"
 >
 Apply Changes
 </button>
 </div>
 </CardBody>
 </Card>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
