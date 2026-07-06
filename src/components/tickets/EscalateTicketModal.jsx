import { useState } from "react";
import { AlertTriangle, Bell, Send, X, Package, Headphones, ChevronLeft } from "lucide-react";

export default function EscalateTicketModal({ open, ticketId, ticket, onClose, onConfirm }) {
  const [reason, setReason] = useState("");
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleClose = () => {
    setReason("");
    setStep(1);
    setSubmitting(false);
    onClose();
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert("Please provide an escalation reason.");
      return;
    }
    setStep(2);
  };

  const handleSelectType = async (escalationType) => {
    const finalReason = reason.trim();
    setSubmitting(true);
    try {
      await onConfirm(finalReason, escalationType);
      handleClose();
    } catch (err) {
      console.error("Escalation failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900 shadow-2xl shadow-black/60">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-gradient-to-r from-amber-900/30 to-slate-900 px-6 py-4">
          <div className="flex items-center gap-3">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="mr-1 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                title="Go back"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 ring-1 ring-amber-500/40">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                {step === 1 ? "Escalate Ticket" : "Choose Escalation Path"}
              </h2>
              <p className="text-xs text-slate-400">
                {step === 1 ? "Request manager review for this ticket" : "Select who should handle this escalation"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        {step === 1 ? (
          <form onSubmit={handleNext}>
            <div className="space-y-4 p-6">
              {/* Ticket info */}
              <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Ticket ID</span>
                  <span className="text-xs font-bold text-sky-400 font-mono">{ticketId}</span>
                </div>
                {ticket?.customer && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Customer / CP</span>
                    <span className="text-xs font-medium text-slate-200">{ticket.customer}</span>
                  </div>
                )}
                {ticket?.technician && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Assigned To</span>
                    <span className="text-xs font-medium text-slate-200">{ticket.technician}</span>
                  </div>
                )}
              </div>

              {/* Notification info banner */}
              <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                <Bell className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                <p className="text-xs text-amber-300">
                  Escalating this ticket will pause your progress and allow routing to the regional warehouse or technical support.
                </p>
              </div>

              {/* Reason textarea */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Reason for Escalation <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  required
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
                  placeholder="Describe the roadblock or reason why this ticket needs to be escalated (e.g. specialized tools needed, safety concern, structural issue)..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-800 bg-slate-950/40 px-6 py-4">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500 shadow-lg shadow-amber-600/20"
              >
                Next Step
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 space-y-4">
            <p className="text-xs text-slate-400 font-medium">
              Select one of the options below to submit your escalation:
            </p>

            <div className="space-y-3">
              {/* Warehouse option */}
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSelectType("WAREHOUSE")}
                className="w-full text-left flex items-start gap-4 rounded-xl border border-slate-800 bg-slate-800/40 p-4 hover:border-sky-500/40 hover:bg-slate-800/70 transition duration-200 group disabled:opacity-50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 group-hover:bg-sky-500/20 ring-1 ring-slate-700 group-hover:ring-sky-500/30">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white group-hover:text-sky-350">
                    Warehouse Escalation
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Show ticket as Pending to Super Admin and regional Warehouse Manager for parts/device replacement and reassignment.
                  </p>
                </div>
              </button>

              {/* Tech Support option */}
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSelectType("TECH_SUPPORT")}
                className="w-full text-left flex items-start gap-4 rounded-xl border border-slate-800 bg-slate-800/40 p-4 hover:border-violet-500/40 hover:bg-slate-800/70 transition duration-200 group disabled:opacity-50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 group-hover:bg-violet-500/20 ring-1 ring-slate-700 group-hover:ring-violet-500/30">
                  <Headphones className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white group-hover:text-violet-350">
                    Tech Support Desk
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    View contact details for L2 Technical Support. Allows discussing the issue directly and marking as completed.
                  </p>
                </div>
              </button>
            </div>

            {/* Back button */}
            <div className="flex justify-start border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Edit escalation reason
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
