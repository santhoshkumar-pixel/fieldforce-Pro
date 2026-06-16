import clsx from "clsx";

export function Card({ children, className, ...props }) {
 return (
 <div
 className={clsx(
 "rounded-3xl glass-card overflow-hidden",
 className
 )}
 {...props}
 >
 {children}
 </div>
 );
}

export function CardHeader({ title, subtitle, action }) {
 return (
 <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-850 dark:border-slate-800/60 px-5 py-4">
 <div>
 <h3 className="text-lg font-bold text-white tracking-wide">{title}</h3>
 {subtitle && <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{subtitle}</p>}
 </div>
 {action}
 </div>
 );
}

export function CardBody({ children, className }) {
 return <div className={clsx("p-5", className)}>{children}</div>;
}
