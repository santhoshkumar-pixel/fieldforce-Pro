-- Seed Data for FieldForce Database

-- Delete any extra roles to ensure only the specified 6 roles exist
DELETE FROM roles WHERE id NOT IN ('role-admin', 'role-technician', 'role-warehouse', 'role-tech', 'role-product-management');

-- 1. Insert Roles
INSERT INTO roles (id, name, description, users_count) VALUES
('role-admin', 'Operational Manager', 'Operational Manager and full system access', 2)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, users_count = EXCLUDED.users_count;



INSERT INTO roles (id, name, description, users_count) VALUES
('role-technician', 'Field Technician', 'Resolve device issues and update ticket status in the field', 18)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, users_count = EXCLUDED.users_count;

INSERT INTO roles (id, name, description, users_count) VALUES
('role-warehouse', 'Warehouse Manager', 'Manage warehouse inventory, devices, and deployments', 2)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, users_count = EXCLUDED.users_count;

INSERT INTO roles (id, name, description, users_count) VALUES
('role-tech', 'Technician', 'Resolve device issues and perform general technical tasks', 2)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, users_count = EXCLUDED.users_count;

INSERT INTO roles (id, name, description, users_count) VALUES
('role-product-management', 'Product Management', 'View-only access to all dashboards and operations', 0)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, users_count = EXCLUDED.users_count;


-- 2. Insert Role Permissions
-- Operational Manager permissions (wildcard access, restricted by region in UI)
DELETE FROM role_permissions WHERE role_id = 'role-admin';
INSERT INTO role_permissions (role_id, permission) VALUES
('role-admin', '*.*')
ON CONFLICT DO NOTHING;



-- Field Technician permissions
INSERT INTO role_permissions (role_id, permission) VALUES
('role-technician', 'tickets.view'),
('role-technician', 'tickets.update'),
('role-technician', 'devices.view'),
('role-technician', 'evidence.upload'),
('role-technician', 'attendance.view'),
('role-technician', 'training.view')
ON CONFLICT DO NOTHING;

-- Warehouse Manager permissions
INSERT INTO role_permissions (role_id, permission) VALUES
('role-warehouse', 'tickets.*'),
('role-warehouse', 'users.manage'),
('role-warehouse', 'teams.manage'),
('role-warehouse', 'devices.*'),
('role-warehouse', 'sla.*'),
('role-warehouse', 'analytics.*'),
('role-warehouse', 'rbac.manage'),
('role-warehouse', 'rbac.view'),
('role-warehouse', 'inventory.*'),
('role-warehouse', 'attendance.view'),
('role-warehouse', 'training.view')
ON CONFLICT DO NOTHING;

-- Technician permissions
INSERT INTO role_permissions (role_id, permission) VALUES
('role-tech', 'tickets.view'),
('role-tech', 'tickets.update'),
('role-tech', 'devices.view'),
('role-tech', 'attendance.view'),
('role-tech', 'training.view')
ON CONFLICT DO NOTHING;

-- Product Management permissions (view-only)
INSERT INTO role_permissions (role_id, permission) VALUES
('role-product-management', 'tickets.view'),
('role-product-management', 'users.view'),
('role-product-management', 'teams.view'),
('role-product-management', 'devices.view'),
('role-product-management', 'sla.view'),
('role-product-management', 'analytics.view'),
('role-product-management', 'rbac.view'),
('role-product-management', 'inventory.view'),
('role-product-management', 'attendance.view'),
('role-product-management', 'training.view')
ON CONFLICT DO NOTHING;


