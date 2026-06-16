import { Link } from "react-router-dom";
import { ArrowRight, X } from "lucide-react";
import Badge, { severityVariant, statusVariant } from "./ui/Badge";
import { useState } from "react";
import { api } from "../utils/api";
import DeviceDetailsModal from "./devices/DeviceDetailsModal";

function renderCell(value, columnName) {
  if (!value || value === "—") return <span className="text-slate-500">—</span>;
  if (typeof value === "object") return value; // Return custom React element directly
  if (["Severity", "Priority"].includes(columnName)) {
    const variant = severityVariant(value);
    return (
      <Badge variant={variant !== "default" ? variant : "warning"}>
        {value}
      </Badge>
    );
  }
  if (["Status", "Risk"].includes(columnName)) {
    return <Badge variant={statusVariant(value)}>{value}</Badge>;
  }
  if (columnName === "SLA Left" || columnName === "Est. time") {
    return <span className="font-mono text-xs text-rose-400">{value}</span>;
  }
  return <span className="text-slate-300">{value}</span>;
}

export default function KpiDetailModal({ open, onClose, detail }) {
  if (!open || !detail) return null;

  const [selectedDevice, setSelectedDevice] = useState(null);
  const [loadingDevice, setLoadingDevice] = useState(false);

  const handleDeviceIdClick = async (deviceId) => {
    setLoadingDevice(true);
    try {
      const dev = await api.devices.getById(deviceId);
      setSelectedDevice(dev);
    } catch (err) {
      console.error("Failed to load device details:", err);
    } finally {
      setLoadingDevice(false);
    }
  };

  const dataColumns = detail.columns.filter((c) => c && c.trim() !== "");
  const valueKeys = dataColumns.slice(1).map((_, idx) =>
    idx === dataColumns.length - 2 ? "extra" : `col${idx + 2}`
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[85vh] w-full max-w-4xl flex-col rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="kpi-detail-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 px-6 py-5">
          <div>
            <h2 id="kpi-detail-title" className="text-xl font-semibold text-white">
              {detail.title}
            </h2>
            <p className="mt-1 text-sm text-slate-400">{detail.description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-6 py-4">
          {detail.rows.length === 0 ? (
            <p className="py-12 text-center text-slate-500">No records found.</p>
          ) : (
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                  {dataColumns.map((col) => (
                    <th key={col} className="px-3 py-3">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {detail.rows.map((row, i) => (
                  <tr
                    key={`${row.id}-${i}`}
                    className="border-b border-slate-800/60 hover:bg-slate-800/30"
                  >
                    <td className="px-3 py-3 font-medium text-sky-400">
                      {row.id && (row.id.startsWith("DV-") || row.id.startsWith("MCH")) ? (
                        <button
                          type="button"
                          onClick={() => handleDeviceIdClick(row.id)}
                          className="text-sky-400 hover:text-sky-300 hover:underline font-semibold cursor-pointer text-left font-mono"
                        >
                          {row.id}
                        </button>
                      ) : (
                        row.id
                      )}
                    </td>
                    {dataColumns.slice(1).map((colName, idx) => (
                      <td key={colName} className="px-3 py-3">
                        {renderCell(row[valueKeys[idx]], colName)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-slate-800 px-6 py-4">
          <p className="text-xs text-slate-500">
            Showing {detail.rows.length} record
            {detail.rows.length !== 1 ? "s" : ""}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
            >
              Close
            </button>
            {detail.link && (
              <Link
                to={detail.link}
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
              >
                Open full page
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
      {selectedDevice && (
        <DeviceDetailsModal
          open={Boolean(selectedDevice)}
          device={selectedDevice}
          onClose={() => setSelectedDevice(null)}
        />
      )}
    </div>
  );
}
