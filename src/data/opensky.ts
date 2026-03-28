// ============================================================
// ADSB.lol API — Live ADS-B Air Traffic Data (No Rate Limits)
// Fetches from multiple regional endpoints for global coverage
// ============================================================

import type { Aircraft, VehicleCategory, Position } from '../types';
import type { AircraftSize } from './aircraft-db';
import { AIRCRAFT_MODELS } from './aircraft-db';
import { lookupAirline } from './airlines';

const ADSB_BASE = 'https://api.adsb.lol/v2';

// Strategic fetch points covering major aviation regions worldwide
// Each covers 250nm radius (~460km) — 35 points for dense global coverage
const FETCH_POINTS: [number, number][] = [
  // North America
  [40.6, -73.8],   // New York
  [33.9, -118.4],  // Los Angeles
  [41.9, -87.9],   // Chicago
  [33.6, -84.4],   // Atlanta
  [32.9, -97.0],   // Dallas
  [39.8, -104.7],  // Denver
  [37.6, -122.4],  // San Francisco
  [25.8, -80.3],   // Miami
  [47.4, -122.3],  // Seattle
  [43.7, -79.6],   // Toronto
  [49.2, -123.2],  // Vancouver
  [19.4, -99.1],   // Mexico City

  // Europe
  [51.5, -0.5],    // London
  [49.0, 2.5],     // Paris
  [50.0, 8.6],     // Frankfurt
  [52.3, 4.8],     // Amsterdam
  [41.3, 2.1],     // Barcelona
  [41.8, 12.2],    // Rome
  [55.6, 12.7],    // Copenhagen
  [59.7, 17.9],    // Stockholm
  [40.5, -3.6],    // Madrid
  [48.1, 16.6],    // Vienna
  [41.0, 29.0],    // Istanbul

  // Middle East
  [25.3, 55.4],    // Dubai
  [24.4, 54.7],    // Abu Dhabi
  [25.3, 51.6],    // Doha
  [21.7, 39.2],    // Jeddah

  // Asia
  [35.5, 139.8],   // Tokyo
  [37.5, 127.0],   // Seoul
  [31.1, 121.8],   // Shanghai
  [40.1, 116.6],   // Beijing
  [22.3, 113.9],   // Hong Kong
  [1.4, 104.0],    // Singapore
  [13.7, 100.7],   // Bangkok
  [28.6, 77.1],    // Delhi
  [19.1, 72.9],    // Mumbai
  [-6.1, 106.7],   // Jakarta

  // Oceania
  [-33.9, 151.2],  // Sydney
  [-37.7, 144.8],  // Melbourne
  [-36.8, 174.8],  // Auckland

  // South America
  [-23.4, -46.5],  // Sao Paulo
  [-22.8, -43.3],  // Rio de Janeiro
  [-34.8, -58.5],  // Buenos Aires
  [-33.4, -70.8],  // Santiago
  [4.7, -74.1],    // Bogota

  // Africa
  [-33.9, 18.6],   // Cape Town
  [-26.1, 28.2],   // Johannesburg
  [30.1, 31.4],    // Cairo
  [33.4, -7.6],    // Casablanca
  [9.0, 7.3],      // Abuja/Lagos area
  [-1.3, 36.9],    // Nairobi
  [6.6, 3.3],      // Lagos
];

// ADSB.lol response types
interface AdsbAircraft {
  hex: string;
  flight?: string;
  r?: string;       // registration
  t?: string;       // ICAO type code (A320, B738, etc.)
  dbFlags?: number;  // 1=military, 2=interesting, 4=PIA, 8=LADD
  alt_baro?: number | 'ground';
  alt_geom?: number;
  gs?: number;       // ground speed in knots
  track?: number;    // heading in degrees
  baro_rate?: number;
  geom_rate?: number;
  squawk?: string;
  emergency?: string;
  category?: string; // A0-A7, B0-B7, C0-C7
  lat?: number;
  lon?: number;
  seen_pos?: number;
  seen?: number;
  messages?: number;
  ias?: number;      // indicated airspeed
  tas?: number;      // true airspeed
  mach?: number;
  nav_altitude_mcp?: number;
}

