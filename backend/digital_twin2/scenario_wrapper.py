"""
Digital twin scenario wrapper.

This is the single integration point: one config in, full pipeline runs,
one structured report out. Sizing sweeps, payback analysis, and failure
injection are all just DIFFERENT CONFIGS run through this SAME function --
not separate one-off scripts. This is what makes it a coherent "digital
twin" rather than a pile of disconnected analysis scripts.

Pipeline per scenario: ambient (fixed, reused) -> load (fixed, reused)
                        -> optimizer (config-dependent) -> fuel tracker
                        -> cost translation -> anomaly alerts -> report
"""
import copy
import pandas as pd

from optimization import dispatch_optimizer as dopt
from optimization.fuel_budget_tracker import tank_capacity_for_fuel_l, track_fuel_budget, summarize_risk
from optimization.cost_translation import translate
from optimization.anomaly_alerts import detect_anomalies, summarize_alerts


class ScenarioConfig:
    """
    A scenario = a specific system configuration to simulate.
    Defaults match the validated Checkpoint 3 configuration.
    """
    def __init__(self, name="baseline_config",
                 diesel_units=None,
                 wind_capacity_kw=None,
                 solar_capacity_kw=None,
                 battery_capacity_kwh=None,
                 failed_units=None):
        self.name = name
        self.diesel_units = diesel_units or copy.deepcopy(dopt.DIESEL_UNITS)
        self.wind_capacity_kw = wind_capacity_kw if wind_capacity_kw is not None else dopt.WIND_TURBINE_RATED_KW
        self.solar_capacity_kw = solar_capacity_kw if solar_capacity_kw is not None else dopt.SOLAR_CAPACITY_KW
        self.battery_capacity_kwh = battery_capacity_kwh if battery_capacity_kwh is not None else dopt.BATTERY_CAPACITY_KWH
        self.failed_units = failed_units or []  # list of genset names to force offline all year

        # Apply failures: zero out capacity for any failed unit (simulates it being
        # offline for maintenance/breakdown for the whole scenario period)
        if self.failed_units:
            adjusted = []
            for u in self.diesel_units:
                u = dict(u)
                if u["name"] in self.failed_units:
                    u["capacity_kw"] = 0.0
                adjusted.append(u)
            self.diesel_units = adjusted


def run_scenario(config: ScenarioConfig, load_df: pd.DataFrame, ambient_df: pd.DataFrame) -> dict:
    """Run the full pipeline for one scenario config and return a structured report."""
    # Apply this scenario's config to the optimizer module's globals
    # (module-level constants are how dispatch_optimizer.py reads its parameters)
    original_units = dopt.DIESEL_UNITS
    original_wind = dopt.WIND_TURBINE_RATED_KW
    original_solar = dopt.SOLAR_CAPACITY_KW
    original_battery = dopt.BATTERY_CAPACITY_KWH

    dopt.DIESEL_UNITS = config.diesel_units
    dopt.WIND_TURBINE_RATED_KW = config.wind_capacity_kw
    dopt.SOLAR_CAPACITY_KW = config.solar_capacity_kw
    dopt.BATTERY_CAPACITY_KWH = config.battery_capacity_kwh

    try:
        total_capacity = sum(u["capacity_kw"] for u in config.diesel_units) + dopt.BATTERY_MAX_DISCHARGE_KW
        peak_load = load_df["load_kw"].max()
        capacity_adequate = total_capacity >= peak_load

        if not capacity_adequate:
            # Honest failure mode: report it, don't silently fudge the run
            return {
                "scenario_name": config.name,
                "feasible": False,
                "reason": f"Total capacity {total_capacity:.0f}kW < peak load {peak_load:.0f}kW",
                "diesel_capacity_kw": sum(u["capacity_kw"] for u in config.diesel_units),
                "wind_capacity_kw": config.wind_capacity_kw,
                "solar_capacity_kw": config.solar_capacity_kw,
                "battery_capacity_kwh": config.battery_capacity_kwh,
            }

        dispatch = dopt.run_full_year(load_df)
        baseline = dopt.naive_baseline(load_df)

        opt_fuel = dispatch["fuel_l"].sum()
        base_fuel = baseline["fuel_l"].sum()
        litres_saved = base_fuel - opt_fuel
        savings_pct = 100 * litres_saved / base_fuel if base_fuel > 0 else 0

        cost_result = translate(litres_saved)

        recommended_tank = tank_capacity_for_fuel_l(opt_fuel)
        tracked = track_fuel_budget(dispatch, recommended_tank)
        fuel_summary = summarize_risk(tracked)

        anomaly_df = detect_anomalies(ambient_df, dispatch)
        alert_summary = summarize_alerts(anomaly_df)

        return {
            "scenario_name": config.name,
            "feasible": True,
            "diesel_capacity_kw": sum(u["capacity_kw"] for u in config.diesel_units),
            "wind_capacity_kw": config.wind_capacity_kw,
            "solar_capacity_kw": config.solar_capacity_kw,
            "battery_capacity_kwh": config.battery_capacity_kwh,
            "failed_units": config.failed_units,
            "annual_fuel_optimized_l": round(opt_fuel, 0),
            "annual_fuel_baseline_l": round(base_fuel, 0),
            "litres_saved": round(litres_saved, 0),
            "savings_pct": round(savings_pct, 1),
            "cost_saved_usd": cost_result["estimated_cost_saved_usd"],
            "co2_avoided_tonnes": cost_result["co2_avoided_tonnes"],
            "recommended_tank_l": round(recommended_tank, 0),
            "ran_out_before_resupply": fuel_summary["ran_out_before_resupply"],
            "pct_year_with_alert": alert_summary["pct_of_year_with_alert"],
        }
    finally:
        # Always restore original config, even if this scenario run raises --
        # prevents one bad scenario from corrupting subsequent runs
        dopt.DIESEL_UNITS = original_units
        dopt.WIND_TURBINE_RATED_KW = original_wind
        dopt.SOLAR_CAPACITY_KW = original_solar
        dopt.BATTERY_CAPACITY_KWH = original_battery


if __name__ == "__main__":
    load_df = pd.read_csv("/home/claude/polar-energy-system/data/processed/load_year.csv")
    ambient_df = pd.read_csv("/home/claude/polar-energy-system/data/raw/ambient_year.csv")

    # Smoke test: run the validated baseline config through the wrapper and
    # confirm it reproduces the SAME numbers as Checkpoint 3's direct run --
    # this proves the wrapper is a faithful integration, not a reimplementation
    # that silently drifts from the validated core.
    baseline_config = ScenarioConfig(name="validated_baseline")
    report = run_scenario(baseline_config, load_df, ambient_df)

    print("Scenario wrapper smoke test (should match Checkpoint 3 results):")
    for k, v in report.items():
        print(f"  {k}: {v}")

    expected_fuel = 352637  # from Checkpoint 3
    actual_fuel = report["annual_fuel_optimized_l"]
    diff_pct = abs(actual_fuel - expected_fuel) / expected_fuel * 100
    print(f"\nCross-check vs Checkpoint 3 (352,637 L): {actual_fuel:.0f} L "
          f"({diff_pct:.2f}% difference)")
    assert diff_pct < 1.0, "Wrapper result diverges from validated core result -- investigate!"
    print("PASS: wrapper reproduces validated core result within 1%.")
