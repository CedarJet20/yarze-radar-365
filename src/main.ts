// ============================================================
// Yarze Radar 365 — Global Air & Maritime Traffic Tracker
// ============================================================

import './style.css';
import { createGlobe } from './globe/globe';
import { createInfoPanel } from './ui/panel';
import { createControls } from './ui/controls';
import { fetchAllAircraft, fetchAircraftTrack } from './data/opensky';
import { fetchAllVessels } from './data/maritime';
import type { Vehicle, FilterState, AppState } from './types';

// --- App State ---
const state: AppState = {
  vehicles: new Map(),
  selectedVehicle: null,
  filters: {
    showAircraft: true,
    showVessels: true,
    aircraftTypes: new Set(['commercial', 'private', 'military', 'cargo', 'helicopter']),
    vesselTypes: new Set(['cargo', 'tanker', 'passenger', 'fishing', 'military', 'sailing', 'tug']),
    searchQuery: '',
    altitudeMin: 0,
    altitudeMax: 60000,
  },
  isLoading: true,
  lastUpdate: 0,
  globeReady: false,
};

// --- DOM Setup ---
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div id="globe-container"></div>
  <div id="ui-overlay">
    <div id="right-panel-column"></div>
  </div>
  <div id="loading-screen" class="loading-screen">
    <div class="loading-content">
      <div class="loading-globe"></div>
      <h1>YARZE RADAR 365</h1>
      <p>Initializing global tracking systems...</p>
      <div class="loading-bar"><div class="loading-fill"></div></div>
      <div class="loading-status" id="loading-status">Connecting to data sources...</div>
    </div>
  </div>
`;

const globeContainer = document.getElementById('globe-container')!;
const rightColumn = document.getElementById('right-panel-column')!;
const loadingScreen = document.getElementById('loading-screen')!;
const loadingStatus = document.getElementById('loading-status')!;

// --- Initialize Globe ---
const { updateVehicles, showTrajectory, setSelectedVehicle } = createGlobe(
  globeContainer,
  onVehicleClick,
  onGlobeReady
);

// --- Initialize UI (both panels go into the right column) ---
const controls = createControls(rightColumn, state.filters, onFiltersChanged);

const infoPanel = createInfoPanel(rightColumn, () => {
  state.selectedVehicle = null;
  setSelectedVehicle(null);
  showTrajectory(null);
});

// --- Event Handlers ---

function onGlobeReady() {
  state.globeReady = true;
  console.log('[YR365] Globe ready');
  loadingStatus.textContent = 'Globe ready. Loading traffic data...';
  loadData();
}

// Safety: force hide loading screen after 30s even if load fails
setTimeout(() => {
  if (loadingScreen.style.display !== 'none') {
    console.warn('[YR365] Force-hiding loading screen after timeout');
    loadingScreen.classList.add('fade-out');
    setTimeout(() => { loadingScreen.style.display = 'none'; }, 600);
  }
}, 30000);

function onVehicleClick(vehicle: Vehicle) {
  state.selectedVehicle = vehicle;
  const id = vehicle.type === 'aircraft' ? vehicle.icao24 : vehicle.mmsi;
  setSelectedVehicle(id);
  infoPanel.show(vehicle);
  showTrajectory(vehicle);

  // Try to fetch detailed trajectory for aircraft
  if (vehicle.type === 'aircraft' && vehicle.trajectory.length === 0) {
    fetchAircraftTrack(vehicle.icao24).then(track => {
      if (track.length > 0) {
        vehicle.trajectory = track;
        showTrajectory(vehicle);
        infoPanel.show(vehicle);
      }
    });
  }
}

function onFiltersChanged(filters: FilterState) {
  state.filters = filters;
  renderVehicles();
}

function renderVehicles() {
  const allVehicles = Array.from(state.vehicles.values());
  updateVehicles(allVehicles, state.filters);
}

// --- Data Loading ---

async function loadData() {
  loadingStatus.textContent = 'Fetching air traffic data...';
  console.log('[YR365] Starting data load...');

  try {
    const [aircraft, vessels] = await Promise.all([
      fetchAllAircraft(),
      Promise.resolve(fetchAllVessels()),
    ]);

    console.log(`[YR365] Loaded ${aircraft.length} aircraft, ${vessels.length} vessels`);
    loadingStatus.textContent = `Loaded ${aircraft.length} aircraft, ${vessels.length} vessels`;

    state.vehicles.clear();
    aircraft.forEach(a => state.vehicles.set(a.icao24, a));
    vessels.forEach(v => state.vehicles.set(v.mmsi, v));
    state.lastUpdate = Date.now();

    controls.updateStats(aircraft.length, vessels.length);
    renderVehicles();
    console.log(`[YR365] Rendered ${state.vehicles.size} vehicles on globe`);

    // Hide loading screen
    setTimeout(() => {
      loadingScreen.classList.add('fade-out');
      setTimeout(() => { loadingScreen.style.display = 'none'; }, 600);
    }, 800);

    state.isLoading = false;
  } catch (err) {
    console.error('[YR365] Failed to load data:', err);
    loadingStatus.textContent = 'Error loading data. Retrying...';
    setTimeout(loadData, 5000);
  }
}

// --- Manual refresh (no auto-refresh to conserve API quota) ---
async function refreshData() {
  if (state.isLoading) return;
  state.isLoading = true;
  console.log('[YR365] Manual refresh...');

  try {
    const [aircraft, vessels] = await Promise.all([
      fetchAllAircraft(),
      Promise.resolve(fetchAllVessels()),
    ]);

    // Update state preserving trajectories
    aircraft.forEach(a => {
      const existing = state.vehicles.get(a.icao24);
      if (existing && existing.type === 'aircraft' && existing.trajectory.length > 0) {
        a.trajectory = existing.trajectory;
        a.trajectory.push({
          lat: a.latitude,
          lng: a.longitude,
          alt: a.geoAltitude ?? a.baroAltitude ?? undefined,
          timestamp: a.lastContact,
        });
        if (a.trajectory.length > 100) a.trajectory = a.trajectory.slice(-100);
      }
      state.vehicles.set(a.icao24, a);
    });

    vessels.forEach(v => {
      const existing = state.vehicles.get(v.mmsi);
      if (existing && existing.type === 'vessel') {
        v.trajectory = existing.trajectory;
      }
      state.vehicles.set(v.mmsi, v);
    });

    state.lastUpdate = Date.now();
    controls.updateStats(aircraft.length, vessels.length);
    renderVehicles();

    // Update selected vehicle panel if still selected
    if (state.selectedVehicle) {
      const id = state.selectedVehicle.type === 'aircraft'
        ? state.selectedVehicle.icao24
        : (state.selectedVehicle as any).mmsi;
      const updated = state.vehicles.get(id);
      if (updated) {
        state.selectedVehicle = updated;
        infoPanel.show(updated);
        showTrajectory(updated);
      }
    }
  } catch (err) {
    console.warn('Refresh failed:', err);
  }

  state.isLoading = false;
}

// Expose refresh for the UI button
(window as any).__refreshData = refreshData;
