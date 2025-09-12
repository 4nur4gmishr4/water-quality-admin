-- Water Quality Monitoring System Database Schema
-- For Supabase PostgreSQL Database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create ENUM types for risk levels and device status
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE device_status AS ENUM ('active', 'offline', 'maintenance', 'error');
CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'critical');
CREATE TYPE user_role AS ENUM ('district_admin', 'state_admin', 'health_officer', 'super_admin');

-- Users table (extends Firebase Auth)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firebase_uid VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'health_officer',
    district VARCHAR(100),
    state VARCHAR(100) NOT NULL,
    permissions TEXT[],
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Districts table
CREATE TABLE districts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    population INTEGER,
    area_sq_km DECIMAL(10,2),
    coordinates POINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Villages table
CREATE TABLE villages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    district_id UUID REFERENCES districts(id),
    population INTEGER,
    coordinates POINT NOT NULL,
    has_water_supply BOOLEAN DEFAULT false,
    water_source_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- IoT Devices table
CREATE TABLE iot_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(50) UNIQUE NOT NULL,
    village_id UUID REFERENCES villages(id),
    device_type VARCHAR(50) NOT NULL DEFAULT 'water_quality_sensor',
    status device_status DEFAULT 'active',
    installation_date DATE,
    last_maintenance DATE,
    battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100),
    signal_strength INTEGER CHECK (signal_strength >= -120 AND signal_strength <= 0),
    firmware_version VARCHAR(20),
    coordinates POINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Water Quality Readings table
