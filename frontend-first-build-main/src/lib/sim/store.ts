import { create } from "zustand";
import type { BuildingId } from "./stations";
import { api } from "../api";

export type WeatherMode = "clear" | "cloudy" | "snow" | "blizzard" | "extremeCold";
export type CameraMode = "overview" | "energy" | "infrastructure" | "environment" | "logistics" | "emergency";
export type AlertLevel = "critical" | "warning" | "notice" | "info";
export type TimeSpeed = 0 | 1 | 5 | 20;

export interface Alert {
  id: number;
  level: AlertLevel;
  title: string;
  detail: string;
  time: string;
  target?: BuildingId | "generator" | "battery" | "fuel" | "weather";
}

export interface Telemetry {
  temperature: number;
  windSpeed: number;
  windDirection: string;
  pressure: number;
  visibility: number;
  snowfall: string;
  solarRadiation: number;
  solarKw: number;
  windKw: number;
  dieselKw: number;
  batteryKw: number; // + charging, - discharging
  batterySoc: number;
  batteryHealth: number;
  batteryTemp: number;
  batteryCycles: number;
  fuelPct: number;
  fuelDaysLeft: number;
  fuelLph: number;
  heatingKw: number;
  labKw: number;
  accomKw: number;
  commsKw: number;
  otherKw: number;
  gen1: "online" | "standby" | "failed";
  gen2: "online" | "standby" | "failed";
  batteryOnline: boolean;
  shedP3: boolean;
  shedP2: boolean;
}

export interface LogisticsItem {
  name: string;
  pct: number;
  rate: string;
  daysLeft: number;
  priority: "P0" | "P1" | "P2" | "P3";
}

export type ScenarioId = "generator" | "battery" | "fuel" | "blizzard" | "extremeCold" | "stormSequence";
export type ScenarioStatus = "inactive" | "active" | "completed";

export interface ScenarioDelta {
  label: string;
  before: string;
  after: string;
  direction: "up" | "down" | "neutral" | "bad" | "good";
}

export interface ScenarioAssetImpact {
  name: string;
  status: string;
  state: "danger" | "warning" | "success" | "muted";
}

export interface ScenarioImpact {
  scenarioId: ScenarioId;
  scenarioName: string;
  triggeredAt: string;
  severity: "critical" | "warning" | "high" | "notice";
  summary: string;
  affectedAssets: ScenarioAssetImpact[];
  deltas: ScenarioDelta[];
  activeAlerts: string[];
  automatedActions: string[];
}

export interface ScenarioLogEntry {
  id: string;
  time: string;
  scenarioId: ScenarioId | "reset";
  scenarioName: string;
  action: string;
  severity: "critical" | "warning" | "high" | "notice" | "info";
  detail: string;
}

export interface StormStageInfo {
  stage: number;
  title: string;
  description: string;
  telemetryMod: Partial<Telemetry>;
  weather: WeatherMode;
  deltas: ScenarioDelta[];
  assets: ScenarioAssetImpact[];
  alerts: string[];
  actions: string[];
}

interface SimState {
  stationId: "maitri" | "bharati";
  weather: WeatherMode;
  telemetry: Telemetry;
  alerts: Alert[];
  selectedBuilding: BuildingId | null;
  cameraMode: CameraMode;
  focusTarget: string | null;
  focusNonce: number;
  simHour: number; // 0-24 fractional
  timeSpeed: TimeSpeed;
  dashboardOpen: boolean;
  dashboardTab: "Overview" | "Energy" | "Infrastructure" | "Environment" | "Logistics" | "AI & Prediction" | "Alerts" | "Simulation";
  setDashboardTab: (t: "Overview" | "Energy" | "Infrastructure" | "Environment" | "Logistics" | "AI & Prediction" | "Alerts" | "Simulation") => void;
  openDashboardTo: (t: "Overview" | "Energy" | "Infrastructure" | "Environment" | "Logistics" | "AI & Prediction" | "Alerts" | "Simulation") => void;
  mapView: boolean;
  demoRunning: boolean;
  demoStep: number;
  fuelHistory: { t: string; level: number }[];
  energyHistory: { t: string; gen: number; load: number }[];
  logistics: LogisticsItem[];
  aiMessages: { title: string; body: string; actions: string[] }[];
  // Scenario Analytics State
  scenarioStatuses: Record<ScenarioId, ScenarioStatus>;
  activeScenarioImpact: ScenarioImpact | null;
  scenarioHistory: ScenarioLogEntry[];
  stormRunning: boolean;
  stormPaused: boolean;
  stormStep: number;
  lastFeedbackMessage: { text: string; type: "success" | "info" | "warning" } | null;
  setStation: (id: "maitri" | "bharati") => void;
  setWeather: (w: WeatherMode) => void;
  selectBuilding: (b: BuildingId | null) => void;
  setCameraMode: (m: CameraMode) => void;
  setTimeSpeed: (s: TimeSpeed) => void;
  setDashboardOpen: (o: boolean) => void;
  setMapView: (v: boolean) => void;
  tick: () => void;
  pushAlert: (a: Omit<Alert, "id" | "time">) => void;
  focusOn: (target: string) => void;
  simulateFailure: (kind: "generator" | "battery" | "fuel" | "blizzard" | "extremeCold" | "stormSequence") => void;
  resetFailures: () => void;
  triggerScenario: (id: ScenarioId) => void;
  resetAllScenarios: () => void;
  startStormSequence: () => void;
  pauseStormSequence: () => void;
  resumeStormSequence: () => void;
  stepStormSequence: () => void;
  stopStormSequence: () => void;
  clearFeedbackMessage: () => void;
  startDemo: () => void;
  stopDemo: () => void;
  advanceDemo: () => void;
  dismissAlert: (id: number) => void;
  executeAiAction: (action: string) => void;
}

let alertId = 1;

const baseTelemetry: Telemetry = {
  temperature: -18.4,
  windSpeed: 27,
  windDirection: "NW",
  pressure: 982,
  visibility: 8.4,
  snowfall: "Light",
  solarRadiation: 310,
  solarKw: 420,
  windKw: 310,
  dieselKw: 650,
  batteryKw: 120,
  batterySoc: 78,
  batteryHealth: 94,
  batteryTemp: -12,
  batteryCycles: 324,
  fuelPct: 68,
  fuelDaysLeft: 14.2,
  fuelLph: 31,
  heatingKw: 410,
  labKw: 130,
  accomKw: 90,
  commsKw: 40,
  otherKw: 70,
  gen1: "online",
  gen2: "standby",
  batteryOnline: true,
  shedP3: false,
  shedP2: false,
};