-- 3. Insert Users
INSERT INTO users (id, name, email, password, role, team, status, zone, mobile) VALUES
('U-001', 'Priya Nair', 'admin@fieldforce.io', 'admin123', 'Operational Manager', 'Operations Control', 'Active', 'Goa', '+91 98765 43210'),
('U-002', 'Deepak Joshi', 'deepak@fieldforce.io', 'password123', 'Operational Manager', 'North Goa Squad', 'Active', 'North Goa', '+91 98765 43211'),
('U-003', 'Meera Rao', 'meera@fieldforce.io', 'password123', 'Field Technician', 'South Goa Squad', 'On Shift', 'South Goa', '+91 98765 43212'),
('U-004', 'Sameer Desai', 'sameer@fieldforce.io', 'password123', 'Field Technician', 'Central Goa Squad', 'On Shift', 'Central Goa', '+91 98765 43213'),
('U-005', 'Rohit Kumar', 'rohit@fieldforce.io', 'password123', 'Field Technician', 'North Goa Squad', 'On Shift', 'North Goa', '+91 98765 43214'),
('U-006', 'Ayesha Patel', 'ayesha@fieldforce.io', 'password123', 'Field Technician', 'Central Goa Squad', 'On Shift', 'Central Goa', '+91 98765 43215'),
('U-007', 'Vikram Singh', 'vikram@fieldforce.io', 'password123', 'Field Technician', 'South Goa Squad', 'Break', 'South Goa', '+91 98765 43216'),
('U-008', 'Anita Fernandes', 'anita@fieldforce.io', 'password123', 'Operational Manager', 'South Goa Squad', 'Active', 'South Goa', '+91 98765 43217'),
('U-009', 'Sanjay Dutt', 'sanjay@fieldforce.io', 'password123', 'Warehouse Manager', 'Goa Warehouse', 'Active', 'Goa', '+91 98765 43218'),
('U-010', 'Rahul Roy', 'rahul@fieldforce.io', 'password123', 'Warehouse Manager', 'Goa Warehouse', 'Active', 'Goa', '+91 98765 43219'),
('U-011', 'Neha Sen', 'neha@fieldforce.io', 'password123', 'Technician', 'Operations Control', 'Active', 'Goa', '+91 98765 43220'),
('U-012', 'Karan Johar', 'karan@fieldforce.io', 'password123', 'Technician', 'Operations Control', 'Active', 'Goa', '+91 98765 43221'),
('U-013', 'Ravi Shankar', 'ravi@fieldforce.io', 'password123', 'Field Technician', 'South Goa Squad', 'Active', 'South Goa', '+91 98765 43222'),
('U-014', 'Mahesh Patil', 'mahesh@fieldforce.io', 'password123', 'Field Technician', 'North Goa Squad', 'Active', 'North Goa', '+91 98765 43223')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, password = EXCLUDED.password, role = EXCLUDED.role, team = EXCLUDED.team, status = EXCLUDED.status, zone = EXCLUDED.zone, mobile = EXCLUDED.mobile;


-- 4. Insert Teams
INSERT INTO teams (id, name, zone, lead, members, open_tickets, sla_compliance, place) VALUES
('T-01', 'North Goa Squad', 'North Goa', 'Deepak Joshi', 8, 34, 94, 'Goa'),
('T-02', 'South Goa Squad', 'South Goa', 'Anita Fernandes', 7, 28, 91, 'Goa'),
('T-03', 'Central Goa Squad', 'Central Goa', 'Rajesh Kamat', 6, 22, 96, 'Goa'),
('T-04', 'Rapid Response', 'All Goa', 'Priya Nair', 4, 12, 88, 'Goa'),
('T-05', 'Thimphu Alpha', 'Thimphu', 'Karma Wangdi', 5, 14, 95, 'Bhutan'),
('T-06', 'Paro Beta', 'Paro', 'Tashi Dorji', 4, 8, 92, 'Bhutan')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, zone = EXCLUDED.zone, lead = EXCLUDED.lead, members = EXCLUDED.members, open_tickets = EXCLUDED.open_tickets, sla_compliance = EXCLUDED.sla_compliance, place = EXCLUDED.place;


