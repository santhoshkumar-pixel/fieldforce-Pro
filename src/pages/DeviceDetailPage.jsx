import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Cpu,
  Wifi,
  Battery,
  MapPin,
  Clock,
  ShieldAlert,
  Settings2,
  Activity,
  Radio,
  Zap,
  Thermometer,
  BarChart2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import Badge, { deviceStatusVariant } from "../components/ui/Badge";
import { useDevice } from "../context/DeviceContext";

function MetaItem({ label, value, icon: Icon, accent }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
        {Icon && <Icon className={`h-3.5 w-3.5 ${accent || "text-slate-400"}`} />}
        {label}
      </span>
      <span className="text-sm font-semibold text-white">{value || "—"}</span>
    </div>
  );
}

function TelemetryBar({ label, value, max = 100, color = "sky" }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const colorMap = {
    sky: "bg-sky-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
  };
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400 font-medium">{label}</span>
        <span className="text-white font-bold">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${colorMap[color] || colorMap.sky}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function DeviceDetailPage() {
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const { devices, loading } = useDevice();

  const device = devices.find((d) => d.id === deviceId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-sky-500/30 border-t-sky-500 animate-spin" />
          <p className="text-slate-400 text-sm">Loading device…</p>
        </div>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-12 w-12 text-slate-600" />
        <p className="text-slate-400 text-lg font-semibold">Device not found</p>
        <p className="text-slate-600 text-sm">ID: {deviceId}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Go back
        </button>
      </div>
    );
  }

  const isOnline = device.status === "Online";
  const isCritical = device.status === "Critical";
  const isOffline = device.status === "Offline";

  const signalStrength =
    isOffline ? 0 : device.connectivity === "LTE" ? 87 : 72;
  const batteryLevel = device.battery ?? 85;
  const cpuLoad = isOffline ? 0 : isCritical ? 92 : 34;
  const memoryUsage = isOffline ? 0 : isCritical ? 88 : 41;
  const packetLoss = isOffline ? 100 : isCritical ? 5 : 0;
  const uptime = isOffline ? 0 : 99;

  const statusGradient = isCritical
    ? "from-rose-500/10 to-slate-900"
    : isOffline
    ? "from-slate-700/20 to-slate-900"
    : "from-sky-500/10 to-slate-900";

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Back Button & Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {device.name}
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Device ID:{" "}
            <span className="font-mono text-sky-400">{device.id}</span>
          </p>
        </div>
        <div className="ml-auto">
          <Badge variant={deviceStatusVariant(device.status)} className="text-sm px-3 py-1">
            {device.status}
          </Badge>
        </div>
      </div>

      {/* Hero Card */}
      <div
        className={`rounded-3xl border border-slate-800 bg-gradient-to-br ${statusGradient} p-6 md:p-8 shadow-2xl`}
      >
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          {/* Icon */}
          <div
            className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl border ${
              isCritical
                ? "border-rose-500/30 bg-rose-500/10"
                : isOffline
                ? "border-slate-700 bg-slate-800"
                : "border-sky-500/30 bg-sky-500/10"
            }`}
          >
            <Cpu
              className={`h-10 w-10 ${
                isCritical
                  ? "text-rose-400"
                  : isOffline
                  ? "text-slate-500"
                  : "text-sky-400"
              }`}
            />
          </div>

          {/* Main Info */}
          <div className="flex-1 space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              {device.type}
            </p>
            <h2 className="text-3xl font-extrabold text-white">{device.name}</h2>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              {device.site && (
                <span className="flex items-center gap-1.5 text-sm text-slate-400">
                  <MapPin className="h-4 w-4 text-slate-500" />
                  {device.site}
                </span>
              )}
              {device.connectivity && (
                <span className="flex items-center gap-1.5 text-sm text-slate-400">
                  <Wifi className="h-4 w-4 text-sky-400" />
                  {device.connectivity}
                </span>
              )}
              {device.lastSync && (
                <span className="flex items-center gap-1.5 text-sm text-slate-400">
                  <Clock className="h-3.5 w-3.5 text-slate-500" />
                  Last seen: {device.lastSync}
                </span>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-4 md:flex-col md:items-end">
            <div className="text-right">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Battery</p>
              <p
                className={`text-2xl font-extrabold ${
                  batteryLevel > 20 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {batteryLevel}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Uptime</p>
              <p className="text-2xl font-extrabold text-sky-400">{uptime}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Alert Banner */}
      {isCritical && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/5 px-5 py-4">
          <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-rose-400 uppercase tracking-wide">
              Critical Alert
            </p>
            <p className="text-sm text-rose-300 mt-0.5">
              This unit has breached temperature thresholds or report rate cycles. Field dispatch
              advised. Immediate inspection required.
            </p>
          </div>
        </div>
      )}

      {/* Metadata Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <MetaItem label="Device ID" value={device.id} icon={Cpu} accent="text-sky-400" />
        <MetaItem label="Device Type" value={device.type} icon={Radio} accent="text-violet-400" />
        <MetaItem label="Firmware" value={device.firmware} icon={Settings2} accent="text-amber-400" />
        <MetaItem
          label="Connectivity"
          value={device.connectivity}
          icon={Wifi}
          accent="text-sky-400"
        />
        <MetaItem
          label="Deployment Site"
          value={device.site || "Not Deployed"}
          icon={MapPin}
          accent="text-emerald-400"
        />
        <MetaItem
          label="Battery Level"
          value={device.battery ? `${device.battery}%` : "—"}
          icon={Battery}
          accent={batteryLevel > 20 ? "text-emerald-400" : "text-rose-400"}
        />
        <MetaItem label="Last Heartbeat" value={device.lastSync} icon={Clock} accent="text-slate-400" />
        <MetaItem
          label="Duration"
          value={
            device.statusDurationDays != null
              ? `${device.statusDurationDays} Days`
              : "—"
          }
          icon={Activity}
          accent="text-teal-400"
        />
        <MetaItem
          label="Pick Date"
          value={device.pickDate}
          icon={Clock}
          accent="text-emerald-400"
        />
        <MetaItem
          label="Drop Date"
          value={device.dropDate}
          icon={Clock}
          accent="text-rose-400"
        />
      </div>

      {/* Telemetry Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Performance Metrics */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-500/10 border border-sky-500/20">
              <BarChart2 className="h-4.5 w-4.5 text-sky-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Performance Metrics</h3>
              <p className="text-xs text-slate-500">Live hardware telemetry</p>
            </div>
          </div>
          <div className="space-y-4">
            <TelemetryBar label="Signal Strength" value={signalStrength} color="sky" />
            <TelemetryBar
              label="Battery Level"
              value={batteryLevel}
              color={batteryLevel > 50 ? "emerald" : batteryLevel > 20 ? "amber" : "rose"}
            />
            <TelemetryBar label="CPU Load" value={cpuLoad} color={cpuLoad > 80 ? "rose" : "sky"} />
            <TelemetryBar
              label="Memory Usage"
              value={memoryUsage}
              color={memoryUsage > 80 ? "rose" : "sky"}
            />
          </div>
        </div>

        {/* Network & Health */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-500/20">
              <Zap className="h-4.5 w-4.5 text-violet-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Network & Health</h3>
              <p className="text-xs text-slate-500">Connectivity diagnostics</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: "Signal Uptime",
                value: isOffline ? "0%" : "99.85%",
                icon: Activity,
                good: !isOffline,
              },
              {
                label: "Signal Strength",
                value: isOffline
                  ? "None"
                  : device.connectivity === "LTE"
                  ? "-65 dBm"
                  : "-72 dBm",
                icon: Wifi,
                good: !isOffline,
              },
              {
                label: "Packet Loss",
                value: `${packetLoss}%`,
                icon: Radio,
                good: packetLoss < 1,
              },
              {
                label: "Health Status",
                value: isOnline ? "Healthy" : device.status,
                icon: isOnline ? CheckCircle2 : ShieldAlert,
                good: isOnline,
              },
              {
                label: "Latency",
                value: isOffline ? "—" : isCritical ? "480 ms" : "12 ms",
                icon: Clock,
                good: !isOffline && !isCritical,
              },
              {
                label: "Temp",
                value: isOffline ? "—" : isCritical ? "78 °C" : "42 °C",
                icon: Thermometer,
                good: !isCritical && !isOffline,
              },
            ].map(({ label, value, icon: Icon, good }) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3 space-y-1"
              >
                <div className="flex items-center gap-1.5">
                  <Icon
                    className={`h-3.5 w-3.5 ${good ? "text-emerald-400" : "text-rose-400"}`}
                  />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {label}
                  </p>
                </div>
                <p
                  className={`text-sm font-bold ${good ? "text-white" : "text-rose-300"}`}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
