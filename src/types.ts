// ============================================================
// Yarze Radar 365 — Type Definitions
// ============================================================

export type VehicleCategory = 'commercial' | 'private' | 'military' | 'cargo' | 'helicopter';
export type VesselCategory = 'cargo' | 'tanker' | 'passenger' | 'fishing' | 'military' | 'sailing' | 'tug';
export type TrafficType = 'aircraft' | 'vessel';

export interface Position {
  lat: number;
  lng: number;
  alt?: number; // meters
  timestamp: number; // unix seconds
}

export interface Aircraft {
  type: 'aircraft';
  icao24: string;
  callsign: string;
  originCountry: string;
  longitude: number;
  latitude: number;
  baroAltitude: number | null;
  geoAltitude: number | null;
  onGround: boolean;
  velocity: number | null; // m/s
  trueTrack: number | null; // degrees clockwise from north
  verticalRate: number | null; // m/s
  squawk: string | null;
  category: VehicleCategory;
  lastContact: number;
  timePosition: number | null;
  trajectory: Position[];
  // Derived
  heading: number;
  speedKnots: number;
  altitudeFeet: number;
}

export interface Vessel {
  type: 'vessel';
  mmsi: string;
  name: string;
  imo: string;
  callsign: string;
  vesselType: VesselCategory;
  flag: string;
  longitude: number;
  latitude: number;
  course: number; // degrees
  speed: number; // knots
  heading: number; // degrees
  destination: string;
  eta: string;
  draught: number; // meters
  length: number;
  width: number;
  status: string; // navigational status
  lastUpdate: number;
  trajectory: Position[];
}

export type Vehicle = Aircraft | Vessel;

export interface FilterState {
  showAircraft: boolean;
  showVessels: boolean;
  aircraftTypes: Set<VehicleCategory>;
  vesselTypes: Set<VesselCategory>;
  searchQuery: string;
  altitudeMin: number;
  altitudeMax: number;
}

export interface AppState {
  vehicles: Map<string, Vehicle>;
  selectedVehicle: Vehicle | null;
  filters: FilterState;
  isLoading: boolean;
  lastUpdate: number;
  globeReady: boolean;
}

// OpenSky Network API response types
export interface OpenSkyState {
  time: number;
  states: (string | number | boolean | number[] | null)[][] | null;
}

// Globe point data for rendering
export interface GlobePoint {
  id: string;
  lat: number;
  lng: number;
  alt: number;
  color: string;
  size: number;
  label: string;
  vehicle: Vehicle;
  rotation: number;
}

export interface GlobePath {
  coords: [number, number, number][];
  color: string;
}
