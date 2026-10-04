"""
Live HTTP Verification Script for NOVARA Backend API
"""
import urllib.request
import json

base = "http://127.0.0.1:8000"

def req(path, method="GET", data=None):
    headers = {"Content-Type": "application/json"}
    body = json.dumps(data).encode("utf-8") if data else None
    r = urllib.request.Request(base + path, data=body, headers=headers, method=method)
    with urllib.request.urlopen(r) as resp:
        return json.loads(resp.read().decode("utf-8"))

def run_tests():
    # 1. Root & Health
    r1 = req("/")
    print("1. Root:", r1["platform"], "| Mode:", r1["mode"])
    r2 = req("/health")
    print("2. Health:", r2["status"], "| Engine:", r2["simulation_engine"])

    # 3. Stations
    stations = req("/api/stations")
    print("3. Stations:", [s["name"] for s in stations])

    # 4. Telemetry Live
    t = req("/api/telemetry/live?station_id=maitri")
    print(f"4. Live Telemetry: Solar={t['solar_kw']}kW, Wind={t['wind_kw']}kW, Load={t['total_load_kw']}kW")

    # 5. Dispatch Generator
    r5 = req("/api/energy/dispatch", "POST", {"station_id": "maitri", "generator": "gen2", "action": "start"})
    print("5. Energy Dispatch:", r5["message"])

    # 6. Load Shed
    r6 = req("/api/energy/shed", "POST", {"station_id": "maitri", "priority": "P2", "shed": True})
    print("6. Load Shedding:", r6["message"])

    # 7. Weather
    r7 = req("/api/environment/weather", "POST", {"station_id": "maitri", "weather": "blizzard"})
    print("7. Weather Mode:", r7["data"]["weather_mode"])

    # 8. Logistics
    r8 = req("/api/logistics?station_id=maitri")
    print("8. Logistics Supplies:", len(r8["supplies"]), "| Vessel:", r8["next_resupply_vessel"])

    # 9. Alerts
    r9 = req("/api/alerts?station_id=maitri")
    print("9. Active Alerts:", len(r9), "| Latest:", r9[0]["title"])

    # 10. Fault
    r10 = req("/api/simulation/fault", "POST", {"station_id": "maitri", "fault": "generator"})
    print("10. Fault Injected:", r10["message"])

    # 11. Reset
    r11 = req("/api/simulation/reset?station_id=maitri", "POST")
    print("11. Reset State:", r11["message"])

    # 12. Settings
    r12 = req("/api/settings")
    print("12. Operator:", r12["operator_name"])

    print("\n>>> ALL 12 LIVE HTTP ENDPOINTS VERIFIED WITH 100% SUCCESS! <<<")

if __name__ == "__main__":
    run_tests()
