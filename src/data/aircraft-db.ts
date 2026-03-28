// ============================================================
// Aircraft Model Database
// ============================================================

export type AircraftSize = 'narrow-body' | 'wide-body-twin' | 'wide-body-quad' | 'regional' | 'business-jet' | 'turboprop' | 'helicopter' | 'military-fighter' | 'military-transport' | 'light-aircraft';

export interface AircraftModelInfo {
  model: string;
  manufacturer: string;
  size: AircraftSize;
  engines: number;
  typecode: string;
}

// Common aircraft types by ICAO type designator
export const AIRCRAFT_MODELS: Record<string, AircraftModelInfo> = {
  // Airbus narrow-body
  A318: { model: 'A318', manufacturer: 'Airbus', size: 'narrow-body', engines: 2, typecode: 'A318' },
  A319: { model: 'A319', manufacturer: 'Airbus', size: 'narrow-body', engines: 2, typecode: 'A319' },
  A320: { model: 'A320', manufacturer: 'Airbus', size: 'narrow-body', engines: 2, typecode: 'A320' },
  A20N: { model: 'A320neo', manufacturer: 'Airbus', size: 'narrow-body', engines: 2, typecode: 'A20N' },
  A321: { model: 'A321', manufacturer: 'Airbus', size: 'narrow-body', engines: 2, typecode: 'A321' },
  A21N: { model: 'A321neo', manufacturer: 'Airbus', size: 'narrow-body', engines: 2, typecode: 'A21N' },

  // Airbus wide-body twin
  A330: { model: 'A330', manufacturer: 'Airbus', size: 'wide-body-twin', engines: 2, typecode: 'A330' },
  A332: { model: 'A330-200', manufacturer: 'Airbus', size: 'wide-body-twin', engines: 2, typecode: 'A332' },
  A333: { model: 'A330-300', manufacturer: 'Airbus', size: 'wide-body-twin', engines: 2, typecode: 'A333' },
  A338: { model: 'A330-800neo', manufacturer: 'Airbus', size: 'wide-body-twin', engines: 2, typecode: 'A338' },
  A339: { model: 'A330-900neo', manufacturer: 'Airbus', size: 'wide-body-twin', engines: 2, typecode: 'A339' },
  A350: { model: 'A350 XWB', manufacturer: 'Airbus', size: 'wide-body-twin', engines: 2, typecode: 'A350' },
  A359: { model: 'A350-900', manufacturer: 'Airbus', size: 'wide-body-twin', engines: 2, typecode: 'A359' },
  A35K: { model: 'A350-1000', manufacturer: 'Airbus', size: 'wide-body-twin', engines: 2, typecode: 'A35K' },

  // Airbus wide-body quad
  A380: { model: 'A380', manufacturer: 'Airbus', size: 'wide-body-quad', engines: 4, typecode: 'A380' },
  A388: { model: 'A380-800', manufacturer: 'Airbus', size: 'wide-body-quad', engines: 4, typecode: 'A388' },

  // Boeing narrow-body
  B731: { model: '737-100', manufacturer: 'Boeing', size: 'narrow-body', engines: 2, typecode: 'B731' },
  B732: { model: '737-200', manufacturer: 'Boeing', size: 'narrow-body', engines: 2, typecode: 'B732' },
  B733: { model: '737-300', manufacturer: 'Boeing', size: 'narrow-body', engines: 2, typecode: 'B733' },
  B734: { model: '737-400', manufacturer: 'Boeing', size: 'narrow-body', engines: 2, typecode: 'B734' },
  B735: { model: '737-500', manufacturer: 'Boeing', size: 'narrow-body', engines: 2, typecode: 'B735' },
  B736: { model: '737-600', manufacturer: 'Boeing', size: 'narrow-body', engines: 2, typecode: 'B736' },
  B737: { model: '737-700', manufacturer: 'Boeing', size: 'narrow-body', engines: 2, typecode: 'B737' },
  B738: { model: '737-800', manufacturer: 'Boeing', size: 'narrow-body', engines: 2, typecode: 'B738' },
  B739: { model: '737-900', manufacturer: 'Boeing', size: 'narrow-body', engines: 2, typecode: 'B739' },
  B38M: { model: '737 MAX 8', manufacturer: 'Boeing', size: 'narrow-body', engines: 2, typecode: 'B38M' },
  B39M: { model: '737 MAX 9', manufacturer: 'Boeing', size: 'narrow-body', engines: 2, typecode: 'B39M' },
  B3XM: { model: '737 MAX 10', manufacturer: 'Boeing', size: 'narrow-body', engines: 2, typecode: 'B3XM' },
  B752: { model: '757-200', manufacturer: 'Boeing', size: 'narrow-body', engines: 2, typecode: 'B752' },
  B753: { model: '757-300', manufacturer: 'Boeing', size: 'narrow-body', engines: 2, typecode: 'B753' },

  // Boeing wide-body twin
  B762: { model: '767-200', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, typecode: 'B762' },
  B763: { model: '767-300', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, typecode: 'B763' },
  B764: { model: '767-400', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, typecode: 'B764' },
  B772: { model: '777-200', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, typecode: 'B772' },
  B77L: { model: '777-200LR', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, typecode: 'B77L' },
  B773: { model: '777-300', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, typecode: 'B773' },
  B77W: { model: '777-300ER', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, typecode: 'B77W' },
  B778: { model: '777-8', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, typecode: 'B778' },
  B779: { model: '777-9', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, typecode: 'B779' },
  B788: { model: '787-8 Dreamliner', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, typecode: 'B788' },
  B789: { model: '787-9 Dreamliner', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, typecode: 'B789' },
  B78X: { model: '787-10 Dreamliner', manufacturer: 'Boeing', size: 'wide-body-twin', engines: 2, typecode: 'B78X' },

  // Boeing wide-body quad
  B741: { model: '747-100', manufacturer: 'Boeing', size: 'wide-body-quad', engines: 4, typecode: 'B741' },
  B742: { model: '747-200', manufacturer: 'Boeing', size: 'wide-body-quad', engines: 4, typecode: 'B742' },
  B743: { model: '747-300', manufacturer: 'Boeing', size: 'wide-body-quad', engines: 4, typecode: 'B743' },
  B744: { model: '747-400', manufacturer: 'Boeing', size: 'wide-body-quad', engines: 4, typecode: 'B744' },
  B748: { model: '747-8', manufacturer: 'Boeing', size: 'wide-body-quad', engines: 4, typecode: 'B748' },

  // Embraer regional
  E170: { model: 'E170', manufacturer: 'Embraer', size: 'regional', engines: 2, typecode: 'E170' },
  E175: { model: 'E175', manufacturer: 'Embraer', size: 'regional', engines: 2, typecode: 'E175' },
  E190: { model: 'E190', manufacturer: 'Embraer', size: 'regional', engines: 2, typecode: 'E190' },
  E195: { model: 'E195', manufacturer: 'Embraer', size: 'regional', engines: 2, typecode: 'E195' },
  E290: { model: 'E190-E2', manufacturer: 'Embraer', size: 'regional', engines: 2, typecode: 'E290' },
  E295: { model: 'E195-E2', manufacturer: 'Embraer', size: 'regional', engines: 2, typecode: 'E295' },

  // Bombardier/CRJ
  CRJ2: { model: 'CRJ-200', manufacturer: 'Bombardier', size: 'regional', engines: 2, typecode: 'CRJ2' },
  CRJ7: { model: 'CRJ-700', manufacturer: 'Bombardier', size: 'regional', engines: 2, typecode: 'CRJ7' },
  CRJ9: { model: 'CRJ-900', manufacturer: 'Bombardier', size: 'regional', engines: 2, typecode: 'CRJ9' },
  CRJX: { model: 'CRJ-1000', manufacturer: 'Bombardier', size: 'regional', engines: 2, typecode: 'CRJX' },

  // Turboprops
  AT43: { model: 'ATR 42-300', manufacturer: 'ATR', size: 'turboprop', engines: 2, typecode: 'AT43' },
  AT72: { model: 'ATR 72', manufacturer: 'ATR', size: 'turboprop', engines: 2, typecode: 'AT72' },
  DH8A: { model: 'Dash 8-100', manufacturer: 'De Havilland', size: 'turboprop', engines: 2, typecode: 'DH8A' },
  DH8D: { model: 'Dash 8-400', manufacturer: 'De Havilland', size: 'turboprop', engines: 2, typecode: 'DH8D' },

  // Business jets
  GLF5: { model: 'Gulfstream G550', manufacturer: 'Gulfstream', size: 'business-jet', engines: 2, typecode: 'GLF5' },
  GLF6: { model: 'Gulfstream G650', manufacturer: 'Gulfstream', size: 'business-jet', engines: 2, typecode: 'GLF6' },
  GL7T: { model: 'Gulfstream G700', manufacturer: 'Gulfstream', size: 'business-jet', engines: 2, typecode: 'GL7T' },
  CL35: { model: 'Challenger 350', manufacturer: 'Bombardier', size: 'business-jet', engines: 2, typecode: 'CL35' },
  CL60: { model: 'Challenger 604', manufacturer: 'Bombardier', size: 'business-jet', engines: 2, typecode: 'CL60' },
  GA5C: { model: 'Galaxy 5000', manufacturer: 'IAI', size: 'business-jet', engines: 2, typecode: 'GA5C' },
  C56X: { model: 'Citation Excel', manufacturer: 'Cessna', size: 'business-jet', engines: 2, typecode: 'C56X' },
  C680: { model: 'Citation Sovereign', manufacturer: 'Cessna', size: 'business-jet', engines: 2, typecode: 'C680' },
  FA7X: { model: 'Falcon 7X', manufacturer: 'Dassault', size: 'business-jet', engines: 3, typecode: 'FA7X' },
  F900: { model: 'Falcon 900', manufacturer: 'Dassault', size: 'business-jet', engines: 3, typecode: 'F900' },
  LJ45: { model: 'Learjet 45', manufacturer: 'Bombardier', size: 'business-jet', engines: 2, typecode: 'LJ45' },
  E55P: { model: 'Phenom 300', manufacturer: 'Embraer', size: 'business-jet', engines: 2, typecode: 'E55P' },
  PC12: { model: 'Pilatus PC-12', manufacturer: 'Pilatus', size: 'turboprop', engines: 1, typecode: 'PC12' },

  // Light aircraft
  C172: { model: 'Cessna 172 Skyhawk', manufacturer: 'Cessna', size: 'light-aircraft', engines: 1, typecode: 'C172' },
  C182: { model: 'Cessna 182 Skylane', manufacturer: 'Cessna', size: 'light-aircraft', engines: 1, typecode: 'C182' },
  C208: { model: 'Cessna 208 Caravan', manufacturer: 'Cessna', size: 'light-aircraft', engines: 1, typecode: 'C208' },
  PA28: { model: 'Piper PA-28 Cherokee', manufacturer: 'Piper', size: 'light-aircraft', engines: 1, typecode: 'PA28' },
  BE36: { model: 'Beechcraft Bonanza', manufacturer: 'Beechcraft', size: 'light-aircraft', engines: 1, typecode: 'BE36' },

  // Helicopters
  EC35: { model: 'Airbus H135', manufacturer: 'Airbus Helicopters', size: 'helicopter', engines: 2, typecode: 'EC35' },
  EC45: { model: 'Airbus H145', manufacturer: 'Airbus Helicopters', size: 'helicopter', engines: 2, typecode: 'EC45' },
  EC75: { model: 'Airbus H175', manufacturer: 'Airbus Helicopters', size: 'helicopter', engines: 2, typecode: 'EC75' },
  S92: { model: 'Sikorsky S-92', manufacturer: 'Sikorsky', size: 'helicopter', engines: 2, typecode: 'S92' },
  B06: { model: 'Bell 206 JetRanger', manufacturer: 'Bell', size: 'helicopter', engines: 1, typecode: 'B06' },
  B412: { model: 'Bell 412', manufacturer: 'Bell', size: 'helicopter', engines: 2, typecode: 'B412' },
  R44: { model: 'Robinson R44', manufacturer: 'Robinson', size: 'helicopter', engines: 1, typecode: 'R44' },
  AS50: { model: 'Airbus H125 Ecureuil', manufacturer: 'Airbus Helicopters', size: 'helicopter', engines: 1, typecode: 'AS50' },
  H60: { model: 'Sikorsky UH-60 Black Hawk', manufacturer: 'Sikorsky', size: 'helicopter', engines: 2, typecode: 'H60' },

  // Military transport
  C130: { model: 'C-130 Hercules', manufacturer: 'Lockheed Martin', size: 'military-transport', engines: 4, typecode: 'C130' },
  C17: { model: 'C-17 Globemaster III', manufacturer: 'Boeing', size: 'military-transport', engines: 4, typecode: 'C17' },
  C5: { model: 'C-5 Galaxy', manufacturer: 'Lockheed Martin', size: 'military-transport', engines: 4, typecode: 'C5' },
  A400: { model: 'A400M Atlas', manufacturer: 'Airbus', size: 'military-transport', engines: 4, typecode: 'A400' },
  KC10: { model: 'KC-10 Extender', manufacturer: 'McDonnell Douglas', size: 'military-transport', engines: 3, typecode: 'KC10' },
  KC46: { model: 'KC-46 Pegasus', manufacturer: 'Boeing', size: 'military-transport', engines: 2, typecode: 'KC46' },
  KC35: { model: 'KC-135 Stratotanker', manufacturer: 'Boeing', size: 'military-transport', engines: 4, typecode: 'KC35' },
  E3: { model: 'E-3 Sentry AWACS', manufacturer: 'Boeing', size: 'military-transport', engines: 4, typecode: 'E3' },
  P8: { model: 'P-8 Poseidon', manufacturer: 'Boeing', size: 'military-transport', engines: 2, typecode: 'P8' },

  // Military fighter
  F16: { model: 'F-16 Fighting Falcon', manufacturer: 'Lockheed Martin', size: 'military-fighter', engines: 1, typecode: 'F16' },
  F15: { model: 'F-15 Eagle', manufacturer: 'Boeing', size: 'military-fighter', engines: 2, typecode: 'F15' },
  F18: { model: 'F/A-18 Hornet', manufacturer: 'Boeing', size: 'military-fighter', engines: 2, typecode: 'F18' },
  F22: { model: 'F-22 Raptor', manufacturer: 'Lockheed Martin', size: 'military-fighter', engines: 2, typecode: 'F22' },
  F35: { model: 'F-35 Lightning II', manufacturer: 'Lockheed Martin', size: 'military-fighter', engines: 1, typecode: 'F35' },
  EUFI: { model: 'Eurofighter Typhoon', manufacturer: 'Eurofighter', size: 'military-fighter', engines: 2, typecode: 'EUFI' },
  RFAL: { model: 'Dassault Rafale', manufacturer: 'Dassault', size: 'military-fighter', engines: 2, typecode: 'RFAL' },
};

export function getModelBySize(size: AircraftSize, engines: number): AircraftModelInfo {
  // Return a representative model for the given size and engine count
  for (const m of Object.values(AIRCRAFT_MODELS)) {
    if (m.size === size && m.engines === engines) return m;
  }
  return { model: 'Unknown', manufacturer: 'Unknown', size, engines, typecode: '????' };
}
