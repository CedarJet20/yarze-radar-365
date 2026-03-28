// ============================================================
// Maritime AIS Data — Simulated Realistic Vessel Traffic
// Architecture ready for real AIS API integration
// ============================================================

import type { Vessel, VesselCategory, Position } from '../types';

// Major shipping lanes and ports with realistic vessel data
const VESSEL_TEMPLATES: {
  name: string; mmsi: string; imo: string; callsign: string;
  vesselType: VesselCategory; flag: string; destination: string; eta: string;
  lat: number; lng: number; course: number; speed: number;
  length: number; width: number; draught: number; status: string;
}[] = [
  // Mediterranean
  { name: 'MSC OSCAR', mmsi: '353136000', imo: '9703318', callsign: 'H3RC', vesselType: 'cargo', flag: 'Panama', destination: 'ROTTERDAM', eta: '2026-03-30 14:00', lat: 35.8, lng: 14.5, course: 290, speed: 18.5, length: 395, width: 59, draught: 16.0, status: 'Under way using engine' },
  { name: 'EMMA MAERSK', mmsi: '220417000', imo: '9321483', callsign: 'OYGR2', vesselType: 'cargo', flag: 'Denmark', destination: 'SUEZ CANAL', eta: '2026-03-29 08:00', lat: 34.2, lng: 24.8, course: 115, speed: 20.2, length: 397, width: 56, draught: 15.5, status: 'Under way using engine' },
  { name: 'COSTA SMERALDA', mmsi: '247369500', imo: '9785648', callsign: 'ICSE', vesselType: 'passenger', flag: 'Italy', destination: 'BARCELONA', eta: '2026-03-29 07:00', lat: 41.3, lng: 4.2, course: 245, speed: 16.0, length: 337, width: 42, draught: 8.8, status: 'Under way using engine' },

  // English Channel / North Sea
  { name: 'EVER GIVEN', mmsi: '353136001', imo: '9811000', callsign: 'H3RC2', vesselType: 'cargo', flag: 'Panama', destination: 'FELIXSTOWE', eta: '2026-03-28 22:00', lat: 50.8, lng: 1.2, course: 45, speed: 12.5, length: 400, width: 59, draught: 16.0, status: 'Under way using engine' },
  { name: 'SPIRIT OF BRITAIN', mmsi: '235090714', imo: '9524231', callsign: 'MHBV9', vesselType: 'passenger', flag: 'United Kingdom', destination: 'CALAIS', eta: '2026-03-28 18:30', lat: 51.0, lng: 1.5, course: 140, speed: 22.0, length: 213, width: 31, draught: 6.5, status: 'Under way using engine' },

  // Gulf & Indian Ocean
  { name: 'CRUDE SPIRIT', mmsi: '538006712', imo: '9489234', callsign: 'V7A38', vesselType: 'tanker', flag: 'Marshall Islands', destination: 'MUMBAI', eta: '2026-04-01 06:00', lat: 22.5, lng: 60.2, course: 110, speed: 13.5, length: 333, width: 60, draught: 22.0, status: 'Under way using engine' },
  { name: 'AL JASRA', mmsi: '466320000', imo: '9337034', callsign: 'A6E47', vesselType: 'tanker', flag: 'UAE', destination: 'RAS TANURA', eta: '2026-03-29 12:00', lat: 26.3, lng: 50.5, course: 340, speed: 10.2, length: 285, width: 46, draught: 18.0, status: 'Under way using engine' },

  // Pacific
  { name: 'COSCO SHIPPING UNIVERSE', mmsi: '477328800', imo: '9795610', callsign: 'VRLD4', vesselType: 'cargo', flag: 'Hong Kong', destination: 'LONG BEACH', eta: '2026-04-05 08:00', lat: 35.0, lng: -160.0, course: 75, speed: 19.0, length: 400, width: 59, draught: 16.0, status: 'Under way using engine' },
  { name: 'NYK BLUE JAY', mmsi: '431501740', imo: '9741402', callsign: 'JD3571', vesselType: 'cargo', flag: 'Japan', destination: 'YOKOHAMA', eta: '2026-03-30 20:00', lat: 30.5, lng: 145.0, course: 310, speed: 17.5, length: 364, width: 50, draught: 14.5, status: 'Under way using engine' },

  // Atlantic
  { name: 'QUEEN MARY 2', mmsi: '310627000', imo: '9241061', callsign: 'ZCEF6', vesselType: 'passenger', flag: 'Bermuda', destination: 'NEW YORK', eta: '2026-04-02 06:00', lat: 42.5, lng: -45.0, course: 260, speed: 24.0, length: 345, width: 41, draught: 10.3, status: 'Under way using engine' },
  { name: 'HARMONY OF THE SEAS', mmsi: '229082000', imo: '9682875', callsign: 'C6BQ3', vesselType: 'passenger', flag: 'Bahamas', destination: 'MIAMI', eta: '2026-03-30 08:00', lat: 22.0, lng: -75.5, course: 220, speed: 18.5, length: 362, width: 66, draught: 9.3, status: 'Under way using engine' },

  // South China Sea
  { name: 'ATLANTIC PIONEER', mmsi: '636017834', imo: '9756102', callsign: 'D5IK2', vesselType: 'tanker', flag: 'Liberia', destination: 'SINGAPORE', eta: '2026-03-29 16:00', lat: 8.5, lng: 112.0, course: 195, speed: 14.0, length: 250, width: 44, draught: 17.0, status: 'Under way using engine' },

  // Fishing vessels
  { name: 'ATLANTIC FISHER', mmsi: '224567890', imo: '8712345', callsign: 'ECFH', vesselType: 'fishing', flag: 'Spain', destination: 'VIGO', eta: '', lat: 43.5, lng: -9.8, course: 180, speed: 4.5, length: 85, width: 14, draught: 6.0, status: 'Engaged in fishing' },
  { name: 'NORDIC STAR', mmsi: '258765000', imo: '8812346', callsign: 'LNFK', vesselType: 'fishing', flag: 'Norway', destination: 'TROMSØ', eta: '', lat: 68.5, lng: 15.2, course: 30, speed: 3.8, length: 65, width: 12, draught: 5.5, status: 'Engaged in fishing' },

  // Military
  { name: 'USS GERALD R. FORD', mmsi: '369970001', imo: '', callsign: 'NFRD', vesselType: 'military', flag: 'United States', destination: '-', eta: '', lat: 36.8, lng: -6.5, course: 90, speed: 25.0, length: 337, width: 78, draught: 12.0, status: 'Under way using engine' },
  { name: 'HMS QUEEN ELIZABETH', mmsi: '232001500', imo: '', callsign: 'GQEC', vesselType: 'military', flag: 'United Kingdom', destination: '-', eta: '', lat: 50.5, lng: -3.5, course: 210, speed: 20.0, length: 284, width: 73, draught: 11.0, status: 'Under way using engine' },
  { name: 'FS CHARLES DE GAULLE', mmsi: '228160800', imo: '', callsign: 'FAEK', vesselType: 'military', flag: 'France', destination: '-', eta: '', lat: 33.5, lng: 32.5, course: 270, speed: 22.0, length: 261, width: 64, draught: 9.4, status: 'Under way using engine' },

  // Sailing
  { name: 'SEA CLOUD II', mmsi: '256432000', imo: '9171292', callsign: '9HA2539', vesselType: 'sailing', flag: 'Malta', destination: 'PIRAEUS', eta: '2026-03-31 12:00', lat: 37.0, lng: 20.5, course: 120, speed: 8.0, length: 117, width: 16, draught: 5.7, status: 'Under way sailing' },

  // Tugs
  { name: 'SVITZER HERMOD', mmsi: '219016689', imo: '9543458', callsign: 'OXJJ2', vesselType: 'tug', flag: 'Denmark', destination: 'ROTTERDAM HARBOR', eta: '', lat: 51.9, lng: 4.1, course: 315, speed: 6.5, length: 32, width: 13, draught: 5.0, status: 'Under way using engine' },

  // More cargo across the globe
  { name: 'CMA CGM JACQUES SAADE', mmsi: '228339600', imo: '9839179', callsign: 'FMGP', vesselType: 'cargo', flag: 'France', destination: 'SHANGHAI', eta: '2026-04-08 18:00', lat: 12.5, lng: 45.5, course: 80, speed: 21.0, length: 400, width: 61, draught: 16.5, status: 'Under way using engine' },
  { name: 'HMM ALGECIRAS', mmsi: '440457000', imo: '9863297', callsign: 'HO5398', vesselType: 'cargo', flag: 'South Korea', destination: 'BUSAN', eta: '2026-04-03 10:00', lat: 20.0, lng: 115.0, course: 30, speed: 18.5, length: 400, width: 61, draught: 16.5, status: 'Under way using engine' },
  { name: 'MOL TRIUMPH', mmsi: '431604567', imo: '9769271', callsign: 'JG3967', vesselType: 'cargo', flag: 'Japan', destination: 'TOKYO', eta: '2026-03-31 14:00', lat: 28.0, lng: 135.0, course: 40, speed: 17.0, length: 400, width: 59, draught: 16.0, status: 'Under way using engine' },

  // South America
  { name: 'SANTOS EXPRESS', mmsi: '710345678', imo: '9567890', callsign: 'PPSE', vesselType: 'cargo', flag: 'Brazil', destination: 'SANTOS', eta: '2026-03-30 06:00', lat: -20.0, lng: -30.5, course: 225, speed: 16.0, length: 300, width: 48, draught: 13.5, status: 'Under way using engine' },

  // Africa
  { name: 'CAPE TOWN STAR', mmsi: '601234567', imo: '9678901', callsign: 'ZSA1', vesselType: 'cargo', flag: 'South Africa', destination: 'CAPE TOWN', eta: '2026-03-31 20:00', lat: -30.0, lng: 15.5, course: 180, speed: 15.0, length: 260, width: 40, draught: 12.0, status: 'Under way using engine' },
];

