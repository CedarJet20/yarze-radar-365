// ============================================================
// Vehicle SVG Icons — FlightRadar24-inspired top-down silhouettes
// Accurate representations showing engines, wingspan, fuselage
// ============================================================

import type { AircraftSize } from '../data/aircraft-db';
import type { VesselCategory } from '../types';

// All SVGs are top-down view, pointing UP (north), 40x40 viewBox
// Rotate via CSS transform based on heading

export function getAircraftSVG(size: AircraftSize, engines: number, color: string): string {
  switch (size) {
    case 'narrow-body': return narrowBodySVG(color);
    case 'wide-body-twin': return wideBodyTwinSVG(color);
    case 'wide-body-quad': return wideBodyQuadSVG(color);
    case 'regional': return regionalJetSVG(color);
    case 'business-jet': return businessJetSVG(color);
    case 'turboprop': return turbopropSVG(color);
    case 'helicopter': return helicopterSVG(color);
    case 'military-fighter': return militaryFighterSVG(color);
    case 'military-transport': return militaryTransportSVG(engines, color);
    case 'light-aircraft': return lightAircraftSVG(color);
    default: return narrowBodySVG(color);
  }
}

// --- Narrow-body twin (A320 / B737) ---
function narrowBodySVG(c: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="28" height="28">
    <!-- Fuselage -->
    <path d="M20 3 Q22 5 22 12 L22 30 Q22 35 20 37 Q18 35 18 30 L18 12 Q18 5 20 3Z" fill="${c}" opacity="0.95"/>
    <!-- Wings -->
    <path d="M20 14 L36 20 L36 22 L22 19 L22 21 L18 21 L18 19 L4 22 L4 20 Z" fill="${c}" opacity="0.9"/>
    <!-- Left engine -->
    <ellipse cx="12" cy="19" rx="1.5" ry="3" fill="${c}"/>
    <!-- Right engine -->
    <ellipse cx="28" cy="19" rx="1.5" ry="3" fill="${c}"/>
    <!-- Horizontal stabilizer -->
    <path d="M20 31 L28 34 L28 35 L20 33 L12 35 L12 34 Z" fill="${c}" opacity="0.85"/>
    <!-- Cockpit -->
    <ellipse cx="20" cy="5" rx="1.5" ry="2" fill="white" opacity="0.4"/>
  </svg>`;
}

// --- Wide-body twin (B777 / B787 / A350) ---
function wideBodyTwinSVG(c: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="32" height="32">
    <!-- Fuselage (wider) -->
    <path d="M20 2 Q23 4 23 11 L23 30 Q23 36 20 38 Q17 36 17 30 L17 11 Q17 4 20 2Z" fill="${c}" opacity="0.95"/>
    <!-- Wings (larger span) -->
    <path d="M20 13 L38 19 L38 21.5 L23 18 L23 20 L17 20 L17 18 L2 21.5 L2 19 Z" fill="${c}" opacity="0.9"/>
    <!-- Left engine (bigger) -->
    <ellipse cx="11" cy="18.5" rx="2" ry="3.5" fill="${c}"/>
    <ellipse cx="11" cy="17" rx="1.2" ry="1" fill="white" opacity="0.2"/>
    <!-- Right engine (bigger) -->
    <ellipse cx="29" cy="18.5" rx="2" ry="3.5" fill="${c}"/>
    <ellipse cx="29" cy="17" rx="1.2" ry="1" fill="white" opacity="0.2"/>
    <!-- Horizontal stabilizer -->
    <path d="M20 31 L30 35 L30 36 L20 33 L10 36 L10 35 Z" fill="${c}" opacity="0.85"/>
    <!-- Cockpit -->
    <ellipse cx="20" cy="4.5" rx="2" ry="2.5" fill="white" opacity="0.35"/>
  </svg>`;
}

