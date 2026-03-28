// ============================================================
// Globe Renderer — globe.gl + Three.js
// Uses objectsData with Three.js Sprites for jitter-free rendering
// ============================================================

import Globe from 'globe.gl';
import type { GlobeInstance } from 'globe.gl';
import * as THREE from 'three';
import type { Vehicle, FilterState } from '../types';

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

// ============================================================
// Canvas texture generation for vehicle sprites
// ============================================================

const textureCache = new Map<string, THREE.CanvasTexture>();

function getVehicleTexture(type: 'aircraft' | 'vessel', color: string): THREE.CanvasTexture {
  const key = `${type}-${color}`;
  let tex = textureCache.get(key);
  if (tex) return tex;

  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, size, size);

  if (type === 'aircraft') {
    drawAircraftIcon(ctx, size, color);
  } else {
    drawVesselIcon(ctx, size, color);
  }

  tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  textureCache.set(key, tex);
  return tex;
}

function drawAircraftIcon(ctx: CanvasRenderingContext2D, size: number, color: string) {
  const cx = size / 2;
  const cy = size / 2;
  const s = size * 0.38;

  // Glow
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;

  ctx.fillStyle = color;
  ctx.beginPath();
  // Aircraft silhouette pointing UP (nose at top)
  ctx.moveTo(cx, cy - s);                     // nose
  ctx.lineTo(cx + s * 0.12, cy - s * 0.6);    // right fuselage
  ctx.lineTo(cx + s * 0.75, cy + s * 0.15);   // right wing tip
  ctx.lineTo(cx + s * 0.7, cy + s * 0.25);    // right wing trailing edge
  ctx.lineTo(cx + s * 0.12, cy + s * 0.05);   // right wing root
  ctx.lineTo(cx + s * 0.12, cy + s * 0.45);   // right fuselage aft
  ctx.lineTo(cx + s * 0.4, cy + s * 0.7);     // right stabilizer tip
  ctx.lineTo(cx + s * 0.35, cy + s * 0.8);    // right stabilizer trailing
  ctx.lineTo(cx, cy + s * 0.6);               // tail center
  // Mirror left side
  ctx.lineTo(cx - s * 0.35, cy + s * 0.8);
  ctx.lineTo(cx - s * 0.4, cy + s * 0.7);
  ctx.lineTo(cx - s * 0.12, cy + s * 0.45);
  ctx.lineTo(cx - s * 0.12, cy + s * 0.05);
  ctx.lineTo(cx - s * 0.7, cy + s * 0.25);
  ctx.lineTo(cx - s * 0.75, cy + s * 0.15);
  ctx.lineTo(cx - s * 0.12, cy - s * 0.6);
  ctx.closePath();
  ctx.fill();

  // Cockpit highlight
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.ellipse(cx, cy - s * 0.75, s * 0.08, s * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawVesselIcon(ctx: CanvasRenderingContext2D, size: number, color: string) {
  const cx = size / 2;
  const cy = size / 2;
  const s = size * 0.35;

  // Glow
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;

  ctx.fillStyle = color;
  ctx.beginPath();
  // Ship hull pointing UP (bow at top)
  ctx.moveTo(cx, cy - s);                      // bow point
  ctx.lineTo(cx + s * 0.35, cy - s * 0.4);     // right bow
  ctx.lineTo(cx + s * 0.35, cy + s * 0.5);     // right hull
  ctx.lineTo(cx + s * 0.25, cy + s * 0.75);    // right stern
  ctx.lineTo(cx, cy + s * 0.85);               // stern center
  ctx.lineTo(cx - s * 0.25, cy + s * 0.75);    // left stern
  ctx.lineTo(cx - s * 0.35, cy + s * 0.5);     // left hull
  ctx.lineTo(cx - s * 0.35, cy - s * 0.4);     // left bow
  ctx.closePath();
  ctx.fill();

  // Bridge
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(cx - s * 0.15, cy + s * 0.15, s * 0.3, s * 0.25);
}

// ============================================================
// Datum type for objectsData layer
// ============================================================

interface VehicleDatum {
  id: string;
  lat: number;
  lng: number;
  alt: number;
  vehicle: Vehicle;
  color: string;
  heading: number;
  label: string;
}

// ============================================================
// Globe creation
// ============================================================

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
    // Objects layer for vehicle sprites (WebGL-native, no jitter)
    .objectsData([])
    .objectLat((d: any) => (d as VehicleDatum).lat)
    .objectLng((d: any) => (d as VehicleDatum).lng)
    .objectAltitude((d: any) => (d as VehicleDatum).alt)
    .objectFacesSurface(false as any) // billboard mode - always face camera
    .objectRotation((d: any) => {
      // Rotate around Z axis so arrow points in heading direction
      // Icons are drawn pointing up (0°), heading is clockwise from north
      const datum = d as VehicleDatum;
      return { x: 0, y: 0, z: -datum.heading };
    })
    .objectThreeObject((d: any) => {
      const datum = d as VehicleDatum;
      const texture = getVehicleTexture(datum.vehicle.type, datum.color);
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        sizeAttenuation: true,
      });
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(2.5, 2.5, 1);
      // Store vehicle data for click identification
      sprite.userData = { vehicleDatum: datum };
      return sprite;
    })
    .objectLabel((d: any) => {
      const datum = d as VehicleDatum;
      const v = datum.vehicle;
      if (v.type === 'aircraft') {
        return `<div class="globe-tooltip">
          <b>${datum.label}</b><br/>
          ${v.airlineName || v.originCountry}<br/>
          ${v.altitudeFeet.toLocaleString()} ft · ${v.speedKnots} kts
        </div>`;
      }
      return `<div class="globe-tooltip">
        <b>${datum.label}</b><br/>
        ${v.flag} · ${v.vesselType}<br/>
        ${v.speed} kts → ${v.destination}
      </div>`;
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

  // Click handler for vehicle objects
  globe.onObjectClick((obj: any) => {
    const datum = obj as VehicleDatum;
    if (datum.vehicle) {
      onVehicleClick(datum.vehicle);
    }
  });

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

    const data: VehicleDatum[] = filtered.map(v => ({
      id: getVehicleId(v),
      lat: v.latitude,
      lng: v.longitude,
      alt: getVehicleAlt(v),
      vehicle: v,
      color: getVehicleColor(v),
      heading: v.heading,
      label: getVehicleLabel(v),
    }));

    globe.objectsData(data);
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
    const headingRad = (vehicle.heading * Math.PI) / 180;
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
