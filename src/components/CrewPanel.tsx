// ============================================================
// CrewPanel — crew status (morale, radiation, food, O₂)
// ============================================================
import { motion } from "framer-motion";
import { Heart, Zap, Apple, Wind } from "lucide-react";
import type { CrewState } from "../engine/simulationEngine";

interface CrewPanelProps {
  crew: CrewState;
  kidMode: boolean;
}

interface StatRowProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  max: number;
  unit?: string;
  inverted?: boolean; // true = higher is worse
  kidMode: boolean;
  kidLabel?: string;
}

function StatRow({ icon, label, value, max, unit = "%", inverted = false, kidMode, kidLabel }: StatRowProps) {
  const pct = Math.min(100, (value / max) * 100);
  const displayColor = inverted
    ? pct > 70 ? "#ef4444" : pct > 40 ? "#eab308" : "#10b981"
    : pct < 30 ? "#ef4444" : pct < 60 ? "#eab308" : "#10b981";

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-slate-300">
          {icon}
          <span>{kidMode && kidLabel ? kidLabel : label}</span>
        </div>
        <span className="font-mono font-bold" style={{ color: displayColor }}>
          {typeof value === "number" ? (Number.isInteger(value) ? value : value.toFixed(1)) : value}
          <span className="text-slate-400 font-normal ml-0.5">{unit}</span>
        </span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: displayColor }}
          animate={{ width: `${inverted ? pct : pct}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 30 }}
        />
      </div>
    </div>
  );
}

export default function CrewPanel({ crew, kidMode }: CrewPanelProps) {
  const radiationPct = (crew.radiationExposureMSv / crew.safeRadiationLimitMSv) * 100;

  return (
    <div className="glass-panel p-4 flex flex-col gap-4">
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <span className="text-xl">👨‍🚀</span>
        <h3 className="font-bold text-sm text-slate-100">
          {kidMode ? "Your Crew" : "Crew Status"}
        </h3>
      </div>

      <StatRow
        icon={<Heart size={12} className="text-pink-400" />}
        label="Crew Morale"
        kidLabel="How Happy They Are 😊"
        value={crew.morale}
        max={100}
        kidMode={kidMode}
      />

      <StatRow
        icon={<Wind size={12} className="text-sky-400" />}
        label="O₂ Buffer"
        kidLabel="Oxygen in the Air 🌬️"
        value={crew.oxygenBufferPercent}
        max={100}
        kidMode={kidMode}
      />

      <StatRow
        icon={<Apple size={12} className="text-green-400" />}
        label="Food Reserves"
        kidLabel="Food Supply 🥗"
        value={crew.foodReserveDays}
        max={30}
        unit=" days"
        kidMode={kidMode}
      />

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Zap size={12} className="text-yellow-400" />
            <span>{kidMode ? "Radiation Absorbed ☢️" : "Radiation Exposure"}</span>
          </div>
          <span
            className="font-mono font-bold"
            style={{ color: radiationPct > 70 ? "#ef4444" : radiationPct > 40 ? "#eab308" : "#10b981" }}
          >
            {crew.radiationExposureMSv.toFixed(2)}
            <span className="text-slate-400 font-normal ml-0.5">mSv</span>
          </span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              backgroundColor:
                radiationPct > 70 ? "#ef4444" : radiationPct > 40 ? "#eab308" : "#10b981",
            }}
            animate={{ width: `${radiationPct}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
          />
        </div>
        <p className="text-xs text-slate-500 text-right">
          {kidMode
            ? `Limit: ${crew.safeRadiationLimitMSv} mSv (like getting too many X-rays!)`
            : `Limit: ${crew.safeRadiationLimitMSv} mSv NASA mission threshold`}
        </p>
      </div>
    </div>
  );
}
