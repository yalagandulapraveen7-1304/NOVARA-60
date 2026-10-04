import { Thermometer, Wind, Eye } from "lucide-react";
import { STATIONS } from "../../lib/sim/stations";
import { useSim } from "../../lib/sim/store";

export function EnvironmentSitePanel() {
  const stationId = useSim((s) => s.stationId);
  const t = useSim((s) => s.telemetry);
  const selectBuilding = useSim((s) => s.selectBuilding);
  const focusOn = useSim((s) => s.focusOn);
  const selected = useSim((s) => s.selectedBuilding);
  const setCameraMode = useSim((s) => s.setCameraMode);
  const st = STATIONS[stationId];

  const S = 1.6;
  const C = 75;

  return (
    <div className="flex h-full w-full flex-col justify-between rounded-xl border border-[#d2e4f2] bg-white p-3 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#edf4fa] pb-1.5 shrink-0">
        <button
          onClick={() => {
            setCameraMode("environment");
            focusOn("weather");
          }}
          className="flex items-center gap-1.5 text-left hover:opacity-80"
          title="Focus AWS meteorological mast in 3D"
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[#e0f4f9] text-[#009bb8]">
            <Thermometer className="h-3 w-3" />
          </div>
          <span className="font-display text-[11px] font-bold tracking-wider text-[#0b2138]">
            ENVIRONMENT & RADAR
          </span>
        </button>
        <span className="rounded bg-[#f0f7fc] px-1.5 py-0.2 font-mono text-[8px] font-bold text-[#506e86]">
          AWS SYNOPTIC
        </span>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-2 py-2 pr-0.5">
        {/* Synoptic Grid */}
        <div className="grid grid-cols-3 gap-1 text-center font-mono text-[9px]">
          <div className="rounded-md border border-[#d2e4f2] bg-[#f8fbfe] p-1">
            <div className="text-[8px] font-bold text-[#506e86]">TEMP</div>
            <div className="font-bold text-[#0b2138]">{t.temperature.toFixed(1)}°C</div>
          </div>
          <div className="rounded-md border border-[#d2e4f2] bg-[#f8fbfe] p-1">
            <div className="text-[8px] font-bold text-[#506e86]">WIND</div>
            <div className="font-bold text-[#009bb8]">{Math.round(t.windSpeed)} m/s</div>
          </div>
          <div className="rounded-md border border-[#d2e4f2] bg-[#f8fbfe] p-1">
            <div className="text-[8px] font-bold text-[#506e86]">PRESSURE</div>
            <div className="font-bold text-[#0b2138]">{Math.round(t.pressure)} hPa</div>
          </div>
          <div className="rounded-md border border-[#d2e4f2] bg-[#f8fbfe] p-1">
            <div className="text-[8px] font-bold text-[#506e86]">SOLAR RAD</div>
            <div className="font-bold text-[#d97706]">{Math.round(t.solarRadiation)} W/m²</div>
          </div>
          <div className="rounded-md border border-[#d2e4f2] bg-[#f8fbfe] p-1">
            <div className="text-[8px] font-bold text-[#506e86]">VISIBILITY</div>
            <div className="font-bold text-[#0b2138]">{t.visibility.toFixed(1)} km</div>
          </div>
          <div className="rounded-md border border-[#d2e4f2] bg-[#f8fbfe] p-1">
            <div className="text-[8px] font-bold text-[#506e86]">KATABATIC</div>
            <div className="font-bold text-[#0b2138]">{t.windDirection}</div>
          </div>
        </div>

        {/* Interactive Site Radar Minimap */}
        <div>
          <div className="mb-1 flex items-center justify-between font-mono text-[8px] text-[#506e86]">
            <span>STATION SITE ({st.name.toUpperCase()})</span>
            <span className="text-[#009bb8]">Click asset to select</span>
          </div>

          <div className="relative mx-auto flex h-24 w-full max-w-[190px] items-center justify-center rounded-lg border border-[#d2e4f2] bg-[#f0f7fc] p-1">
            <svg viewBox="0 0 150 150" className="h-full w-full">
              <circle cx={C} cy={C} r={70} fill="none" stroke="#d2e4f2" strokeDasharray="3 3" />
              <circle cx={C} cy={C} r={45} fill="none" stroke="#d2e4f2" strokeDasharray="2 2" />
              <circle cx={C} cy={C} r={20} fill="none" stroke="#d2e4f2" />

              <line x1={C} y1={5} x2={C} y2={145} stroke="#d2e4f2" strokeWidth={0.7} />
              <line x1={5} y1={C} x2={145} y2={C} stroke="#d2e4f2" strokeWidth={0.7} />

              {/* Buildings */}
              {st.buildings.map((b) => {
                const isSelected = selected === b.id;
                return (
                  <rect
                    key={b.id}
                    x={C + b.position[0] * S - (b.size[0] * S) / 2}
                    y={C + b.position[2] * S - (b.size[2] * S) / 2}
                    width={Math.max(5, b.size[0] * S)}
                    height={Math.max(5, b.size[2] * S)}
                    fill={isSelected ? "#009bb8" : "#3b5870"}
                    stroke={isSelected ? "#007a91" : "#ffffff"}
                    strokeWidth={isSelected ? 1.5 : 0.5}
                    className="cursor-pointer transition-all hover:fill-[#009bb8]"
                    onClick={() => {
                      selectBuilding(b.id);
                      focusOn(b.id);
                    }}
                  >
                    <title>{b.name}</title>
                  </rect>
                );
              })}

              {/* Solar panels */}
              {st.solarPanels.map((p, i) => (
                <rect
                  key={i}
                  x={C + p.position[0] * S - 3}
                  y={C + p.position[2] * S - 1.5}
                  width={6}
                  height={3}
                  fill="#d97706"
                  opacity={0.85}
                  className="cursor-pointer"
                  onClick={() => setCameraMode("energy")}
                >
                  <title>Solar Array</title>
                </rect>
              ))}

              {/* Turbines */}
              {st.windTurbines.map((p, i) => (
                <circle
                  key={i}
                  cx={C + p[0] * S}
                  cy={C + p[2] * S}
                  r={2.5}
                  fill="#009bb8"
                  className="cursor-pointer"
                  onClick={() => setCameraMode("energy")}
                >
                  <title>Wind Turbine</title>
                </circle>
              ))}

              {/* Fuel tanks */}
              {st.fuelTanks.map((p, i) => (
                <circle
                  key={i}
                  cx={C + p[0] * S}
                  cy={C + p[2] * S}
                  r={2.5}
                  fill="#c2410c"
                  opacity={0.7}
                  className="cursor-pointer"
                  onClick={() => focusOn("storage")}
                >
                  <title>Fuel Storage Tank</title>
                </circle>
              ))}

              {/* Pulsing beacon */}
              <circle cx={C} cy={C} r={3} fill="#059669">
                <animate attributeName="r" values="2;4;2" dur="2s" repeatCount="indefinite" />
              </circle>
            </svg>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[#edf4fa] pt-1.5 shrink-0 flex items-center justify-between text-[8px] font-mono text-[#506e86]">
        <span>AWS POLAR TELEMETRY</span>
        <span>NORTH N↑ ALIGNED</span>
      </div>
    </div>
  );
}
