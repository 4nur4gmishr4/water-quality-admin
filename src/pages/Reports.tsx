import React, { useState } from 'react';
import { 
  BarChart3, 
  FileText, 
  Download,
  Calendar,
  Filter,
  Map,
  AlertTriangle,
  RefreshCw,
  ChevronRight
} from 'lucide-react';

interface Report {
  id: string;
  title: string;
  type: 'water_quality' | 'disease_risk' | 'device_status';
  period: string;
  status: 'completed' | 'processing' | 'failed';
  generated_at: string;
  size: string;
}

const Reports: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('last_30');
  const [selectedType, setSelectedType] = useState('all');

  // Mock data
  const reports: Report[] = [
    {
      id: '1',
      title: 'Monthly Water Quality Analysis',
      type: 'water_quality',
      period: 'August 2025',
      status: 'completed',
      generated_at: '2025-09-01T10:30:00',
      size: '2.4 MB'
    },
    {
      id: '2',
      title: 'Disease Risk Assessment',
      type: 'disease_risk',
      period: 'Q3 2025',
      status: 'completed',
      generated_at: '2025-09-10T15:45:00',
      size: '1.8 MB'
    },
    {
      id: '3',
      title: 'Device Status Report',
      type: 'device_status',
      period: 'September 2025',
      status: 'processing',
      generated_at: '2025-09-13T09:15:00',
      size: '1.2 MB'
    }
  ];

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center">
            <div className="d-flex align-items-center mb-3 mb-sm-0">
              <BarChart3 className="text-primary mr-3" size={32} />
              <div>
                <h1 className="heading-2 mb-0">Reports & Analytics</h1>
                <p className="text-muted mb-0">Generate and analyze data reports</p>
              </div>
            </div>
            <button className="btn btn-primary d-flex align-items-center">
              <FileText size={18} className="mr-2" />
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Report Generator */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-3">
              <div className="form-responsive">
                <div className="form-row align-items-end">
                  <div className="form-col">
                    <div className="form-group mb-0">
                      <label className="caption text-muted">Report Type</label>
                      <select 
                        className="form-control"
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                      >
                        <option value="all">All Types</option>
                        <option value="water_quality">Water Quality</option>
                        <option value="disease_risk">Disease Risk</option>
                        <option value="device_status">Device Status</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-col">
                    <div className="form-group mb-0">
                      <label className="caption text-muted">Time Period</label>
                      <select
                        className="form-control"
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                      >
                        <option value="last_7">Last 7 Days</option>
                        <option value="last_30">Last 30 Days</option>
                        <option value="last_90">Last 90 Days</option>
                        <option value="custom">Custom Range</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-col">
                    <div className="form-group mb-0">
                      <label className="caption text-muted">Location</label>
                      <select className="form-control">
                        <option value="all">All Locations</option>
                        <option value="assam">Assam</option>
                        <option value="meghalaya">Meghalaya</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Categories */}
      <div className="row mb-4">
        <div className="col-12 col-sm-6 col-lg-3 mb-4 mb-lg-0">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-3">
              <div className="d-flex align-items-center">
                <div className="rounded-circle bg-primary p-2 mr-3">
                  <Map className="text-white" size={20} />
                </div>
                <div>
                  <h6 className="heading-6 mb-1">Regional Reports</h6>
                  <p className="caption text-muted mb-0">3 States, 12 Districts</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3 mb-4 mb-lg-0">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-3">
              <div className="d-flex align-items-center">
                <div className="rounded-circle bg-success p-2 mr-3">
                  <AlertTriangle className="text-white" size={20} />
                </div>
                <div>
                  <h6 className="heading-6 mb-1">Risk Analysis</h6>
                  <p className="caption text-muted mb-0">5 Active Hotspots</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3 mb-4 mb-lg-0">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-3">
              <div className="d-flex align-items-center">
                <div className="rounded-circle bg-warning p-2 mr-3">
                  <RefreshCw className="text-white" size={20} />
                </div>
                <div>
                  <h6 className="heading-6 mb-1">Recurring Reports</h6>
                  <p className="caption text-muted mb-0">4 Active Schedules</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-3">
              <div className="d-flex align-items-center">
                <div className="rounded-circle bg-info p-2 mr-3">
                  <Calendar className="text-white" size={20} />
                </div>
                <div>
                  <h6 className="heading-6 mb-1">Custom Reports</h6>
                  <p className="caption text-muted mb-0">8 Generated This Month</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Generated Reports */}
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom py-3">
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center">
                <h5 className="card-title mb-2 mb-sm-0">Generated Reports</h5>
                <div className="d-flex align-items-center">
                  <button className="btn btn-sm btn-outline-secondary d-flex align-items-center mr-2">
                    <Filter size={14} className="mr-1" />
                    Filter
                  </button>
                  <button className="btn btn-sm btn-outline-primary d-flex align-items-center">
                    <RefreshCw size={14} className="mr-1" />
                    Refresh
                  </button>
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive-custom">
                <table className="table table-stack-mobile mb-0">
                  <thead>
                    <tr>
                      <th>Report</th>
                      <th>Type</th>
                      <th>Period</th>
                      <th>Status</th>
                      <th>Generated</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map(report => (
                      <tr key={report.id}>
                        <td data-label="Report">
                          <div className="d-flex align-items-center">
                            <FileText className="text-primary mr-2" size={20} />
                            <div>
                              <div className="font-weight-bold">{report.title}</div>
                              <small className="text-muted">{report.size}</small>
                            </div>
                          </div>
                        </td>
                        <td data-label="Type">
                          <span className="badge badge-light text-dark">
                            {report.type.split('_').map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                          </span>
                        </td>
                        <td data-label="Period">
                          {report.period}
                        </td>
                        <td data-label="Status">
                          <span className={`badge ${
                            report.status === 'completed' ? 'badge-success' :
                            report.status === 'processing' ? 'badge-warning' :
                            'badge-danger'
                          }`}>
                            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                          </span>
                        </td>
                        <td data-label="Generated">
                          <small className="text-muted">
                            {new Date(report.generated_at).toLocaleString()}
                          </small>
                        </td>
                        <td data-label="Actions">
                          <div className="btn-group">
                            <button className="btn btn-sm btn-outline-primary d-flex align-items-center">
                              <Download size={16} className="mr-1" />
                              <span className="d-none d-sm-inline">Download</span>
                            </button>
                            <button className="btn btn-sm btn-outline-secondary d-flex align-items-center">
                              <ChevronRight size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Action Menu */}
              <div className="d-block d-md-none p-3 border-top">
                <button className="btn btn-primary btn-block d-flex align-items-center justify-content-center">
                  <Download size={18} className="mr-2" />
                  Download All Reports
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
