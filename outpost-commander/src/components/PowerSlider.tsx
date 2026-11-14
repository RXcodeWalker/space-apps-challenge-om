// ============================================================
// PowerSlider — MW allocation slider for one subsystem
// ============================================================
import { motion } from "framer-motion";

interface PowerSliderProps {
  subsystemId: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  allocated: number;
  baseline: number;
  maxMW: number;
  color: string;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export default function PowerSlider({
  label,
  icon,
  description,
  allocated,
  baseline,
  maxMW,
  color,
  onChange,
  disabled = false,
}: PowerSliderProps) {
  const fraction = allocated / maxMW;
  const isUnder = allocated < baseline - 3;
  const isOver = allocated > baseline * 1.2;
  const isBalanced = !isUnder && !isOver;

  const statusColor = isUnder
    ? "text-red-400"
    : isOver
    ? "text-yellow-400"
    : "text-emerald-400";

  const statusLabel = isUnder
    ? "⚠ Under-powered"
    : isBalanced
    ? "✓ Balanced"
    : "⚡ Overload risk";

  return (
    <div
      className={`glass-panel p-4 flex flex-col gap-3 transition-all ${
        disabled ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <div>
            <p className="font-bold text-sm text-slate-100">{label}</p>
            <p className="text-xs text-slate-400">{description}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-mono font-bold text-white">
            {allocated}
          </span>
          <span className="text-slate-400 text-sm ml-1">MW</span>
        </div>
      </div>

      {/* Slider track */}
      <div className="relative">
        <input
          type="range"
          min={0}
          max={maxMW}
          value={allocated}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className="w-full h-3 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${color} 0%, ${color} ${fraction * 100}%, rgba(255,255,255,0.1) ${fraction * 100}%, rgba(255,255,255,0.1) 100%)`,
          }}
        />
        {/* Baseline marker */}
        <div
          className="absolute top-0 w-0.5 h-3 bg-white/60 rounded-full pointer-events-none"
          style={{ left: `${(baseline / maxMW) * 100}%` }}
          title={`Baseline: ${baseline} MW`}
        />
      </div>

      {/* Baseline label row */}
      <div className="flex items-center justify-between text-xs">
        <span className={`font-semibold ${statusColor}`}>{statusLabel}</span>
        <span className="text-slate-500">
          Baseline: <span className="text-slate-300">{baseline} MW</span>
        </span>
      </div>

      {/* MW fill bar */}
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          animate={{ width: `${fraction * 100}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 30 }}
        />
      </div>
    </div>
  );
}
