import { supabase } from '../config/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface RealtimeSubscription {
  id: string;
  channel: RealtimeChannel;
  table: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  callback: (payload: any) => void;
  filter?: string;
}

export interface LiveUpdate {
  id: string;
  type: 'reading' | 'alert' | 'device_status' | 'prediction';
  timestamp: string;
  data: any;
  location?: {
    latitude: number;
    longitude: number;
    district?: string;
    state?: string;
  };
  severity?: 'info' | 'warning' | 'error' | 'critical';
}

export interface DashboardMetrics {
  active_devices: number;
  total_readings_today: number;
  active_alerts: number;
  critical_locations: number;
  average_water_quality: number;
  system_health_score: number;
  last_updated: string;
}

class RealtimeDataService {
  private subscriptions: Map<string, RealtimeSubscription> = new Map();
  private updateCallbacks: Map<string, (update: LiveUpdate) => void> = new Map();
  private metricsCallbacks: Map<string, (metrics: DashboardMetrics) => void> = new Map();
  private isConnected: boolean = false;

  /**
   * Initialize realtime connections
   */
  async initialize(): Promise<boolean> {
    try {
      // Test connection
      const { data, error } = await supabase.from('water_quality_readings').select('id').limit(1);
      if (error) throw error;

      this.isConnected = true;
      console.log('Realtime data service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize realtime data service:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Subscribe to realtime updates for a specific table
   */
  subscribeToTable(
    table: string,
    event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
    callback: (payload: any) => void,
    filter?: string
  ): string {
    const subscriptionId = `${table}_${event}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      let channel = supabase
        .channel(`realtime:${table}:${subscriptionId}`)
        .on('postgres_changes' as any, {
          event,
          schema: 'public',
          table,
          filter
        }, (payload: any) => {
          this.handleTableUpdate(payload, table);
          callback(payload);
        });

      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Successfully subscribed to ${table} changes`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Error subscribing to ${table} changes`);
        }
      });

      const subscription: RealtimeSubscription = {
        id: subscriptionId,
        channel,
        table,
        event,
        callback,
        filter
      };

      this.subscriptions.set(subscriptionId, subscription);
      return subscriptionId;
    } catch (error) {
      console.error(`Error subscribing to ${table}:`, error);
      return '';
    }
  }

  /**
   * Subscribe to water quality readings
   */
  subscribeToWaterQualityReadings(callback: (reading: any) => void): string {
    return this.subscribeToTable('water_quality_readings', 'INSERT', callback);
  }

  /**
   * Subscribe to alerts
   */
  subscribeToAlerts(callback: (alert: any) => void): string {
    return this.subscribeToTable('alerts', '*', callback);
  }

  /**
   * Subscribe to device status changes
   */
  subscribeToDeviceStatus(callback: (device: any) => void): string {
    return this.subscribeToTable('iot_devices', 'UPDATE', callback);
  }

  /**
   * Subscribe to disease predictions
   */
  subscribeToDiseasePredictions(callback: (prediction: any) => void): string {
    return this.subscribeToTable('disease_predictions', 'INSERT', callback);
  }

  /**
   * Subscribe to live updates with unified format
   */
  subscribeToLiveUpdates(callback: (update: LiveUpdate) => void): string {
    const callbackId = `live_updates_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.updateCallbacks.set(callbackId, callback);

    // Subscribe to multiple tables
    this.subscribeToWaterQualityReadings((payload) => {
      const update: LiveUpdate = {
        id: `reading_${payload.new?.id || Date.now()}`,
        type: 'reading',
        timestamp: payload.new?.timestamp || new Date().toISOString(),
        data: payload.new,
        location: payload.new?.location,
        severity: this.determineSeverityFromReading(payload.new)
      };
      callback(update);
    });

    this.subscribeToAlerts((payload) => {
      const update: LiveUpdate = {
        id: `alert_${payload.new?.id || Date.now()}`,
        type: 'alert',
        timestamp: payload.new?.created_at || new Date().toISOString(),
        data: payload.new,
        location: payload.new?.location,
        severity: payload.new?.severity as LiveUpdate['severity'] || 'info'
      };
      callback(update);
    });

    this.subscribeToDeviceStatus((payload) => {
      const update: LiveUpdate = {
        id: `device_${payload.new?.device_id || Date.now()}`,
        type: 'device_status',
        timestamp: payload.new?.last_seen || new Date().toISOString(),
        data: payload.new,
        location: payload.new?.location,
        severity: payload.new?.status === 'offline' ? 'warning' : 'info'
      };
      callback(update);
    });

    this.subscribeToDiseasePredictions((payload) => {
      const update: LiveUpdate = {
        id: `prediction_${payload.new?.id || Date.now()}`,
        type: 'prediction',
        timestamp: payload.new?.prediction_timestamp || new Date().toISOString(),
        data: payload.new,
        location: payload.new?.location,
        severity: this.determineSeverityFromPrediction(payload.new)
      };
      callback(update);
    });

    return callbackId;
  }

  /**
   * Subscribe to dashboard metrics updates
   */
  subscribeToDashboardMetrics(callback: (metrics: DashboardMetrics) => void): string {
    const callbackId = `metrics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.metricsCallbacks.set(callbackId, callback);

    // Initial metrics load
    this.getDashboardMetrics().then(callback);

    // Subscribe to relevant table changes that affect metrics
    this.subscribeToTable('water_quality_readings', 'INSERT', () => {
      this.getDashboardMetrics().then(callback);
    });

    this.subscribeToTable('alerts', '*', () => {
      this.getDashboardMetrics().then(callback);
    });

    this.subscribeToTable('iot_devices', 'UPDATE', () => {
      this.getDashboardMetrics().then(callback);
    });

    return callbackId;
  }

  /**
   * Get current dashboard metrics
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const [
        activeDevicesResult,
        todayReadingsResult,
        activeAlertsResult,
        criticalLocationsResult,
        avgQualityResult
      ] = await Promise.all([
        // Active devices
        supabase
          .from('iot_devices')
          .select('id', { count: 'exact' })
          .eq('status', 'active'),

        // Today's readings
        supabase
          .from('water_quality_readings')
          .select('id', { count: 'exact' })
          .gte('timestamp', todayISO),

        // Active alerts
        supabase
          .from('alerts')
          .select('id', { count: 'exact' })
          .eq('status', 'active'),

        // Critical locations (high risk predictions in last 24h)
        supabase
          .from('disease_predictions')
          .select('location', { count: 'exact' })
          .in('risk_level', ['high', 'critical'])
          .gte('prediction_timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),

        // Average water quality (last 24h)
        supabase
          .from('water_quality_readings')
          .select('quality_index')
          .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .not('quality_index', 'is', null)
      ]);

      // Calculate average water quality
      const avgWaterQuality = avgQualityResult.data && avgQualityResult.data.length > 0
        ? avgQualityResult.data.reduce((sum, reading) => sum + (reading.quality_index || 0), 0) / avgQualityResult.data.length
        : 0;

      // Calculate system health score (simplified)
      const systemHealthScore = this.calculateSystemHealthScore({
        activeDevices: activeDevicesResult.count || 0,
        avgWaterQuality,
        activeAlerts: activeAlertsResult.count || 0
      });

      return {
        active_devices: activeDevicesResult.count || 0,
        total_readings_today: todayReadingsResult.count || 0,
        active_alerts: activeAlertsResult.count || 0,
        critical_locations: criticalLocationsResult.count || 0,
        average_water_quality: Math.round(avgWaterQuality),
        system_health_score: systemHealthScore,
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      return {
        active_devices: 0,
        total_readings_today: 0,
        active_alerts: 0,
        critical_locations: 0,
        average_water_quality: 0,
        system_health_score: 0,
        last_updated: new Date().toISOString()
      };
    }
  }

  /**
   * Get live water quality data for map visualization
   */
  async getLiveWaterQualityData(timeRange: string = '1h'): Promise<any[]> {
    try {
      const timeRangeMap: Record<string, number> = {
        '1h': 60 * 60 * 1000,
        '6h': 6 * 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000
      };

      const fromTime = new Date(Date.now() - (timeRangeMap[timeRange] || timeRangeMap['1h'])).toISOString();

      const { data, error } = await supabase
        .from('water_quality_readings')
        .select(`
          *,
          disease_predictions!reading_id (
            risk_level,
            overall_risk_score,
            confidence_score
          )
        `)
        .gte('timestamp', fromTime)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      // Group by location and get latest reading for each
      const locationMap = new Map();
      data?.forEach(reading => {
        const locationKey = `${reading.location?.latitude}_${reading.location?.longitude}`;
        if (!locationMap.has(locationKey) || 
            new Date(reading.timestamp) > new Date(locationMap.get(locationKey).timestamp)) {
          locationMap.set(locationKey, reading);
        }
      });

      return Array.from(locationMap.values());
    } catch (error) {
      console.error('Error fetching live water quality data:', error);
      return [];
    }
  }

  /**
   * Get recent alerts for notification center
   */
  async getRecentAlerts(limit: number = 20): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recent alerts:', error);
      return [];
    }
  }

  /**
   * Get device status summary
   */
  async getDeviceStatusSummary(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('iot_devices')
        .select('status, device_type');

      if (error) throw error;

      const summary = data?.reduce((acc, device) => {
        acc.total = (acc.total || 0) + 1;
        acc[device.status] = (acc[device.status] || 0) + 1;
        acc.by_type = acc.by_type || {};
        acc.by_type[device.device_type] = (acc.by_type[device.device_type] || 0) + 1;
        return acc;
      }, {} as any) || {};

      return summary;
    } catch (error) {
      console.error('Error fetching device status summary:', error);
      return {};
    }
  }

  /**
   * Unsubscribe from realtime updates
   */
  unsubscribe(subscriptionId: string): boolean {
    try {
      const subscription = this.subscriptions.get(subscriptionId);
      if (subscription) {
        subscription.channel.unsubscribe();
        this.subscriptions.delete(subscriptionId);
        console.log(`Unsubscribed from ${subscription.table}`);
        return true;
      }

      // Check if it's a callback subscription
      if (this.updateCallbacks.has(subscriptionId)) {
        this.updateCallbacks.delete(subscriptionId);
        return true;
      }

      if (this.metricsCallbacks.has(subscriptionId)) {
        this.metricsCallbacks.delete(subscriptionId);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      return false;
    }
  }

  /**
   * Unsubscribe from all realtime updates
   */
  unsubscribeAll(): void {
    try {
      this.subscriptions.forEach((subscription) => {
        subscription.channel.unsubscribe();
      });
      this.subscriptions.clear();
      this.updateCallbacks.clear();
      this.metricsCallbacks.clear();
      console.log('Unsubscribed from all realtime updates');
    } catch (error) {
      console.error('Error unsubscribing from all updates:', error);
    }
  }

  /**
   * Check connection status
   */
  isRealtimeConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Reconnect to realtime service
   */
  async reconnect(): Promise<boolean> {
    try {
      this.unsubscribeAll();
      return await this.initialize();
    } catch (error) {
      console.error('Error reconnecting to realtime service:', error);
      return false;
    }
  }

  /**
   * Handle table update events
   */
  private handleTableUpdate(payload: any, table: string): void {
    console.log(`Realtime update from ${table}:`, payload.eventType);
    
    // Trigger metric updates for relevant tables
    if (['water_quality_readings', 'alerts', 'iot_devices'].includes(table)) {
      this.metricsCallbacks.forEach(callback => {
        this.getDashboardMetrics().then(callback);
      });
    }
  }

  /**
   * Determine severity from water quality reading
   */
  private determineSeverityFromReading(reading: any): LiveUpdate['severity'] {
    if (!reading) return 'info';

    const qualityIndex = reading.quality_index || 100;
    
    if (qualityIndex < 50) return 'critical';
    if (qualityIndex < 70) return 'error';
    if (qualityIndex < 85) return 'warning';
    return 'info';
  }

  /**
   * Determine severity from disease prediction
   */
  private determineSeverityFromPrediction(prediction: any): LiveUpdate['severity'] {
    if (!prediction) return 'info';

    const riskLevel = prediction.risk_level;
    
    switch (riskLevel) {
      case 'critical': return 'critical';
      case 'high': return 'error';
      case 'medium': return 'warning';
      default: return 'info';
    }
  }

  /**
   * Calculate system health score
   */
  private calculateSystemHealthScore(data: {
    activeDevices: number;
    avgWaterQuality: number;
    activeAlerts: number;
  }): number {
    // Simplified health score calculation
    let score = 100;

    // Reduce score based on water quality
    if (data.avgWaterQuality < 50) score -= 30;
    else if (data.avgWaterQuality < 70) score -= 15;
    else if (data.avgWaterQuality < 85) score -= 5;

    // Reduce score based on active alerts
    if (data.activeAlerts > 10) score -= 20;
    else if (data.activeAlerts > 5) score -= 10;
    else if (data.activeAlerts > 0) score -= 5;

    // Increase score based on active devices (assuming we want at least 10 devices)
    if (data.activeDevices >= 10) score += 0;
    else if (data.activeDevices >= 5) score -= 5;
    else score -= 15;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Send test data for development
   */
  async sendTestData(): Promise<void> {
    if (process.env.NODE_ENV !== 'development') {
      console.log('Test data can only be sent in development mode');
      return;
    }

    try {
      // Insert test water quality reading
      const testReading = {
        device_id: 'test_device_001',
        location: {
          latitude: 26.1445,
          longitude: 91.7362,
          district: 'Guwahati',
          state: 'Assam'
        },
        ph: 7.2,
        temperature: 25.5,
        turbidity: 8.2,
        quality_index: 78,
        timestamp: new Date().toISOString()
      };

      await supabase
        .from('water_quality_readings')
        .insert([testReading]);

      console.log('Test water quality reading sent');

      // Insert test alert
      const testAlert = {
        type: 'water_quality',
        severity: 'medium',
        title: 'Test Alert',
        message: 'This is a test alert for development',
        location: testReading.location,
        device_id: testReading.device_id,
        status: 'active',
        triggered_by: 'automatic'
      };

      await supabase
        .from('alerts')
        .insert([testAlert]);

      console.log('Test alert sent');
    } catch (error) {
      console.error('Error sending test data:', error);
    }
  }
}

// Create and export singleton instance
export const realtimeDataService = new RealtimeDataService();

export default RealtimeDataService;
