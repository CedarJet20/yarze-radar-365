// ============================================================
// Aircraft Data Fetcher
// Primary: Flight Radar1 via RapidAPI (CORS supported, no limits)
// Fallback: OpenSky Network (has CORS, but rate-limited)
// ============================================================

import type { Aircraft, VehicleCategory, Position } from '../types';
import type { AircraftSize } from './aircraft-db';
import { AIRCRAFT_MODELS } from './aircraft-db';
import { lookupAirline } from './airlines';
import { findAirportByIATA } from './airports';

// ============================================================
// RapidAPI configuration
// ============================================================

const RAPIDAPI_KEY = '538b7622demshf36ea0d1aa90fefp1aa40ejsn2d79e8cd5c8e';
const RAPIDAPI_HOST = 'flight-radar1.p.rapidapi.com';
const FR_BASE = `https://${RAPIDAPI_HOST}`;

// Bounding boxes covering major aviation regions worldwide
// Each box: [bl_lat, bl_lng, tr_lat, tr_lng] (bottom-left to top-right)
// Smaller zones to stay under 300/zone API cap — ~40 zones for ~10k+ aircraft
const FETCH_ZONES: [number, number, number, number][] = [
  // North America — dense coverage
  [40, -130, 50, -110],   // Pacific NW
  [30, -130, 40, -110],   // California / SW
  [40, -110, 50, -90],    // Midwest / Mountain
  [30, -110, 40, -90],    // Texas / South Central
  [40, -90, 50, -70],     // Great Lakes / NE
  [30, -90, 40, -70],     // Southeast
  [24, -90, 30, -70],     // Florida / Gulf
  [40, -70, 50, -50],     // New England / Atlantic
  [50, -130, 60, -80],    // Canada West + Central
  [50, -80, 60, -50],     // Canada East
  [14, -120, 24, -85],    // Mexico / Central America

  // Europe — dense coverage
  [48, -12, 55, 3],       // UK / Ireland / Benelux
  [55, -12, 65, 10],      // Scandinavia West
  [55, 10, 65, 30],       // Scandinavia East / Baltic
  [44, -12, 48, 3],       // France / Iberia North
  [35, -12, 44, 3],       // Spain / Portugal
  [44, 3, 48, 15],        // France East / Switzerland / Germany South
  [48, 3, 55, 15],        // Germany / Benelux / Poland West
  [44, 15, 55, 30],       // Central / Eastern Europe
  [35, 3, 44, 15],        // Italy / Mediterranean
  [35, 15, 44, 30],       // Greece / Turkey West / Balkans
  [44, 30, 55, 45],       // Eastern Europe / Ukraine / Russia West

  // Middle East
  [20, 30, 32, 50],       // Arabian Peninsula / Egypt
  [32, 30, 42, 50],       // Levant / Turkey East / Iraq
  [20, 50, 32, 65],       // Gulf states / Iran West
  [32, 50, 42, 65],       // Iran / Central Asia West

  // Asia
  [30, 65, 42, 90],       // South Asia North / Pakistan / India North
  [10, 65, 30, 90],       // India / Sri Lanka
  [30, 90, 42, 115],      // China West / Central
  [20, 90, 30, 115],      // China South / Vietnam / Myanmar
  [30, 115, 45, 145],     // China East / Korea / Japan
  [10, 95, 20, 120],      // Southeast Asia
  [-10, 95, 10, 120],     // Indonesia / Malaysia

  // Oceania
  [-25, 110, -10, 155],   // Australia North
  [-45, 110, -25, 155],   // Australia South
  [-50, 155, -30, 180],   // New Zealand

  // South America
  [-10, -80, 15, -50],    // Northern South America / Caribbean
  [-30, -70, -10, -35],   // Brazil / Central SA
  [-55, -80, -30, -50],   // Southern SA (Argentina / Chile)

  // Africa
  [20, -20, 38, 40],      // North Africa
  [0, -20, 20, 25],       // West Africa
  [0, 25, 20, 55],        // East Africa
  [-35, 10, 0, 55],       // Southern Africa
];

// ============================================================
// Classification logic
// ============================================================

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calcFlightProgress(lat: number, lng: number, dep: { lat: number; lng: number }, arr: { lat: number; lng: number }): number {
  const totalDist = haversine(dep.lat, dep.lng, arr.lat, arr.lng);
  if (totalDist < 10) return 1;
  const fromDep = haversine(dep.lat, dep.lng, lat, lng);
  return Math.min(1, Math.max(0, fromDep / totalDist));
}

