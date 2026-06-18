import { useState, useEffect } from "react";

export default function SlaTimer({ deadline, status, actionLabel, className = "" }) {
  const [timeLeftStr, setTimeLeftStr] = useState("");
  const [urgency, setUrgency] = useState("healthy"); // healthy, warning, danger, breached

  useEffect(() => {
    // If already met or breached, no timer is needed
    if (status === "MET") {
      setTimeLeftStr("MET");
      setUrgency("healthy");
      return;
    }
    if (status === "BREACHED") {
      setTimeLeftStr("BREACHED");
      setUrgency("breached");
      return;
    }

    if (!deadline) {
      setTimeLeftStr("—");
      setUrgency("healthy");
      return;
    }

    const targetDate = new Date(deadline);

    const updateTimer = () => {
      const now = new Date();
      const diffMs = targetDate.getTime() - now.getTime();

      if (diffMs > 0) {
        // Pending (remaining time)
        const totalSecs = Math.floor(diffMs / 1000);
        const hours = Math.floor(totalSecs / 3600);
        const minutes = Math.floor((totalSecs % 3600) / 60);
        const seconds = totalSecs % 60;

        const pad = (num) => String(num).padStart(2, "0");
        
        let displayStr = "";
        if (hours > 0) {
          displayStr = `${hours}:${pad(minutes)}:${pad(seconds)}`;
        } else {
          displayStr = `${minutes}:${pad(seconds)}`;
        }

        setTimeLeftStr(displayStr);

        // Determine color urgency level based on time left
        if (diffMs < 5 * 60 * 1000) {
          setUrgency("danger"); // < 5 mins
        } else if (diffMs < 15 * 60 * 1000) {
          setUrgency("warning"); // < 15 mins
        } else {
          setUrgency("healthy");
        }
      } else {
        // Overdue (count up elapsed overdue time)
        const elapsedSecs = Math.floor(Math.abs(diffMs) / 1000);
        const hours = Math.floor(elapsedSecs / 3600);
        const minutes = Math.floor((elapsedSecs % 3600) / 60);
        const seconds = elapsedSecs % 60;

        const pad = (num) => String(num).padStart(2, "0");
        
        let displayStr = "";
        if (hours > 0) {
          displayStr = `+${hours}:${pad(minutes)}:${pad(seconds)}`;
        } else {
          displayStr = `+${minutes}:${pad(seconds)}`;
        }

        setTimeLeftStr(`${displayStr} Overdue`);
        setUrgency("breached");
      }
    };

    updateTimer(); // Initial call
    const intervalId = setInterval(updateTimer, 1000);

    return () => clearInterval(intervalId);
  }, [deadline, status]);

  // Color styles mapping
  const styleMap = {
    healthy: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse",
    danger: "bg-orange-500/10 text-orange-400 border-orange-500/20 animate-pulse font-bold",
    breached: "bg-rose-500/10 text-rose-400 border-rose-500/20 font-bold",
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-mono select-none ${styleMap[urgency]} ${className}`}
      title={`${actionLabel} SLA status`}
    >
      <span className="opacity-75 text-[10px] font-sans font-bold uppercase tracking-wider">{actionLabel}:</span>
      <span>{timeLeftStr}</span>
    </div>
  );
}
