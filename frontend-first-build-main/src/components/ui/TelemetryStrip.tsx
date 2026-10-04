import { Sun, Wind, Fuel, Battery, Thermometer, Gauge } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import { useSim } from "../../lib/sim/store";

function Card({ title, icon: Icon, children }: { title: string; icon: typeof Sun; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-panel/95 p-3 shadow-xl backdrop-blur-md">
      <div className="mb-2 flex items-center gap-1.5">
        <Icon className="h-3 w-3 text-primary" />
        <span className="font-display text-[10px] font-semibold tracking-[0.18em] text-muted-foreground">{title}</span>
      </div>
      {children}
    </div>
  );
}

function Bar({ label, value, max, unit, tone = "primary" }: { label: string; value: number; max: number; unit: string; tone?: "primary" | "solar" | "warning" | "success" | "destructive" }) {
  const bg = { primary: "bg-primary", solar: "bg-solar", warning: "bg-warning", success: "bg-success", destructive: "bg-destructive" }[tone];
  return (
    <div className="mb-1.5">
      <div className="flex justify-between text-[10px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-foreground">
          {Math.round(value)} {unit}
        </span>
      </div>
      <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-secondary">
        <div className={`h-full ${bg} transition-all duration-700`} style={{ width: `${Math.min(100, (Math.abs(value) / max) * 100)}%` }} />
      </div>
    </div>
  );
}

export function TelemetryStrip() {
  const t = useSim((s) => s.telemetry);
  const fuelHistory = useSim((s) => s.fuelHistory);
  const selected = useSim((s) => s.selectedBuilding);
  if (selected) return null;
  const totalGen = t.solarKw + t.windKw + t.dieselKw;
  const totalLoad = t.heatingKw + t.labKw + t.accomKw + t.commsKw + t.otherKw;

  return (
    <div className="pointer-events-auto absolute left-4 top-[4.5rem] z-10 flex w-64 flex-col gap-2.5">
      <Card title="ENERGY BALANCE" icon={Gauge}>
        <div className="mb-2 grid grid-cols-2 gap-2">
          <div>
            <div className="text-[9px] tracking-widest text-muted-foreground">GENERATION</div>
            <div className="font-mono text-lg font-semibold text-primary">{Math.round(totalGen)}<span className="ml-0.5 text-[10px] text-muted-foreground">kW</span></div>
          </div>
          <div>
            <div className="text-[9px] tracking-widest text-muted-foreground">CONSUMPTION</div>
            <div className="font-mono text-lg font-semibold text-foreground">{Math.round(totalLoad)}<span className="ml-0.5 text-[10px] text-muted-foreground">kW</span></div>
          </div>
        </div>
        <Bar label="Solar" value={t.solarKw} max={520} unit="kW" tone="solar" />
        <Bar label="Wind" value={t.windKw} max={520} unit="kW" />
        <Bar label="Diesel" value={t.dieselKw} max={900} unit="kW" tone="warning" />
        <Bar label={t.batteryKw >= 0 ? "Battery (charge)" : "Battery (discharge)"} value={t.batteryKw} max={250} unit="kW" tone={t.batteryKw >= 0 ? "success" : "destructive"} />
        <div className="mt-2 flex gap-1">
          {(["P0", "P1", "P2", "P3"] as const).map((p) => {
            const shed = (p === "P3" && t.shedP3) || (p === "P2" && t.shedP2);
            return (
              <div key={p} className={`flex-1 rounded-sm border py-0.5 text-center font-mono text-[9px] ${shed ? "border-destructive/50 text-destructive line-through" : "border-success/40 text-success"}`}>
                {p}
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="BATTERY · FUEL" icon={Battery}>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-[9px] tracking-widest text-muted-foreground">SOC</div>
            <div className={`font-mono text-base font-semibold ${t.batteryOnline ? "text-success" : "text-destructive"}`}>{t.batteryOnline ? `${Math.round(t.batterySoc)}%` : "OFFLINE"}</div>
            <div className="font-mono text-[9px] text-muted-foreground">Health {t.batteryHealth}% · {t.batteryTemp.toFixed(0)}°C</div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-[9px] tracking-widest text-muted-foreground"><Fuel className="h-2.5 w-2.5" />FUEL</div>
            <div className={`font-mono text-base font-semibold ${t.fuelPct < 15 ? "text-destructive" : "text-foreground"}`}>{t.fuelPct.toFixed(1)}%</div>
            <div className="font-mono text-[9px] text-muted-foreground">{t.fuelDaysLeft.toFixed(1)} d · {t.fuelLph.toFixed(0)} L/h</div>
          </div>
        </div>
        <div className="mt-2 h-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={fuelHistory}>
              <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
              <Area type="monotone" dataKey="level" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.15} strokeWidth={1.5} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="ENVIRONMENT" icon={Thermometer}>
        <div className="grid grid-cols-3 gap-x-2 gap-y-1.5 font-mono">
          {[
            ["TEMP", `${t.temperature.toFixed(1)}°`],
            ["WIND", `${Math.round(t.windSpeed)}`],
            ["DIR", t.windDirection],
            ["PRES", `${Math.round(t.pressure)}`],
            ["VIS", `${t.visibility.toFixed(1)}km`],
            ["RAD", `${Math.round(t.solarRadiation)}`],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="text-[8px] tracking-widest text-muted-foreground">{k}</div>
              <div className="text-[12px] text-foreground">{v}</div>
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex items-center gap-1 text-[9px] text-muted-foreground">
          <Wind className="h-2.5 w-2.5" /> km/h · hPa · W/m² · snow {t.snowfall.toLowerCase()}
        </div>
      </Card>
    </div>
  );
}
