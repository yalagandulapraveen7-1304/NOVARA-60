"""
NOVARA Antarctic Digital Twin - Core Simulation & Physics Service
Maintains stateful microgrid simulation, electro-thermal balances,
synoptic AWS meteorology, consumable inventories, and persistent SQLite storage.
"""
import math
import random
import time
import threading
from typing import Dict, Any, List, Optional
from backend.models.schemas import (
    TelemetrySnapshot,
    TelemetryHistoryPoint,
    EnergyHistoryResponse,
    LogisticsItemSchema,
    LogisticsResponse,
    AlertSchema,
    StationSchema,
    BuildingSchema,
    UserSettingsSchema,
)
from backend.database.service import db_service

def clamp(val: float, min_val: float, max_val: float) -> float:
    return max(min_val, min(max_val, val))

def fmt_time(h: float) -> str:
    hh = int(h) % 24
    mm = int((h % 1) * 60)
    return f"{hh:02d}:{mm:02d}"

# Station Static Data
STATION_CATALOG: Dict[str, Dict[str, Any]] = {
    "maitri": {
        "id": "maitri",
        "name": "Maitri",
        "full_name": "Maitri Antarctic Research Station",
        "coordinates": "70°45'57\"S 11°44'09\"E",
        "elevation": "117 m ASL",
        "established": 1989,
        "base_load_kw": 179.0,
        "peak_load_kw": 412.0,
        "genset_1_max_kw": 300.0,
        "genset_2_max_kw": 200.0,
        "wind_capacity_kw": 100.0,
        "solar_capacity_kw": 60.0,
        "battery_capacity_kwh": 400.0,
        "fuel_capacity_liters": 60000.0,
        "buildings": [
            {
                "id": "main",
                "name": "Main Station Complex",
                "short": "MAIN",
                "position": [0.0, 0.0, 0.0],
                "size": [26.0, 6.0, 12.0],
                "color": "#c8d4dd",
                "description": "Primary insulated habitat: accommodation, laboratories, control room, medical room, kitchen.",
                "category": "infrastructure",
                "nominal_load_kw": 90.0,
            },
            {
                "id": "power",
                "name": "Power House",
                "short": "PWR",
                "position": [-24.0, 0.0, 8.0],
                "size": [12.0, 5.0, 9.0],
                "color": "#b8c4ce",
                "description": "Diesel generators G1 & G2, electrical distribution, battery bank, inverters and control panels.",
                "category": "energy",
                "nominal_load_kw": 45.0,
            },
            {
                "id": "workshop",
                "name": "Workshop",
                "short": "WKS",
                "position": [18.0, 0.0, 12.0],
                "size": [10.0, 4.5, 8.0],
                "color": "#aeb9c4",
                "description": "Maintenance machinery, mechanical tools, spare parts depot.",
                "category": "infrastructure",
                "nominal_load_kw": 25.0,
            },
            {
                "id": "storage",
                "name": "Storage & Logistics",
                "short": "LOG",
                "position": [16.0, 0.0, -12.0],
                "size": [12.0, 5.0, 9.0],
                "color": "#c2ccd6",
                "description": "Food rations, ATF fuel tanks, survival gear and scientific expeditions.",
                "category": "logistics",
                "nominal_load_kw": 15.0,
            },
            {
                "id": "comms",
                "name": "Communication Facility",
                "short": "COM",
                "position": [-16.0, 0.0, -14.0],
                "size": [7.0, 4.0, 6.0],
                "color": "#b4c0cb",
                "description": "Satellite communication terminal, INMARSAT uplink, radar telemetry.",
                "category": "infrastructure",
                "nominal_load_kw": 40.0,
            },
            {
                "id": "weather",
                "name": "Weather Monitoring Mast",
                "short": "MET",
                "position": [30.0, 0.0, 2.0],
                "size": [4.0, 3.0, 4.0],
                "color": "#cfd8e0",
                "description": "Synoptic automated weather station: ambient temp, wind anemometer, solar radiation.",
                "category": "environment",
                "nominal_load_kw": 10.0,
            },
            {
                "id": "vehicles",
                "name": "Vehicle Depot",
                "short": "VEH",
                "position": [-6.0, 0.0, 22.0],
                "size": [14.0, 5.0, 8.0],
                "color": "#b2beca",
                "description": "PistenBully tracked vehicles, snowmobiles, fueling station.",
                "category": "logistics",
                "nominal_load_kw": 20.0,
            },
        ],
    },
    "bharati": {
        "id": "bharati",
        "name": "Bharati",
        "full_name": "Bharati Antarctic Research Station",
        "coordinates": "69°24'28\"S 76°11'14\"E",
        "elevation": "35 m ASL",
        "established": 2012,
        "base_load_kw": 110.0,
        "peak_load_kw": 240.0,
        "genset_1_max_kw": 120.0,
        "genset_2_max_kw": 120.0,
        "wind_capacity_kw": 120.0,
        "solar_capacity_kw": 90.0,
        "battery_capacity_kwh": 350.0,
        "fuel_capacity_liters": 60000.0,
        "buildings": [
            {
                "id": "main",
                "name": "Bharati Central Block",
                "short": "BHARATI",
                "position": [0.0, 0.0, 0.0],
                "size": [34.0, 7.5, 14.0],
                "color": "#d5e0e8",
                "description": "Integrated 3-level containerized aerodynamic main habitat: residential quarters, control hub, labs.",
                "category": "infrastructure",
                "nominal_load_kw": 110.0,
            },
            {
                "id": "power",
                "name": "Energy Complex",
                "short": "PWR",
                "position": [-28.0, 0.0, -10.0],
                "size": [14.0, 5.5, 10.0],
                "color": "#bcc8d2",
                "description": "Cogeneration plant, high-efficiency diesel alternators, Li-ion battery bank.",
                "category": "energy",
                "nominal_load_kw": 50.0,
            },
            {
                "id": "comms",
                "name": "Radome Earth Station",
                "short": "RAD",
                "position": [22.0, 0.0, -16.0],
                "size": [8.0, 6.0, 8.0],
                "color": "#c6d0da",
                "description": "Direct satellite link receiving IRS Earth Observation spacecraft telemetry.",
                "category": "infrastructure",
                "nominal_load_kw": 45.0,
            },
            {
                "id": "weather",
                "name": "Ocean & Atmospheric Observatory",
                "short": "MET",
                "position": [26.0, 0.0, 14.0],
                "size": [6.0, 3.5, 5.0],
                "color": "#cfd8e0",
                "description": "Marine boundary layer sensors, katabatic wind lidar, albedo radiometer.",
                "category": "environment",
                "nominal_load_kw": 12.0,
            },
            {
                "id": "storage",
                "name": "Fuel Farm & Depot",
                "short": "DEPOT",
                "position": [-18.0, 0.0, 18.0],
                "size": [15.0, 5.0, 9.0],
                "color": "#c0c9d2",
                "description": "Double-walled fuel bladder storage, cryo-diesel pumps, bulk resupply stores.",
                "category": "logistics",
                "nominal_load_kw": 18.0,
            },
        ],
    },
}

