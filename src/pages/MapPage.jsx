import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { GoogleMap, useJsApiLoader, Marker, Polyline, InfoWindow } from "@react-google-maps/api";
import { io } from "socket.io-client";
import { Activity, ArrowLeft, BarChart3, Map as MapIcon, RefreshCw, Cpu, CheckCircle2, AlertTriangle, AlertOctagon } from "lucide-react";
import clsx from "clsx";
import PageHeader from "../components/PageHeader";
import Badge, { deviceStatusVariant } from "../components/ui/Badge";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { useDevice } from "../context/DeviceContext";
import { useAuth } from "../context/AuthContext";
import { getUserPlace } from "../utils/roleHelpers";
import { api } from "../utils/api";
import { useRegion } from "../context/RegionContext";
import { useAttendance } from "../context/AttendanceContext";

const containerStyle = {
  width: "100%",
  height: "650px",
  borderRadius: "0px"
};

const defaultCenter = {
  lat: 15.4901,
  lng: 73.8199
};

const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#0a0212" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0a0212" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#c084fc" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#a855f7" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#a855f7" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#1a052e" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d8b4fe" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#581c87" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1a052e" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#c084fc" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#6b21a8" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1a052e" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#581c87" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#a855f7" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#1a052e" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#c084fc" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#1a052e" }],
  },
];

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

