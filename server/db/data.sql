-- Seed Data for FieldForce Database

-- Delete any extra roles to ensure only the specified 7 roles exist
DELETE FROM roles WHERE id NOT IN ('role-super-admin', 'role-admin', 'role-technician', 'role-warehouse', 'role-tech', 'role-product-management', 'role-tech-support');

-- Seed Permissions
DELETE FROM permissions;
INSERT INTO permissions (id, name, description) VALUES
('tickets.view', 'View Tickets', 'Ability to view tickets list and details'),
('tickets.assign', 'Assign Tickets', 'Ability to assign tickets to technicians'),
('tickets.update', 'Update Tickets', 'Ability to update ticket status and details'),
('tickets.escalate', 'Escalate Tickets', 'Ability to escalate tickets to warehouse'),
('tickets.override', 'Override Tickets', 'Ability to override SLA and details'),
('users.view', 'View Users', 'Ability to view user profiles'),
('users.manage', 'Manage Users', 'Ability to create, update, and toggle user active/inactive status'),
('teams.view', 'View Schemes/Teams', 'Ability to view teams list'),
('teams.manage', 'Manage Schemes/Teams', 'Ability to create and update teams'),
('devices.view', 'View Devices', 'Ability to view device lists'),
('devices.monitor', 'Monitor Devices', 'Ability to view live logs and telemetry from devices'),
('devices.configure', 'Configure Devices', 'Ability to trigger firmware sync and edit device configs'),
('sla.view', 'View SLA Monitor', 'Ability to view SLA adherence dashboard'),
('sla.configure', 'Configure SLA Rules', 'Ability to update global SLA thresholds'),
('analytics.view', 'View Analytics', 'Ability to view operational reports'),
('analytics.export', 'Export Analytics', 'Ability to download PDF/CSV reports'),
('rbac.view', 'View RBAC Settings', 'Ability to view role permissions config'),
('rbac.manage', 'Manage RBAC Permissions', 'Ability to change role mapping and save'),
('inventory.view', 'View Warehouse Inventory', 'Ability to view parts stock list'),
('inventory.manage', 'Manage Warehouse Stock', 'Ability to adjust quantity, request stock, and process replacement request'),
('attendance.view', 'View Attendance Logs', 'Ability to view shift punch list'),
('attendance.manage', 'Manage Shifts/Schedule', 'Ability to override status and trigger break resets'),
('training.view', 'View Training Materials', 'Ability to read documents and take quizzes'),
('training.manage', 'Upload Training Content', 'Ability to add and remove files')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- 1. Insert Roles
INSERT INTO roles (id, name, description, users_count) VALUES
('role-super-admin', 'Super Admin', 'Super Admin and full system access', 1)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, users_count = EXCLUDED.users_count;

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

INSERT INTO roles (id, name, description, users_count) VALUES
('role-tech-support', 'Tech Support', 'Resolve escalated technical support issues', 1)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, users_count = EXCLUDED.users_count;


-- 2. Insert Role Permissions
-- Super Admin permissions
DELETE FROM role_permissions WHERE role_id = 'role-super-admin';
INSERT INTO role_permissions (role_id, permission) VALUES
('role-super-admin', '*.*')
ON CONFLICT DO NOTHING;

-- Operational Manager permissions (wildcard access, restricted by region in UI)
DELETE FROM role_permissions WHERE role_id = 'role-admin';
INSERT INTO role_permissions (role_id, permission) VALUES
('role-admin', '*.*')
ON CONFLICT DO NOTHING;


-- Field Technician permissions
DELETE FROM role_permissions WHERE role_id = 'role-technician';
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

