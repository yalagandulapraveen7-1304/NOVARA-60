import { Battery, Fuel, Power } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import { useSim } from "../../lib/sim/store";

export function BatteryFuelPanel() {
  const t = useSim((s) => s.telemetry);
  const fuelHistory = useSim((s) => s.fuelHistory);
  const focusOn = useSim((s) => s.focusOn);
  const setCameraMode = useSim((s) => s.setCameraMode);

  const toggleGen = (g: "gen1" | "gen2") => {
    const cur = useSim.getState().telemetry;
    const next = cur[g] === "online" ? "standby" : "online";
    useSim.setState({ telemetry: { ...cur, [g]: next } });
    useSim.getState().pushAlert({
      level: "info",
      title: `${g === "gen1" ? "Generator 1 (Alternator)" : "Generator 2 (Auxiliary)"} → ${next.toUpperCase()}`,
      detail: `Remote generator set command executed. Microgrid power re-dispatched.`,
      target: "power",
    });
  };

  return (
    <div className="flex h-full w-full flex-col justify-between rounded-xl border border-[#d2e4f2] bg-white p-3 shadow-xs overflow-hidden">
      {/* Battery Header */}
      <div className="flex items-center justify-between border-b border-[#edf4fa] pb-1.5 shrink-0">
        <button
          onClick={() => setCameraMode("energy")}
          className="flex items-center gap-1.5 text-left hover:opacity-80"
          title="Focus BESS battery bank in 3D"
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[#e0f4f9] text-[#009bb8]">
            <Battery className="h-3 w-3" />
          </div>
          <span className="font-display text-[11px] font-bold tracking-wider text-[#0b2138]">
            BATTERY STORAGE (BESS)
          </span>
        </button>
        <div className="flex items-center gap-1 font-mono text-[8px]">
          <span className="rounded bg-[#ecfdf5] px-1 py-0.2 font-bold text-[#059669]">SAFE</span>
          <span
            className={`rounded px-1 py-0.2 font-bold ${
              t.batteryKw >= 0 ? "bg-[#e0f4f9] text-[#009bb8]" : "bg-[#fef3c7] text-[#b45309]"
            }`}
          >
            {t.batteryKw >= 0 ? "CHARGING" : "DISCHARGING"}
          </span>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-2 py-2 pr-0.5">
        {/* Battery SOC Readout */}
        <div className="rounded-lg border border-[#e1edf5] bg-[#f8fbfe] p-2">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="font-mono text-xl font-bold text-[#0b2138]">
                {Math.round(t.batterySoc)}%
              </span>
              <span className="ml-1 font-mono text-[9px] text-[#506e86]">SOC</span>
            </div>
            <div className="text-right font-mono text-[9px]">
              <div className="font-bold text-[#009bb8]">
                {t.batteryKw >= 0 ? `+${Math.round(t.batteryKw)} kW` : `${Math.round(t.batteryKw)} kW`}
              </div>
              <div className="text-[#506e86]">185 kWh usable buffer</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#e2eff8]">
            <div
              className={`h-full transition-all duration-500 ${
                t.batterySoc < 25 ? "bg-[#dc2626]" : t.batterySoc < 50 ? "bg-[#d97706]" : "bg-[#009bb8]"
              }`}
              style={{ width: `${Math.max(5, Math.min(100, t.batterySoc))}%` }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between font-mono text-[8px] text-[#506e86]">
            <span>Cell: {t.batteryTemp.toFixed(1)}°C</span>
            <span>Health: {t.batteryHealth}%</span>
            <span className="text-[#d97706]">20% Floor</span>
          </div>
        </div>

        {/* Fuel Section */}
        <div>
          <div className="flex items-center justify-between text-[10px]">
            <button
              onClick={() => focusOn("storage")}
              className="flex items-center gap-1 font-display font-bold tracking-wider text-[#0b2138] hover:text-[#009bb8]"
              title="Focus fuel storage tanks in 3D"
            >
              <Fuel className="h-3 w-3 text-[#d97706]" />
              <span>FUEL TANKS (Aviation Turbine Fuel)</span>
            </button>
            <span className="font-mono text-[9px] font-bold text-[#0b2138]">
              {t.fuelPct.toFixed(1)}% ({t.fuelDaysLeft.toFixed(1)} d)
            </span>
          </div>

          {/* Mini Sparkline Chart */}
          <div className="mt-1 h-7 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={fuelHistory}>
                <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
                <Area
                  type="monotone"
                  dataKey="level"
                  stroke="#009bb8"
                  fill="#e0f4f9"
                  strokeWidth={1.5}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Generator Operational Switches */}
      <div className="border-t border-[#edf4fa] pt-1.5 shrink-0">
        <div className="mb-1 flex items-center justify-between text-[8px] font-mono text-[#506e86]">
          <span>DIESEL ALTERNATORS</span>
          <span>REMOTE DISPATCH</span>
        </div>
        <div className="grid grid-cols-2 gap-1 font-mono text-[9px]">
          <div className="flex items-center justify-between rounded border border-[#d2e4f2] bg-[#f8fbfe] p-1">
            <div>
              <div className="font-bold text-[#0b2138]">G1 MAIN</div>
              <div
                className={`text-[8px] font-bold ${
                  t.gen1 === "online" ? "text-[#059669]" : t.gen1 === "failed" ? "text-[#dc2626]" : "text-[#506e86]"
                }`}
              >
                {t.gen1.toUpperCase()}
              </div>
            </div>
            {t.gen1 !== "failed" && (
              <button
                onClick={() => toggleGen("gen1")}
                className="rounded border border-[#d2e4f2] bg-white px-1.5 py-0.5 text-[8px] font-bold text-[#009bb8] hover:bg-[#e0f4f9]"
              >
                {t.gen1 === "online" ? "STOP" : "START"}
              </button>
            )}
          </div>

          <div className="flex items-center justify-between rounded border border-[#d2e4f2] bg-[#f8fbfe] p-1">
            <div>
              <div className="font-bold text-[#0b2138]">G2 AUX</div>
              <div
                className={`text-[8px] font-bold ${
                  t.gen2 === "online" ? "text-[#059669]" : t.gen2 === "failed" ? "text-[#dc2626]" : "text-[#506e86]"
                }`}
              >
                {t.gen2.toUpperCase()}
              </div>
            </div>
            {t.gen2 !== "failed" && (
              <button
                onClick={() => toggleGen("gen2")}
                className="rounded border border-[#d2e4f2] bg-white px-1.5 py-0.5 text-[8px] font-bold text-[#009bb8] hover:bg-[#e0f4f9]"
              >
                {t.gen2 === "online" ? "STOP" : "START"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
