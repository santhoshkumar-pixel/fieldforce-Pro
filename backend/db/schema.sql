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
    sent_at TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    reject_reason TEXT,
    job_type VARCHAR(100) DEFAULT 'service_repairs',
    device_id VARCHAR(50),
    device_name VARCHAR(100)
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



