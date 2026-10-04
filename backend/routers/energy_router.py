"""
NOVARA Energy Router - Microgrid Remote Control & Load Shedding
Allows mission operators to dispatch diesel alternators (G1, G2) and toggle priority circuit shedding (P2, P3).
"""
from fastapi import APIRouter, HTTPException
from backend.models.schemas import DispatchCommandIn, LoadShedCommandIn, StandardResponse
from backend.services.simulation_manager import simulation_manager

router = APIRouter(prefix="/api/energy", tags=["Energy Controls"])


@router.post("/dispatch", response_model=StandardResponse)
def dispatch_generator(cmd: DispatchCommandIn):
    """
    Start or stop station diesel generator (G1 or G2).
    Updates alternator synchronization status and recalculates generation dispatch.
    """
    simulation_manager.dispatch_generator(
        station_id=cmd.station_id,
        generator=cmd.generator,
        action=cmd.action
    )
    snap = simulation_manager.get_snapshot(cmd.station_id)
    return StandardResponse(
        success=True,
        message=f"{cmd.generator.upper()} {cmd.action.upper()} command executed successfully.",
        data={
            "station_id": cmd.station_id,
            "generator": cmd.generator,
            "action": cmd.action,
            "gen1_status": snap.gen1_status,
            "gen2_status": snap.gen2_status,
            "diesel_kw": snap.diesel_kw
        }
    )


@router.post("/shed", response_model=StandardResponse)
def set_load_shedding(cmd: LoadShedCommandIn):
    """
    Toggle load shedding for P2 (Habitat heating modulation) or P3 (Auxiliary non-critical circuits).
    """
    simulation_manager.set_load_shed(
        station_id=cmd.station_id,
        priority=cmd.priority,
        shed=cmd.shed
    )
    snap = simulation_manager.get_snapshot(cmd.station_id)
    return StandardResponse(
        success=True,
        message=f"Load shed circuit {cmd.priority} set to {'ACTIVE' if cmd.shed else 'RESTORED'}.",
        data={
            "station_id": cmd.station_id,
            "priority": cmd.priority,
            "shed": cmd.shed,
            "shed_p2_hab": snap.shed_p2_hab,
            "shed_p3_aux": snap.shed_p3_aux,
            "total_load_kw": snap.total_load_kw
        }
    )


@router.get("/status", response_model=StandardResponse)
def get_energy_status(station_id: str = "maitri"):
    """
    Retrieve summarized status of the microgrid generators, batteries, and fuel flow.
    """
    snap = simulation_manager.get_snapshot(station_id)
    return StandardResponse(
        success=True,
        message=f"Energy status for {station_id.upper()}",
        data={
            "station_id": station_id,
            "gen1_status": snap.gen1_status,
            "gen2_status": snap.gen2_status,
            "battery_soc_pct": snap.battery_soc_pct,
            "battery_health_pct": snap.battery_health_pct,
            "battery_online": snap.battery_online,
            "fuel_pct": snap.fuel_pct,
            "fuel_lph": snap.fuel_lph,
            "fuel_days_left": snap.fuel_days_left,
            "shed_p2_hab": snap.shed_p2_hab,
            "shed_p3_aux": snap.shed_p3_aux,
        }
    )
