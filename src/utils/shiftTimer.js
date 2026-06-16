export function formatDuration(ms) {
  if (ms < 0 || !Number.isFinite(ms)) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export function parseTimestamp(dateStr) {
  if (!dateStr) return 0;
  if (typeof dateStr === "string") {
    // Normalize fractional seconds to max 3 digits (milliseconds) to prevent browser parsing errors
    const normalized = dateStr.replace(/\.(\d{1,3})\d*(Z|[+-]\d{2}:?\d{2})?$/, (match, p1, p2) => {
      return "." + p1 + (p2 || "");
    });
    const t = new Date(normalized).getTime();
    if (!Number.isNaN(t)) return t;
  }
  const t = new Date(dateStr).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/** Active shift time minus accumulated breaks; pauses while on break. If off shift, returns completed shift duration. */
export function computeShiftDuration(tech, now = Date.now()) {
  if (!tech.punchInAt) return 0;
  const punchIn = parseTimestamp(tech.punchInAt);
  if (punchIn === 0) return 0;
  
  if (tech.shiftStatus === "off_shift") {
    if (!tech.punchOutAt) return 0;
    const punchOut = parseTimestamp(tech.punchOutAt);
    return Math.max(0, punchOut - punchIn - (tech.totalBreakMs || 0));
  }
  
  let elapsed = now - punchIn - (tech.totalBreakMs || 0);
  if (tech.shiftStatus === "on_break" && tech.breakStartAt) {
    const breakStart = parseTimestamp(tech.breakStartAt);
    if (breakStart > 0) {
      elapsed -= now - breakStart;
    }
  }
  return Math.max(0, elapsed);
}

export function computeBreakDuration(tech, now = Date.now()) {
  if (tech.shiftStatus !== "on_break" || !tech.breakStartAt) return 0;
  const breakStart = parseTimestamp(tech.breakStartAt);
  return breakStart > 0 ? now - breakStart : 0;
}

export function formatTimestamp(iso) {
  if (!iso) return "—";
  const t = parseTimestamp(iso);
  if (t === 0) return "—";
  return new Date(t).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatGps(gps) {
  if (!gps) return "—";
  return `${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}`;
}
