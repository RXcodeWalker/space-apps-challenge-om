// ============================================================
// AlertBanner — displays mission alerts with trade-off context
// and Interactive "Why Did This Happen?" Root Cause Drill-Down
// ============================================================
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Info, XCircle, ChevronDown, ChevronUp, Search } from "lucide-react";
import { useState } from "react";
import type { MissionAlert } from "../engine/simulationEngine";
import { soundEffects } from "../utils/soundEffects";

interface AlertBannerProps {
  alerts: MissionAlert[];
  kidMode: boolean;
  onInspectRootCause?: (alert: MissionAlert) => void;
}

function isBrownoutOrLifeSupportAlert(alert: MissionAlert): boolean {
  const text = `${alert.headline} ${alert.detail} ${alert.subsystem}`.toLowerCase();
  return (
    alert.subsystem === "power" ||
    alert.subsystem === "lifeSupport" ||
    alert.subsystem === "crew" ||
    alert.subsystem === "radiationShielding" ||
    text.includes("over-budget") ||
    text.includes("brownout") ||
    text.includes("power") ||
    text.includes("life support") ||
    text.includes("oxygen") ||
    text.includes("o₂") ||
    alert.severity === "critical"
  );
}

function AlertItem({
  alert,
  kidMode,
  onInspectRootCause,
}: {
  alert: MissionAlert;
  kidMode: boolean;
  onInspectRootCause?: (alert: MissionAlert) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isEligibleForDrillDown = isBrownoutOrLifeSupportAlert(alert);

  const styles = {
    critical: {
      border: "border-red-500/40",
      bg: "bg-red-500/10",
      icon: <XCircle size={16} className="text-red-400 shrink-0" />,
      headingColor: "text-red-300",
      pillBg: "bg-red-950/80 text-red-300 border-red-500/40",
    },
    warning: {
      border: "border-yellow-500/40",
      bg: "bg-yellow-500/10",
      icon: <AlertTriangle size={16} className="text-yellow-400 shrink-0" />,
      headingColor: "text-yellow-300",
      pillBg: "bg-amber-950/80 text-amber-300 border-amber-500/40",
    },
    info: {
      border: "border-blue-500/40",
      bg: "bg-blue-500/10",
      icon: <Info size={16} className="text-blue-400 shrink-0" />,
      headingColor: "text-blue-300",
      pillBg: "bg-blue-950/80 text-blue-300 border-blue-500/40",
    },
  }[alert.severity];

  const handleInspect = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundEffects.playButtonClick();
    if (onInspectRootCause) {
      onInspectRootCause(alert);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`rounded-xl border p-3 ${styles.border} ${styles.bg} transition-all`}
    >
      <div className="w-full flex items-start justify-between gap-2">
        <button
          className="flex-1 flex items-start gap-2 text-left"
          onClick={() => setExpanded((p) => !p)}
        >
          {styles.icon}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className={`text-sm font-bold ${styles.headingColor}`}>{alert.headline}</p>
              {isEligibleForDrillDown && (
                <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-red-900/50 text-red-300 border border-red-600/30">
                  {alert.subsystem === "power" ? "Brownout Risk" : "Anomaly"}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">
              {kidMode ? alert.kidFriendlyExplanation : alert.detail}
            </p>
          </div>
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Quick "Inspect Root Cause" button right on the alert */}
          {onInspectRootCause && isEligibleForDrillDown && (
            <button
              type="button"
              onClick={handleInspect}
              className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-red-600 to-amber-600 hover:brightness-110 active:scale-95 text-white font-mono font-bold text-[11px] flex items-center gap-1 shadow-md shadow-red-950/50 border border-red-300/40 transition-all shrink-0"
              title="Inspect Root Cause & NASA Mission Logs"
            >
              <Search size={11} className="shrink-0" />
              <span className="hidden sm:inline">Inspect Root Cause</span>
              <span className="sm:hidden">Inspect</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setExpanded((p) => !p)}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
            title={expanded ? "Collapse details" : "Expand details"}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-white/10 flex flex-col gap-2">
              {!kidMode && (
                <>
                  <p className="text-xs text-slate-300 mb-1">{alert.detail}</p>
                  {alert.tradeOffExplanation && (
                    <div className="bg-white/5 rounded-lg p-2.5 border border-white/5">
                      <p className="text-xs text-slate-400 font-semibold mb-1">
                        ⚖️ Engineering Trade-Off:
                      </p>
                      <p className="text-xs text-slate-300">{alert.tradeOffExplanation}</p>
                    </div>
                  )}
                </>
              )}
              {kidMode && alert.tradeOffExplanation && (
                <div className="bg-white/5 rounded-lg p-2.5 border border-white/5">
                  <p className="text-xs text-slate-400 font-semibold mb-1">
                    🤔 Why did this happen?
                  </p>
                  <p className="text-xs text-slate-300">{alert.kidFriendlyExplanation}</p>
                </div>
              )}

              {/* Full Drill-down CTA Button inside accordion */}
              {onInspectRootCause && isEligibleForDrillDown && (
                <button
                  type="button"
                  onClick={handleInspect}
                  className="mt-1 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:brightness-110 active:scale-98 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-950/50 border border-red-300/40 transition-all"
                >
                  <Search size={13} />
                  <span>Inspect Root Cause (Why Did This Happen? · NASA Flight Logs)</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function AlertBanner({ alerts, kidMode, onInspectRootCause }: AlertBannerProps) {
  if (alerts.length === 0) return null;

  const sorted = [...alerts].sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <div className="flex flex-col gap-2">
      <AnimatePresence>
        {sorted.map((alert, i) => (
          <AlertItem
            key={`${alert.subsystem}-${alert.severity}-${i}`}
            alert={alert}
            kidMode={kidMode}
            onInspectRootCause={onInspectRootCause}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
