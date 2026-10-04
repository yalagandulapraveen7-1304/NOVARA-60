import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  SkipForward,
  Square,
  RotateCcw,
  Shield,
  Zap,
  Activity,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Info,
  Clock,
  X,
  Gauge,
  Flame,
  Battery,
  Wind,
  Thermometer,
  Layers,
} from "lucide-react";
import { useSim, STORM_STAGES, type ScenarioId } from "../../lib/sim/store";
import { STATIONS } from "../../lib/sim/stations";

interface SimulationAnalyticsScreenProps {
  onClose?: () => void;
}

export function SimulationAnalyticsScreen({ onClose }: SimulationAnalyticsScreenProps) {
  const stationId = useSim((s) => s.stationId);
  const setStation = useSim((s) => s.setStation);
  const scenarioStatuses = useSim((s) => s.scenarioStatuses);
  const activeImpact = useSim((s) => s.activeScenarioImpact);
  const scenarioHistory = useSim((s) => s.scenarioHistory);
  const stormRunning = useSim((s) => s.stormRunning);
  const stormPaused = useSim((s) => s.stormPaused);
  const stormStep = useSim((s) => s.stormStep);
  const triggerScenario = useSim((s) => s.triggerScenario);
  const resetAllScenarios = useSim((s) => s.resetAllScenarios);
  const startStormSequence = useSim((s) => s.startStormSequence);
  const pauseStormSequence = useSim((s) => s.pauseStormSequence);
  const resumeStormSequence = useSim((s) => s.resumeStormSequence);
  const stepStormSequence = useSim((s) => s.stepStormSequence);
  const stopStormSequence = useSim((s) => s.stopStormSequence);
  const lastFeedback = useSim((s) => s.lastFeedbackMessage);
  const clearFeedback = useSim((s) => s.clearFeedbackMessage);
  const telemetry = useSim((s) => s.telemetry);

  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const st = STATIONS[stationId];

  const handleConfirmReset = () => {
    resetAllScenarios();
    setResetDialogOpen(false);
  };

  const scenarios: {
    id: ScenarioId;
    title: string;
    description: string;
    severity: "critical" | "warning" | "high";
    systems: string[];
    isSequence?: boolean;
  }[] = [
    {
      id: "generator",
      title: "Generator 1 Failure",
      description:
        "Primary diesel alternator trips offline under simulated stator overtemp. Gen 2 auto-starts and synchronizes at 50 Hz, BESS discharge compensates transient gap.",
      severity: "critical",
      systems: ["Power House G1", "Microgrid 415V Bus", "BESS Inverter"],
    },
    {
      id: "battery",
      title: "Battery Bank Failure",
      description:
        "BESS LiFePO4 rack bank trips DC contactors. Microgrid loses energy buffer; diesel generators increase dispatch dynamically to guarantee P0 critical life-support.",
      severity: "critical",
      systems: ["BESS LiFePO4", "DC Substation Bus", "P0 Life Support"],
    },
    {
      id: "fuel",
      title: "Fuel Reserve Deficit",
      description:
        "Simulated ATF storage falls below 10% reserve threshold (8.5%, 1.6 days). Automated priority shedding disengages P3 aux labs and modulates P2 heating setpoints.",
      severity: "warning",
      systems: ["ATF Fuel Farm", "P3 Aux Shedding", "P2 Thermal Loops"],
    },
    {
      id: "blizzard",
      title: "Severe Blizzard Gale",
      description:
        "Katabatic wind surges to 82 km/h (>25 m/s). Wind turbines engage aerodynamic safety feathering and brakes, bifacial solar occluded, heating demand peaks.",
      severity: "critical",
      systems: ["Met Mast AWS", "60kW Turbines", "Solar Array", "CHP Heating"],
    },
    {
      id: "extremeCold",
      title: "Extreme Polar Cold",
      description:
        "Polar vortex drops ambient temperature to −41.0°C. Building envelope thermal losses peak at 625 kW, BESS cells suffer internal resistance derating, line trace heating engaged.",
      severity: "high",
      systems: ["HVAC Thermal Loop", "BESS Heating Blankets", "ATF Trace Heat"],
    },
    {
      id: "stormSequence",
      title: "Antarctic Storm Sequence",
      description:
        "Comprehensive 10-stage automated stress protocol: early katabatic warning, gale escalation, renewable curtailment, generator failover, priority load shedding, and recovery.",
      severity: "high",
      systems: ["All Microgrid Subsystems", "AWS Meteorological", "SCADA Controller"],
      isSequence: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Screen Header */}
      <div className="rounded-2xl border border-[#d2e4f2] bg-[#f8fbfe] p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-[#0b2138]">
                Simulation Analytics
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#fde68a] bg-[#fffbeb] px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#b45309]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#f59e0b] animate-pulse" />
                SIMULATION DATA
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#bae6fd] bg-[#f0f9ff] px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#0284c7]">
                MATHEMATICAL MODEL
              </span>
            </div>
            <p className="text-xs text-[#506e86] leading-relaxed max-w-2xl">
              Operators can execute controlled what-if scenarios against simulated station data to evaluate
              microgrid power balance, thermal dissipation, battery buffer dynamics, and autonomous failover safeguards.
            </p>
          </div>

          {/* Station Selector & Close */}
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <div className="flex items-center rounded-lg border border-[#d2e4f2] bg-white p-0.5">
              <button
                onClick={() => setStation("maitri")}
                className={`rounded-md px-2.5 py-1 font-mono text-[11px] font-bold tracking-wider transition ${
                  stationId === "maitri"
                    ? "bg-[#009bb8] text-white shadow-xs"
                    : "text-[#506e86] hover:text-[#0b2138]"
                }`}
              >
                MAITRI
              </button>
              <button
                onClick={() => setStation("bharati")}
                className={`rounded-md px-2.5 py-1 font-mono text-[11px] font-bold tracking-wider transition ${
                  stationId === "bharati"
                    ? "bg-[#009bb8] text-white shadow-xs"
                    : "text-[#506e86] hover:text-[#0b2138]"
                }`}
              >
                BHARATI
              </button>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="rounded-lg border border-[#d2e4f2] bg-white p-1.5 text-[#506e86] transition hover:bg-[#edf4fa] hover:text-[#0b2138]"
                title="Return to Digital Twin"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Operator Feedback Toast */}
        {lastFeedback && (
          <div
            className={`mt-3 flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs transition animate-in fade-in ${
              lastFeedback.type === "success"
                ? "border-[#a7f3d0] bg-[#ecfdf5] text-[#065f46]"
                : lastFeedback.type === "warning"
                ? "border-[#fde68a] bg-[#fffbeb] text-[#92400e]"
                : "border-[#bae6fd] bg-[#f0f9ff] text-[#0369a1]"
            }`}
          >
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 shrink-0" />
              <span className="font-medium">{lastFeedback.text}</span>
            </div>
            <button
              onClick={clearFeedback}
              className="rounded p-0.5 hover:bg-black/5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Scenario Controls Grid */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-xs font-bold tracking-wider text-[#0b2138] uppercase">
            Available Stress Test Scenarios
          </h3>
          <span className="font-mono text-[11px] text-[#506e86]">6 SCENARIOS CONFIGURED</span>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {scenarios.map((sc) => {
            const status = scenarioStatuses[sc.id];
            const isActive = status === "active";
            const isCompleted = status === "completed";

            const severityBadge =
              sc.severity === "critical"
                ? "border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]"
                : sc.severity === "high"
                ? "border-[#ddd6fe] bg-[#f5f3ff] text-[#6d28d9]"
                : "border-[#fde68a] bg-[#fffbeb] text-[#b45309]";

            const statusBadge = isActive
              ? "border-[#86efac] bg-[#f0fdf4] text-[#15803d]"
              : isCompleted
              ? "border-[#bae6fd] bg-[#f0f9ff] text-[#0369a1]"
              : "border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]";

            return (
              <div
                key={sc.id}
                className={`flex flex-col justify-between rounded-xl border p-4 transition ${
                  isActive
                    ? "border-[#009bb8] bg-[#f0f9ff]/70 shadow-sm ring-1 ring-[#009bb8]/30"
                    : "border-[#d2e4f2] bg-white hover:border-[#9ecde6] hover:shadow-xs"
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-display text-sm font-bold text-[#0b2138] leading-tight">
                      {sc.title}
                    </h4>
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase ${severityBadge}`}
                    >
                      {sc.severity}
                    </span>
                  </div>

                  {/* Status Indicator */}
                  <div className="mt-2 flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold uppercase ${statusBadge}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isActive
                            ? "bg-[#16a34a] animate-pulse"
                            : isCompleted
                            ? "bg-[#0284c7]"
                            : "bg-[#94a3b8]"
                        }`}
                      />
                      {isActive
                        ? sc.isSequence
                          ? `RUNNING STAGE ${stormStep}/10`
                          : "ACTIVE"
                        : isCompleted
                        ? "COMPLETED"
                        : "INACTIVE"}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="mt-2.5 text-xs text-[#506e86] leading-relaxed">
                    {sc.description}
                  </p>

                  {/* Affected Systems Tags */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {sc.systems.map((sys) => (
                      <span
                        key={sys}
                        className="rounded bg-[#edf4fa] px-1.5 py-0.5 font-mono text-[9px] font-medium text-[#41627e]"
                      >
                        {sys}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Action Controls */}
                <div className="mt-4 pt-3 border-t border-[#edf4fa]">
                  {sc.isSequence ? (
                    <div className="space-y-2">
                      {/* Storm Sequence Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between font-mono text-[10px] text-[#506e86]">
                          <span>
                            {stormRunning
                              ? `Stage ${stormStep} of 10: ${STORM_STAGES[stormStep - 1]?.title.split(":")[1] || ""}`
                              : isCompleted
                              ? "Stage 10/10 Completed"
                              : "Sequence Standby (10 Stages)"}
                          </span>
                          <span className="font-bold text-[#0b2138]">
                            {stormRunning || isCompleted ? `${Math.min(100, stormStep * 10)}%` : "0%"}
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#e2e8f0]">
                          <div
                            className="h-full bg-[#009bb8] transition-all duration-300"
                            style={{
                              width: `${stormRunning || isCompleted ? Math.min(100, stormStep * 10) : 0}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Sequence Buttons */}
                      <div className="flex items-center gap-1.5">
                        {!stormRunning ? (
                          <button
                            onClick={() => triggerScenario("stormSequence")}
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#009bb8] px-3 py-1.5 font-mono text-[11px] font-bold text-white transition hover:bg-[#00839c]"
                          >
                            <Play className="h-3 w-3" />
                            <span>{isCompleted ? "RE-RUN SEQUENCE" : "START SEQUENCE"}</span>
                          </button>
                        ) : (
                          <>
                            {stormPaused ? (
                              <button
                                onClick={resumeStormSequence}
                                className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-[#059669] px-2 py-1.5 font-mono text-[10px] font-bold text-white transition hover:bg-[#047857]"
                                title="Resume auto-advance"
                              >
                                <Play className="h-3 w-3" />
                                <span>RESUME</span>
                              </button>
                            ) : (
                              <button
                                onClick={pauseStormSequence}
                                className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-[#d97706] px-2 py-1.5 font-mono text-[10px] font-bold text-white transition hover:bg-[#b45309]"
                                title="Pause auto-advance"
                              >
                                <Pause className="h-3 w-3" />
                                <span>PAUSE</span>
                              </button>
                            )}

                            <button
                              onClick={stepStormSequence}
                              disabled={stormStep >= 10}
                              className="flex items-center justify-center gap-1 rounded-lg border border-[#d2e4f2] bg-white px-2 py-1.5 font-mono text-[10px] font-bold text-[#0b2138] transition hover:bg-[#edf4fa] disabled:opacity-40"
                              title="Advance 1 Stage"
                            >
                              <SkipForward className="h-3 w-3" />
                              <span>STEP</span>
                            </button>

                            <button
                              onClick={stopStormSequence}
                              className="flex items-center justify-center gap-1 rounded-lg border border-[#fca5a5] bg-white px-2 py-1.5 font-mono text-[10px] font-bold text-[#dc2626] transition hover:bg-[#fef2f2]"
                              title="Abort Sequence"
                            >
                              <Square className="h-3 w-3" />
                              <span>ABORT</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => triggerScenario(sc.id)}
                      className={`w-full flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[11px] font-bold transition ${
                        isActive
                          ? "border border-[#009bb8] bg-[#e0f4f9] text-[#009bb8] hover:bg-[#d0eff6]"
                          : "bg-[#009bb8] text-white hover:bg-[#00839c]"
                      }`}
                    >
                      <Zap className="h-3 w-3" />
                      <span>{isActive ? "RE-TRIGGER SCENARIO" : "TRIGGER SCENARIO"}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Scenarios & System Impact Section */}
      <div className="rounded-2xl border border-[#d2e4f2] bg-white p-4 sm:p-5 shadow-xs">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-[#edf4fa] pb-3">
          <div>
            <h3 className="font-display text-sm font-bold tracking-tight text-[#0b2138] uppercase">
              Active Scenario Impact & Automated Safeguards
            </h3>
            <p className="text-xs text-[#506e86]">
              Real-time telemetry modifications and microgrid autonomous responses
            </p>
          </div>
          <span className="font-mono text-[10px] font-bold text-[#009bb8] bg-[#e0f4f9] px-2 py-0.5 rounded">
            SIMULATED TELEMETRY STATE
          </span>
        </div>

        {activeImpact ? (
          <div className="space-y-4">
            {/* Impact Overview Banner */}
            <div className="rounded-xl border border-[#bae6fd] bg-[#f0f9ff] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm font-bold text-[#0b2138]">
                    {activeImpact.scenarioName}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase ${
                      activeImpact.severity === "critical"
                        ? "bg-[#dc2626] text-white"
                        : activeImpact.severity === "high"
                        ? "bg-[#7c3aed] text-white"
                        : "bg-[#d97706] text-white"
                    }`}
                  >
                    {activeImpact.severity}
                  </span>
                </div>
                <p className="text-xs text-[#0369a1]">{activeImpact.summary}</p>
              </div>
              <div className="font-mono text-[10px] text-[#506e86] shrink-0 self-start sm:self-center">
                TRIGGERED: <span className="font-bold text-[#0b2138]">{activeImpact.triggeredAt}</span>
              </div>
            </div>

            {/* Changed Readings / Telemetry Deltas */}
            <div>
              <div className="mb-2 font-mono text-[10px] font-bold text-[#506e86] uppercase tracking-wider">
                Telemetry Variable Deltas (Nominal Baseline → Simulated Current)
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {activeImpact.deltas.map((d) => {
                  const dirColor =
                    d.direction === "bad"
                      ? "text-[#dc2626]"
                      : d.direction === "good"
                      ? "text-[#059669]"
                      : d.direction === "warning"
                      ? "text-[#d97706]"
                      : "text-[#0b2138]";

                  return (
                    <div
                      key={d.label}
                      className="rounded-lg border border-[#d2e4f2] bg-[#f8fbfe] p-2.5 shadow-xs"
                    >
                      <div className="font-mono text-[9px] font-bold text-[#506e86] uppercase truncate">
                        {d.label}
                      </div>
                      <div className="mt-1 flex items-baseline justify-between gap-1">
                        <span className="font-mono text-[10px] text-[#94a3b8] line-through truncate">
                          {d.before}
                        </span>
                        <ArrowRight className="h-2.5 w-2.5 text-[#94a3b8] shrink-0" />
                        <span className={`font-mono text-xs font-bold ${dirColor} truncate`}>
                          {d.after}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Affected Physical Assets */}
            <div>
              <div className="mb-2 font-mono text-[10px] font-bold text-[#506e86] uppercase tracking-wider">
                Affected Physical Assets & Component States
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {activeImpact.affectedAssets.map((asset) => {
                  const badgeStyle =
                    asset.state === "danger"
                      ? "border-[#fca5a5] bg-[#fef2f2] text-[#dc2626]"
                      : asset.state === "warning"
                      ? "border-[#fde68a] bg-[#fffbeb] text-[#b45309]"
                      : asset.state === "success"
                      ? "border-[#86efac] bg-[#f0fdf4] text-[#16a34a]"
                      : "border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]";

                  return (
                    <div
                      key={asset.name}
                      className="rounded-lg border border-[#d2e4f2] bg-white p-2.5"
                    >
                      <div className="font-medium text-xs text-[#0b2138] truncate">{asset.name}</div>
                      <div
                        className={`mt-1.5 inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold ${badgeStyle}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        <span className="truncate">{asset.status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Alerts & Automated Safeguards 2-Column Split */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-2">
              {/* Scenario Generated Alerts */}
              <div className="rounded-xl border border-[#fee2e2] bg-[#fef2f2]/60 p-3 space-y-2">
                <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-[#b91c1c] uppercase">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Current Scenario Alerts Triggered</span>
                </div>
                <div className="space-y-1.5">
                  {activeImpact.activeAlerts.map((alt, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-[#fecaca] bg-white p-2 text-xs text-[#991b1b] leading-tight"
                    >
                      • {alt}
                    </div>
                  ))}
                </div>
              </div>

              {/* Automated Safeguards Taken */}
              <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4]/60 p-3 space-y-2">
                <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-[#15803d] uppercase">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>Autonomous Safeguards Executed</span>
                </div>
                <div className="space-y-1.5">
                  {activeImpact.automatedActions.map((act, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-[#86efac] bg-white p-2 text-xs text-[#166534] leading-tight"
                    >
                      ✓ {act}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Informative Empty State */
          <div className="rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#e0f4f9] text-[#009bb8]">
              <Shield className="h-6 w-6" />
            </div>
            <h4 className="mt-3 font-display text-sm font-bold text-[#0b2138]">
              Station Operating in Nominal Baseline Equilibrium
            </h4>
            <p className="mt-1 text-xs text-[#506e86] max-w-md mx-auto">
              No stress test scenarios currently active. Select any scenario card above to inject
              simulated operational contingencies and evaluate real-time microgrid adjustments.
            </p>

            <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-3 rounded-lg border border-[#d2e4f2] bg-white px-4 py-2 font-mono text-[11px] text-[#0b2138]">
              <div>
                Grid Balance: <span className="font-bold text-[#059669]">0.00 kW residual</span>
              </div>
              <span className="text-[#cbd5e1]">•</span>
              <div>
                Frequency: <span className="font-bold text-[#0b2138]">50.02 Hz Synced</span>
              </div>
              <span className="text-[#cbd5e1]">•</span>
              <div>
                BESS Storage: <span className="font-bold text-[#009bb8]">{Math.round(telemetry.batterySoc)}% SoC</span>
              </div>
              <span className="text-[#cbd5e1]">•</span>
              <div>
                Fuel Reserves: <span className="font-bold text-[#0b2138]">{telemetry.fuelDaysLeft.toFixed(1)} Days</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Scenario Event History (Simulated Data Log) */}
      <div className="rounded-2xl border border-[#d2e4f2] bg-white p-4 sm:p-5 shadow-xs">
        <div className="mb-3 flex items-center justify-between border-b border-[#edf4fa] pb-2.5">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#506e86]" />
            <h3 className="font-display text-xs font-bold tracking-wider text-[#0b2138] uppercase">
              Scenario Event History Log
            </h3>
          </div>
          <span className="rounded bg-[#fffbeb] border border-[#fde68a] px-2 py-0.5 font-mono text-[9px] font-bold text-[#b45309]">
            SIMULATED DATA
          </span>
        </div>

        <div className="max-h-56 overflow-y-auto divide-y divide-[#edf4fa] rounded-lg border border-[#edf4fa] bg-[#f8fbfe]">
          {scenarioHistory.length === 0 ? (
            <div className="p-4 text-center text-xs text-[#94a3b8]">No events recorded yet.</div>
          ) : (
            scenarioHistory.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 text-xs transition hover:bg-white"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] text-[#506e86] shrink-0 font-medium">
                    {entry.time}
                  </span>
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.2 font-mono text-[9px] font-bold uppercase ${
                      entry.severity === "critical"
                        ? "bg-[#fee2e2] text-[#dc2626]"
                        : entry.severity === "warning"
                        ? "bg-[#fef3c7] text-[#d97706]"
                        : entry.severity === "high"
                        ? "bg-[#ede9fe] text-[#7c3aed]"
                        : "bg-[#e0f2fe] text-[#0284c7]"
                    }`}
                  >
                    {entry.action}
                  </span>
                  <span className="font-medium text-[#0b2138] truncate">{entry.scenarioName}</span>
                </div>
                <div className="text-[11px] text-[#506e86] font-mono sm:text-right truncate max-w-md">
                  {entry.detail}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Reset All Simulation Scenarios Control */}
      <div className="rounded-xl border border-[#d2e4f2] bg-[#f8fbfe] p-4 text-center">
        <button
          onClick={() => setResetDialogOpen(true)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-[#cbd5e1] bg-white px-6 py-2.5 font-mono text-xs font-bold text-[#506e86] shadow-xs transition hover:border-[#f87171] hover:bg-[#fff1f2] hover:text-[#b91c1c]"
        >
          <RotateCcw className="h-4 w-4" />
          <span>RESET ALL SIMULATION SCENARIOS TO NOMINAL</span>
        </button>
        <div className="mt-1.5 text-[10px] text-[#94a3b8]">
          Restores baseline telemetry, stops active sequences, and clears injected faults.
        </div>
      </div>

      {/* Confirmation Modal Dialog for Reset */}
      {resetDialogOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-[#0b2138]/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-[#d2e4f2] bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fef2f2] text-[#dc2626]">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-base font-bold text-[#0b2138]">
                  Confirm Scenario Reset
                </h3>
                <p className="text-xs text-[#506e86] leading-relaxed">
                  Are you sure you want to reset all simulation scenarios for{" "}
                  <span className="font-bold text-[#0b2138]">{st.fullName}</span>?
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-[#fde68a] bg-[#fffbeb] p-3 text-xs text-[#b45309] leading-relaxed">
              This will restore nominal microgrid baselines, stop any running Antarctic Storm sequences,
              disengage simulated load shedding, and clear scenario fault alerts.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setResetDialogOpen(false)}
                className="rounded-lg border border-[#d2e4f2] bg-white px-4 py-2 font-mono text-xs font-bold text-[#506e86] hover:bg-[#edf4fa] hover:text-[#0b2138]"
              >
                CANCEL
              </button>
              <button
                onClick={handleConfirmReset}
                className="rounded-lg bg-[#dc2626] px-4 py-2 font-mono text-xs font-bold text-white shadow-xs hover:bg-[#b91c1c]"
              >
                CONFIRM RESET
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
