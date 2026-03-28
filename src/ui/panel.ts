// ============================================================
// Vehicle Info Panel — Detailed information display
// ============================================================

import type { Vehicle, Aircraft, Vessel } from '../types';

export function createInfoPanel(container: HTMLElement, onClose: () => void): {
  show: (vehicle: Vehicle) => void;
  hide: () => void;
} {
  const panel = document.createElement('div');
  panel.id = 'info-panel';
  panel.className = 'info-panel hidden';
  container.appendChild(panel);

  function hide() {
    panel.classList.add('hidden');
  }

  function show(vehicle: Vehicle) {
    panel.classList.remove('hidden');
    if (vehicle.type === 'aircraft') {
      renderAircraftPanel(panel, vehicle, () => { hide(); onClose(); });
    } else {
      renderVesselPanel(panel, vehicle, () => { hide(); onClose(); });
    }
  }

  return { show, hide };
}

function renderAircraftPanel(panel: HTMLElement, a: Aircraft, onClose: () => void) {
  const categoryColors: Record<string, string> = {
    commercial: '#00d4ff',
    private: '#ffd700',
    military: '#ff4444',
    cargo: '#ff8c00',
    helicopter: '#00ff88',
  };
  const color = categoryColors[a.category] || '#00d4ff';

  const verticalTrend = a.verticalRate
    ? a.verticalRate > 1 ? 'CLIMBING' : a.verticalRate < -1 ? 'DESCENDING' : 'LEVEL'
    : 'LEVEL';
  const verticalIcon = a.verticalRate
    ? a.verticalRate > 1 ? '&nearr;' : a.verticalRate < -1 ? '&searr;' : '&rarr;'
    : '&rarr;';
  const verticalColor = a.verticalRate
    ? a.verticalRate > 1 ? '#00ff88' : a.verticalRate < -1 ? '#ff6b6b' : '#888'
    : '#888';

  panel.innerHTML = `
    <div class="panel-header">
      <div class="panel-title">
        <span class="panel-icon" style="color:${color}">&#9992;</span>
        <div>
          <h2 style="color:${color}">${a.callsign || 'UNKNOWN'}</h2>
          <span class="panel-subtitle">${a.category.toUpperCase()} AIRCRAFT</span>
        </div>
      </div>
      <button class="panel-close" id="panel-close">&times;</button>
    </div>

    <div class="panel-section">
      <h3>IDENTIFICATION</h3>
      <div class="panel-grid">
        <div class="panel-field">
          <span class="field-label">ICAO 24</span>
          <span class="field-value">${a.icao24.toUpperCase()}</span>
        </div>
        <div class="panel-field">
          <span class="field-label">Callsign</span>
          <span class="field-value">${a.callsign || 'N/A'}</span>
        </div>
        <div class="panel-field">
          <span class="field-label">Country</span>
          <span class="field-value">${a.originCountry}</span>
        </div>
        <div class="panel-field">
          <span class="field-label">Squawk</span>
          <span class="field-value">${a.squawk || 'N/A'}</span>
        </div>
      </div>
    </div>

    <div class="panel-section">
      <h3>POSITION & ALTITUDE</h3>
      <div class="panel-grid">
        <div class="panel-field">
          <span class="field-label">Latitude</span>
          <span class="field-value">${a.latitude.toFixed(4)}°</span>
        </div>
        <div class="panel-field">
          <span class="field-label">Longitude</span>
          <span class="field-value">${a.longitude.toFixed(4)}°</span>
        </div>
        <div class="panel-field">
          <span class="field-label">Baro Alt</span>
          <span class="field-value">${a.baroAltitude ? Math.round(a.baroAltitude * 3.28084).toLocaleString() + ' ft' : 'N/A'}</span>
        </div>
        <div class="panel-field">
          <span class="field-label">Geo Alt</span>
          <span class="field-value">${a.geoAltitude ? Math.round(a.geoAltitude * 3.28084).toLocaleString() + ' ft' : 'N/A'}</span>
        </div>
        <div class="panel-field full-width">
          <span class="field-label">Vertical</span>
          <span class="field-value" style="color:${verticalColor}">${verticalIcon} ${verticalTrend} ${a.verticalRate ? '(' + (a.verticalRate > 0 ? '+' : '') + Math.round(a.verticalRate * 196.85) + ' ft/min)' : ''}</span>
        </div>
      </div>
    </div>

    <div class="panel-section">
      <h3>DYNAMICS</h3>
      <div class="panel-grid">
        <div class="panel-field">
          <span class="field-label">Speed</span>
          <span class="field-value">${a.speedKnots} kts</span>
        </div>
        <div class="panel-field">
          <span class="field-label">Ground Speed</span>
          <span class="field-value">${a.velocity ? Math.round(a.velocity * 3.6) + ' km/h' : 'N/A'}</span>
        </div>
        <div class="panel-field">
          <span class="field-label">Heading</span>
          <span class="field-value">${Math.round(a.heading)}° ${getCompassDirection(a.heading)}</span>
        </div>
        <div class="panel-field">
          <span class="field-label">Track</span>
          <span class="field-value">${a.trueTrack != null ? Math.round(a.trueTrack) + '°' : 'N/A'}</span>
        </div>
      </div>
    </div>

    <div class="panel-section">
      <h3>TIMING</h3>
      <div class="panel-grid">
        <div class="panel-field">
          <span class="field-label">Last Contact</span>
          <span class="field-value">${formatTime(a.lastContact)}</span>
        </div>
        <div class="panel-field">
          <span class="field-label">Position Age</span>
          <span class="field-value">${a.timePosition ? formatAge(a.timePosition) : 'N/A'}</span>
        </div>
      </div>
    </div>

    <div class="panel-section">
      <h3>TRAJECTORY</h3>
      <div class="trajectory-info">
        <span class="trajectory-count">${a.trajectory.length} waypoints recorded</span>
        ${a.trajectory.length > 0 ? `
        <div class="trajectory-range">
          <span>From: ${formatTime(a.trajectory[0].timestamp)}</span>
          <span>To: ${formatTime(a.trajectory[a.trajectory.length - 1].timestamp)}</span>
        </div>` : ''}
      </div>
    </div>
  `;

  panel.querySelector('#panel-close')!.addEventListener('click', onClose);
}

