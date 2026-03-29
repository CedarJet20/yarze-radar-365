// ============================================================
// Globe Renderer — globe.gl + Three.js
// Uses customLayerData with rotated textures for heading-aware icons
// ============================================================

import Globe from 'globe.gl';
import type { GlobeInstance } from 'globe.gl';
import * as THREE from 'three';
import type { Vehicle, FilterState } from '../types';
import { AIRPORTS } from '../data/airports';

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
// Canvas texture generation — heading is baked into the texture
// ============================================================

function createRotatedTexture(
  type: 'aircraft' | 'vessel',
  color: string,
  headingDeg: number,
  selected: boolean
): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, size, size);

  // Draw selection ring BEFORE rotating (so it stays circular)
  if (selected) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.4, 0, Math.PI * 2);
    ctx.stroke();
    // Second ring for pulsing glow effect
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.43, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Rotate the canvas to bake heading into the texture
  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.rotate((headingDeg * Math.PI) / 180);
  ctx.translate(-size / 2, -size / 2);

  if (type === 'aircraft') {
    drawAircraftIcon(ctx, size, color);
  } else {
    drawVesselIcon(ctx, size, color);
  }

  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function drawAircraftIcon(ctx: CanvasRenderingContext2D, size: number, color: string) {
  const cx = size / 2;
  const cy = size / 2;
  const s = size * 0.35;

  ctx.shadowColor = color;
  ctx.shadowBlur = 12;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - s);
  ctx.lineTo(cx + s * 0.12, cy - s * 0.6);
  ctx.lineTo(cx + s * 0.8, cy + s * 0.1);
  ctx.lineTo(cx + s * 0.75, cy + s * 0.22);
  ctx.lineTo(cx + s * 0.12, cy + s * 0.05);
  ctx.lineTo(cx + s * 0.12, cy + s * 0.5);
  ctx.lineTo(cx + s * 0.4, cy + s * 0.72);
  ctx.lineTo(cx + s * 0.35, cy + s * 0.82);
  ctx.lineTo(cx, cy + s * 0.65);
  ctx.lineTo(cx - s * 0.35, cy + s * 0.82);
  ctx.lineTo(cx - s * 0.4, cy + s * 0.72);
  ctx.lineTo(cx - s * 0.12, cy + s * 0.5);
  ctx.lineTo(cx - s * 0.12, cy + s * 0.05);
  ctx.lineTo(cx - s * 0.75, cy + s * 0.22);
  ctx.lineTo(cx - s * 0.8, cy + s * 0.1);
  ctx.lineTo(cx - s * 0.12, cy - s * 0.6);
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.ellipse(cx - s * 0.38, cy + s * 0.08, s * 0.06, s * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + s * 0.38, cy + s * 0.08, s * 0.06, s * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.ellipse(cx, cy - s * 0.78, s * 0.07, s * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawVesselIcon(ctx: CanvasRenderingContext2D, size: number, color: string) {
  const cx = size / 2;
  const cy = size / 2;
  const s = size * 0.32;

  ctx.shadowColor = color;
  ctx.shadowBlur = 10;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - s);
  ctx.lineTo(cx + s * 0.35, cy - s * 0.4);
  ctx.lineTo(cx + s * 0.35, cy + s * 0.5);
  ctx.lineTo(cx + s * 0.25, cy + s * 0.75);
  ctx.lineTo(cx, cy + s * 0.85);
  ctx.lineTo(cx - s * 0.25, cy + s * 0.75);
  ctx.lineTo(cx - s * 0.35, cy + s * 0.5);
  ctx.lineTo(cx - s * 0.35, cy - s * 0.4);
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(cx - s * 0.15, cy + s * 0.15, s * 0.3, s * 0.25);
}

// ============================================================
// Datum type for customLayerData
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
  selected: boolean;
}

// Globe radius constant (matches three-globe internal value)
const GLOBE_RADIUS = 100;

// Convert lat/lng/alt to 3D position on the globe
function polar2Cartesian(lat: number, lng: number, relAltitude: number) {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (90 - lng) * Math.PI / 180;
  const r = GLOBE_RADIUS * (1 + relAltitude);
  const sinPhi = Math.sin(phi);
  return {
    x: r * sinPhi * Math.cos(theta),
    y: r * Math.cos(phi),
    z: r * sinPhi * Math.sin(theta),
  };
}

// ============================================================
// Globe creation
// ============================================================

// Track currently selected vehicle ID for highlight rendering
let selectedVehicleId: string | null = null;