class StationSimulationState:
    def __init__(self, station_id: str):
        self.station_id = station_id
        self.sim_hour = 12.0
        self.time_speed = 1.0
        self.weather_mode = "snow"
        
        # Telemetry variables
        self.temperature_c = -18.4
        self.wind_speed_ms = 13.7
        self.wind_direction = "NW"
        self.pressure_hpa = 982.0
        self.visibility_km = 8.4
        self.snowfall = "Light"
        self.solar_irradiance_wm2 = 310.0
        
        # Power & Microgrid
        self.solar_kw = 43.0
        self.wind_kw = 85.0
        self.diesel_kw = 65.0
        self.battery_kw = 0.0
        self.heating_kw = 65.0
        self.lab_kw = 45.0
        self.accom_kw = 42.0
        self.comms_kw = 18.0
        self.other_kw = 12.0
        
        # BESS Battery
        self.battery_soc_pct = 77.0
        self.battery_health_pct = 96.0
        self.battery_temp_c = 6.5
        self.battery_cycles = 328
        self.battery_online = True
        
        # Fuel & Generators
        self.fuel_pct = 68.0
        self.fuel_days_left = 14.2
        self.fuel_lph = 31.0
        self.fuel_reserve_liters = 40800.0
        self.gen1_status = "online"
        self.gen2_status = "standby"
        
        # Shedding
        self.shed_p2 = False
        self.shed_p3 = False
        
        # History buffers (48 points)
        self.history: List[Dict[str, Any]] = []
        self._init_history()
        
        # Supplies
        self.supplies = [
            {"name": "Fuel (ATF)", "pct": 68.0, "rate": "31 L/h", "days_left": 14.2, "priority": "P0", "category": "fuel"},
            {"name": "Food Rations", "pct": 82.0, "rate": "0.4%/day", "days_left": 205.0, "priority": "P0", "category": "food"},
            {"name": "Medical Supplies", "pct": 91.0, "rate": "0.1%/day", "days_left": 310.0, "priority": "P0", "category": "medical"},
            {"name": "Science Reagents", "pct": 63.0, "rate": "0.6%/day", "days_left": 105.0, "priority": "P2", "category": "science"},
            {"name": "Generator Spares", "pct": 54.0, "rate": "0.3%/day", "days_left": 180.0, "priority": "P1", "category": "spares"},
        ]

    def _init_history(self):
        now_h = self.sim_hour
        for i in range(24):
            past_h = (now_h - 24 + i) % 24
            self.history.append({
                "t": fmt_time(past_h),
                "gen": 193.0 + math.sin(i / 3.0) * 20.0,
                "load": 182.0 + math.cos(i / 4.0) * 15.0,
                "solar": max(0.0, 43.0 * math.sin((past_h / 24.0) * math.pi)),
                "wind": 85.0 + math.sin(i / 2.0) * 12.0,
                "diesel": 65.0,
                "fuel_level": clamp(68.0 + (24 - i) * 0.1, 10.0, 100.0)
            })

