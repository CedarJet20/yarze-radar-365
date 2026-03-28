// ============================================================
// Globe Renderer — globe.gl + Three.js
// Same world physics as worldmonitor.app
// ============================================================

import Globe from 'globe.gl';
import type { GlobeInstance } from 'globe.gl';
import * as THREE from 'three';
import type { Vehicle, GlobePoint, FilterState } from '../types';

// Colors by vehicle type
const AIRCRAFT_COLORS: Record<string, string> = {
  commercial: '#00d4ff',
  private: '#ffd700',
  military: '#ff4444',
  cargo: '#ff8c00',
  helicopter: '#00ff88',
};

const VESSEL_COLORS: Record<string, string> = {
  cargo: '#4fc3f7',
  tanker: '#ff7043',
  passenger: '#ab47bc',
  fishing: '#66bb6a',
  military: '#ef5350',
  sailing: '#26c6da',
  tug: '#8d6e63',
};

function getVehicleColor(v: Vehicle): string {
  if (v.type === 'aircraft') return AIRCRAFT_COLORS[v.category] || '#00d4ff';
  return VESSEL_COLORS[v.vesselType] || '#4fc3f7';
}

function getVehicleSize(v: Vehicle): number {
  if (v.type === 'aircraft') {
    if (v.category === 'helicopter') return 0.3;
    if (v.category === 'private') return 0.35;
    if (v.category === 'military') return 0.5;
    return 0.4;
  }
  // Vessels — scale by length
  if (v.length > 350) return 0.6;
  if (v.length > 200) return 0.5;
  if (v.length > 100) return 0.4;
  return 0.3;
}

function getVehicleAlt(v: Vehicle): number {
  if (v.type === 'aircraft') {
    // Scale altitude for visibility (real alt in meters → globe units)
    const alt = v.geoAltitude ?? v.baroAltitude ?? 0;
    return Math.max(0.005, alt / 1_000_000); // subtle elevation
  }
  return 0.001; // vessels at sea level
}

function getVehicleLabel(v: Vehicle): string {
  if (v.type === 'aircraft') {
    return v.callsign || v.icao24;
  }
  return v.name || v.mmsi;
}

function getVehicleId(v: Vehicle): string {
  return v.type === 'aircraft' ? v.icao24 : v.mmsi;
}

