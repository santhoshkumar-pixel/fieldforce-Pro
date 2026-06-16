export function nextDeviceId(devices) {
  const nums = devices
    .map((d) => d.id.match(/MCH(\d+)/i))
    .filter(Boolean)
    .map((m) => parseInt(m[1], 10));
  const next = (nums.length ? Math.max(...nums) : 900) + 1;
  return `MCH${next}`;
}

export function buildDeviceHealthStats(devices) {
  const count = (status) =>
    devices.filter((d) =>
      status === "Maintenance"
        ? d.status === "Maintenance Required"
        : d.status === status
    ).length;

  return [
    { label: "Total", value: devices.length, tone: "indigo" },
    { label: "Deployed", value: devices.filter((d) => d.site && d.site.trim() !== "").length, tone: "violet" },
    { label: "Online", value: count("Online"), tone: "emerald" },
    { label: "Offline", value: count("Offline"), tone: "slate" },
    { label: "Warning", value: count("Warning"), tone: "amber" },
    { label: "Critical", value: count("Critical"), tone: "rose" },
    { label: "Maintenance", value: count("Maintenance"), tone: "sky" },
  ];
}
