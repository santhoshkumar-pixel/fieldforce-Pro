import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { api } from "../utils/api";
import { operationalZones, shiftStatuses } from "../data/attendanceData";

const AttendanceContext = createContext(null);

export function AttendanceProvider({ children }) {
 const { user } = useAuth();
 
 const [shifts, setShifts] = useState([]);
 const [attendanceHistory, setAttendanceHistory] = useState([]);
 const [selectedId, setSelectedId] = useState(null);
 const [loading, setLoading] = useState(true);

 const fetchAttendanceData = async () => {
 try {
 const [shiftsData, historyData] = await Promise.all([
 api.attendance.getShifts(),
 api.attendance.getHistory()
 ]);
 setShifts(shiftsData || []);
 setAttendanceHistory(historyData || []);
 } catch (err) {
 console.error("Failed to fetch attendance data:", err);
 } finally {
 setLoading(false);
 }
 };

 // Fetch initial shifts and history
 useEffect(() => {
 fetchAttendanceData();
 }, []);

  // Ensure current user has a shift record on the backend (all roles with attendance access)
  useEffect(() => {
    if (user?.id && shifts.length >= 0) {
      // Only create shift record for the user themselves (not for managers viewing others)
      const exists = shifts.some((s) => s.userId === user.id);
      if (!exists) {
        // Create shift record for all roles with attendance access
        const newUserShift = {
          userId: user.id,
          name: user.name,
          team: user.team || "Operations Control",
          zone: user.zone || "Goa",
          shiftStatus: shiftStatuses.OFF_SHIFT,
          online: false,
          punchInAt: null,
          punchOutAt: null,
          breakStartAt: null,
          totalBreakMs: 0,
          gpsLat: null,
          gpsLng: null,
          gpsAddress: null,
        };
        
        api.attendance.createOrUpdateShift
          ? api.attendance.createOrUpdateShift(newUserShift)
              .then((created) => {
                setShifts((prev) => [created, ...prev]);
              })
              .catch((err) => console.error("Error creating user shift:", err))
          : fetch(`http://localhost:8080/api/attendance/shifts`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newUserShift)
            }).then(() => fetchAttendanceData());
      }
    }
  }, [user?.id, shifts.length]);

  // Set the default selected ID based on role
  useEffect(() => {
    if (user?.id) {
      const isManagerRole =
        user.role === "Super Admin" ||
        user.role === "Operational Manager" ||
        user.role === "Admin" ||
        user.role === "Scheme PC" ||
        user.role === "Scheme Admin";
      if (!isManagerRole) {
        // Technicians/Field Workers: select their own record
        setSelectedId(user.id);
      } else {
        // Manager roles: try to select first technician other than self,
        // but fall back to self if no technicians are found
        const firstOther = shifts.find((s) => s.userId !== user.id);
        setSelectedId(firstOther?.userId || user.id);
      }
    }
  }, [user, shifts]);

 const mockGpsForZone = (zoneLabel) => {
 const zone =
 operationalZones.find((z) => z.label === zoneLabel) || operationalZones[0];
 const jitter = () => (Math.random() - 0.5) * 0.02;
 return {
 lat: zone.lat + jitter(),
 lng: zone.lng + jitter(),
 address: `${zone.label} — GPS captured`,
 };
 };

  const punchIn = async (techId) => {
    const sTech = shifts.find((s) => s.userId === techId);
    // If no local record: allow the attempt — backend will auto-create the shift
    if (sTech && sTech.shiftStatus !== shiftStatuses.OFF_SHIFT) return null;
    const gps = sTech
      ? mockGpsForZone(sTech.zone || "Goa")
      : mockGpsForZone(user?.zone || "Goa");
    const name = sTech?.name || user?.name || techId;
    
    try {
      const response = await api.attendance.punchIn(techId, gps);
      await fetchAttendanceData();
      return `${name} punched in — GPS captured`;
    } catch (err) {
      console.error("Error on punch-in:", err);
      return null;
    }
  };

 const punchOut = async (techId) => {
 const sTech = shifts.find((s) => s.userId === techId);
 if (!sTech || sTech.shiftStatus === shiftStatuses.OFF_SHIFT) return null;
 const gps = sTech.gpsLat ? { lat: sTech.gpsLat, lng: sTech.gpsLng, address: sTech.gpsAddress } : mockGpsForZone(sTech.zone || "Goa");
 
 try {
 const response = await api.attendance.punchOut(techId, gps);
 await fetchAttendanceData();
 return `${sTech.name} punched out`;
 } catch (err) {
 console.error("Error on punch-out:", err);
 return null;
 }
 };

 const startBreak = async (techId) => {
 const sTech = shifts.find((s) => s.userId === techId);
 if (!sTech || sTech.shiftStatus !== shiftStatuses.ON_SHIFT) return null;
 const gps = sTech.gpsLat ? { lat: sTech.gpsLat, lng: sTech.gpsLng, address: sTech.gpsAddress } : mockGpsForZone(sTech.zone || "Goa");

 try {
 const response = await api.attendance.startBreak(techId, gps);
 await fetchAttendanceData();
 return `${sTech.name} break started`;
 } catch (err) {
 console.error("Error on break start:", err);
 return null;
 }
 };

 const endBreak = async (techId) => {
 const sTech = shifts.find((s) => s.userId === techId);
 if (!sTech || sTech.shiftStatus !== shiftStatuses.ON_BREAK) return null;
 const gps = sTech.gpsLat ? { lat: sTech.gpsLat, lng: sTech.gpsLng, address: sTech.gpsAddress } : mockGpsForZone(sTech.zone || "Goa");

 try {
 const response = await api.attendance.endBreak(techId, gps);
 await fetchAttendanceData();
 return `${sTech.name} break ended`;
 } catch (err) {
 console.error("Error on break end:", err);
 return null;
 }
 };

 const formattedShifts = useMemo(() => {
 return shifts.map(s => ({
 id: s.userId,
 userId: s.userId,
 name: s.name,
 team: s.team,
 zone: s.zone,
 shiftStatus: s.shiftStatus,
 online: s.online,
 punchInAt: s.punchInAt,
 punchOutAt: s.punchOutAt,
 breakStartAt: s.breakStartAt,
 totalBreakMs: s.totalBreakMs,
 gps: s.gpsLat ? { lat: s.gpsLat, lng: s.gpsLng, address: s.gpsAddress } : null
 }));
 }, [shifts]);

 const formattedHistory = useMemo(() => {
 return attendanceHistory.map(h => ({
 id: h.id,
 technicianId: h.technicianId,
 technicianName: h.technicianName,
 type: h.type,
 timestamp: h.timestamp,
 gps: h.gpsLat ? { lat: h.gpsLat, lng: h.gpsLng, address: h.gpsAddress } : null,
 zone: h.zone
 }));
 }, [attendanceHistory]);

 return (
 <AttendanceContext.Provider
 value={{
 shifts: formattedShifts,
 attendanceHistory: formattedHistory,
 selectedId,
 setSelectedId,
 punchIn,
 punchOut,
 startBreak,
 endBreak,
 loading,
 refresh: fetchAttendanceData,
 }}
 >
 {children}
 </AttendanceContext.Provider>
 );
}

export function useAttendance() {
 const context = useContext(AttendanceContext);
 if (!context) {
 throw new Error("useAttendance must be used within an AttendanceProvider");
 }
 return context;
}
