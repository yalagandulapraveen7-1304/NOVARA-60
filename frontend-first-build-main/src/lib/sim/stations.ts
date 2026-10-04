export type BuildingId =
  | "main"
  | "power"
  | "workshop"
  | "storage"
  | "comms"
  | "weather"
  | "vehicles";

export interface BuildingDef {
  id: BuildingId;
  name: string;
  short: string;
  position: [number, number, number];
  size: [number, number, number]; // w, h, d
  color: string;
  description: string;
  category: "infrastructure" | "energy" | "environment" | "logistics";
}

export interface StationConfig {
  id: "maitri" | "bharati";
  name: string;
  fullName: string;
  coordinates: string;
  established: number;
  elevation: string;
  buildings: BuildingDef[];
  solarPanels: { position: [number, number, number]; rotation: number }[];
  windTurbines: [number, number, number][];
  fuelTanks: [number, number, number][];
  batteryBank: [number, number, number];
  vehicles: { position: [number, number, number]; rotation: number; kind: "tracked" | "snow" }[];
  commTower: [number, number, number];
}

const maitriBuildings: BuildingDef[] = [
  {
    id: "main",
    name: "Main Station Complex",
    short: "MAIN",
    position: [0, 0, 0],
    size: [26, 6, 12],
    color: "#c8d4dd",
    description:
      "Primary insulated habitat: accommodation, laboratories, control room, medical room, kitchen and recreation.",
    category: "infrastructure",
  },
  {
    id: "power",
    name: "Power House",
    short: "PWR",
    position: [-24, 0, 8],
    size: [12, 5, 9],
    color: "#b8c4ce",
    description:
      "Diesel generators, electrical distribution, battery bank, inverters and control panels.",
    category: "energy",
  },
  {
    id: "workshop",
    name: "Workshop",
    short: "WKS",
    position: [18, 0, 12],
    size: [10, 4.5, 8],
    color: "#aeb9c4",
    description: "Maintenance equipment, tools, machinery and spare parts.",
    category: "infrastructure",
  },
  {
    id: "storage",
    name: "Storage & Logistics",
    short: "LOG",
    position: [16, 0, -12],
    size: [12, 5, 9],
    color: "#c2ccd6",
    description: "Food storage, fuel storage, equipment and scientific supplies.",
    category: "logistics",
  },
  {
    id: "comms",
    name: "Communication Facility",
    short: "COM",
    position: [-16, 0, -14],
    size: [7, 4, 6],
    color: "#b4c0cb",
    description: "Satellite communication equipment, antennas and communication tower.",
    category: "infrastructure",
  },
  {
    id: "weather",
    name: "Weather Monitoring",
    short: "MET",
    position: [30, 0, 2],
    size: [4, 3, 4],
    color: "#cfd8e0",
    description:
      "Temperature, wind, pressure, solar radiation and visibility sensors.",
    category: "environment",
  },
  {
    id: "vehicles",
    name: "Vehicle & Field Ops",
    short: "VEH",
    position: [-6, 0, 20],
    size: [11, 4, 7],
    color: "#b9c5d0",
    description: "Tracked vehicles, snow vehicles, transport and field equipment.",
    category: "logistics",
  },
];