// --- Wide-body quad (B747 / A380) ---
function wideBodyQuadSVG(c: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="36" height="36">
    <!-- Fuselage (widest) -->
    <path d="M20 1 Q24 3 24 10 L24 30 Q24 36 20 38 Q16 36 16 30 L16 10 Q16 3 20 1Z" fill="${c}" opacity="0.95"/>
    <!-- Wings (very large span) -->
    <path d="M20 12 L39 18 L39 20.5 L24 17 L24 19 L16 19 L16 17 L1 20.5 L1 18 Z" fill="${c}" opacity="0.9"/>
    <!-- Engine 1 (inner left) -->
    <ellipse cx="14" cy="17" rx="1.8" ry="3" fill="${c}"/>
    <ellipse cx="14" cy="15.5" rx="1" ry="0.8" fill="white" opacity="0.2"/>
    <!-- Engine 2 (outer left) -->
    <ellipse cx="7" cy="19" rx="1.8" ry="3" fill="${c}"/>
    <ellipse cx="7" cy="17.5" rx="1" ry="0.8" fill="white" opacity="0.2"/>
    <!-- Engine 3 (inner right) -->
    <ellipse cx="26" cy="17" rx="1.8" ry="3" fill="${c}"/>
    <ellipse cx="26" cy="15.5" rx="1" ry="0.8" fill="white" opacity="0.2"/>
    <!-- Engine 4 (outer right) -->
    <ellipse cx="33" cy="19" rx="1.8" ry="3" fill="${c}"/>
    <ellipse cx="33" cy="17.5" rx="1" ry="0.8" fill="white" opacity="0.2"/>
    <!-- Horizontal stabilizer -->
    <path d="M20 31 L30 35 L30 36.5 L20 33 L10 36.5 L10 35 Z" fill="${c}" opacity="0.85"/>
    <!-- B747 upper deck hump -->
    <path d="M19 3 Q20 2 21 3 L21 12 Q20 13 19 12 Z" fill="white" opacity="0.1"/>
    <!-- Cockpit -->
    <ellipse cx="20" cy="3.5" rx="2.2" ry="2.5" fill="white" opacity="0.3"/>
  </svg>`;
}

// --- Regional jet (E190 / CRJ) ---
function regionalJetSVG(c: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="22" height="22">
    <!-- Fuselage (slender) -->
    <path d="M20 5 Q21.5 7 21.5 13 L21.5 30 Q21.5 35 20 37 Q18.5 35 18.5 30 L18.5 13 Q18.5 7 20 5Z" fill="${c}" opacity="0.95"/>
    <!-- Wings -->
    <path d="M20 16 L33 21 L33 22.5 L21.5 19 L21.5 20.5 L18.5 20.5 L18.5 19 L7 22.5 L7 21 Z" fill="${c}" opacity="0.9"/>
    <!-- Left engine -->
    <ellipse cx="13" cy="20.5" rx="1.3" ry="2.5" fill="${c}"/>
    <!-- Right engine -->
    <ellipse cx="27" cy="20.5" rx="1.3" ry="2.5" fill="${c}"/>
    <!-- Horizontal stabilizer -->
    <path d="M20 32 L27 34.5 L27 35.5 L20 33.5 L13 35.5 L13 34.5 Z" fill="${c}" opacity="0.85"/>
    <!-- Cockpit -->
    <ellipse cx="20" cy="7" rx="1.2" ry="1.8" fill="white" opacity="0.35"/>
  </svg>`;
}

