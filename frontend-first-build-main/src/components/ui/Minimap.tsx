import { STATIONS } from "../../lib/sim/stations";
import { useSim } from "../../lib/sim/store";

export function Minimap() {
  const stationId = useSim((s) => s.stationId);
  const selectBuilding = useSim((s) => s.selectBuilding);
  const focusOn = useSim((s) => s.focusOn);
  const selected = useSim((s) => s.selectedBuilding);
  const st = STATIONS[stationId];
  const S = 1.9; // scale world->svg
  const C = 90;

  return (
    <div className="pointer-events-auto absolute bottom-[4.5rem] right-4 z-20 w-44 rounded-md border border-border bg-panel/95 p-2 shadow-2xl backdrop-blur-md">
      <div className="mb-1 flex justify-between font-mono text-[9px] tracking-widest text-muted-foreground">
        <span>SITE · {st.name.toUpperCase()}</span>
        <span>N↑</span>
      </div>
      <svg viewBox="0 0 180 180" className="w-full rounded-sm bg-background">
        <circle cx={C} cy={C} r={85} fill="none" stroke="var(--border)" strokeDasharray="2 3" />
        {st.buildings.map((b) => (
          <rect
            key={b.id}
            x={C + b.position[0] * S - (b.size[0] * S) / 2}
            y={C + b.position[2] * S - (b.size[2] * S) / 2}
            width={b.size[0] * S}
            height={b.size[2] * S}
            fill={selected === b.id ? "var(--primary)" : "var(--muted-foreground)"}
            opacity={selected === b.id ? 0.9 : 0.55}
            className="cursor-pointer"
            onClick={() => {
              selectBuilding(b.id);
              focusOn(b.id);
            }}
          />
        ))}
        {st.solarPanels.map((p, i) => (
          <rect key={i} x={C + p.position[0] * S - 4} y={C + p.position[2] * S - 2} width={8} height={4} fill="var(--solar)" opacity={0.8} />
        ))}
        {st.windTurbines.map((p, i) => (
          <circle key={i} cx={C + p[0] * S} cy={C + p[2] * S} r={2.5} fill="var(--primary)" />
        ))}
        {st.vehicles.map((v, i) => (
          <circle key={i} cx={C + v.position[0] * S} cy={C + v.position[2] * S} r={2} fill="var(--warning)" />
        ))}
        {st.fuelTanks.map((p, i) => (
          <circle key={i} cx={C + p[0] * S} cy={C + p[2] * S} r={2.5} fill="var(--warning)" opacity={0.6} />
        ))}
        {/* operator */}
        <circle cx={C} cy={C + 40} r={3} fill="var(--success)">
          <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>
      <div className="mt-1 text-center font-mono text-[8px] tracking-wider text-muted-foreground/70">REPRESENTATIVE LAYOUT</div>
    </div>
  );
}
