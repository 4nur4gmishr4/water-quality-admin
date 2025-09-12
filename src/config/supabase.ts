import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database table names
export const TABLES = {
  USERS: 'users',
  DISTRICTS: 'districts',
  VILLAGES: 'villages',
  IOT_DEVICES: 'iot_devices',
  WATER_QUALITY_READINGS: 'water_quality_readings',
  DISEASE_RISK_PREDICTIONS: 'disease_risk_predictions',
  DISEASE_HOTSPOTS: 'disease_hotspots',
  ALERTS: 'alerts',
  MOBILE_APP_SYNC: 'mobile_app_sync',
  SYSTEM_STATISTICS: 'system_statistics'
} as const;

// Types for database records
export interface User {
  id: string;
  firebase_uid: string;
  email: string;
  full_name: string;
  role: 'district_admin' | 'state_admin' | 'health_officer' | 'super_admin';
  district?: string;
  state: string;
  permissions: string[];
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface District {
  id: string;
  name: string;
  state: string;
  population?: number;
  area_sq_km?: number;
  coordinates?: any; // PostGIS Point
  created_at: string;
}

export interface Village {
  id: string;
  name: string;
  district_id: string;
  population?: number;
  coordinates: any; // PostGIS Point
  has_water_supply: boolean;
  water_source_type?: string;
  created_at: string;
}

export interface IoTDevice {
  id: string;
  device_id: string;
  village_id: string;
  device_type: string;
  status: 'active' | 'offline' | 'maintenance' | 'error';
  installation_date?: string;
  last_maintenance?: string;
  battery_level?: number;
  signal_strength?: number;
  firmware_version?: string;
  coordinates: any; // PostGIS Point
  created_at: string;
  updated_at: string;
}

export interface WaterQualityReading {
  id: string;
  device_id: string;
  village_id: string;
  timestamp: string;
  ph?: number;
  temperature?: number;
  turbidity?: number;
  tds?: number;
  conductivity?: number;
  dissolved_oxygen?: number;
  air_temperature?: number;
  humidity?: number;
  rainfall_24h?: number;
  rainfall_7d?: number;
  latitude: number;
  longitude: number;
  estimated_ecoli?: number;
  estimated_coliform?: number;
  data_quality_score?: number;
  is_anomaly: boolean;
  created_at: string;
}

export interface DiseaseRiskPrediction {
  id: string;
  reading_id: string;
  village_id: string;
  prediction_timestamp: string;
  overall_risk_level: 'low' | 'medium' | 'high' | 'critical';
  overall_risk_score: number;
  confidence_score: number;
  cholera_risk?: number;
  typhoid_risk?: number;
  diarrhea_risk?: number;
  dysentery_risk?: number;
  hepatitis_a_risk?: number;
  model_version?: string;
  features_used?: string[];
  created_at: string;
}

export interface Alert {
  id: string;
  alert_type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  source_type?: string;
  source_id?: string;
  village_id?: string;
  target_districts?: string[];
  target_roles?: string[];
  status: string;
  created_by?: string;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved_by?: string;
  resolved_at?: string;
  notification_channels?: string[];
  created_at: string;
  updated_at: string;
}

export interface DashboardOverview {
  total_devices: number;
  active_devices: number;
  offline_devices: number;
  active_alerts: number;
  critical_alerts: number;
  active_hotspots: number;
  villages_covered: number;
  population_covered: number;
  readings_today: number;
}

export default supabase;
