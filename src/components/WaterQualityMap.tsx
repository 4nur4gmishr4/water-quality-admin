import React, { useEffect, useRef, useState } from 'react';
import { supabase, WaterQualityReading, IoTDevice } from '../config/supabase';

interface MapData {
  devices: IoTDevice[];
  readings: WaterQualityReading[];
}

const WaterQualityMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapData, setMapData] = useState<MapData>({ devices: [], readings: [] });
  const [loading, setLoading] = useState(true);

  // Initialize Google Maps
  useEffect(() => {
    const initMap = () => {
      if (!mapRef.current) return;

      const mapOptions: google.maps.MapOptions = {
        center: { lat: 26.2006, lng: 92.9376 }, // Northeast India focus
        zoom: 8,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#e9e9e9' }, { lightness: 17 }]
          },
          {
            featureType: 'landscape',
            elementType: 'geometry',
            stylers: [{ color: '#f5f5f5' }, { lightness: 20 }]
          },
          {
            featureType: 'road.highway',
            elementType: 'geometry.fill',
            stylers: [{ color: '#ffffff' }, { lightness: 17 }]
          },
          {
            featureType: 'road.highway',
            elementType: 'geometry.stroke',
            stylers: [{ color: '#ffffff' }, { lightness: 29 }, { weight: 0.2 }]
          },
          {
            featureType: 'road.arterial',
            elementType: 'geometry',
            stylers: [{ color: '#ffffff' }, { lightness: 18 }]
          },
          {
            featureType: 'road.local',
            elementType: 'geometry',
            stylers: [{ color: '#ffffff' }, { lightness: 16 }]
          },
          {
            featureType: 'poi',
            elementType: 'geometry',
            stylers: [{ color: '#f5f5f5' }, { lightness: 21 }]
          }
        ]
      };

      const newMap = new google.maps.Map(mapRef.current, mapOptions);
      setMap(newMap);
    };

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      initMap();
    } else {
      // Load Google Maps script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=geometry`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      document.head.appendChild(script);
    }
  }, []);

  // Fetch map data
  useEffect(() => {
    const fetchMapData = async () => {
      try {
        setLoading(true);

        // Fetch devices with latest readings
        const { data: devices, error: devicesError } = await supabase
          .from('iot_devices')
          .select(`
            *,
            villages(name, district_id, districts(name, state))
          `);

        if (devicesError) {
          console.error('Error fetching devices:', devicesError);
          return;
        }

        // Fetch latest readings for each device
        const { data: readings, error: readingsError } = await supabase
          .from('water_quality_readings')
          .select(`
            *,
            disease_risk_predictions(
              overall_risk_level,
              overall_risk_score,
              confidence_score
            )
          `)
          .order('timestamp', { ascending: false });

        if (readingsError) {
          console.error('Error fetching readings:', readingsError);
          return;
        }

        setMapData({
          devices: devices || [],
          readings: readings || []
        });
      } catch (error) {
        console.error('Error fetching map data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMapData();
  }, []);

  // Add markers to map
  useEffect(() => {
    if (!map || !mapData.devices.length) return;

    // Clear existing markers
    // Note: In a real implementation, you'd want to track and clear markers

    mapData.devices.forEach((device) => {
      // Get latest reading for this device
      const latestReading = mapData.readings
        .filter(reading => reading.device_id === device.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

      // Determine marker color based on device status and risk level
      let markerColor = '#6C757D'; // Gray for no data
      let riskLevel = 'unknown';

      if (device.status === 'offline') {
        markerColor = '#DC3545'; // Red for offline
        riskLevel = 'offline';
      } else if (latestReading) {
        const riskPrediction = (latestReading as any).disease_risk_predictions?.[0];
        if (riskPrediction) {
          switch (riskPrediction.overall_risk_level) {
            case 'low':
              markerColor = '#28A745'; // Green
              riskLevel = 'low';
              break;
            case 'medium':
              markerColor = '#FFC107'; // Yellow
              riskLevel = 'medium';
              break;
            case 'high':
              markerColor = '#FF8C00'; // Orange
              riskLevel = 'high';
              break;
            case 'critical':
              markerColor = '#DC3545'; // Red
              riskLevel = 'critical';
              break;
          }
        }
      }

      // Create marker
      const marker = new google.maps.Marker({
        position: {
          lat: parseFloat(device.coordinates?.coordinates?.[1] || '0'),
          lng: parseFloat(device.coordinates?.coordinates?.[0] || '0')
        },
        map: map,
        title: device.device_id,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: markerColor,
          fillOpacity: 0.8,
          strokeColor: '#FFFFFF',
          strokeWeight: 2
        }
      });

      // Create info window
      const infoWindow = new google.maps.InfoWindow({
        content: createInfoWindowContent(device, latestReading, riskLevel)
      });

      // Add click listener
      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });
    });
  }, [map, mapData]);

  const createInfoWindowContent = (
    device: IoTDevice, 
    reading: WaterQualityReading | undefined,
    riskLevel: string
  ) => {
    const villageInfo = (device as any).villages;
    const riskPrediction = reading ? (reading as any).disease_risk_predictions?.[0] : null;

    const isMobile = window.innerWidth < 576;
    const minWidth = isMobile ? 200 : 250;
    const fontSize = isMobile ? 12 : 14;
    
    return `
      <div style="padding: 10px; min-width: ${minWidth}px; max-width: 90vw; font-family: 'Poppins', sans-serif;">
        <div style="display: flex; align-items: center; margin-bottom: 6px;">
          <div style="width: 10px; height: 10px; border-radius: 50%; background-color: ${getRiskColor(riskLevel)}; margin-right: 6px;"></div>
          <h6 style="margin: 0; color: #1F4E79; font-weight: 600; font-size: ${fontSize + 1}px;">${device.device_id}</h6>
        </div>
        
        <p style="margin: 3px 0; font-size: ${fontSize}px; color: #6C757D;">
          <strong>Location:</strong> ${villageInfo?.name || 'Unknown'}, ${villageInfo?.districts?.name || 'Unknown'}
        </p>
        
        <p style="margin: 3px 0; font-size: ${fontSize}px; color: #6C757D;">
          <strong>Status:</strong> 
          <span style="color: ${device.status === 'active' ? '#28A745' : '#DC3545'}; text-transform: capitalize;">
            ${device.status}
          </span>
        </p>

        ${device.battery_level ? `
          <p style="margin: 3px 0; font-size: ${fontSize}px; color: #6C757D;">
            <strong>Battery:</strong> ${device.battery_level}%
          </p>
        ` : ''}

        ${reading ? `
          <hr style="margin: 8px 0; border: none; border-top: 1px solid #DEE2E6;">
          <div style="font-size: ${fontSize - 1}px;">
            <p style="margin: 3px 0;"><strong>pH:</strong> ${reading.ph || 'N/A'}</p>
            <p style="margin: 3px 0;"><strong>Temperature:</strong> ${reading.temperature || 'N/A'}°C</p>
            <p style="margin: 3px 0;"><strong>Turbidity:</strong> ${reading.turbidity || 'N/A'} NTU</p>
            
            ${riskPrediction ? `
              <hr style="margin: 6px 0; border: none; border-top: 1px solid #DEE2E6;">
              <p style="margin: 3px 0; font-weight: 600;">
                <strong>Risk Level:</strong> 
                <span style="color: ${getRiskColor(riskLevel)}; text-transform: capitalize;">
                  ${riskLevel}
                </span>
              </p>
              <p style="margin: 3px 0; font-size: ${fontSize - 2}px;">
                Confidence: ${Math.round((riskPrediction.confidence_score || 0) * 100)}%
              </p>
            ` : ''}
            
            <p style="margin: 6px 0 0 0; font-size: ${fontSize - 2}px; color: #6C757D;">
              ${isMobile ? new Date(reading.timestamp).toLocaleTimeString() : new Date(reading.timestamp).toLocaleString()}
            </p>
          </div>
        ` : `
          <hr style="margin: 8px 0; border: none; border-top: 1px solid #DEE2E6;">
          <p style="margin: 3px 0; font-size: ${fontSize}px; color: #6C757D; font-style: italic;">
            No recent readings available
          </p>
        `}
      </div>
    `;
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return '#28A745';
      case 'medium': return '#FFC107';
      case 'high': return '#FF8C00';
      case 'critical': return '#DC3545';
      case 'offline': return '#DC3545';
      default: return '#6C757D';
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-3"></div>
          <p className="text-muted">Loading map data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="position-relative">
      <style>
        {`
          @media (max-width: 576px) {
            .map-legend {
              font-size: 0.75rem;
              padding: 0.5rem !important;
            }

            .map-legend .heading-6 {
              font-size: 0.8rem;
              margin-bottom: 0.3rem !important;
            }

            .map-legend .risk-indicator {
              width: 8px !important;
              height: 8px !important;
              margin-right: 0.3rem !important;
            }

            .map-stats {
              font-size: 0.7rem;
              padding: 0.25rem 0.5rem !important;
            }

            .info-window {
              max-width: 280px !important;
            }
          }

          .map-container {
            width: 100%;
            height: 100%;
            min-height: 300px;
            border-radius: 8px;
          }
        `}
      </style>

      <div
        ref={mapRef}
        className="map-container"
        style={{ height: 'calc(100% - 20px)' }}
      />
      
      {/* Map Legend */}
      <div className="position-absolute bg-white p-3 rounded shadow-sm map-legend"
           style={{ top: '10px', right: '10px', minWidth: '120px', maxWidth: '150px' }}>
        <h6 className="heading-6 mb-2">Risk Levels</h6>
        <div className="d-flex flex-column">
          <div className="d-flex align-items-center mb-1">
            <div className="rounded-circle mr-2 risk-indicator" 
                 style={{ width: '12px', height: '12px', backgroundColor: '#28A745' }}></div>
            <small>Low Risk</small>
          </div>
          <div className="d-flex align-items-center mb-1">
            <div className="rounded-circle mr-2 risk-indicator" 
                 style={{ width: '12px', height: '12px', backgroundColor: '#FFC107' }}></div>
            <small>Medium Risk</small>
          </div>
          <div className="d-flex align-items-center mb-1">
            <div className="rounded-circle mr-2 risk-indicator" 
                 style={{ width: '12px', height: '12px', backgroundColor: '#FF8C00' }}></div>
            <small>High Risk</small>
          </div>
          <div className="d-flex align-items-center mb-1">
            <div className="rounded-circle mr-2 risk-indicator" 
                 style={{ width: '12px', height: '12px', backgroundColor: '#DC3545' }}></div>
            <small>Critical</small>
          </div>
          <div className="d-flex align-items-center">
            <div className="rounded-circle mr-2 risk-indicator" 
                 style={{ width: '12px', height: '12px', backgroundColor: '#6C757D' }}></div>
            <small className="d-none d-sm-inline">Offline/No Data</small>
            <small className="d-inline d-sm-none">Offline</small>
          </div>
        </div>
      </div>

      {/* Map Stats */}
      <div className="position-absolute bg-white p-2 rounded shadow-sm map-stats"
           style={{ bottom: '10px', left: '10px' }}>
        <small className="text-muted">
          <span className="d-none d-sm-inline">
            {mapData.devices.length} devices • {mapData.readings.length} readings
          </span>
          <span className="d-inline d-sm-none">
            {mapData.devices.length}D • {mapData.readings.length}R
          </span>
        </small>
      </div>
    </div>
  );
};

export default WaterQualityMap;
