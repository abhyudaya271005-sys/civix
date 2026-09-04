import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { SpatialCaseFeature } from '../../api/spatial';
import type { Camera } from '../../api/cctv';

interface WorkstationMapProps {
  cases: SpatialCaseFeature[];
  cameras: Camera[];
  selectedCaseId: string | null;
  onSelectCase?: (caseId: string) => void;
}

// Custom Leaflet DivIcon generating high-contrast red radar hotspots matching reference image
const createRadarHotspotIcon = (size: number, label?: string, isPulse: boolean = true) => {
  const html = `
    <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
      ${isPulse ? `<div class="hotspot-glow" style="position: absolute; width: ${size * 1.5}px; height: ${size * 1.5}px; border-radius: 50%; background: radial-gradient(circle, rgba(189,53,53,0.35) 0%, rgba(189,53,53,0.05) 60%, transparent 100%); pointer-events: none;"></div>` : ''}
      <div style="width: ${size * 0.7}px; height: ${size * 0.7}px; border-radius: 50%; background: radial-gradient(circle, rgba(189,53,53,0.9) 0%, rgba(189,53,53,0.4) 65%, transparent 100%); display: flex; align-items: center; justify-content: center;">
        <div style="width: 7px; height: 7px; border-radius: 50%; background-color: #ffffff; box-shadow: 0 0 6px #BD3535;"></div>
      </div>
      ${label ? `<div style="position: absolute; bottom: -14px; white-space: nowrap; font-size: 9px; font-family: monospace; color: #94a3b8; text-shadow: 0 1px 3px #000;">${label}</div>` : ''}
    </div>
  `;

  return L.divIcon({
    className: 'civix-radar-hotspot',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const MapRecenterController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  React.useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

export const WorkstationGeographicMap: React.FC<WorkstationMapProps> = ({
  cases,
  cameras,
  selectedCaseId,
  onSelectCase,
}) => {
  // Center around Delhi NCR core operations (or location of selected case)
  const defaultCenter: [number, number] = [28.5800, 77.1600];

  const markers = useMemo(() => {
    const list: Array<{ id: string; lat: number; lon: number; title: string; type: string; count: number; priority?: string }> = [];

    // Add cases with geometry
    cases.forEach((c) => {
      if (c.geometry && c.geometry.coordinates) {
        list.push({
          id: c.properties.case_id,
          lat: c.geometry.coordinates[1],
          lon: c.geometry.coordinates[0],
          title: c.properties.title,
          type: 'Case Footprint',
          count: c.properties.event_count || 1,
          priority: c.properties.priority,
        });
      }
    });

    // Add CCTV Cameras as real active surveillance points
    cameras.forEach((cam) => {
      if (cam.latitude && cam.longitude) {
        list.push({
          id: cam.camera_id,
          lat: cam.latitude,
          lon: cam.longitude,
          title: cam.display_name,
          type: 'CCTV Surveillance Node',
          count: 1,
        });
      }
    });

    return list;
  }, [cases, cameras]);

  return (
    <div className="w-full h-full relative dark-map-container bg-[#080b12] rounded overflow-hidden select-none">
      <MapContainer
        center={defaultCenter}
        zoom={11}
        zoomControl={false}
        attributionControl={false}
        style={{ width: '100%', height: '100%', backgroundColor: '#07090e' }}
      >
        <MapRecenterController center={defaultCenter} zoom={11} />

        {/* OpenStreetMap tile layer matching Spatial Intelligence (inverted via .dark-map-container) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {markers.map((item, idx) => {
          const isSelected = item.id === selectedCaseId;
          const size = isSelected ? 48 : (idx % 3 === 0 ? 40 : 28);
          const icon = createRadarHotspotIcon(size, isSelected ? item.title.slice(0, 16) : undefined, true);

          return (
            <Marker
              key={item.id}
              position={[item.lat, item.lon]}
              icon={icon}
              eventHandlers={{
                click: () => {
                  if (onSelectCase && item.type.includes('Case')) {
                    onSelectCase(item.id);
                  }
                },
              }}
            >
              <Popup>
                <div className="p-1 min-w-[160px] text-slate-200 font-sans">
                  <div className="text-[10px] font-mono text-[#BD3535] font-bold uppercase tracking-wider mb-1">
                    {item.type} {item.priority ? `· ${item.priority}` : ''}
                  </div>
                  <div className="font-medium text-xs text-white leading-snug mb-1">
                    {item.title}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    Coords: {item.lat.toFixed(4)}, {item.lon.toFixed(4)}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
