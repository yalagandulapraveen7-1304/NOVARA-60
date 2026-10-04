import { Gauge, Sun, Wind, Flame, ShieldCheck, Zap } from "lucide-react";
import { useSim } from "../../lib/sim/store";

export function EnergyBalancePanel() {
  const t = useSim((s) => s.telemetry);
  const focusOn = useSim((s) => s.focusOn);
  const setCameraMode = useSim((s) => s.setCameraMode);

  const totalGen = Math.round(t.solarKw + t.windKw + t.dieselKw);
  const totalLoad = Math.round(t.heatingKw + t.labKw + t.accomKw + t.commsKw + t.otherKw);
  const netResidual = totalGen - totalLoad;

  const toggleShed = (p: "P2" | "P3") => {
    const cur = useSim.getState().telemetry;
    const isP3 = p === "P3";
    const nextVal = isP3 ? !cur.shedP3 : !cur.shedP2;
    if (isP3) {
      useSim.setState({ telemetry: { ...cur, shedP3: nextVal } });
    } else {
      useSim.setState({ telemetry: { ...cur, shedP2: nextVal } });
    }
    useSim.getState().pushAlert({
      level: nextVal ? "warning" : "info",
      title: `${p} Load ${nextVal ? "Shed" : "Restored"}`,
      detail: `${isP3 ? "Auxiliary" : "Habitat"} circuit ${nextVal ? "disconnected to protect reserve" : "reconnected to microgrid"}.`,
      target: "power",
    });
  };

  return (
    <div className="flex h-full w-full flex-col justify-between rounded-xl border border-[#d2e4f2] bg-white p-3 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#edf4fa] pb-1.5 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[#e0f4f9] text-[#009bb8]">
            <Gauge className="h-3 w-3" />
          </div>
          <span className="font-display text-[11px] font-bold tracking-wider text-[#0b2138]">
            ENERGY BALANCE & GRID
          </span>
        </div>
        <button
          onClick={() => setCameraMode("energy")}
          className="flex items-center gap-1 rounded bg-[#ecfdf5] px-1.5 py-0.2 font-mono text-[8px] font-semibold text-[#059669] hover:bg-[#d1fae5]"
          title="Click to view power flow conduits in 3D"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#059669]" />
          50.02 Hz Synced
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-2 py-2 pr-0.5">
        {/* Power Balance Big Readout */}
        <div className="rounded-lg border border-[#e1edf5] bg-[#f8fbfe] p-2">
          <div className="flex items-baseline justify-between font-mono text-[9px]">
            <span className="font-bold tracking-wider text-[#506e86]">MICROGRID POWER FLOW</span>
            <span
              className={`font-bold ${
                netResidual >= 0 ? "text-[#059669]" : "text-[#dc2626]"
              }`}
            >
              {netResidual >= 0 ? `+${netResidual} kW SURPLUS` : `${netResidual} kW DEFICIT`}
            </span>
          </div>
          <div className="mt-0.5 flex items-baseline justify-between">
            <div>
              <span className="font-mono text-xl font-bold text-[#009bb8]">{totalGen}</span>
              <span className="ml-1 font-mono text-[10px] text-[#506e86]">kW Gen</span>
            </div>
            <span className="text-[#a5c2d8] font-mono text-sm">/</span>
            <div>
              <span className="font-mono text-xl font-bold text-[#0b2138]">{totalLoad}</span>
              <span className="ml-1 font-mono text-[10px] text-[#506e86]">kW Load</span>
            </div>
          </div>
        </div>

        {/* Generation Sources Grid (Clicking focuses asset in 3D) */}
        <div>
          <div className="mb-1 flex items-center justify-between font-mono text-[8px] text-[#506e86]">
            <span>ACTIVE GENERATION ASSETS</span>
            <span>Click asset to locate</span>
          </div>
          <div className="grid grid-cols-3 gap-1 text-center">
            <button
              onClick={() => setCameraMode("energy")}
              className="rounded-md border border-[#fde68a] bg-[#fffbeb] p-1 transition hover:bg-[#fef3c7]"
              title="Focus solar farm in 3D"
            >
              <div className="flex items-center justify-center gap-0.5 text-[8px] font-bold text-[#b45309]">
                <Sun className="h-2.5 w-2.5" /> Solar
              </div>
              <div className="font-mono text-[11px] font-bold text-[#b45309]">
                {Math.round(t.solarKw)} kW
              </div>
            </button>

            <button
              onClick={() => setCameraMode("energy")}
              className="rounded-md border border-[#b9e6f3] bg-[#f0faff] p-1 transition hover:bg-[#e0f4f9]"
              title="Focus wind turbines in 3D"
            >
              <div className="flex items-center justify-center gap-0.5 text-[8px] font-bold text-[#009bb8]">
                <Wind className="h-2.5 w-2.5" /> Wind
              </div>
              <div className="font-mono text-[11px] font-bold text-[#009bb8]">
                {Math.round(t.windKw)} kW
              </div>
            </button>

            <button
              onClick={() => focusOn("power")}
              className="rounded-md border border-[#fed7aa] bg-[#fff7ed] p-1 transition hover:bg-[#ffedd5]"
              title="Focus Power Complex in 3D"
            >
              <div className="flex items-center justify-center gap-0.5 text-[8px] font-bold text-[#c2410c]">
                <Flame className="h-2.5 w-2.5" /> Diesel
              </div>
              <div className="font-mono text-[11px] font-bold text-[#c2410c]">
                {Math.round(t.dieselKw)} kW
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Priority Load Shedding */}
      <div className="border-t border-[#edf4fa] pt-1.5 shrink-0">
        <div className="mb-1 flex items-center justify-between text-[9px] font-mono text-[#506e86]">
          <span className="font-bold">LOAD SHED CONTROLS</span>
          <span className="text-[#059669]">Click P2/P3 to toggle</span>
        </div>
        <div className="grid grid-cols-4 gap-1 font-mono text-[8px]">
          <div
            className="rounded border border-[#a7f3d0] bg-[#ecfdf5] p-1 text-center font-bold text-[#059669]"
            title="Inviolable life-support systems (20 kW)"
          >
            P0: Life 20k
          </div>
          <div
            className="rounded border border-[#a7f3d0] bg-[#ecfdf5] p-1 text-center font-bold text-[#059669]"
            title="Essential science laboratories (130 kW)"
          >
            P1: Labs 130k
          </div>
          <button
            onClick={() => toggleShed("P2")}
            className={`rounded border p-1 text-center font-bold transition ${
              t.shedP2
                ? "border-[#fca5a5] bg-[#fee2e2] text-[#dc2626] line-through"
                : "border-[#d2e4f2] bg-[#f0f7fc] text-[#0b2138] hover:border-[#009bb8]"
            }`}
            title="Toggle Habitat non-critical heating shedding"
          >
            P2: Hab 90k
          </button>
          <button
            onClick={() => toggleShed("P3")}
            className={`rounded border p-1 text-center font-bold transition ${
              t.shedP3
                ? "border-[#fca5a5] bg-[#fee2e2] text-[#dc2626] line-through"
                : "border-[#d2e4f2] bg-[#f0f7fc] text-[#0b2138] hover:border-[#009bb8]"
            }`}
            title="Toggle Workshop auxiliary circuit shedding"
          >
            P3: Aux 40k
          </button>
        </div>
        <div className="mt-1 flex items-center justify-between text-[8px] text-[#506e86]">
          <span className="flex items-center gap-0.5">
            <ShieldCheck className="h-2.5 w-2.5 text-[#059669]" /> P0 Inviolable
          </span>
          <span className="font-mono text-[#8ea8be]">SIMULATED TELEMETRY</span>
        </div>
      </div>
    </div>
  );
}
