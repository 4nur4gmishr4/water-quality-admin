import React from 'react';
import { MapPin, AlertTriangle, Users, Calendar } from 'lucide-react';

const DiseaseHotspots: React.FC = () => {
  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex align-items-center mb-4">
            <MapPin className="text-primary mr-3" size={32} />
            <div>
              <h1 className="heading-2 mb-0">Disease Hotspots</h1>
              <p className="text-muted">Disease risk mapping and hotspot identification</p>
            </div>
          </div>
          
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center py-5">
              <MapPin className="text-muted mb-3" size={64} />
              <h3 className="heading-3 text-muted">Disease Hotspot Mapping</h3>
              <p className="text-muted mb-4">
                This feature will display disease hotspot identification and mapping based on water quality predictions.
              </p>
              <div className="alert alert-info">
                <AlertTriangle className="mr-2" size={16} />
                Coming soon - Integration with ML model predictions
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiseaseHotspots;
