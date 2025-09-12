import { supabase } from '../config/supabase';

export interface Alert {
  id: string;
  type: 'water_quality' | 'device_offline' | 'disease_risk' | 'maintenance' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  location?: {
    latitude: number;
    longitude: number;
    district?: string;
    state?: string;
  };
  device_id?: string;
  reading_id?: string;
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  triggered_by: 'automatic' | 'manual' | 'ml_prediction' | 'mobile_sync' | 'device_monitor';
  metadata?: Record<string, any>;
  created_at: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  resolved_at?: string;
  resolved_by?: string;
  escalation_level: number;
  auto_resolve_at?: string;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  type: Alert['type'];
  severity: Alert['severity'];
  enabled: boolean;
  conditions: {
    parameter: string;
    operator: '>' | '<' | '=' | '>=' | '<=' | '!=' | 'contains' | 'between';
    value: any;
    threshold_duration?: number; // minutes
  }[];
  actions: {
    type: 'email' | 'sms' | 'push' | 'webhook';
    recipients?: string[];
    template?: string;
    config?: Record<string, any>;
  }[];
  escalation_rules?: {
    delay_minutes: number;
    severity_increase: boolean;
    additional_recipients?: string[];
  }[];
  auto_resolve_after_minutes?: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AlertStats {
  total_alerts: number;
  active_alerts: number;
  critical_alerts: number;
  resolved_today: number;
  average_resolution_time: number; // minutes
  alerts_by_type: Record<string, number>;
  alerts_by_location: Array<{
    location: string;
    count: number;
  }>;
}

class AlertManagementService {
  /**
   * Get all alerts with filtering and pagination
   */
  async getAlerts(filters: {
    status?: Alert['status'][];
    type?: Alert['type'][];
    severity?: Alert['severity'][];
    device_id?: string;
    location?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ alerts: Alert[]; total: number }> {
    try {
      let query = supabase
        .from('alerts')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      if (filters.type && filters.type.length > 0) {
        query = query.in('type', filters.type);
      }

      if (filters.severity && filters.severity.length > 0) {
        query = query.in('severity', filters.severity);
      }

      if (filters.device_id) {
        query = query.eq('device_id', filters.device_id);
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      if (filters.location) {
        query = query.or(
          `location->>district.ilike.%${filters.location}%,location->>state.ilike.%${filters.location}%`
        );
      }

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        alerts: data || [],
        total: count || 0
      };
    } catch (error) {
      console.error('Error fetching alerts:', error);
      return { alerts: [], total: 0 };
    }
  }

  /**
   * Get alert statistics
   */
  async getAlertStats(timeRange: '24h' | '7d' | '30d' = '24h'): Promise<AlertStats> {
    try {
      const now = new Date();
      const timeRangeMap = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
      };

      const fromDate = new Date(now.getTime() - timeRangeMap[timeRange]).toISOString();

      const [
        totalAlerts,
        activeAlerts,
        criticalAlerts,
        resolvedToday,
        alertsByType,
        alertsByLocation,
        resolutionTimes
      ] = await Promise.all([
        // Total alerts in time range
        supabase
          .from('alerts')
          .select('id', { count: 'exact' })
          .gte('created_at', fromDate),

        // Active alerts
        supabase
          .from('alerts')
          .select('id', { count: 'exact' })
          .eq('status', 'active')
          .gte('created_at', fromDate),

        // Critical alerts
        supabase
          .from('alerts')
          .select('id', { count: 'exact' })
          .eq('severity', 'critical')
          .gte('created_at', fromDate),

        // Resolved today
        supabase
          .from('alerts')
          .select('id', { count: 'exact' })
          .eq('status', 'resolved')
          .gte('resolved_at', new Date(now.setHours(0, 0, 0, 0)).toISOString()),

        // Alerts by type
        supabase
          .from('alerts')
          .select('type')
          .gte('created_at', fromDate),

        // Alerts by location
        supabase
          .from('alerts')
          .select('location')
          .gte('created_at', fromDate),

        // Resolution times
        supabase
          .from('alerts')
          .select('created_at, resolved_at')
          .eq('status', 'resolved')
          .gte('created_at', fromDate)
          .not('resolved_at', 'is', null)
      ]);

      // Process alerts by type
      const typeCount: Record<string, number> = {};
      alertsByType.data?.forEach(alert => {
        typeCount[alert.type] = (typeCount[alert.type] || 0) + 1;
      });

      // Process alerts by location
      const locationCount: Array<{ location: string; count: number }> = [];
      const locationMap: Record<string, number> = {};
      
      alertsByLocation.data?.forEach(alert => {
        if (alert.location?.district) {
          const key = `${alert.location.district}, ${alert.location.state || ''}`;
          locationMap[key] = (locationMap[key] || 0) + 1;
        }
      });

      Object.entries(locationMap).forEach(([location, count]) => {
        locationCount.push({ location, count });
      });

      // Calculate average resolution time
      let averageResolutionTime = 0;
      if (resolutionTimes.data && resolutionTimes.data.length > 0) {
        const totalTime = resolutionTimes.data.reduce((sum, alert) => {
          const created = new Date(alert.created_at).getTime();
          const resolved = new Date(alert.resolved_at!).getTime();
          return sum + (resolved - created);
        }, 0);

        averageResolutionTime = Math.round(totalTime / resolutionTimes.data.length / (1000 * 60)); // minutes
      }

      return {
        total_alerts: totalAlerts.count || 0,
        active_alerts: activeAlerts.count || 0,
        critical_alerts: criticalAlerts.count || 0,
        resolved_today: resolvedToday.count || 0,
        average_resolution_time: averageResolutionTime,
        alerts_by_type: typeCount,
        alerts_by_location: locationCount.sort((a, b) => b.count - a.count).slice(0, 10)
      };
    } catch (error) {
      console.error('Error fetching alert stats:', error);
      return {
        total_alerts: 0,
        active_alerts: 0,
        critical_alerts: 0,
        resolved_today: 0,
        average_resolution_time: 0,
        alerts_by_type: {},
        alerts_by_location: []
      };
    }
  }

