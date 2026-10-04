# NOVARA | Antarctic Digital Twin - REST API Documentation

**Product:** NOVARA | Antarctic Digital Twin  
**Operational Context:** India's Antarctic Research Stations (Maitri & Bharati)  
**Stakeholders:** Ministry of Earth Sciences (MoES) / National Centre for Polar and Ocean Research (NCPOR)  
**Version:** 2.0.0  
**Base URL:** `http://localhost:8000` (or `http://127.0.0.1:8000`)  
**Interactive Docs:** `http://localhost:8000/docs` (Swagger UI) / `http://localhost:8000/redoc` (ReDoc)  

---

> [!IMPORTANT]
> **SIMULATION MODE DISCLAIMER**  
> All telemetry streams, microgrid physics, synoptic weather observations, and equipment responses are generated via deterministic simulation models. The platform **does not** claim live SCADA connectivity to physical sensors in Antarctica or real-time physical remote actuator control. All API endpoints clearly reflect this operating boundary.

---

## 1. System & Health

### `GET /`
Returns platform metadata, operational status, and active stations.

**Response (200 OK):**
```json
{
  "platform": "NOVARA | ANTARCTIC DIGITAL TWIN",
  "version": "2.0.0",
  "status": "ONLINE",
  "mode": "SIMULATION MODE",
  "organization": "Ministry of Earth Sciences (MoES) / NCPOR",
  "stations": ["maitri", "bharati"],
  "docs": "/docs",
  "timestamp": "2026-10-04T13:48:00Z"
}
```