function generateTrajectory(lat: number, lng: number, course: number, speed: number, now: number): Position[] {
  const positions: Position[] = [];
  const courseRad = (course * Math.PI) / 180;
  const knotsToDegreesPerSec = 1 / (3600 * 60); // very rough

  for (let i = 24; i >= 1; i--) {
    const dt = i * 1800; // 30 min intervals
    const distDeg = speed * knotsToDegreesPerSec * dt * 60;
    positions.push({
      lat: lat - Math.cos(courseRad) * distDeg,
      lng: lng - Math.sin(courseRad) * distDeg,
      timestamp: now - dt,
    });
  }

  return positions;
}

export function fetchAllVessels(): Vessel[] {
  const now = Math.floor(Date.now() / 1000);

  return VESSEL_TEMPLATES.map(t => {
    // Add slight movement randomization
    const jitterLat = (Math.random() - 0.5) * 0.5;
    const jitterLng = (Math.random() - 0.5) * 0.5;
    const lat = t.lat + jitterLat;
    const lng = t.lng + jitterLng;

    return {
      type: 'vessel' as const,
      mmsi: t.mmsi,
      name: t.name,
      imo: t.imo,
      callsign: t.callsign,
      vesselType: t.vesselType,
      flag: t.flag,
      longitude: lng,
      latitude: lat,
      course: t.course + (Math.random() - 0.5) * 5,
      speed: t.speed + (Math.random() - 0.5) * 2,
      heading: t.course,
      destination: t.destination,
      eta: t.eta,
      draught: t.draught,
      length: t.length,
      width: t.width,
      status: t.status,
      lastUpdate: now,
      trajectory: generateTrajectory(lat, lng, t.course, t.speed, now),
    };
  });
}
