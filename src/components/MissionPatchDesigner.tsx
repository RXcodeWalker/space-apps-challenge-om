// ============================================================
// MissionPatchDesigner.tsx — Interactive NASA Mission Patch Designer Modal
// NASA Space Apps Challenge · Outpost Commander
//
// Allows students to customize their expedition's official embroidered
// mission patch before or after surface missions.
// Features:
// 1. Live SVG vector patch preview with real-time reactive updates
// 2. 4 Historic Crest Shapes: Shield, Circle, Hexagon, Retro NASA Vector Chevron
// 3. 6 Pure SVG Insignias: Artemis Moon, Mars Gale Mountain, Falcon Rocket,
//    Hydroponic Wheat Sprout, Atomic Electron Orbit, Solar Array Wing
// 4. 4 NASA Color Schemes: Apollo Gold/Navy, Artemis Blue/Silver,
//    Mars Terracotta/Sand, Deep Space Neon
// 5. 4 Expedition Mottoes: "Ad Astra", "Survive to Thrive", "Systems First",
//    "Pioneers of Shackleton" + custom motto input
// 6. Commander Callsign & Custom Outpost Name text inputs
// 7. Authentic Merrowed border embroidery & woven twill texture overlay
// 8. One-click "Download Patch (SVG / PNG)"
// 9. Saves patch vector state to localStorage under 'outpost_commander_custom_patch'
// ============================================================

import { useState, useEffect, useRef, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save,
  Sparkles,
  Shield,
  Circle as CircleIcon,
  Hexagon as HexagonIcon,
  Compass,
  Check,
  CheckCircle2,
  RotateCcw,
  X,
  Type,
  Palette,
  Award,
  Star,
  FileCode,
  Image as ImageIcon,
  Rocket,
  Sliders,
} from "lucide-react";

import {
  CREST_SHAPES,
  INSIGNIA_SYMBOLS,
  PATCH_COLOR_SCHEMES,
  EXPEDITION_MOTTOES,
  DEFAULT_PATCH_STATE,
  PRESET_PATCHES,
  loadSavedPatch,
  savePatchToStorage,
  type MissionPatchState,
} from "../data/patchAssets";
import { soundEffects } from "../utils/soundEffects";
import { award } from "../ui";

// ============================================================
// STANDALONE / EMBEDDABLE MISSION PATCH SVG COMPONENT
// Can be rendered in any size across the entire application
// ============================================================
export interface MissionPatchViewProps {
  patch: MissionPatchState;
  size?: number | string;
  className?: string;
  svgRef?: React.RefObject<SVGSVGElement | null>;
  showShadow?: boolean;
}

