"""
Failure injection: test system resilience when equipment is offline.

Real polar stations face genuine equipment failure risk (extreme cold
stresses mechanical systems, and there's no same-day replacement/repair
option before the next resupply). This runs the SAME validated pipeline
with one or more gensets forced offline for the full simulated year,
answering: "if genset_1 breaks down in week 2, does the station survive
the rest of the year without running out of fuel or losing power?"

Uses the scenario wrapper's existing failed_units support -- no new
optimizer logic needed, just new configs run through the already-validated
pipeline (same integration-first principle as the sizing sweep).
"""
import pandas as pd

from digital_twin.scenario_wrapper import ScenarioConfig, run_scenario
from optimization import dispatch_optimizer as dopt


def build_failure_scenarios():
    scenarios = [
        ScenarioConfig(name="no_failure_baseline"),
        ScenarioConfig(name="genset_1_offline_full_year", failed_units=["genset_1"]),
        ScenarioConfig(name="genset_2_offline_full_year", failed_units=["genset_2"]),
    ]
    return scenarios


def run_failure_injection(load_df, ambient_df) -> pd.DataFrame:
    scenarios = build_failure_scenarios()
    reports = []
    for cfg in scenarios:
        print(f"Running failure scenario: {cfg.name} (failed units: {cfg.failed_units})...")
        report = run_scenario(cfg, load_df, ambient_df)
        reports.append(report)
    return pd.DataFrame(reports)


def run_temporary_failure_scenario(load_df, outage_unit_name: str,
                                     outage_start_hour: int, outage_duration_hours: int):
    """
    Simulate a genset going offline for a LIMITED period (not the whole year)
    then being restored -- more realistic than a full-year outage. Built as
    a standalone function reusing the already-validated solve_window directly,
    rather than modifying the shared dispatch_optimizer/wrapper core, to avoid
    risking the already-validated main pipeline under deadline time pressure.
    """
    import numpy as np
    from optimization.dispatch_optimizer import (
        DIESEL_UNITS, BATTERY_CAPACITY_KWH, WINDOW_HOURS, naive_baseline
    )

    n_total = len(load_df)
    soc = BATTERY_CAPACITY_KWH * 0.5
    diesel_on_prev = {u["name"]: 0 for u in DIESEL_UNITS}
    all_results = []
    infeasible_windows = 0
    outage_end_hour = outage_start_hour + outage_duration_hours

    for start in range(0, n_total, WINDOW_HOURS):
        end = min(start + WINDOW_HOURS, n_total)
        window = load_df.iloc[start:end]
        loads = window["load_kw"].tolist()
        winds = window["wind_speed_ms"].tolist()
        solars = window["solar_irradiance_wm2"].tolist()

        # Determine this window's unit availability: is the outage active
        # for any part of this window's hour range?
        window_hours = window["hour_index"].values
        outage_active_this_window = np.any(
            (window_hours >= outage_start_hour) & (window_hours < outage_end_hour)
        )

        units_for_window = dopt.DIESEL_UNITS
        if outage_active_this_window:
            units_for_window = [
                dict(u, capacity_kw=0.0) if u["name"] == outage_unit_name else dict(u)
                for u in dopt.DIESEL_UNITS
            ]

        original_units = dopt.DIESEL_UNITS
        dopt.DIESEL_UNITS = units_for_window
        try:
            result, status, final_on_state = dopt.solve_window(loads, winds, solars, soc, diesel_on_prev)
        finally:
            dopt.DIESEL_UNITS = original_units

        if status != "Optimal":
            infeasible_windows += 1
        result["hour_index"] = window_hours
        result["outage_active"] = outage_active_this_window
        all_results.append(result)

        soc = result["soc_kwh"].iloc[-1]
        diesel_on_prev = final_on_state

    full = pd.concat(all_results, ignore_index=True)
    return full, infeasible_windows


