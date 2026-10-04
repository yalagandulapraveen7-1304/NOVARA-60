"""
Payback period calculator.

Takes the sizing sweep's capital cost + annual savings per scenario and
computes: how many years until the upgrade pays for itself in fuel savings.

Uses SIMPLE payback (capital_cost / annual_savings), not discounted cash
flow -- appropriate here because this is a planning-stage estimate with
illustrative cost assumptions, not a financial audit. Stated explicitly
so the number isn't mistaken for more precision than it has.
"""
import pandas as pd

from optimization.cost_translation import EFFECTIVE_COST_PER_LITRE_USD


def compute_payback(sizing_df: pd.DataFrame, baseline_scenario_name: str = "current_baseline") -> pd.DataFrame:
    df = sizing_df.copy()
    df = df[df["feasible"]].reset_index(drop=True)

    baseline_row = df[df["scenario_name"] == baseline_scenario_name]
    if baseline_row.empty:
        raise ValueError(f"Baseline scenario '{baseline_scenario_name}' not found in sizing sweep results")
    baseline_fuel_l = baseline_row["annual_fuel_optimized_l"].iloc[0]
    baseline_capital_usd = baseline_row["capital_cost_usd"].iloc[0]

    df["incremental_capital_usd"] = df["capital_cost_usd"] - baseline_capital_usd
    df["incremental_fuel_saved_l"] = baseline_fuel_l - df["annual_fuel_optimized_l"]
    df["incremental_annual_savings_usd"] = df["incremental_fuel_saved_l"] * EFFECTIVE_COST_PER_LITRE_USD

    # Payback undefined/infinite if no incremental savings or negative (upgrade costs
    # money but doesn't save fuel, or even uses MORE fuel) -- report honestly, not as 0 or blank
    def payback_years(row):
        if row["scenario_name"] == baseline_scenario_name:
            return 0.0
        if row["incremental_annual_savings_usd"] <= 0:
            return float("inf")  # never pays back -- must be stated, not hidden
        if row["incremental_capital_usd"] <= 0:
            return 0.0  # cheaper AND better than baseline (e.g. removing unused capacity)
        return row["incremental_capital_usd"] / row["incremental_annual_savings_usd"]

    df["payback_years"] = df.apply(payback_years, axis=1)
    return df


if __name__ == "__main__":
    sizing_df = pd.read_csv("/home/claude/polar-energy-system/data/processed/sizing_sweep_report.csv")
    result = compute_payback(sizing_df)

    out_path = "/home/claude/polar-energy-system/data/processed/payback_report.csv"
    result.to_csv(out_path, index=False)

    print(f"Saved payback report -> {out_path}\n")
    display_cols = ["scenario_name", "incremental_capital_usd", "incremental_fuel_saved_l",
                     "incremental_annual_savings_usd", "payback_years"]
    print(result[display_cols].to_string(index=False))

    # Sanity check: current_baseline itself should show 0 incremental cost/payback
    baseline_row = result[result["scenario_name"] == "current_baseline"].iloc[0]
    assert baseline_row["payback_years"] == 0.0, "Baseline scenario should have 0 payback (it IS the baseline)"
    print("\nSanity check passed: baseline scenario correctly shows 0 incremental payback.")

    best = result[result["payback_years"] > 0].sort_values("payback_years").iloc[0]
    print(f"\nBest payback: '{best['scenario_name']}' pays back in "
          f"{best['payback_years']:.1f} years (${best['incremental_capital_usd']:,.0f} "
          f"upfront -> ${best['incremental_annual_savings_usd']:,.0f}/year saved)")
