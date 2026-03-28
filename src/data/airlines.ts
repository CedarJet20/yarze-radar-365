// ============================================================
// Airline Database — ICAO 3-letter code to full details
// ============================================================

export interface AirlineInfo {
  name: string;
  country: string;
  callsignPrefix?: string;
}

export const AIRLINES: Record<string, AirlineInfo> = {
  // --- North America ---
  AAL: { name: 'American Airlines', country: 'United States' },
  UAL: { name: 'United Airlines', country: 'United States' },
  DAL: { name: 'Delta Air Lines', country: 'United States' },
  SWA: { name: 'Southwest Airlines', country: 'United States' },
  JBU: { name: 'JetBlue Airways', country: 'United States' },
  NKS: { name: 'Spirit Airlines', country: 'United States' },
  FFT: { name: 'Frontier Airlines', country: 'United States' },
  SKW: { name: 'SkyWest Airlines', country: 'United States' },
  ASA: { name: 'Alaska Airlines', country: 'United States' },
  HAL: { name: 'Hawaiian Airlines', country: 'United States' },
  ACA: { name: 'Air Canada', country: 'Canada' },
  WJA: { name: 'WestJet', country: 'Canada' },
  AMX: { name: 'Aeromexico', country: 'Mexico' },
  VIV: { name: 'Viva Aerobus', country: 'Mexico' },
  VOI: { name: 'Volaris', country: 'Mexico' },

  // --- Europe ---
  BAW: { name: 'British Airways', country: 'United Kingdom' },
  EZY: { name: 'easyJet', country: 'United Kingdom' },
  VIR: { name: 'Virgin Atlantic', country: 'United Kingdom' },
  TOM: { name: 'TUI Airways', country: 'United Kingdom' },
  AFR: { name: 'Air France', country: 'France' },
  DLH: { name: 'Lufthansa', country: 'Germany' },
  EWG: { name: 'Eurowings', country: 'Germany' },
  KLM: { name: 'KLM Royal Dutch Airlines', country: 'Netherlands' },
  TRA: { name: 'Transavia', country: 'Netherlands' },
  IBE: { name: 'Iberia', country: 'Spain' },
  VLG: { name: 'Vueling Airlines', country: 'Spain' },
  AZA: { name: 'ITA Airways', country: 'Italy' },
  RYR: { name: 'Ryanair', country: 'Ireland' },
  EIN: { name: 'Aer Lingus', country: 'Ireland' },
  SAS: { name: 'Scandinavian Airlines', country: 'Sweden' },
  FIN: { name: 'Finnair', country: 'Finland' },
  NAX: { name: 'Norwegian Air Shuttle', country: 'Norway' },
  SWR: { name: 'Swiss International Air Lines', country: 'Switzerland' },
  AUA: { name: 'Austrian Airlines', country: 'Austria' },
  TAP: { name: 'TAP Air Portugal', country: 'Portugal' },
  LOT: { name: 'LOT Polish Airlines', country: 'Poland' },
  WZZ: { name: 'Wizz Air', country: 'Hungary' },
  CSA: { name: 'Czech Airlines', country: 'Czech Republic' },
  THY: { name: 'Turkish Airlines', country: 'Turkey' },
  PGT: { name: 'Pegasus Airlines', country: 'Turkey' },
  AFL: { name: 'Aeroflot', country: 'Russia' },
  AEE: { name: 'Aegean Airlines', country: 'Greece' },
  ROT: { name: 'TAROM', country: 'Romania' },
  BEL: { name: 'Brussels Airlines', country: 'Belgium' },
  ICE: { name: 'Icelandair', country: 'Iceland' },
  BTI: { name: 'Air Baltic', country: 'Latvia' },
  DAT: { name: 'Danish Air Transport', country: 'Denmark' },

  // --- Middle East ---
  UAE: { name: 'Emirates', country: 'United Arab Emirates' },
  ETD: { name: 'Etihad Airways', country: 'United Arab Emirates' },
  FDB: { name: 'flydubai', country: 'United Arab Emirates' },
  QTR: { name: 'Qatar Airways', country: 'Qatar' },
  SVA: { name: 'Saudia', country: 'Saudi Arabia' },
  GFA: { name: 'Gulf Air', country: 'Bahrain' },
  OMA: { name: 'Oman Air', country: 'Oman' },
  KAC: { name: 'Kuwait Airways', country: 'Kuwait' },
  MEA: { name: 'Middle East Airlines', country: 'Lebanon' },
  RJA: { name: 'Royal Jordanian', country: 'Jordan' },
  ELY: { name: 'El Al Israel Airlines', country: 'Israel' },
  IRA: { name: 'Iran Air', country: 'Iran' },
  IAW: { name: 'Iraqi Airways', country: 'Iraq' },

  // --- Asia ---
  CCA: { name: 'Air China', country: 'China' },
  CES: { name: 'China Eastern Airlines', country: 'China' },
  CSN: { name: 'China Southern Airlines', country: 'China' },
  CHH: { name: 'Hainan Airlines', country: 'China' },
  CXA: { name: 'Xiamen Airlines', country: 'China' },
  CSC: { name: 'Sichuan Airlines', country: 'China' },
  CPA: { name: 'Cathay Pacific', country: 'Hong Kong' },
  HKE: { name: 'HK Express', country: 'Hong Kong' },
  JAL: { name: 'Japan Airlines', country: 'Japan' },
  ANA: { name: 'All Nippon Airways', country: 'Japan' },
  APJ: { name: 'Peach Aviation', country: 'Japan' },
  KAL: { name: 'Korean Air', country: 'South Korea' },
  AAR: { name: 'Asiana Airlines', country: 'South Korea' },
  JJA: { name: 'Jeju Air', country: 'South Korea' },
  SIA: { name: 'Singapore Airlines', country: 'Singapore' },
  TGW: { name: 'Scoot', country: 'Singapore' },
  THA: { name: 'Thai Airways', country: 'Thailand' },
  AIQ: { name: 'Thai AirAsia', country: 'Thailand' },
  MAS: { name: 'Malaysia Airlines', country: 'Malaysia' },
  AXM: { name: 'AirAsia', country: 'Malaysia' },
  GIA: { name: 'Garuda Indonesia', country: 'Indonesia' },
  LNI: { name: 'Lion Air', country: 'Indonesia' },
  PAL: { name: 'Philippine Airlines', country: 'Philippines' },
  CEB: { name: 'Cebu Pacific', country: 'Philippines' },
  HVN: { name: 'Vietnam Airlines', country: 'Vietnam' },
  VJC: { name: 'VietJet Air', country: 'Vietnam' },
  AIC: { name: 'Air India', country: 'India' },
  IGO: { name: 'IndiGo', country: 'India' },
  SEJ: { name: 'SpiceJet', country: 'India' },
  ALK: { name: 'SriLankan Airlines', country: 'Sri Lanka' },
  PIA: { name: 'Pakistan International Airlines', country: 'Pakistan' },
  BNG: { name: 'Biman Bangladesh Airlines', country: 'Bangladesh' },
  EVA: { name: 'EVA Air', country: 'Taiwan' },
  CAL: { name: 'China Airlines', country: 'Taiwan' },
  MGL: { name: 'MIAT Mongolian Airlines', country: 'Mongolia' },
  CPN: { name: 'Caspian Airlines', country: 'Iran' },

  // --- Africa ---
  ETH: { name: 'Ethiopian Airlines', country: 'Ethiopia' },
  SAA: { name: 'South African Airways', country: 'South Africa' },
  KQA: { name: 'Kenya Airways', country: 'Kenya' },
  RAM: { name: 'Royal Air Maroc', country: 'Morocco' },
  MSR: { name: 'EgyptAir', country: 'Egypt' },
  NOS: { name: 'Neos', country: 'Italy' },
  AAW: { name: 'Africa World Airlines', country: 'Ghana' },
  RWD: { name: 'RwandAir', country: 'Rwanda' },
  TAR: { name: 'Tunisair', country: 'Tunisia' },
  DAH: { name: 'Air Algerie', country: 'Algeria' },
  ANG: { name: 'TAAG Angola Airlines', country: 'Angola' },
  NIG: { name: 'Aero Contractors', country: 'Nigeria' },
  MDE: { name: 'Air Madagascar', country: 'Madagascar' },
  LAM: { name: 'LAM Mozambique Airlines', country: 'Mozambique' },

  // --- South America ---
  LAN: { name: 'LATAM Airlines', country: 'Chile' },
  TAM: { name: 'LATAM Brasil', country: 'Brazil' },
  GLO: { name: 'Gol Linhas Aereas', country: 'Brazil' },
  AZU: { name: 'Azul Brazilian Airlines', country: 'Brazil' },
  AVA: { name: 'Avianca', country: 'Colombia' },
  ARG: { name: 'Aerolineas Argentinas', country: 'Argentina' },
  BOV: { name: 'Boliviana de Aviacion', country: 'Bolivia' },
  CMP: { name: 'Copa Airlines', country: 'Panama' },
  ECU: { name: 'TAME', country: 'Ecuador' },
  LAP: { name: 'LATAM Paraguay', country: 'Paraguay' },
  PLU: { name: 'LATAM Peru', country: 'Peru' },

  // --- Oceania ---
  QFA: { name: 'Qantas', country: 'Australia' },
  JST: { name: 'Jetstar Airways', country: 'Australia' },
  VOZ: { name: 'Virgin Australia', country: 'Australia' },
  ANZ: { name: 'Air New Zealand', country: 'New Zealand' },
  FJI: { name: 'Fiji Airways', country: 'Fiji' },

  // --- Cargo ---
  FDX: { name: 'FedEx Express', country: 'United States' },
  UPS: { name: 'UPS Airlines', country: 'United States' },
  GTI: { name: 'Atlas Air', country: 'United States' },
  CLX: { name: 'Cargolux', country: 'Luxembourg' },
  ABW: { name: 'AirBridgeCargo', country: 'Russia' },
  MPH: { name: 'Martinair Cargo', country: 'Netherlands' },
  BOX: { name: 'Aerologic', country: 'Germany' },
  CKS: { name: 'Kalitta Air', country: 'United States' },
  SQC: { name: 'Singapore Airlines Cargo', country: 'Singapore' },
  CAO: { name: 'Air China Cargo', country: 'China' },
  ETF: { name: 'Ethiopian Cargo', country: 'Ethiopia' },
  QAC: { name: 'Qatar Airways Cargo', country: 'Qatar' },
  UAE9: { name: 'Emirates SkyCargo', country: 'United Arab Emirates' },
  DHK: { name: 'DHL Aviation', country: 'Germany' },
};

export function lookupAirline(callsign: string): AirlineInfo | null {
  const cs = callsign.trim().toUpperCase();
  // Try 3-letter prefix match
  const prefix3 = cs.substring(0, 3);
  if (AIRLINES[prefix3]) return AIRLINES[prefix3];
  // Try 2-letter prefix
  const prefix2 = cs.substring(0, 2);
  for (const [code, info] of Object.entries(AIRLINES)) {
    if (code.startsWith(prefix2)) return info;
  }
  return null;
}
