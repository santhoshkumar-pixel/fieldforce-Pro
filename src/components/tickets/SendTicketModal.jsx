import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { dispatchPriorities } from "../../data/dispatchTickets";

export default function SendTicketModal({
 open,
 onClose,
 onSubmit,
 technicians,
 ticket,
}) {
 const [customer, setCustomer] = useState("");
 const [site, setSite] = useState("");
 const [technician, setTechnician] = useState("");
 const [priority, setPriority] = useState("MEDIUM");
 const [issue, setIssue] = useState("");

 useEffect(() => {
 if (open) {
 setCustomer(ticket?.customer ?? "");
 setSite(ticket?.site ?? "");
 setTechnician(ticket?.technician ?? "");
 setPriority(ticket?.priority ?? "MEDIUM");
 setIssue("");
 }
 }, [open, ticket]);

 if (!open) return null;

 const handleSubmit = (e) => {
 e.preventDefault();
 if (!customer.trim() || !technician) return;
 onSubmit({
 customer: customer.trim(),
 site: site.trim() || "—",
 technician,
 priority,
 issue: issue.trim(),
 });
 onClose();
 };

 const inputClass =
 "mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20";

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
 <div
 className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/50"
 role="dialog"
 aria-labelledby="send-ticket-title"
 >
 <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
 <h2 id="send-ticket-title" className="text-lg font-semibold text-white">
 {ticket ? "Resend ticket to technician" : "Send ticket to technician"}
 </h2>
 <button
 type="button"
 onClick={onClose}
 className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
 >
 <X className="h-5 w-5" />
 </button>
 </div>

 <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
 <label className="block text-sm font-medium text-slate-300">
 CP Name *
 <input
 value={customer}
 onChange={(e) => setCustomer(e.target.value)}
 className={inputClass}
 required
 />
 </label>

 <label className="block text-sm font-medium text-slate-300">
 Site / location
 <input
 value={site}
 onChange={(e) => setSite(e.target.value)}
 className={inputClass}
 />
 </label>

 <label className="block text-sm font-medium text-slate-300">
 Assign technician *
 <select
 value={technician}
 onChange={(e) => setTechnician(e.target.value)}
 className={inputClass}
 required
 >
 <option value="">Select technician</option>
 {technicians.map((name) => (
 <option key={name} value={name}>
 {name}
 </option>
 ))}
 </select>
 </label>

 <label className="block text-sm font-medium text-slate-300">
 Priority
 <select
 value={priority}
 onChange={(e) => setPriority(e.target.value)}
 className={inputClass}
 >
 {dispatchPriorities.map((p) => (
 <option key={p} value={p}>
 {p}
 </option>
 ))}
 </select>
 </label>

 <label className="block text-sm font-medium text-slate-300">
 Description (Reason for ticket)
 <textarea
 value={issue}
 onChange={(e) => setIssue(e.target.value)}
 rows={3}
 className={inputClass}
 placeholder="Describe the issue or reason for creating this ticket..."
 />
 </label>

 <p className="text-xs text-slate-500">
 Technician will receive this job as{" "}
 <strong className="text-slate-300">ASSIGNED</strong> and can accept or
 reject it.
 </p>

 <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
 <button
 type="button"
 onClick={onClose}
 className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
 >
 Cancel
 </button>
 <button
 type="submit"
 className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
 >
 Send ticket
 </button>
 </div>
 </form>
 </div>
 </div>
 );
}
