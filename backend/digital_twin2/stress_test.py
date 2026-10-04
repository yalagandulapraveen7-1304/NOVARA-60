"""
Stress testing: run the validated system against WORSE than normal weather
to check it still holds up -- not just the average/expected year.

Reuses the same ambient generator with adjusted severity parameters, run
through the already-validated scenario wrapper -- no new optimizer logic.
"""
import numpy as np
import pandas as pd

from data.generate_ambient import generate_ambient_year, LATITUDE_DEG, RANDOM_SEED
from forecasting.load_model import compute_load
from digital_twin.scenario_wrapper import ScenarioConfig, run_scenario


def generate_stress_ambient(severity: str, seed: int = RANDOM_SEED) -> pd.DataFrame:
    """
    severity: 'normal', 'harsh_winter' (colder + windier), or 'extreme'
    (colder + windier + less solar, simulating a genuinely bad year)
    """
    df = generate_ambient_year(latitude_deg=LATITUDE_DEG, seed=seed)

    if severity == "normal":
        return df

    df = df.copy()
    if severity == "harsh_winter":
        # 5C colder average, 20% windier -- a genuinely bad but plausible winter
        df["temperature_c"] = df["temperature_c"] - 5.0
        df["wind_speed_ms"] = df["wind_speed_ms"] * 1.2
    elif severity == "extreme":
        # 8C colder, 35% windier, 15% less solar (more cloud cover) -- rare but possible
        df["temperature_c"] = df["temperature_c"] - 8.0
        df["wind_speed_ms"] = df["wind_speed_ms"] * 1.35
        df["solar_irradiance_wm2"] = df["solar_irradiance_wm2"] * 0.85
    else:
        raise ValueError(f"Unknown severity: {severity}")

    df["wind_speed_ms"] = df["wind_speed_ms"].clip(lower=0)
    df["solar_irradiance_wm2"] = df["solar_irradiance_wm2"].clip(lower=0)
    return df


def run_stress_test() -> pd.DataFrame:
    results = []
    for severity in ["normal", "harsh_winter", "extreme"]:
        print(f"Running stress test: {severity}...")
        ambient = generate_stress_ambient(severity)
        load_df = compute_load(ambient)

        cfg = ScenarioConfig(name=f"stress_{severity}")
        report = run_scenario(cfg, load_df, ambient)
        report["severity"] = severity
        report["peak_load_kw"] = load_df["load_kw"].max()
        report["min_temp_c"] = ambient["temperature_c"].min()
        report["max_wind_ms"] = ambient["wind_speed_ms"].max()
        results.append(report)

    return pd.DataFrame(results)


if __name__ == "__main__":
    result_df = run_stress_test()

    out_path = "/home/claude/polar-energy-system/data/processed/stress_test_report.csv"
    result_df.to_csv(out_path, index=False)

    print(f"\nSaved stress test report -> {out_path}\n")
    display_cols = ["severity", "feasible", "reason", "peak_load_kw", "min_temp_c",
                     "max_wind_ms", "annual_fuel_optimized_l", "savings_pct",
                     "ran_out_before_resupply"]
    available_cols = [c for c in display_cols if c in result_df.columns]
    print(result_df[available_cols].to_string(index=False))

    for _, row in result_df.iterrows():
        if not row["feasible"]:
            print(f"\n>>> STRESS FAILURE: '{row['severity']}' scenario is INFEASIBLE -- {row['reason']}")
            print("    The system as currently sized cannot safely handle this severity "
                  "of weather. This is a genuine capacity limit, documented honestly.")
        elif row.get("ran_out_before_resupply"):
            print(f"\n>>> STRESS WARNING: '{row['severity']}' scenario would run out of fuel "
                  "before resupply even with optimized dispatch.")