interface AdsbResponse {
  ac: AdsbAircraft[];
  msg?: string;
  now?: number;
  total?: number;
  ctime?: number;
  ptime?: number;
}

// Category classification using ICAO type code and category field
function classifyAircraft(
  ac: AdsbAircraft
): { category: VehicleCategory; aircraftSize: AircraftSize; model: string; manufacturer: string; engines: number } {
  const typeCode = ac.t?.trim().toUpperCase() || '';
  const callsign = (ac.flight || '').trim().toUpperCase();
  const catField = ac.category || '';
  const isMilitary = (ac.dbFlags ?? 0) & 1;

  // Check aircraft model database first
  if (typeCode && AIRCRAFT_MODELS[typeCode]) {
    const m = AIRCRAFT_MODELS[typeCode];
    let category: VehicleCategory = 'commercial';

    if (m.size === 'helicopter') category = 'helicopter';
    else if (m.size === 'military-fighter' || m.size === 'military-transport') category = 'military';
    else if (m.size === 'business-jet' || m.size === 'light-aircraft') category = 'private';
    else if (m.size === 'turboprop') category = 'private';

    // Override to military if dbFlags says so
    if (isMilitary) category = 'military';

    // Cargo airline callsigns
    const cargoPrefixes = ['FDX', 'UPS', 'GTI', 'CLX', 'ABW', 'MPH', 'BOX', 'CKS', 'ADB', 'KZR'];
    if (cargoPrefixes.some(p => callsign.startsWith(p))) category = 'cargo';

    return {
      category,
      aircraftSize: m.size,
      model: m.model,
      manufacturer: m.manufacturer,
      engines: m.engines,
    };
  }

  // Fallback: use category field (ADS-B emitter category)
  if (isMilitary) {
    return { category: 'military', aircraftSize: 'military-transport', model: typeCode || 'Unknown', manufacturer: '', engines: 2 };
  }

  // Category A = fixed-wing, B = drone/lighter-than-air, C = rotorcraft
  if (catField.startsWith('C') || catField === 'A7') {
    return { category: 'helicopter', aircraftSize: 'helicopter', model: typeCode || 'Helicopter', manufacturer: '', engines: 2 };
  }

  if (catField === 'A1') {
    return { category: 'private', aircraftSize: 'light-aircraft', model: typeCode || 'Light Aircraft', manufacturer: '', engines: 1 };
  }
  if (catField === 'A2') {
    return { category: 'private', aircraftSize: 'business-jet', model: typeCode || 'Small Aircraft', manufacturer: '', engines: 2 };
  }
  if (catField === 'A3') {
    return { category: 'commercial', aircraftSize: 'narrow-body', model: typeCode || 'Large Aircraft', manufacturer: '', engines: 2 };
  }
  if (catField === 'A4') {
    return { category: 'commercial', aircraftSize: 'wide-body-twin', model: typeCode || 'High-vortex Large', manufacturer: '', engines: 2 };
  }
  if (catField === 'A5') {
    return { category: 'commercial', aircraftSize: 'wide-body-quad', model: typeCode || 'Heavy Aircraft', manufacturer: '', engines: 4 };
  }

  // Cargo callsign heuristic
  const cargoP = ['FDX', 'UPS', 'GTI', 'CLX', 'ABW'];
  if (cargoP.some(p => callsign.startsWith(p))) {
    return { category: 'cargo', aircraftSize: 'wide-body-twin', model: typeCode || 'Cargo', manufacturer: '', engines: 2 };
  }

  // Airline callsign heuristic (3-letter prefix + digits = commercial)
  if (/^[A-Z]{2,3}\d/.test(callsign)) {
    return { category: 'commercial', aircraftSize: 'narrow-body', model: typeCode || 'Unknown', manufacturer: '', engines: 2 };
  }

  return { category: 'private', aircraftSize: 'light-aircraft', model: typeCode || 'Unknown', manufacturer: '', engines: 1 };
}

