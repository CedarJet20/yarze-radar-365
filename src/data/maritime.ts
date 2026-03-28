// ============================================================
// Maritime AIS Data — Simulated Realistic Vessel Traffic
// Architecture ready for real AIS API integration
// 53 vessels across all major shipping regions
// ============================================================

import type { Vessel, VesselCategory, Position } from '../types';
import type { Port } from './airports';
import { PORTS } from './airports';

// Helper: calculate great-circle progress between two ports given vessel position
function calcProgress(
  vesselLat: number, vesselLng: number,
  dep: Port, arr: Port,
): number {
  const dTotal = haversine(dep.lat, dep.lng, arr.lat, arr.lng);
  if (dTotal < 1) return 1.0;
  const dFromDep = haversine(dep.lat, dep.lng, vesselLat, vesselLng);
  return Math.min(1.0, Math.max(0.0, dFromDep / dTotal));
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Vessel template definition
interface VesselTemplate {
  name: string;
  mmsi: string;
  imo: string;
  callsign: string;
  vesselType: VesselCategory;
  flag: string;
  destination: string;
  eta: string;
  lat: number;
  lng: number;
  course: number;
  speed: number;
  length: number;
  width: number;
  draught: number;
  status: string;
  departurePortKey: string | null;
  arrivalPortKey: string | null;
}

const VESSEL_TEMPLATES: VesselTemplate[] = [
  // ========================================
  // MEDITERRANEAN (6)
  // ========================================
  {
    name: 'MSC OSCAR',
    mmsi: '353136000', imo: '9703318', callsign: 'H3RC',
    vesselType: 'cargo', flag: 'Panama',
    destination: 'ROTTERDAM', eta: '2026-03-30 14:00',
    lat: 35.8, lng: 14.5, course: 290, speed: 18.5,
    length: 395, width: 59, draught: 16.0,
    status: 'Under way using engine',
    departurePortKey: 'PIRAEUS', arrivalPortKey: 'ROTTERDAM',
  },
  {
    name: 'EMMA MAERSK',
    mmsi: '220417000', imo: '9321483', callsign: 'OYGR2',
    vesselType: 'cargo', flag: 'Denmark',
    destination: 'SUEZ CANAL', eta: '2026-03-29 08:00',
    lat: 34.2, lng: 24.8, course: 115, speed: 20.2,
    length: 397, width: 56, draught: 15.5,
    status: 'Under way using engine',
    departurePortKey: 'GENOA', arrivalPortKey: 'SUEZ',
  },
  {
    name: 'COSTA SMERALDA',
    mmsi: '247369500', imo: '9785648', callsign: 'ICSE',
    vesselType: 'passenger', flag: 'Italy',
    destination: 'BARCELONA', eta: '2026-03-29 07:00',
    lat: 41.3, lng: 4.2, course: 245, speed: 16.0,
    length: 337, width: 42, draught: 8.8,
    status: 'Under way using engine',
    departurePortKey: 'CIVITAVECCHIA', arrivalPortKey: 'BARCELONA',
  },
  {
    name: 'MONTE TOLEDO',
    mmsi: '224113000', imo: '9280603', callsign: 'EAJR',
    vesselType: 'tanker', flag: 'Spain',
    destination: 'ALGECIRAS', eta: '2026-03-29 22:00',
    lat: 37.5, lng: 0.8, course: 210, speed: 13.8,
    length: 274, width: 48, draught: 17.2,
    status: 'Under way using engine',
    departurePortKey: 'MARSEILLE', arrivalPortKey: 'ALGECIRAS',
  },
  {
    name: 'ATLANTIC FISHER',
    mmsi: '224567890', imo: '8712345', callsign: 'ECFH',
    vesselType: 'fishing', flag: 'Spain',
    destination: 'VIGO', eta: '',
    lat: 43.5, lng: -9.8, course: 180, speed: 4.5,
    length: 85, width: 14, draught: 6.0,
    status: 'Engaged in fishing',
    departurePortKey: 'VIGO', arrivalPortKey: 'VIGO',
  },
  {
    name: 'MSC GULSUN',
    mmsi: '353973000', imo: '9839430', callsign: 'H9ZE',
    vesselType: 'cargo', flag: 'Panama',
    destination: 'PIRAEUS', eta: '2026-03-29 10:00',
    lat: 36.4, lng: 18.2, course: 95, speed: 19.5,
    length: 400, width: 61, draught: 16.5,
    status: 'Under way using engine',
    departurePortKey: 'ALGECIRAS', arrivalPortKey: 'PIRAEUS',
  },

  // ========================================
  // NORTH SEA / ENGLISH CHANNEL (5)
  // ========================================
  {
    name: 'EVER GIVEN',
    mmsi: '353136001', imo: '9811000', callsign: 'H3RC2',
    vesselType: 'cargo', flag: 'Panama',
    destination: 'FELIXSTOWE', eta: '2026-03-28 22:00',
    lat: 50.8, lng: 1.2, course: 45, speed: 12.5,
    length: 400, width: 59, draught: 16.0,
    status: 'Under way using engine',
    departurePortKey: 'LE_HAVRE', arrivalPortKey: 'FELIXSTOWE',
  },
  {
    name: 'SPIRIT OF BRITAIN',
    mmsi: '235090714', imo: '9524231', callsign: 'MHBV9',
    vesselType: 'passenger', flag: 'United Kingdom',
    destination: 'CALAIS', eta: '2026-03-28 18:30',
    lat: 51.0, lng: 1.5, course: 140, speed: 22.0,
    length: 213, width: 31, draught: 6.5,
    status: 'Under way using engine',
    departurePortKey: 'DOVER', arrivalPortKey: 'CALAIS',
  },
  {
    name: 'SVITZER HERMOD',
    mmsi: '219016689', imo: '9543458', callsign: 'OXJJ2',
    vesselType: 'tug', flag: 'Denmark',
    destination: 'ROTTERDAM HARBOR', eta: '',
    lat: 51.9, lng: 4.1, course: 315, speed: 6.5,
    length: 32, width: 13, draught: 5.0,
    status: 'Under way using engine',
    departurePortKey: 'ANTWERP', arrivalPortKey: 'ROTTERDAM',
  },
  {
    name: 'EVER ACE',
    mmsi: '353879000', imo: '9893890', callsign: 'H9YQ',
    vesselType: 'cargo', flag: 'Panama',
    destination: 'HAMBURG', eta: '2026-03-29 16:00',
    lat: 53.0, lng: 5.5, course: 55, speed: 15.0,
    length: 400, width: 62, draught: 16.0,
    status: 'Under way using engine',
    departurePortKey: 'FELIXSTOWE', arrivalPortKey: 'HAMBURG',
  },
  {
    name: 'STENA BRITANNICA',
    mmsi: '245683000', imo: '9419163', callsign: 'PBSB',
    vesselType: 'passenger', flag: 'Netherlands',
    destination: 'ROTTERDAM EUROPOORT', eta: '2026-03-28 20:00',
    lat: 51.85, lng: 3.0, course: 80, speed: 19.5,
    length: 240, width: 32, draught: 6.3,
    status: 'Under way using engine',
    departurePortKey: 'FELIXSTOWE', arrivalPortKey: 'ROTTERDAM',
  },

  // ========================================
  // PERSIAN GULF / INDIAN OCEAN (5)
  // ========================================
  {
    name: 'CRUDE SPIRIT',
    mmsi: '538006712', imo: '9489234', callsign: 'V7A38',
    vesselType: 'tanker', flag: 'Marshall Islands',
    destination: 'MUMBAI', eta: '2026-04-01 06:00',
    lat: 22.5, lng: 60.2, course: 110, speed: 13.5,
    length: 333, width: 60, draught: 22.0,
    status: 'Under way using engine',
    departurePortKey: 'RAS_TANURA', arrivalPortKey: 'MUMBAI',
  },
  {
    name: 'AL JASRA',
    mmsi: '466320000', imo: '9337034', callsign: 'A6E47',
    vesselType: 'tanker', flag: 'UAE',
    destination: 'RAS TANURA', eta: '2026-03-29 12:00',
    lat: 26.3, lng: 50.5, course: 340, speed: 10.2,
    length: 285, width: 46, draught: 18.0,
    status: 'Under way using engine',
    departurePortKey: 'FUJAIRAH', arrivalPortKey: 'RAS_TANURA',
  },
  {
    name: 'FRONT ALTA',
    mmsi: '538009153', imo: '9806089', callsign: 'V7KU9',
    vesselType: 'tanker', flag: 'Marshall Islands',
    destination: 'FUJAIRAH', eta: '2026-03-30 04:00',
    lat: 24.8, lng: 57.5, course: 310, speed: 12.0,
    length: 336, width: 60, draught: 21.5,
    status: 'Under way using engine',
    departurePortKey: 'COLOMBO', arrivalPortKey: 'FUJAIRAH',
  },
  {
    name: 'MAHARSHI VALMIKI',
    mmsi: '419001234', imo: '9475780', callsign: 'ATCJ',
    vesselType: 'cargo', flag: 'India',
    destination: 'KARACHI', eta: '2026-03-29 18:00',
    lat: 20.5, lng: 68.0, course: 330, speed: 14.5,
    length: 292, width: 45, draught: 12.8,
    status: 'Under way using engine',
    departurePortKey: 'MUMBAI', arrivalPortKey: 'KARACHI',
  },
  {
    name: 'TANKER PACIFIC',
    mmsi: '538005820', imo: '9450123', callsign: 'V7BN3',
    vesselType: 'tanker', flag: 'Marshall Islands',
    destination: 'BANDAR ABBAS', eta: '2026-03-30 02:00',
    lat: 25.5, lng: 55.8, course: 60, speed: 11.5,
    length: 320, width: 58, draught: 20.5,
    status: 'Under way using engine',
    departurePortKey: 'DUBAI', arrivalPortKey: 'BANDAR_ABBAS',
  },

  // ========================================
  // PACIFIC / EAST ASIA (6)
  // ========================================
  {
    name: 'COSCO SHIPPING UNIVERSE',
    mmsi: '477328800', imo: '9795610', callsign: 'VRLD4',
    vesselType: 'cargo', flag: 'Hong Kong',
    destination: 'LONG BEACH', eta: '2026-04-05 08:00',
    lat: 35.0, lng: -160.0, course: 75, speed: 19.0,
    length: 400, width: 59, draught: 16.0,
    status: 'Under way using engine',
    departurePortKey: 'SHANGHAI', arrivalPortKey: 'LONG_BEACH',
  },
  {
    name: 'NYK BLUE JAY',
    mmsi: '431501740', imo: '9741402', callsign: 'JD3571',
    vesselType: 'cargo', flag: 'Japan',
    destination: 'YOKOHAMA', eta: '2026-03-30 20:00',
    lat: 30.5, lng: 145.0, course: 310, speed: 17.5,
    length: 364, width: 50, draught: 14.5,
    status: 'Under way using engine',
    departurePortKey: 'LONG_BEACH', arrivalPortKey: 'YOKOHAMA',
  },
  {
    name: 'HMM ALGECIRAS',
    mmsi: '440457000', imo: '9863297', callsign: 'HO5398',
    vesselType: 'cargo', flag: 'South Korea',
    destination: 'BUSAN', eta: '2026-04-03 10:00',
    lat: 20.0, lng: 115.0, course: 30, speed: 18.5,
    length: 400, width: 61, draught: 16.5,
    status: 'Under way using engine',
    departurePortKey: 'SINGAPORE', arrivalPortKey: 'BUSAN',
  },
  {
    name: 'MOL TRIUMPH',
    mmsi: '431604567', imo: '9769271', callsign: 'JG3967',
    vesselType: 'cargo', flag: 'Japan',
    destination: 'TOKYO', eta: '2026-03-31 14:00',
    lat: 28.0, lng: 135.0, course: 40, speed: 17.0,
    length: 400, width: 59, draught: 16.0,
    status: 'Under way using engine',
    departurePortKey: 'KAOHSIUNG', arrivalPortKey: 'TOKYO',
  },
  {
    name: 'OOCL HONG KONG',
    mmsi: '477253900', imo: '9776171', callsign: 'VRKG6',
    vesselType: 'cargo', flag: 'Hong Kong',
    destination: 'NINGBO', eta: '2026-03-30 06:00',
    lat: 26.5, lng: 125.0, course: 310, speed: 20.0,
    length: 400, width: 59, draught: 16.0,
    status: 'Under way using engine',
    departurePortKey: 'KOBE', arrivalPortKey: 'NINGBO',
  },
  {
    name: 'EVERGREEN EVER GLORY',
    mmsi: '416394000', imo: '9832758', callsign: 'BMEN',
    vesselType: 'cargo', flag: 'Taiwan',
    destination: 'KAOHSIUNG', eta: '2026-03-29 22:00',
    lat: 24.0, lng: 121.5, course: 195, speed: 18.0,
    length: 400, width: 59, draught: 16.0,
    status: 'Under way using engine',
    departurePortKey: 'SHENZHEN', arrivalPortKey: 'KAOHSIUNG',
  },

  // ========================================
  // ATLANTIC (4)
  // ========================================
  {
    name: 'QUEEN MARY 2',
    mmsi: '310627000', imo: '9241061', callsign: 'ZCEF6',
    vesselType: 'passenger', flag: 'Bermuda',
    destination: 'NEW YORK', eta: '2026-04-02 06:00',
    lat: 42.5, lng: -45.0, course: 260, speed: 24.0,
    length: 345, width: 41, draught: 10.3,
    status: 'Under way using engine',
    departurePortKey: 'SOUTHAMPTON', arrivalPortKey: 'NEW_YORK',
  },
  {
    name: 'HARMONY OF THE SEAS',
    mmsi: '229082000', imo: '9682875', callsign: 'C6BQ3',
    vesselType: 'passenger', flag: 'Bahamas',
    destination: 'MIAMI', eta: '2026-03-30 08:00',
    lat: 22.0, lng: -75.5, course: 220, speed: 18.5,
    length: 362, width: 66, draught: 9.3,
    status: 'Under way using engine',
    departurePortKey: 'NASSAU', arrivalPortKey: 'MIAMI',
  },
  {
    name: 'WONDER OF THE SEAS',
    mmsi: '229353000', imo: '9838505', callsign: 'C6DX5',
    vesselType: 'passenger', flag: 'Bahamas',
    destination: 'COZUMEL', eta: '2026-03-29 14:00',
    lat: 21.5, lng: -84.0, course: 250, speed: 17.0,
    length: 362, width: 66, draught: 9.5,
    status: 'Under way using engine',
    departurePortKey: 'MIAMI', arrivalPortKey: 'COZUMEL',
  },
  {
    name: 'ATLANTIC SAIL',
    mmsi: '636091234', imo: '9687456', callsign: 'D5JR8',
    vesselType: 'cargo', flag: 'Liberia',
    destination: 'SAVANNAH', eta: '2026-04-01 12:00',
    lat: 32.0, lng: -60.0, course: 275, speed: 16.0,
    length: 300, width: 48, draught: 13.5,
    status: 'Under way using engine',
    departurePortKey: 'LISBON', arrivalPortKey: 'SAVANNAH',
  },

  // ========================================
  // SOUTH CHINA SEA / SE ASIA (4)
  // ========================================
  {
    name: 'ATLANTIC PIONEER',
    mmsi: '636017834', imo: '9756102', callsign: 'D5IK2',
    vesselType: 'tanker', flag: 'Liberia',
    destination: 'SINGAPORE', eta: '2026-03-29 16:00',
    lat: 8.5, lng: 112.0, course: 195, speed: 14.0,
    length: 250, width: 44, draught: 17.0,
    status: 'Under way using engine',
    departurePortKey: 'HO_CHI_MINH', arrivalPortKey: 'SINGAPORE',
  },
  {
    name: 'WAN HAI 612',
    mmsi: '416781000', imo: '9745612', callsign: 'BMSQ',
    vesselType: 'cargo', flag: 'Taiwan',
    destination: 'LAEM CHABANG', eta: '2026-03-29 20:00',
    lat: 7.5, lng: 104.5, course: 320, speed: 16.5,
    length: 335, width: 51, draught: 14.0,
    status: 'Under way using engine',
    departurePortKey: 'SINGAPORE', arrivalPortKey: 'LAEM_CHABANG',
  },
  {
    name: 'PACIFIC CENTURION',
    mmsi: '563098700', imo: '9402567', callsign: '9V6543',
    vesselType: 'tanker', flag: 'Singapore',
    destination: 'TANJUNG PELEPAS', eta: '2026-03-29 12:00',
    lat: 3.5, lng: 105.0, course: 225, speed: 12.8,
    length: 274, width: 48, draught: 18.5,
    status: 'Under way using engine',
    departurePortKey: 'SHENZHEN', arrivalPortKey: 'TANJUNG_PELEPAS',
  },
  {
    name: 'PILLAR OF MANILA',
    mmsi: '548123000', imo: '9612789', callsign: 'DUQR',
    vesselType: 'cargo', flag: 'Philippines',
    destination: 'HONG KONG', eta: '2026-03-30 14:00',
    lat: 16.0, lng: 117.0, course: 350, speed: 15.0,
    length: 260, width: 40, draught: 12.0,
    status: 'Under way using engine',
    departurePortKey: 'TANJUNG_PELEPAS', arrivalPortKey: 'HONG_KONG',
  },

  // ========================================
  // SOUTH AMERICA (3)
  // ========================================
  {
    name: 'SANTOS EXPRESS',
    mmsi: '710345678', imo: '9567890', callsign: 'PPSE',
    vesselType: 'cargo', flag: 'Brazil',
    destination: 'SANTOS', eta: '2026-03-30 06:00',
    lat: -20.0, lng: -30.5, course: 225, speed: 16.0,
    length: 300, width: 48, draught: 13.5,
    status: 'Under way using engine',
    departurePortKey: 'ROTTERDAM', arrivalPortKey: 'SANTOS',
  },
  {
    name: 'RIO GRANDE',
    mmsi: '710456789', imo: '9623456', callsign: 'PPRG',
    vesselType: 'cargo', flag: 'Brazil',
    destination: 'BUENOS AIRES', eta: '2026-04-01 14:00',
    lat: -28.5, lng: -42.0, course: 210, speed: 15.5,
    length: 275, width: 43, draught: 12.5,
    status: 'Under way using engine',
    departurePortKey: 'SANTOS', arrivalPortKey: 'BUENOS_AIRES',
  },
  {
    name: 'MAIPO',
    mmsi: '725012345', imo: '9534567', callsign: 'CBMP',
    vesselType: 'cargo', flag: 'Chile',
    destination: 'CALLAO', eta: '2026-03-31 20:00',
    lat: -25.0, lng: -75.5, course: 340, speed: 16.5,
    length: 260, width: 40, draught: 12.0,
    status: 'Under way using engine',
    departurePortKey: 'VALPARAISO', arrivalPortKey: 'CALLAO',
  },

  // ========================================
  // AFRICA (3)
  // ========================================
  {
    name: 'CAPE TOWN STAR',
    mmsi: '601234567', imo: '9678901', callsign: 'ZSA1',
    vesselType: 'cargo', flag: 'South Africa',
    destination: 'CAPE TOWN', eta: '2026-03-31 20:00',
    lat: -30.0, lng: 15.5, course: 180, speed: 15.0,
    length: 260, width: 40, draught: 12.0,
    status: 'Under way using engine',
    departurePortKey: 'LAGOS', arrivalPortKey: 'CAPE_TOWN',
  },
  {
    name: 'DURBAN CARRIER',
    mmsi: '601345678', imo: '9689012', callsign: 'ZSD2',
    vesselType: 'cargo', flag: 'South Africa',
    destination: 'DURBAN', eta: '2026-04-01 08:00',
    lat: -25.0, lng: 38.0, course: 220, speed: 14.5,
    length: 280, width: 42, draught: 13.0,
    status: 'Under way using engine',
    departurePortKey: 'MOMBASA', arrivalPortKey: 'DURBAN',
  },
  {
    name: 'LAKE KIVU',
    mmsi: '636245678', imo: '9545678', callsign: 'D5KV3',
    vesselType: 'tanker', flag: 'Liberia',
    destination: 'MOMBASA', eta: '2026-03-30 16:00',
    lat: -2.0, lng: 44.0, course: 210, speed: 13.0,
    length: 250, width: 44, draught: 16.5,
    status: 'Under way using engine',
    departurePortKey: 'DUBAI', arrivalPortKey: 'MOMBASA',
  },

  // ========================================
  // SUEZ / RED SEA (3)
  // ========================================
  {
    name: 'CMA CGM JACQUES SAADE',
    mmsi: '228339600', imo: '9839179', callsign: 'FMGP',
    vesselType: 'cargo', flag: 'France',
    destination: 'SHANGHAI', eta: '2026-04-08 18:00',
    lat: 12.5, lng: 45.5, course: 80, speed: 21.0,
    length: 400, width: 61, draught: 16.5,
    status: 'Under way using engine',
    departurePortKey: 'SUEZ', arrivalPortKey: 'SHANGHAI',
  },
  {
    name: 'SUEZ MAX PIONEER',
    mmsi: '538012345', imo: '9712345', callsign: 'V7SP1',
    vesselType: 'tanker', flag: 'Marshall Islands',
    destination: 'PORT SAID', eta: '2026-03-29 04:00',
    lat: 15.5, lng: 42.0, course: 340, speed: 14.5,
    length: 274, width: 48, draught: 17.0,
    status: 'Under way using engine',
    departurePortKey: 'ADEN', arrivalPortKey: 'PORT_SAID',
  },
  {
    name: 'DJIBOUTI TRANSPORTER',
    mmsi: '636312345', imo: '9623890', callsign: 'D5DJ4',
    vesselType: 'cargo', flag: 'Liberia',
    destination: 'DJIBOUTI', eta: '2026-03-29 08:00',
    lat: 13.5, lng: 44.5, course: 155, speed: 15.0,
    length: 290, width: 43, draught: 13.0,
    status: 'Under way using engine',
    departurePortKey: 'SUEZ', arrivalPortKey: 'DJIBOUTI',
  },

  // ========================================
  // NORTH AMERICA (3)
  // ========================================
  {
    name: 'OOCL AMERICA',
    mmsi: '477345600', imo: '9734567', callsign: 'VRLM8',
    vesselType: 'cargo', flag: 'Hong Kong',
    destination: 'NEW YORK', eta: '2026-03-31 06:00',
    lat: 37.0, lng: -70.0, course: 265, speed: 17.5,
    length: 366, width: 51, draught: 15.0,
    status: 'Under way using engine',
    departurePortKey: 'ROTTERDAM', arrivalPortKey: 'NEW_YORK',
  },
  {
    name: 'HOUSTON EXPRESS',
    mmsi: '218234000', imo: '9501356', callsign: 'DCHE',
    vesselType: 'cargo', flag: 'Germany',
    destination: 'HOUSTON', eta: '2026-03-30 18:00',
    lat: 25.5, lng: -88.0, course: 290, speed: 16.5,
    length: 333, width: 48, draught: 14.0,
    status: 'Under way using engine',
    departurePortKey: 'NORFOLK', arrivalPortKey: 'HOUSTON',
  },
  {
    name: 'NORFOLK TRADER',
    mmsi: '367456000', imo: '9612345', callsign: 'WDB7892',
    vesselType: 'cargo', flag: 'United States',
    destination: 'NORFOLK', eta: '2026-03-29 20:00',
    lat: 35.5, lng: -72.0, course: 295, speed: 14.0,
    length: 260, width: 40, draught: 12.0,
    status: 'Under way using engine',
    departurePortKey: 'SAVANNAH', arrivalPortKey: 'NORFOLK',
  },

  // ========================================
  // ARCTIC / SCANDINAVIA — FISHING (2)
  // ========================================
  {
    name: 'NORDIC STAR',
    mmsi: '258765000', imo: '8812346', callsign: 'LNFK',
    vesselType: 'fishing', flag: 'Norway',
    destination: 'TROMSO', eta: '',
    lat: 68.5, lng: 15.2, course: 30, speed: 3.8,
    length: 65, width: 12, draught: 5.5,
    status: 'Engaged in fishing',
    departurePortKey: 'TROMSO', arrivalPortKey: 'TROMSO',
  },
  {
    name: 'HAMMERFEST TRAWLER',
    mmsi: '258890000', imo: '8823456', callsign: 'LNHT',
    vesselType: 'fishing', flag: 'Norway',
    destination: 'HAMMERFEST', eta: '',
    lat: 70.2, lng: 22.5, course: 65, speed: 4.2,
    length: 72, width: 13, draught: 5.8,
    status: 'Engaged in fishing',
    departurePortKey: 'HAMMERFEST', arrivalPortKey: 'HAMMERFEST',
  },

  // ========================================
  // MILITARY (5)
  // ========================================
  {
    name: 'USS GERALD R. FORD',
    mmsi: '369970001', imo: '', callsign: 'NFRD',
    vesselType: 'military', flag: 'United States',
    destination: '-', eta: '',
    lat: 36.8, lng: -6.5, course: 90, speed: 25.0,
    length: 337, width: 78, draught: 12.0,
    status: 'Under way using engine',
    departurePortKey: 'NORFOLK', arrivalPortKey: null,
  },
  {
    name: 'HMS QUEEN ELIZABETH',
    mmsi: '232001500', imo: '', callsign: 'GQEC',
    vesselType: 'military', flag: 'United Kingdom',
    destination: '-', eta: '',
    lat: 50.5, lng: -3.5, course: 210, speed: 20.0,
    length: 284, width: 73, draught: 11.0,
    status: 'Under way using engine',
    departurePortKey: 'SOUTHAMPTON', arrivalPortKey: null,
  },
  {
    name: 'FS CHARLES DE GAULLE',
    mmsi: '228160800', imo: '', callsign: 'FAEK',
    vesselType: 'military', flag: 'France',
    destination: '-', eta: '',
    lat: 33.5, lng: 32.5, course: 270, speed: 22.0,
    length: 261, width: 64, draught: 9.4,
    status: 'Under way using engine',
    departurePortKey: 'MARSEILLE', arrivalPortKey: null,
  },
  {
    name: 'USS ARLEIGH BURKE',
    mmsi: '369970045', imo: '', callsign: 'NABK',
    vesselType: 'military', flag: 'United States',
    destination: '-', eta: '',
    lat: 7.0, lng: 72.0, course: 180, speed: 22.5,
    length: 154, width: 20, draught: 9.4,
    status: 'Under way using engine',
    departurePortKey: null, arrivalPortKey: null,
  },
  {
    name: 'JS IZUMO',
    mmsi: '431999010', imo: '', callsign: 'JIZM',
    vesselType: 'military', flag: 'Japan',
    destination: '-', eta: '',
    lat: 30.0, lng: 132.0, course: 45, speed: 20.0,
    length: 248, width: 38, draught: 7.1,
    status: 'Under way using engine',
    departurePortKey: 'YOKOHAMA', arrivalPortKey: null,
  },

  // ========================================
  // SAILING (2)
  // ========================================
  {
    name: 'SEA CLOUD II',
    mmsi: '256432000', imo: '9171292', callsign: '9HA2539',
    vesselType: 'sailing', flag: 'Malta',
    destination: 'PIRAEUS', eta: '2026-03-31 12:00',
    lat: 37.0, lng: 20.5, course: 120, speed: 8.0,
    length: 117, width: 16, draught: 5.7,
    status: 'Under way sailing',
    departurePortKey: 'PALMA', arrivalPortKey: 'PIRAEUS',
  },
  {
    name: 'STAR CLIPPER',
    mmsi: '314567000', imo: '9067728', callsign: 'V2ST1',
    vesselType: 'sailing', flag: 'Antigua',
    destination: 'LISBON', eta: '2026-04-02 08:00',
    lat: 36.0, lng: -6.0, course: 310, speed: 9.5,
    length: 115, width: 15, draught: 5.6,
    status: 'Under way sailing',
    departurePortKey: 'ANTIGUA', arrivalPortKey: 'LISBON',
  },

  // ========================================
  // TUGS (2)
  // ========================================
  {
    name: 'FAIRPLAY TOWAGE',
    mmsi: '211234567', imo: '9345612', callsign: 'DCFP',
    vesselType: 'tug', flag: 'Germany',
    destination: 'HAMBURG', eta: '',
    lat: 53.55, lng: 9.8, course: 90, speed: 5.5,
    length: 38, width: 14, draught: 5.2,
    status: 'Under way using engine',
    departurePortKey: 'BREMERHAVEN', arrivalPortKey: 'HAMBURG',
  },
  {
    name: 'SMIT DONAU',
    mmsi: '245456000', imo: '9456789', callsign: 'PBSD',
    vesselType: 'tug', flag: 'Netherlands',
    destination: 'ANTWERP', eta: '',
    lat: 51.35, lng: 3.8, course: 170, speed: 7.0,
    length: 45, width: 15, draught: 5.5,
    status: 'Under way using engine',
    departurePortKey: 'ROTTERDAM', arrivalPortKey: 'ANTWERP',
  },
];

function generateTrajectory(
  lat: number, lng: number, course: number, speed: number, now: number,
): Position[] {
  const positions: Position[] = [];
  const courseRad = (course * Math.PI) / 180;
  const knotsToDegreesPerSec = 1 / (3600 * 60); // rough approximation

  for (let i = 24; i >= 1; i--) {
    const dt = i * 1800; // 30-minute intervals
    const distDeg = speed * knotsToDegreesPerSec * dt * 60;
    positions.push({
      lat: lat - Math.cos(courseRad) * distDeg,
      lng: lng - Math.sin(courseRad) * distDeg,
      timestamp: now - dt,
    });
  }

  return positions;
}

// Reference epoch for deterministic vessel movement
const VESSEL_EPOCH = Math.floor(Date.now() / 3_600_000) * 3600;

export function fetchAllVessels(): Vessel[] {
  const now = Math.floor(Date.now() / 1000);
  const elapsedSec = now - VESSEL_EPOCH;

  return VESSEL_TEMPLATES.map((t) => {
    // Move along course based on elapsed time (knots → m/s → degrees)
    const courseRad = (t.course * Math.PI) / 180;
    const speedMs = t.speed * 0.51444; // knots to m/s
    const distDeg = (speedMs * elapsedSec) / 111320;
    const lat = t.lat + Math.cos(courseRad) * distDeg;
    const lng = t.lng + Math.sin(courseRad) * distDeg / Math.cos((t.lat * Math.PI) / 180);

    const depPort: Port | null = t.departurePortKey ? (PORTS[t.departurePortKey] ?? null) : null;
    const arrPort: Port | null = t.arrivalPortKey ? (PORTS[t.arrivalPortKey] ?? null) : null;

    let progress = 0;
    if (depPort && arrPort) {
      progress = calcProgress(lat, lng, depPort, arrPort);
    }

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
      departurePort: depPort,
      arrivalPort: arrPort,
      progress,
    };
  });
}
