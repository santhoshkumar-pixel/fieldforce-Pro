import Badge, { slaHealthVariant } from "./ui/Badge";

export default function SlaTimer({ remaining, health, showLabel = true }) {
 const label =
 health === "critical"
 ? "Critical"
 : health === "warning"
 ? "Warning"
 : "Healthy";

 return (
 <div className="flex items-center gap-2">
 {showLabel && <Badge variant={slaHealthVariant(health)}>{label}</Badge>}
 <span
 className={`font-mono text-sm tabular-nums ${
 health === "critical"
 ? "text-rose-300"
 : health === "warning"
 ? "text-amber-300"
 : "text-emerald-300"
 }`}
 >
 {remaining}
 </span>
 </div>
 );
}
