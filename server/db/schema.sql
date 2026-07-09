-- FieldForce Database Schema for Supabase (PostgreSQL)

-- 1. Roles table
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    users_count INT DEFAULT 0
);

-- 2. Role Permissions mapping table
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id VARCHAR(50) REFERENCES roles(id) ON DELETE CASCADE,
    permission VARCHAR(100) NOT NULL,
    PRIMARY KEY (role_id, permission)
);

-- 3. Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL DEFAULT 'password123',
    role VARCHAR(50) NOT NULL,
    team VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'Active',
    zone VARCHAR(50),
    mobile VARCHAR(50),
    avatar TEXT
);

-- 4. Teams table
CREATE TABLE IF NOT EXISTS teams (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    zone VARCHAR(100) NOT NULL,
    lead VARCHAR(100) NOT NULL,
    members INT DEFAULT 0,
    open_tickets INT DEFAULT 0,
    sla_compliance INT DEFAULT 100,
    place VARCHAR(100)
);

-- 5. Devices table
CREATE TABLE IF NOT EXISTS devices (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    firmware VARCHAR(50) NOT NULL,
    connectivity VARCHAR(50),
    battery INT DEFAULT 0,
    last_sync VARCHAR(50),
    site VARCHAR(200),
    shed_id VARCHAR(50),
    status_duration_days INT DEFAULT 0,
    pick_date VARCHAR(50),
    drop_date VARCHAR(50)
);

-- 6. Tickets table
CREATE TABLE IF NOT EXISTS tickets (
    id VARCHAR(50) PRIMARY KEY,
    customer VARCHAR(100) NOT NULL,
    site VARCHAR(200) NOT NULL,
    technician VARCHAR(100),
    priority VARCHAR(50) NOT NULL,
    issue TEXT,
    status VARCHAR(50) NOT NULL,
    sla_time VARCHAR(50),
    sla_overdue BOOLEAN DEFAULT FALSE,
    accepted_at TIMESTAMP WITH TIME ZONE,
    reached_site_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    ack_deadline TIMESTAMP WITH TIME ZONE,
    response_deadline TIMESTAMP WITH TIME ZONE,
    resolution_deadline TIMESTAMP WITH TIME ZONE,
    ack_sla_status VARCHAR(50) DEFAULT 'PENDING',
    response_sla_status VARCHAR(50) DEFAULT 'PENDING',
    resolution_sla_status VARCHAR(50) DEFAULT 'PENDING',
    sent_at TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    reject_reason TEXT,
    escalated_reason TEXT,
    escalated_by VARCHAR(100),
    escalated_at TIMESTAMP WITH TIME ZONE,
    escalation_type VARCHAR(50),
    escalated_to_role VARCHAR(50),
    escalated_to_user_id VARCHAR(100),
    assigned_tech_support_id VARCHAR(100),
    escalation_date TIMESTAMP WITH TIME ZONE,
    completed_by VARCHAR(100),
    completed_by_user_id VARCHAR(100),
    job_type VARCHAR(100) DEFAULT 'service_repairs',
    device_id VARCHAR(50),
    device_name VARCHAR(100),
    created_by VARCHAR(100),
    created_by_user_id VARCHAR(100)
);

-- 7. Attendance Shifts table (technician live state)
CREATE TABLE IF NOT EXISTS attendance_shifts (
    user_id VARCHAR(50) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    team VARCHAR(100),
    zone VARCHAR(100),
    shift_status VARCHAR(50) NOT NULL DEFAULT 'off_shift',
    online BOOLEAN DEFAULT FALSE,
    punch_in_at TIMESTAMP WITH TIME ZONE,
    punch_out_at TIMESTAMP WITH TIME ZONE,
    break_start_at TIMESTAMP WITH TIME ZONE,
    total_break_ms BIGINT DEFAULT 0,
    gps_lat DOUBLE PRECISION,
    gps_lng DOUBLE PRECISION,
    gps_address TEXT
);

-- 8. Attendance Events table (audit logs)
CREATE TABLE IF NOT EXISTS attendance_events (
    id VARCHAR(100) PRIMARY KEY,
    technician_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    technician_name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    gps_lat DOUBLE PRECISION,
    gps_lng DOUBLE PRECISION,
    gps_address TEXT,
    zone VARCHAR(100)
);

