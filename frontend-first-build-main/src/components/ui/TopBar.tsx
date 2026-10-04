import { useEffect, useState } from "react";
import {
  ChevronDown,
  Activity,
  Layers,
  Radio,
  Clock,
  CloudSun,
  Bell,
  Zap,
  Building2,
  Mountain,
  Truck,
  Cpu,
  BarChart3,
} from "lucide-react";
import { STATIONS } from "../../lib/sim/stations";
import { useSim } from "../../lib/sim/store";

function fmtSim(h: number) {
  const hh = Math.floor(h) % 24;
  const mm = Math.floor((h % 1) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export type NavTab = "overview" | "energy" | "infrastructure" | "environment" | "logistics" | "alerts" | "simulation";

interface TopBarProps {
  activeTab?: NavTab;
  onSelectTab?: (tab: NavTab) => void;
}

export function TopBar({ activeTab = "overview", onSelectTab }: TopBarProps) {
  const stationId = useSim((s) => s.stationId);
  const setStation = useSim((s) => s.setStation);
  const telemetry = useSim((s) => s.telemetry);
  const simHour = useSim((s) => s.simHour);
  const alerts = useSim((s) => s.alerts);
  const setCameraMode = useSim((s) => s.setCameraMode);
  const focusOn = useSim((s) => s.focusOn);
  const setDashboardOpen = useSim((s) => s.setDashboardOpen);
  const dashboardOpen = useSim((s) => s.dashboardOpen);
  const openDashboardTo = useSim((s) => s.openDashboardTo);
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const st = STATIONS[stationId];
  const crit = alerts.filter((a) => a.level === "critical").length;
  const warn = alerts.filter((a) => a.level === "warning").length;

  const handleNavClick = (tab: NavTab) => {
    onSelectTab?.(tab);
    if (tab === "overview") {
      setCameraMode("overview");
      setDashboardOpen(false);
    } else if (tab === "energy") {
      setCameraMode("energy");
      openDashboardTo("Energy");
    } else if (tab === "infrastructure") {
      setCameraMode("infrastructure");
      openDashboardTo("Infrastructure");
    } else if (tab === "environment") {
      setCameraMode("environment");
      focusOn("weather");
      openDashboardTo("Environment");
    } else if (tab === "logistics") {
      setCameraMode("logistics");
      openDashboardTo("Logistics");
    } else if (tab === "alerts") {
      openDashboardTo("Alerts");
    } else if (tab === "simulation") {
      openDashboardTo("Simulation");
    }
  };

  return (
    <header className="pointer-events-auto shrink-0 border-b border-[#d2e4f2] bg-white px-3 py-1.5 shadow-[0_1px_3px_rgba(11,33,56,0.04)]">
      {/* Main Bar: Brand, Station Selector, Desktop Nav, and Compact Status */}
      <div className="flex items-center justify-between gap-2">
        {/* Brand & Organization */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-[#009bb8] text-white shadow-xs">
            <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="font-display text-xs font-bold tracking-wider text-[#0b2138]">
                NOVARA
              </span>
              <span className="text-[#a5c2d8]">|</span>
              <span className="font-display text-[10px] sm:text-[11px] font-semibold tracking-wider text-[#009bb8]">
                <span className="hidden sm:inline">ANTARCTIC </span>DIGITAL TWIN
              </span>
            </div>
            <div className="text-[8px] sm:text-[9px] font-medium tracking-wider text-[#506e86] leading-none">
              MoES · NCPOR <span className="text-[#88a5be] font-normal hidden sm:inline">| Polar Operations</span>
            </div>
          </div>
        </div>

        {/* Station Selector Dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1 sm:gap-1.5 rounded-md border border-[#cde0ee] bg-[#f0f7fc] px-1.5 sm:px-2 py-1 font-display text-[10px] sm:text-[11px] font-bold tracking-wider text-[#0b2138] transition hover:border-[#009bb8] hover:bg-[#e6f4fa]"
            title="Switch Antarctic Research Station"
          >
            <span className="h-2 w-2 rounded-full bg-[#059669]" />
            <span><span className="hidden sm:inline">STATION: </span>{st.name.toUpperCase()}</span>
            <span className="hidden md:inline rounded bg-[#e0f0fa] px-1 py-0.2 text-[8px] font-normal text-[#506e86]">
              OPERATIONAL
            </span>
            <ChevronDown className="h-3 w-3 text-[#506e86]" />
          </button>
          {open && (
            <>
              {/* Click-away backdrop */}
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border border-[#cde0ee] bg-white p-1 shadow-xl animate-in fade-in zoom-in-95">
                {(["maitri", "bharati"] as const).map((id) => (
                  <button
                    key={id}
                    onClick={() => {
                      setStation(id);
                      setOpen(false);
                    }}
                    className={`flex w-full flex-col rounded-md px-2.5 py-1.5 text-left transition hover:bg-[#f0f7fc] ${
                      id === stationId ? "border border-[#b6dbee] bg-[#f4fafd]" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between font-display text-xs font-bold text-[#0b2138]">
                      <span>{STATIONS[id].fullName.toUpperCase()}</span>
                      {id === stationId && (
                        <span className="text-[9px] font-semibold text-[#009bb8]">ACTIVE</span>
                      )}
                    </div>
                    <div className="mt-0.5 font-mono text-[8px] text-[#506e86]">
                      {STATIONS[id].coordinates} · {STATIONS[id].elevation}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Desktop Navigation Tabs (Visible on XL screens) */}
        <nav className="hidden 2xl:flex items-center gap-0.5">
          {[
            { id: "overview", label: "OVERVIEW", icon: Layers },
            { id: "energy", label: "ENERGY", icon: Zap },
            { id: "infrastructure", label: "INFRASTRUCTURE", icon: Building2 },
            { id: "environment", label: "ENVIRONMENT", icon: Mountain },
            { id: "logistics", label: "LOGISTICS", icon: Truck },
            { id: "alerts", label: "ALERTS", icon: Bell, badge: alerts.length },
            { id: "simulation", label: "SIMULATION", icon: Cpu },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleNavClick(tab.id as NavTab)}
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-display font-semibold tracking-wider transition ${
                  active
                    ? "border border-[#009bb8] bg-[#e0f4f9] text-[#009bb8]"
                    : "border border-transparent text-[#506e86] hover:bg-[#f0f7fc] hover:text-[#0b2138]"
                }`}
                title={`Open ${tab.label} view`}
              >
                <Icon className="h-3 w-3" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[8px] font-mono ${
                      active ? "bg-[#009bb8] text-white" : "bg-[#d2e4f2] text-[#0b2138]"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Compact Mission Control Status Area */}
        <div className="flex items-center gap-1.5 text-[10px] shrink-0">
          {/* Simulation Mode Label */}
          <div className="flex items-center gap-1 rounded-md border border-[#fde68a] bg-[#fef3c7] px-2 py-0.5 text-[#b45309]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#d97706]" />
            <span className="font-mono text-[9px] font-bold tracking-wider">
              SIMULATION MODE
            </span>
          </div>

          {/* Connection Status: Dark Navy Pill */}
          <div className="hidden lg:flex items-center gap-1 rounded-md bg-[#0b1e33] px-2 py-0.5 text-[#38bdf8]">
            <Radio className="h-2.5 w-2.5" />
            <span className="font-mono text-[9px] font-semibold tracking-wider">
              PLC: 120ms
            </span>
          </div>

          {/* Time: Sim & UTC */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-md border border-[#d2e4f2] bg-[#f0f7fc] px-2 py-0.5 text-[#0b2138]">
            <Clock className="h-2.5 w-2.5 text-[#506e86]" />
            <span className="font-mono text-[9px]">
              <span className="text-[#506e86]">SIM </span>
              <strong className="text-[#0b2138]">{fmtSim(simHour)}</strong>
              <span className="text-[#a5c2d8]"> · </span>
              <span className="text-[#506e86]">UTC </span>
              <strong className="text-[#0b2138]">{now.toUTCString().slice(17, 22)}</strong>
            </span>
          </div>

          {/* Weather status */}
          <button
            onClick={() => {
              setCameraMode("environment");
              focusOn("weather");
            }}
            className="hidden xl:flex items-center gap-1 rounded-md border border-[#d2e4f2] bg-[#f0f7fc] px-2 py-0.5 text-[#0b2138] hover:border-[#009bb8]"
            title="Focus meteorological mast in 3D"
          >
            <CloudSun className="h-3 w-3 text-[#009bb8]" />
            <span className="font-mono text-[9px]">
              {telemetry.temperature.toFixed(1)}°C · {Math.round(telemetry.windSpeed)} m/s
            </span>
          </button>

          {/* Active Alerts Pill Button */}
          <button
            onClick={() => openDashboardTo("Alerts")}
            className="flex items-center gap-1 transition"
            title="Open Alerts management center"
          >
            {crit > 0 ? (
              <span className="flex items-center gap-1 rounded-md border border-[#fca5a5] bg-[#fee2e2] px-2 py-0.5 font-mono text-[9px] font-bold text-[#dc2626]">
                <Bell className="h-2.5 w-2.5" />
                {crit} CRIT
              </span>
            ) : warn > 0 ? (
              <span className="flex items-center gap-1 rounded-md border border-[#fde68a] bg-[#fef3c7] px-2 py-0.5 font-mono text-[9px] font-bold text-[#b45309]">
                <Bell className="h-2.5 w-2.5" />
                {warn} WARN
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-md border border-[#a7f3d0] bg-[#ecfdf5] px-2 py-0.5 font-mono text-[9px] font-bold text-[#059669]">
                NOMINAL
              </span>
            )}
          </button>

          {/* Detailed Analytics Button */}
          <button
            onClick={() => setDashboardOpen(!dashboardOpen)}
            className={`flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium transition ${
              dashboardOpen
                ? "border-[#009bb8] bg-[#009bb8] text-white"
                : "border-[#d2e4f2] bg-white text-[#0b2138] hover:border-[#009bb8] hover:bg-[#f0f7fc]"
            }`}
            title="Open comprehensive 3-layer analytics and Recharts telemetry"
          >
            <BarChart3 className="h-3 w-3" />
            <span className="hidden sm:inline font-display tracking-wider">ANALYTICS</span>
          </button>
        </div>
      </div>

      {/* Responsive Horizontal Navigation Ribbon (Below 2xl, scrollable without wrapping or colliding) */}
      <nav className="flex 2xl:hidden items-center gap-1 overflow-x-auto no-scrollbar pt-1.5 pb-0.5 border-t border-[#edf4fa] mt-1.5">
        {[
          { id: "overview", label: "OVERVIEW", icon: Layers },
          { id: "energy", label: "ENERGY", icon: Zap },
          { id: "infrastructure", label: "INFRASTRUCTURE", icon: Building2 },
          { id: "environment", label: "ENVIRONMENT", icon: Mountain },
          { id: "logistics", label: "LOGISTICS", icon: Truck },
          { id: "alerts", label: "ALERTS", icon: Bell, badge: alerts.length },
          { id: "simulation", label: "SIMULATION", icon: Cpu },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleNavClick(tab.id as NavTab)}
              className={`flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-display font-semibold tracking-wider transition ${
                active
                  ? "border border-[#009bb8] bg-[#e0f4f9] text-[#009bb8]"
                  : "border border-transparent text-[#506e86] hover:bg-[#f0f7fc] hover:text-[#0b2138]"
              }`}
              title={`Open ${tab.label} view`}
            >
              <Icon className="h-3 w-3" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[8px] font-mono ${
                    active ? "bg-[#009bb8] text-white" : "bg-[#d2e4f2] text-[#0b2138]"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