const bharatiBuildings: BuildingDef[] = [
  {
    id: "main",
    name: "Main Station Complex",
    short: "MAIN",
    position: [0, 0, 0],
    size: [30, 7, 14],
    color: "#d3dbe2",
    description:
      "Primary insulated habitat: accommodation, laboratories, control room, medical room, kitchen and recreation.",
    category: "infrastructure",
  },
  {
    id: "power",
    name: "Power House",
    short: "PWR",
    position: [26, 0, 10],
    size: [13, 5, 10],
    color: "#bcc8d2",
    description:
      "Diesel generators, electrical distribution, battery bank, inverters and control panels.",
    category: "energy",
  },
  {
    id: "workshop",
    name: "Workshop",
    short: "WKS",
    position: [-20, 0, 14],
    size: [10, 4.5, 8],
    color: "#aeb9c4",
    description: "Maintenance equipment, tools, machinery and spare parts.",
    category: "infrastructure",
  },
  {
    id: "storage",
    name: "Storage & Logistics",
    short: "LOG",
    position: [-22, 0, -10],
    size: [12, 5, 9],
    color: "#c2ccd6",
    description: "Food storage, fuel storage, equipment and scientific supplies.",
    category: "logistics",
  },
  {
    id: "comms",
    name: "Communication Facility",
    short: "COM",
    position: [14, 0, -16],
    size: [7, 4, 6],
    color: "#b4c0cb",
    description: "Satellite communication equipment, antennas and communication tower.",
    category: "infrastructure",
  },
  {
    id: "weather",
    name: "Weather Monitoring",
    short: "MET",
    position: [-32, 0, 0],
    size: [4, 3, 4],
    color: "#cfd8e0",
    description:
      "Temperature, wind, pressure, solar radiation and visibility sensors.",
    category: "environment",
  },
  {
    id: "vehicles",
    name: "Vehicle & Field Ops",
    short: "VEH",
    position: [8, 0, 22],
    size: [11, 4, 7],
    color: "#b9c5d0",
    description: "Tracked vehicles, snow vehicles, transport and field equipment.",
    category: "logistics",
  },
];

export const STATIONS: Record<"maitri" | "bharati", StationConfig> = {
  maitri: {
    id: "maitri",
    name: "Maitri",
    fullName: "Maitri Station",
    coordinates: "70.77° S, 11.73° E",
    established: 1989,
    elevation: "117 m · Schirmacher Oasis",
    buildings: maitriBuildings,
    solarPanels: [
      { position: [10, 0, -22], rotation: 0.2 },
      { position: [16, 0, -22], rotation: 0.2 },
      { position: [22, 0, -22], rotation: 0.2 },
      { position: [10, 0, -27], rotation: 0.2 },
      { position: [16, 0, -27], rotation: 0.2 },
      { position: [22, 0, -27], rotation: 0.2 },
    ],
    windTurbines: [
      [-34, 0, -20],
      [-40, 0, -12],
    ],
    fuelTanks: [
      [-30, 0, 16],
      [-30, 0, 21],
    ],
    batteryBank: [-24, 0, 14],
    vehicles: [
      { position: [-4, 0, 27], rotation: 0.4, kind: "tracked" },
      { position: [2, 0, 27], rotation: -0.2, kind: "snow" },
    ],
    commTower: [-20, 0, -18],
  },
  bharati: {
    id: "bharati",
    name: "Bharati",
    fullName: "Bharati Station",
    coordinates: "69.41° S, 76.19° E",
    established: 2012,
    elevation: "35 m · Larsemann Hills",
    buildings: bharatiBuildings,
    solarPanels: [
      { position: [-12, 0, -24], rotation: -0.15 },
      { position: [-6, 0, -24], rotation: -0.15 },
      { position: [0, 0, -24], rotation: -0.15 },
      { position: [6, 0, -24], rotation: -0.15 },
      { position: [-12, 0, -29], rotation: -0.15 },
      { position: [-6, 0, -29], rotation: -0.15 },
      { position: [0, 0, -29], rotation: -0.15 },
      { position: [6, 0, -29], rotation: -0.15 },
    ],
    windTurbines: [
      [34, 0, -18],
      [40, 0, -8],
      [36, 0, 2],
    ],
    fuelTanks: [
      [32, 0, 18],
      [32, 0, 23],
    ],
    batteryBank: [26, 0, 16],
    vehicles: [
      { position: [10, 0, 29], rotation: -0.3, kind: "tracked" },
      { position: [4, 0, 29], rotation: 0.15, kind: "snow" },
      { position: [-2, 0, 29], rotation: 0.5, kind: "tracked" },
    ],
    commTower: [18, 0, -20],
  },
};
