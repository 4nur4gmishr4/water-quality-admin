import React, { useState, useEffect } from 'react';
import { Smartphone, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { supabase } from '../config/supabase';

interface MobileSyncData {
  id: string;
  device_token: string;
  app_version: string;
  platform: string;
  last_sync_timestamp: string;
  sync_frequency_minutes: number;
  subscribed_districts: string[];
  is_active: boolean;
}

const MobileSync: React.FC = () => {
  const [syncData, setSyncData] = useState<MobileSyncData[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStats, setSyncStats] = useState({
    totalDevices: 0,
    activeSyncs: 0,
    pendingSyncs: 0,
    successRate: 0
  });

  useEffect(() => {
    fetchMobileSyncData();
  }, []);

  const fetchMobileSyncData = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('mobile_app_sync')
        .select('*')
        .order('last_sync_timestamp', { ascending: false });

      if (error) {
        console.error('Error fetching mobile sync data:', error);
        return;
      }

      setSyncData(data || []);
      
      // Calculate stats
      const total = data?.length || 0;
      const active = data?.filter(d => d.is_active).length || 0;
      const recentSyncs = data?.filter(d => {
        const lastSync = new Date(d.last_sync_timestamp);
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return lastSync > hourAgo;
      }).length || 0;
      
      setSyncStats({
        totalDevices: total,
        activeSyncs: active,
        pendingSyncs: total - recentSyncs,
        successRate: total > 0 ? Math.round((recentSyncs / total) * 100) : 0
      });
      
    } catch (error) {
      console.error('Error fetching mobile sync data:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerSync = async (deviceToken: string) => {
    try {
      // In a real implementation, this would trigger a sync to the mobile device
      console.log('Triggering sync for device:', deviceToken);
      
      // Update last sync timestamp
      const { error } = await supabase
        .from('mobile_app_sync')
        .update({ 
          last_sync_timestamp: new Date().toISOString() 
        })
        .eq('device_token', deviceToken);

      if (error) {
        console.error('Error updating sync timestamp:', error);
        return;
      }

      // Refresh data
      await fetchMobileSyncData();
      
    } catch (error) {
      console.error('Error triggering sync:', error);
    }
  };

  const getSyncStatus = (lastSync: string) => {
    const lastSyncTime = new Date(lastSync);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSyncTime.getTime()) / (1000 * 60);

    if (diffMinutes < 30) return { status: 'success', label: 'Synced', color: 'text-success' };
    if (diffMinutes < 60) return { status: 'warning', label: 'Pending', color: 'text-warning' };
    return { status: 'error', label: 'Delayed', color: 'text-danger' };
  };

  const formatLastSync = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="heading-2">
                <Smartphone className="text-primary mr-3" size={32} />
                Mobile App Sync
              </h1>
              <p className="text-muted mb-0">
                Monitor and manage data synchronization with mobile applications
              </p>
            </div>
            <button 
              className="btn btn-primary"
              onClick={fetchMobileSyncData}
              disabled={loading}
            >
              <RefreshCw className="mr-2" size={16} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-12 col-sm-6 col-lg-3 mb-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <Smartphone className="text-primary mb-2" size={32} />
              <h3 className="heading-3">{syncStats.totalDevices}</h3>
              <p className="text-muted mb-0">Total Devices</p>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3 mb-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <CheckCircle className="text-success mb-2" size={32} />
              <h3 className="heading-3">{syncStats.activeSyncs}</h3>
              <p className="text-muted mb-0">Active Syncs</p>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3 mb-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <Clock className="text-warning mb-2" size={32} />
              <h3 className="heading-3">{syncStats.pendingSyncs}</h3>
              <p className="text-muted mb-0">Pending Syncs</p>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3 mb-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <AlertCircle className="text-info mb-2" size={32} />
              <h3 className="heading-3">{syncStats.successRate}%</h3>
              <p className="text-muted mb-0">Success Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sync Status Table */}
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom">
              <h5 className="card-title mb-0">Mobile Device Synchronization Status</h5>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="d-flex justify-content-center align-items-center py-5">
                  <div className="loading-spinner mr-3"></div>
                  <span>Loading sync data...</span>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th>Device Token</th>
                        <th>Platform</th>
                        <th>App Version</th>
                        <th>Districts</th>
                        <th>Sync Frequency</th>
                        <th>Last Sync</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {syncData.map((device) => {
                        const syncStatus = getSyncStatus(device.last_sync_timestamp);
                        return (
                          <tr key={device.id}>
                            <td>
                              <code className="bg-light px-2 py-1 rounded">
                                {device.device_token.substring(0, 12)}...
                              </code>
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <Smartphone className="text-muted mr-2" size={16} />
                                <span className="text-capitalize">{device.platform}</span>
                              </div>
                            </td>
                            <td>
                              <span className="badge badge-secondary">
                                v{device.app_version}
                              </span>
                            </td>
                            <td>
                              <div>
                                {device.subscribed_districts.slice(0, 2).map((district, index) => (
                                  <span key={index} className="badge badge-outline-primary mr-1 mb-1">
                                    {district}
                                  </span>
                                ))}
                                {device.subscribed_districts.length > 2 && (
                                  <span className="badge badge-light">
                                    +{device.subscribed_districts.length - 2} more
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>{device.sync_frequency_minutes} min</td>
                            <td>
                              <div>
                                <div className="body-small">
                                  {formatLastSync(device.last_sync_timestamp)}
                                </div>
                                <small className="text-muted">
                                  {new Date(device.last_sync_timestamp).toLocaleString()}
                                </small>
                              </div>
                            </td>
                            <td>
                              <span className={`d-flex align-items-center ${syncStatus.color}`}>
                                {syncStatus.status === 'success' && <CheckCircle size={16} className="mr-1" />}
                                {syncStatus.status === 'warning' && <Clock size={16} className="mr-1" />}
                                {syncStatus.status === 'error' && <AlertCircle size={16} className="mr-1" />}
                                {syncStatus.label}
                              </span>
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => triggerSync(device.device_token)}
                              >
                                <RefreshCw size={14} className="mr-1" />
                                Sync Now
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  
                  {syncData.length === 0 && (
                    <div className="text-center py-5">
                      <Smartphone className="text-muted mb-3" size={48} />
                      <h5 className="text-muted">No mobile devices found</h5>
                      <p className="text-muted">
                        Mobile devices will appear here once they register for data synchronization.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Instructions Card */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-light">
              <h6 className="card-title mb-0">Mobile App Integration Instructions</h6>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-12 col-md-6">
                  <h6>For Android Apps:</h6>
                  <ol className="body-small">
                    <li>Install the Water Quality Monitor app from Google Play</li>
                    <li>Register with your official government credentials</li>
                    <li>Select your district for data synchronization</li>
                    <li>Enable automatic sync in app settings</li>
                  </ol>
                </div>
                <div className="col-12 col-md-6">
                  <h6>For iOS Apps:</h6>
                  <ol className="body-small">
                    <li>Download the app from Apple App Store</li>
                    <li>Complete registration and verification</li>
                    <li>Configure notification preferences</li>
                    <li>Ensure background app refresh is enabled</li>
                  </ol>
                </div>
              </div>
              <div className="alert alert-info mt-3">
                <strong>Note:</strong> Data transmission to mobile applications occurs every 30 minutes by default. 
                Critical alerts are sent immediately via push notifications.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileSync;
