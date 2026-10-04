/**
 * NOVARA | Antarctic Digital Twin - REST API Client
 * Connects frontend state and interactive controls to the FastAPI backend.
 * Provides resilient fallbacks if the backend server is unreachable.
 */

const rawApiUrl =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "http://localhost:8000";

const API_BASE_URL = rawApiUrl.replace(/\/$/, "");

export interface BackendStation {
  id: string;
  name: string;
  full_name: string;
  organization: string;
  coordinates: string;
  elevation: string;
  established: number;
  status: string;
  base_load_kw: number;
  peak_load_kw: number;
  genset_1_max_kw: number;
  genset_2_max_kw: number;
  wind_capacity_kw: number;
  solar_capacity_kw: number;
  battery_capacity_kwh: number;
  fuel_capacity_liters: number;
}

export interface BackendTelemetry {
  station_id: string;
  timestamp: string;
  sim_hour: number;
  sim_time_utc: string;
  simulation_mode: string;
  solar_kw: number;
  wind_kw: number;
  diesel_kw: number;
  battery_kw: number;
  total_generation_kw: number;
  total_load_kw: number;
  net_power_balance_kw: number;
  grid_frequency_hz: number;
  heating_kw: number;
  lab_kw: number;
  accom_kw: number;
  comms_kw: number;
  other_kw: number;
  battery_soc_pct: number;
  battery_health_pct: number;
  battery_temp_c: number;
  battery_cycles: number;
  battery_online: boolean;
  fuel_pct: number;
  fuel_days_left: number;
  fuel_lph: number;
  fuel_reserve_liters: number;
  gen1_status: "online" | "standby" | "failed";
  gen2_status: "online" | "standby" | "failed";
  shed_p2_hab: boolean;
  shed_p3_aux: boolean;
  temperature_c: number;
  wind_speed_ms: number;
  wind_direction: string;
  pressure_hpa: number;
  visibility_km: number;
  snowfall: string;
  solar_irradiance_wm2: number;
  weather_mode: string;
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
    if (!res.ok) {
      console.warn(`[NOVARA API] ${options.method || "GET"} ${endpoint} returned ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    // Graceful offline fallback
    return null;
  }
}

export const api = {
  /** Check backend health */
  async checkHealth(): Promise<boolean> {
    const res = await apiRequest<{ status: string }>("/health");
    return res?.status === "healthy";
  },

  /** Fetch all stations */
  async getStations(): Promise<BackendStation[] | null> {
    return apiRequest<BackendStation[]>("/api/stations");
  },

  /** Fetch live station telemetry snapshot */
  async getLiveTelemetry(stationId: string = "maitri"): Promise<BackendTelemetry | null> {
    return apiRequest<BackendTelemetry>(`/api/telemetry/live?station_id=${stationId}`);
  },

  /** Fetch historical generation & load curve */
  async getTelemetryHistory(stationId: string = "maitri", hours: number = 24) {
    return apiRequest<{
      station_id: string;
      history_hours: number;
      points: Array<{ t: string; gen: number; load: number; solar: number; wind: number; diesel: number }>;
      fuel_history: Array<{ t: string; fuel_level: number }>;
    }>(`/api/telemetry/history?station_id=${stationId}&hours=${hours}`);
  },

  /** Dispatch diesel generator */
  async dispatchGenerator(stationId: string, generator: "gen1" | "gen2", action: "start" | "stop") {
    return apiRequest("/api/energy/dispatch", {
      method: "POST",
      body: JSON.stringify({ station_id: stationId, generator, action }),
    });
  },

  /** Toggle load shedding on priority circuit */
  async setLoadShed(stationId: string, priority: "P2" | "P3", shed: boolean) {
    return apiRequest("/api/energy/shed", {
      method: "POST",
      body: JSON.stringify({ station_id: stationId, priority, shed }),
    });
  },

  /** Set synoptic weather preset */
  async setWeather(stationId: string, weather: string) {
    return apiRequest("/api/environment/weather", {
      method: "POST",
      body: JSON.stringify({ station_id: stationId, weather }),
    });
  },

  /** Fetch logistics & resupply stocks */
  async getLogistics(stationId: string = "maitri") {
    return apiRequest<{
      station_id: string;
      supplies: Array<{ name: string; pct: number; rate: string; days_left: number; priority: string }>;
      next_resupply_vessel: string;
      resupply_eta_days: number;
      status: string;
    }>(`/api/logistics?station_id=${stationId}`);
  },

  /** Fetch active alerts */
  async getAlerts(stationId?: string) {
    const q = stationId ? `?station_id=${stationId}` : "";
    return apiRequest<Array<{
      id: number;
      station_id: string;
      level: string;
      title: string;
      detail: string;
      time: string;
      target?: string;
      dismissed: boolean;
    }>>(`/api/alerts${q}`);
  },

  /** Dismiss an alert */
  async dismissAlert(alertId: number) {
    return apiRequest(`/api/alerts/${alertId}/dismiss`, { method: "POST" });
  },

  /** Clear all alerts */
  async clearAlerts(stationId?: string) {
    const q = stationId ? `?station_id=${stationId}` : "";
    return apiRequest(`/api/alerts/clear${q}`, { method: "POST" });
  },

  /** Inject simulated fault */
  async injectFault(stationId: string, fault: "generator" | "battery" | "fuel" | "blizzard" | "extremeCold" | "stormSequence") {
    return apiRequest("/api/simulation/fault", {
      method: "POST",
      body: JSON.stringify({ station_id: stationId, fault }),
    });
  },

  /** Reset simulation to nominal */
  async resetSimulation(stationId: string = "maitri") {
    return apiRequest(`/api/simulation/reset?station_id=${stationId}`, { method: "POST" });
  },

  /** Set simulation speed */
  async setTimeSpeed(stationId: string, speed: number, advanceHours?: number) {
    return apiRequest("/api/simulation/time", {
      method: "POST",
      body: JSON.stringify({ station_id: stationId, speed, advance_hours: advanceHours }),
    });
  },
};
