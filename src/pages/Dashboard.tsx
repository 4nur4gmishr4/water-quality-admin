import React, { useEffect, useState } from 'react';
import { 
  Activity, 
  Droplets, 
  MapPin, 
  Users, 
  AlertTriangle, 
  TrendingUp,
  TrendingDown,
  Minus,
  Wifi,
  WifiOff,
  Smartphone
} from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { supabase, DashboardOverview } from '../config/supabase';
import WaterQualityMap from '../components/WaterQualityMap';

interface StatCard {
  title: string;
  value: number | string;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  description: string;
}

const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard overview data
      const { data, error } = await supabase
        .from('dashboard_overview')
        .select('*')
        .single();

      if (error) {
        return;
      }

      setDashboardData(data);
      setLastUpdated(new Date());
    } catch (error) {
      // console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatCards = (): StatCard[] => {
    if (!dashboardData) return [];

    return [
      {
        title: 'Total Devices',
        value: dashboardData.total_devices,
        change: 2,
        trend: 'up',
        icon: Activity,
        color: 'text-primary',
        bgColor: 'bg-primary',
        description: 'IoT sensors deployed'
      },
      {
        title: 'Active Monitoring',
        value: dashboardData.active_devices,
        change: -1,
        trend: 'down',
        icon: Wifi,
        color: 'text-success',
        bgColor: 'bg-success',
        description: 'Devices online'
      },
      {
        title: 'Offline Devices',
        value: dashboardData.offline_devices,
        change: 1,
        trend: 'up',
        icon: WifiOff,
        color: 'text-danger',
        bgColor: 'bg-danger',
        description: 'Require attention'
      },
      {
        title: 'Active Alerts',
        value: dashboardData.active_alerts,
        change: 0,
        trend: 'stable',
        icon: AlertTriangle,
        color: 'text-warning',
        bgColor: 'bg-warning',
        description: 'Pending responses'
      },
      {
        title: 'Critical Alerts',
        value: dashboardData.critical_alerts,
        change: -2,
        trend: 'down',
        icon: AlertTriangle,
        color: 'text-danger',
        bgColor: 'bg-danger',
        description: 'Immediate action needed'
      },
      {
        title: 'Disease Hotspots',
        value: dashboardData.active_hotspots,
        change: 1,
        trend: 'up',
        icon: MapPin,
        color: 'text-warning',
        bgColor: 'bg-warning',
        description: 'High risk areas'
      },
      {
        title: 'Villages Covered',
        value: dashboardData.villages_covered,
        change: 3,
        trend: 'up',
        icon: Users,
        color: 'text-info',
        bgColor: 'bg-info',
        description: 'Monitoring locations'
      },
      {
        title: 'Population Coverage',
        value: `${Math.round(dashboardData.population_covered / 1000)}K`,
        change: 5,
        trend: 'up',
        icon: Users,
        color: 'text-success',
        bgColor: 'bg-success',
        description: 'People protected'
      },
      {
        title: 'Today\'s Readings',
        value: dashboardData.readings_today,
        change: 12,
        trend: 'up',
        icon: Droplets,
        color: 'text-primary',
        bgColor: 'bg-primary',
        description: 'Data points collected'
      },
      {
        title: 'Mobile App Sync',
        value: '98%',
        change: 1,
        trend: 'up',
        icon: Smartphone,
        color: 'text-success',
        bgColor: 'bg-success',
        description: 'Sync success rate'
      }
    ];
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp size={16} className="text-success" />;
      case 'down':
        return <TrendingDown size={16} className="text-danger" />;
      default:
        return <Minus size={16} className="text-muted" />;
    }
  };

  const getTrendColor = (trend?: 'up' | 'down' | 'stable', isPositive?: boolean) => {
    if (trend === 'stable') return 'text-muted';
    if (isPositive) {
      return trend === 'up' ? 'text-success' : 'text-danger';
    } else {
      return trend === 'up' ? 'text-danger' : 'text-success';
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-3" style={{ width: '3rem', height: '3rem' }}></div>
          <p className="text-muted">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  const statCards = getStatCards();

  return (
    <PageLayout
      title="Dashboard Overview"
      description="Real-time monitoring of water quality and disease surveillance system"
      actions={
        <div className="text-right">
          <small className="text-muted d-block">Last updated</small>
          <small className="text-primary">
            {lastUpdated.toLocaleTimeString()}
          </small>
        </div>
      }
    >

      {/* Statistics Cards */}
      <div className="row mb-5">
        {statCards.map((stat, index) => {
          const IconComponent = stat.icon;
          const isPositiveMetric = !['Offline Devices', 'Active Alerts', 'Critical Alerts', 'Disease Hotspots'].includes(stat.title);
          
          return (
            <div key={index} className="col-6 col-md-4 col-xl-3 mb-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body p-3">
                  <div className="d-flex align-items-start justify-content-between">
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center mb-2">
                        <div className={`rounded-circle d-flex align-items-center justify-content-center mr-2 ${stat.bgColor}`}
                             style={{ width: '32px', height: '32px' }}>
                          <IconComponent size={16} className="text-white" />
                        </div>
                        <div>
                          <h3 className="heading-3 mb-0" style={{ fontSize: 'calc(1.1rem + 0.3vw)' }}>{stat.value}</h3>
                        </div>
                      </div>
                      <h6 className="heading-6 text-muted mb-1" style={{ fontSize: 'calc(0.8rem + 0.1vw)' }}>{stat.title}</h6>
                      <p className="caption text-muted mb-0 d-none d-sm-block">{stat.description}</p>
                    </div>
                  </div>
                  
                  {stat.change !== undefined && (
                    <div className="d-flex align-items-center mt-2">
                      {getTrendIcon(stat.trend)}
                      <span className={`body-small ml-1 ${getTrendColor(stat.trend, isPositiveMetric)}`}>
                        {Math.abs(stat.change)}
                        {stat.trend !== 'stable' ? ' from yesterday' : ' no change'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="row">
        {/* Interactive Map */}
        <div className="col-12 col-xl-8 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-bottom">
              <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between">
                <h5 className="card-title mb-2 mb-sm-0">
                  <MapPin className="text-primary mr-2" size={20} />
                  <span className="d-none d-sm-inline">Water Quality Monitoring Map</span>
                  <span className="d-inline d-sm-none">Monitoring Map</span>
                </h5>
                <div className="d-flex align-items-center">
                  <span className="badge badge-success mr-2">Live</span>
                  <button className="btn btn-sm btn-outline-primary">
                    <span className="d-none d-sm-inline">Fullscreen</span>
                    <span className="d-inline d-sm-none">Full</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="card-body p-0" style={{ minHeight: '300px', height: 'calc(50vh - 100px)' }}>
              <WaterQualityMap />
            </div>
          </div>
        </div>

        {/* Real-time Alerts Panel */}
        <div className="col-12 col-xl-4 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-bottom">
              <h5 className="card-title mb-0">
                <AlertTriangle className="text-warning mr-2" size={20} />
                Recent Alerts
              </h5>
            </div>
            <div className="card-body">
              <div className="alert alert-danger">
                <div className="d-flex align-items-start">
                  <AlertTriangle className="text-danger mt-1 mr-2 flex-shrink-0" size={16} />
                  <div>
                    <h6 className="alert-heading mb-1">Critical Water Quality Alert</h6>
                    <p className="mb-1 body-small">
                      High E.coli levels detected in Police Bazar, Shillong
                    </p>
                    <small className="text-muted">2 minutes ago</small>
                  </div>
                </div>
              </div>

              <div className="alert alert-warning">
                <div className="d-flex align-items-start">
                  <WifiOff className="text-warning mt-1 mr-2 flex-shrink-0" size={16} />
                  <div>
                    <h6 className="alert-heading mb-1">Device Offline</h6>
                    <p className="mb-1 body-small">
                      Sensor WQ003_KSP in Keishampat has been offline for 6 hours
                    </p>
                    <small className="text-muted">15 minutes ago</small>
                  </div>
                </div>
              </div>

              <div className="alert alert-info">
                <div className="d-flex align-items-start">
                  <Droplets className="text-info mt-1 mr-2 flex-shrink-0" size={16} />
                  <div>
                    <h6 className="alert-heading mb-1">Water Quality Improvement</h6>
                    <p className="mb-1 body-small">
                      Turbidity levels normalized in Kamakhya area
                    </p>
                    <small className="text-muted">1 hour ago</small>
                  </div>
                </div>
              </div>

              <div className="text-center mt-3">
                <button className="btn btn-outline-primary btn-sm">
                  View All Alerts
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity and Quick Actions */}
      <div className="row">
        {/* Recent Activity Feed */}
        <div className="col-12 col-lg-6 mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom">
              <h5 className="card-title mb-0">
                <Activity className="text-primary mr-2" size={20} />
                Recent Activity
              </h5>
            </div>
            <div className="card-body p-3">
              <div className="timeline">
                <div className="d-flex mb-3">
                  <div className="bg-success rounded-circle d-flex align-items-center justify-content-center mr-2"
                       style={{ width: '24px', height: '24px', minWidth: '24px' }}>
                    <Droplets size={12} className="text-white" />
                  </div>
                  <div>
                    <p className="body-small mb-1">
                      <span className="d-none d-sm-inline">New water quality reading from </span>
                      <strong>Dawrpui, Aizawl</strong>
                    </p>
                    <small className="text-muted d-block d-sm-inline">pH: 7.2, Temp: 26.5°C</small>
                    <small className="text-muted d-block">3 minutes ago</small>
                  </div>
                </div>

                <div className="d-flex mb-3">
                  <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center mr-3"
                       style={{ width: '24px', height: '24px', minWidth: '24px' }}>
                    <Users size={12} className="text-white" />
                  </div>
                  <div>
                    <p className="body-small mb-1">
                      Mobile app sync completed for <strong>Manipur region</strong>
                    </p>
                    <small className="text-muted">156 records synchronized</small>
                    <br />
                    <small className="text-muted">8 minutes ago</small>
                  </div>
                </div>

                <div className="d-flex mb-3">
                  <div className="bg-warning rounded-circle d-flex align-items-center justify-content-center mr-3"
                       style={{ width: '24px', height: '24px', minWidth: '24px' }}>
                    <AlertTriangle size={12} className="text-white" />
                  </div>
                  <div>
                    <p className="body-small mb-1">
                      ML model predicted medium risk for <strong>Uzan Bazar</strong>
                    </p>
                    <small className="text-muted">Confidence: 82%</small>
                    <br />
                    <small className="text-muted">12 minutes ago</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="col-12 col-lg-6 mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom">
              <h5 className="card-title mb-0">Quick Actions</h5>
            </div>
            <div className="card-body p-3">
              <div className="row g-2">
                <div className="col-6">
                  <button className="btn btn-outline-primary w-100 h-100 d-flex flex-column align-items-center justify-content-center p-2 p-sm-3">
                    <Droplets size={20} className="mb-1 mb-sm-2" />
                    <span className="body-small text-center" style={{ fontSize: 'calc(0.7rem + 0.1vw)' }}>
                      <span className="d-none d-sm-inline">View Water Quality</span>
                      <span className="d-inline d-sm-none">Water Quality</span>
                    </span>
                  </button>
                </div>
                <div className="col-6">
                  <button className="btn btn-outline-warning w-100 h-100 d-flex flex-column align-items-center justify-content-center p-2 p-sm-3">
                    <AlertTriangle size={20} className="mb-1 mb-sm-2" />
                    <span className="body-small" style={{ fontSize: 'calc(0.7rem + 0.1vw)' }}>Send Alert</span>
                  </button>
                </div>
                <div className="col-6">
                  <button className="btn btn-outline-info w-100 h-100 d-flex flex-column align-items-center justify-content-center p-2 p-sm-3">
                    <Activity size={20} className="mb-1 mb-sm-2" />
                    <span className="body-small" style={{ fontSize: 'calc(0.7rem + 0.1vw)' }}>Device Status</span>
                  </button>
                </div>
                <div className="col-6">
                  <button className="btn btn-outline-success w-100 h-100 d-flex flex-column align-items-center justify-content-center p-2 p-sm-3">
                    <Smartphone size={20} className="mb-1 mb-sm-2" />
                    <span className="body-small" style={{ fontSize: 'calc(0.7rem + 0.1vw)' }}>Mobile Sync</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Dashboard;
