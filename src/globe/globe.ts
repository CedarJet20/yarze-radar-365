// ============================================================
// Globe Renderer — globe.gl + Three.js
// Same world physics as worldmonitor.app
// ============================================================

import Globe from 'globe.gl';
import type { GlobeInstance } from 'globe.gl';
import * as THREE from 'three';
import type { Vehicle, FilterState } from '../types';
import { createVehicleElement } from '../ui/icons';

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

function getVehicleAlt(v: Vehicle): number {
  if (v.type === 'aircraft') {
    const alt = v.geoAltitude ?? v.baroAltitude ?? 0;
    return Math.max(0.005, alt / 1_000_000);
  }
  return 0.001;
}

function getVehicleLabel(v: Vehicle): string {
  if (v.type === 'aircraft') return v.callsign || v.icao24;
  return v.name || v.mmsi;
}

function getVehicleId(v: Vehicle): string {
  return v.type === 'aircraft' ? v.icao24 : v.mmsi;
}

interface HtmlDatum {
  id: string;
  lat: number;
  lng: number;
  alt: number;
  vehicle: Vehicle;
  color: string;
}

// Cache for HTML elements to avoid re-creating on every update
const elementCache = new Map<string, HTMLDivElement>();

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
    // HTML elements layer for vehicle icons
    .htmlElementsData([])
    .htmlLat((d: any) => d.lat)
    .htmlLng((d: any) => d.lng)
    .htmlAltitude((d: any) => d.alt)
    .htmlElement((d: any) => {
      const datum = d as HtmlDatum;
      const v = datum.vehicle;
      const id = datum.id;
      const color = datum.color;

      // Re-use cached element if exists, update rotation
      let el = elementCache.get(id);
      if (el) {
        const heading = v.type === 'aircraft' ? v.heading : v.heading;
        el.style.transform = `rotate(${heading}deg)`;
        const labelEl = el.querySelector('.vehicle-label') as HTMLElement;
        if (labelEl) labelEl.style.transform = `rotate(${-heading}deg)`;
        return el;
      }

      // Create new element
      const heading = v.type === 'aircraft' ? v.heading : v.heading;
      const subtype = v.type === 'aircraft' ? v.aircraftSize : v.vesselType;
      const engines = v.type === 'aircraft' ? v.engineCount : 0;
      const label = getVehicleLabel(v);

      el = createVehicleElement(v.type, subtype, engines, color, heading, label);
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onVehicleClick(v);
      });
      el.style.cursor = 'pointer';

      elementCache.set(id, el);
      return el;
    })
    .htmlTransitionDuration(800)
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
        const extra = v.type === 'aircraft'
          ? (v.airlineName + ' ' + v.tailNumber + ' ' + v.aircraftModel).toLowerCase()
          : v.destination.toLowerCase();
        if (!label.includes(query) && !country.includes(query) && !extra.includes(query)) return false;
      }
      return true;
    });

    // Clear stale cache entries
    const activeIds = new Set(filtered.map(v => getVehicleId(v)));
    for (const [id] of elementCache) {
      if (!activeIds.has(id)) elementCache.delete(id);
    }

    const htmlData: HtmlDatum[] = filtered.map(v => ({
      id: getVehicleId(v),
      lat: v.latitude,
      lng: v.longitude,
      alt: getVehicleAlt(v),
      vehicle: v,
      color: getVehicleColor(v),
    }));

    globe.htmlElementsData(htmlData);
  }

  function showTrajectory(vehicle: Vehicle | null) {
    if (!vehicle || vehicle.trajectory.length === 0) {
      globe.pathsData([]);
      globe.arcsData([]);
      return;
    }

    const pathCoords = vehicle.trajectory.map(p => [p.lat, p.lng, 0.001]);
    pathCoords.push([vehicle.latitude, vehicle.longitude, getVehicleAlt(vehicle)]);

    globe.pathsData([{ coords: pathCoords }]);

    // Future heading prediction
    const heading = vehicle.type === 'aircraft' ? vehicle.heading : vehicle.heading;
    const headingRad = (heading * Math.PI) / 180;
    const distance = vehicle.type === 'aircraft' ? 3 : 1.5;
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
