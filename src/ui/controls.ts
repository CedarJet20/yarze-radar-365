// ============================================================
// Filter Controls & Search — UI Controls
// ============================================================

import type { FilterState, VehicleCategory, VesselCategory } from '../types';

export function createControls(
  container: HTMLElement,
  initialFilters: FilterState,
  onChange: (filters: FilterState) => void
): {
  getFilters: () => FilterState;
  updateStats: (aircraftCount: number, vesselCount: number) => void;
} {
  const filters = { ...initialFilters };

  const controlsEl = document.createElement('div');
  controlsEl.id = 'controls';
  controlsEl.className = 'controls';

  controlsEl.innerHTML = `
    <div class="controls-header">
      <div class="logo">
        <span class="logo-icon">&#9201;</span>
        <span class="logo-text">YARZE RADAR 365</span>
      </div>
      <div class="stats" id="stats">
        <span id="stat-aircraft">0 aircraft</span>
        <span class="stat-sep">|</span>
        <span id="stat-vessels">0 vessels</span>
      </div>
    </div>

    <div class="search-bar">
      <input type="text" id="search-input" placeholder="Search callsign, name, country..." autocomplete="off" />
      <span class="search-icon">&#128269;</span>
    </div>

    <div class="filter-group">
      <div class="filter-header" id="toggle-air-section">
        <label class="toggle-label">
          <input type="checkbox" id="toggle-aircraft" checked />
          <span class="toggle-switch"></span>
          <span>&#9992; AIR TRAFFIC</span>
        </label>
        <span class="expand-icon" id="air-expand">&#9660;</span>
      </div>
      <div class="filter-options" id="air-options">
        <label class="chip-label commercial-chip">
          <input type="checkbox" data-aircraft-type="commercial" checked />
          <span class="chip">Commercial</span>
        </label>
        <label class="chip-label private-chip">
          <input type="checkbox" data-aircraft-type="private" checked />
          <span class="chip">Private</span>
        </label>
        <label class="chip-label military-chip">
          <input type="checkbox" data-aircraft-type="military" checked />
          <span class="chip">Military</span>
        </label>
        <label class="chip-label cargo-chip">
          <input type="checkbox" data-aircraft-type="cargo" checked />
          <span class="chip">Cargo</span>
        </label>
        <label class="chip-label helicopter-chip">
          <input type="checkbox" data-aircraft-type="helicopter" checked />
          <span class="chip">Helicopter</span>
        </label>
      </div>
    </div>

    <div class="filter-group">
      <div class="filter-header" id="toggle-sea-section">
        <label class="toggle-label">
          <input type="checkbox" id="toggle-vessels" checked />
          <span class="toggle-switch"></span>
          <span>&#9875; SEA TRAFFIC</span>
        </label>
        <span class="expand-icon" id="sea-expand">&#9660;</span>
      </div>
      <div class="filter-options" id="sea-options">
        <label class="chip-label cargo-sea-chip">
          <input type="checkbox" data-vessel-type="cargo" checked />
          <span class="chip">Cargo</span>
        </label>
        <label class="chip-label tanker-chip">
          <input type="checkbox" data-vessel-type="tanker" checked />
          <span class="chip">Tanker</span>
        </label>
        <label class="chip-label passenger-chip">
          <input type="checkbox" data-vessel-type="passenger" checked />
          <span class="chip">Passenger</span>
        </label>
        <label class="chip-label fishing-chip">
          <input type="checkbox" data-vessel-type="fishing" checked />
          <span class="chip">Fishing</span>
        </label>
        <label class="chip-label military-sea-chip">
          <input type="checkbox" data-vessel-type="military" checked />
          <span class="chip">Military</span>
        </label>
        <label class="chip-label sailing-chip">
          <input type="checkbox" data-vessel-type="sailing" checked />
          <span class="chip">Sailing</span>
        </label>
        <label class="chip-label tug-chip">
          <input type="checkbox" data-vessel-type="tug" checked />
          <span class="chip">Tug</span>
        </label>
      </div>
    </div>

    <div class="filter-group altitude-group">
      <div class="filter-header">
        <span>&#9650; ALTITUDE FILTER</span>
      </div>
      <div class="altitude-controls">
        <div class="altitude-input">
          <label>Min</label>
          <input type="number" id="alt-min" value="0" min="0" max="60000" step="1000" />
          <span>ft</span>
        </div>
        <div class="altitude-input">
          <label>Max</label>
          <input type="number" id="alt-max" value="60000" min="0" max="60000" step="1000" />
          <span>ft</span>
        </div>
      </div>
    </div>

    <div class="controls-footer">
      <div class="update-time">
        Last update: <span id="last-update">--</span>
      </div>
      <div class="data-source">
        Air: OpenSky Network ADS-B<br/>
        Sea: AIS Simulation
      </div>
    </div>
  `;

  container.appendChild(controlsEl);

  // Event: search
  const searchInput = controlsEl.querySelector('#search-input') as HTMLInputElement;
  let searchTimeout: number;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = window.setTimeout(() => {
      filters.searchQuery = searchInput.value;
      onChange(filters);
    }, 200);
  });

  // Event: aircraft toggle
  controlsEl.querySelector('#toggle-aircraft')!.addEventListener('change', (e) => {
    filters.showAircraft = (e.target as HTMLInputElement).checked;
    onChange(filters);
  });

  // Event: vessel toggle
  controlsEl.querySelector('#toggle-vessels')!.addEventListener('change', (e) => {
    filters.showVessels = (e.target as HTMLInputElement).checked;
    onChange(filters);
  });

  // Event: aircraft type chips
  controlsEl.querySelectorAll('[data-aircraft-type]').forEach(el => {
    el.addEventListener('change', (e) => {
      const t = (e.target as HTMLInputElement).dataset.aircraftType as VehicleCategory;
      if ((e.target as HTMLInputElement).checked) {
        filters.aircraftTypes.add(t);
      } else {
        filters.aircraftTypes.delete(t);
      }
      onChange(filters);
    });
  });

  // Event: vessel type chips
  controlsEl.querySelectorAll('[data-vessel-type]').forEach(el => {
    el.addEventListener('change', (e) => {
      const t = (e.target as HTMLInputElement).dataset.vesselType as VesselCategory;
      if ((e.target as HTMLInputElement).checked) {
        filters.vesselTypes.add(t);
      } else {
        filters.vesselTypes.delete(t);
      }
      onChange(filters);
    });
  });

  // Event: altitude filters
  controlsEl.querySelector('#alt-min')!.addEventListener('change', (e) => {
    filters.altitudeMin = parseInt((e.target as HTMLInputElement).value) || 0;
    onChange(filters);
  });
  controlsEl.querySelector('#alt-max')!.addEventListener('change', (e) => {
    filters.altitudeMax = parseInt((e.target as HTMLInputElement).value) || 60000;
    onChange(filters);
  });

  // Expand/collapse
  controlsEl.querySelector('#toggle-air-section')!.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    controlsEl.querySelector('#air-options')!.classList.toggle('collapsed');
    const icon = controlsEl.querySelector('#air-expand')!;
    icon.textContent = icon.textContent === '\u25BC' ? '\u25B6' : '\u25BC';
  });
  controlsEl.querySelector('#toggle-sea-section')!.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    controlsEl.querySelector('#sea-options')!.classList.toggle('collapsed');
    const icon = controlsEl.querySelector('#sea-expand')!;
    icon.textContent = icon.textContent === '\u25BC' ? '\u25B6' : '\u25BC';
  });

  function updateStats(aircraftCount: number, vesselCount: number) {
    controlsEl.querySelector('#stat-aircraft')!.textContent = `${aircraftCount.toLocaleString()} aircraft`;
    controlsEl.querySelector('#stat-vessels')!.textContent = `${vesselCount} vessels`;
    controlsEl.querySelector('#last-update')!.textContent = new Date().toLocaleTimeString();
  }

  return { getFilters: () => filters, updateStats };
}