-- Tech Support permissions
DELETE FROM role_permissions WHERE role_id = 'role-tech-support';
INSERT INTO role_permissions (role_id, permission) VALUES
('role-tech-support', 'tickets.view'),
('role-tech-support', 'tickets.update'),
('role-tech-support', 'devices.view'),
('role-tech-support', 'evidence.upload'),
('role-tech-support', 'attendance.view'),
('role-tech-support', 'training.view')
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
('U-014', 'Mahesh Patil', 'mahesh@fieldforce.io', 'password123', 'Field Technician', 'North Goa Squad', 'Active', 'North Goa', '+91 98765 43223'),
('U-015', 'Aarav Mehta', 'aarav@fieldforce.io', 'password123', 'Tech Support', 'Operations Control', 'Active', 'Goa', '+91 98765 43100')
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
('MCH720', 'Pressure Sensor', 'Ace', 'Online', 'v3.0.0', 'LTE', 100, 'never', 'Goa Warehouse'),
('MCH721', 'Pressure Sensor', 'Ace', 'Online', 'v3.0.0', 'LTE', 100, 'never', 'Goa Warehouse'),
('MCH722', 'Pressure Sensor', 'Ace', 'Online', 'v3.0.0', 'LTE', 100, 'never', 'Goa Warehouse'),
('MCH723', 'Pressure Sensor', 'Ace', 'Online', 'v3.0.0', 'LTE', 100, 'never', 'Goa Warehouse'),
('MCH724', 'Pressure Sensor', 'Ace', 'Online', 'v3.0.0', 'LTE', 100, 'never', 'Goa Warehouse'),
('MCH725', 'Pressure Sensor', 'Ace', 'Online', 'v3.0.0', 'LTE', 100, 'never', 'Goa Warehouse'),
('MCH726', 'Pressure Sensor', 'Ace', 'Online', 'v3.0.0', 'LTE', 100, 'never', 'Goa Warehouse'),
('MCH727', 'Pressure Sensor', 'Ace', 'Online', 'v3.0.0', 'LTE', 100, 'never', 'Goa Warehouse'),
('MCH728', 'Pressure Sensor', 'Ace', 'Online', 'v3.0.0', 'LTE', 100, 'never', 'Goa Warehouse'),
('MCH729', 'Pressure Sensor', 'Ace', 'Online', 'v3.0.0', 'LTE', 100, 'never', 'Goa Warehouse'),
('MCH730', 'Pressure Sensor', 'Ace', 'Online', 'v3.0.0', 'LTE', 100, 'never', 'Bhutan Warehouse'),
('MCH731', 'Pressure Sensor', 'Ace', 'Online', 'v3.0.0', 'LTE', 100, 'never', 'Bhutan Warehouse'),
('MCH732', 'Pressure Sensor', 'Ace', 'Online', 'v3.0.0', 'LTE', 100, 'never', 'Bhutan Warehouse'),
('MCH733', 'Pressure Sensor', 'Ace', 'Online', 'v3.0.0', 'LTE', 100, 'never', 'Bhutan Warehouse'),
('MCH734', 'Pressure Sensor', 'Ace', 'Online', 'v3.0.0', 'LTE', 100, 'never', 'Bhutan Warehouse'),
('MCH740', 'Gateway Unit', 'Mini', 'Online', 'v2.0.0', 'None', 100, 'never', 'Goa Warehouse'),
('MCH741', 'Gateway Unit', 'Mini', 'Online', 'v2.0.0', 'None', 100, 'never', 'Goa Warehouse'),
('MCH742', 'Gateway Unit', 'Mini', 'Online', 'v2.0.0', 'None', 100, 'never', 'Goa Warehouse'),
('MCH743', 'Gateway Unit', 'Mini', 'Online', 'v2.0.0', 'None', 100, 'never', 'Goa Warehouse'),
('MCH744', 'Gateway Unit', 'Mini', 'Online', 'v2.0.0', 'None', 100, 'never', 'Goa Warehouse'),
('MCH745', 'Gateway Unit', 'Mini', 'Online', 'v2.0.0', 'None', 100, 'never', 'Goa Warehouse'),
('MCH746', 'Gateway Unit', 'Mini', 'Online', 'v2.0.0', 'None', 100, 'never', 'Bhutan Warehouse'),
('MCH747', 'Gateway Unit', 'Mini', 'Online', 'v2.0.0', 'None', 100, 'never', 'Bhutan Warehouse'),
('MCH748', 'Gateway Unit', 'Mini', 'Online', 'v2.0.0', 'None', 100, 'never', 'Bhutan Warehouse'),
('MCH749', 'Gateway Unit', 'Mini', 'Online', 'v2.0.0', 'None', 100, 'never', 'Bhutan Warehouse'),
('MCH750', 'Gateway Unit', 'Mini', 'Online', 'v2.0.0', 'None', 100, 'never', 'Bhutan Warehouse'),
('MCH751', 'Gateway Unit', 'Mini', 'Online', 'v2.0.0', 'None', 100, 'never', 'Bhutan Warehouse'),
('MCH752', 'Gateway Unit', 'Mini', 'Online', 'v2.0.0', 'None', 100, 'never', 'Bhutan Warehouse'),
('MCH753', 'Gateway Unit', 'Mini', 'Online', 'v2.0.0', 'None', 100, 'never', 'Bhutan Warehouse'),
('MCH754', 'Gateway Unit', 'Mini', 'Online', 'v2.0.0', 'None', 100, 'never', 'Bhutan Warehouse'),
('MCH760', 'Connectivity Module', 'FastScan', 'Online', 'v1.5.0', 'WiFi', 100, 'never', 'Goa Warehouse'),
('MCH761', 'Connectivity Module', 'FastScan', 'Online', 'v1.5.0', 'WiFi', 100, 'never', 'Goa Warehouse'),
('MCH762', 'Connectivity Module', 'FastScan', 'Online', 'v1.5.0', 'WiFi', 100, 'never', 'Goa Warehouse'),
('MCH763', 'Connectivity Module', 'FastScan', 'Online', 'v1.5.0', 'WiFi', 100, 'never', 'Goa Warehouse'),
('MCH764', 'Connectivity Module', 'FastScan', 'Online', 'v1.5.0', 'WiFi', 100, 'never', 'Goa Warehouse'),
('MCH765', 'Connectivity Module', 'FastScan', 'Online', 'v1.5.0', 'WiFi', 100, 'never', 'Goa Warehouse'),
('MCH766', 'Connectivity Module', 'FastScan', 'Online', 'v1.5.0', 'WiFi', 100, 'never', 'Goa Warehouse'),
('MCH767', 'Connectivity Module', 'FastScan', 'Online', 'v1.5.0', 'WiFi', 100, 'never', 'Goa Warehouse'),
('MCH768', 'Connectivity Module', 'FastScan', 'Online', 'v1.5.0', 'WiFi', 100, 'never', 'Goa Warehouse'),
('MCH769', 'Connectivity Module', 'FastScan', 'Online', 'v1.5.0', 'WiFi', 100, 'never', 'Goa Warehouse'),
('MCH770', 'Connectivity Module', 'FastScan', 'Online', 'v1.5.0', 'WiFi', 100, 'never', 'Bhutan Warehouse'),
('MCH771', 'Connectivity Module', 'FastScan', 'Online', 'v1.5.0', 'WiFi', 100, 'never', 'Bhutan Warehouse'),
('MCH772', 'Connectivity Module', 'FastScan', 'Online', 'v1.5.0', 'WiFi', 100, 'never', 'Bhutan Warehouse'),
('MCH773', 'Connectivity Module', 'FastScan', 'Online', 'v1.5.0', 'WiFi', 100, 'never', 'Bhutan Warehouse'),
('MCH774', 'Connectivity Module', 'FastScan', 'Online', 'v1.5.0', 'WiFi', 100, 'never', 'Bhutan Warehouse'),
('MCH780', 'Battery Monitor', 'Go', 'Online', 'v3.0.0', 'LTE', 100, 'never', 'Goa Warehouse'),
('MCH781', 'Battery Monitor', 'Go', 'Online', 'v3.0.0', 'LTE', 100, 'never', 'Goa Warehouse'),
('MCH782', 'Battery Monitor', 'Go', 'Online', 'v3.0.0', 'LTE', 100, 'never', 'Goa Warehouse'),
('MCH783', 'Battery Monitor', 'Go', 'Online', 'v3.0.0', 'LTE', 100, 'never', 'Goa Warehouse'),
('MCH784', 'Battery Monitor', 'Go', 'Online', 'v3.0.0', 'LTE', 100, 'never', 'Goa Warehouse'),
('MCH785', 'Battery Monitor', 'Go', 'Online', 'v3.0.0', 'LTE', 100, 'never', 'Goa Warehouse'),
('MCH786', 'Battery Monitor', 'Go', 'Online', 'v3.0.0', 'LTE', 100, 'never', 'Goa Warehouse'),
('MCH787', 'Battery Monitor', 'Go', 'Online', 'v3.0.0', 'LTE', 100, 'never', 'Goa Warehouse'),
('MCH788', 'Battery Monitor', 'Go', 'Online', 'v3.0.0', 'LTE', 100, 'never', 'Goa Warehouse'),
('MCH789', 'Battery Monitor', 'Go', 'Online', 'v3.0.0', 'LTE', 100, 'never', 'Goa Warehouse'),
('MCH790', 'Battery Monitor', 'Go', 'Online', 'v3.0.0', 'LTE', 100, 'never', 'Bhutan Warehouse'),
('MCH791', 'Battery Monitor', 'Go', 'Online', 'v3.0.0', 'LTE', 100, 'never', 'Bhutan Warehouse'),
('MCH792', 'Battery Monitor', 'Go', 'Online', 'v3.0.0', 'LTE', 100, 'never', 'Bhutan Warehouse'),
('MCH793', 'Battery Monitor', 'Go', 'Online', 'v3.0.0', 'LTE', 100, 'never', 'Bhutan Warehouse'),
('MCH794', 'Battery Monitor', 'Go', 'Online', 'v3.0.0', 'LTE', 100, 'never', 'Bhutan Warehouse'),
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
INSERT INTO notifications (id, title, time_label, type, unread, created_at, user_id) VALUES
('N-001', 'New ticket TK-1005 escalated — Bicholim Plant', '2m ago', 'escalation', true, NOW() - INTERVAL '2 minutes', 'U-001'),
('N-002', 'SLA warning on TK-1002 — 5h remaining', '10m ago', 'sla', true, NOW() - INTERVAL '10 minutes', 'U-001'),
('N-003', 'Device MCH932 went offline at Vasco Tower', '32m ago', 'device', true, NOW() - INTERVAL '32 minutes', 'U-001'),
('N-004', 'North Goa squad completed 8 tickets today', '1h ago', 'info', false, NOW() - INTERVAL '1 hour', 'U-001'),
('N-005', 'Operational Manager approval required for TK-1004 override', '2h ago', 'alert', false, NOW() - INTERVAL '2 hours', 'U-001'),
('N-006', 'Firmware sync failed on 3 devices in Ponda zone', '3h ago', 'device', false, NOW() - INTERVAL '3 hours', 'U-001')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, time_label = EXCLUDED.time_label, type = EXCLUDED.type, unread = EXCLUDED.unread, created_at = EXCLUDED.created_at, user_id = EXCLUDED.user_id;

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

