import { supabase } from '../config/supabase';
import { mlModelService, DiseaseRiskPrediction } from './mlModelService';

export interface MobileAppReading {
  id?: string;
  device_id: string;
  app_version: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    district?: string;
    state?: string;
  };
  water_quality: {
    ph: number;
    temperature: number;
    turbidity: number;
    dissolved_oxygen?: number;
    conductivity?: number;
    tds?: number;
  };
  environmental_data?: {
    air_temperature?: number;
    humidity?: number;
    rainfall_24h?: number;
    wind_speed?: number;
  };
  user_report?: {
    symptoms_reported?: string[];
    water_source_type?: string;
    treatment_method?: string;
    consumption_frequency?: string;
    notes?: string;
  };
  images?: string[]; // Base64 encoded images or URLs
  timestamp: string;
  sync_status: 'pending' | 'synced' | 'error';
  prediction_result?: DiseaseRiskPrediction;
}

export interface SyncResponse {
  success: boolean;
  message: string;
  sync_id?: string;
  processed_count?: number;
  error_count?: number;
  errors?: Array<{
    reading_id: string;
    error: string;
  }>;
}

export interface DeviceRegistration {
  device_id: string;
  device_model: string;
  app_version: string;
  os_version: string;
  user_email?: string;
  phone_number?: string;
  assigned_area?: {
    district: string;
    state: string;
    pin_codes?: string[];
  };
  status: 'active' | 'inactive' | 'blocked';
}

class MobileAppService {
  /**
   * Register a new mobile device/app instance
   */
  async registerDevice(registration: DeviceRegistration): Promise<{ success: boolean; message: string }> {
    try {
      // Check if device already exists
      const { data: existingDevice } = await supabase
        .from('iot_devices')
        .select('*')
        .eq('device_id', registration.device_id)
        .eq('device_type', 'mobile_app')
        .single();

      if (existingDevice) {
        // Update existing device
        const { error } = await supabase
          .from('iot_devices')
          .update({
            status: registration.status,
            configuration: {
              device_model: registration.device_model,
              app_version: registration.app_version,
              os_version: registration.os_version,
              user_email: registration.user_email,
              phone_number: registration.phone_number,
              assigned_area: registration.assigned_area
            },
            last_seen: new Date().toISOString()
          })
          .eq('device_id', registration.device_id);

        if (error) throw error;

        return {
          success: true,
          message: 'Device registration updated successfully'
        };
      } else {
        // Create new device registration
        const { error } = await supabase
          .from('iot_devices')
          .insert([{
            device_id: registration.device_id,
            device_type: 'mobile_app',
            location: registration.assigned_area ? {
              district: registration.assigned_area.district,
              state: registration.assigned_area.state
            } : null,
            status: registration.status,
            configuration: {
              device_model: registration.device_model,
              app_version: registration.app_version,
              os_version: registration.os_version,
              user_email: registration.user_email,
              phone_number: registration.phone_number,
              assigned_area: registration.assigned_area
            },
            created_at: new Date().toISOString(),
            last_seen: new Date().toISOString()
          }]);

        if (error) throw error;

        return {
          success: true,
          message: 'Device registered successfully'
        };
      }
    } catch (error) {
      console.error('Error registering device:', error);
      return {
        success: false,
        message: 'Failed to register device'
      };
    }
  }

