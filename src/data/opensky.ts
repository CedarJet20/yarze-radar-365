// ============================================================
// OpenSky Network API — Live ADS-B Air Traffic Data
// ============================================================

import type { Aircraft, VehicleCategory, OpenSkyState, Position } from '../types';

const OPENSKY_BASE = 'https://opensky-network.org/api';

// Category mapping from OpenSky category field
function classifyAircraft(categoryNum: number | null, callsign: string): VehicleCategory {
  // Military callsign prefixes (common ones)
  const militaryPrefixes = [
    'RCH', 'DUKE', 'EVAC', 'JAKE', 'KING', 'NAVY', 'ARMY', 'CASA',
    'FORCE', 'REACH', 'SPAR', 'SAM', 'MARNS', 'TOPCT', 'VIPER',
    'HAWK', 'EAGLE', 'COBRA', 'WEASL', 'TIGER', 'BEAR', 'RRR',
    'CNV', 'PAT', 'RED', 'BOLT', 'FURY', 'RAGE',
  ];
  const cs = callsign.trim().toUpperCase();
  if (militaryPrefixes.some(p => cs.startsWith(p))) return 'military';

  // Helicopter category
  if (categoryNum === 7 || categoryNum === 10) return 'helicopter';

  // Light aircraft → private
  if (categoryNum === 1 || categoryNum === 2) return 'private';

  // Large / Heavy / High-perf → commercial
  if (categoryNum === 3 || categoryNum === 4 || categoryNum === 5) return 'commercial';

  // Cargo callsign prefixes
  const cargoPrefixes = ['FDX', 'UPS', 'GTI', 'CLX', 'ABW', 'MPH', 'BOX', 'CKS'];
  if (cargoPrefixes.some(p => cs.startsWith(p))) return 'cargo';

  // Default to commercial for airline-like callsigns (3-letter prefix + digits)
  if (/^[A-Z]{2,3}\d/.test(cs)) return 'commercial';

  return 'private';
}

function parseOpenSkyStates(data: OpenSkyState): Aircraft[] {
  if (!data.states) return [];

  return data.states
    .filter(s => s[5] != null && s[6] != null) // must have position
    .map(s => {
      const velocity = s[9] as number | null;
      const baroAlt = s[7] as number | null;
      const geoAlt = s[13] as number | null;
      const trueTrack = s[10] as number | null;
      const callsign = ((s[1] as string) || '').trim();
      const category = s[16] as number | null;

      const aircraft: Aircraft = {
        type: 'aircraft',
        icao24: s[0] as string,
        callsign,
        originCountry: s[2] as string,
        longitude: s[5] as number,
        latitude: s[6] as number,
        baroAltitude: baroAlt,
        geoAltitude: geoAlt,
        onGround: s[8] as boolean,
        velocity,
        trueTrack,
        verticalRate: s[11] as number | null,
        squawk: s[14] as string | null,
        category: classifyAircraft(category, callsign),
        lastContact: s[4] as number,
        timePosition: s[3] as number | null,
        trajectory: [],
        heading: trueTrack ?? 0,
        speedKnots: velocity ? Math.round(velocity * 1.94384) : 0,
        altitudeFeet: Math.round((geoAlt ?? baroAlt ?? 0) * 3.28084),
      };

      return aircraft;
    })
    .filter(a => !a.onGround); // only show airborne
}

export async function fetchAllAircraft(): Promise<Aircraft[]> {
  try {
    const res = await fetch(`${OPENSKY_BASE}/states/all`);
    if (!res.ok) {
      console.warn(`OpenSky API returned ${res.status}, using fallback data`);
      return generateFallbackAircraft();
    }
    const data: OpenSkyState = await res.json();
    return parseOpenSkyStates(data);
  } catch (err) {
    console.warn('OpenSky API unavailable, using fallback data:', err);
    return generateFallbackAircraft();
  }
}

export async function fetchAircraftTrack(icao24: string): Promise<Position[]> {
  try {
    const res = await fetch(`${OPENSKY_BASE}/tracks/all?icao24=${icao24}&time=0`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.path) return [];
    return data.path.map((p: number[]) => ({
      lat: p[1],
      lng: p[2],
      alt: p[3],
      timestamp: p[0],
    }));
  } catch {
    return [];
  }
}

