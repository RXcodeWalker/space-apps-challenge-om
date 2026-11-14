// ============================================================
// SubsystemCard — health display for one outpost system
// ============================================================
import { motion, AnimatePresence } from "framer-motion";

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

function healthColor(health: number): string {
  if (health < 30) return "#ef4444";
  if (health < 60) return "#eab308";
  return "#10b981";
}

function healthLabel(health: number): string {
  if (health < 30) return "CRITICAL";
  if (health < 60) return "WARNING";
  if (health < 80) return "FAIR";
  return "GOOD";
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
  const color = healthColor(health);
  const hLabel = healthLabel(health);
  const wearPct = Math.round(wearAccumulated * 100);

  return (
    <div className="glass-panel p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <span className="font-bold text-sm text-slate-100">{label}</span>
        </div>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${color}30`, color }}
        >
          {hLabel}
        </span>
      </div>

      {/* Health bar */}
      <div>
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>Health</span>
          <span className="font-mono font-bold" style={{ color }}>
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
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>Wear & Tear</span>
          <span className="font-mono" style={{ color: wearPct > 60 ? "#f97316" : "#94a3b8" }}>
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
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">Power Draw</span>
        <span className="font-mono font-bold" style={{ color: accentColor }}>
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
          className="text-xs text-slate-400 leading-relaxed border-t border-white/5 pt-2"
        >
          {kidMode ? kidFriendlyStatus : statusMessage}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
