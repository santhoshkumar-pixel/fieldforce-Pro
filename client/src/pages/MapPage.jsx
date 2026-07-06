import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Activity, Map as MapIcon, Cpu, AlertTriangle } from "lucide-react";
import clsx from "clsx";
import PageHeader from "../components/PageHeader";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { useDevice } from "../context/DeviceContext";
import { useAuth } from "../context/AuthContext";
import { getUserPlace } from "../utils/roleHelpers";
import { api } from "../utils/api";
import { useRegion } from "../context/RegionContext";
import { useAttendance } from "../context/AttendanceContext";

// Helper component to programmatically pan/zoom the Leaflet map
function MapController({ center, selectedTechId, shifts }) {
  const map = useMap();
  const shiftsRef = useRef(shifts);

  // Sync shifts to ref to avoid triggering the flight animation on telemetry updates
  useEffect(() => {
    shiftsRef.current = shifts;
  }, [shifts]);

  useEffect(() => {
    if (selectedTechId !== "all") {
      const techShift = shiftsRef.current.find((s) => s.userId === selectedTechId);
      if (techShift && techShift.gps) {
        map.flyTo([techShift.gps.lat, techShift.gps.lng], 14, {
          duration: 1.5,
          easeLinearity: 0.25,
        });
      }
    } else {
      map.flyTo([center.lat, center.lng], center.lat === 22.0 ? 5 : 10, {
        duration: 1.5,
        easeLinearity: 0.25,
      });
    }
  }, [selectedTechId, center, map]);

  return null;
}

// Function to calculate travel direction
function getTravelDirection(lat1, lng1, lat2, lng2) {
  if (lat1 === undefined || lng1 === undefined || lat2 === undefined || lng2 === undefined) return "Stationary";
  const dx = lng2 - lng1;
  const dy = lat2 - lat1;
  if (Math.abs(dx) < 0.0001 && Math.abs(dy) < 0.0001) return "Stationary";
  
  let angle = Math.atan2(dy, dx) * (180 / Math.PI);
  if (angle < 0) angle += 360;

  if (angle >= 337.5 || angle < 22.5) return "East ➡️";
  if (angle >= 22.5 && angle < 67.5) return "North-East ↗️";
  if (angle >= 67.5 && angle < 112.5) return "North ⬆️";
  if (angle >= 112.5 && angle < 157.5) return "North-West ↖️";
  if (angle >= 157.5 && angle < 202.5) return "West ⬅️";
  if (angle >= 202.5 && angle < 247.5) return "South-West ↙️";
  if (angle >= 247.5 && angle < 292.5) return "South ⬇️";
  return "South-East ↘️";
}

// Helper function to create custom Leaflet pins with status colors & technician initials
const createCustomIcon = (shift) => {
  const pinColor = shift.shiftStatus === "on_shift"
    ? "#a855f7" // Purple
    : shift.shiftStatus === "on_break"
      ? "#eab308" // Amber/Yellow
      : "#64748b"; // Slate / Grey

  const initials = shift.name
    ? shift.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  const htmlContent = `
    <div class="custom-leaflet-marker" style="display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; width: 36px; height: 46px;">
      <svg width="36" height="46" viewBox="0 0 36 46" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.45)); position: absolute; top: 0; left: 0;">
        <path d="M18 0C8.06 0 0 8.06 0 18C0 29.5 18 46 18 46C18 46 36 29.5 36 18C36 8.06 27.94 0 18 0Z" fill="${pinColor}" stroke="#1a052e" stroke-width="2"/>
        <circle cx="18" cy="18" r="11" fill="#09090b" stroke="#1a052e" stroke-width="1"/>
      </svg>
      <div style="position: absolute; top: 12px; left: 50%; transform: translateX(-50%); font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 800; color: #ffffff; pointer-events: none; z-index: 10; font-mono: inherit;">
        ${initials}
      </div>
    </div>
  `;

  return L.divIcon({
    html: htmlContent,
    className: "custom-div-icon",
    iconSize: [36, 46],
    iconAnchor: [18, 46],
    popupAnchor: [0, -46],
  });
};