-- Seed purchase_date and warranty_expiry_date for existing mock devices
UPDATE devices SET purchase_date = '2025-06-01' WHERE purchase_date IS NULL;
UPDATE devices SET warranty_expiry_date = '2026-06-01' WHERE warranty_expiry_date IS NULL;

-- Seed components table
INSERT INTO components (name, category, quantity, min_limit, warehouse, region, status, last_updated) VALUES
('Premium HD Screen', 'Screens', 12, 5, 'Goa Warehouse', 'Goa', 'In Stock', '2026-06-25'),
('Li-Ion 5000mAh Battery', 'Batteries', 20, 8, 'Goa Warehouse', 'Goa', 'In Stock', '2026-06-26'),
('Ultra-Sonic Range Sensor', 'Sensors', 15, 6, 'Goa Warehouse', 'Goa', 'In Stock', '2026-06-27'),
('Heavy-Duty Type-C Cable', 'Cables', 4, 10, 'Goa Warehouse', 'Goa', 'Low Stock', '2026-06-28'),
('USB-C Fast Charger 18W', 'Chargers', 30, 10, 'Goa Warehouse', 'Goa', 'In Stock', '2026-06-29'),
('Main Processing Board v2', 'Boards', 8, 3, 'Goa Warehouse', 'Goa', 'In Stock', '2026-06-29'),
('Premium HD Screen', 'Screens', 8, 5, 'Bhutan Warehouse', 'Bhutan', 'In Stock', '2026-06-25'),
('Li-Ion 5000mAh Battery', 'Batteries', 15, 8, 'Bhutan Warehouse', 'Bhutan', 'In Stock', '2026-06-26'),
('Ultra-Sonic Range Sensor', 'Sensors', 3, 6, 'Bhutan Warehouse', 'Bhutan', 'Low Stock', '2026-06-27'),
('Heavy-Duty Type-C Cable', 'Cables', 25, 10, 'Bhutan Warehouse', 'Bhutan', 'In Stock', '2026-06-28'),
('USB-C Fast Charger 18W', 'Chargers', 2, 5, 'Bhutan Warehouse', 'Bhutan', 'Low Stock', '2026-06-29'),
('Main Processing Board v2', 'Boards', 1, 3, 'Bhutan Warehouse', 'Bhutan', 'Low Stock', '2026-06-29');

-- Seed component_usage_logs table
INSERT INTO component_usage_logs (component_id, component_name, quantity, device_id, ticket_id, reason, logged_by, date_logged) VALUES
(1, 'Premium HD Screen', 1, 'MCH901', 'TK-1001', 'Damaged screen replacement', 'Sanjay Dutt', '2026-06-28'),
(2, 'Li-Ion 5000mAh Battery', 2, 'MCH874', 'TK-1001', 'Battery degrade replacement', 'Rahul Roy', '2026-06-29');