function renderVesselPanel(panel: HTMLElement, v: Vessel, onClose: () => void) {
  const categoryColors: Record<string, string> = {
    cargo: '#4fc3f7',
    tanker: '#ff7043',
    passenger: '#ab47bc',
    fishing: '#66bb6a',
    military: '#ef5350',
    sailing: '#26c6da',
    tug: '#8d6e63',
  };
  const color = categoryColors[v.vesselType] || '#4fc3f7';

  panel.innerHTML = `
    <div class="panel-header">
      <div class="panel-title">
        <span class="panel-icon" style="color:${color}">&#9875;</span>
        <div>
          <h2 style="color:${color}">${v.name}</h2>
          <span class="panel-subtitle">${v.vesselType.toUpperCase()} VESSEL</span>
        </div>
      </div>
      <button class="panel-close" id="panel-close">&times;</button>
    </div>

    <div class="panel-section">
      <h3>IDENTIFICATION</h3>
      <div class="panel-grid">
        <div class="panel-field">
          <span class="field-label">MMSI</span>
          <span class="field-value">${v.mmsi}</span>
        </div>
        <div class="panel-field">
          <span class="field-label">IMO</span>
          <span class="field-value">${v.imo || 'N/A'}</span>
        </div>
        <div class="panel-field">
          <span class="field-label">Callsign</span>
          <span class="field-value">${v.callsign}</span>
        </div>
        <div class="panel-field">
          <span class="field-label">Flag</span>
          <span class="field-value">${v.flag}</span>
        </div>
      </div>
    </div>

    <div class="panel-section">
      <h3>POSITION</h3>
      <div class="panel-grid">
        <div class="panel-field">
          <span class="field-label">Latitude</span>
          <span class="field-value">${v.latitude.toFixed(4)}°</span>
        </div>
        <div class="panel-field">
          <span class="field-label">Longitude</span>
          <span class="field-value">${v.longitude.toFixed(4)}°</span>
        </div>
        <div class="panel-field">
          <span class="field-label">Course</span>
          <span class="field-value">${Math.round(v.course)}° ${getCompassDirection(v.course)}</span>
        </div>
        <div class="panel-field">
          <span class="field-label">Heading</span>
          <span class="field-value">${Math.round(v.heading)}°</span>
        </div>
      </div>
    </div>

    <div class="panel-section">
      <h3>DYNAMICS</h3>
      <div class="panel-grid">
        <div class="panel-field">
          <span class="field-label">Speed</span>
          <span class="field-value">${v.speed.toFixed(1)} kts</span>
        </div>
        <div class="panel-field">
          <span class="field-label">Status</span>
          <span class="field-value status-badge">${v.status}</span>
        </div>
      </div>
    </div>

    <div class="panel-section">
      <h3>VESSEL DETAILS</h3>
      <div class="panel-grid">
        <div class="panel-field">
          <span class="field-label">Length</span>
          <span class="field-value">${v.length} m</span>
        </div>
        <div class="panel-field">
          <span class="field-label">Width</span>
          <span class="field-value">${v.width} m</span>
        </div>
        <div class="panel-field">
          <span class="field-label">Draught</span>
          <span class="field-value">${v.draught} m</span>
        </div>
        <div class="panel-field">
          <span class="field-label">Type</span>
          <span class="field-value">${v.vesselType.charAt(0).toUpperCase() + v.vesselType.slice(1)}</span>
        </div>
      </div>
    </div>

    <div class="panel-section">
      <h3>VOYAGE</h3>
      <div class="panel-grid">
        <div class="panel-field">
          <span class="field-label">Destination</span>
          <span class="field-value">${v.destination || 'N/A'}</span>
        </div>
        <div class="panel-field">
          <span class="field-label">ETA</span>
          <span class="field-value">${v.eta || 'N/A'}</span>
        </div>
      </div>
    </div>

    <div class="panel-section">
      <h3>TRAJECTORY</h3>
      <div class="trajectory-info">
        <span class="trajectory-count">${v.trajectory.length} waypoints recorded</span>
        ${v.trajectory.length > 0 ? `
        <div class="trajectory-range">
          <span>From: ${formatTime(v.trajectory[0].timestamp)}</span>
          <span>To: ${formatTime(v.trajectory[v.trajectory.length - 1].timestamp)}</span>
        </div>` : ''}
      </div>
    </div>

    <div class="panel-section">
      <h3>LAST UPDATE</h3>
      <div class="panel-grid">
        <div class="panel-field full-width">
          <span class="field-label">Received</span>
          <span class="field-value">${formatTime(v.lastUpdate)} (${formatAge(v.lastUpdate)})</span>
        </div>
      </div>
    </div>
  `;

  panel.querySelector('#panel-close')!.addEventListener('click', onClose);
}

function getCompassDirection(degrees: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const i = Math.round(degrees / 22.5) % 16;
  return dirs[i];
}

function formatTime(unix: number): string {
  return new Date(unix * 1000).toUTCString().replace('GMT', 'UTC');
}

function formatAge(unix: number): string {
  const diff = Math.floor(Date.now() / 1000) - unix;
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m ago`;
}