class PolarSimulationManager:
    """Thread-safe global manager holding simulated telemetry for all stations."""
    def __init__(self):
        self._lock = threading.RLock()
        self.states: Dict[str, StationSimulationState] = {
            "maitri": StationSimulationState("maitri"),
            "bharati": StationSimulationState("bharati"),
        }
        self.alerts_log: List[Dict[str, Any]] = [
            {
                "id": 1,
                "station_id": "maitri",
                "level": "info",
                "title": "Simulation Engine Online",
                "detail": "Deterministic polar electro-thermal models active. SCADA telemetry simulated.",
                "time": "12:16",
                "target": "power",
                "acknowledged": False,
                "dismissed": False,
            },
            {
                "id": 2,
                "station_id": "maitri",
                "level": "warning",
                "title": "Gale Velocity Warning",
                "detail": "Katabatic winds approaching 25 m/s threshold. Automatic turbine feathering on standby.",
                "time": "12:10",
                "target": "weather",
                "acknowledged": False,
                "dismissed": False,
            }
        ]
        self.user_settings = {
            "operator_name": "Antarctic Mission Controller",
            "active_station": "maitri",
            "audio_alerts": True,
            "alert_notifications": True,
            "theme_accent": "#009bb8",
            "default_time_speed": 1,
            "dashboard_auto_refresh_sec": 2,
            "safety_lockout_enabled": True
        }
        self.next_alert_id = 3

    def tick(self, station_id: str = "maitri"):
        with self._lock:
            s = self.states.get(station_id.lower(), self.states["maitri"])
            if s.time_speed == 0:
                return
            
            # Step hour
            dt_h = (s.time_speed * 2.0) / 3600.0
            s.sim_hour = (s.sim_hour + dt_h) % 24.0
            
            # Sun angle factor (polar summer day model)
            day_factor = clamp(math.sin(((s.sim_hour - 4.0) / 20.0) * math.pi), 0.0, 1.0)
            weather_factors = {
                "clear": 1.0,
                "cloudy": 0.55,
                "snow": 0.40,
                "blizzard": 0.05,
                "extremeCold": 0.70
            }
            w_fac = weather_factors.get(s.weather_mode, 0.4)
            s.solar_irradiance_wm2 = clamp(620.0 * day_factor * w_fac + random.uniform(-5.0, 5.0), 0.0, 750.0)
            s.solar_kw = clamp(60.0 * day_factor * w_fac + random.uniform(-2.0, 2.0), 0.0, 75.0)
            
            # Wind generation
            wind_base = 130.0 if s.weather_mode == "blizzard" else (90.0 if s.weather_mode == "snow" else 65.0)
            s.wind_kw = clamp(wind_base + random.uniform(-5.0, 5.0), 0.0, 140.0)
            s.wind_speed_ms = clamp((22.0 if s.weather_mode == "blizzard" else 13.7) + random.uniform(-0.5, 0.5), 1.0, 35.0)
            
            # Heating demand scales with outside temp
            cold_surge = (-s.temperature_c - 10.0) * 1.5
            s.heating_kw = clamp(50.0 + cold_surge + random.uniform(-2.0, 2.0), 30.0, 160.0)
            s.accom_kw = 25.0 if s.shed_p2 else 42.0
            s.other_kw = 5.0 if s.shed_p3 else 18.0
            
            total_load = s.heating_kw + s.lab_kw + s.accom_kw + s.comms_kw + s.other_kw
            renewables = s.solar_kw + s.wind_kw
            
            # Diesel capacity
            gen_cap = (180.0 if s.gen1_status == "online" else 0.0) + (120.0 if s.gen2_status == "online" else 0.0)
            diesel_target = clamp(total_load - renewables, 0.0, gen_cap)
            s.diesel_kw = diesel_target
            
            # Battery flow
            net = renewables + s.diesel_kw - total_load
            if s.battery_online:
                s.battery_kw = clamp(net, -120.0, 120.0)
                s.battery_soc_pct = clamp(s.battery_soc_pct + (s.battery_kw / 400.0) * dt_h * 100.0, 5.0, 100.0)
            else:
                s.battery_kw = 0.0
            
            # Fuel burn rate
            s.fuel_lph = clamp(10.0 + s.diesel_kw * 0.28, 5.0, 60.0)
            s.fuel_pct = clamp(s.fuel_pct - (s.fuel_lph / s.fuel_reserve_liters) * dt_h * 100.0, 0.0, 100.0)
            s.fuel_days_left = clamp((s.fuel_pct * 600.0) / max(s.fuel_lph, 1.0) / 24.0, 0.1, 60.0)
            
            # Append history buffer
            if len(s.history) > 48:
                s.history.pop(0)
            s.history.append({
                "t": fmt_time(s.sim_hour),
                "gen": round(renewables + s.diesel_kw, 1),
                "load": round(total_load, 1),
                "solar": round(s.solar_kw, 1),
                "wind": round(s.wind_kw, 1),
                "diesel": round(s.diesel_kw, 1),
                "fuel_level": round(s.fuel_pct, 1)
            })

    def get_snapshot(self, station_id: str = "maitri") -> TelemetrySnapshot:
        with self._lock:
            self.tick(station_id)
            s = self.states.get(station_id.lower(), self.states["maitri"])
            total_gen = s.solar_kw + s.wind_kw + s.diesel_kw
            total_load = s.heating_kw + s.lab_kw + s.accom_kw + s.comms_kw + s.other_kw
            net_bal = total_gen - total_load
            
            return TelemetrySnapshot(
                station_id=s.station_id,
                timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                sim_hour=round(s.sim_hour, 2),
                sim_time_utc=fmt_time(s.sim_hour),
                solar_kw=round(s.solar_kw, 1),
                wind_kw=round(s.wind_kw, 1),
                diesel_kw=round(s.diesel_kw, 1),
                battery_kw=round(s.battery_kw, 1),
                total_generation_kw=round(total_gen, 1),
                total_load_kw=round(total_load, 1),
                net_power_balance_kw=round(net_bal, 1),
                grid_frequency_hz=50.02,
                heating_kw=round(s.heating_kw, 1),
                lab_kw=round(s.lab_kw, 1),
                accom_kw=round(s.accom_kw, 1),
                comms_kw=round(s.comms_kw, 1),
                other_kw=round(s.other_kw, 1),
                battery_soc_pct=round(s.battery_soc_pct, 1),
                battery_health_pct=s.battery_health_pct,
                battery_temp_c=round(s.battery_temp_c, 1),
                battery_cycles=s.battery_cycles,
                battery_online=s.battery_online,
                fuel_pct=round(s.fuel_pct, 1),
                fuel_days_left=round(s.fuel_days_left, 1),
                fuel_lph=round(s.fuel_lph, 1),
                fuel_reserve_liters=round((s.fuel_pct / 100.0) * s.fuel_reserve_liters, 1),
                gen1_status=s.gen1_status,
                gen2_status=s.gen2_status,
                shed_p2_hab=s.shed_p2,
                shed_p3_aux=s.shed_p3,
                temperature_c=round(s.temperature_c, 1),
                wind_speed_ms=round(s.wind_speed_ms, 1),
                wind_direction=s.wind_direction,
                pressure_hpa=round(s.pressure_hpa, 1),
                visibility_km=round(s.visibility_km, 1),
                snowfall=s.snowfall,
                solar_irradiance_wm2=round(s.solar_irradiance_wm2, 1),
                weather_mode=s.weather_mode,
            )

    def dispatch_generator(self, station_id: str, generator: str, action: str):
        with self._lock:
            s = self.states.get(station_id.lower(), self.states["maitri"])
            status = "online" if action == "start" else "standby"
            if generator == "gen1":
                s.gen1_status = status
            else:
                s.gen2_status = status
            
            self.push_alert(
                station_id=station_id,
                level="info",
                title=f"{generator.upper()} → {status.upper()}",
                detail=f"Generator state switched via remote control API command.",
                target="power"
            )

    def set_load_shed(self, station_id: str, priority: str, shed: bool):
        with self._lock:
            s = self.states.get(station_id.lower(), self.states["maitri"])
            if priority == "P3":
                s.shed_p3 = shed
            elif priority == "P2":
                s.shed_p2 = shed
            
            self.push_alert(
                station_id=station_id,
                level="warning" if shed else "info",
                title=f"Load Shedding: {priority} {'ACTIVATED' if shed else 'RESTORED'}",
                detail=f"{priority} non-essential circuits {'disconnected to conserve reserve' if shed else 're-energized'}.",
                target="power"
            )

    def update_weather(self, station_id: str, weather: str):
        with self._lock:
            s = self.states.get(station_id.lower(), self.states["maitri"])
            s.weather_mode = weather
            presets = {
                "clear": {"temp": -14.0, "wind": 10.0, "vis": 25.0, "snow": "None"},
                "cloudy": {"temp": -16.0, "wind": 14.0, "vis": 12.0, "snow": "None"},
                "snow": {"temp": -18.4, "wind": 13.7, "vis": 8.4, "snow": "Light"},
                "blizzard": {"temp": -26.0, "wind": 28.5, "vis": 0.6, "snow": "Heavy"},
                "extremeCold": {"temp": -41.0, "wind": 12.0, "vis": 15.0, "snow": "None"},
            }
            p = presets.get(weather, presets["snow"])
            s.temperature_c = p["temp"]
            s.wind_speed_ms = p["wind"]
            s.visibility_km = p["vis"]
            s.snowfall = p["snow"]

    def inject_fault(self, station_id: str, fault: str):
        with self._lock:
            s = self.states.get(station_id.lower(), self.states["maitri"])
            if fault == "generator":
                s.gen1_status = "failed"
                s.gen2_status = "online"
                self.push_alert(
                    station_id=station_id,
                    level="critical",
                    title="Generator 1 EMERGENCY TRIP",
                    detail="Primary diesel alternator tripped offline. BESS discharge compensating. Auxiliary G2 synchronized.",
                    target="power"
                )
            elif fault == "battery":
                s.battery_online = False
                s.battery_kw = 0.0
                self.push_alert(
                    station_id=station_id,
                    level="critical",
                    title="BESS Battery Bank Offline",
                    detail="Battery inverter protection triggered. Microgrid frequency buffering transferred to diesel gen-sets.",
                    target="power"
                )
            elif fault == "fuel":
                s.fuel_pct = 9.0
                s.fuel_days_left = 1.8
                self.push_alert(
                    station_id=station_id,
                    level="warning",
                    title="Fuel Level < 10% Reserve Floor",
                    detail="Station fuel stocks low. Load shedding protocol recommended.",
                    target="storage"
                )
            elif fault == "blizzard":
                self.update_weather(station_id, "blizzard")
                self.push_alert(
                    station_id=station_id,
                    level="critical",
                    title="Severe Polar Blizzard Exceeded Limits",
                    detail="Gale velocity > 25 m/s. Wind turbine mechanical feathering active. Solar array covered.",
                    target="weather"
                )
            elif fault == "extremeCold":
                self.update_weather(station_id, "extremeCold")
                s.temperature_c = -41.0
                s.heating_kw = clamp(s.heating_kw + 45.0, 50.0, 200.0)
                self.push_alert(
                    station_id=station_id,
                    level="warning",
                    title="Extreme Polar Cold Contingency (-41°C)",
                    detail="Extreme cold surge detected. Habitat heating demand escalated; battery thermal buffer active.",
                    target="power"
                )

    def reset_faults(self, station_id: str):
        with self._lock:
            s = self.states.get(station_id.lower(), self.states["maitri"])
            s.gen1_status = "online"
            s.gen2_status = "standby"
            s.battery_online = True
            s.shed_p2 = False
            s.shed_p3 = False
            s.fuel_pct = 68.0
            s.fuel_days_left = 14.2
            s.weather_mode = "snow"
            self.update_weather(station_id, "snow")
            self.push_alert(
                station_id=station_id,
                level="info",
                title="Systems Restored to Nominal",
                detail="All simulated faults cleared. Primary subsystems operational.",
                target="power"
            )

    def push_alert(self, station_id: str, level: str, title: str, detail: str, target: Optional[str] = None):
        alert_obj = {
            "id": self.next_alert_id,
            "station_id": station_id.lower(),
            "level": level,
            "title": title,
            "detail": detail,
            "time": time.strftime("%H:%M", time.gmtime()),
            "target": target,
            "acknowledged": False,
            "dismissed": False,
        }
        self.next_alert_id += 1
        self.alerts_log.insert(0, alert_obj)
        if len(self.alerts_log) > 50:
            self.alerts_log.pop()

    def dismiss_alert(self, alert_id: int):
        with self._lock:
            for a in self.alerts_log:
                if a["id"] == alert_id:
                    a["dismissed"] = True
                    break

    def get_alerts(self, station_id: Optional[str] = None, include_dismissed: bool = False) -> List[Dict[str, Any]]:
        with self._lock:
            results = []
            for a in self.alerts_log:
                if not include_dismissed and a["dismissed"]:
                    continue
                if station_id and a["station_id"] != station_id.lower():
                    continue
                results.append(dict(a))
            return results

    def clear_alerts(self, station_id: Optional[str] = None):
        with self._lock:
            if station_id:
                for a in self.alerts_log:
                    if a["station_id"] == station_id.lower():
                        a["dismissed"] = True
            else:
                for a in self.alerts_log:
                    a["dismissed"] = True

    def get_stations(self) -> List[Dict[str, Any]]:
        return [dict(cfg) for cfg in STATION_CATALOG.values()]

    def get_station(self, station_id: str) -> Optional[Dict[str, Any]]:
        cfg = STATION_CATALOG.get(station_id.lower())
        return dict(cfg) if cfg else None

    def get_history(self, station_id: str = "maitri", history_hours: int = 24) -> Dict[str, Any]:
        with self._lock:
            s = self.states.get(station_id.lower(), self.states["maitri"])
            pts = s.history[-history_hours:] if history_hours > 0 else s.history
            return {
                "station_id": s.station_id,
                "history_hours": len(pts),
                "points": pts,
                "fuel_history": [
                    {"t": p["t"], "fuel_level": p.get("fuel_level", 68.0)} for p in pts
                ]
            }

    def get_logistics(self, station_id: str = "maitri") -> Dict[str, Any]:
        with self._lock:
            s = self.states.get(station_id.lower(), self.states["maitri"])
            return {
                "station_id": s.station_id,
                "supplies": [dict(item) for item in s.supplies],
                "next_resupply_vessel": "MV Vasiliy Golovnin (MoES Charter)",
                "resupply_eta_days": 11.4,
                "status": "NOMINAL_STOCKS"
            }

    def resupply(self, station_id: str, supply_name: str, added_pct: float) -> bool:
        with self._lock:
            s = self.states.get(station_id.lower(), self.states["maitri"])
            found = False
            for item in s.supplies:
                if item["name"].lower() == supply_name.lower():
                    item["pct"] = clamp(item["pct"] + added_pct, 0.0, 100.0)
                    found = True
                    break
            if found:
                self.push_alert(
                    station_id=station_id,
                    level="info",
                    title=f"Logistics Resupply: {supply_name}",
                    detail=f"Added +{added_pct:.1f}% to inventory stocks.",
                    target="storage"
                )
            return found

    def set_time_speed(self, station_id: str, speed: int, advance_hours: Optional[float] = None):
        with self._lock:
            s = self.states.get(station_id.lower(), self.states["maitri"])
            s.time_speed = speed
            if advance_hours:
                s.sim_hour = (s.sim_hour + advance_hours) % 24.0

    def get_settings(self) -> Dict[str, Any]:
        with self._lock:
            return dict(self.user_settings)

    def update_settings(self, new_settings: Dict[str, Any]) -> Dict[str, Any]:
        with self._lock:
            self.user_settings.update(new_settings)
            return dict(self.user_settings)


simulation_manager = PolarSimulationManager()

