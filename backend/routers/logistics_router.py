"""
NOVARA Logistics Router - Polar Consumables & Resupply Projections
Tracks ATF polar fuel, food rations, medical stocks, and expedition resupply vessel timelines.
"""
from fastapi import APIRouter, Query, HTTPException
from backend.models.schemas import LogisticsResponse, ResupplyEventIn, StandardResponse
from backend.services.simulation_manager import simulation_manager

router = APIRouter(prefix="/api/logistics", tags=["Logistics & Supply"])


@router.get("", response_model=LogisticsResponse)
def get_logistics_status(
    station_id: str = Query("maitri", description="Station identifier ('maitri' or 'bharati')")
):
    """
    Retrieve consumable inventory levels, burn rates, and days of autonomy remaining.
    """
    data = simulation_manager.get_logistics(station_id)
    return LogisticsResponse(**data)


@router.post("/resupply", response_model=StandardResponse)
def trigger_resupply(body: ResupplyEventIn):
    """
    Log a simulated resupply shipment delivery to replenish consumable inventories.
    """
    success = simulation_manager.resupply(
        station_id=body.station_id,
        supply_name=body.supply_name,
        added_pct=body.added_pct
    )
    if not success:
        raise HTTPException(status_code=404, detail=f"Supply item '{body.supply_name}' not found.")
    
    return StandardResponse(
        success=True,
        message=f"Added +{body.added_pct:.1f}% to {body.supply_name}.",
        data={"station_id": body.station_id, "supply_name": body.supply_name, "added_pct": body.added_pct}
    )