CREATE TABLE water_quality_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES iot_devices(id),
    village_id UUID REFERENCES villages(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Water Quality Parameters
    ph DECIMAL(3,1) CHECK (ph >= 0 AND ph <= 14),
    temperature DECIMAL(4,1) CHECK (temperature >= -10 AND temperature <= 50),
    turbidity DECIMAL(6,2) CHECK (turbidity >= 0),
    tds DECIMAL(8,2), -- Total Dissolved Solids
    conductivity DECIMAL(8,2),
    dissolved_oxygen DECIMAL(4,1),
    
    -- Environmental Parameters
    air_temperature DECIMAL(4,1),
    humidity DECIMAL(3,1) CHECK (humidity >= 0 AND humidity <= 100),
    rainfall_24h DECIMAL(6,2) DEFAULT 0,
    rainfall_7d DECIMAL(8,2) DEFAULT 0,
    
    -- Location Data
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    
    -- Estimated Values (ML Model Outputs)
    estimated_ecoli INTEGER,
    estimated_coliform INTEGER,
    
    -- Quality Flags
    data_quality_score DECIMAL(3,2) DEFAULT 1.0,
    is_anomaly BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disease Risk Predictions table
CREATE TABLE disease_risk_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reading_id UUID REFERENCES water_quality_readings(id),
    village_id UUID REFERENCES villages(id),
    prediction_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Overall Risk Assessment
    overall_risk_level risk_level NOT NULL,
    overall_risk_score DECIMAL(3,2) CHECK (overall_risk_score >= 0 AND overall_risk_score <= 1),
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    
    -- Disease-Specific Risks
    cholera_risk DECIMAL(3,2) DEFAULT 0,
    typhoid_risk DECIMAL(3,2) DEFAULT 0,
    diarrhea_risk DECIMAL(3,2) DEFAULT 0,
    dysentery_risk DECIMAL(3,2) DEFAULT 0,
    hepatitis_a_risk DECIMAL(3,2) DEFAULT 0,
    
    -- ML Model Information
    model_version VARCHAR(20),
    features_used TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disease Hotspots table
CREATE TABLE disease_hotspots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    village_id UUID REFERENCES villages(id),
    hotspot_type VARCHAR(50) NOT NULL,
    risk_level risk_level NOT NULL,
    affected_population INTEGER,
    detection_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'active', -- active, resolved, monitoring
    
    -- Geographic Information
    center_point POINT NOT NULL,
    radius_meters INTEGER,
    affected_area POLYGON,
    
    -- Risk Factors
    primary_risk_factors TEXT[],
    contributing_factors TEXT[],
    
    -- Response Information
    response_actions TEXT[],
    assigned_officer_id UUID REFERENCES users(id),
    resolution_date TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alerts table
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_type VARCHAR(50) NOT NULL,
    severity alert_severity NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    
    -- Source Information
    source_type VARCHAR(50), -- device, prediction, manual, system
    source_id UUID, -- device_id, prediction_id, user_id, etc.
    village_id UUID REFERENCES villages(id),
    
    -- Target Information
    target_districts TEXT[],
    target_roles user_role[],
    
    -- Status Information
    status VARCHAR(20) DEFAULT 'active', -- active, acknowledged, resolved, dismissed
    created_by UUID REFERENCES users(id),
    acknowledged_by UUID REFERENCES users(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Notification Channels
    notification_channels TEXT[] DEFAULT ARRAY['dashboard', 'email'],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mobile App Sync table
CREATE TABLE mobile_app_sync (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_token VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES users(id),
    app_version VARCHAR(20),
    platform VARCHAR(20), -- android, ios
    
    -- Sync Information
    last_sync_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_frequency_minutes INTEGER DEFAULT 30,
    subscribed_districts TEXT[],
    notification_preferences JSONB,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System Statistics table (for dashboard)
CREATE TABLE system_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    
    -- Device Statistics
    total_devices INTEGER DEFAULT 0,
    active_devices INTEGER DEFAULT 0,
    offline_devices INTEGER DEFAULT 0,
    
    -- Water Quality Statistics
    total_readings INTEGER DEFAULT 0,
    critical_readings INTEGER DEFAULT 0,
    high_risk_readings INTEGER DEFAULT 0,
    
    -- Disease Statistics
    active_hotspots INTEGER DEFAULT 0,
    new_hotspots INTEGER DEFAULT 0,
    resolved_hotspots INTEGER DEFAULT 0,
    
    -- Alert Statistics
    total_alerts INTEGER DEFAULT 0,
    critical_alerts INTEGER DEFAULT 0,
    resolved_alerts INTEGER DEFAULT 0,
    
    -- Population Coverage
    villages_covered INTEGER DEFAULT 0,
    population_covered INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_water_quality_readings_timestamp ON water_quality_readings(timestamp DESC);
CREATE INDEX idx_water_quality_readings_device_id ON water_quality_readings(device_id);
CREATE INDEX idx_water_quality_readings_village_id ON water_quality_readings(village_id);
CREATE INDEX idx_disease_risk_predictions_village_id ON disease_risk_predictions(village_id);
CREATE INDEX idx_disease_risk_predictions_timestamp ON disease_risk_predictions(prediction_timestamp DESC);
CREATE INDEX idx_alerts_status_severity ON alerts(status, severity);
CREATE INDEX idx_alerts_village_id ON alerts(village_id);
CREATE INDEX idx_iot_devices_status ON iot_devices(status);
CREATE INDEX idx_users_role_state ON users(role, state);

-- Create spatial indexes for geographic queries
CREATE INDEX idx_villages_coordinates ON villages USING GIST(coordinates);
CREATE INDEX idx_iot_devices_coordinates ON iot_devices USING GIST(coordinates);
CREATE INDEX idx_disease_hotspots_center_point ON disease_hotspots USING GIST(center_point);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_quality_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE disease_risk_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE disease_hotspots ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Sample RLS policies (customize based on your security requirements)
CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (firebase_uid = auth.uid()::text);
CREATE POLICY "Super admins can view all data" ON users FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE firebase_uid = auth.uid()::text 
        AND role = 'super_admin'
    )
);

-- Functions for real-time updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_iot_devices_updated_at BEFORE UPDATE ON iot_devices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_disease_hotspots_updated_at BEFORE UPDATE ON disease_hotspots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mobile_app_sync_updated_at BEFORE UPDATE ON mobile_app_sync FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for development
INSERT INTO districts (name, state, population, area_sq_km, coordinates) VALUES
('Guwahati', 'Assam', 1738000, 1681.0, POINT(91.7362, 26.1445)),
('Imphal West', 'Manipur', 517992, 519.0, POINT(93.9063, 24.8170)),
('Shillong', 'Meghalaya', 354325, 2611.0, POINT(91.8933, 25.5788)),
('Aizawl', 'Mizoram', 404054, 3576.0, POINT(92.9376, 23.1645)),
('Kohima', 'Nagaland', 267988, 1207.0, POINT(94.1086, 25.6751));

-- Insert sample villages
INSERT INTO villages (name, district_id, population, coordinates, has_water_supply, water_source_type) VALUES
('Kamakhya', (SELECT id FROM districts WHERE name = 'Guwahati'), 25000, POINT(91.7500, 26.1600), true, 'municipal'),
('Uzan Bazar', (SELECT id FROM districts WHERE name = 'Guwahati'), 15000, POINT(91.7400, 26.1500), true, 'municipal'),
('Keishampat', (SELECT id FROM districts WHERE name = 'Imphal West'), 12000, POINT(93.9100, 24.8200), false, 'borewell'),
('Police Bazar', (SELECT id FROM districts WHERE name = 'Shillong'), 8000, POINT(91.8900, 25.5800), true, 'spring'),
('Dawrpui', (SELECT id FROM districts WHERE name = 'Aizawl'), 18000, POINT(92.9400, 23.1700), false, 'rainwater');

-- Insert sample IoT devices
INSERT INTO iot_devices (device_id, village_id, status, installation_date, battery_level, signal_strength, firmware_version, coordinates) VALUES
('WQ001_KMK', (SELECT id FROM villages WHERE name = 'Kamakhya'), 'active', '2024-01-15', 85, -45, 'v1.2.3', POINT(91.7500, 26.1600)),
('WQ002_UZB', (SELECT id FROM villages WHERE name = 'Uzan Bazar'), 'active', '2024-01-20', 92, -38, 'v1.2.3', POINT(91.7400, 26.1500)),
('WQ003_KSP', (SELECT id FROM villages WHERE name = 'Keishampat'), 'offline', '2024-02-01', 15, -85, 'v1.2.2', POINT(93.9100, 24.8200)),
('WQ004_PLB', (SELECT id FROM villages WHERE name = 'Police Bazar'), 'active', '2024-02-10', 78, -52, 'v1.2.3', POINT(91.8900, 25.5800)),
('WQ005_DWP', (SELECT id FROM villages WHERE name = 'Dawrpui'), 'maintenance', '2024-02-15', 0, -95, 'v1.2.1', POINT(92.9400, 23.1700));

-- Insert sample water quality readings
INSERT INTO water_quality_readings (device_id, village_id, ph, temperature, turbidity, tds, conductivity, dissolved_oxygen, air_temperature, humidity, rainfall_24h, latitude, longitude, estimated_ecoli, estimated_coliform) VALUES
((SELECT id FROM iot_devices WHERE device_id = 'WQ001_KMK'), (SELECT id FROM villages WHERE name = 'Kamakhya'), 7.2, 28.5, 8.2, 245.0, 380.0, 6.8, 32.1, 78.5, 0.0, 26.1600, 91.7500, 12, 28),
((SELECT id FROM iot_devices WHERE device_id = 'WQ002_UZB'), (SELECT id FROM villages WHERE name = 'Uzan Bazar'), 6.8, 29.1, 15.8, 312.0, 420.0, 5.9, 33.2, 82.1, 2.5, 26.1500, 91.7400, 45, 89),
((SELECT id FROM iot_devices WHERE device_id = 'WQ004_PLB'), (SELECT id FROM villages WHERE name = 'Police Bazar'), 6.5, 24.8, 22.4, 180.0, 290.0, 7.2, 26.5, 85.2, 8.5, 25.5800, 91.8900, 78, 156);

-- Insert sample disease risk predictions
INSERT INTO disease_risk_predictions (reading_id, village_id, overall_risk_level, overall_risk_score, confidence_score, cholera_risk, typhoid_risk, diarrhea_risk, dysentery_risk, hepatitis_a_risk, model_version) VALUES
((SELECT id FROM water_quality_readings WHERE estimated_ecoli = 12), (SELECT id FROM villages WHERE name = 'Kamakhya'), 'low', 0.25, 0.89, 0.15, 0.20, 0.30, 0.18, 0.22, 'v3.0_ANN'),
((SELECT id FROM water_quality_readings WHERE estimated_ecoli = 45), (SELECT id FROM villages WHERE name = 'Uzan Bazar'), 'medium', 0.58, 0.82, 0.45, 0.52, 0.68, 0.41, 0.38, 'v3.0_ANN'),
((SELECT id FROM water_quality_readings WHERE estimated_ecoli = 78), (SELECT id FROM villages WHERE name = 'Police Bazar'), 'high', 0.78, 0.75, 0.72, 0.68, 0.85, 0.74, 0.71, 'v3.0_ANN');

-- Insert sample alerts
INSERT INTO alerts (alert_type, severity, title, message, source_type, village_id, target_districts, target_roles, created_by) VALUES
('water_quality', 'warning', 'Elevated Turbidity Detected', 'High turbidity levels detected in Police Bazar water supply. Recommend boiling water before consumption.', 'device', (SELECT id FROM villages WHERE name = 'Police Bazar'), ARRAY['Shillong'], ARRAY['health_officer', 'district_admin'], (SELECT id FROM users WHERE email = 'admin@waterquality.gov.in')),
('device_status', 'critical', 'IoT Device Offline', 'Water quality monitoring device WQ003_KSP in Keishampat has been offline for 6 hours.', 'device', (SELECT id FROM villages WHERE name = 'Keishampat'), ARRAY['Imphal West'], ARRAY['district_admin'], (SELECT id FROM users WHERE email = 'admin@waterquality.gov.in')),
('disease_risk', 'critical', 'High Disease Risk Alert', 'ML model predicts high risk of waterborne diseases in Police Bazar area. Immediate action recommended.', 'prediction', (SELECT id FROM villages WHERE name = 'Police Bazar'), ARRAY['Shillong'], ARRAY['health_officer', 'district_admin', 'state_admin'], (SELECT id FROM users WHERE email = 'admin@waterquality.gov.in'));

-- Create a view for dashboard statistics
CREATE VIEW dashboard_overview AS
SELECT 
    (SELECT COUNT(*) FROM iot_devices) as total_devices,
    (SELECT COUNT(*) FROM iot_devices WHERE status = 'active') as active_devices,
    (SELECT COUNT(*) FROM iot_devices WHERE status = 'offline') as offline_devices,
    (SELECT COUNT(*) FROM alerts WHERE status = 'active') as active_alerts,
    (SELECT COUNT(*) FROM alerts WHERE status = 'active' AND severity = 'critical') as critical_alerts,
    (SELECT COUNT(*) FROM disease_hotspots WHERE status = 'active') as active_hotspots,
    (SELECT COUNT(*) FROM villages) as villages_covered,
    (SELECT COALESCE(SUM(population), 0) FROM villages) as population_covered,
    (SELECT COUNT(*) FROM water_quality_readings WHERE timestamp >= NOW() - INTERVAL '24 hours') as readings_today;

-- Function to calculate risk statistics
CREATE OR REPLACE FUNCTION get_risk_statistics(days_back INTEGER DEFAULT 7)
RETURNS TABLE(
    risk_level risk_level,
    count BIGINT,
    percentage DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        drp.overall_risk_level,
        COUNT(*),
        ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM disease_risk_predictions WHERE prediction_timestamp >= NOW() - INTERVAL '1 day' * days_back)), 2)
    FROM disease_risk_predictions drp
    WHERE drp.prediction_timestamp >= NOW() - INTERVAL '1 day' * days_back
    GROUP BY drp.overall_risk_level
    ORDER BY 
        CASE drp.overall_risk_level 
            WHEN 'critical' THEN 1 
            WHEN 'high' THEN 2 
            WHEN 'medium' THEN 3 
            WHEN 'low' THEN 4 
        END;
