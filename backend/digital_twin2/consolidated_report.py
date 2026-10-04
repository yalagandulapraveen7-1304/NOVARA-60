"""
Consolidated report generator -- refactored to be a CALLABLE FUNCTION
(not just a script), so a future dashboard can trigger it directly after
any new simulation run, plus embeds charts for a clearer, more demo-ready
report.

Outputs a single self-contained HTML file (charts embedded as base64 --
no separate image files to lose track of, works offline, easy to download
or open in any browser).
"""
import base64
import io
from datetime import datetime

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd

BASE = "/home/claude/polar-energy-system/data/processed"
RAW = "/home/claude/polar-energy-system/data/raw"


def _fig_to_base64(fig) -> str:
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=110, bbox_inches="tight")
    plt.close(fig)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode("utf-8")


def _chart_fuel_comparison(opt_fuel, base_fuel) -> str:
    fig, ax = plt.subplots(figsize=(5, 4))
    bars = ax.bar(["Naive\nAlways-On Diesel", "AI-Optimized\nDispatch"],
                   [base_fuel, opt_fuel], color=["#c0392b", "#27ae60"])
    ax.set_ylabel("Annual fuel used (L)")
    ax.set_title("Fuel Use: Baseline vs Optimized")
    for b in bars:
        h = b.get_height()
        ax.annotate(f"{h:,.0f} L", (b.get_x() + b.get_width() / 2, h),
                    ha="center", va="bottom", fontsize=9)
    fig.tight_layout()
    return _fig_to_base64(fig)


def _chart_seasonal_load_and_dispatch(ambient_df, dispatch_df) -> str:
    df = dispatch_df.merge(ambient_df[["hour_index", "temperature_c"]], on="hour_index")
    daily = df.groupby(df["hour_index"] // 24).agg(
        load_kw=("load_kw", "mean"),
        diesel_kw=("diesel_kw", "mean"),
        wind_kw=("wind_kw", "mean"),
        solar_kw=("solar_kw", "mean"),
        temperature_c=("temperature_c", "mean"),
    ).reset_index(drop=True)

    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(8, 6), sharex=True)
    ax1.stackplot(daily.index, daily["diesel_kw"], daily["wind_kw"], daily["solar_kw"],
                   labels=["Diesel", "Wind", "Solar"],
                   colors=["#c0392b", "#2980b9", "#f39c12"], alpha=0.85)
    ax1.set_ylabel("Avg daily power (kW)")
    ax1.set_title("Daily Dispatch Mix Across the Year")
    ax1.legend(loc="upper right", fontsize=8)

    ax2.plot(daily.index, daily["temperature_c"], color="#34495e")
    ax2.axhline(0, color="gray", linewidth=0.5, linestyle="--")
    ax2.set_ylabel("Mean temp (°C)")
    ax2.set_xlabel("Day of year")
    ax2.set_title("Temperature (polar night = coldest, darkest stretch)")
    fig.tight_layout()
    return _fig_to_base64(fig)


def _chart_sizing_sweep(sizing_df) -> str:
    df = sizing_df[sizing_df["feasible"]].copy()
    fig, ax = plt.subplots(figsize=(7, 4))
    colors = ["#7f8c8d" if n == "current_baseline" else "#2980b9" for n in df["scenario_name"]]
    bars = ax.barh(df["scenario_name"], df["savings_pct"], color=colors)
    ax.set_xlabel("Fuel savings vs naive baseline (%)")
    ax.set_title("Fuel Savings by System Configuration")
    for b in bars:
        w = b.get_width()
        ax.annotate(f"{w:.1f}%", (w, b.get_y() + b.get_height() / 2),
                    va="center", ha="left", fontsize=8)
    fig.tight_layout()
    return _fig_to_base64(fig)


def _chart_payback(payback_df) -> str:
    df = payback_df[(payback_df["payback_years"] > 0) & (payback_df["payback_years"] < 50)].copy()
    df = df.sort_values("payback_years")
    fig, ax = plt.subplots(figsize=(6, 3.5))
    bars = ax.bar(df["scenario_name"], df["payback_years"], color="#16a085")
    ax.set_ylabel("Payback period (years)")
    ax.set_title("Investment Payback (capped at 50 yrs for readability)")
    plt.setp(ax.get_xticklabels(), rotation=25, ha="right", fontsize=8)
    for b in bars:
        h = b.get_height()
        ax.annotate(f"{h:.1f}y", (b.get_x() + b.get_width() / 2, h),
                    ha="center", va="bottom", fontsize=8)
    fig.tight_layout()
    return _fig_to_base64(fig)