// --- Business jet (Gulfstream / Challenger) ---
function businessJetSVG(c: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="20" height="20">
    <!-- Fuselage -->
    <path d="M20 5 Q21.5 7 21.5 14 L21.5 29 Q21.5 34 20 36 Q18.5 34 18.5 29 L18.5 14 Q18.5 7 20 5Z" fill="${c}" opacity="0.95"/>
    <!-- Wings (swept) -->
    <path d="M20 16 L32 22 L32 23 L21.5 19 L18.5 19 L8 23 L8 22 Z" fill="${c}" opacity="0.9"/>
    <!-- Rear-mounted engines -->
    <ellipse cx="17" cy="29" rx="1.5" ry="2.5" fill="${c}"/>
    <ellipse cx="23" cy="29" rx="1.5" ry="2.5" fill="${c}"/>
    <!-- T-tail -->
    <path d="M20 33 L26 35 L26 36 L20 34.5 L14 36 L14 35 Z" fill="${c}" opacity="0.85"/>
    <line x1="20" y1="30" x2="20" y2="35" stroke="${c}" stroke-width="0.8" opacity="0.7"/>
    <!-- Cockpit -->
    <ellipse cx="20" cy="7" rx="1.2" ry="1.8" fill="white" opacity="0.4"/>
  </svg>`;
}

// --- Turboprop (ATR / Dash 8) ---
function turbopropSVG(c: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="22" height="22">
    <!-- Fuselage -->
    <path d="M20 6 Q21.5 8 21.5 14 L21.5 30 Q21.5 34 20 36 Q18.5 34 18.5 30 L18.5 14 Q18.5 8 20 6Z" fill="${c}" opacity="0.95"/>
    <!-- Wings (straight, high aspect ratio) -->
    <path d="M20 17 L37 19 L37 20.5 L21.5 19 L18.5 19 L3 20.5 L3 19 Z" fill="${c}" opacity="0.9"/>
    <!-- Left engine nacelle + prop disc -->
    <ellipse cx="12" cy="18.5" rx="1.5" ry="2.5" fill="${c}"/>
    <circle cx="12" cy="16.5" r="2.5" fill="${c}" opacity="0.3" stroke="${c}" stroke-width="0.5"/>
    <!-- Right engine nacelle + prop disc -->
    <ellipse cx="28" cy="18.5" rx="1.5" ry="2.5" fill="${c}"/>
    <circle cx="28" cy="16.5" r="2.5" fill="${c}" opacity="0.3" stroke="${c}" stroke-width="0.5"/>
    <!-- Horizontal stabilizer -->
    <path d="M20 32 L27 34 L27 35 L20 33.5 L13 35 L13 34 Z" fill="${c}" opacity="0.85"/>
    <!-- Cockpit -->
    <ellipse cx="20" cy="8" rx="1.2" ry="1.5" fill="white" opacity="0.35"/>
  </svg>`;
}

// --- Helicopter ---
function helicopterSVG(c: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="24" height="24">
    <!-- Main rotor disc -->
    <circle cx="20" cy="16" r="14" fill="${c}" opacity="0.15" stroke="${c}" stroke-width="0.6"/>
    <!-- Rotor blades -->
    <line x1="6" y1="16" x2="34" y2="16" stroke="${c}" stroke-width="1.2" opacity="0.6"/>
    <line x1="20" y1="2" x2="20" y2="30" stroke="${c}" stroke-width="1.2" opacity="0.6"/>
    <!-- Body -->
    <ellipse cx="20" cy="16" rx="4" ry="6" fill="${c}" opacity="0.95"/>
    <!-- Tail boom -->
    <path d="M19 22 L19 35 L21 35 L21 22 Z" fill="${c}" opacity="0.8"/>
    <!-- Tail rotor -->
    <line x1="16" y1="35" x2="24" y2="35" stroke="${c}" stroke-width="1.5" opacity="0.7"/>
    <!-- Cockpit -->
    <ellipse cx="20" cy="12" rx="2.5" ry="3" fill="white" opacity="0.25"/>
    <!-- Rotor hub -->
    <circle cx="20" cy="16" r="1.5" fill="${c}"/>
  </svg>`;
}

// --- Military fighter (F-16 / F-35 / Eurofighter) ---
function militaryFighterSVG(c: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="22" height="22">
    <!-- Fuselage -->
    <path d="M20 2 Q22 5 22 12 L22 28 Q22 32 20 35 Q18 32 18 28 L18 12 Q18 5 20 2Z" fill="${c}" opacity="0.95"/>
    <!-- Delta wings -->
    <path d="M20 14 L36 26 L36 28 L22 22 L18 22 L4 28 L4 26 Z" fill="${c}" opacity="0.9"/>
    <!-- Canards (small forward wings) -->
    <path d="M20 11 L27 14 L27 15 L20 12.5 L13 15 L13 14 Z" fill="${c}" opacity="0.8"/>
    <!-- Vertical stabilizer -->
    <path d="M19.5 26 L20 28 L20.5 26 L21 32 L19 32 Z" fill="${c}" opacity="0.7"/>
    <!-- Engine exhaust -->
    <ellipse cx="20" cy="34" rx="2" ry="1.5" fill="${c}" opacity="0.5"/>
    <ellipse cx="20" cy="34" rx="1" ry="0.8" fill="white" opacity="0.3"/>
    <!-- Cockpit -->
    <ellipse cx="20" cy="7" rx="1.5" ry="3" fill="white" opacity="0.35"/>
    <!-- Nose cone -->
    <path d="M20 2 Q20.5 3 20 5 Q19.5 3 20 2Z" fill="white" opacity="0.25"/>
  </svg>`;
}

