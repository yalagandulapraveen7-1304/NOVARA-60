"""
Capacity sizing sweep: run multiple equipment configurations through the
scenario wrapper and export one combined comparison report (CSV).

Answers: "how much fuel/cost do we save per kW of added wind/solar, or per
kWh of added battery?" -- the investment-planning question, not just
"renewables help."
"""
import pandas as pd

from digital_twin.scenario_wrapper import ScenarioConfig, run_scenario
from optimization import dispatch_optimizer as dopt

# ---- Equipment cost assumptions (documented, adjustable) ----
# Illustrative capital cost figures for payback calculations later.
WIND_COST_PER_KW_USD = 3500
SOLAR_COST_PER_KW_USD = 1800
BATTERY_COST_PER_KWH_USD = 400


def build_sizing_scenarios():
    base_wind = dopt.WIND_TURBINE_RATED_KW
    base_solar = dopt.SOLAR_CAPACITY_KW
    base_battery = dopt.BATTERY_CAPACITY_KWH

    scenarios = [
        ScenarioConfig(name="current_baseline",
                        wind_capacity_kw=base_wind, solar_capacity_kw=base_solar,
                        battery_capacity_kwh=base_battery),
        ScenarioConfig(name="no_renewables_no_battery",
                        wind_capacity_kw=0, solar_capacity_kw=0, battery_capacity_kwh=0),
        ScenarioConfig(name="double_wind",
                        wind_capacity_kw=base_wind * 2, solar_capacity_kw=base_solar,
                        battery_capacity_kwh=base_battery),
        ScenarioConfig(name="double_solar",
                        wind_capacity_kw=base_wind, solar_capacity_kw=base_solar * 2,
                        battery_capacity_kwh=base_battery),
        ScenarioConfig(name="double_battery",
                        wind_capacity_kw=base_wind, solar_capacity_kw=base_solar,
                        battery_capacity_kwh=base_battery * 2),
        ScenarioConfig(name="double_all_renewables",
                        wind_capacity_kw=base_wind * 2, solar_capacity_kw=base_solar * 2,
                        battery_capacity_kwh=base_battery * 2),
        ScenarioConfig(name="half_battery",
                        wind_capacity_kw=base_wind, solar_capacity_kw=base_solar,
                        battery_capacity_kwh=base_battery * 0.5),
    ]
    return scenarios


def run_sizing_sweep(load_df, ambient_df) -> pd.DataFrame:
    scenarios = build_sizing_scenarios()
    reports = []
    for cfg in scenarios:
        print(f"Running scenario: {cfg.name} "
              f"(wind={cfg.wind_capacity_kw}kW, solar={cfg.solar_capacity_kw}kW, "
              f"battery={cfg.battery_capacity_kwh}kWh)...")
        report = run_scenario(cfg, load_df, ambient_df)
        reports.append(report)

    df = pd.DataFrame(reports)

    # Compute capital cost + simple marginal fuel-savings-per-dollar-invested,
    # relative to the current_baseline scenario, only for feasible rows.
    if "wind_capacity_kw" in df.columns:
        df["capital_cost_usd"] = (
            df["wind_capacity_kw"] * WIND_COST_PER_KW_USD +
            df["solar_capacity_kw"] * SOLAR_COST_PER_KW_USD +
            df["battery_capacity_kwh"] * BATTERY_COST_PER_KWH_USD
        )

    return df


if __name__ == "__main__":
    load_df = pd.read_csv("/home/claude/polar-energy-system/data/processed/load_year.csv")
    ambient_df = pd.read_csv("/home/claude/polar-energy-system/data/raw/ambient_year.csv")

    result_df = run_sizing_sweep(load_df, ambient_df)

    out_path = "/home/claude/polar-energy-system/data/processed/sizing_sweep_report.csv"
    result_df.to_csv(out_path, index=False)

    print(f"\nSaved sizing sweep report -> {out_path}\n")
    display_cols = ["scenario_name", "feasible", "wind_capacity_kw", "solar_capacity_kw",
                     "battery_capacity_kwh", "annual_fuel_optimized_l", "savings_pct",
                     "capital_cost_usd"]
    print(result_df[display_cols].to_string(index=False))
