import { Sparkles, AlertTriangle, RotateCcw, CheckCircle, Bell, X, Eye } from "lucide-react";
import { useSim, type AlertLevel } from "../../lib/sim/store";

const colors: Record<AlertLevel, { text: string; bg: string; border: string }> = {
  critical: { text: "text-[#dc2626]", bg: "bg-[#fee2e2]", border: "border-[#fca5a5]" },
  warning: { text: "text-[#b45309]", bg: "bg-[#fef3c7]", border: "border-[#fde68a]" },
  notice: { text: "text-[#009bb8]", bg: "bg-[#e0f4f9]", border: "border-[#b9e6f3]" },
  info: { text: "text-[#059669]", bg: "bg-[#ecfdf5]", border: "border-[#a7f3d0]" },
};

export function AIOptimizerPanel() {
  const aiMessages = useSim((s) => s.aiMessages);
  const alerts = useSim((s) => s.alerts);
  const simulateFailure = useSim((s) => s.simulateFailure);
  const resetFailures = useSim((s) => s.resetFailures);
  const focusOn = useSim((s) => s.focusOn);
  const dismissAlert = useSim((s) => s.dismissAlert);
  const executeAiAction = useSim((s) => s.executeAiAction);

  return (
    <div className="flex h-full w-full flex-col justify-between rounded-xl border border-[#d2e4f2] bg-white p-3 shadow-xs overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[#edf4fa] pb-1.5 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[#e0f4f9] text-[#009bb8]">
            <Sparkles className="h-3 w-3" />
          </div>
          <span className="font-display text-[11px] font-bold tracking-wider text-[#0b2138]">
            AI ADVISORY & INCIDENTS
          </span>
        </div>
        <span className="rounded bg-[#fef3c7] px-1.5 py-0.2 font-mono text-[8px] font-bold text-[#b45309]">
          RULE ENGINE
        </span>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-2 py-2 pr-0.5">
        {/* Active AI Recommendation Card */}
        <div className="rounded-lg border border-[#d2e4f2] bg-[#f8fbfe] p-2">
          {aiMessages.length > 0 ? (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-[#b45309]">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                <span>{aiMessages[0]?.title}</span>
              </div>
              <p className="text-[10px] leading-tight text-[#506e86]">{aiMessages[0]?.body}</p>
              {aiMessages[0]?.actions && aiMessages[0].actions.length > 0 && (
                <div className="mt-1.5">
                  <div className="font-mono text-[8px] font-bold uppercase tracking-wider text-[#506e86] mb-1">
                    Click action to execute:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {aiMessages[0].actions.map((act, i) => (
                      <button
                        key={i}
                        onClick={() => executeAiAction(act)}
                        className="rounded border border-[#b9e6f3] bg-white px-2 py-0.5 text-left font-mono text-[9px] font-bold text-[#009bb8] transition hover:bg-[#e0f4f9] hover:border-[#009bb8]"
                        title={`Execute: ${act}`}
                      >
                        ⚡ {act}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[10px] text-[#059669]">
              <CheckCircle className="h-3.5 w-3.5 shrink-0" />
              <span>All microgrid thermodynamic boundaries within nominal envelope.</span>
            </div>
          )}
        </div>

        {/* Alerts Log with Dismiss & 3D Focus Actions */}
        <div>
          <div className="mb-1 flex items-center justify-between font-mono text-[9px] text-[#506e86]">
            <span>ACTIVE INCIDENTS ({alerts.length})</span>
            <span>Click to locate in 3D</span>
          </div>
          <div className="space-y-1">
            {alerts.length === 0 ? (
              <div className="rounded border border-[#a7f3d0] bg-[#ecfdf5] p-1.5 text-center font-mono text-[9px] text-[#059669]">
                Zero active faults. All systems nominal.
              </div>
            ) : (
              alerts.slice(0, 3).map((a) => {
                const style = colors[a.level];
                return (
                  <div
                    key={a.id}
                    className={`flex items-center justify-between gap-1 rounded border ${style.border} ${style.bg} p-1.5 text-[9px]`}
                  >
                    <button
                      onClick={() => a.target && focusOn(a.target)}
                      className="flex flex-1 items-center gap-1 text-left font-mono hover:underline truncate"
                      title={a.target ? `Focus ${a.target} in 3D` : a.title}
                    >
                      <Eye className="h-3 w-3 shrink-0 text-[#009bb8]" />
                      <span className={`font-bold ${style.text}`}>{a.level.toUpperCase()}:</span>
                      <span className="truncate text-[#0b2138]">{a.title}</span>
                    </button>
                    <div className="flex items-center gap-1 shrink-0 font-mono text-[8px]">
                      <span className="text-[#506e86]">{a.time}</span>
                      <button
                        onClick={() => dismissAlert(a.id)}
                        className="rounded p-0.5 text-[#506e86] hover:bg-white hover:text-[#dc2626]"
                        title="Dismiss alert"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Scenario Injection Toolbar */}
      <div className="border-t border-[#edf4fa] pt-1.5 shrink-0">
        <div className="mb-1 flex items-center justify-between text-[9px] font-mono text-[#506e86]">
          <span className="font-bold">FAULT INJECTION BENCH</span>
          <span>SIMULATION MODE</span>
        </div>
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => simulateFailure("generator")}
            className="rounded border border-[#fca5a5] bg-[#fff5f5] py-1 font-mono text-[9px] font-bold text-[#dc2626] transition hover:bg-[#fee2e2]"
          >
            TRIP GEN 1
          </button>
          <button
            onClick={() => simulateFailure("battery")}
            className="rounded border border-[#fca5a5] bg-[#fff5f5] py-1 font-mono text-[9px] font-bold text-[#dc2626] transition hover:bg-[#fee2e2]"
          >
            BATT FAULT
          </button>
          <button
            onClick={() => simulateFailure("fuel")}
            className="rounded border border-[#fde68a] bg-[#fffbeb] py-1 font-mono text-[9px] font-bold text-[#b45309] transition hover:bg-[#fef3c7]"
          >
            LOW FUEL
          </button>
          <button
            onClick={() => simulateFailure("blizzard")}
            className="rounded border border-[#b9e6f3] bg-[#f0faff] py-1 font-mono text-[9px] font-bold text-[#009bb8] transition hover:bg-[#e0f4f9]"
          >
            BLIZZARD GALE
          </button>
        </div>

        <button
          onClick={resetFailures}
          className="mt-1 flex w-full items-center justify-center gap-1 rounded border border-[#d2e4f2] bg-[#f8fbfe] py-0.5 font-mono text-[9px] font-bold text-[#506e86] transition hover:border-[#009bb8] hover:text-[#0b2138]"
        >
          <RotateCcw className="h-2.5 w-2.5" />
          <span>RESET ALL SCENARIOS</span>
        </button>
      </div>
    </div>
  );
}
