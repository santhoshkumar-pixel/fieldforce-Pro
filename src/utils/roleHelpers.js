export const unrestrictedRoles = [
  "Super Admin",
  "Operational Manager",
  "Admin",
  "Warehouse Manager",
  "Warehouse",
  "Technical Support",
  "Product Management",
  "Tech Support",
];

export function getZoneRegion(zone) {
  if (!zone) return null;
  const z = zone.toLowerCase();
  if (
    z.includes("goa") ||
    ["north goa", "south goa", "central goa", "all goa"].includes(z) ||
    ["panaji", "mapusa", "margao", "vasco", "ponda", "bicholim"].some((h) => z.includes(h))
  ) {
    return "Goa";
  }
  if (z.includes("bhutan") || z.includes("thimphu") || z.includes("paro")) {
    return "Bhutan";
  }
  return null;
}

export function getUserPlace(user) {
  if (!user || !user.zone) return null;
  // Super Admin and general Admin are unrestricted.
  // Warehouse and Support are also unrestricted for general monitoring.
  // Operational Manager is explicitly RESTRICTED to their assigned zone/region!
  const globallyUnrestricted = [
    "Super Admin",
    "Admin",
    "Warehouse Manager",
    "Warehouse",
    "Technical Support",
    "Product Management",
    "Tech Support",
  ];
  if (globallyUnrestricted.includes(user.role)) return null;

  return getZoneRegion(user.zone);
}

// Helper to determine if a user can view data from a specific zone
export function hasRegionAccess(user, itemZone) {
  if (!user) return false;
  // Super Admin, Admin, and operational support roles can see everything
  const globallyUnrestricted = [
    "Super Admin",
    "Admin",
    "Warehouse Manager",
    "Warehouse",
    "Technical Support",
    "Product Management",
    "Tech Support",
  ];
  if (globallyUnrestricted.includes(user.role)) return true;

  // Operational Manager and Technicians are restricted to their region
  const userRegion = getZoneRegion(user.zone);
  const itemRegion = getZoneRegion(itemZone);
  if (!userRegion || !itemRegion) return false;

  return userRegion === itemRegion;
}