### `GET /health` / `GET /api/health`
Health check endpoint for container orchestrators and monitoring probes.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "simulation_engine": "active",
  "database": "sqlite_wal_mode",
  "mode": "SIMULATION MODE"
}
```

---

## 2. Stations & Station Geometry

### `GET /api/stations`
Lists all operational Indian Antarctic research stations registered in the platform.

**Response (200 OK):**
```json
[
  {
    "id": "maitri",
    "name": "Maitri",
    "full_name": "Maitri Antarctic Research Station",
    "organization": "MoES / NCPOR (Ministry of Earth Sciences, Govt. of India)",
    "coordinates": "70°45'57\"S 11°44'09\"E",
    "elevation": "117 m ASL",
    "established": 1989,
    "status": "OPERATIONAL",
    "simulation_label": "SIMULATION MODE - REPRESENTATIVE GEOMETRY & TELEMETRY",
    "base_load_kw": 179.0,
    "peak_load_kw": 412.0,
    "genset_1_max_kw": 300.0,
    "genset_2_max_kw": 200.0,
    "wind_capacity_kw": 100.0,
    "solar_capacity_kw": 60.0,
    "battery_capacity_kwh": 400.0,
    "fuel_capacity_liters": 60000.0,
    "buildings": [...]
  },
  {
    "id": "bharati",
    "name": "Bharati",
    "full_name": "Bharati Antarctic Research Station",
    ...
  }
]
```

### `GET /api/stations/{station_id}`
Returns technical configuration and capacities for a specific station (`maitri` or `bharati`).

### `GET /api/stations/{station_id}/buildings`
Returns 3D footprint bounding boxes, positions, categories, and load specifications for Three.js rendering.

---

## 3. Telemetry & Energy Balances

### `GET /api/telemetry/live?station_id=maitri`
Fetches real-time microgrid telemetry, renewable power, diesel output, battery state of charge (SoC), and synoptic weather.

**Query Parameters:**
- `station_id` (string, optional, default: `"maitri"`): Station identifier.

**Response (200 OK):**
```json
{
  "station_id": "maitri",
  "timestamp": "2026-10-04T13:48:12Z",
  "sim_hour": 18.25,
  "sim_time_utc": "18:15",
  "simulation_mode": "SIMULATION_MODE",
  "data_quality": "SIMULATED_DETERMINISTIC",
  "solar_kw": 22.8,
  "wind_kw": 89.2,
  "diesel_kw": 73.6,
  "battery_kw": 24.5,
  "total_generation_kw": 185.6,
  "total_load_kw": 161.1,
  "net_power_balance_kw": 24.5,
  "grid_frequency_hz": 50.02,
  "heating_kw": 62.4,
  "lab_kw": 45.0,
  "accom_kw": 42.0,
  "comms_kw": 18.0,
  "other_kw": 18.0,
  "battery_soc_pct": 78.4,
  "battery_health_pct": 94.0,
  "battery_temp_c": -12.1,
  "battery_cycles": 324,
  "battery_online": true,
  "fuel_pct": 67.8,
  "fuel_days_left": 14.1,
  "fuel_lph": 30.6,
  "fuel_reserve_liters": 40680.0,
  "gen1_status": "online",
  "gen2_status": "standby",
  "shed_p2_hab": false,
  "shed_p3_aux": false,
  "temperature_c": -18.4,
  "wind_speed_ms": 13.8,
  "wind_direction": "NW",
  "pressure_hpa": 982.1,
  "visibility_km": 8.4,
  "snowfall": "Light",
  "solar_irradiance_wm2": 310.2,
  "weather_mode": "snow"
}
```

### `GET /api/telemetry/history?station_id=maitri&hours=24`
Returns time-series historical points (up to 48 hours) for generation, load, renewables, diesel, and fuel depletion.

### `GET /api/telemetry/balance?station_id=maitri`
Returns instantaneous power balance breakdown and priority circuit states.

---

## 4. Energy Remote Controls

### `POST /api/energy/dispatch`
Remote-control command to start or stop diesel alternators (G1 or G2).

**Request Body:**
```json
{
  "station_id": "maitri",
  "generator": "gen2",
  "action": "start"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "GEN2 START command executed successfully.",
  "data": {
    "station_id": "maitri",
    "generator": "gen2",
    "action": "start",
    "gen1_status": "online",
    "gen2_status": "online",
    "diesel_kw": 110.0
  },
  "simulation_mode": "SIMULATION_MODE"
}
```

### `POST /api/energy/shed`
Activates or restores priority load shedding for habitat heating (P2) or auxiliary circuits (P3).

**Request Body:**
```json
{
  "station_id": "maitri",
  "priority": "P2",
  "shed": true
}
```

---

## 5. Environment & Meteorology

### `GET /api/environment/synoptic?station_id=maitri`
Returns Automatic Weather Station (AWS) synoptic observations.

### `POST /api/environment/weather`
Updates the simulated weather regime (`clear`, `cloudy`, `snow`, `blizzard`, `extremeCold`).

**Request Body:**
```json
{
  "station_id": "maitri",
  "weather": "blizzard"
}
```

---

## 6. Logistics & Consumables

### `GET /api/logistics?station_id=maitri`
Returns consumable inventory stocks, burn rates, days of autonomy, and resupply vessel timeline.

### `POST /api/logistics/resupply`
Simulates cargo delivery from expedition supply vessel.

---

## 7. Alerts & Alarms Lifecycle

### `GET /api/alerts?station_id=maitri`
Retrieves active alarms, warnings, and system notices.

### `POST /api/alerts`
Publishes a new operational alert.

### `POST /api/alerts/{alert_id}/dismiss`
Acknowledges and dismisses an alert.

### `POST /api/alerts/clear`
Clears all active alerts.

---

## 8. Simulation & Emergency Scenarios

### `POST /api/simulation/fault`
Injects simulated emergency faults: `generator`, `battery`, `fuel`, or `blizzard`.

### `POST /api/simulation/reset`
Restores all microgrid subsystems to nominal operational conditions.

### `POST /api/simulation/time`
Controls simulation clock multiplier (0x paused, 1x realtime, 5x, 20x) or steps forward.

### `GET /api/simulation/scenarios`
Lists pre-configured emergency training scenarios.