// Fallback data for when the API is rate-limited or unavailable
function generateFallbackAircraft(): Aircraft[] {
  const routes: {
    callsign: string; cat: VehicleCategory; country: string;
    lat: number; lng: number; alt: number; vel: number; track: number;
    vr: number;
  }[] = [
    // Transatlantic flights
    { callsign: 'BAW117', cat: 'commercial', country: 'United Kingdom', lat: 51.2, lng: -20.5, alt: 11280, vel: 250, track: 270, vr: 0 },
    { callsign: 'AAL100', cat: 'commercial', country: 'United States', lat: 48.5, lng: -30.2, alt: 10670, vel: 245, track: 85, vr: 0 },
    { callsign: 'DLH400', cat: 'commercial', country: 'Germany', lat: 52.1, lng: -15.3, alt: 11890, vel: 252, track: 275, vr: 0 },
    { callsign: 'AFR012', cat: 'commercial', country: 'France', lat: 49.8, lng: -8.2, alt: 10360, vel: 240, track: 260, vr: 0 },
    { callsign: 'UAE201', cat: 'commercial', country: 'UAE', lat: 25.2, lng: 55.3, alt: 12500, vel: 260, track: 310, vr: 5 },
    // Pacific flights
    { callsign: 'JAL001', cat: 'commercial', country: 'Japan', lat: 42.5, lng: -170.0, alt: 11580, vel: 255, track: 55, vr: 0 },
    { callsign: 'SIA12', cat: 'commercial', country: 'Singapore', lat: 55.0, lng: 150.0, alt: 12800, vel: 258, track: 45, vr: 0 },
    { callsign: 'QFA7', cat: 'commercial', country: 'Australia', lat: -5.0, lng: 120.5, alt: 11900, vel: 248, track: 320, vr: 0 },
    { callsign: 'CPA840', cat: 'commercial', country: 'Hong Kong', lat: 35.2, lng: 140.5, alt: 10200, vel: 230, track: 200, vr: 0 },
    // European flights
    { callsign: 'RYR1234', cat: 'commercial', country: 'Ireland', lat: 48.5, lng: 2.5, alt: 10970, vel: 230, track: 180, vr: 0 },
    { callsign: 'EZY5678', cat: 'commercial', country: 'United Kingdom', lat: 43.5, lng: 5.5, alt: 11280, vel: 225, track: 165, vr: 0 },
    { callsign: 'SAS937', cat: 'commercial', country: 'Sweden', lat: 59.6, lng: 17.9, alt: 8500, vel: 200, track: 90, vr: -3 },
    { callsign: 'THY1952', cat: 'commercial', country: 'Turkey', lat: 41.0, lng: 28.9, alt: 9800, vel: 220, track: 120, vr: 0 },
    // Military
    { callsign: 'RCH450', cat: 'military', country: 'United States', lat: 36.5, lng: -10.2, alt: 9140, vel: 220, track: 90, vr: 0 },
    { callsign: 'DUKE01', cat: 'military', country: 'United States', lat: 50.5, lng: -5.0, alt: 7620, vel: 195, track: 180, vr: 0 },
    { callsign: 'NAVY12', cat: 'military', country: 'United States', lat: 32.5, lng: -65.0, alt: 6100, vel: 180, track: 45, vr: 0 },
    { callsign: 'FORCE1', cat: 'military', country: 'France', lat: 44.0, lng: 3.0, alt: 8500, vel: 210, track: 300, vr: 0 },
    // Private
    { callsign: 'N123AB', cat: 'private', country: 'United States', lat: 40.7, lng: -74.0, alt: 3050, vel: 120, track: 220, vr: -2 },
    { callsign: 'G-LUXE', cat: 'private', country: 'United Kingdom', lat: 51.5, lng: -0.5, alt: 5490, vel: 150, track: 135, vr: 0 },
    { callsign: 'D-IFLY', cat: 'private', country: 'Germany', lat: 48.3, lng: 11.8, alt: 4570, vel: 130, track: 200, vr: 0 },
    { callsign: 'HB-JET', cat: 'private', country: 'Switzerland', lat: 46.2, lng: 6.1, alt: 6400, vel: 160, track: 90, vr: 2 },
    // Cargo
    { callsign: 'FDX901', cat: 'cargo', country: 'United States', lat: 38.2, lng: -85.7, alt: 10670, vel: 240, track: 270, vr: 0 },
    { callsign: 'UPS234', cat: 'cargo', country: 'United States', lat: 33.9, lng: -84.4, alt: 9750, vel: 235, track: 180, vr: 0 },
    { callsign: 'CLX789', cat: 'cargo', country: 'Luxembourg', lat: 49.6, lng: 6.2, alt: 11280, vel: 250, track: 90, vr: 0 },
    // Helicopters
    { callsign: 'USCG21', cat: 'helicopter', country: 'United States', lat: 29.7, lng: -90.0, alt: 300, vel: 60, track: 150, vr: 0 },
    { callsign: 'HEMS04', cat: 'helicopter', country: 'United Kingdom', lat: 51.5, lng: -0.1, alt: 500, vel: 70, track: 45, vr: 0 },
    // Middle East / Africa
    { callsign: 'MEA315', cat: 'commercial', country: 'Lebanon', lat: 33.8, lng: 35.5, alt: 8200, vel: 220, track: 310, vr: 5 },
    { callsign: 'SAA205', cat: 'commercial', country: 'South Africa', lat: -15.0, lng: 25.0, alt: 11500, vel: 245, track: 180, vr: 0 },
    { callsign: 'ETH501', cat: 'commercial', country: 'Ethiopia', lat: 9.0, lng: 38.7, alt: 10200, vel: 230, track: 350, vr: 0 },
    // South America
    { callsign: 'LAN801', cat: 'commercial', country: 'Chile', lat: -23.5, lng: -46.6, alt: 10970, vel: 240, track: 200, vr: 0 },
    { callsign: 'AVA019', cat: 'commercial', country: 'Colombia', lat: 4.7, lng: -74.1, alt: 9500, vel: 225, track: 180, vr: 0 },
    // Asia
    { callsign: 'AIC102', cat: 'commercial', country: 'India', lat: 19.1, lng: 72.9, alt: 10360, vel: 235, track: 45, vr: 0 },
    { callsign: 'CCA981', cat: 'commercial', country: 'China', lat: 39.9, lng: 116.4, alt: 11280, vel: 248, track: 90, vr: 0 },
    { callsign: 'KAL023', cat: 'commercial', country: 'South Korea', lat: 37.5, lng: 126.9, alt: 10670, vel: 242, track: 270, vr: 0 },
  ];

  const now = Math.floor(Date.now() / 1000);

  return routes.map((r, i) => {
    // Add slight randomization to positions
    const jitterLat = (Math.random() - 0.5) * 2;
    const jitterLng = (Math.random() - 0.5) * 2;

    return {
      type: 'aircraft' as const,
      icao24: `fallback_${i.toString(16).padStart(6, '0')}`,
      callsign: r.callsign,
      originCountry: r.country,
      longitude: r.lng + jitterLng,
      latitude: r.lat + jitterLat,
      baroAltitude: r.alt,
      geoAltitude: r.alt,
      onGround: false,
      velocity: r.vel,
      trueTrack: r.track,
      verticalRate: r.vr,
      squawk: null,
      category: r.cat,
      lastContact: now,
      timePosition: now,
      trajectory: generateFallbackTrajectory(r.lat + jitterLat, r.lng + jitterLng, r.track, r.vel, now),
      heading: r.track,
      speedKnots: Math.round(r.vel * 1.94384),
      altitudeFeet: Math.round(r.alt * 3.28084),
    };
  });
}

function generateFallbackTrajectory(lat: number, lng: number, track: number, vel: number, now: number): Position[] {
  const positions: Position[] = [];
  const trackRad = (track * Math.PI) / 180;
  const stepSeconds = 300; // 5-min intervals

  // Generate 12 past positions (1 hour history)
  for (let i = 12; i >= 1; i--) {
    const dt = i * stepSeconds;
    const distDeg = (vel * dt) / 111320; // rough m/s to degrees
    positions.push({
      lat: lat - Math.cos(trackRad) * distDeg,
      lng: lng - Math.sin(trackRad) * distDeg,
      alt: undefined,
      timestamp: now - dt,
    });
  }

  return positions;
}
