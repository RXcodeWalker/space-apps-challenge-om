// ============================================================
// PowerSlider — MW allocation slider for one subsystem
// Optimized for Classroom Usability, Screen Readers & High-Contrast Mode
// ============================================================
import React from "react";
import { motion } from "framer-motion";
import { useAccessibility } from "../utils/AccessibilityContext";

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
  subsystemId,
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
  const { colorblindMode, tokens, shapes } = useAccessibility();

  const fraction = maxMW > 0 ? allocated / maxMW : 0;
  const isZero = allocated === 0;
  const isUnder = allocated < baseline - 3;
  const isOver = allocated > baseline * 1.2;
  const isBalanced = !isUnder && !isOver;

  // Accessible Status Labels paired with distinct shape markers
  const statusLabel = isZero
    ? `${shapes.brownout} Depleted (0 MW)`
    : isUnder
    ? `${shapes.deficit} Under-powered`
    : isBalanced
    ? `${shapes.nominal} Balanced`
    : `${shapes.surplus} Overload risk`;

  // Accessible color tokens:
  // Standard: Green (#10b981) for nominal, Red (#ef4444) for deficit
  // Colorblind-Safe: Cyan/Blue (#0284c7) for nominal, Vermilion/Orange (#f97316) for deficit
  const statusColorClass = isZero
    ? tokens.dangerText
    : isUnder
    ? tokens.deficitText
    : isBalanced
    ? tokens.nominalText
    : tokens.warningText;

  // Active bar and track color: adjust greens to accessible cyan/blue (#0284c7) in colorblind mode
  const effectiveColor = colorblindMode
    ? color.toLowerCase().includes("10b981") ||
      color.toLowerCase().includes("emerald") ||
      color.toLowerCase().includes("green") ||
      color.toLowerCase().includes("#059669")
      ? tokens.nominal // #0284c7
      : isUnder
      ? tokens.deficit // #f97316
      : color
    : color;

  return (
    <div
      className={`glass-panel p-4 flex flex-col gap-3 transition-all ${
        disabled ? "opacity-50 pointer-events-none" : ""
      } ${colorblindMode ? "border-slate-700/80" : ""}`}
    >
      {/* Screen Reader ARIA Live Region for slider adjustment */}
      <div
        id={`power-slider-live-${subsystemId}`}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {`${label}: ${allocated} Megawatts allocated out of ${maxMW} MW. Baseline target is ${baseline} MW. Current state: ${statusLabel}`}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">
            {icon}
          </span>
          <div>
            <p className="font-bold text-sm text-slate-100">{label}</p>
            <p className="text-xs text-slate-400">{description}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-mono font-bold text-white">
            {allocated}
          </span>
          <span className="text-slate-400 text-sm ml-1 font-mono">MW</span>
        </div>
      </div>

      {/* Slider track with ARIA accessibility */}
      <div className="relative">
        <label htmlFor={`slider-${subsystemId}`} className="sr-only">
          {`${label} Power Allocation Slider. Current: ${allocated} MW`}
        </label>
        <input
          id={`slider-${subsystemId}`}
          type="range"
          min={0}
          max={maxMW}
          value={allocated}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          aria-label={`${label} power allocation slider`}
          aria-valuenow={allocated}
          aria-valuemin={0}
          aria-valuemax={maxMW}
          aria-valuetext={`${allocated} Megawatts, ${statusLabel}`}
          aria-describedby={`power-slider-desc-${subsystemId}`}
          className="w-full h-3 rounded-full appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400"
          style={{
            background: `linear-gradient(to right, ${effectiveColor} 0%, ${effectiveColor} ${fraction * 100}%, rgba(255,255,255,0.1) ${fraction * 100}%, rgba(255,255,255,0.1) 100%)`,
          }}
        />
        {/* Baseline marker */}
        <div
          className="absolute top-0 w-1 h-3 bg-white/70 rounded-full pointer-events-none shadow"
          style={{ left: `${(baseline / maxMW) * 100}%` }}
          title={`Baseline: ${baseline} MW`}
          aria-hidden="true"
        />
      </div>

      {/* Baseline label row with shape marker */}
      <div
        id={`power-slider-desc-${subsystemId}`}
        className="flex items-center justify-between text-xs"
      >
        <span
          className={`font-bold flex items-center gap-1 ${statusColorClass} ${
            colorblindMode ? "tracking-wide" : ""
          }`}
        >
          {statusLabel}
        </span>
        <span className="text-slate-400 font-mono">
          Baseline:{" "}
          <strong className="text-slate-200">{baseline} MW</strong>
        </span>
      </div>

      {/* MW fill bar */}
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: effectiveColor }}
          animate={{ width: `${fraction * 100}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 30 }}
        />
      </div>
    </div>
  );
}