  /**
   * Create a new alert
   */
  async createAlert(alertData: Omit<Alert, 'id' | 'created_at' | 'escalation_level'>): Promise<{ success: boolean; alert?: Alert; message: string }> {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .insert([{
          ...alertData,
          escalation_level: 0,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // Process alert actions (notifications, etc.)
      await this.processAlertActions(data);

      return {
        success: true,
        alert: data,
        message: 'Alert created successfully'
      };
    } catch (error) {
      console.error('Error creating alert:', error);
      return {
        success: false,
        message: 'Failed to create alert'
      };
    }
  }

  /**
   * Update alert status
   */
  async updateAlertStatus(
    alertId: string,
    status: Alert['status'],
    userId?: string,
    notes?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      const timestamp = new Date().toISOString();

      switch (status) {
        case 'acknowledged':
          updateData.acknowledged_at = timestamp;
          updateData.acknowledged_by = userId;
          break;
        case 'resolved':
          updateData.resolved_at = timestamp;
          updateData.resolved_by = userId;
          break;
      }

      if (notes) {
        updateData.metadata = {
          ...updateData.metadata,
          status_notes: notes
        };
      }

      const { error } = await supabase
        .from('alerts')
        .update(updateData)
        .eq('id', alertId);

      if (error) throw error;

      return {
        success: true,
        message: `Alert ${status} successfully`
      };
    } catch (error) {
      console.error('Error updating alert status:', error);
      return {
        success: false,
        message: 'Failed to update alert status'
      };
    }
  }

  /**
   * Bulk update alert status
   */
  async bulkUpdateAlerts(
    alertIds: string[],
    status: Alert['status'],
    userId?: string
  ): Promise<{ success: boolean; message: string; updated_count: number }> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      const timestamp = new Date().toISOString();

      switch (status) {
        case 'acknowledged':
          updateData.acknowledged_at = timestamp;
          updateData.acknowledged_by = userId;
          break;
        case 'resolved':
          updateData.resolved_at = timestamp;
          updateData.resolved_by = userId;
          break;
      }

      const { data, error } = await supabase
        .from('alerts')
        .update(updateData)
        .in('id', alertIds)
        .select('id');

      if (error) throw error;

      return {
        success: true,
        message: `${data?.length || 0} alerts ${status} successfully`,
        updated_count: data?.length || 0
      };
    } catch (error) {
      console.error('Error bulk updating alerts:', error);
      return {
        success: false,
        message: 'Failed to update alerts',
        updated_count: 0
      };
    }
  }