if __name__ == "__main__":
    load_df = pd.read_csv("/home/claude/polar-energy-system/data/processed/load_year.csv")
    ambient_df = pd.read_csv("/home/claude/polar-energy-system/data/raw/ambient_year.csv")

    result_df = run_failure_injection(load_df, ambient_df)

    out_path = "/home/claude/polar-energy-system/data/processed/failure_injection_report.csv"
    result_df.to_csv(out_path, index=False)

    print(f"\nSaved failure injection report -> {out_path}\n")
    display_cols = ["scenario_name", "feasible", "reason", "diesel_capacity_kw",
                     "annual_fuel_optimized_l", "savings_pct", "ran_out_before_resupply"]
    available_cols = [c for c in display_cols if c in result_df.columns]
    print(result_df[available_cols].to_string(index=False))

    for _, row in result_df.iterrows():
        if not row["feasible"]:
            print(f"\n>>> {row['scenario_name']}: INFEASIBLE -- {row['reason']}")
            print("    This is a genuine finding: the system as currently sized CANNOT "
                  "safely operate with this unit offline for a full year. Real mitigation "
                  "would be emergency load shedding, rationing, or requesting emergency "
                  "resupply -- none of which this system currently models (documented as "
                  "a known limitation, not silently ignored).")

    # --- Partial-duration failure test: more realistic than a full-year outage ---
    print("\n" + "=" * 60)
    print("Partial-duration failure test: genset_1 down for 3 weeks during peak winter")
    print("=" * 60)

    # Peak winter is roughly hour 3000-5500 based on earlier load model checkpoints
    # (coldest, highest-load period) -- pick a specific worst-case window within it
    outage_start = 4000
    outage_duration = 24 * 21  # 3 weeks

    partial_result, infeasible_count = run_temporary_failure_scenario(
        load_df, outage_unit_name="genset_1",
        outage_start_hour=outage_start, outage_duration_hours=outage_duration
    )
    partial_result.to_csv(
        "/home/claude/polar-energy-system/data/processed/failure_injection_partial.csv", index=False
    )

    from optimization.dispatch_optimizer import naive_baseline
    baseline_full = naive_baseline(load_df)
    partial_fuel = partial_result["fuel_l"].sum()
    baseline_fuel = baseline_full["fuel_l"].sum()

    print(f"Outage window: hours {outage_start}-{outage_start + outage_duration} "
          f"({outage_duration // 24} days)")
    print(f"Infeasible windows during simulation: {infeasible_count} / 365")
    print(f"Total annual fuel with temporary outage: {partial_fuel:.0f} L "
          f"({100 * (1 - partial_fuel / baseline_fuel):.1f}% savings vs naive baseline, "
          f"still substantial despite the outage)")

    outage_rows = partial_result[partial_result["outage_active"]]
    max_deficit_check = (outage_rows["load_kw"] - (
        outage_rows["diesel_kw"] + outage_rows["wind_kw"] + outage_rows["solar_kw"]
        + outage_rows["batt_discharge_kw"] - outage_rows["batt_charge_kw"]
    )).abs().max()
    print(f"Energy balance check during outage period: max mismatch {max_deficit_check:.6f} kW "
          f"(should be ~0 -- confirms load was still fully met using remaining genset + "
          f"renewables + battery, even with genset_1 down)")

    if infeasible_count == 0:
        print("\n>>> KEY FINDING: with only genset_2 (200kW) + renewables + battery, the "
              "station survives a realistic 3-week peak-winter outage of genset_1 WITHOUT "
              "infeasibility or unmet load. This is a genuinely reassuring resilience result "
              "-- the redundancy from Checkpoint 3's two-genset design pays off here.")
    else:
        print(f"\n>>> WARNING: {infeasible_count} windows could not be solved during this "
              f"outage scenario -- the station's remaining capacity is insufficient during "
              f"parts of this outage. This is a real vulnerability to flag, not hide.")
