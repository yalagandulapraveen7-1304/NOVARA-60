"""
NOVARA Simulation Router - Fault Injection & Scenario Presets
Enables operators and researchers to simulate microgrid equipment failures, polar storms, and time acceleration.
"""
from typing import List
from fastapi import APIRouter, HTTPException, Path
from backend.models.schemas import FaultInjectionIn, TimeSpeedIn, ScenarioPresetSchema, StandardResponse
from backend.services.simulation_manager import simulation_manager

router = APIRouter(prefix="/api/simulation", tags=["Simulation Engine"])

SCENARIOS: List[ScenarioPresetSchema] = [
    ScenarioPresetSchema(
        id="generator_trip",
        title="Primary Genset G1 Mechanical Trip",
        description="Simulates immediate diesel alternator trip. BESS battery discharges to maintain grid frequency.",
        severity="CRITICAL",
        duration_min=45
    ),
    ScenarioPresetSchema(
        id="polar_blizzard",
        title="Category 5 Polar Blizzard Strike",
        description="Katabatic winds exceed 28 m/s, zero visibility, solar panels occluded, heating demand surges.",
        severity="HIGH",
        duration_min=180
    ),
    ScenarioPresetSchema(
        id="battery_offline",
        title="BESS Subsystem Thermal Inverter Lockout",
        description="LiFePO4 battery protection relays trip offline, forcing all transients onto diesel gen-sets.",
        severity="WARNING",
        duration_min=60
    ),
    ScenarioPresetSchema(
        id="critical_fuel_depletion",
        title="Station Fuel Storage < 10% Depletion",
        description="Reserves drop to emergency levels, testing priority P2 & P3 load-shedding response protocols.",
        severity="CRITICAL",
        duration_min=120
    ),
]


@router.post("/fault", response_model=StandardResponse)
def inject_fault(body: FaultInjectionIn):
    """
    Inject simulated fault condition:
    - 'generator': Genset 1 trips offline, standby Genset 2 synchronizes
    - 'battery': BESS battery inverter disconnects
    - 'fuel': Fuel tank reserve drops to emergency 9%
    - 'blizzard': Severe storm mode active
    """
    simulation_manager.inject_fault(body.station_id, body.fault)
    snap = simulation_manager.get_snapshot(body.station_id)
    return StandardResponse(
        success=True,
        message=f"Fault '{body.fault}' successfully injected on {body.station_id.upper()}.",
        data={
            "station_id": body.station_id,
            "fault": body.fault,
            "gen1_status": snap.gen1_status,
            "gen2_status": snap.gen2_status,
            "battery_online": snap.battery_online,
            "fuel_pct": snap.fuel_pct,
            "weather_mode": snap.weather_mode
        }
    )


@router.post("/reset", response_model=StandardResponse)
def reset_simulation(station_id: str = "maitri"):
    """
    Restore simulated station systems to nominal operational baselines.
    """
    simulation_manager.reset_faults(station_id)
    snap = simulation_manager.get_snapshot(station_id)
    return StandardResponse(
        success=True,
        message=f"Simulation state reset to nominal for {station_id.upper()}.",
        data={
            "station_id": station_id,
            "gen1_status": snap.gen1_status,
            "gen2_status": snap.gen2_status,
            "battery_online": snap.battery_online,
            "fuel_pct": snap.fuel_pct,
            "weather_mode": snap.weather_mode
        }
    )


@router.post("/time", response_model=StandardResponse)
def set_time_speed(body: TimeSpeedIn):
    """
    Control simulation clock multiplier (0x = PAUSED, 1x = REALTIME, 5x, 20x) or step forward.
    """
    simulation_manager.set_time_speed(body.station_id, body.speed, body.advance_hours)
    snap = simulation_manager.get_snapshot(body.station_id)
    return StandardResponse(
        success=True,
        message=f"Time speed set to {body.speed}x for {body.station_id.upper()}.",
        data={
            "station_id": body.station_id,
            "speed": body.speed,
            "sim_hour": snap.sim_hour,
            "sim_time_utc": snap.sim_time_utc
        }
    )


@router.get("/scenarios", response_model=List[ScenarioPresetSchema])
def list_scenarios():
    """
    List available pre-configured emergency training scenarios.
    """
    return SCENARIOS


@router.post("/scenarios/{scenario_id}/apply", response_model=StandardResponse)
def apply_scenario(
    scenario_id: str = Path(..., description="Scenario ID"),
    station_id: str = "maitri"
):
    """
    Trigger a specific emergency training scenario preset.
    """
    mapping = {
        "generator_trip": "generator",
        "polar_blizzard": "blizzard",
        "battery_offline": "battery",
        "critical_fuel_depletion": "fuel",
    }
    fault = mapping.get(scenario_id)
    if not fault:
        raise HTTPException(status_code=404, detail=f"Scenario '{scenario_id}' not found.")
    
    simulation_manager.inject_fault(station_id, fault)
    return StandardResponse(
        success=True,
        message=f"Scenario '{scenario_id}' activated on {station_id.upper()}.",
        data={"scenario_id": scenario_id, "station_id": station_id}
    )
