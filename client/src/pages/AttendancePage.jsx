import { useEffect, useState, useMemo } from "react";
import clsx from "clsx";
import { useAuth } from "../context/AuthContext";
import { useAttendance } from "../context/AttendanceContext";
import { getUserPlace } from "../utils/roleHelpers";
import {
 Coffee,
 LogIn,
 LogOut,
 MapPin,
 Radio,
 Clock,
 FileText,
 Search,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import Badge from "../components/ui/Badge";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { shiftStatuses } from "../data/attendanceData";
import CustomSelect from "../components/ui/CustomSelect";
import {
 computeBreakDuration,
 computeShiftDuration,
 formatDuration,
 formatTimestamp,
} from "../utils/shiftTimer";

function statusVariant(shiftStatus) {
 if (shiftStatus === shiftStatuses.ON_SHIFT) return "success";
 if (shiftStatus === shiftStatuses.ON_BREAK) return "warning";
 return "muted";
}

function statusLabel(shiftStatus) {
 if (shiftStatus === shiftStatuses.ON_SHIFT) return "Active Shift";
 if (shiftStatus === shiftStatuses.ON_BREAK) return "On Break";
 return "Off Shift";
}

function getEventIcon(type) {
 switch (type) {
 case "PUNCH_IN":
 return <LogIn className="h-4 w-4 text-emerald-400" />;
 case "PUNCH_OUT":
 return <LogOut className="h-4 w-4 text-rose-400" />;
 case "BREAK_START":
 return <Coffee className="h-4 w-4 text-amber-400" />;
 case "BREAK_END":
 return <Radio className="h-4 w-4 text-sky-400" />;
 default:
 return <Clock className="h-4 w-4 text-slate-400" />;
 }
}

function getEventName(type) {
 switch (type) {
 case "PUNCH_IN":
 return "Punch In";
 case "PUNCH_OUT":
 return "Punch Out";
 case "BREAK_START":
 return "Start Break";
 case "BREAK_END":
 return "End Break";
 default:
 return type;
 }
}

export default function AttendancePage() {
 const { user } = useAuth();
 const isSuperAdmin = user?.role === "Super Admin";
 const canViewAllAttendance =
  user?.role === "Super Admin" ||
  user?.role === "Operational Manager" ||
  user?.role === "Warehouse Manager";

 const {
 shifts,
 attendanceHistory,
 selectedId,
 setSelectedId,
 punchIn,
 punchOut,
 startBreak,
 endBreak,
 } = useAttendance();

  const [tick, setTick] = useState(0);
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedScheme, setSelectedScheme] = useState("all");

  const userPlace = useMemo(() => getUserPlace(user), [user]);

  const filteredShifts = useMemo(() => {
    if (!userPlace) return shifts;
    return shifts.filter((s) => {
      if (!s || !s.zone) return false;
      const sPlace = s.zone && (s.zone.toLowerCase().includes("goa") || ["north goa", "south goa", "central goa", "goa"].includes(s.zone.toLowerCase())) ? "Goa" : "Bhutan";
      return sPlace === userPlace;
    });
  }, [shifts, userPlace]);

  const uniqueSchemes = useMemo(() => {
    const schemesSet = new Set();
    filteredShifts.forEach((s) => {
      if (!s || !s.zone) return;
      const sPlace = s.zone.toLowerCase().includes("goa") || ["north goa", "south goa", "central goa", "goa"].includes(s.zone.toLowerCase()) ? "Goa" : "Bhutan";
      schemesSet.add(sPlace);
    });
    return Array.from(schemesSet).sort();
  }, [filteredShifts]);

  const finalFilteredShifts = useMemo(() => {
    return filteredShifts.filter((s) => {
      const sPlace = s.zone && (s.zone.toLowerCase().includes("goa") || ["north goa", "south goa", "central goa", "goa"].includes(s.zone.toLowerCase())) ? "Goa" : "Bhutan";
      const matchesScheme = selectedScheme === "all" || sPlace === selectedScheme;
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q || 
        s.name.toLowerCase().includes(q) ||
        (s.team && s.team.toLowerCase().includes(q)) ||
        (s.zone && s.zone.toLowerCase().includes(q));
      return matchesScheme && matchesSearch;
    });
  }, [filteredShifts, selectedScheme, searchTerm]);

 // Live timer tick
 useEffect(() => {
 const interval = setInterval(() => setTick((t) => t + 1), 1000);
 return () => clearInterval(interval);
 }, []);

 const showToast = (msg) => {
 if (!msg) return;
 setToast(msg);
 setTimeout(() => setToast(null), 2800);
 };

 const activeRecordId = canViewAllAttendance ? selectedId : user?.id;

  // Ensure selectedId points to a shift in finalFilteredShifts if possible
  useEffect(() => {
    if (canViewAllAttendance && finalFilteredShifts.length > 0) {
      const isValid = finalFilteredShifts.some((s) => s.userId === selectedId);
      if (!isValid) {
        setSelectedId(finalFilteredShifts[0].userId);
      }
    }
  }, [finalFilteredShifts, selectedId, setSelectedId, canViewAllAttendance]);

 // Filter shifts strictly to selected profile or logged-in user's profile
 const myRecord =
 shifts.find((s) => s.userId === activeRecordId) ||
 (canViewAllAttendance
 ? null
 : user
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

 // Filter history strictly to selected user's logs
 const myHistory = attendanceHistory.filter(
 (h) => h.technicianId === activeRecordId
 );

 const shiftMs = myRecord ? computeShiftDuration(myRecord) : 0;
 const breakMs = myRecord ? computeBreakDuration(myRecord) : 0;

 const canPunchIn = myRecord?.shiftStatus === shiftStatuses.OFF_SHIFT;
 const canPunchOut =
 myRecord?.shiftStatus === shiftStatuses.ON_SHIFT ||
 myRecord?.shiftStatus === shiftStatuses.ON_BREAK;
 const canBreakStart = myRecord?.shiftStatus === shiftStatuses.ON_SHIFT;
 const canBreakEnd = myRecord?.shiftStatus === shiftStatuses.ON_BREAK;

 const handlePunchInAction = async () => {
 if (!myRecord) return;
 const msg = await punchIn(myRecord.userId);
 showToast(msg);
 };

 const handlePunchOutAction = async () => {
 if (!myRecord) return;
 const msg = await punchOut(myRecord.userId);
 showToast(msg);
 };

 const handleBreakStartAction = async () => {
 if (!myRecord) return;
 const msg = await startBreak(myRecord.userId);
 showToast(msg);
 };

 const handleBreakEndAction = async () => {
 if (!myRecord) return;
 const msg = await endBreak(myRecord.userId);
 showToast(msg);
 };

 return (
 <div className="space-y-6">
 {toast && (
 <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-slate-800 px-4 py-3 text-sm text-white shadow-lg ring-1 ring-slate-700">
 {toast}
 </div>
 )}

 <PageHeader title={canViewAllAttendance ? "Attendance Tracking Board" : "My Attendance Profile"} />

 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
 {canViewAllAttendance && (
 /* Left Column: Technicians List */
 <Card className="lg:col-span-4 border border-slate-800 bg-slate-950/40 backdrop-blur-xl h-full flex flex-col min-h-[500px]">
  <CardHeader
  title="Field Technicians"
  subtitle={`Monitoring ${finalFilteredShifts.length} active shifts`}
  />
  <CardBody className="p-4 flex flex-col gap-4 overflow-hidden flex-1">
    {/* Search & Scheme Filter */}
  <div className="space-y-3 shrink-0">
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search technicians..."
        className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-slate-100 outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20"
      />
    </div>
    <CustomSelect
      value={selectedScheme}
      onChange={(e) => setSelectedScheme(e.target.value)}
      options={[
        { value: "all", label: "All Schemes" },
        ...uniqueSchemes.map((scheme) => ({ value: scheme, label: scheme }))
      ]}
      fullWidth
      className="px-3 py-2 text-xs text-slate-100 border-slate-800 bg-slate-950"
    />
  </div>

  <div className="divide-y divide-slate-900 overflow-y-auto flex-1 max-h-[450px]">
  {finalFilteredShifts.length === 0 ? (
  <div className="py-8 text-center text-slate-500 text-xs">No technicians found</div>
  ) : (
  finalFilteredShifts.map((s) => {
  const isSelected = s.userId === selectedId;
 return (
 <div
 key={s.userId}
 onClick={() => setSelectedId(s.userId)}
 className={clsx(
 "p-4 flex items-center justify-between cursor-pointer hover:bg-slate-900/40",
 isSelected ? "bg-sky-500/10 border-l-4 border-sky-500 pl-3" : "border-l-4 border-transparent"
 )}
 >
 <div className="flex items-center gap-3">
 <div className="h-9 w-9 rounded-2xl bg-sky-500/10 flex items-center justify-center font-bold text-sky-400 border border-sky-500/20 text-sm shrink-0">
 {s.name.split(" ").map((n) => n[0]).join("")}
 </div>
 <div className="min-w-0">
 <h4 className={clsx("text-xs font-bold truncate", isSelected ? "text-sky-400" : "text-white")}>
 {s.name}
 </h4>
 <p className="text-[10px] text-slate-500 truncate mt-0.5">
 {s.team} · {s.zone}
 </p>
 </div>
 </div>
 <Badge variant={statusVariant(s.shiftStatus)} className="text-[9px] uppercase tracking-wider scale-90 shrink-0">
 {statusLabel(s.shiftStatus)}
 </Badge>
 </div>
 );
 })
 )}
 </div>
 </CardBody>
 </Card>
 )}

 {/* Details Column */}
 <div className={clsx("grid gap-6", canViewAllAttendance ? "lg:col-span-8 grid-cols-1" : "lg:col-span-12 lg:grid-cols-3")}>
 {/* Punch Control Card */}
 <Card className={clsx("glass-card", !canViewAllAttendance && "lg:col-span-1")}>
 <CardHeader
 title={canViewAllAttendance ? "Shift Monitoring Console" : "Attendance Control"}
 subtitle={canViewAllAttendance ? `Active profile: ${myRecord?.name || "None"}` : "Your shift status and actions"}
 />
 <CardBody>
 {isSuperAdmin && myRecord?.userId === user?.id ? (
 <div className="flex flex-col items-center justify-center py-10 text-slate-400 space-y-3">
 <Clock className="h-12 w-12 text-slate-600 stroke-[1.5]" />
 <p className="text-sm font-semibold text-slate-300">Attendance Not Required</p>
 <p className="text-xs text-slate-500 text-center">
 Super Admin is exempt from punch-in / punch-out tracking.
 </p>
 </div>
 ) : myRecord ? (
 <div className="space-y-4">
 <div className="flex items-center justify-between border-b border-slate-800 pb-3">
 <div>
 <h4 className="font-bold text-white text-base">
 {myRecord.name}
 </h4>
 <p className="text-xs text-slate-400 mt-0.5">
 {myRecord.team} · {myRecord.role || "Technician"}
 </p>
 </div>
 <Badge variant={statusVariant(myRecord.shiftStatus)}>
 {statusLabel(myRecord.shiftStatus)}
 </Badge>
 </div>

 {/* Timers */}
 <div className="grid grid-cols-2 gap-3">
 <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
 <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-500">
 Shift Time
 </span>
 <span className="block font-mono text-base font-bold text-sky-400 mt-1">
 {!myRecord.punchInAt ? "—" : formatDuration(shiftMs)}
 </span>
 </div>
 <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
 <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-500">
 Break Time
 </span>
 <span
 className={`block font-mono text-base font-bold mt-1 ${
 myRecord.shiftStatus === shiftStatuses.ON_BREAK
 ? "text-amber-400 "
 : "text-slate-500"
 }`}
 >
 {myRecord.shiftStatus === shiftStatuses.ON_BREAK
 ? formatDuration(breakMs)
 : formatDuration(myRecord.totalBreakMs || 0)}
 </span>
 </div>
 </div>

 {/* GPS and Timestamps */}
 <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-xs space-y-2">
 <div className="flex items-center justify-between text-slate-400">
 <span>Last GPS Log</span>
 <span className="font-mono">
 {myRecord.gpsLat && myRecord.gpsLng
 ? `${myRecord.gpsLat.toFixed(4)}, ${myRecord.gpsLng.toFixed(4)}`
 : "—"}
 </span>
 </div>
 {myRecord.gpsAddress ? (
 <p className="text-slate-300 font-medium">
 {myRecord.gpsAddress}
 </p>
 ) : (
 <p className="text-slate-500 italic">
 No GPS coordinates captured
 </p>
 )}
 </div>

 <div className="space-y-1 text-xs text-slate-400">
 <div className="flex justify-between">
 <span>Punched In:</span>
 <span className="text-slate-200">
 {formatTimestamp(myRecord.punchInAt)}
 </span>
 </div>
 <div className="flex justify-between">
 <span>Punched Out:</span>
 <span className="text-slate-200">
 {formatTimestamp(myRecord.punchOutAt)}
 </span>
 </div>
 </div>

 {/* Actions — only visible for the logged-in user's own record */}
 {myRecord.userId === user?.id && !isSuperAdmin && (
 <div className="pt-2 space-y-2">
 <div className="grid grid-cols-2 gap-2">
 <button
 type="button"
 disabled={!canPunchIn}
 onClick={handlePunchInAction}
 className="flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-30 disabled:cursor-not-allowed "
 >
 <LogIn className="h-3.5 w-3.5" />
 Punch In
 </button>
 <button
 type="button"
 disabled={!canPunchOut}
 onClick={handlePunchOutAction}
 className="flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-30 disabled:cursor-not-allowed "
 >
 <LogOut className="h-3.5 w-3.5" />
 Punch Out
 </button>
 </div>
 <div className="grid grid-cols-2 gap-2">
 <button
 type="button"
 disabled={!canBreakStart}
 onClick={handleBreakStartAction}
 className="flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-semibold border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 disabled:opacity-30 disabled:cursor-not-allowed "
 >
 <Coffee className="h-3.5 w-3.5" />
 Start Break
 </button>
 <button
 type="button"
 disabled={!canBreakEnd}
 onClick={handleBreakEndAction}
 className="flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-semibold border border-sky-500/40 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 disabled:opacity-30 disabled:cursor-not-allowed "
 >
 <Radio className="h-3.5 w-3.5" />
 End Break
 </button>
 </div>
 </div>
 )}
 {myRecord.userId !== user?.id && canViewAllAttendance && (
   <div className="pt-3 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 flex items-center gap-2 text-xs text-slate-500">
     <MapPin className="h-3.5 w-3.5 text-slate-600 shrink-0" />
     <span>Read-only monitoring view. Punch controls are available only to the technician's own account.</span>
   </div>
 )}
 </div>
 ) : (
 <div className="text-center text-slate-500 py-6">
 <Clock className="h-10 w-10 text-slate-600 mx-auto mb-2 stroke-[1.5]" />
 <p className="text-sm font-semibold">No Record Selected</p>
 <p className="text-xs text-slate-600 mt-1">Select a technician from the list to view their active shift details.</p>
 </div>
 )}
 </CardBody>
 </Card>

 {/* History Table */}
 <Card className={clsx("glass-card", !canViewAllAttendance && "lg:col-span-2")}>
 <CardHeader
 title={canViewAllAttendance ? `${myRecord?.name || "Technician"}'s Shift Logs` : "My Attendance Logs"}
 subtitle={canViewAllAttendance ? "Chronological sequence of punch events for this technician" : "Chronological sequence of punch events recorded by this account"}
 />
 <CardBody className="p-0">
 {myHistory.length > 0 ? (
 <div className="overflow-x-auto">
 <table className="w-full text-left text-sm">
 <thead className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500 bg-slate-900/10">
 <tr>
 <th className="px-5 py-3">Event</th>
 <th className="px-5 py-3">Timestamp</th>
 <th className="px-5 py-3">Zone</th>
 <th className="px-5 py-3">GPS / Captured Address</th>
 </tr>
 </thead>
 <tbody>
 {myHistory.map((log) => (
 <tr
 key={log.id}
 className="border-b border-slate-800/60 hover:bg-slate-900/40"
 >
 <td className="px-5 py-4 font-semibold text-white">
 <div className="flex items-center gap-2">
 {getEventIcon(log.type)}
 <span>{getEventName(log.type)}</span>
 </div>
 </td>
 <td className="px-5 py-4 text-slate-300">
 {formatTimestamp(log.timestamp)}
 </td>
 <td className="px-5 py-4">
 <div className="flex items-center gap-1 text-slate-400">
 <MapPin className="h-3 w-3 text-sky-400" />
 {log.zone || "—"}
 </div>
 </td>
 <td className="px-5 py-4">
 <p className="text-xs text-slate-300">
 {log.gpsAddress || "No Address Captured"}
 </p>
 <p className="text-[10px] text-slate-500 font-mono mt-0.5">
 {log.gpsLat && log.gpsLng
 ? `${log.gpsLat.toFixed(4)}, ${log.gpsLng.toFixed(4)}`
 : "—"}
 </p>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 ) : (
 <div className="flex flex-col items-center justify-center p-8 text-slate-500">
 <FileText className="h-12 w-12 text-slate-600 mb-2 stroke-[1.25]" />
 <p className="text-sm font-semibold">No Logs Captured</p>
 <p className="text-xs text-slate-600 mt-1">
 {canViewAllAttendance ? "This technician has not recorded any attendance logs yet." : "Start punching in to populate your personal logs history."}
 </p>
 </div>
 )}
 </CardBody>
 </Card>
 </div>
 </div>
 </div>
 );
}
