"""
NOVARA Station Router - Indian Antarctic Research Stations (Maitri & Bharati)
Provides station profiles, geometric footprints for 3D twin, subsystem capacities, and equipment assets.
"""
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Path
from backend.models.schemas import StationSchema, BuildingSchema, StandardResponse
from backend.services.simulation_manager import simulation_manager, STATION_CATALOG

router = APIRouter(prefix="/api/stations", tags=["Stations"])


@router.get("", response_model=List[StationSchema])
def list_stations():
    """Retrieve all operational Indian Antarctic stations (Maitri and Bharati) with technical specs."""
    return [StationSchema(**cfg) for cfg in simulation_manager.get_stations()]


@router.get("/{station_id}", response_model=StationSchema)
def get_station(
    station_id: str = Path(..., description="Station key: 'maitri' or 'bharati'")
):
    """Retrieve detailed station metadata, coordinates, and energy capacities."""
    station = simulation_manager.get_station(station_id)
    if not station:
        raise HTTPException(status_code=404, detail=f"Station '{station_id}' not found in registry.")
    return StationSchema(**station)


@router.get("/{station_id}/buildings", response_model=List[BuildingSchema])
def get_station_buildings(
    station_id: str = Path(..., description="Station key: 'maitri' or 'bharati'")
):
    """Retrieve 3D footprint coordinates, bounding dimensions, and statuses for station structures."""
    station = simulation_manager.get_station(station_id)
    if not station:
        raise HTTPException(status_code=404, detail=f"Station '{station_id}' not found.")
    return [BuildingSchema(**b) for b in station.get("buildings", [])]


@router.get("/{station_id}/assets", response_model=StandardResponse)
def get_station_assets(
    station_id: str = Path(..., description="Station key: 'maitri' or 'bharati'")
):
    """Retrieve equipment asset telemetry including solar arrays, wind turbines, and generators."""
    station = simulation_manager.get_station(station_id)
    if not station:
        raise HTTPException(status_code=404, detail=f"Station '{station_id}' not found.")
    
    # Representative equipment assets for Antarctic digital twin
    assets = [
        {"id": "GEN-01", "name": "Primary Diesel Alternator G1", "type": "generator", "capacity_kw": station.get("genset_1_max_kw", 300.0), "status": "ONLINE"},
        {"id": "GEN-02", "name": "Auxiliary Diesel Alternator G2", "type": "generator", "capacity_kw": station.get("genset_2_max_kw", 200.0), "status": "STANDBY"},
        {"id": "SOL-01", "name": "Bifacial Solar PV Array East", "type": "solar_pv", "capacity_kw": station.get("solar_capacity_kw", 60.0) / 2, "status": "OPERATIONAL"},
        {"id": "SOL-02", "name": "Bifacial Solar PV Array West", "type": "solar_pv", "capacity_kw": station.get("solar_capacity_kw", 60.0) / 2, "status": "OPERATIONAL"},
        {"id": "WND-01", "name": "Rugged Polar Wind Turbine WT-1", "type": "wind_turbine", "capacity_kw": station.get("wind_capacity_kw", 100.0), "status": "OPERATIONAL"},
        {"id": "BES-01", "name": "LiFePO4 BESS Battery Bank", "type": "battery", "capacity_kwh": station.get("battery_capacity_kwh", 400.0), "status": "ONLINE"},
        {"id": "COM-01", "name": "Satellite C-Band Telemetry Radome", "type": "comms", "status": "ONLINE"},
    ]
    return StandardResponse(
        success=True,
        message=f"Assets retrieved for {station['name']}",
        data={"station_id": station_id, "assets": assets}
    )
