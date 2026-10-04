import { useState } from "react";
import { X, Layers, Zap, Building2, Mountain, Truck, Sparkles, Bell, Cpu } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useSim } from "../../lib/sim/store";
import { STATIONS } from "../../lib/sim/stations";
import { SimulationAnalyticsScreen } from "../simulation/SimulationAnalyticsScreen";

export const tabs = [
  "Overview",
  "Energy",
  "Infrastructure",
  "Environment",
  "Logistics",
  "AI & Prediction",
  "Alerts",
  "Simulation",
] as const;
export type Tab = (typeof tabs)[number];

const tooltipStyle = {
  background: "#ffffff",
  border: "1px solid #d2e4f2",
  borderRadius: 8,
  fontSize: 11,
  color: "#0b2138",
  boxShadow: "0 4px 12px rgba(11,33,56,0.08)",
};

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-[#d2e4f2] bg-[#f8fbfe] p-3 shadow-xs">
      <div className="font-mono text-[9px] font-bold tracking-wider text-[#506e86]">{label}</div>
      <div className={`mt-1 font-mono text-xl font-bold ${tone ?? "text-[#0b2138]"}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[10px] text-[#506e86]">{sub}</div>}
    </div>
  );
}

function TwinRow({
  asset,
  physical,
  telemetry,
  prediction,
  health,
  onControl,
  controlLabel,
}: {
  asset: string;
  physical: string;
  telemetry: string;
  prediction: string;
  health: string;
  onControl?: (() => void) | undefined;
  controlLabel?: string | undefined;
}) {
  const bad = physical === "FAILED" || physical === "OFFLINE";
  return (
    <tr className="border-b border-[#edf4fa] text-[11px] transition hover:bg-[#f8fbfe]">
      <td className="py-2.5 font-medium text-[#0b2138]">{asset}</td>
      <td
        className={`font-mono font-bold ${
          bad ? "text-[#dc2626]" : physical === "STANDBY" ? "text-[#506e86]" : "text-[#059669]"
        }`}
      >
        {physical}
      </td>
      <td className="font-mono text-[#0b2138]">{telemetry}</td>
      <td className="text-[#506e86]">{prediction}</td>
      <td className="font-mono font-bold text-[#0b2138]">{health}</td>
      <td>
        {onControl && (
          <button
            onClick={onControl}
            className="rounded border border-[#d2e4f2] bg-white px-2 py-0.5 font-mono text-[9px] font-bold text-[#009bb8] transition hover:bg-[#e0f4f9]"
          >
            {controlLabel}
          </button>
        )}
      </td>
    </tr>
  );
}

const icons: Record<Tab, typeof Layers> = {
  Overview: Layers,
  Energy: Zap,
  Infrastructure: Building2,
  Environment: Mountain,
  Logistics: Truck,
  "AI & Prediction": Sparkles,
  Alerts: Bell,
  Simulation: Cpu,
};

export function Dashboard() {
  const open = useSim((s) => s.dashboardOpen);
  const setOpen = useSim((s) => s.setDashboardOpen);
  const t = useSim((s) => s.telemetry);
  const energyHistory = useSim((s) => s.energyHistory);
  const fuelHistory = useSim((s) => s.fuelHistory);
  const logistics = useSim((s) => s.logistics);
  const alerts = useSim((s) => s.alerts);
  const aiMessages = useSim((s) => s.aiMessages);
  const stationId = useSim((s) => s.stationId);
  const simulateFailure = useSim((s) => s.simulateFailure);
  const resetFailures = useSim((s) => s.resetFailures);
  const setWeather = useSim((s) => s.setWeather);
  const tab = useSim((s) => s.dashboardTab);
  const setTab = useSim((s) => s.setDashboardTab);

  if (!open) return null;

  const st = STATIONS[stationId];
  const totalLoad = t.heatingKw + t.labKw + t.accomKw + t.commsKw + t.otherKw;
  const loads = [
    { name: "Heating", kw: Math.round(t.heatingKw) },
    { name: "Labs", kw: Math.round(t.labKw) },
    { name: "Accom.", kw: Math.round(t.accomKw) },
    { name: "Comms", kw: Math.round(t.commsKw) },
    { name: "Other", kw: Math.round(t.otherKw) },
  ];
  const health = Math.round(
    100 - (t.gen1 === "failed" ? 18 : 0) - (!t.batteryOnline ? 15 : 0) - (t.fuelPct < 15 ? 20 : 0)
  );

  const toggleGen = (g: "gen1" | "gen2") => {
    const cur = useSim.getState().telemetry;
    const next = cur[g] === "online" ? "standby" : "online";
    useSim.setState({ telemetry: { ...cur, [g]: next } });
    useSim.getState().pushAlert({
      level: "info",
      title: `${g === "gen1" ? "Generator 1" : "Generator 2"} → ${next.toUpperCase()}`,
      detail: "Remote control command simulated.",
      target: "power",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b2138]/40 p-2 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex flex-col md:flex-row h-[92vh] md:h-[85vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-[#d2e4f2] bg-white shadow-2xl">
        {/* Navigation: Horizontal scroll on mobile/tablet, Sidebar on desktop */}
        <nav className="w-full md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-[#edf4fa] bg-[#f8fbfe] p-2 md:p-3 flex md:flex-col justify-between gap-2 overflow-x-auto md:overflow-x-visible">
          <div className="w-full">
            <div className="hidden md:block mb-4 border-b border-[#edf4fa] pb-3">
              <div className="font-display text-xs font-bold tracking-wider text-[#0b2138]">
                {st.fullName.toUpperCase()}
              </div>
              <div className="mt-0.5 font-mono text-[9px] text-[#506e86]">{st.coordinates}</div>
              <div className="font-mono text-[9px] text-[#009bb8]">{st.elevation}</div>
            </div>

            <div className="flex md:flex-col gap-1 overflow-x-auto no-scrollbar py-0.5">
              {tabs.map((x) => {
                const Icon = icons[x];
                const active = tab === x;
                return (
                  <button
                    key={x}
                    onClick={() => setTab(x)}
                    className={`flex shrink-0 items-center gap-1.5 md:gap-2 rounded-lg px-2.5 md:px-3 py-1.5 md:py-2 text-left text-[11px] md:text-xs font-display font-semibold tracking-wider transition ${
                      active
                        ? "border border-[#009bb8] bg-[#e0f4f9] text-[#009bb8] shadow-xs"
                        : "text-[#506e86] hover:bg-white hover:text-[#0b2138]"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{x}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="hidden md:block rounded-lg border border-[#fde68a] bg-[#fffbeb] p-2 text-[9px] text-[#b45309]">
            <div className="font-bold">SIMULATION DATA</div>
            <div>Mathematical model telemetry. No live physical connection.</div>
          </div>
        </nav>

        {/* Tab Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 md:p-6 bg-white">
          {tab !== "Simulation" && (
            <div className="mb-5 flex items-center justify-between border-b border-[#edf4fa] pb-3">
              <h2 className="font-display text-lg font-bold tracking-wide text-[#0b2138]">
                {tab} Analytics
              </h2>
              <div className="flex items-center gap-3">
                <span className="rounded-md bg-[#e0f4f9] px-2.5 py-0.5 font-mono text-[9px] font-bold tracking-widest text-[#009bb8]">
                  DIGITAL TWIN ENGINE ACTIVE
                </span>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1.5 text-[#506e86] hover:bg-[#f0f7fc] hover:text-[#0b2138]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {tab === "Overview" && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Stat
                  label="STATION HEALTH"
                  value={`${health}%`}
                  tone={health > 85 ? "text-[#059669]" : health > 65 ? "text-[#d97706]" : "text-[#dc2626]"}
                />
                <Stat label="ACTIVE LOAD" value={`${Math.round(totalLoad)} kW`} sub="Total consumption" />
                <Stat
                  label="FUEL RESERVES"
                  value={`${t.fuelPct.toFixed(1)}%`}
                  sub={`${t.fuelDaysLeft.toFixed(1)} days left`}
                />
                <Stat
                  label="OUTSIDE TEMP"
                  value={`${t.temperature.toFixed(1)}°C`}
                  sub={`${Math.round(t.windSpeed)} m/s ${t.windDirection}`}
                />
              </div>

              <div className="rounded-xl border border-[#d2e4f2] p-4 bg-[#fcfdfe]">
                <div className="mb-3 font-display text-xs font-bold tracking-wider text-[#0b2138]">
                  DIGITAL TWIN SUBSYSTEM SYNCHRONIZATION
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#d2e4f2] text-left font-mono text-[9px] tracking-widest text-[#506e86]">
                      <th className="pb-2">ASSET</th>
                      <th>PHYSICAL</th>
                      <th>TELEMETRY</th>
                      <th>PREDICTION</th>
                      <th>HEALTH</th>
                      <th>CONTROL</th>
                    </tr>
                  </thead>
                  <tbody>
                    <TwinRow
                      asset="Generator 1 (Alternator)"
                      physical={t.gen1.toUpperCase()}
                      telemetry={t.gen1 === "online" ? `${Math.round(t.dieselKw / (t.gen2 === "online" ? 2 : 1))} kW` : "—"}
                      prediction={t.gen1 === "failed" ? "Emergency trip" : "Nominal"}
                      health={t.gen1 === "failed" ? "0%" : "92%"}
                      onControl={t.gen1 !== "failed" ? () => toggleGen("gen1") : undefined}
                      controlLabel={t.gen1 === "online" ? "STOP" : "START"}
                    />
                    <TwinRow
                      asset="Generator 2 (Auxiliary)"
                      physical={t.gen2.toUpperCase()}
                      telemetry={t.gen2 === "online" ? `${Math.round(t.dieselKw / (t.gen1 === "online" ? 2 : 1))} kW` : "—"}
                      prediction="Standby ready"
                      health="88%"
                      onControl={() => toggleGen("gen2")}
                      controlLabel={t.gen2 === "online" ? "STOP" : "START"}
                    />
                    <TwinRow
                      asset="Battery Bank (BESS)"
                      physical={t.batteryOnline ? "ONLINE" : "OFFLINE"}
                      telemetry={`${Math.round(t.batteryKw)} kW`}
                      prediction={t.batteryKw < 0 ? "Discharging" : "Charging"}
                      health={`${t.batteryHealth}%`}
                    />
                    <TwinRow
                      asset="Solar PV Array"
                      physical="ONLINE"
                      telemetry={`${Math.round(t.solarKw)} kW`}
                      prediction="Albedo Gain Active"
                      health="97%"
                    />
                    <TwinRow
                      asset="Wind Turbines"
                      physical="ONLINE"
                      telemetry={`${Math.round(t.windKw)} kW`}
                      prediction={t.windSpeed > 70 ? "Cut-out risk" : "Nominal"}
                      health="90%"
                    />
                    <TwinRow
                      asset="Fuel Storage Tanks"
                      physical="ONLINE"
                      telemetry={`${t.fuelPct.toFixed(1)}%`}
                      prediction={`${t.fuelDaysLeft.toFixed(1)} days`}
                      health="95%"
                    />
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "Energy" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Stat label="SOLAR" value={`${Math.round(t.solarKw)} kW`} tone="text-[#d97706]" />
                <Stat label="WIND" value={`${Math.round(t.windKw)} kW`} tone="text-[#009bb8]" />
                <Stat label="DIESEL" value={`${Math.round(t.dieselKw)} kW`} tone="text-[#c2410c]" />
                <Stat
                  label="BATTERY"
                  value={`${t.batteryKw >= 0 ? "+" : ""}${Math.round(t.batteryKw)} kW`}
                  sub={`SOC ${Math.round(t.batterySoc)}% · ${t.batteryCycles} cycles`}
                />
              </div>

              <div className="rounded-xl border border-[#d2e4f2] p-4 bg-white">
                <div className="mb-2 font-display text-xs font-bold text-[#0b2138]">
                  GENERATION VS LOAD TREND (60s WINDOW)
                </div>
                <div className="h-56">
                  <ResponsiveContainer>
                    <LineChart data={energyHistory}>
                      <CartesianGrid stroke="#edf4fa" strokeDasharray="3 3" />
                      <XAxis dataKey="t" stroke="#506e86" fontSize={9} />
                      <YAxis stroke="#506e86" fontSize={9} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Line
                        type="monotone"
                        dataKey="gen"
                        name="Total Generation (kW)"
                        stroke="#009bb8"
                        dot={false}
                        strokeWidth={2}
                        isAnimationActive={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="load"
                        name="Station Load (kW)"
                        stroke="#6366f1"
                        dot={false}
                        strokeWidth={2}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-xl border border-[#d2e4f2] p-4 bg-white">
                <div className="mb-2 font-display text-xs font-bold text-[#0b2138]">
                  LOAD BREAKDOWN BY SUBSYSTEM (kW)
                </div>
                <div className="h-44">
                  <ResponsiveContainer>
                    <BarChart data={loads}>
                      <CartesianGrid stroke="#edf4fa" strokeDasharray="3 3" />
                      <XAxis dataKey="name" stroke="#506e86" fontSize={10} />
                      <YAxis stroke="#506e86" fontSize={9} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="kw" fill="#009bb8" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {tab === "Infrastructure" && (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {st.buildings.map((b) => (
                <div key={b.id} className="rounded-xl border border-[#d2e4f2] p-3.5 bg-[#f8fbfe]">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-[#0b2138]">{b.name}</span>
                    <span className="rounded bg-[#ecfdf5] px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#059669]">
                      NOMINAL
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-[#506e86] leading-relaxed">{b.description}</p>
                  <div className="mt-2 font-mono text-[9px] text-[#8ea8be]">
                    Footprint: {b.size[0]}×{b.size[2]} m (representative layout)
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "Environment" && (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              <Stat label="TEMPERATURE" value={`${t.temperature.toFixed(1)}°C`} />
              <Stat label="WIND SPEED" value={`${Math.round(t.windSpeed)} m/s`} sub={t.windDirection} />
              <Stat label="PRESSURE" value={`${Math.round(t.pressure)} hPa`} />
              <Stat label="VISIBILITY" value={`${t.visibility.toFixed(1)} km`} />
              <Stat label="SNOWFALL" value={t.snowfall} />
              <Stat label="SOLAR IRRADIANCE" value={`${Math.round(t.solarRadiation)} W/m²`} />
            </div>
          )}

          {tab === "Logistics" && (
            <div className="space-y-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#d2e4f2] text-left font-mono text-[9px] tracking-widest text-[#506e86]">
                    <th className="pb-2">SUPPLY</th>
                    <th>STOCK</th>
                    <th>CONSUMPTION RATE</th>
                    <th>DAYS LEFT</th>
                    <th>PRIORITY</th>
                  </tr>
                </thead>
                <tbody>
                  {logistics.map((l) => (
                    <tr key={l.name} className="border-b border-[#edf4fa] text-[11px]">
                      <td className="py-2.5 font-medium text-[#0b2138]">{l.name}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-28 overflow-hidden rounded-full bg-[#e2eff8]">
                            <div
                              className={`h-full ${
                                l.pct < 20 ? "bg-[#dc2626]" : l.pct < 60 ? "bg-[#d97706]" : "bg-[#059669]"
                              }`}
                              style={{ width: `${l.pct}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-[#0b2138]">{l.pct}%</span>
                        </div>
                      </td>
                      <td className="font-mono text-[#506e86]">{l.rate}</td>
                      <td className="font-mono font-bold text-[#0b2138]">{l.daysLeft}</td>
                      <td className="font-mono font-bold text-[#009bb8]">{l.priority}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="rounded-lg border border-[#d2e4f2] bg-[#f8fbfe] p-3 text-xs text-[#506e86]">
                Scheduled Polar Resupply: <span className="font-mono font-bold text-[#0b2138]">MV Vasiliy Golovnin · ETA 11 days (simulated)</span>
              </div>
            </div>
          )}

          {tab === "AI & Prediction" && (
            <div className="space-y-3">
              <div className="rounded-lg border border-[#fde68a] bg-[#fffbeb] p-3 text-xs text-[#b45309]">
                Automated operations recommendations are produced by deterministic microgrid rule models. No live external LLM or SCADA endpoint is currently connected.
              </div>
              {aiMessages.map((m, i) => (
                <div key={i} className="rounded-xl border border-[#d2e4f2] p-4 bg-[#f8fbfe]">
                  <div className="font-mono text-xs font-bold text-[#b45309]">{m.title}</div>
                  <p className="mt-1 text-xs text-[#506e86] leading-relaxed">{m.body}</p>
                  <ul className="mt-2 space-y-1 font-mono text-[10px] text-[#0b2138]">
                    {m.actions.map((a) => (
                      <li key={a} className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#009bb8]" />
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {tab === "Alerts" && (
            <div className="space-y-2">
              {alerts.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 rounded-lg border border-[#d2e4f2] bg-[#f8fbfe] p-2.5 text-xs"
                >
                  <span className="font-mono text-[#506e86] text-[10px]">{a.time}</span>
                  <span
                    className={`font-mono font-bold text-[10px] ${
                      a.level === "critical"
                        ? "text-[#dc2626]"
                        : a.level === "warning"
                        ? "text-[#d97706]"
                        : "text-[#009bb8]"
                    }`}
                  >
                    {a.level.toUpperCase()}
                  </span>
                  <span className="font-medium text-[#0b2138]">{a.title}</span>
                  <span className="text-[#506e86]">— {a.detail}</span>
                </div>
              ))}
            </div>
          )}

          {tab === "Simulation" && (
            <SimulationAnalyticsScreen onClose={() => setOpen(false)} />
          )}
        </div>
      </div>
    </div>
  );
}
