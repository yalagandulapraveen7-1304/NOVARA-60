import { AlertTriangle, AlertCircle, Info, Bell, Sparkles } from "lucide-react";
import { useSim, type AlertLevel } from "../../lib/sim/store";

const icons: Record<AlertLevel, typeof AlertTriangle> = {
  critical: AlertCircle,
  warning: AlertTriangle,
  notice: Bell,
  info: Info,
};
const colors: Record<AlertLevel, string> = {
  critical: "text-destructive",
  warning: "text-warning",
  notice: "text-notice",
  info: "text-primary",
};

export function AlertsPanel() {
  const alerts = useSim((s) => s.alerts);
  const focusOn = useSim((s) => s.focusOn);
  const aiMessages = useSim((s) => s.aiMessages);

  return (
    <div className="pointer-events-auto absolute right-4 top-[4.5rem] z-20 flex w-80 flex-col gap-3">
      {/* AI Optimizer */}
      <div className="rounded-md border border-border bg-panel/95 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="font-display text-[11px] font-semibold tracking-[0.18em] text-foreground">AI ENERGY & OPERATIONS OPTIMIZER</span>
          <span className="ml-auto rounded-sm bg-primary/15 px-1.5 py-0.5 font-mono text-[8px] tracking-widest text-primary">AI SIMULATION</span>
        </div>
        <div className="max-h-44 space-y-2 overflow-y-auto p-3">
          {aiMessages.map((m, i) => (
            <div key={i} className="rounded-sm border border-border/60 bg-secondary/50 p-2.5">
              <div className="font-mono text-[10px] font-semibold tracking-wider text-warning">{m.title}</div>
              <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">{m.body}</p>
              <ul className="mt-1.5 space-y-0.5">
                {m.actions.map((a, j) => (
                  <li key={j} className="flex items-center gap-1.5 text-[10.5px] text-foreground">
                    <span className="h-1 w-1 rounded-full bg-primary" /> {a}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      <div className="rounded-md border border-border bg-panel/95 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Bell className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-display text-[11px] font-semibold tracking-[0.18em] text-foreground">ALERTS</span>
          <span className="ml-auto font-mono text-[10px] text-muted-foreground">{alerts.length}</span>
        </div>
        <div className="max-h-56 space-y-1.5 overflow-y-auto p-2">
          {alerts.map((a) => {
            const Icon = icons[a.level];
            return (
              <button
                key={a.id}
                onClick={() => a.target && focusOn(a.target)}
                className="flex w-full items-start gap-2 rounded-sm border border-transparent p-2 text-left hover:border-border hover:bg-accent"
                title={a.target ? "Click to focus asset in 3D" : undefined}
              >
                <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${colors[a.level]}`} />
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className={`font-mono text-[10px] font-semibold tracking-wider ${colors[a.level]}`}>{a.level.toUpperCase()}</span>
                    <span className="font-mono text-[9px] text-muted-foreground">{a.time}</span>
                  </div>
                  <div className="text-[11px] font-medium text-foreground">{a.title}</div>
                  <div className="text-[10px] leading-snug text-muted-foreground">{a.detail}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