export function createGlobe(
  container: HTMLElement,
  onVehicleClick: (vehicle: Vehicle) => void,
  onGlobeReady: () => void
): {
  globe: GlobeInstance;
  updateVehicles: (vehicles: Vehicle[], filters: FilterState) => void;
  showTrajectory: (vehicle: Vehicle | null) => void;
  flyTo: (lat: number, lng: number) => void;
} {
  const globe = new Globe(container)
    .globeImageUrl('https://unpkg.com/three-globe@2.35.1/example/img/earth-blue-marble.jpg')
    .bumpImageUrl('https://unpkg.com/three-globe@2.35.1/example/img/earth-topology.png')
    .backgroundImageUrl('https://unpkg.com/three-globe@2.35.1/example/img/night-sky.png')
    .showAtmosphere(true)
    .atmosphereColor('#4da6ff')
    .atmosphereAltitude(0.2)
    // Points layer for vehicles
    .pointsData([])
    .pointLat((d: any) => d.lat)
    .pointLng((d: any) => d.lng)
    .pointAltitude((d: any) => d.alt)
    .pointColor((d: any) => d.color)
    .pointRadius((d: any) => d.size)
    .pointLabel((d: any) => {
      const v = d.vehicle;
      if (v.type === 'aircraft') {
        return `
          <div style="background:rgba(0,0,0,0.85);padding:8px 12px;border-radius:6px;border:1px solid ${d.color};font-family:monospace;font-size:12px;color:#fff;min-width:180px">
            <div style="color:${d.color};font-weight:bold;font-size:14px;margin-bottom:4px">${v.callsign || v.icao24}</div>
            <div>Type: <span style="color:${d.color}">${v.category.toUpperCase()}</span></div>
            <div>Country: ${v.originCountry}</div>
            <div>Alt: ${v.altitudeFeet.toLocaleString()} ft</div>
            <div>Speed: ${v.speedKnots} kts</div>
            <div>Heading: ${Math.round(v.heading)}°</div>
          </div>`;
      }
      return `
        <div style="background:rgba(0,0,0,0.85);padding:8px 12px;border-radius:6px;border:1px solid ${d.color};font-family:monospace;font-size:12px;color:#fff;min-width:180px">
          <div style="color:${d.color};font-weight:bold;font-size:14px;margin-bottom:4px">${v.name}</div>
          <div>Type: <span style="color:${d.color}">${v.vesselType.toUpperCase()}</span></div>
          <div>Flag: ${v.flag}</div>
          <div>Speed: ${v.speed.toFixed(1)} kts</div>
          <div>Dest: ${v.destination || 'N/A'}</div>
        </div>`;
    })
    .onPointClick((point: any) => {
      if (point?.vehicle) onVehicleClick(point.vehicle);
    })
    // Paths layer for trajectories
    .pathsData([])
    .pathPoints('coords')
    .pathPointLat((p: any) => p[0])
    .pathPointLng((p: any) => p[1])
    .pathPointAlt((p: any) => p[2] || 0)
    .pathColor(() => ['rgba(0,212,255,0.1)', 'rgba(0,212,255,0.8)'])
    .pathStroke(1.5)
    .pathDashLength(0.01)
    .pathDashGap(0.008)
    .pathDashAnimateTime(5000)
    // Arcs for heading prediction
    .arcsData([])
    .arcStartLat((d: any) => d.startLat)
    .arcStartLng((d: any) => d.startLng)
    .arcEndLat((d: any) => d.endLat)
    .arcEndLng((d: any) => d.endLng)
    .arcColor(() => ['rgba(255,255,0,0.6)', 'rgba(255,255,0,0.1)'])
    .arcStroke(1)
    .arcDashLength(0.4)
    .arcDashGap(0.2)
    .arcDashAnimateTime(2000);

  // Add ambient light
  const scene = globe.scene();
  scene.add(new THREE.AmbientLight(0xcccccc, 1.2));

  // Auto-rotate slowly
  const controls = globe.controls() as any;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.3;
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;

  // Stop auto-rotate on user interaction
  container.addEventListener('mousedown', () => { controls.autoRotate = false; });
  container.addEventListener('touchstart', () => { controls.autoRotate = false; });

  // Set initial view
  globe.pointOfView({ lat: 30, lng: 10, altitude: 2.5 }, 0);

  // Responsive
  const handleResize = () => {
    globe.width(container.clientWidth);
    globe.height(container.clientHeight);
  };
  window.addEventListener('resize', handleResize);
  handleResize();

  setTimeout(onGlobeReady, 1500);

  // --- Update methods ---

  function updateVehicles(vehicles: Vehicle[], filters: FilterState) {
    const query = filters.searchQuery.toLowerCase();

    const filtered = vehicles.filter(v => {
      if (v.type === 'aircraft') {
        if (!filters.showAircraft) return false;
        if (!filters.aircraftTypes.has(v.category)) return false;
        if (v.altitudeFeet < filters.altitudeMin || v.altitudeFeet > filters.altitudeMax) return false;
      } else {
        if (!filters.showVessels) return false;
        if (!filters.vesselTypes.has(v.vesselType)) return false;
      }
      if (query) {
        const label = getVehicleLabel(v).toLowerCase();
        const country = v.type === 'aircraft' ? v.originCountry.toLowerCase() : v.flag.toLowerCase();
        if (!label.includes(query) && !country.includes(query)) return false;
      }
      return true;
    });

    const points: GlobePoint[] = filtered.map(v => ({
      id: getVehicleId(v),
      lat: v.latitude,
      lng: v.longitude,
      alt: getVehicleAlt(v),
      color: getVehicleColor(v),
      size: getVehicleSize(v),
      label: getVehicleLabel(v),
      vehicle: v,
      rotation: v.type === 'aircraft' ? v.heading : v.heading,
    }));

    globe.pointsData(points);
  }

  function showTrajectory(vehicle: Vehicle | null) {
    if (!vehicle || vehicle.trajectory.length === 0) {
      globe.pathsData([]);
      globe.arcsData([]);
      return;
    }

    // Past trajectory
    const pathCoords = vehicle.trajectory.map(p => [p.lat, p.lng, 0.001]);
    // Add current position
    pathCoords.push([vehicle.latitude, vehicle.longitude, getVehicleAlt(vehicle)]);

    globe.pathsData([{ coords: pathCoords }]);

    // Future heading prediction (extrapolate ~200km ahead)
    const heading = vehicle.type === 'aircraft' ? vehicle.heading : vehicle.heading;
    const headingRad = (heading * Math.PI) / 180;
    const distance = vehicle.type === 'aircraft' ? 3 : 1.5; // degrees ahead
    const endLat = vehicle.latitude + Math.cos(headingRad) * distance;
    const endLng = vehicle.longitude + Math.sin(headingRad) * distance;

    globe.arcsData([{
      startLat: vehicle.latitude,
      startLng: vehicle.longitude,
      endLat,
      endLng,
    }]);
  }

  function flyTo(lat: number, lng: number) {
    globe.pointOfView({ lat, lng, altitude: 1.0 }, 1000);
  }

  return { globe, updateVehicles, showTrajectory, flyTo };
}
