import { useState } from "react";
import { AlertCircle, Zap, X, ChevronRight } from "lucide-react";
import { useSim } from "../../lib/sim/store";

export function CriticalAlertBanner() {
  const [dismissed, setDismissed] = useState(false);
  const t = useSim((s) => s.telemetry);
  const alerts = useSim((s) => s.alerts);
  const weather = useSim((s) => s.weather);
  const stationId = useSim((s) => s.stationId);
  const focusOn = useSim((s) => s.focusOn);
  const openDashboardTo = useSim((s) => s.openDashboardTo);

  const hasCrit =
    t.gen1 === "failed" ||
    weather === "blizzard" ||
    t.fuelPct < 15 ||
    !t.batteryOnline ||
    alerts.some((a) => a.level === "critical");

  if (!hasCrit || dismissed) return null;

  const handleAutoDispatch = () => {
    const cur = useSim.getState().telemetry;
    useSim.setState({
      telemetry: {
        ...cur,
        gen2: "online",
        shedP3: false,
      },
    });
    useSim.getState().pushAlert({
      level: "info",
      title: "Auto-Dispatch Executed",
      detail: "Generator 2 synchronized (85 kW). Microgrid equilibrium restored.",
      target: "power",
    });
    setDismissed(true);
  };

  const handleInspect = () => {
    if (t.gen1 === "failed") focusOn("power");
    else if (weather === "blizzard") focusOn("weather");
    else openDashboardTo("Alerts");
  };

  let title = "CRITICAL RENEWABLE DEFICIT PREDICTED (ACTION REQUIRED)";
  let subtitle = `${stationId.toUpperCase()} gale velocity / power excursion triggered automated safeguards. Reserve floor at risk.`;

  if (t.gen1 === "failed") {
    title = "CRITICAL GENERATOR 1 TRIP DETECTED (ACTION REQUIRED)";
    subtitle = "Primary diesel alternator G1 tripped offline. BESS discharge compensating. Auxiliary dispatch needed.";
  } else if (weather === "blizzard") {
    title = "SEVERE BLIZZARD GALE VELOCITY EXCEEDED (> 25 m/s)";
    subtitle = "Wind turbine safety brakes engaged. Solar generation suppressed. Life support priority P0 active.";
  } else if (t.fuelPct < 15) {
    title = "FUEL RESERVE FLOOR BREACH RISK (< 15% CAPACITY)";
    subtitle = "Station fuel stocks critically depleted. Automated conservation protocol recommends load shedding.";
  }

  return (
    <div className="shrink-0 mx-2.5 my-1 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#fca5a5] bg-[#fee2e2]/95 px-3 py-1 text-[#0b2138] shadow-xs backdrop-blur-sm animate-in fade-in slide-in-from-top-1">
      <div className="flex items-center gap-2">
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#dc2626] text-white">
          <AlertCircle className="h-3 w-3" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-display text-[11px] font-bold tracking-wider text-[#dc2626]">
              {title}
            </span>
            <span className="rounded bg-[#dc2626] px-1 py-0.2 font-mono text-[8px] font-bold text-white">
              ACTION REQUIRED
            </span>
          </div>
          <p className="text-[10px] text-[#4b6982] leading-none">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={handleAutoDispatch}
          className="flex items-center gap-1 rounded-md bg-[#dc2626] px-2.5 py-0.5 font-display text-[10px] font-bold tracking-wider text-white shadow-xs transition hover:bg-[#b91c1c]"
        >
          <Zap className="h-3 w-3" />
          <span>AUTO-DISPATCH G2 (85 kW)</span>
        </button>
        <button
          onClick={handleInspect}
          className="flex items-center gap-0.5 rounded-md border border-[#fca5a5] bg-white px-2 py-0.5 text-[10px] font-medium text-[#dc2626] transition hover:bg-[#fff1f2]"
        >
          <span>Inspect Why</span>
          <ChevronRight className="h-3 w-3" />
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="rounded-md p-0.5 text-[#991b1b] hover:bg-[#fee2e2]"
          title="Dismiss Alert Banner"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
