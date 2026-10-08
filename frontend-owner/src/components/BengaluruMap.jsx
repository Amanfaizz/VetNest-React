import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Clock, Users, ShieldCheck, MapPin } from 'lucide-react';

const BENGALURU_CENTER = [12.9716, 77.5946];

// Helper to create Leaflet divIcon with color-coded crowd badge
const createCrowdIcon = (hospital) => {
  const level = hospital.crowdLevel || 'LOW';
  const colorMap = {
    LOW: '#10b981',
    MODERATE: '#f59e0b',
    HIGH: '#ef4444',
    CRITICAL: '#991b1b',
  };

  const color = colorMap[level] || '#10b981';

  return L.divIcon({
    className: 'leaflet-custom-marker',
    html: `
      <div style="
        background: ${color};
        color: white;
        padding: 5px 10px;
        border-radius: 16px;
        font-weight: 800;
        font-size: 11px;
        font-family: Inter, sans-serif;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        border: 2px solid white;
        display: flex;
        align-items: center;
        gap: 5px;
        white-space: nowrap;
        transform: translate(-50%, -100%);
      ">
        <span>🐾 ${hospital.area || 'Vet'}</span>
        <span style="background: rgba(255,255,255,0.25); padding: 1px 5px; border-radius: 99px;">${level}</span>
      </div>
    `,
    iconSize: [100, 30],
    iconAnchor: [50, 30],
  });
};

function ChangeView({ center }) {
  const map = useMap();
  map.setView(center, 12);
  return null;
}

export default function BengaluruMap({ hospitals, selectedHospital, onSelectHospital, onBookClick }) {
  const activeCenter = selectedHospital?.location?.coordinates
    ? [selectedHospital.location.coordinates[1], selectedHospital.location.coordinates[0]]
    : BENGALURU_CENTER;

  return (
    <div className="map-container">
      <MapContainer
        center={BENGALURU_CENTER}
        zoom={12}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <ChangeView center={activeCenter} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {hospitals.map((h) => {
          if (!h.location || !h.location.coordinates) return null;
          const lat = h.location.coordinates[1];
          const lng = h.location.coordinates[0];

          return (
            <Marker
              key={h._id}
              position={[lat, lng]}
              icon={createCrowdIcon(h)}
              eventHandlers={{
                click: () => onSelectHospital(h),
              }}
            >
              <Popup>
                <div style={{ padding: '6px', fontFamily: 'Inter, sans-serif' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
                    {h.hospitalName}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '8px' }}>
                    {h.address}
                  </p>

                  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', fontSize: '0.8rem', fontWeight: 700 }}>
                    <span style={{ color: h.crowdLevel === 'LOW' ? '#10b981' : h.crowdLevel === 'MODERATE' ? '#b45309' : '#ef4444' }}>
                      Crowd: {h.crowdLevel}
                    </span>
                    <span>Waiting: {h.activeQueueCount}</span>
                    <span>~{h.avgWaitTimeMinutes}m wait</span>
                  </div>

                  <button
                    className="btn-teal"
                    style={{ width: '100%', padding: '6px 12px', fontSize: '0.8rem' }}
                    onClick={() => onBookClick(h)}
                  >
                    Book Appointment Now
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
