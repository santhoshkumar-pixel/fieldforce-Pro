const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\santhosh.kumar\\.gemini\\antigravity\\brain\\fb12bc4b-fd79-4364-b1cc-56898039b9da\\.system_generated\\logs\\transcript.jsonl';
const fileContent = fs.readFileSync(logPath, 'utf8');
const lines = fileContent.split('\n');

const lineMap = {};

lines.forEach((line) => {
  if (!line.trim()) return;
  try {
    const step = JSON.parse(line);
    if (step.type === 'VIEW_FILE' && step.content && step.content.includes('TicketDetailsModal.jsx')) {
      // Parse out lines like "740:  Start Travel" or "740: Start Travel"
      const contentLines = step.content.split('\n');
      contentLines.forEach(l => {
        const match = l.match(/^(\d+):\s?(.*)/);
        if (match) {
          const lineNum = parseInt(match[1], 10);
          const lineText = match[2];
          // Keep the line content (we can overwrite, newer edits are later in the logs)
          lineMap[lineNum] = lineText;
        }
      });
    }
  } catch (e) {}
});

// Let's see how many lines we have
const lineNumbers = Object.keys(lineMap).map(Number).sort((a,b) => a-b);
console.log("TOTAL DISTINCT LINES RECOVERED:", lineNumbers.length);
if (lineNumbers.length > 0) {
  console.log("MIN LINE:", lineNumbers[0], "MAX LINE:", lineNumbers[lineNumbers.length-1]);
  
  // Find gaps
  const gaps = [];
  let startGap = -1;
  for (let i = 1; i <= lineNumbers[lineNumbers.length-1]; i++) {
    if (lineMap[i] === undefined) {
      if (startGap === -1) startGap = i;
    } else {
      if (startGap !== -1) {
        gaps.push([startGap, i - 1]);
        startGap = -1;
      }
    }
  }
  if (startGap !== -1) {
    gaps.push([startGap, lineNumbers[lineNumbers.length-1]]);
  }
  console.log("GAPS:", gaps);
  
  // Let's write out the reconstructed file
  const reconstructed = [];
  for (let i = 1; i <= lineNumbers[lineNumbers.length-1]; i++) {
    reconstructed.push(lineMap[i] !== undefined ? lineMap[i] : `// MISSING LINE ${i}`);
  }
  fs.writeFileSync('C:\\Users\\santhosh.kumar\\Downloads\\FieldForce Project\\src\\components\\tickets\\TicketDetailsModal.reconstructed.jsx', reconstructed.join('\n'), 'utf8');
  console.log("Wrote reconstructed file to TicketDetailsModal.reconstructed.jsx");
}

 HIGH: "bg-orange-500/90 text-white",
 CRITICAL: "bg-red-600 text-white",
 MEDIUM: "bg-amber-500/90 text-slate-950",
 LOW: "bg-emerald-600 text-white",
 };
 return (
 <span
 className={`inline-block rounded px-2.5 py-1 text-xs font-bold uppercase ${styles[priority] || "bg-slate-600 text-white"}`}
 >
 {priority}
 </span>
 );
}

function StatusBadge({ status }) {
 const config = {
 ACCEPTED: { dot: "bg-blue-400", text: "text-blue-400" },
 TRAVELLING: { dot: "bg-violet-400", text: "text-violet-400" },
 ASSIGNED: { dot: "bg-slate-400", text: "text-slate-300" },
 COMPLETED: { dot: "bg-emerald-400", text: "text-emerald-400" },
 REJECTED: { dot: "bg-red-400", text: "text-red-400" },
 UNASSIGNED: { dot: "bg-amber-400", text: "text-amber-400" },
 ESCALATED: { dot: "bg-red-500", text: "text-red-400" },
 };
 const c = config[status] || config.ASSIGNED;
 return (
 <span className={`inline-flex items-center gap-2 text-xs font-semibold uppercase ${c.text}`}>
 <span className={`h-2.5 w-2.5 rounded-full ${c.dot} `} />
 {status}
 </span>
 );
}

const formatTicketDateTime = (sentAtStr) => {
 if (!sentAtStr) return "—";
 try {
 const d = new Date(sentAtStr);
 if (isNaN(d.getTime())) return sentAtStr;
 return d.toLocaleString("en-US", {
 month: "short",
 day: "numeric",
 hour: "2-digit",
 minute: "2-digit",
 hour12: true,
 });
 } catch {
 return sentAtStr;
 }
};