-- 9. Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    time_label VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,
    unread BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure newly added columns exist in older tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS inactive_date_time VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS inactivated_by VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS inactivity_reason TEXT;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS place VARCHAR(100);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS job_type VARCHAR(100) DEFAULT 'service_repairs';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS device_id VARCHAR(50);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS device_name VARCHAR(100);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS reached_site_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ack_deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS response_deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS resolution_deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ack_sla_status VARCHAR(50);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS response_sla_status VARCHAR(50);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS resolution_sla_status VARCHAR(50);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS shed_id VARCHAR(50);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS status_duration_days INT DEFAULT 0;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS pick_date VARCHAR(50);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS drop_date VARCHAR(50);
ALTER TABLE technician_activity_log ADD COLUMN IF NOT EXISTS performed_by VARCHAR(100);

-- 10. Training Materials table
CREATE TABLE IF NOT EXISTS training_materials (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    targeted_role VARCHAR(50) NOT NULL,
    content TEXT,
    file_name VARCHAR(255),
    file_path VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. User Location History (Live GPS tracking, rolling 50 entries)
CREATE TABLE IF NOT EXISTS user_location_history (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_user_location_history_user ON user_location_history(user_id);

-- 12. Technician Activity Log
CREATE TABLE IF NOT EXISTS technician_activity_log (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ticket_id VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    description TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    performed_by VARCHAR(100)
);
CREATE INDEX IF NOT EXISTS idx_tech_activity_user ON technician_activity_log(user_id);

-- 13. Additional Device columns
ALTER TABLE devices ADD COLUMN IF NOT EXISTS purchase_date VARCHAR(50);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS warranty_expiry_date VARCHAR(50);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS assigned_to_type VARCHAR(50);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS assigned_to_id VARCHAR(50);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS assigned_to_name VARCHAR(100);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS assignment_date VARCHAR(50);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS return_date VARCHAR(50);

-- 14. Device Assignments table
CREATE TABLE IF NOT EXISTS device_assignments (
    id BIGSERIAL PRIMARY KEY,
    device_id VARCHAR(50) REFERENCES devices(id) ON DELETE CASCADE,
    device_name VARCHAR(100),
    assignee_type VARCHAR(50),
    assignee_id VARCHAR(50),
    assignee_name VARCHAR(100),
    assigned_by VARCHAR(100),
    assignment_date VARCHAR(50),
    return_date VARCHAR(50),
    status VARCHAR(50)
);

-- 15. Device Maintenance Logs table
CREATE TABLE IF NOT EXISTS device_maintenance_logs (
    id BIGSERIAL PRIMARY KEY,
    device_id VARCHAR(50) REFERENCES devices(id) ON DELETE CASCADE,
    device_name VARCHAR(100),
    reason TEXT,
    maintenance_date VARCHAR(50),
    cost DOUBLE PRECISION,
    remarks TEXT,
    status VARCHAR(50),
    completed_at VARCHAR(50)
);

-- 16. Components table
CREATE TABLE IF NOT EXISTS components (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    min_limit INT NOT NULL DEFAULT 5,
    warehouse VARCHAR(150) NOT NULL,
    region VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'In Stock',
    last_updated VARCHAR(50)
);

-- 17. Component Usage Logs table
CREATE TABLE IF NOT EXISTS component_usage_logs (
    id BIGSERIAL PRIMARY KEY,
    component_id BIGINT REFERENCES components(id) ON DELETE CASCADE,
    component_name VARCHAR(150) NOT NULL,
    quantity INT NOT NULL,
    device_id VARCHAR(50),
    ticket_id VARCHAR(50),
    reason VARCHAR(255),
    logged_by VARCHAR(100),
    date_logged VARCHAR(50)
);

-- 18. Ticket Escalation Columns
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS escalated_reason TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS escalated_by VARCHAR(100);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS escalation_type VARCHAR(50);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS escalated_to_role VARCHAR(50);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS escalated_to_user_id VARCHAR(100);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS assigned_tech_support_id VARCHAR(100);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS escalation_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS completed_by VARCHAR(100);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS completed_by_user_id VARCHAR(100);

-- 19. Device Assignments Ticket ID Column
ALTER TABLE device_assignments ADD COLUMN IF NOT EXISTS ticket_id VARCHAR(50);
ALTER TABLE component_usage_logs ADD COLUMN IF NOT EXISTS ticket_id VARCHAR(50);

-- 20. Permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS created_by_user_id VARCHAR(100);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_id VARCHAR(100);