def _chart_alerts_by_month(anomaly_df) -> str:
    df = anomaly_df.copy()
    df["month"] = (df["hour_index"] // (24 * 30)).clip(upper=11)
    monthly = df.groupby("month")["any_alert"].mean() * 100
    fig, ax = plt.subplots(figsize=(6, 3.5))
    ax.bar(monthly.index, monthly.values, color="#e67e22")
    ax.set_xlabel("Month (0 = start of year)")
    ax.set_ylabel("% of hours with an alert")
    ax.set_title("Operational Alerts by Month")
    fig.tight_layout()
    return _fig_to_base64(fig)


def generate_report(output_path: str = "/mnt/user-data/outputs/consolidated_report.html") -> str:
    """
    Callable entry point: regenerates the full consolidated HTML report from
    current checkpoint outputs on disk. Returns the output path.
    This is the function a future dashboard's "Export Report" button calls.
    """
    ambient = pd.read_csv(f"{RAW}/ambient_year.csv")
    opt = pd.read_csv(f"{BASE}/dispatch_optimized.csv")
    base = pd.read_csv(f"{BASE}/dispatch_baseline.csv")
    fuel_budget = pd.read_csv(f"{BASE}/fuel_budget_optimized.csv")
    anomalies = pd.read_csv(f"{BASE}/anomaly_alerts.csv")
    sizing = pd.read_csv(f"{BASE}/sizing_sweep_report.csv")
    payback = pd.read_csv(f"{BASE}/payback_report.csv")

    opt_fuel = opt["fuel_l"].sum()
    base_fuel = base["fuel_l"].sum()
    litres_saved = base_fuel - opt_fuel
    savings_pct = 100 * litres_saved / base_fuel
    cost_saved = litres_saved * 3.00
    co2_avoided_t = litres_saved * 2.68 / 1000
    alert_pct = 100 * anomalies["any_alert"].mean()
    worst = anomalies.loc[anomalies["num_concurrent_alerts"].idxmax()]
    best_payback = payback[payback["payback_years"] > 0].sort_values("payback_years").iloc[0]

    img_fuel = _chart_fuel_comparison(opt_fuel, base_fuel)
    img_dispatch = _chart_seasonal_load_and_dispatch(ambient, opt)
    img_sizing = _chart_sizing_sweep(sizing)
    img_payback = _chart_payback(payback)
    img_alerts = _chart_alerts_by_month(anomalies)

    sizing_rows = ""
    for _, row in sizing[sizing["feasible"]].iterrows():
        pb_row = payback[payback["scenario_name"] == row["scenario_name"]]
        pb = pb_row["payback_years"].iloc[0] if len(pb_row) else None
        pb_str = f"{pb:.1f} yrs" if pb not in (None, 0, float("inf")) else ("baseline" if pb == 0 else "n/a")
        sizing_rows += (f"<tr><td>{row['scenario_name']}</td><td>{row['savings_pct']:.1f}%</td>"
                         f"<td>${row['capital_cost_usd']:,.0f}</td><td>{pb_str}</td></tr>")

    html = f"""
<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>Polar Energy System — Consolidated Report</title>
<style>
body {{ font-family: -apple-system, Segoe UI, Arial, sans-serif; max-width: 900px; margin: 40px auto; padding: 0 20px; color: #222; line-height: 1.5; }}
h1 {{ font-size: 1.6em; border-bottom: 3px solid #2980b9; padding-bottom: 8px; }}
h2 {{ font-size: 1.2em; color: #2980b9; margin-top: 2em; }}
.headline {{ display: flex; gap: 16px; flex-wrap: wrap; margin: 20px 0; }}
.stat {{ background: #f4f8fb; border-left: 4px solid #2980b9; padding: 12px 16px; flex: 1; min-width: 180px; }}
.stat .num {{ font-size: 1.5em; font-weight: bold; color: #16a085; }}
.stat .label {{ font-size: 0.85em; color: #555; }}
table {{ border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 0.9em; }}
th, td {{ border: 1px solid #ddd; padding: 6px 10px; text-align: left; }}
th {{ background: #2980b9; color: white; }}
img {{ max-width: 100%; border: 1px solid #eee; border-radius: 4px; margin: 10px 0; }}
.limitation {{ background: #fff8e1; border-left: 4px solid #f39c12; padding: 10px 16px; margin: 8px 0; font-size: 0.9em; }}
.finding {{ background: #eafaf1; border-left: 4px solid #27ae60; padding: 10px 16px; margin: 8px 0; }}
</style></head><body>

<h1>AI-Driven Smart Energy Management System — Polar Research Station</h1>
<p style="color:#777">Consolidated Report · generated {datetime.now().strftime('%Y-%m-%d %H:%M')}</p>

<div class="headline">
  <div class="stat"><div class="num">{litres_saved:,.0f} L</div><div class="label">Fuel saved / year</div></div>
  <div class="stat"><div class="num">{savings_pct:.1f}%</div><div class="label">Reduction vs baseline</div></div>
  <div class="stat"><div class="num">${cost_saved:,.0f}</div><div class="label">Cost saved / year</div></div>
  <div class="stat"><div class="num">{co2_avoided_t:,.0f} t</div><div class="label">CO2 avoided / year</div></div>
</div>

<h2>Fuel Use: Optimized vs Baseline</h2>
<img src="data:image/png;base64,{img_fuel}">

<h2>How the System Dispatches Power Across the Year</h2>
<img src="data:image/png;base64,{img_dispatch}">
<p>Diesel usage rises sharply during the dark, cold polar-night stretch when solar contributes nothing — this is exactly when the optimizer's decisions matter most.</p>

<h2>Fuel Budget &amp; Resupply Risk</h2>
<div class="finding">With a tank sized for the optimized system ({fuel_budget['fuel_remaining_l'].iloc[0]+fuel_budget['cumulative_fuel_l'].iloc[0]:,.0f} L), the station ends the year with {fuel_budget['fuel_remaining_l'].iloc[-1]:,.0f} L to spare — while the naive always-on strategy would run out before resupply.</div>

<h2>Safety &amp; Anomaly Monitoring</h2>
<img src="data:image/png;base64,{img_alerts}">
<p>{alert_pct:.1f}% of the year has at least one active alert (mostly winter cold/wind warnings). Worst compound event: hour {int(worst['hour_index'])} — {worst['temperature_c']:.1f}°C, {worst['wind_speed_ms']:.1f} m/s wind, battery at floor, {int(worst['num_concurrent_alerts'])} concurrent alerts.</p>

<h2>Capacity Sizing — What's Worth Investing In</h2>
<img src="data:image/png;base64,{img_sizing}">
<table><tr><th>Scenario</th><th>Fuel Savings</th><th>Capital Cost</th><th>Payback</th></tr>
{sizing_rows}
</table>
<img src="data:image/png;base64,{img_payback}">
<div class="finding"><b>Best investment:</b> {best_payback['scenario_name']} — pays back in {best_payback['payback_years']:.1f} years.<br>
<b>Key finding:</b> doubling battery <i>capacity</i> alone barely helps — the real bottleneck is charge/discharge <i>power rate</i>, not stored energy.</div>

<h2>Resilience — Failure Injection</h2>
<div class="finding">A realistic 3-week peak-winter outage of the larger genset leaves 22 of 365 daily windows unable to fully meet load — a genuine vulnerability worth addressing with a backup unit or load-shedding protocol.</div>

<h2>Known Limitations</h2>
<div class="limitation">Load is derived from real thermal physics, not measured station data (none is public).</div>
<div class="limitation">The forecast module (gradient boosting, validated MAE: temp 5.7°C, wind 4.65 m/s) is built but not yet wired into live dispatch decisions — the optimizer currently plans with perfect future weather knowledge.</div>
<div class="limitation">Does not yet model load-shedding or emergency resupply as failure mitigations.</div>

<h2>Verification Trail</h2>
<p>5 real bugs were caught and fixed during development (not shipped silently): a load-model phase bug, undersized diesel capacity, an unrealistic ship-capacity assumption, missing renewable curtailment, and an over-sensitive alert threshold. Full detail in <code>docs/SPEC.md</code>.</p>

</body></html>
"""
    with open(output_path, "w") as f:
        f.write(html)
    return output_path


if __name__ == "__main__":
    path = generate_report("/home/claude/polar-energy-system/docs/CONSOLIDATED_REPORT.html")
    print(f"Report generated -> {path}")