export default function MapPage() {
  // Validate and load Google Maps API key
  const googleMapsApiKey = useMemo(() => {
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
    // Only pass if it is a valid browser key starting with AIzaSy
    return key.startsWith("AIzaSy") ? key : "";
  }, []);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: googleMapsApiKey,
  });

  // Dynamically compute map options to avoid warnings about setting styles with mapId
  const mapOptions = useMemo(() => {
    return {
      disableDefaultUI: false,
      zoomControl: true,
      streetViewControl: false,
      mapTypeControl: false,
      ...(googleMapsApiKey ? { mapId: "116619c5cc773e01f19fcdd604916991" } : { styles: darkMapStyles }),
    };
  }, [googleMapsApiKey]);

  const { devices } = useDevice();
  const { user } = useAuth();
  const { selectedRegion } = useRegion();
  const { shifts: contextShifts } = useAttendance();
  const [liveShifts, setLiveShifts] = useState([]);
  
  const mapRef = useRef(null);

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

  const [activeTab, setActiveTab] = useState("map");
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

  // States for Maps Embed API
  const [embedMode, setEmbedMode] = useState("place");
  const [embedQuery, setEmbedQuery] = useState("Space Needle, Seattle WA");
  const [embedLocation, setEmbedLocation] = useState("47.6205,-122.3493");
  const [zoomLevel, setZoomLevel] = useState(14);
  const [mapType, setMapType] = useState("roadmap");

  const mapCenter = useMemo(() => {
    if (userPlace === "Bhutan") {
      return { lat: 27.4728, lng: 89.6393 };
    }
    return { lat: 15.4901, lng: 73.8199 };
  }, [userPlace]);

  useEffect(() => {
    if (userPlace === "Bhutan") {
      setEmbedQuery("Thimphu, Bhutan");
      setEmbedLocation("27.4728,89.6393");
    } else {
      setEmbedQuery("Panaji, Goa, India");
      setEmbedLocation("15.4909,73.8278");
    }
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

  const handleMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const handleMapUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  // Pan to selected technician
  useEffect(() => {
    if (selectedTechId !== "all" && mapRef.current) {
      const techShift = shifts.find((s) => s.userId === selectedTechId);
      if (techShift && techShift.gps) {
        mapRef.current.panTo({ lat: techShift.gps.lat, lng: techShift.gps.lng });
        mapRef.current.setZoom(14);
      }
    } else if (selectedTechId === "all" && mapRef.current) {
      mapRef.current.panTo(mapCenter);
      mapRef.current.setZoom(10);
    }
  }, [selectedTechId, shifts, mapCenter]);

  // Sync selected technician with embed inputs
  useEffect(() => {
    if (selectedTechId !== "all") {
      const techShift = shifts.find((s) => s.userId === selectedTechId);
      if (techShift && techShift.gps) {
        const coords = `${techShift.gps.lat.toFixed(6)},${techShift.gps.lng.toFixed(6)}`;
        setEmbedLocation(coords);
        setEmbedQuery(techShift.gps.address || coords);
      }
    }
  }, [selectedTechId, shifts]);

  // Memoized URL for Maps Embed API
  const embedUrl = useMemo(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "116619c5cc773e01f19fcdd604916991";
    if (embedMode === "place") {
      let url = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(embedQuery)}`;
      if (zoomLevel) url += `&zoom=${zoomLevel}`;
      if (mapType) url += `&maptype=${mapType}`;
      return url;
    } else {
      return `https://www.google.com/maps/embed/v1/streetview?key=${apiKey}&location=${encodeURIComponent(embedLocation)}`;
    }
  }, [embedMode, embedQuery, embedLocation, zoomLevel, mapType]);

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
        
        {/* Environment warning if no API key */}
        {!import.meta.env.VITE_GOOGLE_MAPS_API_KEY && (
          <div className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            VITE_GOOGLE_MAPS_API_KEY is missing from .env
          </div>
        )}
      </div>

      <div className="bg-slate-900/40 p-1.5 border border-slate-800/60 rounded-2xl flex items-center gap-2 w-fit">
        <button
          onClick={() => setActiveTab("map")}
          className={clsx(
            "px-4.5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2",
            activeTab === "map"
              ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
              : "text-slate-400 border border-transparent"
          )}
        >
          <MapIcon className="h-4 w-4" />
          Interactive Google Map
        </button>
        <button
          onClick={() => setActiveTab("embed")}
          className={clsx(
            "px-4.5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2",
            activeTab === "embed"
              ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
              : "text-slate-400 border border-transparent"
          )}
        >
          <Cpu className="h-4 w-4" />
          Maps Embed API (iFrame)
        </button>
      </div>

      {activeTab === "map" && (
        <div className="bg-slate-900/40 p-4 border border-slate-800/80 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
              <span className={`h-2.5 w-2.5 rounded-full ${wsConnectionStatus === "connected" ? "bg-emerald-500" : "bg-rose-500"}`} />
              <Activity className="h-4.5 w-4.5 text-sky-400" />
              Socket.io Live Feed
              <span className="text-[10px] text-slate-500 font-medium font-mono uppercase tracking-wider">
                ({wsConnectionStatus})
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Select Technician</label>
              {user?.role === "Field Technician" || user?.role === "Technician" ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-350">
                  {user.name} (Viewing Self)
                </div>
              ) : (
                <select
                  value={selectedTechId}
                  onChange={(e) => {
                    setSelectedTechId(e.target.value);
                    setSelectedMarker(null);
                  }}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none focus:border-sky-500/50"
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
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none focus:border-sky-500/50 disabled:opacity-50"
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
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none focus:border-sky-500/50"
              >
                <option value="all">All Statuses</option>
                <option value="on_shift">Active / On Shift</option>
                <option value="on_break">On Break</option>
                <option value="off_shift">Offline / Off Shift</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {activeTab === "map" && (
        <Card className="border border-slate-800 bg-slate-950/40 backdrop-blur-xl">
          <CardHeader title="Live Map View" subtitle="Powered by Google Maps" />
          <CardBody className="p-0">
            {loadError ? (
              <div className="text-rose-500 p-10 text-center font-semibold bg-rose-500/5 rounded-2xl">
                Error loading Google Maps JS SDK. Please verify your API Key.
              </div>
            ) : !isLoaded ? (
              <div className="text-sky-500 p-10 text-center font-bold animate-pulse">
                Loading Google Maps JavaScript API...
              </div>
            ) : (
              <GoogleMap
                mapContainerStyle={containerStyle}
                center={mapCenter}
                zoom={10}
                onLoad={handleMapLoad}
                onUnmount={handleMapUnmount}
                options={mapOptions}
              >
                {/* Draw polylines for selected technicians */}
                {filteredDisplayShifts.map((shift) => {
                  const track = userTracks[shift.userId] || [];
                  const path = track
                    .filter(pt => pt && typeof pt.lat === "number" && !isNaN(pt.lat) && typeof pt.lng === "number" && !isNaN(pt.lng))
                    .map(pt => ({ lat: pt.lat, lng: pt.lng }));
                  if (path.length < 2) return null;
                  const isSelected = selectedTechId === shift.userId;
                  
                  return (
                    <Polyline
                      key={`poly-${shift.userId}`}
                      path={path}
                      options={{
                        strokeColor: shift.shiftStatus === "on_shift" ? "#a855f7" : "#ffffff",
                        strokeOpacity: isSelected ? 1.0 : 0.5,
                        strokeWeight: isSelected ? 4 : 2,
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
                      position={{ lat: shift.gps.lat, lng: shift.gps.lng }}
                      title={shift.name}
                      onClick={() => setSelectedMarker(shift)}
                      icon={{
                        path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
                        fillColor: shift.shiftStatus === "on_shift" ? "#a855f7" : "#ffffff",
                        fillOpacity: 1,
                        strokeWeight: 1,
                        strokeColor: "#1a052e",
                        scale: 1.5,
                        anchor: new window.google.maps.Point(12, 24),
                      }}
                    />
                  );
                })}

                {/* Info Window rendering */}
                {selectedMarker && selectedMarker.gps && (
                  <InfoWindow
                    position={{ lat: selectedMarker.gps.lat, lng: selectedMarker.gps.lng }}
                    onCloseClick={() => setSelectedMarker(null)}
                    options={{ pixelOffset: new window.google.maps.Size(0, -35) }}
                  >
                    <div className="bg-white p-2 rounded-lg text-zinc-950 max-w-[200px]">
                      <h3 className="font-bold text-sm mb-1">{selectedMarker.name}</h3>
                      <p className="text-xs text-slate-600 mb-2 font-semibold">{selectedMarker.team}</p>
                      <div className="space-y-1 text-[11px]">
                        {(() => {
                          const techTicket = ticketsList.find(t => t.technician === selectedMarker.name);
                          const track = userTracks[selectedMarker.userId] || [];
                          let direction = "Stationary";
                          if (track.length >= 2) {
                            const p1 = track[track.length - 2];
                            const p2 = track[track.length - 1];
                            direction = getTravelDirection(p1.lat, p1.lng, p2.lat, p2.lng);
                          }
                          
                          return (
                            <>
                              <div className="flex justify-between">
                                <span className="font-semibold">Ticket:</span>
                                <span>{techTicket ? techTicket.id : "None"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-semibold">Status:</span>
                                <span className={techTicket ? "text-amber-600 font-bold" : ""}>
                                  {techTicket ? techTicket.status : selectedMarker.shiftStatus}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-semibold">Travel Dir:</span>
                                <span>{direction}</span>
                              </div>
                              <div className="flex flex-col mt-2 pt-2 border-t border-slate-200">
                                <span className="font-semibold text-slate-500">Last Updated</span>
                                <span className="text-slate-500">
                                  {track.length > 0 ? new Date(track[track.length - 1].timestamp).toLocaleTimeString() : "Just now"}
                                </span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            )}
          </CardBody>
        </Card>
      )}
      {activeTab === "embed" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel: Controls (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border border-slate-800 bg-slate-950/40 backdrop-blur-xl">
              <CardHeader title="Embed Configuration" subtitle="Configure iframe HTTP request" />
              <CardBody className="p-5 space-y-4">
                {/* Mode Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Embed Mode</label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 border border-slate-850 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setEmbedMode("place")}
                      className={clsx(
                        "py-1.5 rounded-lg text-xs font-semibold text-center transition-all",
                        embedMode === "place" ? "bg-sky-500/20 text-sky-400 border border-sky-500/20" : "text-slate-400 border border-transparent"
                      )}
                    >
                      Place Map
                    </button>
                    <button
                      type="button"
                      onClick={() => setEmbedMode("streetview")}
                      className={clsx(
                        "py-1.5 rounded-lg text-xs font-semibold text-center transition-all",
                        embedMode === "streetview" ? "bg-sky-500/20 text-sky-400 border border-sky-500/20" : "text-slate-400 border border-transparent"
                      )}
                    >
                      Street View
                    </button>
                  </div>
                </div>

                {/* Dynamic input depending on mode */}
                {embedMode === "place" ? (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Search Place / Address</label>
                    <input
                      type="text"
                      value={embedQuery}
                      onChange={(e) => setEmbedQuery(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none focus:border-sky-500/50"
                      placeholder="e.g. Space Needle, Seattle WA"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Latitude, Longitude / Location</label>
                    <input
                      type="text"
                      value={embedLocation}
                      onChange={(e) => setEmbedLocation(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none focus:border-sky-500/50"
                      placeholder="e.g. 15.4909,73.8278 or Panaji, Goa"
                    />
                  </div>
                )}

                {/* Place Map Options */}
                {embedMode === "place" && (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Zoom Level</label>
                        <span className="text-xs font-mono text-sky-400 font-bold">{zoomLevel}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="21"
                        value={zoomLevel}
                        onChange={(e) => setZoomLevel(parseInt(e.target.value))}
                        className="w-full accent-sky-500 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Map Type</label>
                      <select
                        value={mapType}
                        onChange={(e) => setMapType(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none focus:border-sky-500/50"
                      >
                        <option value="roadmap">Roadmap</option>
                        <option value="satellite">Satellite</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Presets */}
                <div className="flex flex-col gap-2 pt-3 border-t border-slate-800/80">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Quick Presets</label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (embedMode === "place") {
                          setEmbedQuery("Space Needle, Seattle WA");
                        } else {
                          setEmbedLocation("47.6205,-122.3493");
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-xl text-[10px] font-semibold bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-white text-slate-300 transition-colors"
                    >
                      Space Needle
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (embedMode === "place") {
                          setEmbedQuery("Panaji, Goa, India");
                        } else {
                          setEmbedLocation("15.4909,73.8278");
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-xl text-[10px] font-semibold bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-white text-slate-300 transition-colors"
                    >
                      Panaji, Goa
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (embedMode === "place") {
                          setEmbedQuery("Thimphu, Bhutan");
                        } else {
                          setEmbedLocation("27.4728,89.6393");
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-xl text-[10px] font-semibold bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-white text-slate-300 transition-colors"
                    >
                      Thimphu, Bhutan
                    </button>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Quick Technician list */}
            <Card className="border border-slate-800 bg-slate-950/40 backdrop-blur-xl">
              <CardHeader title="Technician Live Locations" subtitle="Select a tech to load their location" />
              <CardBody className="p-4 max-h-[200px] overflow-y-auto space-y-2">
                {filteredShiftsByRegion.map((s) => (
                  <button
                    key={s.userId}
                    onClick={() => {
                      setSelectedTechId(s.userId);
                      if (s.gps) {
                        const coords = `${s.gps.lat.toFixed(6)},${s.gps.lng.toFixed(6)}`;
                        setEmbedLocation(coords);
                        setEmbedQuery(s.gps.address || coords);
                      }
                    }}
                    className={clsx(
                      "w-full flex items-center justify-between rounded-xl border p-2 text-left text-xs transition-all",
                      selectedTechId === s.userId
                        ? "border-sky-500/50 bg-slate-800/80"
                        : "border-slate-800 bg-slate-900/20 hover:border-slate-750"
                    )}
                  >
                    <div>
                      <p className="font-semibold text-slate-200">{s.name}</p>
                      <p className="text-[10px] text-slate-500">{s.team}</p>
                    </div>
                    <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md">
                      {s.shiftStatus === "on_shift" ? "Active" : "Offline"}
                    </span>
                  </button>
                ))}
              </CardBody>
            </Card>
          </div>

          {/* Right Panel: Iframe View (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <Card className="border border-slate-800 bg-slate-950/40 backdrop-blur-xl">
              <CardHeader
                title={`Maps Embed API Iframe View (${embedMode === "place" ? "Place Mode" : "Street View Mode"})`}
                subtitle="Direct HTTP Request - Zero JS Loading"
              />
              <CardBody className="p-4 space-y-4">
                <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 aspect-video lg:h-[450px] w-full">
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={embedUrl}
                  />
                </div>

                {/* Generated Code Block */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Generated HTML Code</label>
                  <div className="relative rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-300 select-all overflow-x-auto">
                    {`<iframe
  width="100%"
  height="450"
  style="border:0"
  loading="lazy"
  allowfullscreen
  referrerpolicy="no-referrer-when-downgrade"
  src="${embedUrl.replace(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "116619c5cc773e01f19fcdd604916991", "YOUR_API_KEY")}">
</iframe>`}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Note: The API Key has been replaced with <code className="text-slate-400 font-mono">YOUR_API_KEY</code> for security if you copy this code snippet.
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