-- 5. Insert Devices
INSERT INTO devices (id, name, type, status, firmware, connectivity, battery, last_sync, site) VALUES
('MCH901', 'Pressure Sensor', 'Ace', 'Warning', 'v3.2.1', 'LTE', 78, '1m ago', 'Mapusa Water Plant'),
('MCH874', 'Gateway Unit', 'Mini', 'Offline', 'v2.9.0', 'None', 0, '2h ago', 'Panaji EV Hub'),
('MCH932', 'Connectivity Module', 'FastScan', 'Critical', 'v1.8.7', 'WiFi', 22, '7m ago', 'Vasco CCTV Tower'),
('MCH918', 'Battery Monitor', 'Go', 'Online', 'v3.4.0', 'LTE', 91, '30s ago', 'Margao Solar Grid'),
('MCH902', 'Air Quality Node', 'Ace', 'Online', 'v3.1.0', 'LTE', 85, '2m ago', 'Ponda Industrial Zone'),
('MCH875', 'Flow Controller', 'Mini', 'Maintenance Required', 'v2.4.2', 'LoRa', 45, '15m ago', 'Bicholim Treatment Plant'),
('MCH711', 'Vibration Sensor', 'Ace', 'Online', 'v3.0.1', 'WiFi', 89, '3m ago', ''),
('MCH712', 'Thermal Sensor', 'Mini', 'Warning', 'v2.5.0', 'LTE', 67, '5m ago', ''),
('MCH713', 'Flow Sensor', 'FastScan', 'Online', 'v1.9.0', 'LTE', 94, '10s ago', ''),
('MCH714', 'Humidity Sensor', 'Go', 'Critical', 'v3.2.0', 'LoRa', 15, '12m ago', ''),
('MCH715', 'Power Meter', 'Ace', 'Online', 'v3.1.2', 'WiFi', 82, '4m ago', 'São Paulo Solar Hub'),
('MCH716', 'Network Gateway', 'FastScan', 'Online', 'v1.9.2', 'LTE', 90, '1m ago', 'London Operations Center'),
('MCH720', 'Pressure Sensor', 'Ace', 'Online', 'v3.0.0', 'LTE', 100, 'never', ''),
('MCH721', 'Pressure Sensor', 'Ace', 'Online', 'v3.0.0', 'LTE', 100, 'never', ''),
('MCH722', 'Pressure Sensor', 'Ace', 'Online', 'v3.0.0', 'LTE', 100, 'never', ''),
('MCH723', 'Pressure Sensor', 'Ace', 'Online', 'v3.0.0', 'LTE', 100, 'never', ''),
('MCH724', 'Pressure Sensor', 'Ace', 'Online', 'v3.0.0', 'LTE', 100, 'never', ''),
('MCH725', 'Pressure Sensor', 'Ace', 'Online', 'v3.0.0', 'LTE', 100, 'never', ''),
('MCH726', 'Pressure Sensor', 'Ace', 'Online', 'v3.0.0', 'LTE', 100, 'never', ''),
('MCH727', 'Pressure Sensor', 'Ace', 'Online', 'v3.0.0', 'LTE', 100, 'never', ''),
('MCH728', 'Pressure Sensor', 'Ace', 'Online', 'v3.0.0', 'LTE', 100, 'never', ''),
('MCH729', 'Pressure Sensor', 'Ace', 'Online', 'v3.0.0', 'LTE', 100, 'never', ''),
('MCH730', 'Pressure Sensor', 'Ace', 'Online', 'v3.0.0', 'LTE', 100, 'never', ''),
('MCH731', 'Pressure Sensor', 'Ace', 'Online', 'v3.0.0', 'LTE', 100, 'never', ''),
('MCH732', 'Pressure Sensor', 'Ace', 'Online', 'v3.0.0', 'LTE', 100, 'never', ''),
('MCH733', 'Pressure Sensor', 'Ace', 'Online', 'v3.0.0', 'LTE', 100, 'never', ''),
('MCH734', 'Pressure Sensor', 'Ace', 'Online', 'v3.0.0', 'LTE', 100, 'never', ''),
('MCH740', 'Gateway Unit', 'Mini', 'Online', 'v2.0.0', 'None', 100, 'never', ''),
('MCH741', 'Gateway Unit', 'Mini', 'Online', 'v2.0.0', 'None', 100, 'never', ''),
('MCH742', 'Gateway Unit', 'Mini', 'Online', 'v2.0.0', 'None', 100, 'never', ''),
('MCH743', 'Gateway Unit', 'Mini', 'Online', 'v2.0.0', 'None', 100, 'never', ''),
('MCH744', 'Gateway Unit', 'Mini', 'Online', 'v2.0.0', 'None', 100, 'never', ''),
('MCH745', 'Gateway Unit', 'Mini', 'Online', 'v2.0.0', 'None', 100, 'never', ''),
('MCH746', 'Gateway Unit', 'Mini', 'Online', 'v2.0.0', 'None', 100, 'never', ''),
('MCH747', 'Gateway Unit', 'Mini', 'Online', 'v2.0.0', 'None', 100, 'never', ''),
('MCH748', 'Gateway Unit', 'Mini', 'Online', 'v2.0.0', 'None', 100, 'never', ''),
('MCH749', 'Gateway Unit', 'Mini', 'Online', 'v2.0.0', 'None', 100, 'never', ''),
('MCH750', 'Gateway Unit', 'Mini', 'Online', 'v2.0.0', 'None', 100, 'never', ''),
('MCH751', 'Gateway Unit', 'Mini', 'Online', 'v2.0.0', 'None', 100, 'never', ''),
('MCH752', 'Gateway Unit', 'Mini', 'Online', 'v2.0.0', 'None', 100, 'never', ''),
('MCH753', 'Gateway Unit', 'Mini', 'Online', 'v2.0.0', 'None', 100, 'never', ''),
('MCH754', 'Gateway Unit', 'Mini', 'Online', 'v2.0.0', 'None', 100, 'never', ''),
('MCH760', 'Connectivity Module', 'FastScan', 'Online', 'v1.5.0', 'WiFi', 100, 'never', ''),
('MCH761', 'Connectivity Module', 'FastScan', 'Online', 'v1.5.0', 'WiFi', 100, 'never', ''),
('MCH762', 'Connectivity Module', 'FastScan', 'Online', 'v1.5.0', 'WiFi', 100, 'never', ''),
('MCH763', 'Connectivity Module', 'FastScan', 'Online', 'v1.5.0', 'WiFi', 100, 'never', ''),
('MCH764', 'Connectivity Module', 'FastScan', 'Online', 'v1.5.0', 'WiFi', 100, 'never', ''),
('MCH765', 'Connectivity Module', 'FastScan', 'Online', 'v1.5.0', 'WiFi', 100, 'never', ''),
('MCH766', 'Connectivity Module', 'FastScan', 'Online', 'v1.5.0', 'WiFi', 100, 'never', ''),
('MCH767', 'Connectivity Module', 'FastScan', 'Online', 'v1.5.0', 'WiFi', 100, 'never', ''),
('MCH768', 'Connectivity Module', 'FastScan', 'Online', 'v1.5.0', 'WiFi', 100, 'never', ''),
('MCH769', 'Connectivity Module', 'FastScan', 'Online', 'v1.5.0', 'WiFi', 100, 'never', ''),
('MCH770', 'Connectivity Module', 'FastScan', 'Online', 'v1.5.0', 'WiFi', 100, 'never', ''),
('MCH771', 'Connectivity Module', 'FastScan', 'Online', 'v1.5.0', 'WiFi', 100, 'never', ''),
('MCH772', 'Connectivity Module', 'FastScan', 'Online', 'v1.5.0', 'WiFi', 100, 'never', ''),
('MCH773', 'Connectivity Module', 'FastScan', 'Online', 'v1.5.0', 'WiFi', 100, 'never', ''),
('MCH774', 'Connectivity Module', 'FastScan', 'Online', 'v1.5.0', 'WiFi', 100, 'never', ''),
('MCH780', 'Battery Monitor', 'Go', 'Online', 'v3.0.0', 'LTE', 100, 'never', ''),
('MCH781', 'Battery Monitor', 'Go', 'Online', 'v3.0.0', 'LTE', 100, 'never', ''),
('MCH782', 'Battery Monitor', 'Go', 'Online', 'v3.0.0', 'LTE', 100, 'never', ''),
('MCH783', 'Battery Monitor', 'Go', 'Online', 'v3.0.0', 'LTE', 100, 'never', ''),
('MCH784', 'Battery Monitor', 'Go', 'Online', 'v3.0.0', 'LTE', 100, 'never', ''),
('MCH785', 'Battery Monitor', 'Go', 'Online', 'v3.0.0', 'LTE', 100, 'never', ''),
('MCH786', 'Battery Monitor', 'Go', 'Online', 'v3.0.0', 'LTE', 100, 'never', ''),
('MCH787', 'Battery Monitor', 'Go', 'Online', 'v3.0.0', 'LTE', 100, 'never', ''),
('MCH788', 'Battery Monitor', 'Go', 'Online', 'v3.0.0', 'LTE', 100, 'never', ''),
('MCH789', 'Battery Monitor', 'Go', 'Online', 'v3.0.0', 'LTE', 100, 'never', ''),
('MCH790', 'Battery Monitor', 'Go', 'Online', 'v3.0.0', 'LTE', 100, 'never', ''),
('MCH791', 'Battery Monitor', 'Go', 'Online', 'v3.0.0', 'LTE', 100, 'never', ''),
('MCH792', 'Battery Monitor', 'Go', 'Online', 'v3.0.0', 'LTE', 100, 'never', ''),
('MCH793', 'Battery Monitor', 'Go', 'Online', 'v3.0.0', 'LTE', 100, 'never', ''),
('MCH794', 'Battery Monitor', 'Go', 'Online', 'v3.0.0', 'LTE', 100, 'never', ''),
('MCH951', 'Thimphu GPS tracker', 'Go', 'Online', 'v3.0.0', 'LTE', 85, '5m ago', 'Thimphu Alpha'),
('MCH952', 'Thimphu Temp Sensor', 'Ace', 'Warning', 'v3.1.0', 'WiFi', 70, '12m ago', 'Thimphu Alpha'),
('MCH953', 'Paro Gate Camera', 'Mini', 'Online', 'v2.5.0', 'LTE', 90, '1m ago', 'Paro Beta'),
('MCH954', 'Paro Vibration Sensor', 'Ace', 'Offline', 'v3.0.1', 'None', 0, '2h ago', 'Paro Beta'),
('MCH955', 'Thimphu Gateway Unit', 'Mini', 'Online', 'v2.0.0', 'LoRa', 100, 'never', 'Thimphu Alpha'),
('MCH956', 'Paro Connectivity Module', 'FastScan', 'Critical', 'v1.8.0', 'WiFi', 15, '1m ago', 'Paro Beta')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, status = EXCLUDED.status, firmware = EXCLUDED.firmware, connectivity = EXCLUDED.connectivity, battery = EXCLUDED.battery, last_sync = EXCLUDED.last_sync, site = EXCLUDED.site;


