/** Goa zone coordinates for mock GPS capture */
export const operationalZones = [
  { id: "north", label: "North Goa", lat: 15.5909, lng: 73.8087 },
  { id: "central", label: "Central Goa", lat: 15.4989, lng: 73.8278 },
  { id: "south", label: "South Goa", lat: 15.2993, lng: 74.124 },
];

export const shiftStatuses = {
  OFF_SHIFT: "off_shift",
  ON_SHIFT: "on_shift",
  ON_BREAK: "on_break",
};

function hoursAgo(h) {
  const d = new Date();
  d.setHours(d.getHours() - h);
  return d.toISOString();
}

/** Live technician shift state — admin monitors & simulates punches (demo) */
export const initialTechnicianShifts = [
  {
    id: "U-005",
    name: "Rohit Kumar",
    team: "North Goa Squad",
    zone: "North Goa",
    shiftStatus: shiftStatuses.ON_SHIFT,
    online: true,
    punchInAt: hoursAgo(3.5),
    punchOutAt: null,
    breakStartAt: null,
    totalBreakMs: 15 * 60 * 1000,
    gps: { lat: 15.5812, lng: 73.7421, address: "Mapusa, North Goa" },
  },
  {
    id: "U-006",
    name: "Ayesha Patel",
    team: "Central Goa Squad",
    zone: "Central Goa",
    shiftStatus: shiftStatuses.ON_BREAK,
    online: true,
    punchInAt: hoursAgo(4),
    punchOutAt: null,
    breakStartAt: hoursAgo(0.25),
    totalBreakMs: 20 * 60 * 1000,
    gps: { lat: 15.4901, lng: 73.8199, address: "Panaji, Central Goa" },
  },
  {
    id: "U-003",
    name: "Meera Rao",
    team: "South Goa Squad",
    zone: "South Goa",
    shiftStatus: shiftStatuses.ON_SHIFT,
    online: true,
    punchInAt: hoursAgo(2),
    punchOutAt: null,
    breakStartAt: null,
    totalBreakMs: 0,
    gps: { lat: 15.275, lng: 74.124, address: "Margao, South Goa" },
  },
  {
    id: "U-004",
    name: "Sameer Desai",
    team: "Central Goa Squad",
    zone: "Central Goa",
    shiftStatus: shiftStatuses.OFF_SHIFT,
    online: false,
    punchInAt: null,
    punchOutAt: hoursAgo(1),
    breakStartAt: null,
    totalBreakMs: 30 * 60 * 1000,
    gps: null,
  },
  {
    id: "U-007",
    name: "Vikram Singh",
    team: "South Goa Squad",
    zone: "South Goa",
    shiftStatus: shiftStatuses.OFF_SHIFT,
    online: false,
    punchInAt: null,
    punchOutAt: hoursAgo(5),
    breakStartAt: null,
    totalBreakMs: 45 * 60 * 1000,
    gps: null,
  },
  {
    id: "U-008",
    name: "Aarav Mehta",
    team: "Technical Support",
    zone: "Central Goa",
    shiftStatus: shiftStatuses.OFF_SHIFT,
    online: false,
    punchInAt: null,
    punchOutAt: null,
    breakStartAt: null,
    totalBreakMs: 0,
    gps: null,
  },
];

export const initialAttendanceHistory = [
  {
    id: "ATT-001",
    technicianId: "U-005",
    technicianName: "Rohit Kumar",
    type: "PUNCH_IN",
    timestamp: hoursAgo(3.5),
    gps: { lat: 15.5812, lng: 73.7421, address: "Mapusa, North Goa" },
    zone: "North Goa",
  },
  {
    id: "ATT-002",
    technicianId: "U-006",
    technicianName: "Ayesha Patel",
    type: "PUNCH_IN",
    timestamp: hoursAgo(4),
    gps: { lat: 15.4901, lng: 73.8199, address: "Panaji, Central Goa" },
    zone: "Central Goa",
  },
  {
    id: "ATT-003",
    technicianId: "U-006",
    technicianName: "Ayesha Patel",
    type: "BREAK_START",
    timestamp: hoursAgo(0.25),
    gps: { lat: 15.4901, lng: 73.8199, address: "Patto, Panaji" },
    zone: "Central Goa",
  },
  {
    id: "ATT-004",
    technicianId: "U-005",
    technicianName: "Rohit Kumar",
    type: "BREAK_START",
    timestamp: hoursAgo(2),
    gps: { lat: 15.5812, lng: 73.7421, address: "Mapusa Industrial Estate" },
    zone: "North Goa",
  },
  {
    id: "ATT-005",
    technicianId: "U-005",
    technicianName: "Rohit Kumar",
    type: "BREAK_END",
    timestamp: hoursAgo(1.75),
    gps: { lat: 15.5812, lng: 73.7421, address: "Mapusa Industrial Estate" },
    zone: "North Goa",
  },
  {
    id: "ATT-006",
    technicianId: "U-003",
    technicianName: "Meera Rao",
    type: "PUNCH_IN",
    timestamp: hoursAgo(2),
    gps: { lat: 15.275, lng: 74.124, address: "Margao, South Goa" },
    zone: "South Goa",
  },
  {
    id: "ATT-007",
    technicianId: "U-004",
    technicianName: "Sameer Desai",
    type: "PUNCH_OUT",
    timestamp: hoursAgo(1),
    gps: { lat: 15.4989, lng: 73.8278, address: "Ponda, Central Goa" },
    zone: "Central Goa",
  },
  {
    id: "ATT-008",
    technicianId: "U-004",
    technicianName: "Sameer Desai",
    type: "PUNCH_IN",
    timestamp: hoursAgo(9),
    gps: { lat: 15.4989, lng: 73.8278, address: "Ponda IDC" },
    zone: "Central Goa",
  },
];

export const attendanceEventLabels = {
  PUNCH_IN: "Punch In",
  PUNCH_OUT: "Punch Out",
  BREAK_START: "Break Start",
  BREAK_END: "Break End",
};
