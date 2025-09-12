import React from 'react';
import { Activity, Settings, Wifi, WifiOff } from 'lucide-react';

const DeviceManagement: React.FC = () => {
  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex align-items-center mb-4">
            <Activity className="text-primary mr-3" size={32} />
            <div>
              <h1 className="heading-2 mb-0">Device Management</h1>
              <p className="text-muted">IoT device status and control</p>
            </div>
          </div>
          
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center py-5">
              <Activity className="text-muted mb-3" size={64} />
              <h3 className="heading-3 text-muted">Device Management System</h3>
              <p className="text-muted mb-4">
                Manage and monitor IoT water quality sensors across the network.
              </p>
              <div className="alert alert-info">
                <Settings className="mr-2" size={16} />
                Coming soon - Device configuration and maintenance tools
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceManagement;
