"""
NOVARA Antarctic Digital Twin - Pydantic Domain Schemas
Provides strict input validation, data models, and typed JSON responses
for stations, buildings, telemetry, energy microgrid, environment, logistics, alerts, and simulations.
"""
from typing import List, Optional, Literal, Dict, Any, Tuple
from pydantic import BaseModel, Field


# ---------------- Generic API Envelopes ----------------
class StandardResponse(BaseModel):
    success: bool = True
    message: str
    data: Optional[Dict[str, Any]] = None
    simulation_mode: str = "SIMULATION_MODE"


# ---------------- Station & Asset Schemas ----------------
class BuildingSchema(BaseModel):
    id: str
    name: str
    short: str
    position: List[float] = Field(..., description="[x, y, z] coordinate offset in meters")
    size: List[float] = Field(..., description="[width, height, depth] footprint in meters")
    color: str
    description: str
    category: Literal["infrastructure", "energy", "environment", "logistics"]
    nominal_load_kw: float = 35.0
    status: str = "OPERATIONAL"


class EquipmentAssetSchema(BaseModel):
    asset_id: str
    asset_type: Literal["solar_pv", "wind_turbine", "fuel_tank", "battery_bank", "comm_tower", "vehicle"]
    name: str
    position: List[float]
    specs: Dict[str, Any] = {}
    health_pct: float = 95.0
    status: str = "ONLINE"


class StationSchema(BaseModel):
    id: str = Field(..., description="Unique station key: 'maitri' or 'bharati'")
    name: str
    full_name: str
    organization: str = "MoES / NCPOR (Ministry of Earth Sciences, Govt. of India)"
    coordinates: str
    elevation: str
    established: int
    status: str = "OPERATIONAL"
    simulation_label: str = "SIMULATION MODE - REPRESENTATIVE GEOMETRY & TELEMETRY"
    base_load_kw: float
    peak_load_kw: float
    genset_1_max_kw: float
    genset_2_max_kw: float
    wind_capacity_kw: float
    solar_capacity_kw: float
    battery_capacity_kwh: float
    fuel_capacity_liters: float = 60000.0
    buildings: List[BuildingSchema] = []


# ---------------- Telemetry & Energy Schemas ----------------
class TelemetrySnapshot(BaseModel):
    station_id: str
    timestamp: str
    sim_hour: float
    sim_time_utc: str
    simulation_mode: str = "SIMULATION_MODE"
    data_quality: str = "SIMULATED_DETERMINISTIC"
    
    # Power & Loads (kW)
    solar_kw: float
    wind_kw: float
    diesel_kw: float
    battery_kw: float
    total_generation_kw: float
    total_load_kw: float
    net_power_balance_kw: float
    grid_frequency_hz: float = 50.02
    
    # Subsystem Loads (kW)
    heating_kw: float
    lab_kw: float
    accom_kw: float
    comms_kw: float
    other_kw: float
    
    # Battery BESS
    battery_soc_pct: float
    battery_health_pct: float
    battery_temp_c: float
    battery_cycles: int
    battery_online: bool
    
    # Fuel & Alternators
    fuel_pct: float
    fuel_days_left: float
    fuel_lph: float
    fuel_reserve_liters: float
    gen1_status: Literal["online", "standby", "failed"]
    gen2_status: Literal["online", "standby", "failed"]
    
    # Priority Circuit Load Shedding
    shed_p2_hab: bool = False
    shed_p3_aux: bool = False
    
    # Environmental Synoptics
    temperature_c: float
    wind_speed_ms: float
    wind_direction: str
    pressure_hpa: float
    visibility_km: float
    snowfall: str
    solar_irradiance_wm2: float
    weather_mode: Literal["clear", "cloudy", "snow", "blizzard", "extremeCold"]


class TelemetryHistoryPoint(BaseModel):
    t: str
    gen: float
    load: float
    solar: float = 0.0
    wind: float = 0.0
    diesel: float = 0.0


class EnergyHistoryResponse(BaseModel):
    station_id: str
    history_hours: int
    points: List[TelemetryHistoryPoint]
    fuel_history: List[Dict[str, Any]]


# ---------------- Dispatch & Control Commands ----------------
class DispatchCommandIn(BaseModel):
    station_id: str = "maitri"
    generator: Literal["gen1", "gen2"]
    action: Literal["start", "stop"]


class LoadShedCommandIn(BaseModel):
    station_id: str = "maitri"
    priority: Literal["P2", "P3"]
    shed: bool


# ---------------- Environment & Weather Schemas ----------------
class WeatherUpdateIn(BaseModel):
    station_id: str = "maitri"
    weather: Literal["clear", "cloudy", "snow", "blizzard", "extremeCold"]


# ---------------- Logistics Schemas ----------------
class LogisticsItemSchema(BaseModel):
    name: str
    pct: float
    rate: str
    days_left: float
    priority: Literal["P0", "P1", "P2", "P3"]
    category: str = "essential_consumable"


class LogisticsResponse(BaseModel):
    station_id: str
    supplies: List[LogisticsItemSchema]
    next_resupply_vessel: str = "MV Vasiliy Golovnin"
    resupply_eta_days: float = 11.0
    status: str = "NOMINAL_STOCKS"


class ResupplyEventIn(BaseModel):
    station_id: str = "maitri"
    supply_name: str
    added_pct: float


# ---------------- Alerts Lifecycle Schemas ----------------
class AlertSchema(BaseModel):
    id: int
    station_id: str = "maitri"
    level: Literal["critical", "warning", "notice", "info"]
    title: str
    detail: str
    time: str
    target: Optional[str] = None
    acknowledged: bool = False
    dismissed: bool = False
    created_at: Optional[str] = None


class AlertCreateIn(BaseModel):
    station_id: str = "maitri"
    level: Literal["critical", "warning", "notice", "info"]
    title: str
    detail: str
    target: Optional[str] = None


# ---------------- Simulation & Scenarios Schemas ----------------
class FaultInjectionIn(BaseModel):
    station_id: str = "maitri"
    fault: Literal["generator", "battery", "fuel", "blizzard", "extremeCold", "stormSequence"]



class TimeSpeedIn(BaseModel):
    station_id: str = "maitri"
    speed: Literal[0, 1, 5, 20]
    advance_hours: Optional[float] = None


class ScenarioPresetSchema(BaseModel):
    id: str
    title: str
    description: str
    severity: str
    duration_min: int


# ---------------- User & Operator Settings Schemas ----------------
class UserSettingsSchema(BaseModel):
    operator_name: str = "Station Polar Controller"
    active_station: Literal["maitri", "bharati"] = "maitri"
    audio_alerts: bool = True
    alert_notifications: bool = True
    theme_accent: str = "#009bb8"
    default_time_speed: int = 1
    dashboard_auto_refresh_sec: int = 2
    safety_lockout_enabled: bool = True
