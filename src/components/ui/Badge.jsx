import clsx from "clsx";

const variants = {
 default: "bg-slate-800 text-slate-200",
 success: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30", 
 warning: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30",
 danger: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30",
 info: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30",
 muted: "bg-slate-800/80 text-slate-400",
};

export default function Badge({ children, variant = "default", className }) {
 return (
 <span
 className={clsx(
 "badge-pill inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
 variants[variant],
 className
 )}
 >
 {children}
 </span>
 );
}

export function severityVariant(severity) {
 const map = {
 Critical: "danger",
 High: "warning",
 Medium: "info",
 Low: "muted",
 Warning: "warning",
 };
 return map[severity] || "default";
}

export function statusVariant(status) {
 if (["Resolved", "Closed"].includes(status)) return "success";
 if (["Escalated", "Critical"].includes(status)) return "danger";
 if (["Verification Pending", "Waiting for Spare"].includes(status)) return "warning";
 if (["On Site", "Diagnosing", "Repair In Progress"].includes(status)) return "info";
 return "default";
}

export function deviceStatusVariant(status) {
 const map = {
  Online: "success",
  Offline: "muted",
  Warning: "warning",
  Damaged: "danger",
  Lost: "danger",
  Assigned: "info",
  Available: "success",
  };
 return map[status] || "default";
}

export function slaHealthVariant(health) {
 const map = { healthy: "success", warning: "warning", critical: "danger" };
 return map[health] || "default";
}
