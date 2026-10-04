"""
NOVARA Environment Router - Antarctic Synoptic Meteorology & AWS Station
Provides automatic weather station (AWS) readings, weather presets, and environmental impact simulation.
"""
from fastapi import APIRouter, Query
from backend.models.schemas import WeatherUpdateIn, StandardResponse
from backend.services.simulation_manager import simulation_manager

router = APIRouter(prefix="/api/environment", tags=["Environment & Meteorology"])


@router.get("/synoptic", response_model=StandardResponse)
def get_synoptic_weather(
    station_id: str = Query("maitri", description="Station identifier ('maitri' or 'bharati')")
):
    """
    Retrieve real-time synoptic Automatic Weather Station (AWS) observations:
    air temperature, wind speed/direction, barometric pressure, horizontal visibility, and solar irradiance.
    """
    snap = simulation_manager.get_snapshot(station_id)
    return StandardResponse(
        success=True,
        message=f"Synoptic observations for {station_id.upper()}",
        data={
            "station_id": station_id,
            "weather_mode": snap.weather_mode,
            "temperature_c": snap.temperature_c,
            "wind_speed_ms": snap.wind_speed_ms,
            "wind_direction": snap.wind_direction,
            "pressure_hpa": snap.pressure_hpa,
            "visibility_km": snap.visibility_km,
            "snowfall": snap.snowfall,
            "solar_irradiance_wm2": snap.solar_irradiance_wm2,
            "chill_index": round(snap.temperature_c - (snap.wind_speed_ms * 0.7), 1),
        }
    )


@router.post("/weather", response_model=StandardResponse)
def set_weather_preset(body: WeatherUpdateIn):
    """
    Update the environmental simulation mode (clear, cloudy, snow, blizzard, extremeCold).
    Directly affects wind turbine generation, solar irradiance, and habitat heating power demand.
    """
    simulation_manager.update_weather(body.station_id, body.weather)
    snap = simulation_manager.get_snapshot(body.station_id)
    return StandardResponse(
        success=True,
        message=f"Environment updated to {body.weather.upper()} for {body.station_id.upper()}",
        data={
            "station_id": body.station_id,
            "weather_mode": snap.weather_mode,
            "temperature_c": snap.temperature_c,
            "wind_speed_ms": snap.wind_speed_ms,
            "visibility_km": snap.visibility_km,
            "heating_kw": snap.heating_kw,
            "solar_kw": snap.solar_kw,
            "wind_kw": snap.wind_kw,
        }
    )


@router.get("/forecast", response_model=StandardResponse)
def get_weather_forecast(
    station_id: str = Query("maitri", description="Station identifier ('maitri' or 'bharati')")
):
    """
    Retrieve simulated 48-hour polar weather forecast for mission planning.
    """
    forecast_days = [
        {"day": "Day 1 (Current)", "condition": "Blizzard Warning", "temp_high": -18.0, "temp_low": -28.0, "wind_max_ms": 28.0},
        {"day": "Day 2 (+24h)", "condition": "Overcast & Snow", "temp_high": -15.0, "temp_low": -22.0, "wind_max_ms": 16.0},
        {"day": "Day 3 (+48h)", "condition": "Polar Clear", "temp_high": -12.0, "temp_low": -19.0, "wind_max_ms": 9.0},
    ]
    return StandardResponse(
        success=True,
        message=f"48h Weather Forecast for {station_id.upper()}",
        data={"station_id": station_id, "forecast": forecast_days}
    )