-- 6. Insert Tickets (from dispatchTickets.js and mockData.js)
INSERT INTO tickets (id, customer, site, technician, priority, issue, status, sla_time, sla_overdue, sent_at, responded_at, created_at, completed_at, reject_reason, job_type, device_id, device_name, accepted_at, reached_site_at, resolved_at, ack_deadline, response_deadline, resolution_deadline, ack_sla_status, response_sla_status, resolution_sla_status) VALUES
('TK-1001', 'Mapusa Water Board', 'Mapusa Water Plant', 'Mahesh Patil', 'CRITICAL', 'Sensor drift detected on Pressure Sensor MCH901. Requires recalibration.', 'COMPLETED', '02:57', false, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '4.8 hours', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '2 hours', 'Device not available', 'service_repairs', 'MCH901', 'Pressure Sensor', NOW() - INTERVAL '6 hours' + INTERVAL '2 minutes', NOW() - INTERVAL '6 hours' + INTERVAL '15 minutes', NOW() - INTERVAL '6 hours' + INTERVAL '1 hour', NOW() - INTERVAL '6 hours' + INTERVAL '5 minutes', NOW() - INTERVAL '6 hours' + INTERVAL '30 minutes', NOW() - INTERVAL '6 hours' + INTERVAL '2 hours', 'MET', 'MET', 'MET'),
('TK-1002', 'Panaji EV Hub', 'Patto Plaza, Panaji', 'Ayesha Patel', 'HIGH', 'Gateway unit offline since 04:45 AM. Diagnostics show link failure.', 'TRAVELLING', '05:09', false, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '4.8 hours', NOW() - INTERVAL '5.5 hours', NULL, NULL, 'service_repairs', 'MCH874', 'Gateway Unit', NOW() - INTERVAL '5.5 hours' + INTERVAL '5 minutes', NULL, NULL, NOW() - INTERVAL '5.5 hours' + INTERVAL '15 minutes', NOW() - INTERVAL '5.5 hours' + INTERVAL '1 hour', NOW() - INTERVAL '5.5 hours' + INTERVAL '4 hours', 'MET', 'OVERDUE', 'OVERDUE'),
('TK-1003', 'Vasco CCTV Network', 'Dabolim Rd, Vasco', 'Vikram Singh', 'HIGH', 'Significant packet loss on telemetry channel. Check cabling and antennas.', 'UNASSIGNED', '—', false, NULL, NULL, NOW() - INTERVAL '6 hours', NULL, NULL, 'preventative_maintenance', 'MCH932', 'Connectivity Module', NULL, NULL, NULL, NOW() - INTERVAL '6 hours' + INTERVAL '15 minutes', NOW() - INTERVAL '6 hours' + INTERVAL '1 hour', NOW() - INTERVAL '6 hours' + INTERVAL '4 hours', 'OVERDUE', 'OVERDUE', 'OVERDUE'),
('TK-1004', 'Margao Solar Grid', 'Fatorda, Margao', 'Meera Rao', 'MEDIUM', 'Battery monitor reporting voltage spikes above threshold.', 'COMPLETED', '02:57', false, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '5.8 hours', NOW() - INTERVAL '7 hours', NOW() - INTERVAL '3.8 hours', NULL, 'service_repairs', 'MCH918', 'Battery Monitor', NOW() - INTERVAL '7 hours' + INTERVAL '15 minutes', NOW() - INTERVAL '7 hours' + INTERVAL '1.5 hours', NOW() - INTERVAL '7 hours' + INTERVAL '7.5 hours', NOW() - INTERVAL '7 hours' + INTERVAL '30 minutes', NOW() - INTERVAL '7 hours' + INTERVAL '2 hours', NOW() - INTERVAL '7 hours' + INTERVAL '8 hours', 'MET', 'MET', 'MET'),
('TK-1005', 'Bicholim Treatment', 'Bicholim, North Goa', 'Unassigned', 'CRITICAL', 'Flow controller valve stuck at 45% capacity. Manual intervention needed.', 'UNASSIGNED', '—', false, NULL, NULL, NOW() - INTERVAL '2 hours', NULL, NULL, 'service_repairs', 'MCH875', 'Flow Controller', NULL, NULL, NULL, NOW() - INTERVAL '2 hours' + INTERVAL '5 minutes', NOW() - INTERVAL '2 hours' + INTERVAL '30 minutes', NOW() - INTERVAL '2 hours' + INTERVAL '2 hours', 'OVERDUE', 'OVERDUE', 'OVERDUE'),
('TK-1006', 'Thimphu City Council', 'Thimphu Plaza', 'Meera Rao', 'CRITICAL', 'Water main gateway node connectivity failure.', 'ASSIGNED', '—', false, NOW() - INTERVAL '2 minutes', NULL, NOW() - INTERVAL '2 minutes', NULL, NULL, 'service_repairs', 'MCH951', 'Thimphu GPS tracker', NULL, NULL, NULL, NOW() - INTERVAL '2 minutes' + INTERVAL '5 minutes', NOW() - INTERVAL '2 minutes' + INTERVAL '30 minutes', NOW() - INTERVAL '2 minutes' + INTERVAL '2 hours', 'PENDING', 'PENDING', 'PENDING'),
('TK-1007', 'Paro Airport', 'Paro Airport Cargo', 'Rohit Kumar', 'HIGH', 'Gate CCTV camera lens fogged and obscured.', 'ACCEPTED', '—', false, NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '5 minutes', NOW() - INTERVAL '10 minutes', NULL, NULL, 'preventative_maintenance', 'MCH953', 'Paro Gate Camera', NOW() - INTERVAL '10 minutes' + INTERVAL '5 minutes', NULL, NULL, NOW() - INTERVAL '10 minutes' + INTERVAL '15 minutes', NOW() - INTERVAL '10 minutes' + INTERVAL '1 hour', NOW() - INTERVAL '10 minutes' + INTERVAL '4 hours', 'MET', 'PENDING', 'PENDING')
ON CONFLICT (id) DO UPDATE SET customer = EXCLUDED.customer, site = EXCLUDED.site, technician = EXCLUDED.technician, priority = EXCLUDED.priority, issue = EXCLUDED.issue, status = EXCLUDED.status, sla_time = EXCLUDED.sla_time, sla_overdue = EXCLUDED.sla_overdue, sent_at = EXCLUDED.sent_at, responded_at = EXCLUDED.responded_at, created_at = EXCLUDED.created_at, completed_at = EXCLUDED.completed_at, reject_reason = EXCLUDED.reject_reason, job_type = EXCLUDED.job_type, device_id = EXCLUDED.device_id, device_name = EXCLUDED.device_name, accepted_at = EXCLUDED.accepted_at, reached_site_at = EXCLUDED.reached_site_at, resolved_at = EXCLUDED.resolved_at, ack_deadline = EXCLUDED.ack_deadline, response_deadline = EXCLUDED.response_deadline, resolution_deadline = EXCLUDED.resolution_deadline, ack_sla_status = EXCLUDED.ack_sla_status, response_sla_status = EXCLUDED.response_sla_status, resolution_sla_status = EXCLUDED.resolution_sla_status;