function parseAdsbAircraft(ac: AdsbAircraft): Aircraft | null {
  // Must have position
  if (ac.lat == null || ac.lon == null) return null;

  // Skip ground aircraft
  if (ac.alt_baro === 'ground') return null;

  const baroAlt = typeof ac.alt_baro === 'number' ? ac.alt_baro * 0.3048 : null; // feet to meters
  const geoAlt = ac.alt_geom != null ? ac.alt_geom * 0.3048 : null;
  const velocity = ac.gs != null ? ac.gs * 0.51444 : null; // knots to m/s
  const callsign = (ac.flight || '').trim();
  const trueTrack = ac.track ?? null;

  const { category, aircraftSize, model, manufacturer, engines } = classifyAircraft(ac);
  const airlineInfo = lookupAirline(callsign);

  return {
    type: 'aircraft',
    icao24: ac.hex,
    callsign,
    originCountry: airlineInfo?.country ?? '',
    longitude: ac.lon,
    latitude: ac.lat,
    baroAltitude: baroAlt,
    geoAltitude: geoAlt,
    onGround: false,
    velocity,
    trueTrack,
    verticalRate: ac.baro_rate != null ? ac.baro_rate * 0.00508 : null, // ft/min to m/s
    squawk: ac.squawk ?? null,
    category,
    lastContact: Math.floor(Date.now() / 1000),
    timePosition: Math.floor(Date.now() / 1000),
    trajectory: [],
    heading: trueTrack ?? 0,
    speedKnots: ac.gs ? Math.round(ac.gs) : 0,
    altitudeFeet: typeof ac.alt_baro === 'number' ? ac.alt_baro : (ac.alt_geom ?? 0),
    airlineName: airlineInfo?.name ?? '',
    tailNumber: ac.r ?? '',
    aircraftModel: model,
    aircraftManufacturer: manufacturer,
    aircraftSize,
    engineCount: engines,
    departureAirport: null,
    arrivalAirport: null,
    departureTime: null,
    etaTime: null,
    progress: 0,
  };
}

// Fetch a single regional point
async function fetchRegion(lat: number, lon: number): Promise<Aircraft[]> {
  try {
    const res = await fetch(`${ADSB_BASE}/lat/${lat}/lon/${lon}/dist/250`);
    if (!res.ok) return [];
    const data: AdsbResponse = await res.json();
    if (!data.ac) return [];
    const results: Aircraft[] = [];
    for (const ac of data.ac) {
      const parsed = parseAdsbAircraft(ac);
      if (parsed) results.push(parsed);
    }
    return results;
  } catch {
    return [];
  }
}

export async function fetchAllAircraft(): Promise<Aircraft[]> {
  // Fetch all regions in parallel
  const regionPromises = FETCH_POINTS.map(([lat, lon]) => fetchRegion(lat, lon));
  const regionResults = await Promise.all(regionPromises);

  // Deduplicate by ICAO hex (same aircraft appears in overlapping regions)
  const seen = new Map<string, Aircraft>();
  for (const region of regionResults) {
    for (const ac of region) {
      if (!seen.has(ac.icao24)) {
        seen.set(ac.icao24, ac);
      }
    }
  }

  const all = Array.from(seen.values());
  console.log(`ADSB.lol: fetched ${all.length} unique aircraft from ${FETCH_POINTS.length} regions`);
  return all;
}

export async function fetchAircraftTrack(icao24: string): Promise<Position[]> {
  // ADSB.lol doesn't provide track history, return empty
  // Trajectory is built from position updates over time in main.ts
  void icao24;
  return [];
}