function classifyFromTypeCode(
  typeCode: string,
  callsign: string,
  isMilitary: boolean
): { category: VehicleCategory; aircraftSize: AircraftSize; model: string; manufacturer: string; engines: number } {
  const cs = callsign.trim().toUpperCase();

  // Check aircraft model database first
  if (typeCode && AIRCRAFT_MODELS[typeCode]) {
    const m = AIRCRAFT_MODELS[typeCode];
    let category: VehicleCategory = 'commercial';

    if (m.size === 'helicopter') category = 'helicopter';
    else if (m.size === 'military-fighter' || m.size === 'military-transport') category = 'military';
    else if (m.size === 'business-jet' || m.size === 'light-aircraft') category = 'private';
    else if (m.size === 'turboprop') category = 'private';

    if (isMilitary) category = 'military';

    const cargoPrefixes = ['FDX', 'UPS', 'GTI', 'CLX', 'ABW', 'MPH', 'BOX', 'CKS'];
    if (cargoPrefixes.some(p => cs.startsWith(p))) category = 'cargo';

    return { category, aircraftSize: m.size, model: m.model, manufacturer: m.manufacturer, engines: m.engines };
  }

  // Fallback heuristics
  if (isMilitary) {
    return { category: 'military', aircraftSize: 'military-transport', model: typeCode || 'Unknown', manufacturer: '', engines: 2 };
  }

  const cargoPrefixes = ['FDX', 'UPS', 'GTI', 'CLX', 'ABW'];
  if (cargoPrefixes.some(p => cs.startsWith(p))) {
    return { category: 'cargo', aircraftSize: 'wide-body-twin', model: typeCode || 'Cargo', manufacturer: '', engines: 2 };
  }
  if (/^[A-Z]{2,3}\d/.test(cs)) {
    return { category: 'commercial', aircraftSize: 'narrow-body', model: typeCode || 'Unknown', manufacturer: '', engines: 2 };
  }

  return { category: 'private', aircraftSize: 'light-aircraft', model: typeCode || 'Unknown', manufacturer: '', engines: 1 };
}

// ============================================================
// Flight Radar1 (RapidAPI) — Primary Source
// ============================================================

// FR response: each aircraft is an array:
// [0] flight_id   [1] hex/icao24   [2] lat          [3] lng
// [4] heading     [5] altitude(ft) [6] speed(kts)   [7] squawk
// [8] radar       [9] type_code    [10] registration [11] timestamp
// [12] origin     [13] destination [14] flight_num   [15] on_ground
// [16] vert_rate  [17] callsign    [18] unknown

interface FRResponse {
  full_count: number;
  aircraft: (string | number | null)[][];
}

