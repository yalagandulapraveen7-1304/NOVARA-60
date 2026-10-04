"""
NOVARA Settings Router - Mission Control Operator Preferences
Persists user interface preferences, notification triggers, theme settings, and active station.
"""
from fastapi import APIRouter
from backend.models.schemas import UserSettingsSchema, StandardResponse
from backend.services.simulation_manager import simulation_manager

router = APIRouter(prefix="/api/settings", tags=["Operator Settings"])


@router.get("", response_model=UserSettingsSchema)
def get_operator_settings():
    """
    Retrieve stored operator console settings and preferences.
    """
    return UserSettingsSchema(**simulation_manager.get_settings())


@router.put("", response_model=UserSettingsSchema)
def update_operator_settings(settings: UserSettingsSchema):
    """
    Update operator console settings (active station, theme accent, time speed, audio alerts).
    """
    updated = simulation_manager.update_settings(settings.model_dump())
    return UserSettingsSchema(**updated)
