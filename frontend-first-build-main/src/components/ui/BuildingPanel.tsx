import { X, DoorOpen } from "lucide-react";
import { STATIONS } from "../../lib/sim/stations";
import { useSim } from "../../lib/sim/store";

function Row({ label, value, tone }: { label: string; value: string; tone?: "ok" | "warn" | "crit" | "dim" | undefined }) {
  const color = tone === "ok" ? "text-success" : tone === "warn" ? "text-warning" : tone === "crit" ? "text-destructive" : tone === "dim" ? "text-muted-foreground" : "text-foreground";
  return (
    <div className="flex items-center justify-between border-b border-border/50 py-1.5 last:border-0">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className={`font-mono text-[11px] font-medium ${color}`}>{value}</span>
    </div>
  );
}

export function BuildingPanel({ onEnter }: { onEnter: (id: string) => void }) {
  const selected = useSim((s) => s.selectedBuilding);
  const selectBuilding = useSim((s) => s.selectBuilding);
  const stationId = useSim((s) => s.stationId);
  const t = useSim((s) => s.telemetry);
  if (!selected) return null;
  const def = STATIONS[stationId].buildings.find((b) => b.id === selected);
  if (!def) return null;

  const fault = selected === "power" && (t.gen1 === "failed" || !t.batteryOnline);

  return (
    <div className="pointer-events-auto absolute left-4 top-[4.5rem] z-20 w-72 rounded-md border border-border bg-panel/95 shadow-2xl backdrop-blur-md">
      <div className="flex items-start justify-between border-b border-border px-4 py-3">
        <div>
          <div className="font-display text-sm font-semibold tracking-wide text-foreground">{def.name}</div>
          <div className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{def.category} · digital twin</div>
        </div>
        <button onClick={() => selectBuilding(null)} className="rounded-sm p-1 text-muted-foreground hover:bg-accent hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="px-4 py-2">
        <div className="mb-2 flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${fault ? "bg-destructive" : "bg-success"} ${fault ? "" : "animate-pulse"}`} />
          <span className={`font-mono text-[11px] font-semibold tracking-widest ${fault ? "text-destructive" : "text-success"}`}>{fault ? "FAULT" : "NORMAL"}</span>
        </div>
        <p className="mb-2 text-[11px] leading-relaxed text-muted-foreground">{def.description}</p>

        {selected === "power" && (
          <>
            <Row label="Power generation" value={`${Math.round(t.dieselKw + t.solarKw + t.windKw)} kW`} />
            <Row label="Fuel consumption" value={`${t.fuelLph.toFixed(1)} L/h`} />
            <Row label="Generator 1" value={t.gen1.toUpperCase()} tone={t.gen1 === "failed" ? "crit" : t.gen1 === "online" ? "ok" : "dim"} />
            <Row label="Generator 2" value={t.gen2.toUpperCase()} tone={t.gen2 === "failed" ? "crit" : t.gen2 === "online" ? "ok" : "dim"} />
            <Row label="Battery" value={t.batteryOnline ? `${Math.round(t.batterySoc)}%` : "OFFLINE"} tone={t.batteryOnline ? "ok" : "crit"} />
          </>
        )}
        {selected === "main" && (
          <>
            <Row label="Interior temperature" value="21.4°C" tone="ok" />
            <Row label="Heating load" value={`${Math.round(t.heatingKw)} kW`} />
            <Row label="Occupancy" value="24 personnel" />
            <Row label="Life support" value="NOMINAL" tone="ok" />
          </>
        )}
        {selected === "weather" && (
          <>
            <Row label="Temperature" value={`${t.temperature.toFixed(1)}°C`} />
            <Row label="Wind" value={`${Math.round(t.windSpeed)} km/h ${t.windDirection}`} />
            <Row label="Pressure" value={`${Math.round(t.pressure)} hPa`} />
            <Row label="Visibility" value={`${t.visibility.toFixed(1)} km`} />
            <Row label="Solar radiation" value={`${Math.round(t.solarRadiation)} W/m²`} />
          </>
        )}
        {selected === "storage" && (
          <>
            <Row label="Fuel remaining" value={`${Math.round(t.fuelPct)}%`} tone={t.fuelPct < 15 ? "crit" : "ok"} />
            <Row label="Est. remaining" value={`${t.fuelDaysLeft.toFixed(1)} days`} tone={t.fuelPct < 15 ? "warn" : undefined} />
            <Row label="Food" value="82%" tone="ok" />
            <Row label="Medical" value="91%" tone="ok" />
          </>
        )}
        {selected === "comms" && (
          <>
            <Row label="Uplink" value="CONNECTED" tone="ok" />
            <Row label="Bandwidth" value="12.4 Mbps" />
            <Row label="Latency" value="680 ms" />
            <Row label="Power draw" value={`${Math.round(t.commsKw)} kW`} />
          </>
        )}
        {selected === "workshop" && (
          <>
            <Row label="Status" value="OPERATIONAL" tone="ok" />
            <Row label="Spare parts" value="54%" tone="warn" />
            <Row label="Load priority" value="P2" />
          </>
        )}
        {selected === "vehicles" && (
          <>
            <Row label="Tracked vehicles" value="2 READY" tone="ok" />
            <Row label="Snow vehicles" value="1 READY" tone="ok" />
            <Row label="Field ops" value={t.visibility < 2 ? "RESTRICTED" : "PERMITTED"} tone={t.visibility < 2 ? "warn" : "ok"} />
          </>
        )}
      </div>
      <div className="border-t border-border p-3">
        <button
          onClick={() => onEnter(selected)}
          className="flex w-full items-center justify-center gap-2 rounded-sm bg-primary px-3 py-2 font-display text-[11px] font-semibold tracking-[0.2em] text-primary-foreground hover:bg-primary/85"
        >
          <DoorOpen className="h-3.5 w-3.5" /> ENTER BUILDING
        </button>
        <div className="mt-2 text-center font-mono text-[9px] tracking-widest text-muted-foreground/70">SIMULATED TELEMETRY · NOT LIVE SENSOR DATA</div>
      </div>
    </div>
  );
}