-- 7. Insert Attendance Shifts (initialTechnicianShifts)
INSERT INTO attendance_shifts (user_id, name, team, zone, shift_status, online, punch_in_at, punch_out_at, break_start_at, total_break_ms, gps_lat, gps_lng, gps_address) VALUES
('U-005', 'Rohit Kumar', 'North Goa Squad', 'North Goa', 'on_shift', true, NOW() - INTERVAL '3.5 hours', NULL, NULL, 900000, 15.5812, 73.7421, 'Mapusa, North Goa'),
('U-006', 'Ayesha Patel', 'Central Goa Squad', 'Central Goa', 'on_break', true, NOW() - INTERVAL '4 hours', NULL, NOW() - INTERVAL '15 minutes', 1200000, 15.4901, 73.8199, 'Panaji, Central Goa'),
('U-003', 'Meera Rao', 'South Goa Squad', 'South Goa', 'on_shift', true, NOW() - INTERVAL '2 hours', NULL, NULL, 0, 15.2750, 74.1240, 'Margao, South Goa'),
('U-004', 'Sameer Desai', 'Central Goa Squad', 'Central Goa', 'off_shift', false, NULL, NOW() - INTERVAL '1 hour', NULL, 1800000, NULL, NULL, NULL),
('U-007', 'Vikram Singh', 'South Goa Squad', 'South Goa', 'off_shift', false, NULL, NOW() - INTERVAL '5 hours', NULL, 2700000, NULL, NULL, NULL)
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, team = EXCLUDED.team, zone = EXCLUDED.zone, shift_status = EXCLUDED.shift_status, online = EXCLUDED.online, punch_in_at = EXCLUDED.punch_in_at, punch_out_at = EXCLUDED.punch_out_at, break_start_at = EXCLUDED.break_start_at, total_break_ms = EXCLUDED.total_break_ms, gps_lat = EXCLUDED.gps_lat, gps_lng = EXCLUDED.gps_lng, gps_address = EXCLUDED.gps_address;