const baseLogistics: LogisticsItem[] = [
  { name: "Fuel", pct: 68, rate: "31 L/h", daysLeft: 14, priority: "P0" },
  { name: "Food", pct: 82, rate: "0.4%/day", daysLeft: 205, priority: "P0" },
  { name: "Medical supplies", pct: 91, rate: "0.1%/day", daysLeft: 310, priority: "P0" },
  { name: "Scientific supplies", pct: 63, rate: "0.6%/day", daysLeft: 105, priority: "P2" },
  { name: "Spare parts", pct: 54, rate: "0.3%/day", daysLeft: 180, priority: "P1" },
];

const weatherEffects: Record<WeatherMode, Partial<Telemetry>> = {
  clear: { temperature: -14, windSpeed: 12, visibility: 25, snowfall: "None", solarRadiation: 620, pressure: 995 },
  cloudy: { temperature: -16, windSpeed: 20, visibility: 12, snowfall: "None", solarRadiation: 380, pressure: 988 },
  snow: { temperature: -18.4, windSpeed: 27, visibility: 8.4, snowfall: "Light", solarRadiation: 310, pressure: 982 },
  blizzard: { temperature: -26, windSpeed: 78, visibility: 0.6, snowfall: "Heavy", solarRadiation: 40, pressure: 968 },
  extremeCold: { temperature: -41, windSpeed: 18, visibility: 15, snowfall: "None", solarRadiation: 480, pressure: 1001 },
};

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}
function jitter(v: number, amt: number) {
  return v + (Math.random() - 0.5) * 2 * amt;
}
function fmtTime(h: number) {
  const hh = Math.floor(h) % 24;
  const mm = Math.floor((h % 1) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export const STORM_STAGES: StormStageInfo[] = [
  {
    stage: 1,
    title: "Stage 1: Barometric Drop & Early Warning",
    description: "Katabatic front develops. Barometric pressure falls from 982 to 968 hPa with dense overcast.",
    telemetryMod: { pressure: 968, visibility: 6.2 },
    weather: "cloudy",
    deltas: [
      { label: "Barometric Pressure", before: "982 hPa", after: "968 hPa", direction: "down" },
      { label: "Cloud Cover", before: "25%", after: "95%", direction: "up" },
    ],
    assets: [
      { name: "Met Mast AWS", status: "PRESSURE FALLING", state: "warning" },
      { name: "Microgrid Bus", status: "NOMINAL", state: "success" },
    ],
    alerts: ["Katabatic front detected. Barometric pressure dropping rapidly."],
    actions: ["Alert issued to field research teams", "Microgrid pre-check initiated"],
  },
  {
    stage: 2,
    title: "Stage 2: Katabatic Wind Acceleration",
    description: "Katabatic wind accelerates to 48 km/h. Wind turbine harvest surges to 440 kW.",
    telemetryMod: { windSpeed: 48, windKw: 440 },
    weather: "snow",
    deltas: [
      { label: "Wind Velocity", before: "27 km/h", after: "48 km/h", direction: "up" },
      { label: "Wind Turbine Harvest", before: "310 kW", after: "440 kW", direction: "good" },
    ],
    assets: [
      { name: "60kW Wind Turbines", status: "HIGH GENERATION", state: "success" },
      { name: "Met Mast AWS", status: "GALE DEVELOPING", state: "warning" },
    ],
    alerts: ["Katabatic wind speed exceeded 45 km/h threshold."],
    actions: ["Turbine pitch control active", "Battery charge rate boosted to capture surplus"],
  },
  {
    stage: 3,
    title: "Stage 3: Gale Force Threshold & Logistic Freeze",
    description: "Wind velocity reaches 78 km/h. AWS Met Mast issues Gale Level Red. All outdoor logistics suspended.",
    telemetryMod: { windSpeed: 78, visibility: 1.8, temperature: -22 },
    weather: "blizzard",
    deltas: [
      { label: "Wind Velocity", before: "48 km/h", after: "78 km/h", direction: "bad" },
      { label: "Outdoor Visibility", before: "6.2 km", after: "1.8 km", direction: "down" },
    ],
    assets: [
      { name: "Logistics Skid", status: "OPERATIONS HALTED", state: "danger" },
      { name: "Main Station Envelope", status: "ISOLATED", state: "warning" },
    ],
    alerts: ["Gale Level Red: Katabatic wind > 75 km/h. Station perimeter lockdown."],
    actions: ["External airlock doors sealed", "Logistics transit suspended"],
  },
  {
    stage: 4,
    title: "Stage 4: Whiteout Blizzard & Solar Suppression",
    description: "Violent blowing snow drops visibility to 0.5 km. Bifacial solar panels occluded; generation falls to 18 kW.",
    telemetryMod: { visibility: 0.5, solarKw: 18, solarRadiation: 35 },
    weather: "blizzard",
    deltas: [
      { label: "Solar Bifacial Yield", before: "420 kW", after: "18 kW", direction: "bad" },
      { label: "Visibility", before: "1.8 km", after: "0.5 km", direction: "bad" },
    ],
    assets: [
      { name: "Bifacial Solar Array", status: "SNOW COVERED / SUPPRESSED", state: "danger" },
      { name: "Power House", status: "RAMPING DIESEL", state: "warning" },
    ],
    alerts: ["Solar array generation dropped by 95% due to blowing snow accumulation."],
    actions: ["Diesel generator ramp initiated to offset renewable deficit", "BESS discharging"],
  },
  {
    stage: 5,
    title: "Stage 5: Turbine Safety Feathering (Cut-Out)",
    description: "Wind gusts exceed 92 km/h (25.5 m/s cut-out). Turbines auto-feather blades and engage mechanical brakes.",
    telemetryMod: { windSpeed: 92, windKw: 0 },
    weather: "blizzard",
    deltas: [
      { label: "Wind Turbine Harvest", before: "440 kW", after: "0 kW (Braked)", direction: "bad" },
      { label: "Peak Katabatic Gusts", before: "78 km/h", after: "92 km/h", direction: "bad" },
    ],
    assets: [
      { name: "60kW Wind Turbines", status: "AERODYNAMIC BRAKE ENGAGED", state: "danger" },
      { name: "Power Substation", status: "ISLANDED RENEWABLES", state: "warning" },
    ],
    alerts: ["Turbine safety cut-out: Wind velocity > 25 m/s. Mechanical brake locks active."],
    actions: ["Turbine emergency feathering confirmed", "Diesel generators take full station load"],
  },
  {
    stage: 6,
    title: "Stage 6: Generator 1 Alternator Trip",
    description: "Primary Generator 1 suffers sudden alternator thermal protection trip under abrupt ramp shock.",
    telemetryMod: { gen1: "failed" },
    weather: "blizzard",
    deltas: [
      { label: "Generator 1", before: "450 kW (Online)", after: "0 kW (FAILED)", direction: "bad" },
      { label: "Available Generation", before: "650 kW", after: "0 kW (Transient)", direction: "bad" },
    ],
    assets: [
      { name: "Generator 1 (Primary)", status: "TRIP / FAULT", state: "danger" },
      { name: "BESS LiFePO4 Inverter", status: "EMERGENCY DISCHARGE", state: "warning" },
    ],
    alerts: ["CRITICAL: Generator 1 thermal trip. Microgrid transient frequency excursion."],
    actions: ["BESS inverter discharges instantly to preserve 50 Hz bus", "Gen 2 auto-start signal sent"],
  },
  {
    stage: 7,
    title: "Stage 7: Auto-Sync Gen 2 & BESS Surge",
    description: "Auxiliary Generator 2 synchronizes at 50.00 Hz within 8 seconds. BESS sustains 180 kW buffer.",
    telemetryMod: { gen2: "online", batteryKw: -180 },
    weather: "blizzard",
    deltas: [
      { label: "Generator 2 (Backup)", before: "0 kW (Standby)", after: "450 kW (Online)", direction: "good" },
      { label: "BESS Discharge Rate", before: "0 kW", after: "-180 kW", direction: "warning" },
      { label: "Bus Frequency", before: "49.88 Hz", after: "50.00 Hz", direction: "good" },
    ],
    assets: [
      { name: "Generator 2 (Backup)", status: "ONLINE & SYNCHRONIZED", state: "success" },
      { name: "Microgrid Bus 415V", status: "FREQUENCY STABILIZED", state: "success" },
    ],
    alerts: ["Generator 2 successfully synchronized to station microgrid."],
    actions: ["Phase synchronizer verified", "BESS discharge rate stabilized at 180 kW"],
  },
  {
    stage: 8,
    title: "Stage 8: Priority Automated Load Shedding",
    description: "To safeguard life support (P0), microgrid controller sheds P3 auxiliary labs and modulates P2 heating.",
    telemetryMod: { shedP3: true, shedP2: true, accomKw: 55, otherKw: 25 },
    weather: "blizzard",
    deltas: [
      { label: "P3 Auxiliary Load", before: "70 kW", after: "25 kW (SHED)", direction: "good" },
      { label: "P2 Habitat Heating", before: "90 kW", after: "55 kW (Modulated)", direction: "neutral" },
      { label: "Total Station Load", before: "740 kW", after: "530 kW (-210 kW)", direction: "good" },
    ],
    assets: [
      { name: "P3 Load Contactor", status: "SHED / ISOLATED", state: "warning" },
      { name: "P0 Life Support Bus", status: "FULLY ENERGIZED", state: "success" },
    ],
    alerts: ["Automated Load Shedding: P3 research and snowmelter loads isolated. P0 priority preserved."],
    actions: ["P3 contactors tripped", "Habitat thermal deadband widened by 2°C"],
  },
  {
    stage: 9,
    title: "Stage 9: Katabatic Decay & Wind Subsidence",
    description: "Blizzard eye passes; wind recedes to 34 km/h, visibility opens to 6.5 km. Turbines released for restart.",
    telemetryMod: { windSpeed: 34, visibility: 6.5, windKw: 280 },
    weather: "snow",
    deltas: [
      { label: "Wind Velocity", before: "92 km/h", after: "34 km/h", direction: "good" },
      { label: "Wind Generation", before: "0 kW (Braked)", after: "280 kW (Restored)", direction: "good" },
    ],
    assets: [
      { name: "60kW Wind Turbines", status: "BRAKE RELEASED / GENERATING", state: "success" },
      { name: "Met Mast AWS", status: "STORM DECAYING", state: "success" },
    ],
    alerts: ["Storm warning downgraded. Katabatic wind velocity within safe operating envelope."],
    actions: ["Turbine brakes disengaged", "Station exterior damage inspection scheduled"],
  },
  {
    stage: 10,
    title: "Stage 10: Nominal Recovery Protocol Complete",
    description: "Generator 1 reset and returned to standby. Shed loads re-energized. Microgrid returns to baseline equilibrium.",
    telemetryMod: {
      gen1: "online",
      gen2: "standby",
      shedP3: false,
      shedP2: false,
      solarKw: 420,
      windKw: 310,
      dieselKw: 650,
      batteryKw: 120,
      accomKw: 90,
      otherKw: 70,
    },
    weather: "snow",
    deltas: [
      { label: "Generator 1", before: "FAILED", after: "ONLINE", direction: "good" },
      { label: "P3 Auxiliary Load", before: "SHED", after: "RESTORED", direction: "good" },
      { label: "Station Operating Status", before: "STORM CONTINGENCY", after: "NOMINAL 100%", direction: "good" },
    ],
    assets: [
      { name: "Microgrid Master Controller", status: "NOMINAL EQUILIBRIUM", state: "success" },
      { name: "All Station Subsystems", status: "NOMINAL", state: "success" },
    ],
    alerts: ["Antarctic Storm Sequence protocol completed. All station systems restored to nominal baselines."],
    actions: ["All load contactors reclosed", "G1 alternator verified clear", "Sequence marked COMPLETED"],
  },
];

let stormInterval: ReturnType<typeof setInterval> | null = null;

export const useSim = create<SimState>((set, get) => ({
  stationId: "maitri",
  weather: "snow",
  telemetry: { ...baseTelemetry },
  alerts: [
    {
      id: alertId++,
      level: "info",
      title: "Digital twin synchronized",
      detail: "Simulated telemetry stream online. All systems nominal.",
      time: fmtTime(18),
    },
    {
      id: alertId++,
      level: "notice",
      title: "Blizzard predicted in 6 hours",
      detail: "Weather model shows deteriorating conditions after 00:00.",
      time: fmtTime(18),
      target: "weather",
    },
  ],
  selectedBuilding: null,
  cameraMode: "overview",
  focusTarget: null,
  focusNonce: 0,
  simHour: 18,
  timeSpeed: 1,
  dashboardOpen: false,
  dashboardTab: "Overview",
  setDashboardTab: (t) => set({ dashboardTab: t }),
  openDashboardTo: (t) => set({ dashboardTab: t, dashboardOpen: true }),
  mapView: false,
  demoRunning: false,
  demoStep: 0,
  fuelHistory: Array.from({ length: 24 }, (_, i) => ({
    t: fmtTime(i),
    level: 68 + (24 - i) * 0.12 + Math.sin(i / 3) * 0.4,
  })),
  energyHistory: Array.from({ length: 24 }, (_, i) => ({
    t: fmtTime(i),
    gen: 1300 + Math.sin(i / 4) * 150,
    load: 720 + Math.cos(i / 5) * 80,
  })),
  logistics: baseLogistics.map((l) => ({ ...l })),
  aiMessages: [
    {
      title: "HIGH ENERGY DEMAND EXPECTED",
      body: "Severe cold conditions predicted for the next 6 hours. Heating load projected to rise ~18%.",
      actions: [
        "Increase Generator 2 readiness",
        "Charge battery to 90%",
        "Reduce non-critical heating load",
        "Postpone non-essential equipment operation",
      ],
    },
  ],
  // Scenario Analytics initial state
  scenarioStatuses: {
    generator: "inactive",
    battery: "inactive",
    fuel: "inactive",
    blizzard: "inactive",
    extremeCold: "inactive",
    stormSequence: "inactive",
  },
  activeScenarioImpact: null,
  scenarioHistory: [
    {
      id: "log-init-1",
      time: "18:00 UTC",
      scenarioId: "reset",
      scenarioName: "System Baseline",
      action: "TELEMETRY_SYNC",
      severity: "info",
      detail: "Maitri/Bharati digital twin microgrid telemetry synchronized. All generators nominal.",
    },
    {
      id: "log-init-0",
      time: "17:45 UTC",
      scenarioId: "reset",
      scenarioName: "SCADA Init",
      action: "MODEL_LOAD",
      severity: "info",
      detail: "Mathematical simulation core active. Baseline equilibrium established.",
    },
  ],
  stormRunning: false,
  stormPaused: false,
  stormStep: 1,
  lastFeedbackMessage: null,

  setStation: (id) => {
    set({
      stationId: id,
      selectedBuilding: null,
      cameraMode: "overview",
      focusTarget: null,
      telemetry: { ...get().telemetry },
    });
    // Async synchronization with backend
    api.getLiveTelemetry(id).then((snap) => {
      if (snap) {
        set((s) => ({
          telemetry: {
            ...s.telemetry,
            solarKw: snap.solar_kw,
            windKw: snap.wind_kw,
            dieselKw: snap.diesel_kw,
            batteryKw: snap.battery_kw,
            batterySoc: snap.battery_soc_pct,
            heatingKw: snap.heating_kw,
            temperature: snap.temperature_c,
            windSpeed: snap.wind_speed_ms,
            gen1: snap.gen1_status,
            gen2: snap.gen2_status,
            shedP2: snap.shed_p2_hab,
            shedP3: snap.shed_p3_aux,
          },
        }));
      }
    }).catch(() => {});
  },
  setWeather: (w) => {
    const fx = weatherEffects[w];
    set((s) => ({
      weather: w,
      telemetry: { ...s.telemetry, ...fx },
    }));
    api.setWeather(get().stationId, w).catch(() => {});
    get().pushAlert({
      level: w === "blizzard" || w === "extremeCold" ? "warning" : "info",
      title: `Weather changed: ${w.toUpperCase()}`,
      detail:
        w === "blizzard"
          ? "Solar generation reduced, heating demand increased, logistics restricted."
          : w === "extremeCold"
            ? "Battery performance reduced, fuel consumption increased."
            : "Environmental parameters updated across the digital twin.",
      target: "weather",
    });
  },
  selectBuilding: (b) => set({ selectedBuilding: b }),
  setCameraMode: (m) => set({ cameraMode: m, focusTarget: null }),
  setTimeSpeed: (s) => {
    set({ timeSpeed: s });
    api.setTimeSpeed(get().stationId, s).catch(() => {});
  },
  setDashboardOpen: (o) => set({ dashboardOpen: o }),
  setMapView: (v) => set({ mapView: v }),

  pushAlert: (a) =>
    set((s) => ({
      alerts: [{ ...a, id: alertId++, time: fmtTime(s.simHour) }, ...s.alerts].slice(0, 30),
    })),

  focusOn: (target) =>
    set((s) => ({ focusTarget: target, focusNonce: s.focusNonce + 1, mapView: false })),

  tick: () => {
    const s = get();
    if (s.timeSpeed === 0) return;
    const dtHours = (s.timeSpeed * 2) / 3600; // 2s real tick
    const simHour = (s.simHour + dtHours) % 24;
    const t = { ...s.telemetry };
    const w = s.weather;

    // Solar follows time of day (polar day assumed in summer window)
    const dayFactor = clamp(Math.sin(((simHour - 4) / 20) * Math.PI), 0, 1);
    const weatherSolar =
      w === "blizzard" ? 0.06 : w === "snow" ? 0.5 : w === "cloudy" ? 0.62 : w === "extremeCold" ? 0.78 : 1;
    t.solarRadiation = clamp(jitter(620 * dayFactor * weatherSolar, 12), 0, 700);
    t.solarKw = clamp(jitter(420 * dayFactor * weatherSolar + 40, 14), 0, 520);

    // Wind generation
    const windBase = w === "blizzard" ? 460 : w === "snow" ? 310 : w === "cloudy" ? 260 : w === "extremeCold" ? 220 : 180;
    t.windKw = clamp(jitter(windBase, 18), 0, 520);
    t.windSpeed = clamp(jitter(t.windSpeed, 1.6), 2, 110);
    t.temperature = clamp(jitter(t.temperature, 0.25), -45, 5);
    t.pressure = clamp(jitter(t.pressure, 0.4), 950, 1020);

    // Heating demand rises with cold
    const coldLoad = clamp((-t.temperature - 10) * 9, 200, 620);
    t.heatingKw = clamp(jitter(coldLoad, 8), 150, 640);
    t.labKw = clamp(jitter(130, 5), 100, 160);
    t.accomKw = clamp(jitter(t.shedP2 ? 55 : 90, 4), 40, 120);
    t.commsKw = clamp(jitter(40, 2), 30, 55);
    t.otherKw = clamp(jitter(t.shedP3 ? 25 : 70, 4), 15, 95);

    const totalLoad = t.heatingKw + t.labKw + t.accomKw + t.commsKw + t.otherKw;
    const renewable = t.solarKw + t.windKw;

    // Diesel fills the gap
    const genCapacity = (t.gen1 === "online" ? 450 : 0) + (t.gen2 === "online" ? 450 : 0);
    let dieselNeed = clamp(totalLoad - renewable, 0, genCapacity);
    if (t.gen1 === "failed" && t.gen2 !== "online") dieselNeed = 0;
    t.dieselKw = clamp(jitter(dieselNeed, 10), 0, Math.max(genCapacity, 1));

    // Battery balance
    const balance = renewable + t.dieselKw - totalLoad;
    if (t.batteryOnline) {
      t.batteryKw = clamp(balance, -250, 250);
      t.batterySoc = clamp(t.batterySoc + (t.batteryKw / 900) * dtHours * 60, 4, 100);
    } else {
      t.batteryKw = 0;
    }
    t.batteryTemp = clamp(jitter(w === "extremeCold" ? -22 : -12, 0.4), -30, 10);

    // Fuel
    t.fuelLph = clamp(jitter(12 + t.dieselKw * 0.045, 0.8), 5, 60);
    t.fuelPct = clamp(t.fuelPct - (t.fuelLph / 42000) * dtHours * 3600 * 0.05, 0, 100);
    t.fuelDaysLeft = t.fuelLph > 0 ? clamp((t.fuelPct * 420) / t.fuelLph / 24, 0, 60) : 60;

    const fuelHistory = [...s.fuelHistory, { t: fmtTime(simHour), level: t.fuelPct }].slice(-48);
    const energyHistory = [
      ...s.energyHistory,
      { t: fmtTime(simHour), gen: Math.round(renewable + t.dieselKw), load: Math.round(totalLoad) },
    ].slice(-48);

    const logistics = s.logistics.map((l) =>
      l.name === "Fuel" ? { ...l, pct: Math.round(t.fuelPct), daysLeft: Math.round(t.fuelDaysLeft), rate: `${t.fuelLph.toFixed(0)} L/h` } : l,
    );

    set({ telemetry: t, simHour, fuelHistory, energyHistory, logistics });
  },

  clearFeedbackMessage: () => set({ lastFeedbackMessage: null }),

  triggerScenario: (id: ScenarioId) => {
    const s = get();
    const curT = { ...s.telemetry };
    const simTime = fmtTime(s.simHour) + " UTC";

    if (id === "stormSequence") {
      get().startStormSequence();
      return;
    }

    if (s.stormRunning) {
      get().stopStormSequence();
    }

    const newStatuses: Record<ScenarioId, ScenarioStatus> = {
      ...s.scenarioStatuses,
      [id]: "active",
    };

    let impact: ScenarioImpact;
    let logDetail = "";
    let feedbackText = "";

    if (id === "generator") {
      curT.gen1 = "failed";
      curT.gen2 = "online";
      curT.batteryKw = -180;
      impact = {
        scenarioId: "generator",
        scenarioName: "Generator 1 Failure",
        triggeredAt: simTime,
        severity: "critical",
        summary:
          "Primary diesel alternator tripped offline. Backup Generator 2 auto-synchronized within 8s; BESS discharging 180 kW to buffer transient microgrid gap.",
        affectedAssets: [
          { name: "Power House Generator 1", status: "TRIPPED / OFFLINE", state: "danger" },
          { name: "Backup Generator 2", status: "ONLINE (50.00 Hz)", state: "success" },
          { name: "BESS LiFePO4 Inverter", status: "DISCHARGING (-180 kW)", state: "warning" },
          { name: "Main 415V Switchboard", status: "BUS SYNCHRONIZED", state: "success" },
        ],
        deltas: [
          { label: "Generator 1 Output", before: "450 kW", after: "0 kW (FAILED)", direction: "bad" },
          { label: "Generator 2 Output", before: "0 kW (Standby)", after: "450 kW (Active)", direction: "good" },
          { label: "BESS Battery Flow", before: "+120 kW (Charging)", after: "-180 kW (Discharge Boost)", direction: "warning" },
          { label: "Grid Bus Frequency", before: "50.02 Hz", after: "49.92 Hz -> 50.00 Hz", direction: "neutral" },
        ],
        activeAlerts: [
          "Generator 1 FAILED: Alternator stator overtemperature trip.",
          "Generator 2 auto-synchronized at 50 Hz bus.",
        ],
        automatedActions: [
          "Autonomous crank and sync of Gen 2 via Woodward controller",
          "BESS bi-directional inverter discharge ramp to 180 kW",
          "P3 shedding relays armed in case of secondary anomaly",
        ],
      };
      logDetail = "G1 tripped; G2 auto-started; BESS ramped -180kW. Frequency stabilized at 50.00 Hz.";
      feedbackText = "Triggered 'Generator 1 Failure': G2 synchronized, BESS compensating.";
      s.pushAlert({
        level: "critical",
        title: "Generator 1 FAILED",
        detail: "Available power reduced. Generator 2 auto-started, battery discharge increased. Energy balance recalculated.",
        target: "power",
      });
      api.injectFault(s.stationId, "generator").catch(() => {});
      set({ telemetry: curT, cameraMode: "emergency", scenarioStatuses: newStatuses, activeScenarioImpact: impact });
    } else if (id === "battery") {
      curT.batteryOnline = false;
      curT.batteryKw = 0;
      curT.dieselKw = Math.min(900, curT.dieselKw + 130);
      impact = {
        scenarioId: "battery",
        scenarioName: "Battery Bank Failure",
        triggeredAt: simTime,
        severity: "critical",
        summary:
          "BESS LiFePO4 storage bank isolated due to DC bus breaker trip. Microgrid operating in zero-storage mode; diesel generators absorbing all load swings.",
        affectedAssets: [
          { name: "BESS LiFePO4 Rack Bank", status: "DC BREAKER TRIPPED", state: "danger" },
          { name: "415V Battery PCS Inverter", status: "ISOLATED", state: "danger" },
          { name: "Diesel Gen-Sets (G1/G2)", status: "DYNAMIC GOVERNOR", state: "warning" },
          { name: "P0 Life Support Bus", status: "PROTECTED 100%", state: "success" },
        ],
        deltas: [
          { label: "Battery Bank State", before: "ONLINE (78% SoC)", after: "OFFLINE / DISCONNECTED", direction: "bad" },
          { label: "BESS Power Delivery", before: "+120 kW", after: "0 kW", direction: "bad" },
          { label: "Diesel Generator Dispatch", before: "650 kW", after: "780 kW (+130 kW)", direction: "warning" },
          { label: "Grid Storage Reserve", before: "4.8 Hours", after: "0.0 Hours", direction: "bad" },
        ],
        activeAlerts: [
          "Battery Bank Failure: BESS DC contactor isolation.",
          "Zero-storage mode: Microgrid frequency buffer transferred to diesel gens.",
        ],
        automatedActions: [
          "Immediate BESS DC contactor isolation to protect cells",
          "Diesel governor set to ultra-fast droop response (±0.05 Hz)",
          "P0 critical life-support circuits locked from curtailment",
        ],
      };
      logDetail = "BESS DC breaker tripped. Battery isolated. Diesel generation boosted by +130 kW.";
      feedbackText = "Triggered 'Battery Bank Failure': Storage isolated; diesel governor compensating.";
      s.pushAlert({
        level: "critical",
        title: "Battery Bank Failure",
        detail: "Battery unavailable. Critical loads remain active; diesel generation increased to compensate.",
        target: "power",
      });
      api.injectFault(s.stationId, "battery").catch(() => {});
      set({ telemetry: curT, cameraMode: "emergency", scenarioStatuses: newStatuses, activeScenarioImpact: impact });
    } else if (id === "fuel") {
      curT.fuelPct = 8.5;
      curT.fuelDaysLeft = 1.6;
      curT.shedP3 = true;
      curT.shedP2 = true;
      curT.fuelLph = 21;
      curT.accomKw = 55;
      curT.otherKw = 25;
      impact = {
        scenarioId: "fuel",
        scenarioName: "Fuel Reserve Deficit",
        triggeredAt: simTime,
        severity: "warning",
        summary:
          "Station ATF bulk reserves fallen below critical 10% safety margin (current 8.5%, 1.6 days endurance). Priority load shedding engaged to throttle consumption.",
        affectedAssets: [
          { name: "ATF Fuel Farm Tank 1-4", status: "LOW LEVEL (8.5%)", state: "danger" },
          { name: "P3 Auxiliary Breakers", status: "LOAD SHED ACTIVE", state: "warning" },
          { name: "Habitat Heating Circuit", status: "SETPOINT -2°C", state: "warning" },
          { name: "Day Tank Transfer Pump", status: "THROTTLED", state: "muted" },
        ],
        deltas: [
          { label: "Fuel Reserve Level", before: "68% (14.2 days)", after: "8.5% (1.6 days)", direction: "bad" },
          { label: "Fuel Burn Rate", before: "31 L/h", after: "21 L/h (-32%)", direction: "good" },
          { label: "P3 Auxiliary Lab Loads", before: "70 kW", after: "25 kW (SHED)", direction: "good" },
          { label: "P2 Habitat Thermal Load", before: "90 kW", after: "55 kW (Modulated)", direction: "neutral" },
        ],
        activeAlerts: [
          "Fuel Reserve Deficit: ATF storage < 10% critical floor.",
          "Automated priority shedding P3 active. P2 thermal setpoint adjusted.",
        ],
        automatedActions: [
          "P3 non-essential laboratory and snow-melter loads disconnected",
          "Habitat temperature setpoint set to -2°C night conservation mode",
          "Emergency supply tanker alert sent to NCPOR logistics coordinator",
        ],
      };
      logDetail = "ATF fuel dropped to 8.5% (1.6d). P3 loads shed, burn rate trimmed to 21 L/h.";
      feedbackText = "Triggered 'Fuel Reserve Deficit': P3 loads shed, fuel conservation active.";
      s.pushAlert({
        level: "warning",
        title: "Fuel Level < Critical Threshold",
        detail: "Estimated remaining operation 1.6 days. Automated load reduction active.",
        target: "storage",
      });
      api.injectFault(s.stationId, "fuel").catch(() => {});
      set({ telemetry: curT, scenarioStatuses: newStatuses, activeScenarioImpact: impact });
    } else if (id === "blizzard") {
      curT.windSpeed = 82;
      curT.visibility = 0.5;
      curT.solarKw = 15;
      curT.heatingKw = 590;
      impact = {
        scenarioId: "blizzard",
        scenarioName: "Severe Blizzard Gale",
        triggeredAt: simTime,
        severity: "critical",
        summary:
          "Violent Antarctic katabatic blizzard with sustained winds of 82 km/h (22.8 m/s). Solar irradiance occluded; wind turbines derated/feathered; heating demand surged +44%.",
        affectedAssets: [
          { name: "Met Mast AWS Anemometer", status: "GALE (82 km/h)", state: "danger" },
          { name: "60kW Wind Turbine Cluster", status: "SAFETY FEATHERING", state: "warning" },
          { name: "Bifacial Solar Array", status: "WHITEOUT OCCLUSION", state: "danger" },
          { name: "Central Heating CHP Loop", status: "SURGE (+44% LOAD)", state: "warning" },
        ],
        deltas: [
          { label: "Wind Velocity", before: "27 km/h", after: "82 km/h (Gale)", direction: "bad" },
          { label: "Outdoor Visibility", before: "8.4 km", after: "0.5 km (Whiteout)", direction: "bad" },
          { label: "Solar Generation", before: "420 kW", after: "15 kW (-96%)", direction: "bad" },
          { label: "Station Heating Load", before: "410 kW", after: "590 kW (+44%)", direction: "bad" },
        ],
        activeAlerts: [
          "Severe Blizzard Gale: 82 km/h winds, zero-visibility whiteout.",
          "Wind turbine safety feathering engaged. Field travel suspended.",
        ],
        automatedActions: [
          "Wind turbine aerofoil pitching to feathered park position",
          "Building perimeter trace heating energized at maximum output",
          "Field logistics status escalated to Red (No exterior egress)",
        ],
      };
      logDetail = "Katabatic blizzard: 82 km/h wind, 0.5 km vis. Solar suppressed to 15 kW, heating at 590 kW.";
      feedbackText = "Triggered 'Severe Blizzard Gale': 82 km/h katabatic gale, whiteout active.";
      s.pushAlert({
        level: "critical",
        title: "SEVERE BLIZZARD GALE",
        detail: "Wind 82 km/h, visibility 0.5 km. Solar generation suppressed, heating peaked.",
        target: "weather",
      });
      api.injectFault(s.stationId, "blizzard").catch(() => {});
      set({ telemetry: curT, weather: "blizzard", scenarioStatuses: newStatuses, activeScenarioImpact: impact });
    } else if (id === "extremeCold") {
      curT.temperature = -41.0;
      curT.batteryTemp = -24;
      curT.heatingKw = 625;
      curT.fuelLph = 39;
      impact = {
        scenarioId: "extremeCold",
        scenarioName: "Extreme Polar Cold",
        triggeredAt: simTime,
        severity: "high",
        summary:
          "Polar vortex descent drops ambient temperature to -41.0°C. Deep freeze creates extreme building thermal dissipation, BESS battery cell derating, and elevated fuel viscosity.",
        affectedAssets: [
          { name: "Station Thermal Envelope", status: "HIGH DISSIPATION", state: "warning" },
          { name: "District Heating Glycol Loop", status: "PEAK DEMAND (625 kW)", state: "danger" },
          { name: "BESS LiFePO4 Enclosure", status: "COLD DERATED (-24°C)", state: "warning" },
          { name: "Diesel Fuel Pre-Heaters", status: "ACTIVE 100%", state: "success" },
        ],
        deltas: [
          { label: "Ambient Temperature", before: "-18.4°C", after: "-41.0°C (Deep Freeze)", direction: "bad" },
          { label: "BESS Battery Core Temp", before: "-12°C", after: "-24°C (Cold Penalty)", direction: "bad" },
          { label: "Station Heating Demand", before: "410 kW", after: "625 kW (+52%)", direction: "bad" },
          { label: "Specific Fuel Burn", before: "31 L/h", after: "39 L/h (+26%)", direction: "bad" },
        ],
        activeAlerts: [
          "Extreme Polar Cold: Ambient temperature fallen to -41°C.",
          "Thermal heating demand peak at 625 kW. BESS cold penalty in effect.",
        ],
        automatedActions: [
          "Secondary glycol circulation pump energized across habitat zones",
          "BESS internal thermal conditioning blankets ramped to full power",
          "Fuel line electrical heat tracing verified functional across depot",
        ],
      };
      logDetail = "Polar deep freeze: -41°C. Heating demand surged to 625 kW, BESS cells derated at -24°C.";
      feedbackText = "Triggered 'Extreme Polar Cold': -41°C ambient, heating peaked at 625 kW.";
      s.pushAlert({
        level: "warning",
        title: "EXTREME POLAR COLD (-41°C)",
        detail: "Temperature fell to -41°C. Heating demand surged; battery cold penalty active.",
        target: "weather",
      });
      api.injectFault(s.stationId, "extremeCold").catch(() => {});
      set({ telemetry: curT, weather: "extremeCold", scenarioStatuses: newStatuses, activeScenarioImpact: impact });
    }

    const logEntry: ScenarioLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      time: simTime,
      scenarioId: id,
      scenarioName: impact!.scenarioName,
      action: "STRESS_INJECTION",
      severity: impact!.severity,
      detail: logDetail,
    };

    set((state) => ({
      scenarioHistory: [logEntry, ...state.scenarioHistory].slice(0, 40),
      lastFeedbackMessage: { text: feedbackText, type: "warning" },
    }));
  },

  simulateFailure: (kind) => {
    get().triggerScenario(kind);
  },

  resetFailures: () => {
    get().resetAllScenarios();
  },

  resetAllScenarios: () => {
    if (stormInterval) {
      clearInterval(stormInterval);
      stormInterval = null;
    }
    const s = get();
    api.resetSimulation(s.stationId).catch(() => {});
    const nominalT: Telemetry = {
      ...baseTelemetry,
      gen1: "online",
      gen2: "standby",
      batteryOnline: true,
      shedP2: false,
      shedP3: false,
      fuelPct: 68,
      fuelDaysLeft: 14.2,
      fuelLph: 31,
    };
    const simTime = fmtTime(s.simHour) + " UTC";
    const resetLog: ScenarioLogEntry = {
      id: `log-${Date.now()}-reset`,
      time: simTime,
      scenarioId: "reset",
      scenarioName: "System Reset",
      action: "RESET_ALL_SCENARIOS",
      severity: "info",
      detail: "All stress test faults cleared. Microgrid, fuel, and environment restored to nominal baselines.",
    };
    const nominalAlert: Alert = {
      id: alertId++,
      level: "info",
      title: "All Simulation Scenarios Reset",
      detail: "Station telemetry normalized. Generator 1 online, BESS online, fuel 68%, load shedding disengaged.",
      time: fmtTime(s.simHour),
    };
    set({
      telemetry: nominalT,
      weather: "snow",
      cameraMode: "overview",
      stormRunning: false,
      stormPaused: false,
      stormStep: 1,
      scenarioStatuses: {
        generator: "inactive",
        battery: "inactive",
        fuel: "inactive",
        blizzard: "inactive",
        extremeCold: "inactive",
        stormSequence: "inactive",
      },
      activeScenarioImpact: null,
      scenarioHistory: [resetLog, ...s.scenarioHistory].slice(0, 40),
      alerts: [nominalAlert, ...s.alerts.filter((a) => a.level !== "critical")].slice(0, 30),
      lastFeedbackMessage: { text: "All simulation scenarios reset to nominal baselines.", type: "success" },
    });
  },

  startStormSequence: () => {
    const s = get();
    if (stormInterval) {
      clearInterval(stormInterval);
      stormInterval = null;
    }
    const resetStatuses: Record<ScenarioId, ScenarioStatus> = {
      ...s.scenarioStatuses,
      generator: "inactive",
      battery: "inactive",
      fuel: "inactive",
      blizzard: "inactive",
      extremeCold: "inactive",
      stormSequence: "active",
    };
    set({
      stormRunning: true,
      stormPaused: false,
      stormStep: 1,
      scenarioStatuses: resetStatuses,
      lastFeedbackMessage: { text: "Antarctic Storm Sequence initiated. Progressing through Stage 1 of 10.", type: "info" },
    });
    // Apply stage 1 immediately
    const stageInfo = STORM_STAGES[0];
    const newT = { ...get().telemetry, ...stageInfo.telemetryMod };
    const simTime = fmtTime(s.simHour) + " UTC";
    const impact: ScenarioImpact = {
      scenarioId: "stormSequence",
      scenarioName: "Antarctic Storm Sequence",
      triggeredAt: simTime,
      severity: "warning",
      summary: stageInfo.description,
      affectedAssets: stageInfo.assets,
      deltas: stageInfo.deltas,
      activeAlerts: stageInfo.alerts,
      automatedActions: stageInfo.actions,
    };
    const logEntry: ScenarioLogEntry = {
      id: `log-${Date.now()}-storm-1`,
      time: simTime,
      scenarioId: "stormSequence",
      scenarioName: "Antarctic Storm Sequence",
      action: "STAGE_1_START",
      severity: "warning",
      detail: stageInfo.title + ": " + stageInfo.description,
    };
    set((st) => ({
      telemetry: newT,
      weather: stageInfo.weather,
      activeScenarioImpact: impact,
      scenarioHistory: [logEntry, ...st.scenarioHistory].slice(0, 40),
    }));

    api.injectFault(s.stationId, "stormSequence").catch(() => {});

    stormInterval = setInterval(() => {
      const curr = get();
      if (!curr.stormRunning || curr.stormPaused) return;
      if (curr.stormStep >= 10) {
        if (stormInterval) clearInterval(stormInterval);
        stormInterval = null;
        set({
          stormRunning: false,
          stormPaused: false,
          scenarioStatuses: { ...get().scenarioStatuses, stormSequence: "completed" },
          lastFeedbackMessage: { text: "Antarctic Storm Sequence completed successfully.", type: "success" },
        });
        return;
      }
      curr.stepStormSequence();
    }, 4000);
  },

  pauseStormSequence: () => {
    set({
      stormPaused: true,
      lastFeedbackMessage: { text: `Storm Sequence paused at Stage ${get().stormStep} of 10.`, type: "info" },
    });
  },

  resumeStormSequence: () => {
    set({
      stormPaused: false,
      lastFeedbackMessage: { text: `Storm Sequence resumed from Stage ${get().stormStep} of 10.`, type: "info" },
    });
    if (!stormInterval) {
      stormInterval = setInterval(() => {
        const curr = get();
        if (!curr.stormRunning || curr.stormPaused) return;
        if (curr.stormStep >= 10) {
          if (stormInterval) clearInterval(stormInterval);
          stormInterval = null;
          set({
            stormRunning: false,
            stormPaused: false,
            scenarioStatuses: { ...get().scenarioStatuses, stormSequence: "completed" },
            lastFeedbackMessage: { text: "Antarctic Storm Sequence completed successfully.", type: "success" },
          });
          return;
        }
        curr.stepStormSequence();
      }, 4000);
    }
  },

  stepStormSequence: () => {
    const s = get();
    const nextStep = s.stormStep + 1;
    if (nextStep > 10) {
      if (stormInterval) {
        clearInterval(stormInterval);
        stormInterval = null;
      }
      set({
        stormRunning: false,
        stormPaused: false,
        scenarioStatuses: { ...s.scenarioStatuses, stormSequence: "completed" },
        lastFeedbackMessage: { text: "Antarctic Storm Sequence completed. Microgrid nominal.", type: "success" },
      });
      return;
    }

    const stageInfo = STORM_STAGES[nextStep - 1];
    const newT = { ...s.telemetry, ...stageInfo.telemetryMod };
    const simTime = fmtTime(s.simHour) + " UTC";
    const impact: ScenarioImpact = {
      scenarioId: "stormSequence",
      scenarioName: `Antarctic Storm Sequence (${stageInfo.title})`,
      triggeredAt: simTime,
      severity: nextStep >= 5 && nextStep <= 8 ? "critical" : nextStep >= 3 ? "warning" : "info",
      summary: stageInfo.description,
      affectedAssets: stageInfo.assets,
      deltas: stageInfo.deltas,
      activeAlerts: stageInfo.alerts,
      automatedActions: stageInfo.actions,
    };
    const logEntry: ScenarioLogEntry = {
      id: `log-${Date.now()}-storm-${nextStep}`,
      time: simTime,
      scenarioId: "stormSequence",
      scenarioName: "Antarctic Storm Sequence",
      action: `STAGE_${nextStep}`,
      severity: impact.severity,
      detail: stageInfo.title + ": " + stageInfo.description,
    };

    if (stageInfo.alerts.length > 0) {
      s.pushAlert({
        level: impact.severity === "critical" ? "critical" : "warning",
        title: stageInfo.title,
        detail: stageInfo.alerts[0],
        target: nextStep === 6 ? "power" : "weather",
      });
    }

    set((st) => ({
      stormStep: nextStep,
      telemetry: newT,
      weather: stageInfo.weather,
      scenarioStatuses: { ...st.scenarioStatuses, stormSequence: "active" },
      activeScenarioImpact: impact,
      scenarioHistory: [logEntry, ...st.scenarioHistory].slice(0, 40),
      lastFeedbackMessage: { text: `Advanced to ${stageInfo.title}`, type: "info" },
    }));
  },

  stopStormSequence: () => {
    if (stormInterval) {
      clearInterval(stormInterval);
      stormInterval = null;
    }
    set({
      stormRunning: false,
      stormPaused: false,
      scenarioStatuses: { ...get().scenarioStatuses, stormSequence: "inactive" },
      lastFeedbackMessage: { text: "Storm Sequence aborted.", type: "info" },
    });
  },

  startDemo: () => {
    get().resetAllScenarios();
    get().startStormSequence();
  },
  stopDemo: () => {
    get().stopStormSequence();
    get().resetAllScenarios();
  },
  advanceDemo: () => {
    get().stepStormSequence();
  },
  dismissAlert: (id) => {
    api.dismissAlert(id).catch(() => {});
    set((s) => ({
      alerts: s.alerts.filter((a) => a.id !== id),
    }));
  },
  executeAiAction: (action) => {
    const s = get();
    const cur = s.telemetry;
    const aLower = action.toLowerCase();
    if (aLower.includes("generator 2") || aLower.includes("gen 2")) {
      api.dispatchGenerator(s.stationId, "gen2", "start").catch(() => {});
      set({ telemetry: { ...cur, gen2: "online" } });
      s.pushAlert({ level: "info", title: "Action Executed: Generator 2 Started", detail: "Auxiliary alternator synchronized to microgrid.", target: "power" });
    } else if (aLower.includes("p3") || aLower.includes("non-critical") || aLower.includes("non-essential")) {
      api.setLoadShed(s.stationId, "P3", true).catch(() => {});
      set({ telemetry: { ...cur, shedP3: true } });
      s.pushAlert({ level: "warning", title: "Action Executed: P3 Loads Shed", detail: "Automated shedding activated for auxiliary loads.", target: "power" });
    } else if (aLower.includes("p2")) {
      api.setLoadShed(s.stationId, "P2", true).catch(() => {});
      set({ telemetry: { ...cur, shedP2: true } });
      s.pushAlert({ level: "warning", title: "Action Executed: P2 Loads Shed", detail: "Habitat thermal buffering activated.", target: "main" });
    } else if (aLower.includes("power house") || aLower.includes("maintenance")) {
      s.focusOn("power");
    } else if (aLower.includes("battery") || aLower.includes("charge")) {
      set({ telemetry: { ...cur, batterySoc: Math.min(92, cur.batterySoc + 12), batteryKw: 80 } });
      s.pushAlert({ level: "info", title: "Action Executed: Battery Fast-Charge", detail: "BESS charge profile set to 92% buffer floor.", target: "power" });
    } else if (aLower.includes("heating") || aLower.includes("temperature")) {
      set({ telemetry: { ...cur, heatingKw: Math.max(160, cur.heatingKw * 0.9) } });
      s.pushAlert({ level: "info", title: "Action Executed: Heating Setpoint Optimized", detail: "HVAC thermal deadband expanded by 2°C.", target: "main" });
    } else {
      s.pushAlert({ level: "info", title: `Action Executed: ${action}`, detail: "Operational command registered in digital twin sequence." });
    }
  },
}));
