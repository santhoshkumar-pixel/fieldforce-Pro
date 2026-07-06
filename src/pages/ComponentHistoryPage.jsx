import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { ArrowLeft, Clock, Package, AlertCircle } from "lucide-react";
import { api } from "../utils/api";

export default function ComponentHistoryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const stateComponent = location.state?.component;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [records, setRecords] = useState([]);
  const [componentData, setComponentData] = useState(stateComponent || null);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
        // Fetch the component history
        const historyData = await api.components.getHistory(id);
        if (mounted) {
          setRecords(Array.isArray(historyData) ? historyData : []);
        }

        // If we didn't receive the component via React Router state, fetch it
        if (!componentData) {
          // Fallback fetch if api supports it, otherwise we'll just use the ID
          try {
            const comp = await api.components.get(id);
            if (mounted) setComponentData(comp);
          } catch (e) {
            console.warn("Could not fetch component details individually.");
          }
        }
      } catch (err) {
        if (mounted) setError(err.message || "Failed to load component history.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (id) {
      loadData();
    }

    return () => {
      mounted = false;
    };
  }, [id, componentData]);

  // Handle format for dates
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }).format(date);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/30">
      {/* Page Header */}
      <div className="flex flex-col gap-4 border-b border-slate-800 bg-slate-900/50 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/inventory")}
            className="flex items-center justify-center rounded-xl border border-slate-800 bg-slate-950 p-2 text-slate-400 shadow-sm hover:bg-slate-900 hover:text-white transition-colors"
            title="Back to Inventory"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Package className="h-6 w-6 text-violet-500" />
              {componentData?.name ? `${componentData.name} History` : "Component History"}
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-400">
              Ticket linked assignment, reassignment, restore, and usage records
            </p>
          </div>
        </div>
      </div>

      {/* Main Content (Table) */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex h-64 items-center justify-center rounded-3xl border border-slate-800 bg-slate-950/40">
            <div className="flex items-center gap-3 text-slate-400">
              <Clock className="h-5 w-5 animate-spin" />
              <span className="font-semibold">Loading component history...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex h-64 items-center justify-center rounded-3xl border border-rose-500/20 bg-rose-500/10 p-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <AlertCircle className="h-8 w-8 text-rose-500" />
              <p className="text-lg font-semibold text-rose-300">{error}</p>
              <button
                onClick={() => navigate("/inventory")}
                className="mt-2 rounded-xl border border-rose-500/50 bg-rose-500/20 px-6 py-2 text-sm font-bold text-rose-200 hover:bg-rose-500/30"
              >
                Return to Inventory
              </button>
            </div>
          </div>
        ) : records.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-3xl border border-slate-800 bg-slate-950/40 p-6 text-center">
            <p className="text-lg font-semibold text-slate-400">No history found for this component.</p>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-800 bg-slate-950/40 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="border-b border-slate-800 bg-slate-900/60 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Ticket ID</th>
                    <th className="px-6 py-4">Assigned Person</th>
                    <th className="px-6 py-4">Assignment Date & Time</th>
                    <th className="px-6 py-4">Device Name(s)</th>
                    <th className="px-6 py-4">Component Name(s)</th>
                    <th className="px-6 py-4 text-center">Quantity</th>
                    <th className="px-6 py-4">Reason / Remarks</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {records.map((record, index) => {
                    const deviceNames = Array.isArray(record.deviceNames) ? record.deviceNames : [];
                    const componentNames = Array.isArray(record.componentNames) ? record.componentNames : [];

                    return (
                      <tr
                        key={record.id || `${record.ticketId}-${index}`}
                        className="transition-colors hover:bg-slate-800/30"
                      >
                        <td className="px-6 py-4 font-bold text-violet-400 whitespace-nowrap">
                          {record.ticketId || "N/A"}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-200 whitespace-nowrap">
                          {record.assignedPerson || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {formatDate(record.assignmentDateTime)}
                        </td>
                        <td className="px-6 py-4 min-w-[150px]">
                          {deviceNames.length > 0 ? deviceNames.join(", ") : "N/A"}
                        </td>
                        <td className="px-6 py-4 min-w-[150px]">
                          {componentNames.length > 0 ? componentNames.join(", ") : "N/A"}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-100">
                          {record.quantityUsed || 0}
                        </td>
                        <td className="px-6 py-4 min-w-[200px] text-slate-200">
                          {record.reason || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <Link
                            to={record.ticketId ? `/tickets?search=${record.ticketId}` : "#"}
                            className="inline-flex items-center rounded-xl bg-violet-600/10 px-4 py-2 text-xs font-bold text-violet-400 hover:bg-violet-600/20"
                          >
                            View Ticket
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
