// ============================================================
// AlertBanner — displays mission alerts with trade-off context
// ============================================================
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Info, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { MissionAlert } from "../engine/simulationEngine";

interface AlertBannerProps {
  alerts: MissionAlert[];
  kidMode: boolean;
}

function AlertItem({ alert, kidMode }: { alert: MissionAlert; kidMode: boolean }) {
  const [expanded, setExpanded] = useState(false);

  const styles = {
    critical: {
      border: "border-red-500/40",
      bg: "bg-red-500/10",
      icon: <XCircle size={16} className="text-red-400 shrink-0" />,
      headingColor: "text-red-300",
    },
    warning: {
      border: "border-yellow-500/40",
      bg: "bg-yellow-500/10",
      icon: <AlertTriangle size={16} className="text-yellow-400 shrink-0" />,
      headingColor: "text-yellow-300",
    },
    info: {
      border: "border-blue-500/40",
      bg: "bg-blue-500/10",
      icon: <Info size={16} className="text-blue-400 shrink-0" />,
      headingColor: "text-blue-300",
    },
  }[alert.severity];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`rounded-xl border p-3 ${styles.border} ${styles.bg}`}
    >
      <button
        className="w-full flex items-start gap-2 text-left"
        onClick={() => setExpanded((p) => !p)}
      >
        {styles.icon}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold ${styles.headingColor}`}>{alert.headline}</p>
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
            {kidMode ? alert.kidFriendlyExplanation : alert.detail}
          </p>
        </div>
        <span className="text-slate-500 shrink-0">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-white/10">
              {!kidMode && (
                <>
                  <p className="text-xs text-slate-300 mb-2">{alert.detail}</p>
                  {alert.tradeOffExplanation && (
                    <div className="bg-white/5 rounded-lg p-2">
                      <p className="text-xs text-slate-400 font-semibold mb-1">
                        ⚖️ Engineering Trade-Off
                      </p>
                      <p className="text-xs text-slate-300">{alert.tradeOffExplanation}</p>
                    </div>
                  )}
                </>
              )}
              {kidMode && alert.tradeOffExplanation && (
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="text-xs text-slate-400 font-semibold mb-1">🤔 Why did this happen?</p>
                  <p className="text-xs text-slate-300">{alert.kidFriendlyExplanation}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function AlertBanner({ alerts, kidMode }: AlertBannerProps) {
  if (alerts.length === 0) return null;

  const sorted = [...alerts].sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <div className="flex flex-col gap-2">
      <AnimatePresence>
        {sorted.map((alert, i) => (
          <AlertItem key={`${alert.subsystem}-${alert.severity}-${i}`} alert={alert} kidMode={kidMode} />
        ))}
      </AnimatePresence>
    </div>
  );
}
