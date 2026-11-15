// ============================================================
// SubsystemCard — health display for one outpost system
// Universal Classroom Accessibility & High-Contrast Support
// ============================================================
import { motion, AnimatePresence } from "framer-motion";
import { useAccessibility } from "../utils/AccessibilityContext";

interface SubsystemCardProps {
  label: string;
  icon: string;
  health: number;
  wearAccumulated: number;
  powerDrawMW: number;
  statusMessage: string;
  kidFriendlyStatus: string;
  kidMode: boolean;
  accentColor: string;
}

export default function SubsystemCard({
  label,
  icon,
  health,
  wearAccumulated,
  powerDrawMW,
  statusMessage,
  kidFriendlyStatus,
  kidMode,
  accentColor,
}: SubsystemCardProps) {
  const { colorblindMode, tokens, shapes } = useAccessibility();

  const color = colorblindMode
    ? health < 30
      ? tokens.danger // #f97316
      : health < 60
      ? tokens.warning // #facc15
      : tokens.nominal // #0284c7
    : health < 30
    ? "#ef4444"
    : health < 60
    ? "#eab308"
    : "#10b981";

  const hLabel =
    health < 30
      ? `${shapes.brownout} CRITICAL`
      : health < 60
      ? `${shapes.warning} WARNING`
      : health < 80
      ? `${shapes.surplus} FAIR`
      : `${shapes.nominal} NOMINAL`;

  const wearPct = Math.round(wearAccumulated * 100);

  return (
    <div
      className={`glass-panel p-4 flex flex-col gap-3 ${
        colorblindMode ? "border-slate-700/80" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">{icon}</span>
          <span className="font-bold text-sm text-slate-100">{label}</span>
        </div>
        <span
          className="text-xs font-bold font-mono px-2 py-0.5 rounded-full border border-white/10"
          style={{ backgroundColor: `${color}30`, color }}
        >
          {hLabel}
        </span>
      </div>

      {/* Health bar */}
      <div>
        <div className="flex justify-between text-xs text-slate-400 mb-1 font-mono">
          <span>Health</span>
          <span className="font-bold" style={{ color }}>
            {health.toFixed(0)}%
          </span>
        </div>
        <div className="h-3 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
            animate={{ width: `${health}%` }}
            transition={{ type: "spring", stiffness: 180, damping: 28 }}
          />
        </div>
      </div>

      {/* Wear bar */}
      <div>
        <div className="flex justify-between text-xs text-slate-400 mb-1 font-mono">
          <span>Wear & Tear</span>
          <span style={{ color: wearPct > 60 ? "#f97316" : "#94a3b8" }}>
            {wearPct}%
          </span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-orange-400"
            animate={{ width: `${wearPct}%` }}
            transition={{ type: "spring", stiffness: 180, damping: 28 }}
          />
        </div>
      </div>

      {/* Power row */}
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-slate-400">Power Draw</span>
        <span className="font-bold" style={{ color: colorblindMode && accentColor.toLowerCase().includes("10b981") ? tokens.nominal : accentColor }}>
          {powerDrawMW} MW
        </span>
      </div>

      {/* Status message */}
      <AnimatePresence mode="wait">
        <motion.p
          key={kidMode ? kidFriendlyStatus : statusMessage}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="text-xs text-slate-300 leading-relaxed border-t border-white/5 pt-2"
        >
          {kidMode ? kidFriendlyStatus : statusMessage}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