export function MissionPatchView({
  patch,
  size = "100%",
  className = "",
  svgRef,
  showShadow = true,
}: MissionPatchViewProps) {
  const shape = CREST_SHAPES[patch.crestShape] || CREST_SHAPES.circle;
  const symbol = INSIGNIA_SYMBOLS[patch.symbol] || INSIGNIA_SYMBOLS.artemis_moon;
  const colors = PATCH_COLOR_SCHEMES[patch.colorScheme] || PATCH_COLOR_SCHEMES.apollo_gold_navy;

  // Unique ID prefix to avoid SVG defs collision when multiple patches render
  const idPrefix = useId().replace(/:/g, "_");
  const clipId = `patch-clip-${idPrefix}`;
  const gradId = `patch-bg-grad-${idPrefix}`;
  const twillId = `patch-twill-${idPrefix}`;
  const topCurveId = `patch-top-curve-${idPrefix}`;
  const bottomCurveId = `patch-bottom-curve-${idPrefix}`;

  // Normalizing texts
  const outpostText = (patch.outpostName || "OUTPOST COMMAND").toUpperCase();
  const mottoText = (patch.motto || "AD ASTRA").toUpperCase();
  const callsignText = (patch.commanderCallsign || "COMMANDER").toUpperCase();
  const starCount = Math.max(0, Math.min(6, patch.starCount ?? 4));

  // Celestial stars coordinates
  const starCoords = [
    { cx: 170, cy: 130, r: 2.5 },
    { cx: 330, cy: 130, r: 2.5 },
    { cx: 135, cy: 185, r: 2.0 },
    { cx: 365, cy: 185, r: 2.0 },
    { cx: 250, cy: 110, r: 3.0 },
    { cx: 250, cy: 375, r: 2.5 },
  ].slice(0, starCount);

  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 500 500"
      width={size}
      height={size}
      className={`select-none ${className}`}
      style={{
        filter: showShadow
          ? "drop-shadow(0 14px 28px rgba(0,0,0,0.65)) drop-shadow(0 2px 8px rgba(0,0,0,0.5))"
          : undefined,
      }}
    >
      <defs>
        {/* Crest Outline Clipping Path */}
        <clipPath id={clipId}>
          <path d={shape.outerPath} />
        </clipPath>

        {/* Deep Space Radial Gradient Background */}
        <radialGradient id={gradId} cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor={colors.gradientStops[0]} />
          <stop offset="55%" stopColor={colors.gradientStops[1]} />
          <stop offset="100%" stopColor={colors.gradientStops[2]} />
        </radialGradient>

        {/* Woven Twill Embroidery Fabric Texture Pattern */}
        <pattern id={twillId} width="6" height="6" patternUnits="userSpaceOnUse">
          <path d="M 0 6 L 6 0 M 0 0 L 6 6" stroke="rgba(255,255,255,0.07)" strokeWidth="0.8" />
          <path d="M 0 3 L 3 0 M 3 6 L 6 3" stroke="rgba(0,0,0,0.18)" strokeWidth="0.8" />
        </pattern>

        {/* Circular Curved Text Paths */}
        {shape.id === "circle" && (
          <>
            <path id={topCurveId} d={shape.bannerTopPath} fill="none" />
            <path id={bottomCurveId} d={shape.bannerBottomPath} fill="none" />
          </>
        )}
      </defs>

      {/* CLIPPED INTERNAL CONTENT */}
      <g clipPath={`url(#${clipId})`}>
        {/* Base Background Fill */}
        <path d={shape.outerPath} fill={`url(#${gradId})`} />

        {/* Twill Fabric Texture Overlay */}
        {patch.showTwillTexture !== false && (
          <path d={shape.outerPath} fill={`url(#${twillId})`} pointerEvents="none" />
        )}

        {/* Constellation / Crew Stars */}
        {starCoords.map((s, idx) => (
          <g key={idx}>
            <circle cx={s.cx} cy={s.cy} r={s.r} fill={colors.starColor} opacity={0.9} />
            {/* 4-point sparkle for larger stars */}
            {s.r >= 2.5 && (
              <path
                d={`M ${s.cx} ${s.cy - 7} Q ${s.cx} ${s.cy} ${s.cx + 7} ${s.cy} Q ${s.cx} ${s.cy} ${s.cx} ${s.cy + 7} Q ${s.cx} ${s.cy} ${s.cx - 7} ${s.cy} Q ${s.cx} ${s.cy} ${s.cx} ${s.cy - 7} Z`}
                fill={colors.starColor}
                opacity={0.7}
              />
            )}
          </g>
        ))}

        {/* Concentric Decorative Rings for Circle & Shield */}
        {shape.id === "circle" && (
          <>
            <circle cx="250" cy="250" r="195" fill="none" stroke={colors.borderThread} strokeWidth="2.5" opacity={0.5} />
            <circle cx="250" cy="250" r="145" fill="none" stroke={colors.primary} strokeWidth="1.5" strokeDasharray="6 4" opacity={0.4} />
          </>
        )}

        {/* PRIMARY INSIGNIA VECTOR SYMBOL */}
        <g id="patch-primary-insignia">
          {symbol.render(colors)}
        </g>

        {/* ============================================================ */}
        {/* TYPOGRAPHY & ROCKER BANNERS                                   */}
        {/* ============================================================ */}

        {/* CIRCULAR CREST: Authentic Top & Bottom Arched Text */}
        {shape.id === "circle" ? (
          <>
            {/* Top Rocker: Outpost Name */}
            <text
              fill={colors.bannerText}
              fontSize={outpostText.length > 18 ? "16" : "19"}
              fontWeight="900"
              fontFamily="system-ui, -apple-system, sans-serif"
              letterSpacing="3.5"
              textAnchor="middle"
            >
              <textPath href={`#${topCurveId}`} startOffset="50%">
                {outpostText}
              </textPath>
            </text>

            {/* Bottom Rocker: Expedition Motto */}
            <text
              fill={colors.textColor}
              fontSize={mottoText.length > 18 ? "14" : "16"}
              fontWeight="800"
              fontFamily="system-ui, -apple-system, sans-serif"
              letterSpacing="2.5"
              textAnchor="middle"
            >
              <textPath href={`#${bottomCurveId}`} startOffset="50%">
                {mottoText}
              </textPath>
            </text>

            {/* Center Commander Callsign Pill Banner */}
            <g transform="translate(250, 360)">
              <rect
                x="-80"
                y="-13"
                width="160"
                height="26"
                rx="13"
                fill={colors.bannerFill}
                stroke={colors.borderThread}
                strokeWidth="1.5"
              />
              <text
                x="0"
                y="4.5"
                fill={colors.textColor}
                fontSize="11"
                fontWeight="900"
                fontFamily="Courier New, monospace"
                letterSpacing="2"
                textAnchor="middle"
              >
                CDR. {callsignText}
              </text>
            </g>
          </>
        ) : (
          /* NON-CIRCULAR CRESTS: Shield, Hexagon & Chevron Rocker Banners */
          <>
            {/* Top Rocker Banner: Outpost Name */}
            <g transform={`translate(${shape.bannerTopCenter.x}, ${shape.bannerTopCenter.y})`}>
              <rect
                x="-140"
                y="-16"
                width="280"
                height="32"
                rx="8"
                fill={colors.bannerFill}
                stroke={colors.borderThread}
                strokeWidth="2"
              />
              <text
                x="0"
                y="5"
                fill={colors.bannerText}
                fontSize={outpostText.length > 18 ? "13" : "15"}
                fontWeight="900"
                fontFamily="system-ui, -apple-system, sans-serif"
                letterSpacing="3"
                textAnchor="middle"
              >
                {outpostText}
              </text>
            </g>

            {/* Bottom Rocker Banner: Expedition Motto */}
            <g transform={`translate(${shape.bannerBottomCenter.x}, ${shape.bannerBottomCenter.y})`}>
              <rect
                x="-125"
                y="-15"
                width="250"
                height="30"
                rx="8"
                fill={colors.bannerFill}
                stroke={colors.borderThread}
                strokeWidth="1.5"
              />
              <text
                x="0"
                y="4.5"
                fill={colors.textColor}
                fontSize={mottoText.length > 18 ? "11" : "13"}
                fontWeight="800"
                fontFamily="system-ui, -apple-system, sans-serif"
                letterSpacing="2"
                textAnchor="middle"
              >
                {mottoText}
              </text>
            </g>

            {/* Sub-Banner: Commander Callsign */}
            <g transform="translate(250, 442)">
              <rect
                x="-65"
                y="-10"
                width="130"
                height="20"
                rx="10"
                fill={colors.secondary}
                stroke={colors.accent}
                strokeWidth="1"
              />
              <text
                x="0"
                y="3.5"
                fill="#FFFFFF"
                fontSize="10"
                fontWeight="bold"
                fontFamily="Courier New, monospace"
                letterSpacing="1.5"
                textAnchor="middle"
              >
                CDR. {callsignText}
              </text>
            </g>
          </>
        )}
      </g>

      {/* ============================================================ */}
      {/* AUTHENTIC EMBROIDERED MERROWED BORDER RIMS                    */}
      {/* ============================================================ */}

      {/* Base Thick Rim */}
      <path
        d={shape.outerPath}
        fill="none"
        stroke={colors.borderThread}
        strokeWidth={patch.showMerrowedEdge !== false ? "12" : "5"}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Merrowed Thread Ribbing Effect */}
      {patch.showMerrowedEdge !== false && (
        <path
          d={shape.outerPath}
          fill="none"
          stroke="rgba(0,0,0,0.35)"
          strokeWidth="10"
          strokeDasharray="2 3"
          strokeLinejoin="round"
        />
      )}

      {/* Inner Decorative Stitch Line */}
      <path
        d={shape.innerStitchPath}
        fill="none"
        stroke={colors.innerStitch}
        strokeWidth="2.5"
        strokeDasharray="5 3.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ============================================================