-- 8. Insert Attendance Events
INSERT INTO attendance_events (id, technician_id, technician_name, type, timestamp, gps_lat, gps_lng, gps_address, zone) VALUES
('ATT-001', 'U-005', 'Rohit Kumar', 'PUNCH_IN', NOW() - INTERVAL '3.5 hours', 15.5812, 73.7421, 'Mapusa, North Goa', 'North Goa'),
('ATT-002', 'U-006', 'Ayesha Patel', 'PUNCH_IN', NOW() - INTERVAL '4 hours', 15.4901, 73.8199, 'Panaji, Central Goa', 'Central Goa'),
('ATT-003', 'U-006', 'Ayesha Patel', 'BREAK_START', NOW() - INTERVAL '15 minutes', 15.4901, 73.8199, 'Patto, Panaji', 'Central Goa'),
('ATT-004', 'U-005', 'Rohit Kumar', 'BREAK_START', NOW() - INTERVAL '2 hours', 15.5812, 73.7421, 'Mapusa Industrial Estate', 'North Goa'),
('ATT-005', 'U-005', 'Rohit Kumar', 'BREAK_END', NOW() - INTERVAL '1.75 hours', 15.5812, 73.7421, 'Mapusa Industrial Estate', 'North Goa'),
('ATT-006', 'U-003', 'Meera Rao', 'PUNCH_IN', NOW() - INTERVAL '2 hours', 15.2750, 74.1240, 'Margao, South Goa', 'South Goa'),
('ATT-007', 'U-004', 'Sameer Desai', 'PUNCH_OUT', NOW() - INTERVAL '1 hour', 15.4989, 73.8278, 'Ponda, Central Goa', 'Central Goa'),
('ATT-008', 'U-004', 'Sameer Desai', 'PUNCH_IN', NOW() - INTERVAL '9 hours', 15.4989, 73.8278, 'Ponda IDC', 'Central Goa')
ON CONFLICT (id) DO NOTHING;


