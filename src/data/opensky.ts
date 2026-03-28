// ============================================================
// OpenSky Network API — Live ADS-B Air Traffic Data
// ============================================================

import type { Aircraft, VehicleCategory, OpenSkyState, Position } from '../types';
import type { AircraftSize } from './aircraft-db';
import { lookupAirline } from './airlines';
import { AIRPORTS } from './airports';

const OPENSKY_BASE = 'https://opensky-network.org/api';

// Category mapping from OpenSky category field
function classifyAircraft(
  categoryNum: number | null,
  callsign: string,
): { category: VehicleCategory; aircraftSize: AircraftSize } {
  // Military callsign prefixes (common ones)
  const militaryPrefixes = [
    'RCH', 'DUKE', 'EVAC', 'JAKE', 'KING', 'NAVY', 'ARMY', 'CASA',
    'FORCE', 'REACH', 'SPAR', 'SAM', 'MARNS', 'TOPCT', 'VIPER',
    'HAWK', 'EAGLE', 'COBRA', 'WEASL', 'TIGER', 'BEAR', 'RRR',
    'CNV', 'PAT', 'RED', 'BOLT', 'FURY', 'RAGE',
  ];
  const cs = callsign.trim().toUpperCase();
  if (militaryPrefixes.some(p => cs.startsWith(p))) {
    return { category: 'military', aircraftSize: 'military-transport' };
  }

  // Helicopter category
  if (categoryNum === 7 || categoryNum === 10) {
    return { category: 'helicopter', aircraftSize: 'helicopter' };
  }

  // Light aircraft → private
  if (categoryNum === 1) {
    return { category: 'private', aircraftSize: 'light-aircraft' };
  }
  if (categoryNum === 2) {
    return { category: 'private', aircraftSize: 'business-jet' };
  }

  // Large → narrow-body commercial
  if (categoryNum === 3) {
    return { category: 'commercial', aircraftSize: 'narrow-body' };
  }
  // Heavy → wide-body-twin commercial
  if (categoryNum === 4) {
    return { category: 'commercial', aircraftSize: 'wide-body-twin' };
  }
  // High-performance → wide-body-quad
  if (categoryNum === 5) {
    return { category: 'commercial', aircraftSize: 'wide-body-quad' };
  }

  // Cargo callsign prefixes
  const cargoPrefixes = ['FDX', 'UPS', 'GTI', 'CLX', 'ABW', 'MPH', 'BOX', 'CKS'];
  if (cargoPrefixes.some(p => cs.startsWith(p))) {
    return { category: 'cargo', aircraftSize: 'wide-body-twin' };
  }

  // Default to commercial for airline-like callsigns (3-letter prefix + digits)
  if (/^[A-Z]{2,3}\d/.test(cs)) {
    return { category: 'commercial', aircraftSize: 'narrow-body' };
  }

  return { category: 'private', aircraftSize: 'light-aircraft' };
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

      const { category: cat, aircraftSize } = classifyAircraft(category, callsign);
      const airlineInfo = lookupAirline(callsign);

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
        category: cat,
        lastContact: s[4] as number,
        timePosition: s[3] as number | null,
        trajectory: [],
        heading: trueTrack ?? 0,
        speedKnots: velocity ? Math.round(velocity * 1.94384) : 0,
        altitudeFeet: Math.round((geoAlt ?? baroAlt ?? 0) * 3.28084),
        // Extended info — defaults
        airlineName: airlineInfo?.name ?? '',
        tailNumber: '',
        aircraftModel: '',
        aircraftManufacturer: '',
        aircraftSize,
        engineCount: 2,
        departureAirport: null,
        arrivalAirport: null,
        departureTime: null,
        etaTime: null,
        progress: 0,
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

// ============================================================
// Fallback data — 118 aircraft across all world regions
// ============================================================

interface FallbackRoute {
  callsign: string;
  cat: VehicleCategory;
  country: string;
  lat: number;
  lng: number;
  alt: number;   // meters
  vel: number;   // m/s
  track: number; // degrees
  vr: number;    // vertical rate m/s
  airline: string;
  tailNumber: string;
  model: string;
  manufacturer: string;
  size: AircraftSize;
  engines: number;
  depICAO: string;
  arrICAO: string;
}

const ROUTES: FallbackRoute[] = [
  // ======================== TRANSATLANTIC (~12) ========================
  { callsign: 'BAW117', cat: 'commercial', country: 'United Kingdom', lat: 52.0, lng: -20.0, alt: 11280, vel: 250, track: 270, vr: 0,
    airline: 'British Airways', tailNumber: 'G-XWBA', model: 'Airbus A350-1000', manufacturer: 'Airbus', size: 'wide-body-twin', engines: 2, depICAO: 'EGLL', arrICAO: 'KJFK' },
  { callsign: 'AAL100', cat: 'commercial', country: 'United States', lat: 49.0, lng: -30.0, alt: 10670, vel: 245, track: 85, vr: 0,
    airline: 'American Airlines', tailNumber: 'N717AN', model: 'Boeing 777-300ER', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, depICAO: 'KJFK', arrICAO: 'EGLL' },
  { callsign: 'DLH400', cat: 'commercial', country: 'Germany', lat: 53.5, lng: -15.0, alt: 11890, vel: 252, track: 275, vr: 0,
    airline: 'Lufthansa', tailNumber: 'D-AIMA', model: 'Airbus A380-800', manufacturer: 'Airbus', size: 'wide-body-quad', engines: 4, depICAO: 'EDDF', arrICAO: 'KJFK' },
  { callsign: 'AFR012', cat: 'commercial', country: 'France', lat: 50.5, lng: -8.0, alt: 10360, vel: 240, track: 260, vr: 0,
    airline: 'Air France', tailNumber: 'F-HTYA', model: 'Boeing 787-9 Dreamliner', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, depICAO: 'LFPG', arrICAO: 'KORD' },
  { callsign: 'UAL90', cat: 'commercial', country: 'United States', lat: 55.0, lng: -25.0, alt: 11580, vel: 255, track: 80, vr: 0,
    airline: 'United Airlines', tailNumber: 'N2749U', model: 'Boeing 787-10 Dreamliner', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, depICAO: 'KEWR', arrICAO: 'EDDF' },
  { callsign: 'DAL47', cat: 'commercial', country: 'United States', lat: 47.5, lng: -35.0, alt: 10970, vel: 248, track: 75, vr: 0,
    airline: 'Delta Air Lines', tailNumber: 'N501DN', model: 'Airbus A350-900', manufacturer: 'Airbus', size: 'wide-body-twin', engines: 2, depICAO: 'KATL', arrICAO: 'LFPG' },
  { callsign: 'VIR3', cat: 'commercial', country: 'United Kingdom', lat: 51.0, lng: -40.0, alt: 11280, vel: 258, track: 265, vr: 0,
    airline: 'Virgin Atlantic', tailNumber: 'G-VLUX', model: 'Airbus A350-1000', manufacturer: 'Airbus', size: 'wide-body-twin', engines: 2, depICAO: 'EGLL', arrICAO: 'KJFK' },
  { callsign: 'ACA855', cat: 'commercial', country: 'Canada', lat: 54.0, lng: -45.0, alt: 11580, vel: 250, track: 90, vr: 0,
    airline: 'Air Canada', tailNumber: 'C-FVNB', model: 'Boeing 787-9 Dreamliner', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, depICAO: 'CYYZ', arrICAO: 'EGLL' },
  { callsign: 'IBE6253', cat: 'commercial', country: 'Spain', lat: 46.0, lng: -18.0, alt: 10670, vel: 245, track: 280, vr: 0,
    airline: 'Iberia', tailNumber: 'EC-MYX', model: 'Airbus A330-200', manufacturer: 'Airbus', size: 'wide-body-twin', engines: 2, depICAO: 'LEMD', arrICAO: 'KMIA' },
  { callsign: 'TAP205', cat: 'commercial', country: 'Portugal', lat: 44.0, lng: -22.0, alt: 11280, vel: 242, track: 265, vr: 0,
    airline: 'TAP Air Portugal', tailNumber: 'CS-TUA', model: 'Airbus A330-900neo', manufacturer: 'Airbus', size: 'wide-body-twin', engines: 2, depICAO: 'LPPT', arrICAO: 'KEWR' },
  { callsign: 'ICE614', cat: 'commercial', country: 'Iceland', lat: 58.0, lng: -28.0, alt: 11890, vel: 248, track: 270, vr: 0,
    airline: 'Icelandair', tailNumber: 'TF-ICE', model: 'Boeing 737 MAX 9', manufacturer: 'Boeing', size: 'narrow-body', engines: 2, depICAO: 'BIKF', arrICAO: 'KJFK' },
  { callsign: 'EIN104', cat: 'commercial', country: 'Ireland', lat: 52.5, lng: -12.0, alt: 11280, vel: 240, track: 275, vr: 0,
    airline: 'Aer Lingus', tailNumber: 'EI-LRA', model: 'Airbus A321neo', manufacturer: 'Airbus', size: 'narrow-body', engines: 2, depICAO: 'EIDW', arrICAO: 'KBOS' },

  // ======================== EUROPEAN (~15) ========================
  { callsign: 'RYR1234', cat: 'commercial', country: 'Ireland', lat: 48.5, lng: 2.5, alt: 10970, vel: 230, track: 180, vr: 0,
    airline: 'Ryanair', tailNumber: 'EI-DWO', model: 'Boeing 737-800', manufacturer: 'Boeing', size: 'narrow-body', engines: 2, depICAO: 'EIDW', arrICAO: 'LEBL' },
  { callsign: 'EZY5678', cat: 'commercial', country: 'United Kingdom', lat: 43.5, lng: 5.5, alt: 11280, vel: 225, track: 165, vr: 0,
    airline: 'easyJet', tailNumber: 'G-EZWM', model: 'Airbus A320neo', manufacturer: 'Airbus', size: 'narrow-body', engines: 2, depICAO: 'EGKK', arrICAO: 'LEMD' },
  { callsign: 'SAS937', cat: 'commercial', country: 'Sweden', lat: 56.0, lng: 14.0, alt: 8500, vel: 210, track: 195, vr: -3,
    airline: 'Scandinavian Airlines', tailNumber: 'LN-RGN', model: 'Airbus A320neo', manufacturer: 'Airbus', size: 'narrow-body', engines: 2, depICAO: 'ESSA', arrICAO: 'EKCH' },
  { callsign: 'THY1952', cat: 'commercial', country: 'Turkey', lat: 44.0, lng: 20.0, alt: 11280, vel: 235, track: 310, vr: 0,
    airline: 'Turkish Airlines', tailNumber: 'TC-JJE', model: 'Boeing 777-300ER', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, depICAO: 'LTFM', arrICAO: 'EGLL' },
  { callsign: 'DLH1020', cat: 'commercial', country: 'Germany', lat: 49.0, lng: 10.0, alt: 9800, vel: 220, track: 175, vr: 0,
    airline: 'Lufthansa', tailNumber: 'D-AIUA', model: 'Airbus A320neo', manufacturer: 'Airbus', size: 'narrow-body', engines: 2, depICAO: 'EDDF', arrICAO: 'LIRF' },
  { callsign: 'AFR1580', cat: 'commercial', country: 'France', lat: 47.5, lng: 5.0, alt: 10360, vel: 225, track: 150, vr: 0,
    airline: 'Air France', tailNumber: 'F-GKXR', model: 'Airbus A320', manufacturer: 'Airbus', size: 'narrow-body', engines: 2, depICAO: 'LFPG', arrICAO: 'LGAV' },
  { callsign: 'KLM1678', cat: 'commercial', country: 'Netherlands', lat: 50.0, lng: 6.5, alt: 10670, vel: 228, track: 170, vr: 0,
    airline: 'KLM Royal Dutch Airlines', tailNumber: 'PH-BXI', model: 'Boeing 737-800', manufacturer: 'Boeing', size: 'narrow-body', engines: 2, depICAO: 'EHAM', arrICAO: 'LEBL' },
  { callsign: 'WZZ4412', cat: 'commercial', country: 'Hungary', lat: 47.0, lng: 18.0, alt: 10360, vel: 222, track: 220, vr: 0,
    airline: 'Wizz Air', tailNumber: 'HA-LXA', model: 'Airbus A321neo', manufacturer: 'Airbus', size: 'narrow-body', engines: 2, depICAO: 'EPWA', arrICAO: 'LEBL' },
  { callsign: 'SWR180', cat: 'commercial', country: 'Switzerland', lat: 48.0, lng: 8.5, alt: 9500, vel: 215, track: 25, vr: 3,
    airline: 'Swiss International Air Lines', tailNumber: 'HB-JNA', model: 'Boeing 777-300ER', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, depICAO: 'LSZH', arrICAO: 'ESSA' },
  { callsign: 'AZA610', cat: 'commercial', country: 'Italy', lat: 42.5, lng: 12.0, alt: 8200, vel: 210, track: 350, vr: 5,
    airline: 'ITA Airways', tailNumber: 'EI-IMP', model: 'Airbus A320neo', manufacturer: 'Airbus', size: 'narrow-body', engines: 2, depICAO: 'LIRF', arrICAO: 'EDDF' },
  { callsign: 'FIN805', cat: 'commercial', country: 'Finland', lat: 58.0, lng: 22.0, alt: 10970, vel: 230, track: 190, vr: 0,
    airline: 'Finnair', tailNumber: 'OH-LWA', model: 'Airbus A350-900', manufacturer: 'Airbus', size: 'wide-body-twin', engines: 2, depICAO: 'EFHK', arrICAO: 'EGLL' },
  { callsign: 'LOT281', cat: 'commercial', country: 'Poland', lat: 51.5, lng: 18.0, alt: 10360, vel: 225, track: 250, vr: 0,
    airline: 'LOT Polish Airlines', tailNumber: 'SP-LRA', model: 'Boeing 787-8 Dreamliner', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, depICAO: 'EPWA', arrICAO: 'LFPG' },
  { callsign: 'NAX7015', cat: 'commercial', country: 'Norway', lat: 56.5, lng: 8.0, alt: 10670, vel: 225, track: 200, vr: 0,
    airline: 'Norwegian Air Shuttle', tailNumber: 'LN-DYM', model: 'Boeing 737-800', manufacturer: 'Boeing', size: 'narrow-body', engines: 2, depICAO: 'ENGM', arrICAO: 'LEMD' },
  { callsign: 'AEE340', cat: 'commercial', country: 'Greece', lat: 39.5, lng: 22.0, alt: 9200, vel: 218, track: 320, vr: 0,
    airline: 'Aegean Airlines', tailNumber: 'SX-DVT', model: 'Airbus A320neo', manufacturer: 'Airbus', size: 'narrow-body', engines: 2, depICAO: 'LGAV', arrICAO: 'EDDF' },
  { callsign: 'PGT701', cat: 'commercial', country: 'Turkey', lat: 40.0, lng: 30.0, alt: 10360, vel: 225, track: 285, vr: 0,
    airline: 'Pegasus Airlines', tailNumber: 'TC-NBL', model: 'Airbus A320neo', manufacturer: 'Airbus', size: 'narrow-body', engines: 2, depICAO: 'LTFM', arrICAO: 'EHAM' },

  // ======================== MIDDLE EAST (~15) ========================
  { callsign: 'UAE201', cat: 'commercial', country: 'United Arab Emirates', lat: 30.0, lng: 40.0, alt: 12500, vel: 260, track: 310, vr: 0,
    airline: 'Emirates', tailNumber: 'A6-EUA', model: 'Airbus A380-800', manufacturer: 'Airbus', size: 'wide-body-quad', engines: 4, depICAO: 'OMDB', arrICAO: 'EGLL' },
  { callsign: 'UAE773', cat: 'commercial', country: 'United Arab Emirates', lat: 15.0, lng: 60.0, alt: 11890, vel: 258, track: 220, vr: 0,
    airline: 'Emirates', tailNumber: 'A6-ENH', model: 'Boeing 777-300ER', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, depICAO: 'OMDB', arrICAO: 'YSSY' },
  { callsign: 'QTR008', cat: 'commercial', country: 'Qatar', lat: 38.0, lng: 30.0, alt: 11580, vel: 255, track: 300, vr: 0,
    airline: 'Qatar Airways', tailNumber: 'A7-BEA', model: 'Boeing 777-300ER', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, depICAO: 'OTHH', arrICAO: 'EGLL' },
  { callsign: 'QTR777', cat: 'commercial', country: 'Qatar', lat: 28.0, lng: 55.0, alt: 12200, vel: 258, track: 45, vr: 0,
    airline: 'Qatar Airways', tailNumber: 'A7-ANA', model: 'Airbus A350-1000', manufacturer: 'Airbus', size: 'wide-body-twin', engines: 2, depICAO: 'OTHH', arrICAO: 'RJTT' },
  { callsign: 'SVA115', cat: 'commercial', country: 'Saudi Arabia', lat: 24.0, lng: 42.0, alt: 10670, vel: 240, track: 180, vr: 0,
    airline: 'Saudia', tailNumber: 'HZ-AK35', model: 'Boeing 777-300ER', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, depICAO: 'OERK', arrICAO: 'OEJN' },
  { callsign: 'MEA315', cat: 'commercial', country: 'Lebanon', lat: 34.5, lng: 33.0, alt: 8200, vel: 220, track: 310, vr: 5,
    airline: 'Middle East Airlines', tailNumber: 'OD-MRT', model: 'Airbus A321neo', manufacturer: 'Airbus', size: 'narrow-body', engines: 2, depICAO: 'OLBA', arrICAO: 'LFPG' },
  { callsign: 'ELY315', cat: 'commercial', country: 'Israel', lat: 36.0, lng: 28.0, alt: 10360, vel: 235, track: 310, vr: 0,
    airline: 'El Al Israel Airlines', tailNumber: '4X-EHD', model: 'Boeing 787-9 Dreamliner', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, depICAO: 'LLBG', arrICAO: 'EGLL' },
  { callsign: 'ETD405', cat: 'commercial', country: 'United Arab Emirates', lat: 27.0, lng: 52.0, alt: 11280, vel: 250, track: 45, vr: 0,
    airline: 'Etihad Airways', tailNumber: 'A6-BLF', model: 'Boeing 787-9 Dreamliner', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, depICAO: 'OMAL', arrICAO: 'ZBAA' },
  { callsign: 'GFA215', cat: 'commercial', country: 'Bahrain', lat: 26.5, lng: 51.0, alt: 7600, vel: 200, track: 90, vr: 3,
    airline: 'Gulf Air', tailNumber: 'A9C-TA', model: 'Airbus A321neo', manufacturer: 'Airbus', size: 'narrow-body', engines: 2, depICAO: 'OBBI', arrICAO: 'OMDB' },
  { callsign: 'OMA643', cat: 'commercial', country: 'Oman', lat: 22.0, lng: 60.0, alt: 10670, vel: 235, track: 45, vr: 0,
    airline: 'Oman Air', tailNumber: 'A4O-DE', model: 'Boeing 787-9 Dreamliner', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, depICAO: 'OOMS', arrICAO: 'WMKK' },
  { callsign: 'KAC171', cat: 'commercial', country: 'Kuwait', lat: 30.0, lng: 47.0, alt: 9800, vel: 225, track: 310, vr: 0,
    airline: 'Kuwait Airways', tailNumber: '9K-AOF', model: 'Airbus A330-200', manufacturer: 'Airbus', size: 'wide-body-twin', engines: 2, depICAO: 'OKBK', arrICAO: 'EGLL' },
  { callsign: 'RJA261', cat: 'commercial', country: 'Jordan', lat: 33.0, lng: 30.0, alt: 10360, vel: 230, track: 295, vr: 0,
    airline: 'Royal Jordanian', tailNumber: 'JY-AYR', model: 'Boeing 787-8 Dreamliner', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, depICAO: 'OJAI', arrICAO: 'KORD' },
  { callsign: 'FDB531', cat: 'commercial', country: 'United Arab Emirates', lat: 28.0, lng: 48.0, alt: 10670, vel: 230, track: 140, vr: 0,
    airline: 'flydubai', tailNumber: 'A6-FMA', model: 'Boeing 737 MAX 8', manufacturer: 'Boeing', size: 'narrow-body', engines: 2, depICAO: 'OMDB', arrICAO: 'OBBI' },
  { callsign: 'MSR985', cat: 'commercial', country: 'Egypt', lat: 32.0, lng: 30.0, alt: 10360, vel: 230, track: 310, vr: 0,
    airline: 'EgyptAir', tailNumber: 'SU-GDM', model: 'Boeing 777-300ER', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, depICAO: 'HECA', arrICAO: 'EGLL' },
  { callsign: 'IRA713', cat: 'commercial', country: 'Iran', lat: 34.0, lng: 48.0, alt: 10970, vel: 235, track: 270, vr: 0,
    airline: 'Iran Air', tailNumber: 'EP-IJA', model: 'Airbus A330-200', manufacturer: 'Airbus', size: 'wide-body-twin', engines: 2, depICAO: 'OIIE', arrICAO: 'LTFM' },

  // ======================== ASIA (~15) ========================
  { callsign: 'CCA981', cat: 'commercial', country: 'China', lat: 40.0, lng: 100.0, alt: 11280, vel: 248, track: 250, vr: 0,
    airline: 'Air China', tailNumber: 'B-1086', model: 'Airbus A350-900', manufacturer: 'Airbus', size: 'wide-body-twin', engines: 2, depICAO: 'ZBAA', arrICAO: 'LFPG' },
  { callsign: 'JAL001', cat: 'commercial', country: 'Japan', lat: 45.0, lng: 170.0, alt: 11580, vel: 255, track: 55, vr: 0,
    airline: 'Japan Airlines', tailNumber: 'JA861J', model: 'Boeing 787-9 Dreamliner', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, depICAO: 'RJTT', arrICAO: 'KSFO' },
  { callsign: 'ANA8', cat: 'commercial', country: 'Japan', lat: 50.0, lng: 160.0, alt: 11890, vel: 258, track: 50, vr: 0,
    airline: 'All Nippon Airways', tailNumber: 'JA891A', model: 'Boeing 787-9 Dreamliner', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, depICAO: 'RJAA', arrICAO: 'KORD' },
  { callsign: 'KAL023', cat: 'commercial', country: 'South Korea', lat: 37.0, lng: 135.0, alt: 10670, vel: 242, track: 270, vr: 0,
    airline: 'Korean Air', tailNumber: 'HL8275', model: 'Boeing 777-300ER', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, depICAO: 'RKSI', arrICAO: 'KJFK' },
  { callsign: 'SIA12', cat: 'commercial', country: 'Singapore', lat: 55.0, lng: 80.0, alt: 12800, vel: 258, track: 340, vr: 0,
    airline: 'Singapore Airlines', tailNumber: '9V-SMA', model: 'Airbus A350-900', manufacturer: 'Airbus', size: 'wide-body-twin', engines: 2, depICAO: 'WSSS', arrICAO: 'EDDF' },
  { callsign: 'THA501', cat: 'commercial', country: 'Thailand', lat: 18.0, lng: 95.0, alt: 10970, vel: 240, track: 320, vr: 0,
    airline: 'Thai Airways', tailNumber: 'HS-TKX', model: 'Boeing 777-300ER', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, depICAO: 'VTBS', arrICAO: 'EGLL' },
  { callsign: 'CPA840', cat: 'commercial', country: 'Hong Kong', lat: 25.0, lng: 115.0, alt: 10200, vel: 230, track: 30, vr: 0,
    airline: 'Cathay Pacific', tailNumber: 'B-LRE', model: 'Airbus A350-900', manufacturer: 'Airbus', size: 'wide-body-twin', engines: 2, depICAO: 'VHHH', arrICAO: 'RJTT' },
  { callsign: 'AIC102', cat: 'commercial', country: 'India', lat: 22.0, lng: 68.0, alt: 10360, vel: 235, track: 310, vr: 0,
    airline: 'Air India', tailNumber: 'VT-ANE', model: 'Boeing 787-8 Dreamliner', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, depICAO: 'VIDP', arrICAO: 'EGLL' },
  { callsign: 'IGO237', cat: 'commercial', country: 'India', lat: 20.0, lng: 75.0, alt: 10670, vel: 228, track: 220, vr: 0,
    airline: 'IndiGo', tailNumber: 'VT-ITA', model: 'Airbus A321neo', manufacturer: 'Airbus', size: 'narrow-body', engines: 2, depICAO: 'VIDP', arrICAO: 'VABB' },
  { callsign: 'CES219', cat: 'commercial', country: 'China', lat: 32.0, lng: 118.0, alt: 9800, vel: 225, track: 180, vr: 0,
    airline: 'China Eastern Airlines', tailNumber: 'B-305X', model: 'Airbus A320neo', manufacturer: 'Airbus', size: 'narrow-body', engines: 2, depICAO: 'ZBAA', arrICAO: 'ZSPD' },
  { callsign: 'MAS37', cat: 'commercial', country: 'Malaysia', lat: 5.0, lng: 103.0, alt: 10970, vel: 235, track: 340, vr: 0,
    airline: 'Malaysia Airlines', tailNumber: '9M-MAB', model: 'Airbus A350-900', manufacturer: 'Airbus', size: 'wide-body-twin', engines: 2, depICAO: 'WMKK', arrICAO: 'EGLL' },
  { callsign: 'GIA881', cat: 'commercial', country: 'Indonesia', lat: -2.0, lng: 110.0, alt: 10360, vel: 230, track: 350, vr: 0,
    airline: 'Garuda Indonesia', tailNumber: 'PK-GIA', model: 'Boeing 777-300ER', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, depICAO: 'WIII', arrICAO: 'OEJN' },
  { callsign: 'PAL102', cat: 'commercial', country: 'Philippines', lat: 16.0, lng: 118.0, alt: 10670, vel: 235, track: 320, vr: 0,
    airline: 'Philippine Airlines', tailNumber: 'RP-C7776', model: 'Boeing 777-300ER', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, depICAO: 'RPLL', arrICAO: 'KJFK' },
  { callsign: 'HVN57', cat: 'commercial', country: 'Vietnam', lat: 20.0, lng: 108.0, alt: 10360, vel: 228, track: 30, vr: 0,
    airline: 'Vietnam Airlines', tailNumber: 'VN-A886', model: 'Boeing 787-9 Dreamliner', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, depICAO: 'VVNB', arrICAO: 'RJAA' },
  { callsign: 'EVA12', cat: 'commercial', country: 'Taiwan', lat: 30.0, lng: 130.0, alt: 11280, vel: 248, track: 55, vr: 0,
    airline: 'EVA Air', tailNumber: 'B-17881', model: 'Boeing 787-10 Dreamliner', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, depICAO: 'RCTP', arrICAO: 'KLAX' },

  // ======================== SOUTH AMERICA (~10) ========================
  { callsign: 'LAN801', cat: 'commercial', country: 'Chile', lat: -20.0, lng: -50.0, alt: 10970, vel: 240, track: 200, vr: 0,
    airline: 'LATAM Airlines', tailNumber: 'CC-BGI', model: 'Boeing 787-9 Dreamliner', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, depICAO: 'SBGR', arrICAO: 'SCEL' },
  { callsign: 'GLO1732', cat: 'commercial', country: 'Brazil', lat: -22.0, lng: -45.0, alt: 10360, vel: 230, track: 210, vr: 0,
    airline: 'Gol Linhas Aereas', tailNumber: 'PR-GXB', model: 'Boeing 737-800', manufacturer: 'Boeing', size: 'narrow-body', engines: 2, depICAO: 'SBGR', arrICAO: 'SBGL' },
  { callsign: 'AZU4506', cat: 'commercial', country: 'Brazil', lat: -15.0, lng: -47.0, alt: 10670, vel: 235, track: 180, vr: 0,
    airline: 'Azul Brazilian Airlines', tailNumber: 'PR-AIT', model: 'Airbus A320neo', manufacturer: 'Airbus', size: 'narrow-body', engines: 2, depICAO: 'SBGR', arrICAO: 'SAEZ' },
  { callsign: 'AVA019', cat: 'commercial', country: 'Colombia', lat: 2.0, lng: -72.0, alt: 10360, vel: 228, track: 185, vr: 0,
    airline: 'Avianca', tailNumber: 'N728AV', model: 'Boeing 787-8 Dreamliner', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, depICAO: 'SKBO', arrICAO: 'SBGR' },
  { callsign: 'ARG1301', cat: 'commercial', country: 'Argentina', lat: -30.0, lng: -56.0, alt: 10670, vel: 235, track: 50, vr: 0,
    airline: 'Aerolineas Argentinas', tailNumber: 'LV-GVB', model: 'Airbus A330-200', manufacturer: 'Airbus', size: 'wide-body-twin', engines: 2, depICAO: 'SAEZ', arrICAO: 'SBGR' },
  { callsign: 'LAN534', cat: 'commercial', country: 'Chile', lat: -10.0, lng: -75.0, alt: 10970, vel: 238, track: 330, vr: 0,
    airline: 'LATAM Airlines', tailNumber: 'CC-BBI', model: 'Boeing 787-8 Dreamliner', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, depICAO: 'SCEL', arrICAO: 'KMIA' },
  { callsign: 'CMP305', cat: 'commercial', country: 'Panama', lat: 8.0, lng: -78.0, alt: 10360, vel: 225, track: 350, vr: 3,
    airline: 'Copa Airlines', tailNumber: 'HP-1825CMP', model: 'Boeing 737-800', manufacturer: 'Boeing', size: 'narrow-body', engines: 2, depICAO: 'MPTO', arrICAO: 'KMIA' },
  { callsign: 'AVA088', cat: 'commercial', country: 'Colombia', lat: 6.0, lng: -70.0, alt: 9800, vel: 220, track: 10, vr: 0,
    airline: 'Avianca', tailNumber: 'N763AV', model: 'Airbus A320neo', manufacturer: 'Airbus', size: 'narrow-body', engines: 2, depICAO: 'SKBO', arrICAO: 'KMIA' },
  { callsign: 'TAM8090', cat: 'commercial', country: 'Brazil', lat: -5.0, lng: -35.0, alt: 11280, vel: 245, track: 30, vr: 0,
    airline: 'LATAM Brasil', tailNumber: 'PT-MUA', model: 'Boeing 777-300ER', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, depICAO: 'SBGR', arrICAO: 'LFPG' },
  { callsign: 'PLU102', cat: 'commercial', country: 'Peru', lat: -8.0, lng: -75.0, alt: 10670, vel: 232, track: 340, vr: 0,
    airline: 'LATAM Peru', tailNumber: 'CC-BAW', model: 'Airbus A320neo', manufacturer: 'Airbus', size: 'narrow-body', engines: 2, depICAO: 'SPJC', arrICAO: 'SKBO' },

  // ======================== AFRICA (~10) ========================
  { callsign: 'ETH501', cat: 'commercial', country: 'Ethiopia', lat: 15.0, lng: 38.0, alt: 11280, vel: 248, track: 330, vr: 0,
    airline: 'Ethiopian Airlines', tailNumber: 'ET-AVB', model: 'Boeing 787-9 Dreamliner', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, depICAO: 'HAAB', arrICAO: 'EGLL' },
  { callsign: 'SAA205', cat: 'commercial', country: 'South Africa', lat: -15.0, lng: 28.0, alt: 11580, vel: 245, track: 350, vr: 0,
    airline: 'South African Airways', tailNumber: 'ZS-SXV', model: 'Airbus A340-300', manufacturer: 'Airbus', size: 'wide-body-quad', engines: 4, depICAO: 'FAOR', arrICAO: 'EGLL' },
  { callsign: 'KQA101', cat: 'commercial', country: 'Kenya', lat: 5.0, lng: 35.0, alt: 10670, vel: 238, track: 340, vr: 0,
    airline: 'Kenya Airways', tailNumber: '5Y-KZG', model: 'Boeing 787-8 Dreamliner', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, depICAO: 'HKJK', arrICAO: 'EHAM' },
  { callsign: 'RAM811', cat: 'commercial', country: 'Morocco', lat: 35.0, lng: -5.0, alt: 10360, vel: 230, track: 15, vr: 0,
    airline: 'Royal Air Maroc', tailNumber: 'CN-RGT', model: 'Boeing 787-9 Dreamliner', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, depICAO: 'GMMN', arrICAO: 'LFPG' },
  { callsign: 'MSR777', cat: 'commercial', country: 'Egypt', lat: 28.0, lng: 34.0, alt: 10970, vel: 240, track: 320, vr: 0,
    airline: 'EgyptAir', tailNumber: 'SU-GDP', model: 'Boeing 787-9 Dreamliner', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, depICAO: 'HECA', arrICAO: 'KJFK' },
  { callsign: 'ETH707', cat: 'commercial', country: 'Ethiopia', lat: 0.0, lng: 36.0, alt: 10360, vel: 235, track: 180, vr: 0,
    airline: 'Ethiopian Airlines', tailNumber: 'ET-AUQ', model: 'Airbus A350-900', manufacturer: 'Airbus', size: 'wide-body-twin', engines: 2, depICAO: 'HAAB', arrICAO: 'FAOR' },
  { callsign: 'RWD455', cat: 'commercial', country: 'Rwanda', lat: -3.0, lng: 32.0, alt: 10670, vel: 230, track: 170, vr: 0,
    airline: 'RwandAir', tailNumber: '9XR-WP', model: 'Airbus A330-200', manufacturer: 'Airbus', size: 'wide-body-twin', engines: 2, depICAO: 'HRYR', arrICAO: 'FAOR' },
  { callsign: 'SAA341', cat: 'commercial', country: 'South Africa', lat: -28.0, lng: 22.0, alt: 10360, vel: 235, track: 220, vr: 0,
    airline: 'South African Airways', tailNumber: 'ZS-SNG', model: 'Airbus A330-300', manufacturer: 'Airbus', size: 'wide-body-twin', engines: 2, depICAO: 'FAOR', arrICAO: 'FACT' },
  { callsign: 'DAH1003', cat: 'commercial', country: 'Algeria', lat: 36.0, lng: 3.0, alt: 10670, vel: 225, track: 10, vr: 0,
    airline: 'Air Algerie', tailNumber: '7T-VJX', model: 'Airbus A330-200', manufacturer: 'Airbus', size: 'wide-body-twin', engines: 2, depICAO: 'GMMN', arrICAO: 'LTFM' },
  { callsign: 'TAR710', cat: 'commercial', country: 'Tunisia', lat: 37.0, lng: 10.0, alt: 9800, vel: 220, track: 350, vr: 0,
    airline: 'Tunisair', tailNumber: 'TS-IMR', model: 'Airbus A320', manufacturer: 'Airbus', size: 'narrow-body', engines: 2, depICAO: 'GMMN', arrICAO: 'LFPG' },

  // ======================== NORTH AMERICA DOMESTIC (~10) ========================
  { callsign: 'AAL723', cat: 'commercial', country: 'United States', lat: 35.0, lng: -90.0, alt: 10670, vel: 235, track: 270, vr: 0,
    airline: 'American Airlines', tailNumber: 'N321US', model: 'Airbus A321neo', manufacturer: 'Airbus', size: 'narrow-body', engines: 2, depICAO: 'KJFK', arrICAO: 'KLAX' },
  { callsign: 'UAL1524', cat: 'commercial', country: 'United States', lat: 40.0, lng: -95.0, alt: 10360, vel: 230, track: 265, vr: 0,
    airline: 'United Airlines', tailNumber: 'N37502', model: 'Boeing 737 MAX 9', manufacturer: 'Boeing', size: 'narrow-body', engines: 2, depICAO: 'KEWR', arrICAO: 'KSFO' },
  { callsign: 'DAL1846', cat: 'commercial', country: 'United States', lat: 36.0, lng: -82.0, alt: 10970, vel: 232, track: 225, vr: 0,
    airline: 'Delta Air Lines', tailNumber: 'N855DN', model: 'Airbus A321neo', manufacturer: 'Airbus', size: 'narrow-body', engines: 2, depICAO: 'KJFK', arrICAO: 'KATL' },
  { callsign: 'SWA2815', cat: 'commercial', country: 'United States', lat: 33.0, lng: -100.0, alt: 10360, vel: 228, track: 270, vr: 0,
    airline: 'Southwest Airlines', tailNumber: 'N8683A', model: 'Boeing 737 MAX 8', manufacturer: 'Boeing', size: 'narrow-body', engines: 2, depICAO: 'KDFW', arrICAO: 'KLAX' },
  { callsign: 'AAL456', cat: 'commercial', country: 'United States', lat: 38.0, lng: -85.0, alt: 10670, vel: 230, track: 200, vr: 0,
    airline: 'American Airlines', tailNumber: 'N103NN', model: 'Airbus A321', manufacturer: 'Airbus', size: 'narrow-body', engines: 2, depICAO: 'KORD', arrICAO: 'KMIA' },
  { callsign: 'JBU524', cat: 'commercial', country: 'United States', lat: 39.0, lng: -76.0, alt: 9800, vel: 222, track: 190, vr: -2,
    airline: 'JetBlue Airways', tailNumber: 'N2027J', model: 'Airbus A321neo', manufacturer: 'Airbus', size: 'narrow-body', engines: 2, depICAO: 'KBOS', arrICAO: 'KMIA' },
  { callsign: 'ASA333', cat: 'commercial', country: 'United States', lat: 43.0, lng: -120.0, alt: 10970, vel: 235, track: 175, vr: 0,
    airline: 'Alaska Airlines', tailNumber: 'N926AK', model: 'Boeing 737 MAX 9', manufacturer: 'Boeing', size: 'narrow-body', engines: 2, depICAO: 'KSEA', arrICAO: 'KLAX' },
  { callsign: 'DAL927', cat: 'commercial', country: 'United States', lat: 34.0, lng: -88.0, alt: 10360, vel: 228, track: 45, vr: 0,
    airline: 'Delta Air Lines', tailNumber: 'N501DA', model: 'Boeing 737-900', manufacturer: 'Boeing', size: 'narrow-body', engines: 2, depICAO: 'KATL', arrICAO: 'KJFK' },
  { callsign: 'ACA120', cat: 'commercial', country: 'Canada', lat: 44.0, lng: -78.0, alt: 8500, vel: 210, track: 60, vr: 5,
    airline: 'Air Canada', tailNumber: 'C-FRTW', model: 'Airbus A220-300', manufacturer: 'Airbus', size: 'narrow-body', engines: 2, depICAO: 'CYYZ', arrICAO: 'CYUL' },
  { callsign: 'WJA440', cat: 'commercial', country: 'Canada', lat: 50.0, lng: -110.0, alt: 10670, vel: 235, track: 280, vr: 0,
    airline: 'WestJet', tailNumber: 'C-GURP', model: 'Boeing 737 MAX 8', manufacturer: 'Boeing', size: 'narrow-body', engines: 2, depICAO: 'CYYZ', arrICAO: 'CYVR' },

  // ======================== PACIFIC (~5) ========================
  { callsign: 'QFA7', cat: 'commercial', country: 'Australia', lat: -5.0, lng: 120.0, alt: 11890, vel: 255, track: 320, vr: 0,
    airline: 'Qantas', tailNumber: 'VH-ZNA', model: 'Boeing 787-9 Dreamliner', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, depICAO: 'YSSY', arrICAO: 'WSSS' },
  { callsign: 'ANZ1', cat: 'commercial', country: 'New Zealand', lat: -30.0, lng: 165.0, alt: 11580, vel: 250, track: 320, vr: 0,
    airline: 'Air New Zealand', tailNumber: 'ZK-NZI', model: 'Boeing 787-9 Dreamliner', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, depICAO: 'NZAA', arrICAO: 'YSSY' },
  { callsign: 'SIA22', cat: 'commercial', country: 'Singapore', lat: 10.0, lng: -170.0, alt: 12200, vel: 260, track: 50, vr: 0,
    airline: 'Singapore Airlines', tailNumber: '9V-SGE', model: 'Airbus A350-900', manufacturer: 'Airbus', size: 'wide-body-twin', engines: 2, depICAO: 'WSSS', arrICAO: 'KSFO' },
  { callsign: 'QFA93', cat: 'commercial', country: 'Australia', lat: -25.0, lng: 150.0, alt: 11280, vel: 248, track: 50, vr: 0,
    airline: 'Qantas', tailNumber: 'VH-ZNB', model: 'Airbus A380-800', manufacturer: 'Airbus', size: 'wide-body-quad', engines: 4, depICAO: 'YMML', arrICAO: 'KLAX' },
  { callsign: 'HAL2', cat: 'commercial', country: 'United States', lat: 25.0, lng: -145.0, alt: 10970, vel: 245, track: 230, vr: 0,
    airline: 'Hawaiian Airlines', tailNumber: 'N380HA', model: 'Airbus A330-200', manufacturer: 'Airbus', size: 'wide-body-twin', engines: 2, depICAO: 'KLAX', arrICAO: 'PHNL' },

  // ======================== MILITARY (~8) ========================
  { callsign: 'RCH450', cat: 'military', country: 'United States', lat: 36.5, lng: -10.0, alt: 9140, vel: 220, track: 90, vr: 0,
    airline: 'U.S. Air Force', tailNumber: '07-7189', model: 'C-17 Globemaster III', manufacturer: 'Boeing', size: 'military-transport', engines: 4, depICAO: 'KDFW', arrICAO: 'EDDF' },
  { callsign: 'DUKE01', cat: 'military', country: 'United States', lat: 50.0, lng: -5.0, alt: 7620, vel: 195, track: 180, vr: 0,
    airline: 'U.S. Air Force', tailNumber: '01-0028', model: 'C-17 Globemaster III', manufacturer: 'Boeing', size: 'military-transport', engines: 4, depICAO: 'EGLL', arrICAO: 'LIRF' },
  { callsign: 'NAVY12', cat: 'military', country: 'United States', lat: 32.5, lng: -65.0, alt: 6100, vel: 180, track: 45, vr: 0,
    airline: 'U.S. Navy', tailNumber: '169332', model: 'P-8 Poseidon', manufacturer: 'Boeing', size: 'military-transport', engines: 2, depICAO: 'KJFK', arrICAO: 'KMIA' },
  { callsign: 'FORCE1', cat: 'military', country: 'France', lat: 44.0, lng: 3.0, alt: 8500, vel: 210, track: 300, vr: 0,
    airline: 'French Air Force', tailNumber: 'F-RBAL', model: 'A400M Atlas', manufacturer: 'Airbus', size: 'military-transport', engines: 4, depICAO: 'LFPG', arrICAO: 'LEMD' },
  { callsign: 'RCH871', cat: 'military', country: 'United States', lat: 28.0, lng: 65.0, alt: 10360, vel: 230, track: 90, vr: 0,
    airline: 'U.S. Air Force', tailNumber: '05-5147', model: 'C-17 Globemaster III', manufacturer: 'Boeing', size: 'military-transport', engines: 4, depICAO: 'OMDB', arrICAO: 'VIDP' },
  { callsign: 'REACH77', cat: 'military', country: 'United States', lat: 55.0, lng: -135.0, alt: 9750, vel: 225, track: 280, vr: 0,
    airline: 'U.S. Air Force', tailNumber: '86-0018', model: 'C-5 Galaxy', manufacturer: 'Lockheed Martin', size: 'military-transport', engines: 4, depICAO: 'PANC', arrICAO: 'RJTT' },
  { callsign: 'RRR7201', cat: 'military', country: 'United Kingdom', lat: 52.0, lng: 0.0, alt: 5500, vel: 170, track: 90, vr: 0,
    airline: 'Royal Air Force', tailNumber: 'ZM416', model: 'A400M Atlas', manufacturer: 'Airbus', size: 'military-transport', engines: 4, depICAO: 'EGLL', arrICAO: 'EDDF' },
  { callsign: 'COBRA11', cat: 'military', country: 'United States', lat: 37.0, lng: -120.0, alt: 4570, vel: 280, track: 45, vr: 5,
    airline: 'U.S. Air Force', tailNumber: '09-4191', model: 'F-22 Raptor', manufacturer: 'Lockheed Martin', size: 'military-fighter', engines: 2, depICAO: 'KLAX', arrICAO: 'KSFO' },

  // ======================== CARGO (~8) ========================
  { callsign: 'FDX901', cat: 'cargo', country: 'United States', lat: 38.0, lng: -85.0, alt: 10670, vel: 240, track: 270, vr: 0,
    airline: 'FedEx Express', tailNumber: 'N858FD', model: 'Boeing 777F', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, depICAO: 'KMEM', arrICAO: 'KLAX' },
  { callsign: 'UPS234', cat: 'cargo', country: 'United States', lat: 33.5, lng: -84.0, alt: 9750, vel: 235, track: 180, vr: 0,
    airline: 'UPS Airlines', tailNumber: 'N628UP', model: 'Boeing 747-8F', manufacturer: 'Boeing', size: 'wide-body-quad', engines: 4, depICAO: 'KMEM', arrICAO: 'KMIA' },
  { callsign: 'CLX789', cat: 'cargo', country: 'Luxembourg', lat: 49.5, lng: 15.0, alt: 11280, vel: 250, track: 90, vr: 0,
    airline: 'Cargolux', tailNumber: 'LX-VCF', model: 'Boeing 747-8F', manufacturer: 'Boeing', size: 'wide-body-quad', engines: 4, depICAO: 'EHAM', arrICAO: 'VHHH' },
  { callsign: 'SQC7368', cat: 'cargo', country: 'Singapore', lat: 15.0, lng: 80.0, alt: 10970, vel: 248, track: 310, vr: 0,
    airline: 'Singapore Airlines Cargo', tailNumber: '9V-SFN', model: 'Boeing 747-400F', manufacturer: 'Boeing', size: 'wide-body-quad', engines: 4, depICAO: 'WSSS', arrICAO: 'EHAM' },
  { callsign: 'GTI8964', cat: 'cargo', country: 'United States', lat: 42.0, lng: -72.0, alt: 10360, vel: 235, track: 250, vr: 0,
    airline: 'Atlas Air', tailNumber: 'N493MC', model: 'Boeing 747-400F', manufacturer: 'Boeing', size: 'wide-body-quad', engines: 4, depICAO: 'KJFK', arrICAO: 'KORD' },
  { callsign: 'FDX5036', cat: 'cargo', country: 'United States', lat: 48.0, lng: -55.0, alt: 11280, vel: 250, track: 80, vr: 0,
    airline: 'FedEx Express', tailNumber: 'N886FD', model: 'Boeing 777F', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, depICAO: 'KMEM', arrICAO: 'LFPG' },
  { callsign: 'DHK402', cat: 'cargo', country: 'Germany', lat: 30.0, lng: 50.0, alt: 10670, vel: 242, track: 120, vr: 0,
    airline: 'DHL Aviation', tailNumber: 'D-AEAL', model: 'Airbus A330-200F', manufacturer: 'Airbus', size: 'wide-body-twin', engines: 2, depICAO: 'EDDF', arrICAO: 'OMDB' },
  { callsign: 'ETF3781', cat: 'cargo', country: 'Ethiopia', lat: 10.0, lng: 45.0, alt: 10970, vel: 245, track: 120, vr: 0,
    airline: 'Ethiopian Cargo', tailNumber: 'ET-APS', model: 'Boeing 777F', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, depICAO: 'HAAB', arrICAO: 'VHHH' },

  // ======================== PRIVATE / BUSINESS JETS (~5) ========================
  { callsign: 'N123AB', cat: 'private', country: 'United States', lat: 40.5, lng: -74.0, alt: 3050, vel: 180, track: 220, vr: -2,
    airline: '', tailNumber: 'N123AB', model: 'Gulfstream G650', manufacturer: 'Gulfstream', size: 'business-jet', engines: 2, depICAO: 'KJFK', arrICAO: 'KMIA' },
  { callsign: 'G-LUXE', cat: 'private', country: 'United Kingdom', lat: 51.5, lng: -0.5, alt: 5490, vel: 200, track: 135, vr: 0,
    airline: '', tailNumber: 'G-LUXE', model: 'Bombardier Challenger 604', manufacturer: 'Bombardier', size: 'business-jet', engines: 2, depICAO: 'EGLL', arrICAO: 'LFPG' },
  { callsign: 'D-IFLY', cat: 'private', country: 'Germany', lat: 48.3, lng: 11.8, alt: 4570, vel: 190, track: 200, vr: 0,
    airline: '', tailNumber: 'D-IFLY', model: 'Cessna Citation Sovereign', manufacturer: 'Cessna', size: 'business-jet', engines: 2, depICAO: 'EDDM', arrICAO: 'LIRF' },
  { callsign: 'HB-JET', cat: 'private', country: 'Switzerland', lat: 46.2, lng: 6.1, alt: 6400, vel: 210, track: 90, vr: 2,
    airline: '', tailNumber: 'HB-JET', model: 'Dassault Falcon 7X', manufacturer: 'Dassault', size: 'business-jet', engines: 3, depICAO: 'LSZH', arrICAO: 'LOWW' },
  { callsign: 'VP-BDJ', cat: 'private', country: 'United Arab Emirates', lat: 26.0, lng: 56.0, alt: 7600, vel: 220, track: 300, vr: 0,
    airline: '', tailNumber: 'VP-BDJ', model: 'Gulfstream G700', manufacturer: 'Gulfstream', size: 'business-jet', engines: 2, depICAO: 'OMDB', arrICAO: 'EGLL' },

  // ======================== HELICOPTERS (~5) ========================
  { callsign: 'USCG21', cat: 'helicopter', country: 'United States', lat: 29.7, lng: -90.0, alt: 300, vel: 60, track: 150, vr: 0,
    airline: 'U.S. Coast Guard', tailNumber: '6031', model: 'Sikorsky MH-60 Jayhawk', manufacturer: 'Sikorsky', size: 'helicopter', engines: 2, depICAO: 'KMIA', arrICAO: 'KMIA' },
  { callsign: 'HEMS04', cat: 'helicopter', country: 'United Kingdom', lat: 51.5, lng: -0.1, alt: 500, vel: 70, track: 45, vr: 0,
    airline: 'London Air Ambulance', tailNumber: 'G-EHMS', model: 'Airbus H135', manufacturer: 'Airbus Helicopters', size: 'helicopter', engines: 2, depICAO: 'EGLL', arrICAO: 'EGLL' },
  { callsign: 'POLCE1', cat: 'helicopter', country: 'Germany', lat: 50.1, lng: 8.7, alt: 450, vel: 65, track: 270, vr: 0,
    airline: 'German Federal Police', tailNumber: 'D-HVBX', model: 'Airbus H145', manufacturer: 'Airbus Helicopters', size: 'helicopter', engines: 2, depICAO: 'EDDF', arrICAO: 'EDDF' },
  { callsign: 'MEDEVAC', cat: 'helicopter', country: 'France', lat: 48.9, lng: 2.3, alt: 400, vel: 70, track: 180, vr: -1,
    airline: 'SAMU', tailNumber: 'F-GMHE', model: 'Airbus H145', manufacturer: 'Airbus Helicopters', size: 'helicopter', engines: 2, depICAO: 'LFPG', arrICAO: 'LFPG' },
  { callsign: 'USCG65', cat: 'helicopter', country: 'United States', lat: 37.8, lng: -122.4, alt: 350, vel: 55, track: 310, vr: 0,
    airline: 'U.S. Coast Guard', tailNumber: '6535', model: 'Sikorsky MH-60 Jayhawk', manufacturer: 'Sikorsky', size: 'helicopter', engines: 2, depICAO: 'KSFO', arrICAO: 'KSFO' },
];

// Haversine distance in km between two lat/lng points
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculateProgress(
  lat: number, lng: number,
  depLat: number, depLng: number,
  arrLat: number, arrLng: number,
): number {
  const totalDist = haversineKm(depLat, depLng, arrLat, arrLng);
  if (totalDist < 1) return 0.5; // same-airport (helicopter / local)
  const flown = haversineKm(depLat, depLng, lat, lng);
  return Math.max(0, Math.min(1, flown / totalDist));
}

function generateFallbackAircraft(): Aircraft[] {
  const now = Math.floor(Date.now() / 1000);

  return ROUTES.map((r, i) => {
    // Slight position jitter so map does not look perfectly static
    const jitterLat = (Math.random() - 0.5) * 2;
    const jitterLng = (Math.random() - 0.5) * 2;
    const lat = r.lat + jitterLat;
    const lng = r.lng + jitterLng;

    const depAirport = AIRPORTS[r.depICAO] ?? null;
    const arrAirport = AIRPORTS[r.arrICAO] ?? null;

    // Calculate progress along the route
    const progress = depAirport && arrAirport
      ? calculateProgress(lat, lng, depAirport.lat, depAirport.lng, arrAirport.lat, arrAirport.lng)
      : 0.5;

    // Estimate total flight duration from great-circle distance and speed
    const totalDistKm = depAirport && arrAirport
      ? haversineKm(depAirport.lat, depAirport.lng, arrAirport.lat, arrAirport.lng)
      : 1000;
    const speedKmH = r.vel * 3.6; // m/s → km/h
    const totalFlightSec = speedKmH > 0 ? (totalDistKm / speedKmH) * 3600 : 3600;

    const departureTime = now - progress * totalFlightSec;
    const etaTime = departureTime + totalFlightSec;

    return {
      type: 'aircraft' as const,
      icao24: `fallback_${i.toString(16).padStart(6, '0')}`,
      callsign: r.callsign,
      originCountry: r.country,
      longitude: lng,
      latitude: lat,
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
      trajectory: generateFallbackTrajectory(lat, lng, r.track, r.vel, now),
      heading: r.track,
      speedKnots: Math.round(r.vel * 1.94384),
      altitudeFeet: Math.round(r.alt * 3.28084),
      // Extended info
      airlineName: r.airline,
      tailNumber: r.tailNumber,
      aircraftModel: r.model,
      aircraftManufacturer: r.manufacturer,
      aircraftSize: r.size,
      engineCount: r.engines,
      departureAirport: depAirport,
      arrivalAirport: arrAirport,
      departureTime: Math.round(departureTime),
      etaTime: Math.round(etaTime),
      progress,
    };
  });
}

function generateFallbackTrajectory(
  lat: number, lng: number, track: number, vel: number, now: number,
): Position[] {
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
