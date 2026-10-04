import { Play, Pause, CloudSun, Cloud, CloudSnow, Wind, ThermometerSnowflake, Zap, Building2, Mountain, Truck, Siren, Scan, RotateCcw } from "lucide-react";
import { useSim, type WeatherMode, type CameraMode } from "../../lib/sim/store";

const weatherModes: { id: WeatherMode; label: string; icon: typeof CloudSun }[] = [
  { id: "clear", label: "Clear", icon: CloudSun },
  { id: "cloudy", label: "Cloudy", icon: Cloud },
  { id: "snow", label: "Snow", icon: CloudSnow },
  { id: "blizzard", label: "Blizzard", icon: Wind },
  { id: "extremeCold", label: "Extreme Cold", icon: ThermometerSnowflake },
];

const cameraModes: { id: CameraMode; label: string; icon: typeof Scan }[] = [
  { id: "overview", label: "Overview", icon: Scan },
  { id: "energy", label: "Energy", icon: Zap },
  { id: "infrastructure", label: "Infrastructure", icon: Building2 },
  { id: "environment", label: "Environment", icon: Mountain },
  { id: "logistics", label: "Logistics", icon: Truck },
  { id: "emergency", label: "Emergency", icon: Siren },
];

const demoSteps = [
  "Normal operation",
  "Storm prediction detected",
  "Wind increasing",
  "Solar generation falling",
  "Severe blizzard hits",
  "Heating demand surges",
  "Generator 1 failure",
  "Battery discharging",
  "P3 loads auto-shed",
  "Generator 2 online",
  "Critical systems stable",
  "Storm passing",
  "Recovery sequence",
  "Normal operation restored",
];

export function ControlBar() {
  const weather = useSim((s) => s.weather);
  const setWeather = useSim((s) => s.setWeather);
  const cameraMode = useSim((s) => s.cameraMode);
  const setCameraMode = useSim((s) => s.setCameraMode);
  const timeSpeed = useSim((s) => s.timeSpeed);
  const setTimeSpeed = useSim((s) => s.setTimeSpeed);
  const simulateFailure = useSim((s) => s.simulateFailure);
  const resetFailures = useSim((s) => s.resetFailures);
  const demoRunning = useSim((s) => s.demoRunning);
  const demoStep = useSim((s) => s.demoStep);
  const startDemo = useSim((s) => s.startDemo);
  const stopDemo = useSim((s) => s.stopDemo);
  const advanceDemo = useSim((s) => s.advanceDemo);

  return (
    <div className="pointer-events-auto absolute bottom-0 left-0 right-0 z-20 border-t border-border bg-panel/95 backdrop-blur-md">
      {demoRunning && (
        <div className="flex items-center gap-3 border-b border-border bg-primary/10 px-4 py-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          <span className="font-mono text-[10px] tracking-widest text-primary">ANTARCTIC STORM RESPONSE</span>
          <span className="text-[11px] text-foreground">
            Step {Math.min(demoStep + 1, demoSteps.length)}/{demoSteps.length}: {demoSteps[Math.min(demoStep, demoSteps.length - 1)]}
          </span>
          <div className="ml-2 h-1 flex-1 overflow-hidden rounded-full bg-secondary">
            <div className="h-full bg-primary transition-all" style={{ width: `${(demoStep / demoSteps.length) * 100}%` }} />
          </div>
          <button onClick={stopDemo} className="rounded-sm border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground hover:text-foreground">
            ABORT
          </button>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5">
        {/* Time simulation */}
        <div className="flex items-center gap-1.5">
          <span className="mr-1 font-mono text-[9px] tracking-[0.2em] text-muted-foreground">TIME</span>
          <button
            onClick={() => setTimeSpeed(timeSpeed === 0 ? 1 : 0)}
            className="flex h-7 w-7 items-center justify-center rounded-sm border border-border text-foreground hover:border-primary/60"
          >
            {timeSpeed === 0 ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
          </button>
          {([1, 5, 20] as const).map((s) => (
            <button
              key={s}
              onClick={() => setTimeSpeed(s)}
              className={`h-7 rounded-sm border px-2 font-mono text-[10px] ${timeSpeed === s ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
            >
              {s}x
            </button>
          ))}
          <button
            onClick={() => setTimeSpeed(20)}
            className="h-7 rounded-sm border border-border px-2 font-mono text-[10px] text-muted-foreground hover:text-foreground"
          >
            +1h
          </button>
        </div>

        <div className="h-6 w-px bg-border" />

        {/* Weather */}
        <div className="flex items-center gap-1">
          <span className="mr-1 font-mono text-[9px] tracking-[0.2em] text-muted-foreground">WEATHER</span>
          {weatherModes.map((w) => (
            <button
              key={w.id}
              onClick={() => setWeather(w.id)}
              title={w.label}
              className={`flex h-7 items-center gap-1 rounded-sm border px-2 text-[10px] ${weather === w.id ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
            >
              <w.icon className="h-3 w-3" />
              <span className="hidden xl:inline">{w.label}</span>
            </button>
          ))}
        </div>

        <div className="h-6 w-px bg-border" />

        {/* Camera modes */}
        <div className="flex items-center gap-1">
          <span className="mr-1 font-mono text-[9px] tracking-[0.2em] text-muted-foreground">VIEW</span>
          {cameraModes.map((c) => (
            <button
              key={c.id}
              onClick={() => setCameraMode(c.id)}
              title={c.label}
              className={`flex h-7 items-center gap-1 rounded-sm border px-2 text-[10px] ${cameraMode === c.id ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
            >
              <c.icon className="h-3 w-3" />
              <span className="hidden 2xl:inline">{c.label}</span>
            </button>
          ))}
        </div>

        <div className="h-6 w-px bg-border" />

        {/* Failure simulation */}
        <div className="flex items-center gap-1">
          <span className="mr-1 font-mono text-[9px] tracking-[0.2em] text-muted-foreground">SIMULATE</span>
          <button onClick={() => simulateFailure("generator")} className="h-7 rounded-sm border border-destructive/40 px-2 font-mono text-[10px] text-destructive hover:bg-destructive/10">
            GEN FAIL
          </button>
          <button onClick={() => simulateFailure("battery")} className="h-7 rounded-sm border border-destructive/40 px-2 font-mono text-[10px] text-destructive hover:bg-destructive/10">
            BATT FAIL
          </button>
          <button onClick={() => simulateFailure("fuel")} className="h-7 rounded-sm border border-warning/40 px-2 font-mono text-[10px] text-warning hover:bg-warning/10">
            FUEL LOW
          </button>
          <button onClick={() => simulateFailure("blizzard")} className="h-7 rounded-sm border border-warning/40 px-2 font-mono text-[10px] text-warning hover:bg-warning/10">
            BLIZZARD
          </button>
          <button onClick={resetFailures} title="Reset all faults" className="flex h-7 w-7 items-center justify-center rounded-sm border border-border text-muted-foreground hover:text-foreground">
            <RotateCcw className="h-3 w-3" />
          </button>
        </div>

        <button
          onClick={demoRunning ? advanceDemo : startDemo}
          className={`ml-auto flex items-center gap-2 rounded-sm px-4 py-1.5 font-display text-[11px] font-semibold tracking-[0.15em] ${demoRunning ? "bg-warning text-warning-foreground" : "bg-primary text-primary-foreground hover:bg-primary/85"}`}
        >
          <Play className="h-3.5 w-3.5" />
          {demoRunning ? "NEXT STEP" : "START DIGITAL TWIN DEMO"}
        </button>
      </div>
    </div>
  );
}
