import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopBar, type NavTab } from "../components/ui/TopBar";
import { CriticalAlertBanner } from "../components/ui/CriticalAlertBanner";
import { TwinViewport } from "../components/ui/TwinViewport";
import { EnergyBalancePanel } from "../components/ui/EnergyBalancePanel";
import { BatteryFuelPanel } from "../components/ui/BatteryFuelPanel";
import { EnvironmentSitePanel } from "../components/ui/EnvironmentSitePanel";
import { AIOptimizerPanel } from "../components/ui/AIOptimizerPanel";
import { Dashboard } from "../components/dashboard/Dashboard";
import { useSim } from "../lib/sim/store";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "NOVARA | ANTARCTIC DIGITAL TWIN" },
      {
        name: "description",
        content:
          "NOVARA — Antarctic Digital Twin for India's research stations Maitri & Bharati (MoES / NCPOR). 3D simulation, simulated microgrid balancing, polar synoptics, and automated incident response.",
      },
      { property: "og:title", content: "NOVARA | ANTARCTIC DIGITAL TWIN" },
      {
        property: "og:description",
        content:
          "Antarctic Digital Twin remote operations platform for Maitri & Bharati research stations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const tick = useSim((s) => s.tick);
  const [activeTab, setActiveTab] = useState<NavTab>("overview");
  const [tabletView, setTabletView] = useState<"twin" | "energy" | "battery" | "environment" | "ai">("twin");

  // Simulation clock ticker
  useEffect(() => {
    const id = setInterval(() => tick(), 2000);
    return () => clearInterval(id);
  }, [tick]);

  // Demo auto-advance loop
  useEffect(() => {
    const id = setInterval(() => {
      const s = useSim.getState();
      if (s.demoRunning) s.advanceDemo();
    }, 4500);
    return () => clearInterval(id);
  }, []);

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    if (tab === "energy") setTabletView("energy");
    else if (tab === "environment") setTabletView("environment");
    else if (tab === "simulation") setTabletView("ai");
    else setTabletView("twin");
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#ebf5fb] text-[#0b2138] p-0 m-0">
      {/* Header (TopBar) */}
      <TopBar activeTab={activeTab} onSelectTab={handleSelectTab} />

      {/* Critical Alert Banner (Only appears during critical conditions) */}
      <CriticalAlertBanner />

      {/* Main Mission Control Grid - Fills remaining viewport height */}
      <main className="relative flex-1 min-h-0 w-full p-2 overflow-hidden flex flex-col">
        {/* Tablet / Mobile Screen View Switcher with overflow protection */}
        <div className="mb-1.5 flex xl:hidden items-center gap-1 overflow-x-auto no-scrollbar rounded-lg border border-[#d2e4f2] bg-white p-1 shrink-0">
          {[
            { id: "twin", label: "3D TWIN", full: "3D DIGITAL TWIN" },
            { id: "energy", label: "ENERGY", full: "ENERGY & GRID" },
            { id: "battery", label: "STORAGE", full: "STORAGE & FUEL" },
            { id: "environment", label: "WEATHER", full: "WEATHER & RADAR" },
            { id: "ai", label: "AI & FAULTS", full: "AI & FAULTS" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTabletView(item.id as typeof tabletView)}
              className={`flex-1 min-w-[70px] shrink-0 rounded-md px-2 py-1 text-[9px] font-mono font-bold transition text-center whitespace-nowrap ${
                tabletView === item.id
                  ? "bg-[#009bb8] text-white shadow-xs"
                  : "text-[#506e86] hover:bg-[#f0f7fc]"
              }`}
            >
              <span className="sm:hidden">{item.label}</span>
              <span className="hidden sm:inline">{item.full}</span>
            </button>
          ))}
        </div>

        {/* 5-Block Grid Layout: Left 2 Stacked Cards, Center 3D Hero Viewport, Right 2 Stacked Cards */}
        <div className="grid h-full w-full gap-2 grid-cols-1 xl:grid-cols-[290px_minmax(0,1fr)_290px] 2xl:grid-cols-[320px_minmax(0,1fr)_320px] min-h-0">
          {/* Left Column: Stacked Energy Balance & Battery/Fuel Panels */}
          <div
            className={`flex flex-col gap-2 h-full min-h-0 overflow-hidden ${
              tabletView === "energy" || tabletView === "battery" ? "flex" : "hidden xl:flex"
            }`}
          >
            <div className={`flex-1 min-h-0 overflow-hidden ${tabletView === "battery" ? "hidden xl:block" : "block"}`}>
              <EnergyBalancePanel />
            </div>
            <div className={`flex-1 min-h-0 overflow-hidden ${tabletView === "energy" ? "hidden xl:block" : "block"}`}>
              <BatteryFuelPanel />
            </div>
          </div>

          {/* Center Column: Prominent 3D Simulation Viewport */}
          <div
            className={`h-full min-h-0 flex-1 overflow-hidden ${
              tabletView === "twin" ? "block" : "hidden xl:block"
            }`}
          >
            <TwinViewport />
          </div>

          {/* Right Column: Stacked Environment & AI/Incident Panels */}
          <div
            className={`flex flex-col gap-2 h-full min-h-0 overflow-hidden ${
              tabletView === "environment" || tabletView === "ai" ? "flex" : "hidden xl:flex"
            }`}
          >
            <div className={`flex-1 min-h-0 overflow-hidden ${tabletView === "ai" ? "hidden xl:block" : "block"}`}>
              <EnvironmentSitePanel />
            </div>
            <div className={`flex-1 min-h-0 overflow-hidden ${tabletView === "environment" ? "hidden xl:block" : "block"}`}>
              <AIOptimizerPanel />
            </div>
          </div>
        </div>
      </main>

      {/* 3-Layer Analytics Detailed Modal (Opens via TopBar, nav tabs, or alert inspection) */}
      <Dashboard />
    </div>
  );
}
