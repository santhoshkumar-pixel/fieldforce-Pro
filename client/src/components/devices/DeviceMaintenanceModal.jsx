import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";

export default function DeviceMaintenanceModal({ open, onClose, device, onSubmit }) {
  const [reason, setReason] = useState("");
  const [maintenanceDate, setMaintenanceDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [cost, setCost] = useState(0);
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState(null);

  if (!open || !device) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Please specify the reason for maintenance.");
      return;
    }
    onSubmit({
      reason,
      maintenanceDate,
      cost: parseFloat(cost) || 0.0,
      remarks
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/50 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Request Maintenance
          </h3>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Device details */}
          <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-3.5 text-xs flex justify-between">
            <div>
              <span className="text-slate-500 font-bold uppercase block">Device ID</span>
              <span className="text-white font-semibold font-mono">{device.id}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold uppercase block">Name / Type</span>
              <span className="text-white font-semibold">{device.name} ({device.type})</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold uppercase block">Current Status</span>
              <span className="text-amber-400 font-semibold">{device.status}</span>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
              Reason for Maintenance
            </label>
            <textarea
              required
              rows={3}
              placeholder="Describe the diagnostics issue, malfunction, or servicing requirements..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-sky-500/50 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                Maintenance Date
              </label>
              <input
                type="date"
                required
                value={maintenanceDate}
                onChange={(e) => setMaintenanceDate(e.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-500/50"
              />
            </div>

            {/* Cost */}
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                Estimated Cost ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-500/50"
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
              Remarks (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Special instructions or extra details..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-sky-500/50 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-2xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-500 shadow-lg shadow-amber-950/20"
            >
              Request Maintenance
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