function parseFRaircraft(ac: (string | number | null)[]): Aircraft | null {
  const lat = ac[2] as number;
  const lng = ac[3] as number;
  if (lat === 0 && lng === 0) return null;
  if (!lat || !lng) return null;

  const onGround = ac[15] === 1;
  if (onGround) return null;

  const hex = (ac[1] as string) || '';
  const heading = (ac[4] as number) || 0;
  const altFeet = (ac[5] as number) || 0;
  const speedKnots = (ac[6] as number) || 0;
  const squawk = ac[7] as string || null;
  const typeCode = ((ac[9] as string) || '').trim().toUpperCase();
  const registration = (ac[10] as string) || '';
  const originIATA = ((ac[12] as string) || '').trim();
  const destIATA = ((ac[13] as string) || '').trim();
  const flightNum = ((ac[14] as string) || '').trim();
  const callsign = ((ac[17] as string) || flightNum || '').trim();
  const vertRate = (ac[16] as number) || 0;

  const milCallsigns = ['RCH', 'DUKE', 'EVAC', 'JAKE', 'KING', 'NAVY', 'ARMY', 'FORCE', 'REACH', 'SPAR'];
  const isMilitary = milCallsigns.some(p => callsign.toUpperCase().startsWith(p));

  const { category, aircraftSize, model, manufacturer, engines } = classifyFromTypeCode(typeCode, callsign, isMilitary);
  const airlineInfo = lookupAirline(callsign);
  const altMeters = altFeet * 0.3048;
  const velocityMs = speedKnots * 0.51444;

  const departureAirport = originIATA ? findAirportByIATA(originIATA) : null;
  const arrivalAirport = destIATA ? findAirportByIATA(destIATA) : null;

  let progress = 0;
  if (departureAirport && arrivalAirport) {
    progress = calcFlightProgress(lat, lng, departureAirport, arrivalAirport);
  }

  return {
    type: 'aircraft',
    icao24: hex || `fr_${ac[0]}`,
    callsign,
    originCountry: airlineInfo?.country ?? '',
    longitude: lng,
    latitude: lat,
    baroAltitude: altMeters,
    geoAltitude: altMeters,
    onGround: false,
    velocity: velocityMs,
    trueTrack: heading,
    verticalRate: vertRate * 0.00508, // ft/min to m/s
    squawk,
    category,
    lastContact: Math.floor(Date.now() / 1000),
    timePosition: (ac[11] as number) || Math.floor(Date.now() / 1000),
    trajectory: [],
    heading,
    speedKnots,
    altitudeFeet: altFeet,
    airlineName: airlineInfo?.name ?? '',
    tailNumber: registration,
    aircraftModel: model || typeCode,
    aircraftManufacturer: manufacturer,
    aircraftSize,
    engineCount: engines,
    departureAirport,
    arrivalAirport,
    departureTime: null,
    etaTime: null,
    progress,
  };
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

const rapidHeaders = {
  'x-rapidapi-key': RAPIDAPI_KEY,
  'x-rapidapi-host': RAPIDAPI_HOST,
};

async function fetchFRzone(bl_lat: number, bl_lng: number, tr_lat: number, tr_lng: number): Promise<Aircraft[]> {
  try {
    const url = `${FR_BASE}/flights/list-in-boundary?bl_lat=${bl_lat}&bl_lng=${bl_lng}&tr_lat=${tr_lat}&tr_lng=${tr_lng}&limit=1500`;
    const res = await fetchWithTimeout(url, { headers: rapidHeaders }, 20000);
    if (!res.ok) {
      console.warn(`FR zone [${bl_lat},${bl_lng}]-[${tr_lat},${tr_lng}] failed: ${res.status}`);
      return [];
    }
    const data: FRResponse = await res.json();
    if (!data.aircraft) return [];
    return data.aircraft
      .map(parseFRaircraft)
      .filter((a): a is Aircraft => a !== null);
  } catch (e) {
    console.warn('FR zone fetch error:', e);
    return [];
  }
}

async function fetchFromFlightRadar(): Promise<Aircraft[]> {
  console.log('Fetching aircraft from Flight Radar1 (RapidAPI)...');

  // Fetch all zones in batches of 4
  const seen = new Map<string, Aircraft>();
  const BATCH_SIZE = 4;

  for (let i = 0; i < FETCH_ZONES.length; i += BATCH_SIZE) {
    const batch = FETCH_ZONES.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(([bl_lat, bl_lng, tr_lat, tr_lng]) => fetchFRzone(bl_lat, bl_lng, tr_lat, tr_lng))
    );
    for (const region of results) {
      for (const ac of region) {
        if (!seen.has(ac.icao24)) seen.set(ac.icao24, ac);
      }
    }
  }

  return Array.from(seen.values());
}

// ============================================================
// OpenSky Network fallback (has CORS, but rate-limited)
// ============================================================

const OPENSKY_BASE = 'https://opensky-network.org/api';

interface OpenSkyState {
  time: number;
  states: (string | number | boolean | number[] | null)[][] | null;
}

function classifyOpenSky(categoryNum: number | null, callsign: string) {
  const cs = callsign.trim().toUpperCase();
  const milPrefixes = ['RCH', 'DUKE', 'EVAC', 'JAKE', 'KING', 'NAVY', 'ARMY', 'FORCE', 'REACH', 'SPAR'];
  if (milPrefixes.some(p => cs.startsWith(p))) {
    return { category: 'military' as VehicleCategory, aircraftSize: 'military-transport' as AircraftSize };
  }
  if (categoryNum === 7 || categoryNum === 10) return { category: 'helicopter' as VehicleCategory, aircraftSize: 'helicopter' as AircraftSize };
  if (categoryNum === 1) return { category: 'private' as VehicleCategory, aircraftSize: 'light-aircraft' as AircraftSize };
  if (categoryNum === 2) return { category: 'private' as VehicleCategory, aircraftSize: 'business-jet' as AircraftSize };
  if (categoryNum === 3) return { category: 'commercial' as VehicleCategory, aircraftSize: 'narrow-body' as AircraftSize };
  if (categoryNum === 4) return { category: 'commercial' as VehicleCategory, aircraftSize: 'wide-body-twin' as AircraftSize };
  if (categoryNum === 5) return { category: 'commercial' as VehicleCategory, aircraftSize: 'wide-body-quad' as AircraftSize };
  const cargoPrefixes = ['FDX', 'UPS', 'GTI', 'CLX', 'ABW'];
  if (cargoPrefixes.some(p => cs.startsWith(p))) return { category: 'cargo' as VehicleCategory, aircraftSize: 'wide-body-twin' as AircraftSize };
  if (/^[A-Z]{2,3}\d/.test(cs)) return { category: 'commercial' as VehicleCategory, aircraftSize: 'narrow-body' as AircraftSize };
  return { category: 'private' as VehicleCategory, aircraftSize: 'light-aircraft' as AircraftSize };
}