// MAIN INTERACTIVE MISSION PATCH DESIGNER MODAL
// ============================================================
export interface MissionPatchDesignerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (patch: MissionPatchState) => void;
  initialPatch?: MissionPatchState;
}

type TabType = "shape" | "insignia" | "palette" | "text" | "embroidery";

export default function MissionPatchDesigner({
  isOpen,
  onClose,
  onSave,
  initialPatch,
}: MissionPatchDesignerProps) {
  // Load saved patch from localStorage or fallback
  const [patch, setPatch] = useState<MissionPatchState>(() => {
    return initialPatch || loadSavedPatch();
  });

  const [activeTab, setActiveTab] = useState<TabType>("shape");
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [svgDownloadSuccess, setSvgDownloadSuccess] = useState<boolean>(false);
  const [pngDownloadSuccess, setPngDownloadSuccess] = useState<boolean>(false);
  const [presetNotice, setPresetNotice] = useState<string | null>(null);

  const patchSvgRef = useRef<SVGSVGElement | null>(null);

  // Sync when initialPatch changes or modal opens
  useEffect(() => {
    if (isOpen) {
      soundEffects.playButtonClick();
      const current = initialPatch || loadSavedPatch();
      setPatch(current);
    }
  }, [isOpen, initialPatch]);

  // Auto-save patch state to localStorage so other components reflect changes
  const updatePatch = (updater: Partial<MissionPatchState> | ((prev: MissionPatchState) => MissionPatchState)) => {
    setPatch((prev) => {
      const next = typeof updater === "function" ? updater(prev) : { ...prev, ...updater };
      savePatchToStorage(next);
      return next;
    });
  };

  if (!isOpen) return null;

  // Manual save handler
  const handleSaveToStorage = () => {
    soundEffects.playPuzzleSuccess();
    savePatchToStorage(patch);
    award("patch");
    setSaveSuccess(true);
    if (onSave) {
      onSave(patch);
    }
    // Dispatch custom event for real-time app update
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("outpost_patch_saved", { detail: patch }));
    }
    setTimeout(() => setSaveSuccess(false), 2400);
  };

  // Preset quick-load handler
  const handleApplyPreset = (preset: typeof PRESET_PATCHES[0]) => {
    soundEffects.playButtonClick();
    updatePatch(preset.patch);
    setPresetNotice(`Loaded "${preset.name}"`);
    setTimeout(() => setPresetNotice(null), 2500);
  };

  // Reset to default NASA patch
  const handleResetDefault = () => {
    soundEffects.playSwitchToggle(false);
    updatePatch(DEFAULT_PATCH_STATE);
  };

  // Export 1: Download Patch as Pure SVG
  const handleDownloadSVG = () => {
    soundEffects.playSliderClick(100);
    const svgEl = patchSvgRef.current;
    if (!svgEl) return;

    try {
      const serializer = new XMLSerializer();
      let source = serializer.serializeToString(svgEl);

      // Ensure proper namespaces and xml header
      if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
      }
      if (!source.match(/^<svg[^>]+"http:\/\/www\.w3\.org\/1999\/xlink"/)) {
        source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
      }
      const svgHeader = '<?xml version="1.0" standalone="no"?>\r\n';
      const blob = new Blob([svgHeader + source], { type: "image/svg+xml;charset=utf-8" });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeName = (patch.outpostName || "Mission").replace(/[^a-zA-Z0-9_-]/g, "_");
      link.href = url;
      link.download = `${safeName}_Patch.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSvgDownloadSuccess(true);
      setTimeout(() => setSvgDownloadSuccess(false), 2500);
    } catch (err) {
      console.error("Error exporting SVG patch:", err);
    }
  };

  // Export 2: Download Patch as 1500x1500px High-Res PNG
  const handleDownloadPNG = () => {
    soundEffects.playSliderClick(120);
    const svgEl = patchSvgRef.current;
    if (!svgEl) return;

    try {
      const serializer = new XMLSerializer();
      const source = serializer.serializeToString(svgEl);
      const svgBlob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      const canvas = document.createElement("canvas");
      canvas.width = 1500;
      canvas.height = 1500;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, 1500, 1500);
        ctx.drawImage(img, 0, 0, 1500, 1500);
        URL.revokeObjectURL(url);

        canvas.toBlob((pngBlob) => {
          if (!pngBlob) return;
          const pngUrl = URL.createObjectURL(pngBlob);
          const link = document.createElement("a");
          const safeName = (patch.outpostName || "Mission").replace(/[^a-zA-Z0-9_-]/g, "_");
          link.href = pngUrl;
          link.download = `${safeName}_Patch.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(pngUrl);

          setPngDownloadSuccess(true);
          setTimeout(() => setPngDownloadSuccess(false), 2500);
        }, "image/png");
      };
      img.src = url;
    } catch (err) {
      console.error("Error exporting PNG patch:", err);
    }
  };

  const activeShape = CREST_SHAPES[patch.crestShape];
  const activeSymbol = INSIGNIA_SYMBOLS[patch.symbol];
  const activeColor = PATCH_COLOR_SCHEMES[patch.colorScheme];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="patch-designer-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative w-full max-w-5xl bg-gradient-to-b from-slate-900 via-[#060c1d] to-slate-950 border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-950/60 flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* ============================================================ */}
        {/* MODAL HEADER                                                 */}
        {/* ============================================================ */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cyan-900/40 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 via-cyan-500/20 to-blue-600/30 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-md shadow-cyan-950/50">
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
                  NASA EXPEDITION HERALDRY
                </span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                  CREW PATCH STUDIO
                </span>
              </div>
              <h2
                id="patch-designer-title"
                className="text-lg sm:text-xl font-black text-white tracking-wide uppercase font-serif"
              >
                Mission Patch Designer
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefault}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono border border-slate-700 transition-colors cursor-pointer"
              title="Reset to default NASA patch"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Close Patch Designer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* MAIN STUDIO BODY (2 COLUMNS)                                 */}
        {/* ============================================================ */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ---------------------------------------------------------- */}
          {/* LEFT COLUMN: LIVE INTERACTIVE PREVIEW & EXPORTS (5 Cols)   */}
          {/* ---------------------------------------------------------- */}
          <div className="lg:col-span-5 flex flex-col items-center justify-between gap-5 bg-black/40 rounded-2xl border border-slate-800 p-4 sm:p-5">
            {/* Live Patch Display Stage */}
            <div className="relative w-full aspect-square max-w-[340px] flex items-center justify-center p-3 rounded-2xl bg-gradient-to-b from-slate-950/80 to-slate-900/60 border border-cyan-500/20 shadow-inner">
              {/* Background HUD Crosshair Lines */}
              <div className="absolute inset-0 bg-[radial-gradient(#38bdf812_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none rounded-2xl" />
              <div className="absolute inset-x-8 top-1/2 h-px bg-cyan-500/10 pointer-events-none" />
              <div className="absolute inset-y-8 left-1/2 w-px bg-cyan-500/10 pointer-events-none" />

              {/* The Live Rendered SVG Patch */}
              <motion.div
                key={`${patch.crestShape}-${patch.symbol}-${patch.colorScheme}`}
                initial={{ scale: 0.95, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="relative z-10 w-full h-full flex items-center justify-center"
              >
                <MissionPatchView
                  patch={patch}
                  size="100%"
                  svgRef={patchSvgRef}
                  showShadow
                />
              </motion.div>
            </div>

            {/* Current Active Specs Pill */}
            <div className="w-full bg-slate-900/90 rounded-xl p-3 border border-slate-800 text-xs font-mono space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span>Crest Shape:</span>
                <span className="text-cyan-300 font-bold">{activeShape.name}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Insignia Symbol:</span>
                <span className="text-amber-300 font-bold">{activeSymbol.name}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>NASA Palette:</span>
                <span className="text-white font-bold">{activeColor.name}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Callsign / Outpost:</span>
                <span className="text-emerald-300 font-bold truncate max-w-[170px]">
                  {patch.commanderCallsign} · {patch.outpostName}
                </span>
              </div>
            </div>

            {/* Notification Banner for Presets or Auto-save */}
            <AnimatePresence>
              {presetNotice && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="w-full text-center py-1.5 px-3 bg-cyan-950/80 border border-cyan-400/50 rounded-lg text-xs font-mono text-cyan-200"
                >
                  🚀 {presetNotice}
                </motion.div>
              )}
            </AnimatePresence>

            {/* EXPORT OPTIONS & LOCALSTORAGE ACTIONS */}
            <div className="w-full space-y-2.5">
              {/* Primary: Save to LocalStorage / Flight Suit */}
              <button
                type="button"
                onClick={handleSaveToStorage}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-500 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-bold text-xs sm:text-sm py-3 px-4 rounded-xl shadow-lg shadow-cyan-950/60 border border-cyan-400/50 transition-all cursor-pointer transform active:scale-98"
              >
                {saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>SAVED TO OUTPOST KIT!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-cyan-200" />
                    <span>Save to Flight Suit (localStorage)</span>
                  </>
                )}
              </button>

              {/* Secondary: Dual Download Buttons (SVG & PNG) */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleDownloadSVG}
                  className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-mono font-bold text-xs py-2.5 px-3 rounded-xl border border-slate-700 transition-colors cursor-pointer"
                  title="Download clean Scalable Vector Graphic (.svg)"
                >
                  {svgDownloadSuccess ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                  <span>{svgDownloadSuccess ? "Saved!" : "Vector (SVG)"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPNG}
                  className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-mono font-bold text-xs py-2.5 px-3 rounded-xl border border-slate-700 transition-colors cursor-pointer"
                  title="Download 1500x1500px High-Res Raster (.png)"
                >
                  {pngDownloadSuccess ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span>{pngDownloadSuccess ? "Saved!" : "Image (PNG)"}</span>
                </button>
              </div>
            </div>

            {/* Quick Expedition Presets Carousel */}
            <div className="w-full">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Historic Mission Presets</span>
                <span className="text-cyan-400">1-Click</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {PRESET_PATCHES.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-cyan-950/80 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-200 text-[11px] font-mono whitespace-nowrap transition-colors cursor-pointer shrink-0"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ---------------------------------------------------------- */}
          {/* RIGHT COLUMN: CUSTOMIZATION STUDIO CONTROLS (7 Cols)       */}
          {/* ---------------------------------------------------------- */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-4">
            {/* Control Tabs Navigation */}
            <div className="flex items-center gap-1 sm:gap-2 p-1 bg-slate-950/80 border border-slate-800 rounded-xl overflow-x-auto">
              {[
                { id: "shape", label: "Crest Shape", icon: Shield },
                { id: "insignia", label: "Insignia", icon: Rocket },
                { id: "palette", label: "Colors", icon: Palette },
                { id: "text", label: "Callsign & Motto", icon: Type },
                { id: "embroidery", label: "Stitch & Stars", icon: Sliders },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      soundEffects.playButtonClick();
                      setActiveTab(tab.id as TabType);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-bold transition-all shrink-0 cursor-pointer ${
                      isActive
                        ? "bg-cyan-950 text-cyan-300 border border-cyan-500/60 shadow-sm shadow-cyan-950"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENT PANELS */}
            <div className="flex-1 bg-slate-950/50 rounded-2xl border border-slate-800/80 p-4 sm:p-5 overflow-y-auto max-h-[460px]">
              {/* ==================================================== */}
              {/* TAB 1: CREST SHAPES                                  */}
              {/* ==================================================== */}
              {activeTab === "shape" && (
                <div className="space-y-4">
                  <div className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                    Select Outer Crest Shape & Heraldry
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.values(CREST_SHAPES).map((shapeDef) => {
                      const isSelected = patch.crestShape === shapeDef.id;
                      return (
                        <div
                          key={shapeDef.id}
                          onClick={() => {
                            soundEffects.playSliderClick();
                            updatePatch({ crestShape: shapeDef.id });
                          }}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? "bg-gradient-to-br from-cyan-950/60 to-blue-950/40 border-cyan-400 text-white shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-400/40"
                              : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {shapeDef.id === "circle" && <CircleIcon className="w-4 h-4 text-cyan-400" />}
                              {shapeDef.id === "shield" && <Shield className="w-4 h-4 text-cyan-400" />}
                              {shapeDef.id === "hexagon" && <HexagonIcon className="w-4 h-4 text-cyan-400" />}
                              {shapeDef.id === "chevron" && <Compass className="w-4 h-4 text-cyan-400" />}
                              <span className="font-bold text-sm">{shapeDef.name}</span>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                          </div>
                          <div className="text-[11px] font-mono text-cyan-300/80 mt-1">
                            {shapeDef.tagline}
                          </div>
                          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                            {shapeDef.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ==================================================== */}
              {/* TAB 2: PRIMARY INSIGNIA SYMBOLS                      */}
              {/* ==================================================== */}
              {activeTab === "insignia" && (
                <div className="space-y-4">
                  <div className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                    Select Primary Insignia Emblem (Pure SVG Vector)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.values(INSIGNIA_SYMBOLS).map((symDef) => {
                      const isSelected = patch.symbol === symDef.id;
                      return (
                        <div
                          key={symDef.id}
                          onClick={() => {
                            soundEffects.playSliderClick(60);
                            updatePatch({ symbol: symDef.id });
                          }}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? "bg-gradient-to-br from-amber-950/40 via-cyan-950/40 to-slate-900 border-amber-400 text-white shadow-lg shadow-amber-950/30 ring-1 ring-amber-400/40"
                              : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-white">{symDef.name}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                              {symDef.category}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                            {symDef.description}
                          </p>
                          <div className="text-[10px] text-slate-400 italic mt-2 border-t border-slate-800/80 pt-1.5">
                            🏛️ {symDef.historicContext}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ==================================================== */}
              {/* TAB 3: NASA COLOR PALETTES                           */}
              {/* ==================================================== */}
              {activeTab === "palette" && (
                <div className="space-y-4">
                  <div className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                    Select NASA Color Scheme & Thread Palette
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.values(PATCH_COLOR_SCHEMES).map((pal) => {
                      const isSelected = patch.colorScheme === pal.id;
                      return (
                        <div
                          key={pal.id}
                          onClick={() => {
                            soundEffects.playSliderClick(80);
                            updatePatch({ colorScheme: pal.id });
                          }}
                          className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? "bg-gradient-to-br from-slate-900 to-slate-950 border-cyan-400 text-white shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-400/40"
                              : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-white">{pal.name}</span>
                            {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                          </div>

                          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                            {pal.tagline}
                          </div>

                          {/* Color Swatch Preview Bar */}
                          <div className="flex items-center gap-1.5 my-3">
                            <div
                              className="w-7 h-7 rounded-lg border border-white/20 shadow-sm"
                              style={{ backgroundColor: pal.primary }}
                              title={`Primary: ${pal.primary}`}
                            />
                            <div
                              className="w-7 h-7 rounded-lg border border-white/20 shadow-sm"
                              style={{ backgroundColor: pal.secondary }}
                              title={`Secondary: ${pal.secondary}`}
                            />
                            <div
                              className="w-7 h-7 rounded-lg border border-white/20 shadow-sm"
                              style={{ backgroundColor: pal.accent }}
                              title={`Accent: ${pal.accent}`}
                            />
                            <div
                              className="w-7 h-7 rounded-lg border border-white/20 shadow-sm"
                              style={{ backgroundColor: pal.borderThread }}
                              title={`Border Thread: ${pal.borderThread}`}
                            />
                            <div
                              className="w-7 h-7 rounded-lg border border-white/20 shadow-sm"
                              style={{ backgroundColor: pal.darkBg }}
                              title={`Base Dark: ${pal.darkBg}`}
                            />
                          </div>

                          <p className="text-xs text-slate-400 leading-relaxed">
                            {pal.paletteDescription}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ==================================================== */}
              {/* TAB 4: CALLSIGN, OUTPOST & EXPEDITION MOTTO          */}
              {/* ==================================================== */}
              {activeTab === "text" && (
                <div className="space-y-4">
                  <div className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                    Commander Callsign, Outpost Name & Motto
                  </div>

                  {/* Commander Callsign Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-300 font-bold flex items-center justify-between">
                      <span>Commander Call-sign</span>
                      <span className="text-[10px] text-slate-500 font-normal">Max 12 chars</span>
                    </label>
                    <input
                      type="text"
                      maxLength={12}
                      value={patch.commanderCallsign}
                      onChange={(e) => updatePatch({ commanderCallsign: e.target.value.toUpperCase() })}
                      placeholder="e.g. VANGUARD, ORION, SPROUT"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold text-sm focus:outline-none focus:border-cyan-400 uppercase"
                    />
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] font-mono text-slate-400">Suggestions:</span>
                      {["VANGUARD", "ORION", "EAGLE", "SPROUT", "VOLT", "PHOENIX"].map((cs) => (
                        <button
                          key={cs}
                          type="button"
                          onClick={() => {
                            soundEffects.playButtonClick();
                            updatePatch({ commanderCallsign: cs });
                          }}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-mono transition-colors"
                        >
                          {cs}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Outpost Name Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-300 font-bold flex items-center justify-between">
                      <span>Custom Outpost Name (Top Banner)</span>
                      <span className="text-[10px] text-slate-500 font-normal">Max 24 chars</span>
                    </label>
                    <input
                      type="text"
                      maxLength={24}
                      value={patch.outpostName}
                      onChange={(e) => updatePatch({ outpostName: e.target.value.toUpperCase() })}
                      placeholder="e.g. SHACKLETON BASE, GALE HABITAT"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold text-sm focus:outline-none focus:border-cyan-400 uppercase"
                    />
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] font-mono text-slate-400">Suggestions:</span>
                      {["SHACKLETON BASE", "TRANQUILITY OUTPOST", "GALE CALDERA HAB", "PEARY BIOSPHERE"].map((op) => (
                        <button
                          key={op}
                          type="button"
                          onClick={() => {
                            soundEffects.playButtonClick();
                            updatePatch({ outpostName: op });
                          }}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-mono transition-colors"
                        >
                          {op}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Expedition Motto Selection */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <label className="text-xs font-mono text-slate-300 font-bold">
                      Official Expedition Motto (Lower Rocker)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {EXPEDITION_MOTTOES.map((mItem) => {
                        const isSelected = patch.motto === mItem.motto;
                        return (
                          <div
                            key={mItem.motto}
                            onClick={() => {
                              soundEffects.playSliderClick(70);
                              updatePatch({ motto: mItem.motto });
                            }}
                            className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                              isSelected
                                ? "bg-cyan-950/70 border-cyan-400 text-white"
                                : "bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-900"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-white">"{mItem.motto}"</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                            </div>
                            <div className="text-[10px] text-slate-400 italic mt-0.5">
                              {mItem.englishTranslation}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Or Type a Custom Motto */}
                    <div className="pt-1">
                      <input
                        type="text"
                        maxLength={24}
                        value={patch.motto}
                        onChange={(e) => updatePatch({ motto: e.target.value })}
                        placeholder="Or enter custom motto..."
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ==================================================== */}
              {/* TAB 5: EMBROIDERY EFFECTS & STARS                    */}
              {/* ==================================================== */}
              {activeTab === "embroidery" && (
                <div className="space-y-5">
                  <div className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                    Embroidery Texture & Merrowed Edge Controls
                  </div>

                  {/* Twill Weave Toggle */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
                    <div>
                      <div className="text-sm font-bold text-white">Woven Twill Fabric Texture</div>
                      <div className="text-xs text-slate-400">
                        Renders authentic physical twill fabric weave stitches across the patch surface.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.playSwitchToggle(!patch.showTwillTexture);
                        updatePatch({ showTwillTexture: !patch.showTwillTexture });
                      }}
                      className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                        patch.showTwillTexture !== false ? "bg-cyan-500" : "bg-slate-700"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform transform ${
                          patch.showTwillTexture !== false ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Merrowed Border Toggle */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
                    <div>
                      <div className="text-sm font-bold text-white">Merrowed Overlock Stitch Border</div>
                      <div className="text-xs text-slate-400">
                        Adds a raised, threaded embroidery rim that wraps the outer heraldic contour.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.playSwitchToggle(!patch.showMerrowedEdge);
                        updatePatch({ showMerrowedEdge: !patch.showMerrowedEdge });
                      }}
                      className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                        patch.showMerrowedEdge !== false ? "bg-cyan-500" : "bg-slate-700"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform transform ${
                          patch.showMerrowedEdge !== false ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Crew Stars Count Slider */}
                  <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-white flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-amber-400" />
                        <span>Constellation Crew Stars: {patch.starCount ?? 4}</span>
                      </div>
                      <span className="text-xs font-mono text-cyan-300">
                        {patch.starCount === 4 ? "Standard 4-Astronaut Crew" : `${patch.starCount} Crew Members`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={6}
                      step={1}
                      value={patch.starCount ?? 4}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        soundEffects.playDialTick(val * 15);
                        updatePatch({ starCount: val });
                      }}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-500">
                      <span>None</span>
                      <span>1 Star</span>
                      <span>2</span>
                      <span>3</span>
                      <span>4 (Default)</span>
                      <span>5</span>
                      <span>6 Stars</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* MODAL FOOTER                                                 */}
        {/* ============================================================ */}
        <div className="px-5 py-3 border-t border-cyan-900/40 bg-slate-950/80 flex items-center justify-between text-xs font-mono shrink-0">
          <div className="text-slate-400 hidden sm:flex items-center gap-2">
            <span>NASA Space Apps Challenge 2026</span>
            <span>·</span>
            <span>State persisted in localStorage under 'outpost_commander_custom_patch'</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs transition-colors cursor-pointer"
            >
              Done
            </button>
            <button
              type="button"
              onClick={handleSaveToStorage}
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-xs shadow-md shadow-cyan-950 transition-all cursor-pointer flex items-center gap-1.5"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Patch Applied!</span>
                </>
              ) : (
                <>
                  <Award className="w-3.5 h-3.5 text-cyan-200" />
                  <span>Apply Patch</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