export default function TicketDetailsModal({
 open,
 ticket,
 currentUser,
 onClose,
 onAccept,
 onReject,
 onSend,
 onStartTravel,
 onComplete,
}) {
 const { hasPermission } = useAuth();

 if (!open || !ticket) return null;

 const isAssignedTech = ticket.technician === currentUser?.name && (currentUser?.role === "Field Technician" || currentUser?.role === "Technician");
 const isAdminOrSchemeAdmin = currentUser?.role === "Super Admin" || currentUser?.role === "Scheme Admin" || currentUser?.role === "Admin";
 const groupedDevices = getGroupedDevices(ticket);

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm ">
 <div className="w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/80 fade-in zoom-in-95 ">
 {/* Header */}
 <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/40 px-6 py-4">
 <div className="flex items-center gap-2.5">
 <ClipboardList className="h-5 w-5 text-sky-400" />
 <div>
 <h2 className="text-lg font-bold text-white">Ticket Details</h2>
// MISSING LINE 141
// MISSING LINE 142
// MISSING LINE 143
// MISSING LINE 144
// MISSING LINE 145
// MISSING LINE 146
// MISSING LINE 147
// MISSING LINE 148
// MISSING LINE 149
  const isAssignedTech = ticket.technician === currentUser?.name && (currentUser?.role === "Field Technician" || currentUser?.role === "Technician");
  const isAdminOrSchemeAdmin = currentUser?.role === "Super Admin" || currentUser?.role === "Scheme PC" || currentUser?.role === "Admin";
 const groupedDevices = getGroupedDevices(ticket);

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm ">
 <div className="w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/80 fade-in zoom-in-95 ">
 {/* Header */}
 <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/40 px-6 py-4">
 <div className="flex items-center gap-2.5">
 <ClipboardList className="h-5 w-5 text-sky-400" />
 <div>
 <h2 className="text-lg font-bold text-white">Ticket Details</h2>
 <p className="text-xs text-slate-400">ID: {ticket.id}</p>
 </div>
 </div>
 <button
 type="button"
 onClick={onClose}
 className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white "
 >
 <X className="h-5 w-5" />
 </button>
 </div>

 {/* Content */}
 <div className="px-6 py-6 space-y-6 overflow-y-auto flex-1">
 <div className="grid grid-cols-2 gap-y-5 gap-x-4 border-b border-slate-850 pb-5">
 {/* Ticket ID */}
 <div>
 <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
 Ticket ID
 </span>
 <span className="mt-1 block font-mono text-sm font-bold text-sky-400">
 {ticket.id}
 </span>
 </div>

 {/* Customer / CP */}
 <div>
 <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
 {ticket.jobType === "services" ||
 ticket.jobType === "maintainance" ||
 ticket.jobType === "deployments" ||
 ticket.jobType === "service_repairs" ||
 ticket.jobType === "schedule_maintenance"
 ? "CP Name"
 : "CP"}
 </span>
 <span className="mt-1 block text-sm font-semibold text-white">
 {ticket.customer}
 </span>
 </div>

 {/* Technician */}
 <div>
 <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
 Technician
 </span>
 <span className="mt-1 block text-sm font-medium text-slate-200">
 {ticket.technician || (
 <span className="text-slate-500 italic">Unassigned</span>
 )}
 </span>
 </div>

 {/* Priority */}
 <div>
 <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
 Priority
 </span>
 : "text-rose-400"
 }`}
 >
 {ticket.slaTime}
 </span>
 </div>

 {/* Ticket Created */}
 <div>
 <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
 Ticket Created
 </span>
 <span className="mt-1 block font-mono text-xs font-medium text-slate-300">
 {ticket.createdAt
 ? formatTicketDateTime(ticket.createdAt)
 : ticket.sentAt
 ? formatTicketDateTime(
 new Date(
 new Date(ticket.sentAt).getTime() - 2 * 60 * 60 * 1000
 ).toISOString()
 )
 : formatTicketDateTime(
 new Date(
 new Date().getTime() - 4 * 60 * 60 * 1000
 ).toISOString()
 )}
 </span>
 </div>

 {/* Ticket Created */}
 <div>
 <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
 Ticket Created
 </span>
 <span className="mt-1 block font-mono text-xs font-medium text-slate-300">
 {ticket.createdAt
 ? formatTicketDateTime(ticket.createdAt)
 : ticket.sentAt
 ? formatTicketDateTime(
 new Date(
 new Date(ticket.sentAt).getTime() - 2 * 60 * 60 * 1000
 ).toISOString()
 )
 : formatTicketDateTime(
 new Date(
 new Date().getTime() - 4 * 60 * 60 * 1000
 ).toISOString()
 )}
 </span>
 </div>

 {/* Assign Date */}
 <div>
 <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
 Assign Date
 </span>
 <span className="mt-1 block font-mono text-xs font-medium text-slate-300">
 {ticket.sentAt ? formatTicketDateTime(ticket.sentAt) : <span className="text-slate-500">—</span>}
 </span>
 </div>

 {/* Accepted Date */}
 <div>
 <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
 Accepted Date
 </span>
 <span className="mt-1 block font-mono text-xs font-medium text-slate-300">
 {ticket.respondedAt &&
 ["ACCEPTED", "TRAVELLING", "COMPLETED"].includes(ticket.status) ? (
 formatTicketDateTime(ticket.respondedAt)
 ) : ticket.sentAt &&
 ["ACCEPTED", "TRAVELLING", "COMPLETED"].includes(ticket.statu
 new Date(ticket.respondedAt).getTime() + 2 * 60 * 60 * 1000
 ).toISOString()
 )
 ) : ticket.status === "COMPLETED" ? (
 formatTicketDateTime(
 new Date(
 new Date().getTime() - 30 * 60 * 1000
 ).toISOString()
 )
 ) : (
 <span className="text-slate-500">—</span>
 )}
 </span>
 </div>
 </div>

 {/* More details (Site, Devices & Issue) if available */}
 <div className="space-y-4">
 {!(groupedDevices.length > 0) && ticket.site && ticket.site !== "—" && (
 <div>
 <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
 <MapPin className="h-3.5 w-3.5 text-slate-400" />
 Site / Location
 </span>
 <span className="mt-1 block text-sm text-slate-350 bg-slate-950/30 rounded-xl px-3 py-2 border border-slate-800">
 {ticket.site}
 </span>
 </div>
 )}

 {/* Devices Section in Table Format */}
 {groupedDevices.length > 0 && (
 <span className="text-slate-500">—</span>
 )}
 </span>
 </div>
 </div>
 <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/30">
 <table className="w-full text-left text-xs border-collapse">
 <thead>
 <tr className="border-b border-slate-800 bg-slate-900/40">
 <th className="px-4 py-2 font-semibold text-slate-400">Device Name</th>
 <th className="px-4 py-2 font-semibold text-slate-400 text-center">
 <MapPin className="h-3.5 w-3.5 text-slate-400" />
 Site / Location
 </span>
 <span className="mt-1 block text-sm text-slate-350 bg-slate-950/30 rounded-xl px-3 py-2 border border-slate-800">
 {ticket.site}
 </span>
 </div>
 )}

 {/* Devices Section in Table Format */}
 {groupedDevices.length > 0 && (
 <div>
 <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
 <ClipboardList className="h-3.5 w-3.5 text-slate-400" />
 Devices
 </span>
 <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/30">
 <table className="w-full text-left text-xs border-collapse">
 <thead>
 <tr className="border-b border-slate-800 bg-slate-900/40">
 <th className="px-4 py-2 font-semibold text-slate-400">Device Name</th>
 <th className="px-4 py-2 font-semibold text-slate-400 text-center">
 {ticket.jobType === "deployments" ? "Number of Devices" : "Quantity"}
 </th>
 {ticket.jobType !== "deployments" && (
 <th className="px-4 py-2 font-semibold text-slate-400 text-right">Device ID(s)</th>
 )}
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-800/40">
 {groupedDevices.map((d, idx) => (
 <tr key={idx} className="hover:bg-slate-900/20">
 <td className="px-4 py-2.5 font-medium text-slate-200">{d.name}</td>
 <td className="px-4 py-2.5 text-center font-mono text-slate-300 font-semibold">{d.count}</td>
 {ticket.jobType !== "deployments" && (
 <td className="px-4 py-2.5 text-right font-mono text-slate-355 font-semibold select-all">{d.ids}</td>
 )}
 </tr>
 ))}
 </tbody>
 Ticket ID
 </span>
 <span className="mt-1 block font-mono text-sm font-bold text-sky-400">
 {ticket.id}
 </span>
 </div>

 {/* Customer / CP */}
 <div>
 <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
 {ticket.jobType === "services" ||
 ticket.jobType === "maintainance" ||
 ticket.jobType === "deployments" ||
 ticket.jobType === "service_repairs" ||
 ticket.jobType === "schedule_maintenance"
 ? "CP Name"
 : "CP"}
 </span>
 <span className="mt-1 block text-sm font-semibold text-white">
 {ticket.customer}
 </span>
 </div>

 {/* Technician */}
 <div>
 <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
 Technician
 </span>
 <span className="mt-1 block text-sm font-medium text-slate-200">
 {ticket.technician || (
 <span className="text-slate-500 italic">Unassigned</span>
 )}
 </span>
 </div>

 {/* Priority */}
 <div>
 <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
 Priority
 </span>
 <PriorityBadge priority={ticket.priority} />
 </div>

 {/* Status */}
 <div>
 <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
 Status
 </span>
 <StatusBadge status={ticket.status} />
 </div>

 {/* SLA Time */}
 <div>
 <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
 SLA Time
 </span>
 <span
 className={`mt-1 block font-mono text-sm font-bold ${
 ticket.slaOverdue || ticket.slaTime === "OVERDUE"
 ? "text-red-400"
 : ticket.status === "COMPLETED"
 ? "text-emerald-400"
 : "text-rose-400"
 }`}
 >
 {ticket.slaTime}
 </span>
 </div>

 {/* Ticket Created */}
 <div>
 <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
 Ticket Created
 </span>
 <span className="mt-1 block font-mono text-xs font-medium text-slate-300">
 {ticket.createdAt
 ? formatTicketDateTime(ticket.createdAt)
 : ticket.sentAt
 ? formatTicketDateTime(
 new Date(
 new Date(ticket.sentAt).getTime() - 2 * 60 * 60 * 1000
 ).toISOString()
 )
 : formatTicketDateTime(
 new Date(
 new Date().getTime() - 4 * 60 * 60 * 1000
 ).toISOString()
 )}
 </span>
 </div>

 {/* Assign Date */}
 <div>
 <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
 Assign Date
 </span>
 <span className="mt-1 block font-mono text-xs font-medium text-slate-300">
 {ticket.sentAt ? formatTicketDateTime(ticket.sentAt) : <span className="text-slate-500">—</span>}
 </span>
 </div>

 {/* Accepted Date */}
 <div>
 <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
 Accepted Date
 </span>
 <span className="mt-1 block font-mono text-xs font-medium text-slate-300">
 {ticket.respondedAt &&
 ["ACCEPTED", "TRAVELLING", "COMPLETED"].includes(ticket.status) ? (
 formatTicketDateTime(ticket.respondedAt)
 ) : ticket.sentAt &&
 ["ACCEPTED", "TRAVELLING", "COMPLETED"]
 formatTicketDateTime(
 new Date(
 new Date(ticket.sentAt).getTime() + 15 * 60 * 1000
 ).toISOString()
 )
 ) : (
 <span className="text-slate-500">—</span>
 )}
 </span>
 </div>

 {/* Completed Date */}
 <div>
 <div className="flex flex-wrap items-center gap-2 py-1">
 {ticket.status === "ASSIGNED" && (
 <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/60 px-2.5 py-1.5 text-xs font-semibold text-slate-300">
 <Clock className="h-3.5 w-3.5" />
 Assigned
 </span>
 )}
 {(ticket.status === "ACCEPTED" || ticket.status === "TRAVELLING") && (
 <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1.5 text-xs font-semibold text-blue-400">
 <Check className="h-3.5 w-3.5" />
 Accepted
 </span>
 )}
 {ticket.status === "REJECTED" && (
 <span className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs font-semibold text-red-400">
 </div>
 )}

 <button
 {ticket.status === "REVIEW" && (
 <span className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1.5 text-xs font-semibold text-violet-400">
 <MapPin className="h-3.5 w-3.5" />
 Reached
 </span>
 )}
 {ticket.status === "REVIEWED" && (
 <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs font-semibold text-amber-400">
 <CheckCircle className="h-3.5 w-3.5" />
 Reviewed
 </span>
 )}
 {ticket.status === "COMPLETED" && (
 <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-400">
 <CheckCircle className="h-3.5 w-3.5" />
 Completed
 </span>
 )}
 </div>
 )}

 <button
 type="button"
 onClick={onClose}
 className="px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white "
 >
 Close
 </button>
 </div>
 </div>
 <tr className="border-b border-slate-800 bg-slate-900/40">
 <th className="px-4 py-2 font-semibold text-slate-400">Device Name</th>
 <th className="px-4 py-2 font-semibold text-slate-400 text-center">
 {ticket.jobType === "deployments" ? "Number of Devices" : "Quantity"}
 </th>
 {ticket.jobType !== "deployments" && (
 <th className="px-4 py-2 font-semibold text-slate-400 text-right">Device ID(s)</th>
 )}
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-800/40">
 {groupedDevices.map((d, idx) => (
 <tr key={idx} className="hover:bg-slate-900/20">
 <td className="px-4 py-2.5 font-medium text-slate-200">{d.name}</td>
 <td className="px-4 py-2.5 text-center font-mono text-slate-300 font-semibold">{d.count}</td>
 {ticket.jobType !== "deployments" && (
 <td className="px-4 py-2.5 text-right font-mono text-slate-355 font-semibold select-all">{d.ids}</td>
 )}
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {ticket.issue && (
 <div>
 <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
 <AlertCircle className="h-3.5 w-3.5 text-slate-400" />
 Description / Reason for adding
 </span>
 <span className="mt-1 block text-sm text-slate-350 bg-slate-950/30 rounded-xl px-3 py-2 border border-slate-800 whitespace-pre-line">
 {ticket.issue}
 </span>
 </div>
 )}

 {ticket.rejectReason && (
 <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-3.5 py-3">
 <span className="block text-xs font-semibold uppercase tracking-wider text-red-400">
 Rejection Reason
 </span>
 <span className="mt-1 block text-sm text-red-300 font-medium">
 {ticket.rejectReason}
 </span>
 </div>
 )}
 </div>

   {/* Completed Checkbox */}
 <div className="rounded-xl border border-slate-800 bg-slate-950/20 p-4">
 <div className="flex items-center gap-3">
 {currentUser?.name === ticket.technician ? (
 <label className="flex items-center gap-3 cursor-pointer text-slate-200 w-full">
 <input
 type="checkbox"
 className="h-5 w-5 rounded border-slate-850 bg-slate-900 text-sky-500 focus:ring-sky-550 focus:ring-offset-slate-900 focus:ring-2 disabled:opacity-50"
 id="ticket-completed-checkbox"
 checked={ticket.status === "COMPLETED"}

 <button
 type="button"
 onClick={onClose}
 className="px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white "
 >
 Close
 </button>
 </div>
 </div>
 </div>
 </div>
 );
}

 type="checkbox"
 className="h-5 w-5 rounded border-slate-850 bg-slate-900 text-sky-500 focus:ring-sky-550 focus:ring-offset-slate-900 focus:ring-2 opacity-60 cursor-not-allowed"
 id="ticket-completed-checkbox-view"
 checked={ticket.status === "COMPLETED"}
 disabled
 />
 <span className="text-sm font-semibold select-none">
 {ticket.status === "COMPLETED" ? "Completed" : "In Progress"} (View-Only)
 </span>
 </div>
 )}
 </div>
 </div>
 )}

 {/* Ticket Activity Logs */}
 <div className="rounded-xl border border-slate-800 bg-slate-950/10 p-4">
 <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
 <Clock className="h-3.5 w-3.5 text-slate-400" />
 Ticket Logs
 </span>
 {loadingLogs ? (
 <div className="text-xs text-slate-500 italic py-2">Loading ticket history...</div>
 ) : logs.length === 0 ? (
 <div className="text-xs text-slate-500 italic py-2 font-mono">No activity logs recorded yet.</div>
 ) : (
 <div className="relative border-l border-slate-800 pl-4 ml-1.5 space-y-4 max-h-[220px] overflow-y-auto pr-1">
 {logs.map((log) => (
 <div key={log.id} className="relative text-xs">
 {/* Dot on timeline */}
 <div className="absolute -left-[20.5px] top-1.5 h-1.5 w-1.5 rounded-full bg-slate-700" />

 <div className="flex items-center justify-between text-slate-400 font-mono text-[10px] mb-1">
 <span>{formatTicketDateTime(log.timestamp)}</span>
 <span className="font-semibold text-sky-400">{log.action}</span>
 </div>
 <p className="text-slate-350">{log.description}</p>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>

 {/* Footer with Actions */}
 <div className="flex flex-col border-t border-slate-800 bg-slate-950/50 px-6 py-5">
 <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
 Actions
 </span>
 <div className="flex flex-wrap items-center gap-3">
 {ticket.status === "UNASSIGNED" && hasPermission("tickets.assign") && (
 {ticket.status === "UNASSIGNED" && hasPermission("tickets.assign") && (
 <button
 type="button"
 onClick={() => {
 onSend(ticket);
 onClose();
 }}
 className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 shadow-lg shadow-sky-600/20"
 >
 <Send className="h-4 w-4" />
// MISSING LINE 686
// MISSING LINE 687
// MISSING LINE 688
// MISSING LINE 689
// MISSING LINE 690
// MISSING LINE 691
// MISSING LINE 692
// MISSING LINE 693
// MISSING LINE 694
// MISSING LINE 695
// MISSING LINE 696
// MISSING LINE 697
// MISSING LINE 698
// MISSING LINE 699
// MISSING LINE 700
// MISSING LINE 701
// MISSING LINE 702
// MISSING LINE 703
// MISSING LINE 704
// MISSING LINE 705
// MISSING LINE 706
// MISSING LINE 707
// MISSING LINE 708
// MISSING LINE 709
// MISSING LINE 710
// MISSING LINE 711
// MISSING LINE 712
// MISSING LINE 713
// MISSING LINE 714
// MISSING LINE 715
// MISSING LINE 716
// MISSING LINE 717
// MISSING LINE 718
// MISSING LINE 719
 )}
 {ticket.status === "REVIEWED" && (
 <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs font-semibold text-amber-400">
 <CheckCircle className="h-3.5 w-3.5" />
 Reviewed
 </span>
 )}
 {ticket.status === "COMPLETED" && (
 <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-400">
 <CheckCircle className="h-3.5 w-3.5" />
 Completed
 </span>
 )}
 </div>
 )}

 <button
 type="button"
 onClick={onClose}
 className="px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white "
 Start Travel
 </button>
 )}

 {ticket.status === "TRAVELLING" && isAssignedTech && hasPermission("tickets.update") && (
 <button
 type="button"
 onClick={() => {
 onComplete(ticket.id);
 onClose();
 }}
 className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/20 "
 >
 Complete Job
 </button>
 )}

 {["COMPLETED", "ESCALATED"].includes(ticket.status) && !isAdminOrSchemeAdmin && (
 <span className="text-sm text-slate-400 italic py-1">
 No active actions available for this ticket state.
 </span>
 )}

 {/* Visual Workflow Status Indicators for Super Admin / Scheme Admin / Admin */}
 {isAdminOrSchemeAdmin && ticket.status !== "UNASSIGNED" && (
 <div className="flex flex-wrap items-center gap-2 py-1">
 {ticket.status === "ASSIGNED" && (
 <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/60 px-2.5 py-1.5 text-xs font-semibold text-slate-300">
 <Clock className="h-3.5 w-3.5" />
 Assigned
 </span>
 )}
 {(ticket.status === "ACCEPTED" || ticket.status === "TRAVELLING") && (
 <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1.5 text-xs font-semibold text-blue-400">
 <Check className="h-3.5 w-3.5" />
 Accepted
 </span>
 )}
 {ticket.status === "REJECTED" && (
 <span className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs font-semibold text-red-400">
 <X className="h-3.5 w-3.5" />
 Rejected
 </span>
 )}
 {ticket.status === "REVIEW" && (
 <span className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1.5 text-xs font-semibold text-violet-400">
 <MapPin className="h-3.5 w-3.5" />
 Reached
 </span>
 )}
 <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs font-semibold text-amber-400">
 <CheckCircle className="h-3.5 w-3.5" />
 Reviewed
 </span>
 )}
 {ticket.status === "COMPLETED" && (
 <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-400">
 <CheckCircle className="h-3.5 w-3.5" />
 Completed
 </span>
 )}
 </div>
 )}

 <button
 type="button"
 onClick={onClose}
 className="px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white "
 >
 Close
 </button>
 </div>
 </div>
 </div>
 </div>
 );
}

}