// --- Military transport (C-130 / C-17 / A400M) ---
function militaryTransportSVG(engines: number, c: string): string {
  const engineSVGs = engines >= 4 ? `
    <!-- 4 engines -->
    <ellipse cx="10" cy="18" rx="1.5" ry="3" fill="${c}"/>
    <circle cx="10" cy="15.5" r="2" fill="${c}" opacity="0.3" stroke="${c}" stroke-width="0.4"/>
    <ellipse cx="16" cy="17" rx="1.5" ry="3" fill="${c}"/>
    <circle cx="16" cy="14.5" r="2" fill="${c}" opacity="0.3" stroke="${c}" stroke-width="0.4"/>
    <ellipse cx="24" cy="17" rx="1.5" ry="3" fill="${c}"/>
    <circle cx="24" cy="14.5" r="2" fill="${c}" opacity="0.3" stroke="${c}" stroke-width="0.4"/>
    <ellipse cx="30" cy="18" rx="1.5" ry="3" fill="${c}"/>
    <circle cx="30" cy="15.5" r="2" fill="${c}" opacity="0.3" stroke="${c}" stroke-width="0.4"/>
  ` : `
    <!-- 2 engines -->
    <ellipse cx="13" cy="18" rx="2" ry="3.5" fill="${c}"/>
    <ellipse cx="27" cy="18" rx="2" ry="3.5" fill="${c}"/>
  `;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="30" height="30">
    <!-- Fuselage (thick, military) -->
    <path d="M20 3 Q23 5 23 11 L23 30 Q23 35 20 37 Q17 35 17 30 L17 11 Q17 5 20 3Z" fill="${c}" opacity="0.95"/>
    <!-- Wings (high aspect, straight) -->
    <path d="M20 14 L38 18 L38 20 L23 17.5 L23 19 L17 19 L17 17.5 L2 20 L2 18 Z" fill="${c}" opacity="0.9"/>
    ${engineSVGs}
    <!-- T-tail -->
    <path d="M20 32 L28 35 L28 36.5 L20 34 L12 36.5 L12 35 Z" fill="${c}" opacity="0.85"/>
    <line x1="20" y1="30" x2="20" y2="35" stroke="${c}" stroke-width="1" opacity="0.7"/>
    <!-- Cockpit -->
    <ellipse cx="20" cy="5.5" rx="2" ry="2.5" fill="white" opacity="0.3"/>
    <!-- Cargo ramp indication -->
    <path d="M19 35 L20 37 L21 35" fill="none" stroke="white" stroke-width="0.5" opacity="0.3"/>
  </svg>`;
}

// --- Light aircraft (Cessna) ---
function lightAircraftSVG(c: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="18" height="18">
    <!-- Fuselage -->
    <path d="M20 7 Q21 9 21 15 L21 30 Q21 34 20 35 Q19 34 19 30 L19 15 Q19 9 20 7Z" fill="${c}" opacity="0.95"/>
    <!-- Wings (straight, high) -->
    <path d="M20 17 L35 18.5 L35 19.5 L21 18.5 L19 18.5 L5 19.5 L5 18.5 Z" fill="${c}" opacity="0.9"/>
    <!-- Prop disc -->
    <circle cx="20" cy="7" r="3" fill="${c}" opacity="0.25" stroke="${c}" stroke-width="0.5"/>
    <!-- Horizontal stabilizer -->
    <path d="M20 31 L27 33 L27 34 L20 32.5 L13 34 L13 33 Z" fill="${c}" opacity="0.85"/>
    <!-- Cockpit -->
    <ellipse cx="20" cy="12" rx="1.5" ry="2.5" fill="white" opacity="0.3"/>
  </svg>`;
}

// ============================================================
// Vessel SVG Icons
// ============================================================

export function getVesselSVG(vesselType: VesselCategory, color: string): string {
  switch (vesselType) {
    case 'cargo': return cargoShipSVG(color);
    case 'tanker': return tankerSVG(color);
    case 'passenger': return cruiseShipSVG(color);
    case 'fishing': return fishingVesselSVG(color);
    case 'military': return warshipSVG(color);
    case 'sailing': return sailingVesselSVG(color);
    case 'tug': return tugboatSVG(color);
    default: return cargoShipSVG(color);
  }
}

