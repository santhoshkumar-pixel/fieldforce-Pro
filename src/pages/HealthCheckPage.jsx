import { useState, useEffect } from "react";
import { 
  Activity, 
  RefreshCw, 
  CheckCircle2, 
  AlertOctagon, 
  Server, 
  Database, 
  Globe, 
  Radio, 
  Cpu, 
  HardDrive, 
  ShieldCheck, 
  Clock, 
  Layers, 
  UserCheck 
} from "lucide-react";
import { api } from "../utils/api";

export default function HealthCheckPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [dbHealth, setDbHealth] = useState(null);
  const [systemInfo, setSystemInfo] = useState(null);
  const [counts, setCounts] = useState(null);
  const [endpointChecks, setEndpointChecks] = useState([]);
  const [wsStatus, setWsStatus] = useState("Checking...");
  const [latency, setLatency] = useState(0);
  const [overallHealth, setOverallHealth] = useState("Healthy");
  const [lastCheck, setLastCheck] = useState(new Date().toLocaleTimeString());

  const checkWebsocket = () => {
    return new Promise((resolve) => {
      setWsStatus("Connecting...");
      try {
        const wsUrl = "ws://localhost:8080/ws/tracking";
        const socket = new WebSocket(wsUrl);
        
        socket.onopen = () => {
          setWsStatus("Connected");
          socket.close();
          resolve(true);
        };
        
        socket.onerror = () => {
          setWsStatus("Connection Failed");
          resolve(false);
        };
      } catch (err) {
        setWsStatus("Error");
        resolve(false);
      }
    });
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    let startOverallTime = performance.now();
    let endpointsList = [];
    let healthyCount = 0;

    // Helper to ping an endpoint and capture metrics
    const testEndpoint = async (name, apiCall) => {
      const start = performance.now();
      try {
        const res = await apiCall();
        const duration = Math.round(performance.now() - start);
        healthyCount++;
        endpointsList.push({ name, status: "Healthy", latency: duration, error: null });
      } catch (err) {
        const duration = Math.round(performance.now() - start);
        endpointsList.push({ 
          name, 
          status: "Unhealthy", 
          latency: duration, 
          error: err.message || "Request failed" 
        });
      }
    };

    // 1. Run REST Diagnostics
    try {
      const diagStart = performance.now();
      const res = await api.health.getDiagnostics();
      setLatency(Math.round(performance.now() - diagStart));
      
      setDbHealth(res.database || { status: "Unknown", latencyMs: 0 });
      setCounts(res.dataCounts || {});
      setSystemInfo(res.system || {});
      
      if (res.database?.status === "Healthy") healthyCount++;
    } catch (err) {
      setDbHealth({ status: "Unhealthy", error: err.message || "Failed to fetch diagnostics" });
      setCounts({});
      setSystemInfo({});
    }

    // 2. Ping individual core endpoints
    await testEndpoint("Authentication (RBAC Roles)", api.roles.getAll);
    await testEndpoint("Users Operations", api.users.getAll);
    await testEndpoint("Tickets Operations", api.tickets.getAll);
    await testEndpoint("Devices Catalog", api.devices.getAll);
    await testEndpoint("Teams & Schemes", api.teams.getAll);
    await testEndpoint("Attendance Shift Logs", api.attendance.getShifts);
    await testEndpoint("SLA Compliance Statistics", api.sla.getMetrics);
    await testEndpoint("Warehouse Spare Parts Catalog", api.components.getAll);
    await testEndpoint("System Broadcast Notifications", api.notifications.getAll);
    await testEndpoint("Training / Knowledge Portal", () => api.training.getAll());

    // 3. Test Websocket Connectivity
    const wsOk = await checkWebsocket();
    if (wsOk) healthyCount++;

    setEndpointChecks(endpointsList);
    
    // Determine overall health label
    const totalChecksCount = endpointsList.length + (dbHealth?.status === "Healthy" ? 1 : 0) + (wsOk ? 1 : 0);
    const failureCount = totalChecksCount - healthyCount;

    if (failureCount === 0) {
      setOverallHealth("Healthy");
    } else if (failureCount <= 3) {
      setOverallHealth("Warning (Partial Failures)");
    } else {
      setOverallHealth("Critical System Outage");
    }

    setLastCheck(new Date().toLocaleTimeString());
    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner / Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800 bg-slate-900/60 p-6 rounded-3xl backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className={`p-3.5 rounded-2xl ${
            overallHealth === "Healthy" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : 
            overallHealth.includes("Warning") ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : 
            "bg-rose-500/10 text-rose-400 border border-rose-500/20"
          }`}>
            <Activity className="h-8 w-8 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">System Status Check</span>
              <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded-full text-slate-400 font-mono border border-slate-800">
                Last checked: {lastCheck}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2 mt-1">
              {overallHealth}
            </h1>
          </div>
        </div>

        <button
          onClick={runDiagnostics}
          disabled={isRunning}
          className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-500 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-4 w-4 ${isRunning ? "animate-spin" : ""}`} />
          Run diagnostics
        </button>
      </div>

      {/* Grid of Core Services */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* API Latency */}
        <div className="border border-slate-800 bg-slate-950/40 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-violet-500/10 text-violet-400 rounded-xl border border-violet-500/25">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">HTTP API Latency</span>
            <span className="text-lg font-bold text-white font-mono">{latency} ms</span>
          </div>
        </div>

        {/* Database Health */}
        <div className="border border-slate-800 bg-slate-950/40 p-5 rounded-2xl flex items-center gap-4">
          <div className={`p-3 rounded-xl border ${
            dbHealth?.status === "Healthy" 
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25" 
              : "bg-rose-500/10 text-rose-400 border-rose-500/25"
          }`}>
            <Database className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Database (Supabase)</span>
            <span className={`text-lg font-bold ${
              dbHealth?.status === "Healthy" ? "text-emerald-400" : "text-rose-400"
            }`}>
              {dbHealth?.status || "Checking..."}
            </span>
          </div>
        </div>

        {/* WebSocket health */}
        <div className="border border-slate-800 bg-slate-950/40 p-5 rounded-2xl flex items-center gap-4">
          <div className={`p-3 rounded-xl border ${
            wsStatus === "Connected" 
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25" 
              : "bg-rose-500/10 text-rose-400 border-rose-500/25"
          }`}>
            <Radio className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">WebSocket Gateway</span>
            <span className={`text-lg font-bold ${
              wsStatus === "Connected" ? "text-emerald-400" : "text-rose-400"
            }`}>
              {wsStatus}
            </span>
          </div>
        </div>

        {/* JVM Environment info */}
        <div className="border border-slate-800 bg-slate-950/40 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/25">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Java JVM Target</span>
            <span className="text-sm font-bold text-white block mt-0.5 truncate max-w-[150px] font-mono">
              Java {systemInfo?.jvmVersion || "17"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Endpoint checking checklist */}
        <div className="lg:col-span-2 border border-slate-800 bg-slate-900/20 rounded-3xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Server className="h-5 w-5 text-indigo-400" />
            Backend REST Endpoint Checklist
          </h2>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {endpointChecks.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-indigo-500" />
                Triggering diagnostic checklist...
              </div>
            ) : (
              endpointChecks.map((chk, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 border border-slate-800 bg-slate-950/20 rounded-2xl text-sm">
                  <div className="flex items-center gap-3">
                    {chk.status === "Healthy" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertOctagon className="h-4 w-4 text-rose-500 shrink-0" />
                    )}
                    <div>
                      <span className="font-semibold text-slate-300 block">{chk.name}</span>
                      {chk.error && (
                        <span className="text-[10px] font-mono text-rose-400 mt-0.5 block">{chk.error}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-mono">{chk.latency} ms</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      chk.status === "Healthy" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}>
                      {chk.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right column: Database row counts and JVM Performance */}
        <div className="space-y-6">
          {/* Database Row Integrity */}
          <div className="border border-slate-800 bg-slate-900/20 rounded-3xl p-6">
            <h3 className="text-md font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
              <Layers className="h-4 w-4 text-emerald-400" />
              Database Seed Integrity
            </h3>

            {counts ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm py-1 border-b border-slate-850">
                  <span className="text-slate-400">Total Users Rows</span>
                  <span className="font-bold text-slate-100 font-mono">{counts.usersCount ?? 0}</span>
                </div>
                <div className="flex justify-between items-center text-sm py-1 border-b border-slate-850">
                  <span className="text-slate-400">Active Devices Rows</span>
                  <span className="font-bold text-slate-100 font-mono">{counts.devicesCount ?? 0}</span>
                </div>
                <div className="flex justify-between items-center text-sm py-1 border-b border-slate-850">
                  <span className="text-slate-400">Tickets Registered</span>
                  <span className="font-bold text-slate-100 font-mono">{counts.ticketsCount ?? 0}</span>
                </div>
                <div className="flex justify-between items-center text-sm py-1 border-b border-slate-850">
                  <span className="text-slate-400">Warehouse Inventory Items</span>
                  <span className="font-bold text-slate-100 font-mono">{counts.componentsCount ?? 0}</span>
                </div>
                <div className="flex justify-between items-center text-sm py-1 border-b border-slate-850">
                  <span className="text-slate-400">Technician Shifts Rows</span>
                  <span className="font-bold text-slate-100 font-mono">{counts.shiftsCount ?? 0}</span>
                </div>
                <div className="flex justify-between items-center text-sm py-1">
                  <span className="text-slate-400">Broadcast Notifications</span>
                  <span className="font-bold text-slate-100 font-mono">{counts.notificationsCount ?? 0}</span>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-650 text-xs">No metrics fetched</div>
            )}
          </div>

          {/* JVM Memory Stats */}
          <div className="border border-slate-800 bg-slate-900/20 rounded-3xl p-6">
            <h3 className="text-md font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
              <HardDrive className="h-4 w-4 text-cyan-400" />
              Runtime JVM Resources
            </h3>

            {systemInfo && systemInfo.usedMemoryBytes ? (
              <div className="space-y-4">
                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                    <span>Allocated JVM Memory Used</span>
                    <span>{Math.round(systemInfo.usedMemoryBytes / (1024 * 1024))} MB / {Math.round(systemInfo.totalMemoryBytes / (1024 * 1024))} MB</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.round((systemInfo.usedMemoryBytes / systemInfo.totalMemoryBytes) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2.5 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Active JVM Threads</span>
                    <span className="font-semibold text-slate-200 font-mono">{systemInfo.activeThreads} threads</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Target Machine OS</span>
                    <span className="font-semibold text-slate-200">{systemInfo.osName} ({systemInfo.osVersion})</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CPU Core Allotments</span>
                    <span className="font-semibold text-slate-200">{systemInfo.availableProcessors} Cores</span>
                  </div>
                  <div className="flex justify-between">
                    <span>JVM Uptime</span>
                    <span className="font-semibold text-slate-200 font-mono">
                      {Math.round(systemInfo.uptimeMs / 60000)} minutes
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-650 text-xs">No metrics fetched</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