export default function MapPage() {
  const { devices } = useDevice();
  const { user } = useAuth();
  const { selectedRegion, setSelectedRegionId } = useRegion();
  const { shifts: contextShifts } = useAttendance();
  const [liveShifts, setLiveShifts] = useState([]);
  
  useEffect(() => {
    setLiveShifts(contextShifts);
  }, [contextShifts]);

  const shifts = liveShifts;

  const userPlace = useMemo(() => {
    const defaultPlace = getUserPlace(user);
    if (defaultPlace) return defaultPlace;
    return selectedRegion ? selectedRegion.name : null;
  }, [user, selectedRegion]);

  const filteredShiftsByRegion = useMemo(() => {
    if (!userPlace) return shifts;
    return shifts.filter((s) => {
      const zoneLower = (s.zone || "").toLowerCase();
      if (userPlace === "Goa") {
        const goaKeywords = ["goa", "panaji", "mapusa", "margao", "vasco", "ponda", "bicholim"];
        return goaKeywords.some(k => zoneLower.includes(k));
      } else if (userPlace === "Bhutan") {
        return ["bhutan", "thimphu", "paro"].some(k => zoneLower.includes(k));
      }
      return true;
    });
  }, [shifts, userPlace]);

  const [ticketsList, setTicketsList] = useState([]);
  const [selectedTechId, setSelectedTechId] = useState(() => {
    if (user?.role === "Field Technician" || user?.role === "Technician") {
      return user.id;
    }
    return "all";
  });
  
  const [selectedTeamFilter, setSelectedTeamFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
  const [userTracks, setUserTracks] = useState({});
  const [wsConnectionStatus, setWsConnectionStatus] = useState("disconnected");
  const [selectedMarker, setSelectedMarker] = useState(null);

  const mapCenter = useMemo(() => {
    if (userPlace === "Bhutan") {
      return { lat: 27.4728, lng: 89.6393 };
    } else if (userPlace === "Goa") {
      return { lat: 15.4901, lng: 73.8199 };
    }
    return { lat: 22.0, lng: 80.0 }; // South Asia center containing both
  }, [userPlace]);

  const fetchTickets = async () => {
    try {
      const data = await api.tickets.getAll();
      setTicketsList(data || []);
    } catch (err) {
      console.error("Failed to load tickets", err);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const socketRef = useRef(null);
  const selectedTechIdRef = useRef(selectedTechId);

  // Sync selectedTechId ref
  useEffect(() => {
    selectedTechIdRef.current = selectedTechId;
  }, [selectedTechId]);

  // WebSocket connection management (runs once on mount)
  useEffect(() => {
    const wsUrl = "ws://localhost:8080/ws/tracking";
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setWsConnectionStatus("connected");
      console.log("Connected to tracking WebSocket server");
      if (selectedTechIdRef.current !== "all") {
        socket.send(JSON.stringify({
          type: "request_history",
          userId: selectedTechIdRef.current
        }));
      }
    };

    socket.onclose = () => {
      setWsConnectionStatus("disconnected");
      console.log("WebSocket disconnected");
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "location_broadcast") {
          setUserTracks((prev) => ({
            ...prev,
            [data.userId]: data.history || []
          }));
          setLiveShifts((prevShifts) =>
            prevShifts.map((s) => {
              if (s.userId === data.userId) {
                return {
                  ...s,
                  online: data.online,
                  shiftStatus: data.shiftStatus,
                  gps: {
                    lat: data.lat,
                    lng: data.lng,
                    address: data.address || "Live tracked coordinate"
                  }
                };
              }
              return s;
            })
          );
        } else if (data.type === "history_response") {
          setUserTracks((prev) => ({
            ...prev,
            [data.userId]: data.history || []
          }));
        }
      } catch (e) {
        console.error("Failed to parse WebSocket message:", e);
      }
    };

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, []);

  // Send WebSocket history requests when selected technician changes
  useEffect(() => {
    if (selectedTechId !== "all" && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send(JSON.stringify({
          type: "request_history",
          userId: selectedTechId
        }));
      } catch (err) {
        console.error("Failed to send WebSocket message:", err);
      }
    }
  }, [selectedTechId]);

  // Telemetry simulation timer (runs once on mount)
  useEffect(() => {
    const simInterval = setInterval(() => {
      setLiveShifts((prev) => prev.map(s => {
        if (!s.gps || typeof s.gps.lat !== "number" || isNaN(s.gps.lat) || typeof s.gps.lng !== "number" || isNaN(s.gps.lng)) return s;
        const jitterLat = s.gps.lat + (Math.random() - 0.5) * 0.0005;
        const jitterLng = s.gps.lng + (Math.random() - 0.5) * 0.0005;
        if (isNaN(jitterLat) || isNaN(jitterLng)) return s;
        const newPt = { lat: jitterLat, lng: jitterLng, timestamp: new Date().toISOString() };
        setUserTracks(pt => {
          const curr = pt[s.userId] || [];
          return { ...pt, [s.userId]: [...curr.slice(-49), newPt] };
        });
        return { ...s, gps: { ...s.gps, lat: jitterLat, lng: jitterLng } };
      }));
    }, 5000);

    return () => {
      clearInterval(simInterval);
    };
  }, []);

  // Initial population of mock tracking history
  useEffect(() => {
    if (shifts.length === 0) return;
    setUserTracks((prevTracks) => {
      const nextTracks = { ...prevTracks };
      shifts.forEach((shift) => {
        if (!nextTracks[shift.userId] && shift.gps) {
          const track = [];
          for (let i = 0; i < 20; i++) {
            track.push({
              lat: shift.gps.lat + Math.sin(i) * 0.005,
              lng: shift.gps.lng + Math.cos(i) * 0.005,
              timestamp: new Date(Date.now() - (20 - i) * 60000).toISOString()
            });
          }
          nextTracks[shift.userId] = track;
        }
      });
      return nextTracks;
    });
  }, [shifts]);

  const filteredDisplayShifts = filteredShiftsByRegion.filter((s) => {
    const matchTech = selectedTechId === "all" || s.userId === selectedTechId;
    const matchTeam = selectedTeamFilter === "all" || s.team === selectedTeamFilter;
    const matchStatus = selectedStatusFilter === "all" || s.shiftStatus === selectedStatusFilter;
    return matchTech && matchTeam && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <PageHeader title="Live Technician Telemetry Monitor" />
      </div>

      <div className="bg-slate-900/40 p-4 border border-slate-800/80 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
            <span className={`h-2.5 w-2.5 rounded-full ${wsConnectionStatus === "connected" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
            <Activity className="h-4.5 w-4.5 text-purple-400" />
            Live WebSocket Connection
            <span className="text-[10px] text-slate-500 font-medium font-mono uppercase tracking-wider">
              ({wsConnectionStatus})
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Select Technician</label>
            {user?.role === "Field Technician" || user?.role === "Technician" ? (
              <div className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-300">
                {user.name} (Viewing Self)
              </div>
            ) : (
              <select
                value={selectedTechId}
                onChange={(e) => {
                  setSelectedTechId(e.target.value);
                  setSelectedMarker(null);
                }}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none focus:border-purple-500/50"
              >
                <option value="all">All Technicians</option>
                {filteredShiftsByRegion.map((s) => (
                  <option key={s.userId} value={s.userId}>{s.name}</option>
                ))}
              </select>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Filter by Team</label>
            <select
              value={selectedTeamFilter}
              onChange={(e) => setSelectedTeamFilter(e.target.value)}
              disabled={user?.role === "Field Technician" || user?.role === "Technician"}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none focus:border-purple-500/50 disabled:opacity-50"
            >
              <option value="all">All Teams</option>
              {Array.from(new Set(filteredShiftsByRegion.map((s) => s.team).filter(Boolean))).sort().map((team) => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Filter by Live Status</label>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none focus:border-purple-500/50"
            >
              <option value="all">All Statuses</option>
              <option value="on_shift">Active / On Shift</option>
              <option value="on_break">On Break</option>
              <option value="off_shift">Offline / Off Shift</option>
            </select>
          </div>
        </div>
      </div>

      <Card className="border border-slate-800 bg-slate-950/40 backdrop-blur-xl">
        <CardHeader title="Live Map View" />
        <CardBody className="p-0 overflow-hidden rounded-b-2xl dark-map">
          <MapContainer
            center={[mapCenter.lat, mapCenter.lng]}
            zoom={mapCenter.lat === 22.0 ? 5 : 10}
            style={{ width: "100%", height: "650px" }}
            zoomControl={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {/* Circular markers on Goa and Bhutan displayed only when viewing All Regions */}
            {!selectedRegion && (
              <>
                <CircleMarker
                  center={[15.4901, 73.8199]}
                  radius={12}
                  pathOptions={{
                    fillColor: "#0f051d",
                    color: "#ef4444",
                    weight: 3,
                    fillOpacity: 0.85,
                    className: "blinking-marker"
                  }}
                  eventHandlers={{
                    click: () => {
                      setSelectedRegionId("goa");
                    }
                  }}
                >
                  <Popup>
                    <div className="p-1 text-center min-w-[120px]">
                      <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100">🇮🇳 Goa Region</h4>
                      <p className="text-[10px] text-slate-500 mt-1">Click to zoom & select</p>
                    </div>
                  </Popup>
                </CircleMarker>

                <CircleMarker
                  center={[27.4728, 89.6393]}
                  radius={12}
                  pathOptions={{
                    fillColor: "#1a1200",
                    color: "#ef4444",
                    weight: 3,
                    fillOpacity: 0.85,
                    className: "blinking-marker"
                  }}
                  eventHandlers={{
                    click: () => {
                      setSelectedRegionId("bhutan");
                    }
                  }}
                >
                  <Popup>
                    <div className="p-1 text-center min-w-[120px]">
                      <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100">🇧🇹 Bhutan Region</h4>
                      <p className="text-[10px] text-slate-500 mt-1">Click to zoom & select</p>
                    </div>
                  </Popup>
                </CircleMarker>
              </>
            )}
            
            <MapController
              center={mapCenter}
              selectedTechId={selectedTechId}
              shifts={shifts}
            />

            {/* Draw polylines for selected technicians */}
            {filteredDisplayShifts.map((shift) => {
              const track = userTracks[shift.userId] || [];
              const path = track
                .filter(pt => pt && typeof pt.lat === "number" && !isNaN(pt.lat) && typeof pt.lng === "number" && !isNaN(pt.lng))
                .map(pt => [pt.lat, pt.lng]);
              if (path.length < 2) return null;
              const isSelected = selectedTechId === shift.userId;
              
              return (
                <Polyline
                  key={`poly-${shift.userId}`}
                  positions={path}
                  pathOptions={{
                    color: shift.shiftStatus === "on_shift" ? "#a855f7" : "#64748b",
                    opacity: isSelected ? 1.0 : 0.4,
                    weight: isSelected ? 4 : 2,
                  }}
                />
              );
            })}

            {/* Draw Markers for current positions */}
            {filteredDisplayShifts.map((shift) => {
              if (!shift.gps) return null;
              return (
                <Marker
                  key={shift.userId}
                  position={[shift.gps.lat, shift.gps.lng]}
                  icon={createCustomIcon(shift)}
                  eventHandlers={{
                    click: () => setSelectedMarker(shift),
                  }}
                >
                  <Popup>
                    <div className="p-1 min-w-[180px]">
                      <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-0.5">{shift.name}</h3>
                      <p className="text-[11px] text-purple-650 dark:text-purple-400 font-semibold mb-1.5">{shift.team}</p>
                      <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                        {(() => {
                          const techTicket = ticketsList.find(t => t.technician === shift.name);
                          const track = userTracks[shift.userId] || [];
                          let direction = "Stationary";
                          if (track.length >= 2) {
                            const p1 = track[track.length - 2];
                            const p2 = track[track.length - 1];
                            direction = getTravelDirection(p1.lat, p1.lng, p2.lat, p2.lng);
                          }
                          
                          return (
                            <>
                              <div className="flex justify-between">
                                <span className="text-slate-450 dark:text-slate-400">Active Ticket:</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-200">{techTicket ? techTicket.id : "None"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-450 dark:text-slate-400">Status:</span>
                                <span className={techTicket ? "text-amber-600 dark:text-amber-400 font-semibold" : "text-slate-700 dark:text-slate-200"}>
                                  {techTicket ? techTicket.status : shift.shiftStatus === "on_shift" ? "Active" : shift.shiftStatus === "on_break" ? "On Break" : "Offline"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-450 dark:text-slate-400">Travel Dir:</span>
                                <span className="text-slate-700 dark:text-slate-200">{direction}</span>
                              </div>
                              <div className="flex flex-col mt-1.5 pt-1.5 border-t border-slate-200 dark:border-slate-800">
                                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Last Signal</span>
                                <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono mt-0.5">
                                  {track.length > 0 ? new Date(track[track.length - 1].timestamp).toLocaleTimeString() : "Just now"}
                                </span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </CardBody>
      </Card>
    </div>
  );
}