function cargoShipSVG(c: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="26" height="26">
    <!-- Hull -->
    <path d="M20 4 L24 8 L24 32 Q24 36 20 38 Q16 36 16 32 L16 8 Z" fill="${c}" opacity="0.9"/>
    <!-- Containers stacked -->
    <rect x="17" y="12" width="6" height="4" fill="${c}" opacity="0.6" rx="0.5"/>
    <rect x="17" y="17" width="6" height="4" fill="${c}" opacity="0.5" rx="0.5"/>
    <rect x="17" y="22" width="6" height="4" fill="${c}" opacity="0.4" rx="0.5"/>
    <!-- Bridge -->
    <rect x="18" y="28" width="4" height="4" fill="${c}" rx="0.5"/>
    <rect x="19" y="29" width="2" height="2" fill="white" opacity="0.3" rx="0.3"/>
    <!-- Bow -->
    <path d="M20 4 L22 6 L18 6 Z" fill="${c}"/>
  </svg>`;
}

function tankerSVG(c: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="28" height="28">
    <!-- Hull (long, rounded) -->
    <path d="M20 3 L24 7 L24 33 Q24 37 20 39 Q16 37 16 33 L16 7 Z" fill="${c}" opacity="0.9"/>
    <!-- Deck pipes -->
    <line x1="20" y1="8" x2="20" y2="30" stroke="white" stroke-width="0.5" opacity="0.2"/>
    <!-- Tank domes -->
    <ellipse cx="20" cy="12" rx="3" ry="2" fill="${c}" opacity="0.5"/>
    <ellipse cx="20" cy="18" rx="3" ry="2" fill="${c}" opacity="0.45"/>
    <ellipse cx="20" cy="24" rx="3" ry="2" fill="${c}" opacity="0.4"/>
    <!-- Bridge (stern) -->
    <rect x="18" y="30" width="4" height="4" fill="${c}" rx="0.5"/>
    <rect x="19" y="31" width="2" height="2" fill="white" opacity="0.3" rx="0.3"/>
    <!-- Bow -->
    <path d="M20 3 L22 5 L18 5 Z" fill="${c}"/>
  </svg>`;
}

function cruiseShipSVG(c: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="28" height="28">
    <!-- Hull -->
    <path d="M20 3 L25 8 L25 32 Q25 37 20 39 Q15 37 15 32 L15 8 Z" fill="${c}" opacity="0.9"/>
    <!-- Superstructure decks -->
    <rect x="17" y="10" width="6" height="3" fill="${c}" opacity="0.6" rx="0.5"/>
    <rect x="17.5" y="14" width="5" height="3" fill="${c}" opacity="0.55" rx="0.5"/>
    <rect x="18" y="18" width="4" height="3" fill="${c}" opacity="0.5" rx="0.5"/>
    <rect x="18.5" y="22" width="3" height="3" fill="${c}" opacity="0.45" rx="0.5"/>
    <!-- Funnel -->
    <rect x="19" y="26" width="2" height="4" fill="${c}" opacity="0.7" rx="0.5"/>
    <!-- Pool deck -->
    <ellipse cx="20" cy="30" rx="2" ry="1" fill="white" opacity="0.15"/>
    <!-- Bridge windows -->
    <rect x="18" y="8" width="4" height="2" fill="white" opacity="0.3" rx="0.3"/>
    <!-- Bow -->
    <path d="M20 3 L23 6 L17 6 Z" fill="${c}"/>
  </svg>`;
}

function fishingVesselSVG(c: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="18" height="18">
    <!-- Hull (small) -->
    <path d="M20 8 L23 12 L23 30 Q23 34 20 36 Q17 34 17 30 L17 12 Z" fill="${c}" opacity="0.9"/>
    <!-- Cabin -->
    <rect x="18" y="22" width="4" height="5" fill="${c}" rx="0.5"/>
    <!-- Mast / crane -->
    <line x1="20" y1="10" x2="20" y2="22" stroke="${c}" stroke-width="0.8"/>
    <line x1="17" y1="14" x2="23" y2="14" stroke="${c}" stroke-width="0.6"/>
    <!-- Nets indication -->
    <path d="M15 16 Q14 20 15 24" fill="none" stroke="${c}" stroke-width="0.5" opacity="0.4"/>
    <path d="M25 16 Q26 20 25 24" fill="none" stroke="${c}" stroke-width="0.5" opacity="0.4"/>
    <!-- Bow -->
    <path d="M20 8 L22 10 L18 10 Z" fill="${c}"/>
  </svg>`;
}

