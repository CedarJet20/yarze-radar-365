// ============================================================
// Aircraft Data Fetcher
// Primary: ADSB.lol via CORS proxies (no rate limits)
// Fallback: OpenSky Network (has CORS, but rate-limited)
// ============================================================

import type { Aircraft, VehicleCategory, Position } from '../types';
import type { AircraftSize } from './aircraft-db';
import { AIRCRAFT_MODELS } from './aircraft-db';
import { lookupAirline } from './airlines';

// ============================================================
// ADSB.lol configuration
// ============================================================

const ADSB_BASE = 'https://api.adsb.lol/v2';

// CORS proxy configs — each has a URL builder and response parser
// allorigins /get wraps the response in JSON; others pass through directly
interface ProxyConfig {
  name: string;
  url: (raw: string) => string;
  parse: (res: Response) => Promise<AdsbResponse>;
}

const CORS_PROXIES: ProxyConfig[] = [
  {
    name: 'allorigins',
    url: (u) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
    parse: async (res) => { const d = await res.json(); return JSON.parse(d.contents); },
  },
  {
    name: 'corsproxy.org',
    url: (u) => `https://corsproxy.org/?url=${encodeURIComponent(u)}`,
    parse: (res) => res.json(),
  },
  {
    name: 'thingproxy',
    url: (u) => `https://thingproxy.freeboard.io/fetch/${u}`,
    parse: (res) => res.json(),
  },
  {
    name: 'direct',
    url: (u) => u, // works on localhost / some environments
    parse: (res) => res.json(),
  },
];

// Strategic fetch points covering major aviation regions worldwide
const FETCH_POINTS: [number, number][] = [
  // North America
  [40.6, -73.8], [33.9, -118.4], [41.9, -87.9], [33.6, -84.4],
  [32.9, -97.0], [39.8, -104.7], [37.6, -122.4], [25.8, -80.3],
  [47.4, -122.3], [43.7, -79.6], [49.2, -123.2], [19.4, -99.1],
  // Europe
  [51.5, -0.5], [49.0, 2.5], [50.0, 8.6], [52.3, 4.8],
  [41.3, 2.1], [41.8, 12.2], [55.6, 12.7], [40.5, -3.6],
  [48.1, 16.6], [41.0, 29.0],
  // Middle East
  [25.3, 55.4], [25.3, 51.6], [21.7, 39.2],
  // Asia
  [35.5, 139.8], [37.5, 127.0], [31.1, 121.8], [22.3, 113.9],
  [1.4, 104.0], [13.7, 100.7], [28.6, 77.1], [-6.1, 106.7],
  // Oceania
  [-33.9, 151.2], [-37.7, 144.8],
  // South America
  [-23.4, -46.5], [-34.8, -58.5], [4.7, -74.1],
  // Africa
  [30.1, 31.4], [-26.1, 28.2], [-1.3, 36.9], [6.6, 3.3],
];

// ============================================================
// ADSB.lol response types
// ============================================================

interface AdsbAircraft {
  hex: string;
  flight?: string;
  r?: string;
  t?: string;
  dbFlags?: number;
  alt_baro?: number | 'ground';
  alt_geom?: number;
  gs?: number;
  track?: number;
  baro_rate?: number;
  squawk?: string;
  emergency?: string;
  category?: string;
  lat?: number;
  lon?: number;
}

interface AdsbResponse {
  ac: AdsbAircraft[];
}

// ============================================================
// Classification logic (works for both ADSB.lol and OpenSky)
// ============================================================

