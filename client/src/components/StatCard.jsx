import clsx from "clsx";

/** Clickable summary stat box (devices, SLA, etc.) */
export default function StatCard({
 label,
 value,
 subtitle,
 tone = "slate",
 icon: Icon,
 onClick,
 active,
}) {
 return (
 <button
 type="button"
 onClick={onClick}
 className={clsx(
 "flex flex-col h-full w-full rounded-3xl border p-5 text-left focus:outline-none focus:ring-2 focus:ring-primary/45 cursor-pointer glass-card transition-all",
 active && "glow-active-sky"
 )}
 >
 <div className="flex items-center justify-between gap-3 w-full">
 <p className="text-sm font-bold tracking-wide text-slate-200 dark:text-slate-200">{label}</p>
 {Icon && (
 <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20 dark:text-white shrink-0">
 <Icon className="h-4.5 w-4.5" />
 </div>
 )}
 </div>
 <p className="mt-3 text-3xl font-extrabold tracking-tight leading-none text-slate-100 dark:text-white">{value}</p>
 {subtitle && <p className="mt-1 text-xs text-slate-500 font-semibold">{subtitle}</p>}
 <p className="mt-auto pt-3 text-xs text-slate-400 dark:text-slate-500">Click to view details</p>
 </button>
 );
}