function warshipSVG(c: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="28" height="28">
    <!-- Hull (angular, military) -->
    <path d="M20 2 L25 8 L25 30 Q25 36 20 38 Q15 36 15 30 L15 8 Z" fill="${c}" opacity="0.9"/>
    <!-- Superstructure -->
    <rect x="17" y="14" width="6" height="8" fill="${c}" opacity="0.6" rx="0.5"/>
    <!-- Radar/antenna mast -->
    <line x1="20" y1="12" x2="20" y2="6" stroke="${c}" stroke-width="0.8"/>
    <line x1="17" y1="8" x2="23" y2="8" stroke="${c}" stroke-width="0.6"/>
    <!-- Gun turret fore -->
    <circle cx="20" cy="10" r="2" fill="${c}" opacity="0.7"/>
    <line x1="20" y1="10" x2="20" y2="5" stroke="${c}" stroke-width="1"/>
    <!-- Gun turret aft -->
    <circle cx="20" cy="26" r="2" fill="${c}" opacity="0.7"/>
    <!-- Flight deck -->
    <rect x="17" y="28" width="6" height="6" fill="${c}" opacity="0.4" rx="0.5"/>
    <!-- Helipad marking -->
    <circle cx="20" cy="31" r="2" fill="none" stroke="white" stroke-width="0.4" opacity="0.3"/>
    <!-- Bow -->
    <path d="M20 2 L23 5 L17 5 Z" fill="${c}"/>
  </svg>`;
}

function sailingVesselSVG(c: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="20" height="20">
    <!-- Hull -->
    <path d="M20 10 L23 14 L23 32 Q23 36 20 38 Q17 36 17 32 L17 14 Z" fill="${c}" opacity="0.9"/>
    <!-- Main mast -->
    <line x1="20" y1="4" x2="20" y2="30" stroke="${c}" stroke-width="0.8"/>
    <!-- Main sail -->
    <path d="M20 4 L28 18 L20 28 Z" fill="${c}" opacity="0.35"/>
    <!-- Jib sail -->
    <path d="M20 4 L14 14 L20 16 Z" fill="${c}" opacity="0.3"/>
    <!-- Bow -->
    <path d="M20 10 L22 12 L18 12 Z" fill="${c}"/>
  </svg>`;
}

function tugboatSVG(c: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="16" height="16">
    <!-- Hull (stubby) -->
    <path d="M20 10 L24 14 L24 30 Q24 34 20 36 Q16 34 16 30 L16 14 Z" fill="${c}" opacity="0.9"/>
    <!-- Wheelhouse -->
    <rect x="17" y="16" width="6" height="6" fill="${c}" rx="1"/>
    <rect x="18" y="17" width="4" height="3" fill="white" opacity="0.3" rx="0.3"/>
    <!-- Funnel -->
    <rect x="19" y="23" width="2" height="3" fill="${c}" opacity="0.7"/>
    <!-- Tow hook/winch -->
    <circle cx="20" cy="30" r="1.5" fill="${c}" opacity="0.6"/>
    <!-- Bow pusher -->
    <rect x="17" y="10" width="6" height="3" fill="${c}" opacity="0.7" rx="1"/>
  </svg>`;
}

// ============================================================
// Create an HTML element for a vehicle icon
// ============================================================

export function createVehicleElement(
  type: 'aircraft' | 'vessel',
  subtype: string, // AircraftSize or VesselCategory
  engines: number,
  color: string,
  heading: number,
  label: string
): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'vehicle-icon';
  el.style.transform = `rotate(${heading}deg)`;
  el.style.filter = `drop-shadow(0 0 4px ${color})`;

  let svg: string;
  if (type === 'aircraft') {
    svg = getAircraftSVG(subtype as AircraftSize, engines, color);
  } else {
    svg = getVesselSVG(subtype as VesselCategory, color);
  }

  el.innerHTML = svg;

  // Add callsign label below (not rotated)
  const labelEl = document.createElement('div');
  labelEl.className = 'vehicle-label';
  labelEl.style.transform = `rotate(${-heading}deg)`;
  labelEl.style.color = color;
  labelEl.textContent = label;
  el.appendChild(labelEl);

  return el;
}