function classifyFromTypeCode(
  typeCode: string,
  callsign: string,
  isMilitary: boolean,
  categoryField: string
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

  // Fallback classification from ADS-B emitter category
  if (isMilitary) {
    return { category: 'military', aircraftSize: 'military-transport', model: typeCode || 'Unknown', manufacturer: '', engines: 2 };
  }
  if (categoryField.startsWith('C') || categoryField === 'A7') {
    return { category: 'helicopter', aircraftSize: 'helicopter', model: typeCode || 'Helicopter', manufacturer: '', engines: 2 };
  }
  if (categoryField === 'A1') return { category: 'private', aircraftSize: 'light-aircraft', model: typeCode || 'Light Aircraft', manufacturer: '', engines: 1 };
  if (categoryField === 'A2') return { category: 'private', aircraftSize: 'business-jet', model: typeCode || 'Small Aircraft', manufacturer: '', engines: 2 };
  if (categoryField === 'A3') return { category: 'commercial', aircraftSize: 'narrow-body', model: typeCode || 'Large Aircraft', manufacturer: '', engines: 2 };
  if (categoryField === 'A4') return { category: 'commercial', aircraftSize: 'wide-body-twin', model: typeCode || 'Heavy Aircraft', manufacturer: '', engines: 2 };
  if (categoryField === 'A5') return { category: 'commercial', aircraftSize: 'wide-body-quad', model: typeCode || 'Super Heavy', manufacturer: '', engines: 4 };

  // Callsign heuristics
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
// ADSB.lol parsing
// ============================================================

function parseAdsbAircraft(ac: AdsbAircraft): Aircraft | null {
  if (ac.lat == null || ac.lon == null) return null;
  if (ac.alt_baro === 'ground') return null;

  const baroAlt = typeof ac.alt_baro === 'number' ? ac.alt_baro * 0.3048 : null;
  const geoAlt = ac.alt_geom != null ? ac.alt_geom * 0.3048 : null;
  const velocity = ac.gs != null ? ac.gs * 0.51444 : null;
  const callsign = (ac.flight || '').trim();
  const trueTrack = ac.track ?? null;
  const isMilitary = !!((ac.dbFlags ?? 0) & 1);

  const { category, aircraftSize, model, manufacturer, engines } = classifyFromTypeCode(
    (ac.t || '').trim().toUpperCase(), callsign, isMilitary, ac.category || ''
  );
  const airlineInfo = lookupAirline(callsign);

  return {
    type: 'aircraft', icao24: ac.hex, callsign,
    originCountry: airlineInfo?.country ?? '',
    longitude: ac.lon, latitude: ac.lat,
    baroAltitude: baroAlt, geoAltitude: geoAlt,
    onGround: false, velocity, trueTrack,
    verticalRate: ac.baro_rate != null ? ac.baro_rate * 0.00508 : null,
    squawk: ac.squawk ?? null, category,
    lastContact: Math.floor(Date.now() / 1000),
    timePosition: Math.floor(Date.now() / 1000),
    trajectory: [],
    heading: trueTrack ?? 0,
    speedKnots: ac.gs ? Math.round(ac.gs) : 0,
    altitudeFeet: typeof ac.alt_baro === 'number' ? ac.alt_baro : (ac.alt_geom ?? 0),
    airlineName: airlineInfo?.name ?? '', tailNumber: ac.r ?? '',
    aircraftModel: model, aircraftManufacturer: manufacturer,
    aircraftSize, engineCount: engines,
    departureAirport: null, arrivalAirport: null,
    departureTime: null, etaTime: null, progress: 0,
  };
}

// ============================================================
// ADSB.lol fetcher with CORS proxy fallback
// ============================================================

// Detect which CORS proxy works and cache it
let workingProxy: ProxyConfig | null = null;

async function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

async function fetchAdsbRegion(lat: number, lon: number): Promise<Aircraft[]> {
  const rawUrl = `${ADSB_BASE}/lat/${lat}/lon/${lon}/dist/250`;

  // If we know a working proxy, use it directly
  if (workingProxy) {
    try {
      const proxyUrl = workingProxy.url(rawUrl);
      const res = await fetchWithTimeout(proxyUrl);
      if (res.ok) {
        const data = await workingProxy.parse(res);
        if (data.ac) return data.ac.map(parseAdsbAircraft).filter((a): a is Aircraft => a !== null);
      }
    } catch { /* fall through to probe all */ }
    workingProxy = null; // reset
  }

  // Probe each proxy
  for (const proxy of CORS_PROXIES) {
    try {
      const proxyUrl = proxy.url(rawUrl);
      const res = await fetchWithTimeout(proxyUrl, 10000);
      if (res.ok) {
        const data = await proxy.parse(res);
        if (data.ac && data.ac.length > 0) {
          workingProxy = proxy;
          console.log(`ADSB.lol: using proxy "${proxy.name}"`);
          return data.ac.map(parseAdsbAircraft).filter((a): a is Aircraft => a !== null);
        }
      }
    } catch { /* try next */ }
  }

  return [];
}

async function fetchFromAdsb(): Promise<Aircraft[]> {
  // First, probe with a single point to find a working proxy
  const testResult = await fetchAdsbRegion(51.5, -0.5); // London
  if (testResult.length === 0) {
    console.warn('ADSB.lol: no working proxy found');
    return [];
  }

  // Fetch regions in batches of 6 to avoid overwhelming the proxy
  const seen = new Map<string, Aircraft>();
  for (const ac of testResult) {
    if (!seen.has(ac.icao24)) seen.set(ac.icao24, ac);
  }

  const BATCH_SIZE = 6;
  // Skip the London point we already fetched (index of [51.5, -0.5] is 12)
  const remainingPoints = FETCH_POINTS.filter(([lat, lon]) => !(lat === 51.5 && lon === -0.5));
  for (let i = 0; i < remainingPoints.length; i += BATCH_SIZE) {
    const batch = remainingPoints.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map(([lat, lon]) => fetchAdsbRegion(lat, lon)));
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
    .filter(s => s[5] != null && s[6] != null && !(s[8] as boolean)) // has position, airborne
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
  // Try up to 2 times (OpenSky can be flaky)
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      console.log(`OpenSky attempt ${attempt + 1}...`);
      const res = await fetchWithTimeout(`${OPENSKY_BASE}/states/all`, 20000);
      if (res.status === 429) {
        console.warn('OpenSky: rate limited (429)');
        break; // don't retry on rate limit
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
// Main export: try ADSB.lol first, then OpenSky fallback
// ============================================================

export async function fetchAllAircraft(): Promise<Aircraft[]> {
  // Try ADSB.lol first (no rate limits)
  console.log('Fetching aircraft from ADSB.lol...');
  const adsbResult = await fetchFromAdsb();
  if (adsbResult.length > 0) {
    console.log(`ADSB.lol: ${adsbResult.length} aircraft loaded`);
    return adsbResult;
  }

  // Fallback to OpenSky
  console.log('ADSB.lol unavailable, trying OpenSky...');
  const openskyResult = await fetchFromOpenSky();
  if (openskyResult.length > 0) {
    console.log(`OpenSky: ${openskyResult.length} aircraft loaded`);
    return openskyResult;
  }

  console.warn('All APIs unavailable');
  return [];
}

export async function fetchAircraftTrack(icao24: string): Promise<Position[]> {
  // Try OpenSky track endpoint (has CORS)
  try {
    const res = await fetchWithTimeout(`${OPENSKY_BASE}/tracks/all?icao24=${icao24}&time=0`, 10000);
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
