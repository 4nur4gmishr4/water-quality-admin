import React from 'react';
import { Settings as SettingsIcon, Database, Cog } from 'lucide-react';

const Settings: React.FC = () => {
  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex align-items-center mb-4">
            <SettingsIcon className="text-primary mr-3" size={32} />
            <div>
              <h1 className="heading-2 mb-0">System Settings</h1>
              <p className="text-muted">System configuration and preferences</p>
            </div>
          </div>
          
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center py-5">
              <Database className="text-muted mb-3" size={64} />
              <h3 className="heading-3 text-muted">System Configuration</h3>
              <p className="text-muted mb-4">
                Configure system settings, database connections, and application preferences.
              </p>
              <div className="alert alert-info">
                <Cog className="mr-2" size={16} />
                Coming soon - System configuration and settings management
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
