"""
NOVARA Telemetry Router - Real-Time Microgrid & Environmental Telemetry
Delivers deterministic simulated sensor snapshots, 24h historical telemetry series, and electro-thermal balances.
"""
from typing import Optional
from fastapi import APIRouter, Query
from backend.models.schemas import TelemetrySnapshot, EnergyHistoryResponse, StandardResponse
from backend.services.simulation_manager import simulation_manager

router = APIRouter(prefix="/api/telemetry", tags=["Telemetry"])


@router.get("/live", response_model=TelemetrySnapshot)
def get_live_telemetry(
    station_id: str = Query("maitri", description="Station identifier ('maitri' or 'bharati')")
):
    """
    Retrieve real-time simulated telemetry snapshot for station microgrid,
    including renewables, diesel generation, battery state, heating loads, and synoptic weather.
    """
    return simulation_manager.get_snapshot(station_id)


@router.get("/history", response_model=EnergyHistoryResponse)
def get_telemetry_history(
    station_id: str = Query("maitri", description="Station identifier ('maitri' or 'bharati')"),
    hours: int = Query(24, ge=1, le=48, description="Number of past simulated hours to retrieve")
):
    """
    Retrieve historical generation vs load curve and fuel stock depletion points
    for chart rendering and predictive forecasting.
    """
    data = simulation_manager.get_history(station_id, hours)
    return EnergyHistoryResponse(
        station_id=data["station_id"],
        history_hours=data["history_hours"],
        points=data["points"],
        fuel_history=data["fuel_history"]
    )


@router.get("/balance", response_model=StandardResponse)
def get_energy_balance(
    station_id: str = Query("maitri", description="Station identifier ('maitri' or 'bharati')")
):
    """
    Retrieve instantaneous microgrid power balance breakdown: total generation, total load,
    net balance, and priority circuit allocations.
    """
    snap = simulation_manager.get_snapshot(station_id)
    return StandardResponse(
        success=True,
        message=f"Energy balance computed for {station_id.upper()}",
        data={
            "station_id": station_id,
            "total_generation_kw": snap.total_generation_kw,
            "total_load_kw": snap.total_load_kw,
            "net_power_balance_kw": snap.net_power_balance_kw,
            "grid_frequency_hz": snap.grid_frequency_hz,
            "generation_breakdown": {
                "solar_kw": snap.solar_kw,
                "wind_kw": snap.wind_kw,
                "diesel_kw": snap.diesel_kw,
                "battery_flow_kw": snap.battery_kw,
            },
            "load_breakdown": {
                "heating_kw": snap.heating_kw,
                "lab_kw": snap.lab_kw,
                "accom_kw": snap.accom_kw,
                "comms_kw": snap.comms_kw,
                "other_kw": snap.other_kw,
            },
            "priority_circuits": {
                "P1_life_support": True,
                "P2_habitat_heating": not snap.shed_p2_hab,
                "P3_auxiliary_systems": not snap.shed_p3_aux,
            }
        }
    )