END;
$$ LANGUAGE plpgsql;

-- Function to get latest readings for all devices
CREATE OR REPLACE FUNCTION get_latest_device_readings()
RETURNS TABLE(
    device_id VARCHAR(50),
    village_name VARCHAR(100),
    district_name VARCHAR(100),
    latest_reading TIMESTAMP WITH TIME ZONE,
    ph DECIMAL(3,1),
    temperature DECIMAL(4,1),
    turbidity DECIMAL(6,2),
    risk_level risk_level,
    risk_score DECIMAL(3,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.device_id,
        v.name as village_name,
        dt.name as district_name,
        wqr.timestamp as latest_reading,
        wqr.ph,
        wqr.temperature,
        wqr.turbidity,
        drp.overall_risk_level as risk_level,
        drp.overall_risk_score as risk_score
    FROM iot_devices d
    JOIN villages v ON d.village_id = v.id
    JOIN districts dt ON v.district_id = dt.id
    LEFT JOIN LATERAL (
        SELECT * FROM water_quality_readings 
        WHERE device_id = d.id 
        ORDER BY timestamp DESC 
        LIMIT 1
    ) wqr ON true
    LEFT JOIN LATERAL (
        SELECT * FROM disease_risk_predictions 
        WHERE reading_id = wqr.id 
        ORDER BY prediction_timestamp DESC 
        LIMIT 1
    ) drp ON true
    ORDER BY wqr.timestamp DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Create some users (Note: firebase_uid should be replaced with actual Firebase UIDs)
INSERT INTO users (firebase_uid, email, full_name, role, district, state, permissions) VALUES
('firebase_uid_1', 'admin@waterquality.gov.in', 'System Administrator', 'super_admin', NULL, 'All', ARRAY['all']),
('firebase_uid_2', 'guwahati.admin@health.assam.gov.in', 'Dr. Rajesh Kumar', 'district_admin', 'Guwahati', 'Assam', ARRAY['view_data', 'manage_devices', 'send_alerts']),
('firebase_uid_3', 'health.officer@manipur.gov.in', 'Dr. Priya Sharma', 'health_officer', 'Imphal West', 'Manipur', ARRAY['view_data', 'view_alerts']),
('firebase_uid_4', 'state.admin@meghalaya.gov.in', 'Dr. David Lyngdoh', 'state_admin', NULL, 'Meghalaya', ARRAY['view_data', 'manage_users', 'generate_reports']);

-- Grant appropriate permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