  /**
   * Sync mobile app readings to the database
   */
  async syncReadings(readings: MobileAppReading[]): Promise<SyncResponse> {
    try {
      let processedCount = 0;
      let errorCount = 0;
      const errors: Array<{ reading_id: string; error: string }> = [];
      const syncId = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      for (const reading of readings) {
        try {
          // Process each reading individually
          await this.processSingleReading(reading, syncId);
          processedCount++;
        } catch (error) {
          errorCount++;
          errors.push({
            reading_id: reading.id || 'unknown',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Update sync log
      await this.logSyncOperation(syncId, {
        total_readings: readings.length,
        processed_count: processedCount,
        error_count: errorCount,
        device_ids: Array.from(new Set(readings.map(r => r.device_id))),
        sync_timestamp: new Date().toISOString()
      });

      return {
        success: errorCount === 0,
        message: errorCount === 0 
          ? `Successfully synced ${processedCount} readings` 
          : `Synced ${processedCount} readings with ${errorCount} errors`,
        sync_id: syncId,
        processed_count: processedCount,
        error_count: errorCount,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      console.error('Error syncing readings:', error);
      return {
        success: false,
        message: 'Failed to sync readings',
        processed_count: 0,
        error_count: readings.length
      };
    }
  }

  /**
   * Process a single reading from mobile app
   */
  private async processSingleReading(reading: MobileAppReading, syncId: string): Promise<void> {
    // 1. Insert water quality reading
    const { data: waterReading, error: readingError } = await supabase
      .from('water_quality_readings')
      .insert([{
        device_id: reading.device_id,
        location: reading.location,
        ph: reading.water_quality.ph,
        temperature: reading.water_quality.temperature,
        turbidity: reading.water_quality.turbidity,
        dissolved_oxygen: reading.water_quality.dissolved_oxygen,
        conductivity: reading.water_quality.conductivity,
        tds: reading.water_quality.tds,
        environmental_data: reading.environmental_data,
        quality_index: this.calculateWaterQualityIndex(reading.water_quality),
        timestamp: reading.timestamp,
        sync_metadata: {
          sync_id: syncId,
          app_version: reading.app_version,
          original_id: reading.id
        }
      }])
      .select()
      .single();

    if (readingError) throw readingError;

    // 2. Get ML prediction if not already provided
    let prediction = reading.prediction_result;
    if (!prediction) {
      try {
        prediction = await mlModelService.predictDiseaseRisk({
          ph: reading.water_quality.ph,
          temperature: reading.water_quality.temperature,
          turbidity: reading.water_quality.turbidity,
          latitude: reading.location.latitude,
          longitude: reading.location.longitude,
          district: reading.location.district,
          state: reading.location.state,
          humidity: reading.environmental_data?.humidity,
          rainfall_7d: reading.environmental_data?.rainfall_24h
        });
      } catch (mlError) {
        console.warn('ML prediction failed for reading:', reading.id, mlError);
      }
    }

    // 3. Insert disease prediction if available
    if (prediction && waterReading) {
      await supabase
        .from('disease_predictions')
        .insert([{
          reading_id: waterReading.id,
          location: reading.location,
          risk_factors: {
            cholera: prediction.predictions.cholera.risk,
            typhoid: prediction.predictions.typhoid.risk,
            diarrhea: prediction.predictions.diarrhea.risk,
            dysentery: prediction.predictions.dysentery.risk,
            hepatitis_a: prediction.predictions.hepatitis_a.risk
          },
          overall_risk_score: prediction.predictions.overall.risk,
          risk_level: prediction.predictions.overall.level,
          confidence_score: prediction.confidence,
          model_version: prediction.model_version,
          recommendations: prediction.recommendations,
          prediction_timestamp: new Date().toISOString()
        }]);
    }

    // 4. Process user report if provided
    if (reading.user_report) {
      await supabase
        .from('user_reports')
        .insert([{
          device_id: reading.device_id,
          reading_id: waterReading?.id,
          location: reading.location,
          symptoms_reported: reading.user_report.symptoms_reported,
          water_source_type: reading.user_report.water_source_type,
          treatment_method: reading.user_report.treatment_method,
          consumption_frequency: reading.user_report.consumption_frequency,
          notes: reading.user_report.notes,
          report_timestamp: reading.timestamp,
          sync_metadata: {
            sync_id: syncId,
            app_version: reading.app_version
          }
        }]);
    }

    // 5. Process images if provided
    if (reading.images && reading.images.length > 0) {
      for (const image of reading.images) {
        // Store image metadata (actual image storage would be handled separately)
        await supabase
          .from('reading_attachments')
          .insert([{
            reading_id: waterReading?.id,
            attachment_type: 'image',
            file_path: image, // This would be actual file path after upload
            metadata: {
              sync_id: syncId,
              device_id: reading.device_id,
              timestamp: reading.timestamp
            }
          }]);
      }
    }

    // 6. Check for alert conditions
    await this.checkAndCreateAlerts(waterReading, prediction);

    // 7. Update device last seen
    await supabase
      .from('iot_devices')
      .update({ 
        last_seen: new Date().toISOString(),
        status: 'active'
      })
      .eq('device_id', reading.device_id);
  }

  /**
   * Calculate Water Quality Index
   */
  private calculateWaterQualityIndex(waterQuality: MobileAppReading['water_quality']): number {
    // Simplified WQI calculation
    let wqi = 100;

    // pH factor (optimal: 6.5-8.5)
    const phScore = waterQuality.ph >= 6.5 && waterQuality.ph <= 8.5 ? 100 : 
                   Math.max(0, 100 - Math.abs(7.5 - waterQuality.ph) * 20);

    // Temperature factor (optimal: 15-25°C)
    const tempScore = waterQuality.temperature >= 15 && waterQuality.temperature <= 25 ? 100 :
                     Math.max(0, 100 - Math.abs(20 - waterQuality.temperature) * 3);

    // Turbidity factor (optimal: <5 NTU)
    const turbidityScore = waterQuality.turbidity <= 5 ? 100 :
                          Math.max(0, 100 - (waterQuality.turbidity - 5) * 5);

    // Calculate weighted average
    wqi = (phScore * 0.3 + tempScore * 0.2 + turbidityScore * 0.5);

    return Math.round(wqi);
  }

  /**
   * Check for alert conditions and create alerts
   */
  private async checkAndCreateAlerts(
    reading: any, 
    prediction?: DiseaseRiskPrediction
  ): Promise<void> {
    const alerts = [];

    // Check water quality parameters
    if (reading.ph < 6.5 || reading.ph > 8.5) {
      alerts.push({
        type: 'water_quality',
        severity: 'high',
        title: 'pH Level Alert',
        message: `pH level ${reading.ph} is outside safe range (6.5-8.5)`,
        triggered_by: 'mobile_sync'
      });
    }

    if (reading.turbidity > 10) {
      alerts.push({
        type: 'water_quality',
        severity: 'high',
        title: 'High Turbidity Alert',
        message: `Turbidity level ${reading.turbidity} NTU exceeds safe limit (10 NTU)`,
        triggered_by: 'mobile_sync'
      });
    }

    // Check disease risk predictions
    if (prediction && prediction.predictions.overall.risk > 0.7) {
      alerts.push({
        type: 'disease_risk',
        severity: 'critical',
        title: 'Critical Disease Risk Alert',
        message: `High disease risk detected (${Math.round(prediction.predictions.overall.risk * 100)}% risk)`,
        triggered_by: 'ml_prediction'
      });
    }

    // Insert alerts
    for (const alert of alerts) {
      await supabase
        .from('alerts')
        .insert([{
          ...alert,
          location: reading.location,
          device_id: reading.device_id,
          reading_id: reading.id,
          status: 'active',
          created_at: new Date().toISOString()
        }]);
    }
  }

  /**
   * Log sync operation for audit trail
   */
  private async logSyncOperation(syncId: string, metadata: any): Promise<void> {
    try {
      await supabase
        .from('mobile_sync_logs')
        .insert([{
          sync_id: syncId,
          metadata,
          created_at: new Date().toISOString()
        }]);
    } catch (error) {
      console.error('Error logging sync operation:', error);
    }
  }

  /**
   * Get sync history for a device
   */
  async getSyncHistory(deviceId: string, limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('mobile_sync_logs')
        .select('*')
        .contains('metadata->device_ids', [deviceId])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching sync history:', error);
      return [];
    }
  }

  /**
   * Get device statistics
   */
  async getDeviceStats(deviceId: string): Promise<any> {
    try {
      const [readingsCount, lastReading, alertsCount] = await Promise.all([
        // Total readings count
        supabase
          .from('water_quality_readings')
          .select('id', { count: 'exact' })
          .eq('device_id', deviceId),
        
        // Last reading
        supabase
          .from('water_quality_readings')
          .select('*')
          .eq('device_id', deviceId)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single(),
        
        // Active alerts count
        supabase
          .from('alerts')
          .select('id', { count: 'exact' })
          .eq('device_id', deviceId)
          .eq('status', 'active')
      ]);

      return {
        total_readings: readingsCount.count || 0,
        last_reading: lastReading.data,
        active_alerts: alertsCount.count || 0,
        last_sync: lastReading.data?.timestamp
      };
    } catch (error) {
      console.error('Error fetching device stats:', error);
      return {
        total_readings: 0,
        last_reading: null,
        active_alerts: 0,
        last_sync: null
      };
    }
  }

  /**
   * Get all registered mobile devices
   */
  async getRegisteredDevices(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('iot_devices')
        .select('*')
        .eq('device_type', 'mobile_app')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching registered devices:', error);
      return [];
    }
  }

  /**
   * Update device status (activate/deactivate/block)
   */
  async updateDeviceStatus(
    deviceId: string, 
    status: 'active' | 'inactive' | 'blocked'
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('iot_devices')
        .update({ 
          status,
          last_seen: new Date().toISOString()
        })
        .eq('device_id', deviceId)
        .eq('device_type', 'mobile_app');

      if (error) throw error;

      return {
        success: true,
        message: `Device status updated to ${status}`
      };
    } catch (error) {
      console.error('Error updating device status:', error);
      return {
        success: false,
        message: 'Failed to update device status'
      };
    }
  }
}

// Create and export singleton instance
export const mobileAppService = new MobileAppService();

export default MobileAppService;