export function createGlobe(
  container: HTMLElement,
  onVehicleClick: (vehicle: Vehicle) => void,
  onGlobeReady: () => void
): {
  globe: GlobeInstance;
  updateVehicles: (vehicles: Vehicle[], filters: FilterState) => void;
  showTrajectory: (vehicle: Vehicle | null) => void;
  flyTo: (lat: number, lng: number) => void;
  setSelectedVehicle: (id: string | null) => void;
} {
  const globe = new Globe(container)
    .globeImageUrl('https://unpkg.com/three-globe@2.35.1/example/img/earth-blue-marble.jpg')
    .bumpImageUrl('https://unpkg.com/three-globe@2.35.1/example/img/earth-topology.png')
    .backgroundImageUrl('https://unpkg.com/three-globe@2.35.1/example/img/night-sky.png')
    .showAtmosphere(true)
    .atmosphereColor('#4da6ff')
    .atmosphereAltitude(0.2)
    // Custom layer for vehicle sprites
    .customLayerData([])
    .customThreeObject((d: any) => {
      const datum = d as VehicleDatum;
      const texture = createRotatedTexture(
        datum.vehicle.type,
        datum.color,
        datum.heading,
        datum.selected
      );
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(material);
      const scale = datum.selected ? 3.0 : 1.8;
      sprite.scale.set(scale, scale, 1);

      // Position the sprite on the globe
      const pos = polar2Cartesian(datum.lat, datum.lng, datum.alt);
      sprite.position.set(pos.x, pos.y, pos.z);

      return sprite;
    })
    .customThreeObjectUpdate((obj: any, d: any) => {
      const datum = d as VehicleDatum;
      const sprite = obj as THREE.Sprite;

      // Update position
      const pos = polar2Cartesian(datum.lat, datum.lng, datum.alt);
      sprite.position.set(pos.x, pos.y, pos.z);

      // Always regenerate texture on update (heading/selection may have changed)
      const texture = createRotatedTexture(
        datum.vehicle.type,
        datum.color,
        datum.heading,
        datum.selected
      );
      const mat = sprite.material as THREE.SpriteMaterial;
      if (mat.map) mat.map.dispose();
      mat.map = texture;
      mat.needsUpdate = true;

      const scale = datum.selected ? 3.0 : 1.8;
      sprite.scale.set(scale, scale, 1);
    })
    .customLayerLabel((d: any) => {
      const datum = d as VehicleDatum;
      const v = datum.vehicle;
      if (v.type === 'aircraft') {
        return `<div class="globe-tooltip">
          <b>${datum.label}</b><br/>
          ${v.airlineName || v.originCountry}<br/>
          ${v.altitudeFeet.toLocaleString()} ft &middot; ${v.speedKnots} kts
        </div>`;
      }
      return `<div class="globe-tooltip">
        <b>${datum.label}</b><br/>
        ${v.flag} &middot; ${v.vesselType}<br/>
        ${v.speed.toFixed(1)} kts &rarr; ${v.destination}
      </div>`;
    })
    // Airport labels layer
    .labelsData(Object.values(AIRPORTS).map(a => ({
      lat: a.lat,
      lng: a.lng,
      text: a.iata,
      size: 0.4,
      color: 'rgba(255, 200, 50, 0.85)',
      airport: a,
    })))
    .labelLat((d: any) => d.lat)
    .labelLng((d: any) => d.lng)
    .labelText((d: any) => d.text)
    .labelSize((d: any) => d.size)
    .labelColor((d: any) => d.color)
    .labelDotRadius(0.3)
    .labelDotOrientation(() => 'bottom' as const)
    .labelAltitude(0.001)
    .labelResolution(2)
    .labelLabel((d: any) => `<div class="globe-tooltip"><b>${d.airport.iata}</b> — ${d.airport.name}<br/>${d.airport.city}, ${d.airport.country}</div>`)
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

  // Click handler — globe.gl passes the datum object directly
  globe.onCustomLayerClick((obj: any) => {
    const datum = obj as VehicleDatum;
    if (datum && datum.vehicle) {
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

  // --- State ---
  let lastData: VehicleDatum[] = [];

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

    lastData = filtered.map(v => {
      const id = getVehicleId(v);
      return {
        id,
        lat: v.latitude,
        lng: v.longitude,
        alt: getVehicleAlt(v),
        vehicle: v,
        color: getVehicleColor(v),
        heading: v.heading,
        label: getVehicleLabel(v),
        selected: id === selectedVehicleId,
      };
    });

    globe.customLayerData(lastData);
  }

  function setSelectedVehicle(id: string | null) {
    selectedVehicleId = id;
    // Re-render with updated selection state
    if (lastData.length > 0) {
      lastData = lastData.map(d => ({
        ...d,
        selected: d.id === selectedVehicleId,
      }));
      globe.customLayerData(lastData);
    }
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

  return { globe, updateVehicles, showTrajectory, flyTo, setSelectedVehicle };
}