-- 9. Insert Notifications
INSERT INTO notifications (id, title, time_label, type, unread, created_at) VALUES
('N-001', 'New ticket TK-1005 escalated — Bicholim Plant', '2m ago', 'escalation', true, NOW() - INTERVAL '2 minutes'),
('N-002', 'SLA warning on TK-1002 — 5h remaining', '10m ago', 'sla', true, NOW() - INTERVAL '10 minutes'),
('N-003', 'Device MCH932 went offline at Vasco Tower', '32m ago', 'device', true, NOW() - INTERVAL '32 minutes'),
('N-004', 'North Goa squad completed 8 tickets today', '1h ago', 'info', false, NOW() - INTERVAL '1 hour'),
('N-005', 'Operational Manager approval required for TK-1004 override', '2h ago', 'alert', false, NOW() - INTERVAL '2 hours'),
('N-006', 'Firmware sync failed on 3 devices in Ponda zone', '3h ago', 'device', false, NOW() - INTERVAL '3 hours')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, time_label = EXCLUDED.time_label, type = EXCLUDED.type, unread = EXCLUDED.unread, created_at = EXCLUDED.created_at;

-- 10. Insert Training Materials
INSERT INTO training_materials (id, title, description, type, targeted_role, content, file_name, file_path) VALUES
('TM-001', 'Field Safety & Compliance Guide', 'Standard safety regulations and compliance guidelines for on-site field technicians.', 'TEXT', 'Field Technician', '### 1. General Safety Overview\nAlways wear appropriate Personal Protective Equipment (PPE) including hard hats, steel-toed boots, and high-visibility vests when visiting operational zones.\n\n### 2. Hazard Communication\nEnsure to double check voltage and pressure readings before operating any gateway or sensor unit. Report all structural anomalies immediately.', NULL, NULL),
('TM-002', 'FieldForce Platform Introduction', 'Watch this video to understand the features and navigation of the FieldForce Control Center.', 'VIDEO', 'ALL', 'This training video covers the dashboard telemetry, active ticket views, map navigation, and dispatch commands.', 'FieldForce Intro Video', 'https://www.w3schools.com/html/mov_bbb.mp4'),
('TM-003', 'Inventory Management Standard Operating Procedures', 'Standard operating procedures (SOP) for managing stock transitions, registration, and field deployments.', 'FILE', 'Warehouse Manager', 'SOP guide document for incoming stock and QA checks.', 'Warehouse_SOP_v1.2.pdf', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf')
ON CONFLICT (id) DO NOTHING;

-- Update specific devices with Shed ID and Status Duration Days
UPDATE devices SET shed_id = 'SHED-M01', status_duration_days = 15 WHERE id = 'MCH901';
UPDATE devices SET shed_id = 'SHED-P02', status_duration_days = 3 WHERE id = 'MCH874';
UPDATE devices SET shed_id = 'SHED-V03', status_duration_days = 1 WHERE id = 'MCH932';
UPDATE devices SET shed_id = 'SHED-S04', status_duration_days = 10 WHERE id = 'MCH918';
UPDATE devices SET shed_id = 'SHED-I05', status_duration_days = 20 WHERE id = 'MCH902';
UPDATE devices SET shed_id = 'SHED-B06', status_duration_days = 5 WHERE id = 'MCH875';
UPDATE devices SET shed_id = 'SHED-T07', status_duration_days = 12 WHERE id = 'MCH711';
UPDATE devices SET shed_id = 'SHED-T08', status_duration_days = 4 WHERE id = 'MCH712';
UPDATE devices SET shed_id = 'SHED-T09', status_duration_days = 8 WHERE id = 'MCH713';
UPDATE devices SET shed_id = 'SHED-T10', status_duration_days = 2 WHERE id = 'MCH714';
UPDATE devices SET shed_id = 'SHED-H11', status_duration_days = 25 WHERE id = 'MCH715';
UPDATE devices SET shed_id = 'SHED-L12', status_duration_days = 14 WHERE id = 'MCH716';

-- 11. Insert Technician Activity Logs for TK-1001 (reassignment scenario)
INSERT INTO technician_activity_log (user_id, ticket_id, action, description, timestamp, lat, lng, performed_by) VALUES
('U-013', 'TK-1001', 'ASSIGNED', 'Assigned to Ravi Shankar by Admin', NOW() - INTERVAL '5.5 hours', 15.275, 74.124, 'Ravi Shankar'),
('U-013', 'TK-1001', 'TRAVELLING', 'Technician Ravi Shankar started travel route to site.', NOW() - INTERVAL '5.2 hours', 15.275, 74.124, 'Ravi Shankar'),
('U-013', 'TK-1001', 'REVIEW', 'Status Changed → Reached', NOW() - INTERVAL '5 hours', 15.275, 74.124, 'Ravi Shankar'),
('U-013', 'TK-1001', 'REVIEWED', 'Status Changed → Reviewed', NOW() - INTERVAL '4.8 hours', 15.275, 74.124, 'Admin'),
('U-013', 'TK-1001', 'REJECTED', 'Rejected by Ravi Shankar
Reason:
Device not available', NOW() - INTERVAL '4.5 hours', 15.275, 74.124, 'Ravi Shankar'),
('U-014', 'TK-1001', 'REASSIGNED', 'Ticket reassigned from Ravi Shankar to Mahesh Patil by Admin', NOW() - INTERVAL '4.2 hours', 15.5812, 73.7421, 'Mahesh Patil'),
('U-013', 'TK-1001', 'REASSIGNED', 'Ticket reassigned from Ravi Shankar to Mahesh Patil by Admin', NOW() - INTERVAL '4.2 hours', 15.275, 74.124, 'Mahesh Patil'),
('U-014', 'TK-1001', 'ACCEPTED', 'Technician Mahesh Patil accepted job assignment.', NOW() - INTERVAL '4.0 hours', 15.5812, 73.7421, 'Mahesh Patil'),
('U-014', 'TK-1001', 'TRAVELLING', 'Technician Mahesh Patil started travel route to site.', NOW() - INTERVAL '3.8 hours', 15.5812, 73.7421, 'Mahesh Patil'),
('U-014', 'TK-1001', 'REVIEW', 'Status Changed → Reached', NOW() - INTERVAL '3.5 hours', 15.5812, 73.7421, 'Mahesh Patil'),
('U-014', 'TK-1001', 'REVIEWED', 'Status Changed → Reviewed', NOW() - INTERVAL '3.0 hours', 15.5812, 73.7421, 'Admin'),
('U-014', 'TK-1001', 'COMPLETED', 'Ticket Marked as Completed by Mahesh Patil', NOW() - INTERVAL '2.0 hours', 15.5812, 73.7421, 'Mahesh Patil');