function parseOpenSkyStates(data: OpenSkyState): Aircraft[] {
  if (!data.states) return [];
  return data.states
    .filter(s => s[5] != null && s[6] != null && !(s[8] as boolean))
    .map(s => {
      const velocity = s[9] as number | null;
      const baroAlt = s[7] as number | null;
      const geoAlt = s[13] as number | null;
      const trueTrack = s[10] as number | null;
      const callsign = ((s[1] as string) || '').trim();
      const categoryNum = s[16] as number | null;
      const { category, aircraftSize } = classifyOpenSky(categoryNum, callsign);
      const airlineInfo = lookupAirline(callsign);

      return {
        type: 'aircraft' as const,
        icao24: s[0] as string, callsign,
        originCountry: s[2] as string,
        longitude: s[5] as number, latitude: s[6] as number,
        baroAltitude: baroAlt, geoAltitude: geoAlt,
        onGround: false, velocity, trueTrack,
        verticalRate: s[11] as number | null,
        squawk: s[14] as string | null, category,
        lastContact: s[4] as number,
        timePosition: s[3] as number | null,
        trajectory: [],
        heading: trueTrack ?? 0,
        speedKnots: velocity ? Math.round(velocity * 1.94384) : 0,
        altitudeFeet: Math.round((geoAlt ?? baroAlt ?? 0) * 3.28084),
        airlineName: airlineInfo?.name ?? '', tailNumber: '',
        aircraftModel: '', aircraftManufacturer: '',
        aircraftSize, engineCount: 2,
        departureAirport: null, arrivalAirport: null,
        departureTime: null, etaTime: null, progress: 0,
      };
    });
}

async function fetchFromOpenSky(): Promise<Aircraft[]> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      console.log(`OpenSky attempt ${attempt + 1}...`);
      const res = await fetchWithTimeout(`${OPENSKY_BASE}/states/all`, {}, 20000);
      if (res.status === 429) {
        console.warn('OpenSky: rate limited (429)');
        break;
      }
      if (!res.ok) continue;
      const data: OpenSkyState = await res.json();
      const aircraft = parseOpenSkyStates(data);
      if (aircraft.length > 0) return aircraft;
    } catch (e) {
      console.warn(`OpenSky attempt ${attempt + 1} failed:`, e);
    }
  }
  return [];
}

// ============================================================
// Main export: Flight Radar1 first, then OpenSky fallback
// ============================================================

export async function fetchAllAircraft(): Promise<Aircraft[]> {
  // Try Flight Radar1 first (via RapidAPI — CORS supported)
  const frResult = await fetchFromFlightRadar();
  if (frResult.length > 0) {
    console.log(`Flight Radar1: ${frResult.length} aircraft loaded`);
    return frResult;
  }

  // Fallback to OpenSky
  console.log('Flight Radar1 unavailable, trying OpenSky...');
  const openskyResult = await fetchFromOpenSky();
  if (openskyResult.length > 0) {
    console.log(`OpenSky: ${openskyResult.length} aircraft loaded`);
    return openskyResult;
  }

  console.warn('All APIs unavailable');
  return [];
}

export async function fetchAircraftTrack(icao24: string): Promise<Position[]> {
  try {
    const res = await fetchWithTimeout(`${OPENSKY_BASE}/tracks/all?icao24=${icao24}&time=0`, {}, 10000);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.path) return [];
    return data.path.map((p: number[]) => ({
      lat: p[1], lng: p[2], alt: p[3], timestamp: p[0],
    }));
  } catch {
    return [];
  }
}
