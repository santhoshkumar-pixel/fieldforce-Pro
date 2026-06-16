import {
 AlertCircle,
 ArrowUpRight,
 Calendar,
 CheckCircle2,
 Clock,
 Send,
 TrendingUp,
 Users,
} from "lucide-react";
import clsx from "clsx";

const icons = {
 alertCircle: AlertCircle,
 send: Send,
 checkCircle2: CheckCircle2,
 clock: Clock,
 users: Users,
 trendingUp: TrendingUp,
 arrowUp: ArrowUpRight,
 calendar: Calendar,
};

export default function KpiCard({
 label,
 value,
 trend,
 trendUp,
 tone,
 icon,
 onClick,
 active,
}) {
 const Icon = icons[icon] || AlertCircle;

 return (
 <button
 type="button"
 onClick={onClick}
 className={clsx(
 "flex flex-col h-full w-full rounded-3xl border p-4 text-left focus:outline-none focus:ring-2 focus:ring-primary/45 cursor-pointer glass-card transition-all",
 active && "glow-active-sky"
 )}
 >
 <div className="flex items-center justify-between gap-3 w-full">
 <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-primary/20 dark:text-white">
 <Icon className="h-5 w-5" />
 </div>
 <span
 className={clsx(
 "text-xs font-bold",
 trendUp ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
 )}
 >
 {trend}
 </span>
 </div>
 <p className="mt-4 text-2xl font-extrabold tracking-tight leading-none text-slate-100 dark:text-white">{value}</p>
 <p className="mt-auto pt-1.5 text-xs text-slate-500 font-bold uppercase tracking-wider">{label}</p>
 </button>
 );
}
