"""
NOVARA Alerts Router - Station Fault & Operational Alarms
Manages the lifecycle of critical alarms, katabatic wind warnings, and microgrid telemetry alerts.
"""
from typing import List, Optional
from fastapi import APIRouter, Query, Path, HTTPException
from backend.models.schemas import AlertSchema, AlertCreateIn, StandardResponse
from backend.services.simulation_manager import simulation_manager

router = APIRouter(prefix="/api/alerts", tags=["Alerts & Faults"])


@router.get("", response_model=List[AlertSchema])
def list_alerts(
    station_id: Optional[str] = Query(None, description="Filter by station ('maitri' or 'bharati')"),
    include_dismissed: bool = Query(False, description="Include dismissed/cleared alerts")
):
    """
    Retrieve active station alarms and operational notifications.
    """
    alerts = simulation_manager.get_alerts(station_id=station_id, include_dismissed=include_dismissed)
    return [AlertSchema(**a) for a in alerts]


@router.post("", response_model=AlertSchema)
def create_alert(body: AlertCreateIn):
    """
    Publish a new operational warning or notification into the station alert stream.
    """
    simulation_manager.push_alert(
        station_id=body.station_id,
        level=body.level,
        title=body.title,
        detail=body.detail,
        target=body.target
    )
    alerts = simulation_manager.get_alerts(station_id=body.station_id, include_dismissed=False)
    return AlertSchema(**alerts[0])


@router.post("/{alert_id}/dismiss", response_model=StandardResponse)
def dismiss_alert(
    alert_id: int = Path(..., description="Numeric alert identifier")
):
    """
    Acknowledge and dismiss an active alert banner.
    """
    simulation_manager.dismiss_alert(alert_id)
    return StandardResponse(
        success=True,
        message=f"Alert #{alert_id} dismissed.",
        data={"alert_id": alert_id, "dismissed": True}
    )


@router.post("/clear", response_model=StandardResponse)
def clear_all_alerts(
    station_id: Optional[str] = Query(None, description="Clear alerts for specific station or all")
):
    """
    Dismiss all active alerts across the station system.
    """
    simulation_manager.clear_alerts(station_id)
    return StandardResponse(
        success=True,
        message="All active alerts cleared.",
        data={"cleared": True}
    )
