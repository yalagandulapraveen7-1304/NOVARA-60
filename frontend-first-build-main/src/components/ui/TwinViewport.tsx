import { useState } from "react";
import {
  Play,
  Pause,
  CloudSun,
  Cloud,
  CloudSnow,
  Wind,
  ThermometerSnowflake,
  Scan,
  Zap,
  Building2,
  Mountain,
  Truck,
  Siren,
  RotateCcw,
  DoorOpen,
  X,
  Box,
  Map,
} from "lucide-react";
import { StationScene } from "../3d/StationScene";
import { STATIONS } from "../../lib/sim/stations";
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

export function TwinViewport() {
  const stationId = useSim((s) => s.stationId);
  const weather = useSim((s) => s.weather);
  const setWeather = useSim((s) => s.setWeather);
  const cameraMode = useSim((s) => s.cameraMode);
  const setCameraMode = useSim((s) => s.setCameraMode);
  const timeSpeed = useSim((s) => s.timeSpeed);
  const setTimeSpeed = useSim((s) => s.setTimeSpeed);
  const mapView = useSim((s) => s.mapView);
  const setMapView = useSim((s) => s.setMapView);
  const demoRunning = useSim((s) => s.demoRunning);
  const demoStep = useSim((s) => s.demoStep);
  const startDemo = useSim((s) => s.startDemo);
  const stopDemo = useSim((s) => s.stopDemo);
  const advanceDemo = useSim((s) => s.advanceDemo);
  const resetFailures = useSim((s) => s.resetFailures);
  const gen1 = useSim((s) => s.telemetry.gen1);
  const selected = useSim((s) => s.selectedBuilding);
  const selectBuilding = useSim((s) => s.selectBuilding);
  const t = useSim((s) => s.telemetry);

  const [inside, setInside] = useState<string | null>(null);

  const st = STATIONS[stationId];
  const bldgDef = selected ? st.buildings.find((b) => b.id === selected) : null;

  const advanceOneHour = () => {
    const cur = useSim.getState().simHour;
    useSim.setState({ simHour: (cur + 1) % 24 });
    useSim.getState().pushAlert({
      level: "info",
      title: "Time Advanced (+1 Hour)",
      detail: `Simulation clock shifted forward by 1 hour.`,
    });
  };

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[#d2e4f2] bg-[#f0f8fd] shadow-xs">
      {/* Docked Top Toolbar Header - Never overlaps 3D scene or badges */}
      <div className="z-20 flex flex-wrap items-center justify-between gap-1.5 border-b border-[#d2e4f2] bg-white px-2.5 py-1.5 shrink-0">
        {/* Facility Identity & Simulation Mode Badge */}
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#009bb8]" />
          <span className="font-mono text-[10px] font-bold tracking-wider text-[#0b2138]">
            3D TWIN · {st.name.toUpperCase()} FACILITY
          </span>
          <span className="rounded bg-[#fef3c7] px-1.5 py-0.5 font-mono text-[8px] font-bold text-[#b45309]">
            SIMULATION MODE
          </span>
        </div>

        {/* Camera Controls, Weather, and Map View */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Camera View Presets */}
          <div className="flex items-center gap-0.5 rounded-lg border border-[#d2e4f2] bg-[#f8fbfe] p-0.5 shadow-xs">
            {cameraModes.map((c) => {
              const Icon = c.icon;
              const active = cameraMode === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setCameraMode(c.id)}
                  title={`Switch view to ${c.label}`}
                  className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-display font-semibold tracking-wider transition ${
                    active
                      ? "bg-[#009bb8] text-white shadow-xs"
                      : "text-[#506e86] hover:bg-white hover:text-[#0b2138]"
                  }`}
                >
                  <Icon className="h-2.5 w-2.5" />
                  <span className="hidden sm:inline">{c.label.toUpperCase()}</span>
                </button>
              );
            })}
          </div>

          {/* Weather controls */}
          <div className="hidden lg:flex items-center gap-0.5 rounded-lg border border-[#d2e4f2] bg-[#f8fbfe] p-0.5 shadow-xs">
            <span className="px-1 font-mono text-[8px] font-bold text-[#506e86]">WX:</span>
            {weatherModes.map((w) => {
              const Icon = w.icon;
              const active = weather === w.id;
              return (
                <button
                  key={w.id}
                  onClick={() => setWeather(w.id)}
                  title={`Simulate ${w.label} atmospheric conditions`}
                  className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[8px] font-bold transition ${
                    active
                      ? "bg-[#009bb8] text-white"
                      : "text-[#506e86] hover:bg-white hover:text-[#0b2138]"
                  }`}
                >
                  <Icon className="h-2.5 w-2.5" />
                  <span className="hidden 2xl:inline">{w.label}</span>
                </button>
              );
            })}
          </div>

          {/* 3D vs Top-Down Site Map */}
          <div className="flex overflow-hidden rounded-lg border border-[#d2e4f2] bg-white shadow-xs">
            <button
              onClick={() => setMapView(false)}
              className={`flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono font-bold tracking-wider ${
                !mapView ? "bg-[#009bb8] text-white" : "text-[#506e86] hover:bg-[#f0f7fc]"
              }`}
              title="3D Perspective Camera"
            >
              <Box className="h-2.5 w-2.5" /> 3D
            </button>
            <button
              onClick={() => setMapView(true)}
              className={`flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono font-bold tracking-wider ${
                mapView ? "bg-[#009bb8] text-white" : "text-[#506e86] hover:bg-[#f0f7fc]"
              }`}
              title="Top-Down Orthogonal View"
            >
              <Map className="h-2.5 w-2.5" /> TOP-DOWN
            </button>
          </div>
        </div>
      </div>

      {/* 3D Canvas Area */}
      <div className="relative flex-1 min-h-0 w-full overflow-hidden">
        <StationScene
          interior={inside}
          gen1Failed={gen1 === "failed"}
          onExitInterior={() => setInside(null)}
        />

        {/* Building Details Floating Inspector (when clicked) */}
        {bldgDef && !inside && (
          <div className="pointer-events-auto absolute left-2.5 bottom-2.5 z-20 w-76 max-w-[calc(100%-20px)] max-h-[calc(100%-20px)] overflow-y-auto rounded-xl border border-[#d2e4f2] bg-white/95 p-3 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-start justify-between border-b border-[#edf4fa] pb-1.5">
              <div>
                <div className="font-display text-xs font-bold tracking-wider text-[#0b2138]">
                  {bldgDef.name}
                </div>
                <div className="text-[9px] uppercase tracking-wider text-[#009bb8] font-mono">
                  {bldgDef.category} · DIGITAL TWIN
                </div>
              </div>
              <button
                onClick={() => selectBuilding(null)}
                className="rounded-md p-1 text-[#506e86] hover:bg-[#f0f7fc] hover:text-[#0b2138]"
                title="Close Inspector"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-1.5 text-[10px] leading-relaxed text-[#506e86]">
              {bldgDef.description}
            </p>

            <div className="mt-2 space-y-0.5 font-mono text-[9px]">
              <div className="flex justify-between border-b border-[#f0f7fc] py-0.5">
                <span className="text-[#506e86]">Footprint:</span>
                <span className="text-[#0b2138]">{bldgDef.size[0]}×{bldgDef.size[2]} m</span>
              </div>
              {selected === "power" && (
                <>
                  <div className="flex justify-between border-b border-[#f0f7fc] py-0.5">
                    <span className="text-[#506e86]">G1 Alternator:</span>
                    <span className={t.gen1 === "online" ? "text-[#059669] font-bold" : "text-[#dc2626] font-bold"}>
                      {t.gen1.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-[#f0f7fc] py-0.5">
                    <span className="text-[#506e86]">G2 Auxiliary:</span>
                    <span className="text-[#059669] font-bold">{t.gen2.toUpperCase()}</span>
                  </div>
                </>
              )}
              {selected === "main" && (
                <div className="flex justify-between border-b border-[#f0f7fc] py-0.5">
                  <span className="text-[#506e86]">Occupancy:</span>
                  <span className="text-[#0b2138] font-bold">24 Station Personnel</span>
                </div>
              )}
            </div>

            <div className="mt-2.5 flex gap-1.5">
              <button
                onClick={() => setInside(selected)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#009bb8] py-1 font-display text-[10px] font-bold tracking-wider text-white shadow-xs transition hover:bg-[#00839c]"
              >
                <DoorOpen className="h-3 w-3" />
                <span>ENTER BUILDING 3D</span>
              </button>
              <button
                onClick={() => selectBuilding(null)}
                className="rounded-lg border border-[#d2e4f2] px-2.5 py-1 font-display text-[10px] text-[#506e86] hover:bg-[#f0f7fc]"
              >
                Close
              </button>
            </div>
            <div className="mt-1 text-center font-mono text-[8px] text-[#8ea8be]">
              SIMULATED TELEMETRY · NOT LIVE SENSOR DATA
            </div>
          </div>
        )}

        {/* Interior Walkthrough Mode Overlay */}
        {inside && (
          <div className="pointer-events-auto absolute left-3 top-14 z-30 rounded-xl border border-[#d2e4f2] bg-white/95 p-3.5 shadow-xl backdrop-blur-md">
            <div className="font-display text-xs font-bold tracking-widest text-[#0b2138]">
              INTERIOR FACILITY VIEW ({inside.toUpperCase()})
            </div>
            <div className="mt-1 font-mono text-[9px] text-[#506e86]">
              Click to look around · WASD / Arrow keys to walk · ESC to exit
            </div>
            <button
              onClick={() => setInside(null)}
              className="mt-2 rounded-lg bg-[#009bb8] px-3 py-1 font-display text-[10px] font-bold tracking-wider text-white shadow-xs hover:bg-[#00839c]"
            >
              EXIT TO STATION EXTERIOR
            </button>
          </div>
        )}
      </div>

      {/* Bottom Floating Bar: Simulation Clock, Speed, and Guided Demo */}
      <div className="pointer-events-auto z-20 flex flex-wrap items-center justify-between gap-2 border-t border-[#d2e4f2] bg-white/95 px-3 py-1.5 backdrop-blur-md shrink-0">
        {/* Time Simulation Controls */}
        <div className="flex items-center gap-1">
          <span className="font-mono text-[9px] font-bold text-[#506e86]">TIME SPEED:</span>
          <button
            onClick={() => setTimeSpeed(timeSpeed === 0 ? 1 : 0)}
            className="flex h-6.5 w-6.5 items-center justify-center rounded-md border border-[#d2e4f2] bg-white text-[#0b2138] hover:border-[#009bb8]"
            title={timeSpeed === 0 ? "Resume Simulation Time" : "Pause Simulation Time"}
          >
            {timeSpeed === 0 ? <Play className="h-3 w-3 text-[#059669]" /> : <Pause className="h-3 w-3 text-[#dc2626]" />}
          </button>
          {([1, 5, 20] as const).map((s) => (
            <button
              key={s}
              onClick={() => setTimeSpeed(s)}
              className={`h-6.5 rounded-md border px-2 font-mono text-[9px] font-bold transition ${
                timeSpeed === s
                  ? "border-[#009bb8] bg-[#e0f4f9] text-[#009bb8]"
                  : "border-[#d2e4f2] bg-white text-[#506e86] hover:bg-[#f0f7fc]"
              }`}
              title={`Simulate at ${s}x speed`}
            >
              {s}x
            </button>
          ))}
          <button
            onClick={advanceOneHour}
            className="h-6.5 rounded-md border border-[#d2e4f2] bg-white px-2 font-mono text-[9px] font-bold text-[#506e86] hover:bg-[#f0f7fc]"
            title="Fast Forward Simulation Clock by 1 Hour"
          >
            +1h
          </button>
        </div>

        {/* Demo Scenario Progress (if running) */}
        {demoRunning && (
          <div className="flex items-center gap-2 rounded-lg border border-[#fde68a] bg-[#fffbeb] px-2.5 py-0.5 text-[10px]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#d97706]" />
            <span className="font-mono font-bold text-[#b45309]">STORM SCENARIO:</span>
            <span className="font-mono text-[#0b2138]">
              Step {demoStep + 1}/{demoSteps.length}: {demoSteps[demoStep]}
            </span>
            <button
              onClick={stopDemo}
              className="ml-1 rounded border border-[#d2e4f2] bg-white px-1.5 py-0.2 font-mono text-[8px] font-bold text-[#dc2626] hover:bg-[#fee2e2]"
              title="Abort Demo Scenario"
            >
              ABORT
            </button>
          </div>
        )}

        {/* Demo Button & Reset */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={resetFailures}
            className="flex h-6.5 items-center gap-1 rounded-md border border-[#d2e4f2] bg-white px-2 font-mono text-[9px] font-bold text-[#506e86] hover:bg-[#f0f7fc] hover:text-[#0b2138]"
            title="Reset 3D camera and faults"
          >
            <RotateCcw className="h-2.5 w-2.5" />
            <span>RESET 3D</span>
          </button>

          <button
            onClick={demoRunning ? advanceDemo : startDemo}
            className={`flex h-6.5 items-center gap-1 rounded-md px-2.5 font-display text-[10px] font-bold tracking-wider text-white shadow-xs transition ${
              demoRunning ? "bg-[#d97706] hover:bg-[#b45309]" : "bg-[#009bb8] hover:bg-[#00839c]"
            }`}
            title={demoRunning ? "Proceed to next step in storm scenario" : "Start 14-step automated Antarctic storm scenario"}
          >
            <Play className="h-2.5 w-2.5" />
            <span>{demoRunning ? "ADVANCE DEMO" : "START DIGITAL TWIN DEMO"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
