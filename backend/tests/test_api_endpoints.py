"""
NOVARA Antarctic Digital Twin - Comprehensive Backend Test Suite
Tests all 8 modular FastAPI routers and database persistence.
"""
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_root_and_health():
    r = client.get("/")
    assert r.status_code == 200
    data = r.json()
    assert data["platform"] == "NOVARA | ANTARCTIC DIGITAL TWIN"
    assert data["mode"] == "SIMULATION MODE"

    r_h = client.get("/health")
    assert r_h.status_code == 200
    assert r_h.json()["status"] == "healthy"


def test_stations_endpoints():
    r = client.get("/api/stations")
    assert r.status_code == 200
    stations = r.json()
    assert len(stations) == 2
    ids = [s["id"] for s in stations]
    assert "maitri" in ids
    assert "bharati" in ids

    # Single station
    r_m = client.get("/api/stations/maitri")
    assert r_m.status_code == 200
    assert r_m.json()["name"] == "Maitri"

    # Buildings
    r_b = client.get("/api/stations/maitri/buildings")
    assert r_b.status_code == 200
    assert len(r_b.json()) >= 4

    # Assets
    r_a = client.get("/api/stations/maitri/assets")
    assert r_a.status_code == 200
    assert len(r_a.json()["data"]["assets"]) >= 5


def test_telemetry_endpoints():
    r = client.get("/api/telemetry/live?station_id=maitri")
    assert r.status_code == 200
    snap = r.json()
    assert snap["station_id"] == "maitri"
    assert snap["simulation_mode"] == "SIMULATION_MODE"
    assert snap["total_generation_kw"] > 0
    assert snap["total_load_kw"] > 0

    # History
    r_h = client.get("/api/telemetry/history?station_id=maitri&hours=24")
    assert r_h.status_code == 200
    hist = r_h.json()
    assert len(hist["points"]) == 24

    # Balance
    r_bal = client.get("/api/telemetry/balance?station_id=maitri")
    assert r_bal.status_code == 200
    assert "generation_breakdown" in r_bal.json()["data"]


def test_energy_dispatch_and_shedding():
    # Dispatch generator
    r_disp = client.post("/api/energy/dispatch", json={
        "station_id": "maitri",
        "generator": "gen2",
        "action": "start"
    })
    assert r_disp.status_code == 200
    assert r_disp.json()["data"]["gen2_status"] == "online"

    # Load shedding
    r_shed = client.post("/api/energy/shed", json={
        "station_id": "maitri",
        "priority": "P3",
        "shed": True
    })
    assert r_shed.status_code == 200
    assert r_shed.json()["data"]["shed_p3_aux"] is True


def test_environment_synoptic():
    r = client.get("/api/environment/synoptic?station_id=maitri")
    assert r.status_code == 200
    assert "temperature_c" in r.json()["data"]

    r_w = client.post("/api/environment/weather", json={
        "station_id": "maitri",
        "weather": "blizzard"
    })
    assert r_w.status_code == 200
    assert r_w.json()["data"]["weather_mode"] == "blizzard"

    r_f = client.get("/api/environment/forecast?station_id=maitri")
    assert r_f.status_code == 200


def test_logistics_endpoints():
    r = client.get("/api/logistics?station_id=maitri")
    assert r.status_code == 200
    assert len(r.json()["supplies"]) >= 4

    r_res = client.post("/api/logistics/resupply", json={
        "station_id": "maitri",
        "supply_name": "Fuel (ATF)",
        "added_pct": 10.0
    })
    assert r_res.status_code == 200


def test_alerts_lifecycle():
    r = client.get("/api/alerts?station_id=maitri")
    assert r.status_code == 200
    initial_count = len(r.json())

    # Create alert
    r_c = client.post("/api/alerts", json={
        "station_id": "maitri",
        "level": "warning",
        "title": "Katabatic Gust Surge",
        "detail": "Wind peak detected at 26.2 m/s."
    })
    assert r_c.status_code == 200
    alert_id = r_c.json()["id"]

    # Dismiss alert
    r_d = client.post(f"/api/alerts/{alert_id}/dismiss")
    assert r_d.status_code == 200


def test_simulation_controls():
    # Fault injection
    r_fault = client.post("/api/simulation/fault", json={
        "station_id": "maitri",
        "fault": "generator"
    })
    assert r_fault.status_code == 200
    assert r_fault.json()["data"]["gen1_status"] == "failed"

    # Scenarios list
    r_scen = client.get("/api/simulation/scenarios")
    assert r_scen.status_code == 200
    assert len(r_scen.json()) >= 3

    # Reset
    r_reset = client.post("/api/simulation/reset?station_id=maitri")
    assert r_reset.status_code == 200
    assert r_reset.json()["data"]["gen1_status"] == "online"

    # Time speed
    r_t = client.post("/api/simulation/time", json={
        "station_id": "maitri",
        "speed": 5
    })
    assert r_t.status_code == 200
    assert r_t.json()["data"]["speed"] == 5


def test_operator_settings():
    r = client.get("/api/settings")
    assert r.status_code == 200

    r_u = client.put("/api/settings", json={
        "operator_name": "Chief Scientist - Maitri",
        "active_station": "maitri",
        "audio_alerts": True,
        "alert_notifications": True,
        "theme_accent": "#009bb8",
        "default_time_speed": 1,
        "dashboard_auto_refresh_sec": 2,
        "safety_lockout_enabled": True
    })
    assert r_u.status_code == 200
    assert r_u.json()["operator_name"] == "Chief Scientist - Maitri"
