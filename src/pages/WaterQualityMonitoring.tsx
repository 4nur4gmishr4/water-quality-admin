import React, { useEffect, useState } from 'react';
import { 
  Droplets, 
  Activity, 
  Filter, 
  Download,
  RefreshCw,
  Search,
  MapPin,
  Calendar,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { supabase, WaterQualityReading, IoTDevice } from '../config/supabase';

interface WaterQualityData extends WaterQualityReading {
  device: IoTDevice;
  village_name: string;
  district_name: string;
  risk_level?: string;
  risk_score?: number;
  latest_reading?: string;
}

const WaterQualityMonitoring: React.FC = () => {
  const [readings, setReadings] = useState<WaterQualityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    district: '',
    riskLevel: '',
    dateRange: '24h'
  });
  const [searchTerm, setSearchTerm] = useState('');

  const fetchReadings = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .rpc('get_latest_device_readings');

      if (error) {
        console.error('Error fetching readings:', error);
        return;
      }

      setReadings(data || []);
    } catch (error) {
      console.error('Error fetching readings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadings();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchReadings, 30000);
    return () => clearInterval(interval);
  }, []);

  const getRiskBadgeColor = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'low': return 'badge-success';
      case 'medium': return 'badge-warning';
      case 'high': return 'badge-danger';
      case 'critical': return 'badge-danger';
      default: return 'badge-secondary';
    }
  };

  const getParameterStatus = (value: number | null | undefined, parameter: string) => {
    if (value === null || value === undefined) return 'unknown';
    
    switch (parameter) {
      case 'ph':
        if (value >= 6.5 && value <= 8.5) return 'good';
        if (value >= 6.0 && value < 6.5 || value > 8.5 && value <= 9.0) return 'warning';
        return 'danger';
      case 'turbidity':
        if (value <= 5) return 'good';
        if (value <= 10) return 'warning';
        return 'danger';
      case 'temperature':
        if (value >= 20 && value <= 30) return 'good';
        if (value >= 15 && value < 20 || value > 30 && value <= 35) return 'warning';
        return 'danger';
      default:
        return 'unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-success';
      case 'warning': return 'text-warning';
      case 'danger': return 'text-danger';
      default: return 'text-muted';
    }
  };

  const filteredReadings = readings.filter(reading => {
    const matchesSearch = searchTerm === '' || 
      reading.device_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reading.village_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reading.district_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDistrict = filters.district === '' || reading.district_name === filters.district;
    const matchesRisk = filters.riskLevel === '' || reading.risk_level === filters.riskLevel;
    
    return matchesSearch && matchesDistrict && matchesRisk;
  });

  const getUniqueDistricts = () => {
    const districts = readings.map(r => r.district_name).filter(Boolean);
    return Array.from(new Set(districts));
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="heading-2">
                <Droplets className="text-primary mr-3" size={32} />
                Water Quality Monitoring
              </h1>
              <p className="text-muted mb-0">
                Real-time water quality data from IoT sensors across Northeast India
              </p>
            </div>
            <div className="d-flex align-items-center">
              <button 
                className="btn btn-outline-primary mr-2"
                onClick={fetchReadings}
                disabled={loading}
              >
                <RefreshCw className={`mr-2 ${loading ? 'spinning' : ''}`} size={16} />
                Refresh
              </button>
              <button className="btn btn-primary">
                <Download className="mr-2" size={16} />
                Export Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="row align-items-end">
                <div className="col-12 col-md-3">
                  <label className="form-label">Search</label>
                  <div className="position-relative">
                    <Search className="position-absolute text-muted" 
                           style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }} 
                           size={16} />
                    <input
                      type="text"
                      className="form-control pl-5"
                      placeholder="Search devices, villages..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-12 col-md-2">
                  <label className="form-label">District</label>
                  <select
                    className="form-select"
                    value={filters.district}
                    onChange={(e) => setFilters({ ...filters, district: e.target.value })}
                  >
                    <option value="">All Districts</option>
                    {getUniqueDistricts().map(district => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                </div>
                <div className="col-12 col-md-2">
                  <label className="form-label">Risk Level</label>
                  <select
                    className="form-select"
                    value={filters.riskLevel}
                    onChange={(e) => setFilters({ ...filters, riskLevel: e.target.value })}
                  >
                    <option value="">All Levels</option>
                    <option value="low">Low Risk</option>
                    <option value="medium">Medium Risk</option>
                    <option value="high">High Risk</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div className="col-12 col-md-2">
                  <label className="form-label">Time Range</label>
                  <select
                    className="form-select"
                    value={filters.dateRange}
                    onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                  >
                    <option value="1h">Last Hour</option>
                    <option value="24h">Last 24 Hours</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                  </select>
                </div>
                <div className="col-12 col-md-3">
                  <button 
                    className="btn btn-outline-secondary w-100"
                    onClick={() => {
                      setFilters({ district: '', riskLevel: '', dateRange: '24h' });
                      setSearchTerm('');
                    }}
                  >
                    <Filter className="mr-2" size={16} />
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-12 col-sm-6 col-lg-3 mb-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <Activity className="text-primary mb-2" size={32} />
              <h3 className="heading-3">{readings.length}</h3>
              <p className="text-muted mb-0">Active Sensors</p>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3 mb-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <Droplets className="text-success mb-2" size={32} />
              <h3 className="heading-3">
                {readings.filter(r => r.risk_level === 'low').length}
              </h3>
              <p className="text-muted mb-0">Low Risk</p>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3 mb-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <AlertCircle className="text-warning mb-2" size={32} />
              <h3 className="heading-3">
                {readings.filter(r => r.risk_level === 'medium' || r.risk_level === 'high').length}
              </h3>
              <p className="text-muted mb-0">Medium/High Risk</p>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3 mb-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <AlertCircle className="text-danger mb-2" size={32} />
              <h3 className="heading-3">
                {readings.filter(r => r.risk_level === 'critical').length}
              </h3>
              <p className="text-muted mb-0">Critical</p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom">
              <h5 className="card-title mb-0">Latest Water Quality Readings</h5>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="d-flex justify-content-center align-items-center py-5">
                  <div className="loading-spinner mr-3"></div>
                  <span>Loading readings...</span>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th>Device ID</th>
                        <th>Location</th>
                        <th>pH Level</th>
                        <th>Temperature</th>
                        <th>Turbidity</th>
                        <th>Risk Level</th>
                        <th>Last Reading</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReadings.map((reading) => (
                        <tr key={reading.device_id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <Activity className="text-muted mr-2" size={16} />
                              <code className="bg-light px-2 py-1 rounded">
                                {reading.device_id}
                              </code>
                            </div>
                          </td>
                          <td>
                            <div>
                              <div className="body-small font-weight-bold">
                                {reading.village_name}
                              </div>
                              <small className="text-muted">
                                {reading.district_name}
                              </small>
                            </div>
                          </td>
                          <td>
                            <span className={getStatusColor(getParameterStatus(reading.ph, 'ph'))}>
                              {reading.ph ? reading.ph.toFixed(1) : 'N/A'}
                            </span>
                          </td>
                          <td>
                            <span className={getStatusColor(getParameterStatus(reading.temperature, 'temperature'))}>
                              {reading.temperature ? `${reading.temperature.toFixed(1)}°C` : 'N/A'}
                            </span>
                          </td>
                          <td>
                            <span className={getStatusColor(getParameterStatus(reading.turbidity, 'turbidity'))}>
                              {reading.turbidity ? `${reading.turbidity.toFixed(1)} NTU` : 'N/A'}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${getRiskBadgeColor(reading.risk_level)}`}>
                              {reading.risk_level ? reading.risk_level.toUpperCase() : 'UNKNOWN'}
                            </span>
                          </td>
                          <td>
                            <div>
                              <div className="body-small">
                                {reading.latest_reading ? 
                                  new Date(reading.latest_reading).toLocaleDateString() : 'N/A'
                                }
                              </div>
                              <small className="text-muted">
                                {reading.latest_reading ? 
                                  new Date(reading.latest_reading).toLocaleTimeString() : 'N/A'
                                }
                              </small>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex">
                              <button className="btn btn-sm btn-outline-primary mr-1">
                                <MapPin size={14} />
                              </button>
                              <button className="btn btn-sm btn-outline-info mr-1">
                                <TrendingUp size={14} />
                              </button>
                              <button className="btn btn-sm btn-outline-success">
                                <Calendar size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {filteredReadings.length === 0 && (
                    <div className="text-center py-5">
                      <Droplets className="text-muted mb-3" size={48} />
                      <h5 className="text-muted">No readings found</h5>
                      <p className="text-muted">
                        Try adjusting your filters or check back later for new data.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaterQualityMonitoring;
