import React from 'react';
import { AlertTriangle, Bell, Send } from 'lucide-react';

const AlertManagement: React.FC = () => {
  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex align-items-center mb-4">
            <AlertTriangle className="text-warning mr-3" size={32} />
            <div>
              <h1 className="heading-2 mb-0">Alert Management</h1>
              <p className="text-muted">System alerts and notifications</p>
            </div>
          </div>
          
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center py-5">
              <Bell className="text-muted mb-3" size={64} />
              <h3 className="heading-3 text-muted">Alert Management System</h3>
              <p className="text-muted mb-4">
                Manage and send system alerts and notifications to stakeholders.
              </p>
              <div className="alert alert-info">
                <Send className="mr-2" size={16} />
                Coming soon - Alert configuration and notification management
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertManagement;
