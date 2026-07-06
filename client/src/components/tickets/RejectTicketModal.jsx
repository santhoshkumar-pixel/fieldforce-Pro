import { useState } from "react";
import { AlertTriangle, Bell, Send, X } from "lucide-react";

export default function RejectTicketModal({ open, ticketId, ticket, onClose, onConfirm }) {
 const [reason, setReason] = useState("");
 const [submitting, setSubmitting] = useState(false);

 if (!open) return null;

 const handleClose = () => {
 setReason("");
 setSubmitting(false);
 onClose();
 };

 const handleSubmit = async (e) => {
 e.preventDefault();
 const finalReason = reason.trim() || "No reason provided";
 setSubmitting(true);
 try {
 await onConfirm(finalReason);
 setReason("");
 } finally {
 setSubmitting(false);
 }
 };

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 {/* Backdrop */}
 <div
 className="absolute inset-0 bg-black/70 backdrop-blur-sm"
 onClick={handleClose}
 />

 {/* Modal */}
 <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900 shadow-2xl shadow-black/50">
 {/* Header */}
 <div className="flex items-center justify-between border-b border-slate-800 bg-gradient-to-r from-red-900/30 to-slate-900 px-6 py-4">
 <div className="flex items-center gap-3">
 <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/20 ring-1 ring-red-500/40">
 <AlertTriangle className="h-4 w-4 text-red-400" />
 </div>
 <div>
 <h2 className="text-base font-semibold text-white">Reject Ticket</h2>
 <p className="text-xs text-slate-400">Provide a reason for rejection</p>
 </div>
 </div>
 <button
 type="button"
 onClick={handleClose}
 className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white "
 >
 <X className="h-4 w-4" />
 </button>
 </div>

 {/* Body */}
 <form onSubmit={handleSubmit}>
 <div className="space-y-4 p-6">
 {/* Ticket info */}
 <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-4 space-y-2">
 <div className="flex items-center justify-between">
 <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Ticket</span>
 <span className="text-xs font-bold text-sky-400">{ticketId}</span>
 </div>
 {ticket?.customer && (
 <div className="flex items-center justify-between">
 <span className="text-xs text-slate-500">CP</span>
 <span className="text-xs font-medium text-slate-200">{ticket.customer}</span>
 </div>
 )}
 {ticket?.technician && (
 <div className="flex items-center justify-between">
 <span className="text-xs text-slate-500">Assigned to</span>
 <span className="text-xs font-medium text-slate-200">{ticket.technician}</span>
 </div>
 )}
 </div>

 {/* Notification info banner */}
 <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
 <Bell className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
 <p className="text-xs text-amber-300">
 A notification will be sent to the ticket creator with your rejection reason.
 </p>
 </div>

 {/* Reason textarea */}
 <div>
 <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
 Rejection Reason <span className="text-red-400">*</span>
 </label>
 <textarea
 value={reason}
 onChange={(e) => setReason(e.target.value)}
 rows={4}
 className="w-full resize-none rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 "
 placeholder="e.g. Already on another critical job, unavailable due to equipment issue…"
 />
 <p className="mt-1.5 text-right text-xs text-slate-500">{reason.length} characters</p>
 </div>
 </div>

 {/* Footer */}
 <div className="flex items-center justify-end gap-3 border-t border-slate-800 bg-slate-900/80 px-6 py-4">
 <button
 type="button"
 onClick={handleClose}
 className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 "
 >
 Cancel
 </button>
 <button
 type="submit"
 disabled={submitting}
 className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60 "
 >
 {submitting ? (
 <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white" />
 ) : (
 <Send className="h-4 w-4" />
 )}
 Reject &amp; Notify
 </button>
 </div>
 </form>
 </div>
 </div>
 );
}