  /**
   * Delete alert
   */
  async deleteAlert(alertId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('id', alertId);

      if (error) throw error;

      return {
        success: true,
        message: 'Alert deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting alert:', error);
      return {
        success: false,
        message: 'Failed to delete alert'
      };
    }
  }

  /**
   * Get alert rules
   */
  async getAlertRules(): Promise<AlertRule[]> {
    try {
      const { data, error } = await supabase
        .from('alert_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching alert rules:', error);
      return [];
    }
  }

  /**
   * Create alert rule
   */
  async createAlertRule(rule: Omit<AlertRule, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; rule?: AlertRule; message: string }> {
    try {
      const { data, error } = await supabase
        .from('alert_rules')
        .insert([{
          ...rule,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        rule: data,
        message: 'Alert rule created successfully'
      };
    } catch (error) {
      console.error('Error creating alert rule:', error);
      return {
        success: false,
        message: 'Failed to create alert rule'
      };
    }
  }

  /**
   * Update alert rule
   */
  async updateAlertRule(ruleId: string, updates: Partial<AlertRule>): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('alert_rules')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', ruleId);

      if (error) throw error;

      return {
        success: true,
        message: 'Alert rule updated successfully'
      };
    } catch (error) {
      console.error('Error updating alert rule:', error);
      return {
        success: false,
        message: 'Failed to update alert rule'
      };
    }
  }

  /**
   * Delete alert rule
   */
  async deleteAlertRule(ruleId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('alert_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;

      return {
        success: true,
        message: 'Alert rule deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting alert rule:', error);
      return {
        success: false,
        message: 'Failed to delete alert rule'
      };
    }
  }

  /**
   * Process alert actions (send notifications, etc.)
   */
  private async processAlertActions(alert: Alert): Promise<void> {
    try {
      // Get applicable alert rules
      const rules = await this.getAlertRules();
      const applicableRules = rules.filter(rule => 
        rule.enabled && 
        rule.type === alert.type &&
        rule.severity === alert.severity
      );

      for (const rule of applicableRules) {
        // Process each action in the rule
        for (const action of rule.actions) {
          await this.executeAlertAction(alert, action);
        }

        // Schedule escalation if configured
        if (rule.escalation_rules && rule.escalation_rules.length > 0) {
          await this.scheduleEscalation(alert, rule.escalation_rules[0]);
        }

        // Schedule auto-resolve if configured
        if (rule.auto_resolve_after_minutes) {
          await this.scheduleAutoResolve(alert, rule.auto_resolve_after_minutes);
        }
      }
    } catch (error) {
      console.error('Error processing alert actions:', error);
    }
  }

  /**
   * Execute a specific alert action
   */
  private async executeAlertAction(alert: Alert, action: AlertRule['actions'][0]): Promise<void> {
    try {
      switch (action.type) {
        case 'email':
          // Integration with email service would go here
          console.log('Sending email notification for alert:', alert.id);
          break;
        
        case 'sms':
          // Integration with SMS service would go here
          console.log('Sending SMS notification for alert:', alert.id);
          break;
        
        case 'push':
          // Integration with push notification service would go here
          console.log('Sending push notification for alert:', alert.id);
          break;
        
        case 'webhook':
          // Integration with webhook service would go here
          console.log('Sending webhook for alert:', alert.id);
          break;
      }

      // Log the action
      await supabase
        .from('alert_action_logs')
        .insert([{
          alert_id: alert.id,
          action_type: action.type,
          status: 'sent',
          metadata: {
            recipients: action.recipients,
            config: action.config
          },
          timestamp: new Date().toISOString()
        }]);
    } catch (error) {
      console.error('Error executing alert action:', error);
      
      // Log the error
      await supabase
        .from('alert_action_logs')
        .insert([{
          alert_id: alert.id,
          action_type: action.type,
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }]);
    }
  }

  /**
   * Schedule alert escalation
   */
  private async scheduleEscalation(alert: Alert, escalationRule: NonNullable<AlertRule['escalation_rules']>[0]): Promise<void> {
    // This would integrate with a job scheduler or background task system
    console.log(`Scheduling escalation for alert ${alert.id} in ${escalationRule.delay_minutes} minutes`);
  }

  /**
   * Schedule auto-resolve
   */
  private async scheduleAutoResolve(alert: Alert, delayMinutes: number): Promise<void> {
    const autoResolveAt = new Date(Date.now() + delayMinutes * 60 * 1000).toISOString();
    
    await supabase
      .from('alerts')
      .update({ auto_resolve_at: autoResolveAt })
      .eq('id', alert.id);
  }

  /**
   * Process automatic resolution of alerts
   */
  async processAutoResolveAlerts(): Promise<void> {
    try {
      const now = new Date().toISOString();
      
      const { data: alertsToResolve } = await supabase
        .from('alerts')
        .select('id')
        .eq('status', 'active')
        .lte('auto_resolve_at', now)
        .not('auto_resolve_at', 'is', null);

      if (alertsToResolve && alertsToResolve.length > 0) {
        const alertIds = alertsToResolve.map(alert => alert.id);
        
        await this.bulkUpdateAlerts(alertIds, 'resolved', 'system');
        
        console.log(`Auto-resolved ${alertIds.length} alerts`);
      }
    } catch (error) {
      console.error('Error processing auto-resolve alerts:', error);
    }
  }
}

// Create and export singleton instance
export const alertManagementService = new AlertManagementService();

export default AlertManagementService;
