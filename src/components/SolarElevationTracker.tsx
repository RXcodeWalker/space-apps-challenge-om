// ============================================================
// SolarElevationTracker.tsx — Orbital Solar Elevation & Shadow Tracker
// Interactive Celestial Radial Dial & Shadow Vector Simulator
// Grounded in NASA LRO (Diviner/LOLA) and MSL Curiosity (REMS) Data
// ============================================================

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sun,
  Moon,
  Play,
  Pause,
  Zap,
  HelpCircle,
  X,
  Compass,
  Sparkles,
  Wind,
} from "lucide-react";
import {
  calculateSolarCoordinates,
  generateDiurnalCurve,
  CELESTIAL_CONSTANTS,
  type CelestialBodyId,
  type SolarPositionResult,
} from "../utils/solarCoordinates";
import { soundEffects } from "../utils/soundEffects";

export interface SolarElevationTrackerProps {
  /** Optional initial body selection */
  initialBody?: CelestialBodyId;
  /** Optional initial sol number */
  initialSol?: number;
  /** Optional initial hour (0 - 24) */
  initialHour?: number;
  /** Optional callback to close modal if displayed as an overlay */
  onClose?: () => void;
  /** Compact inline mode vs full standalone dashboard */
  variant?: "full" | "embedded";
}

export default function SolarElevationTracker({
  initialBody = "moon",
  initialSol = 1,
  initialHour = 12.0,
  onClose,
  variant = "full",
}: SolarElevationTrackerProps) {
  // State
  const [body, setBody] = useState<CelestialBodyId>(initialBody);
  const [sol, setSol] = useState<number>(initialSol);
  const [timeHour, setTimeHour] = useState<number>(initialHour);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playSpeed, setPlaySpeed] = useState<number>(1.0); // 1x, 2x, 5x
  const [tau, setTau] = useState<number>(CELESTIAL_CONSTANTS.mars.nominalTau);
  const [arrayMode, setArrayMode] = useState<"vertical_mast" | "horizontal" | "two_axis_tracking">(
    initialBody === "moon" ? "vertical_mast" : "horizontal"
  );
  const [domeHeightM, setDomeHeightM] = useState<number>(8.0);
  const [showEducationModal, setShowEducationModal] = useState<boolean>(false);

  // Switch array mode recommendation automatically when changing body
  const handleBodyToggle = (newBody: CelestialBodyId) => {
    soundEffects.playButtonClick();
    setBody(newBody);
    if (newBody === "moon") {
      setArrayMode("vertical_mast");
    } else {
      setArrayMode("horizontal");
    }
  };

  // Animation loop for time progression
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      lastTimeRef.current = null;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const animate = (timestamp: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
      }
      const elapsedSec = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      // Advance by 1.5 hours per second * playSpeed
      setTimeHour((prev) => {
        const solMax = body === "moon" ? 24.0 : CELESTIAL_CONSTANTS.mars.solDurationHours;
        const next = (prev + elapsedSec * 2.0 * playSpeed) % solMax;
        return next;
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, playSpeed, body]);

  // Current calculated physics result
  const solarData: SolarPositionResult = useMemo(() => {
    return calculateSolarCoordinates(body, sol, timeHour, {
      opticalDepthTau: tau,
      domeHeightM,
      arrayTiltMode: arrayMode,
    });
  }, [body, sol, timeHour, tau, domeHeightM, arrayMode]);

  // Diurnal curve points for mini trajectory chart
  const diurnalCurve = useMemo(() => {
    return generateDiurnalCurve(body, sol, 32, {
      opticalDepthTau: tau,
      domeHeightM,
      arrayTiltMode: arrayMode,
    });
  }, [body, sol, tau, domeHeightM, arrayMode]);

  // Comparison metrics: Horizontal vs Vertical Mast
  const comparisonData = useMemo(() => {
    const horiz = calculateSolarCoordinates(body, sol, timeHour, {
      opticalDepthTau: tau,
      domeHeightM,
      arrayTiltMode: "horizontal",
    });
    const vert = calculateSolarCoordinates(body, sol, timeHour, {
      opticalDepthTau: tau,
      domeHeightM,
      arrayTiltMode: "vertical_mast",
    });
    return { horiz, vert };
  }, [body, sol, timeHour, tau, domeHeightM]);

  // SVG Radial Dial Dimensions
  const dialRadius = 150;
  const dialCenter = { x: 220, y: 200 };

  // Convert solar elevation to SVG Coordinates on arch
  // Elevation ranges from -10° to 90°.
  // In our arch: 0° horizon is horizontal (center-left to center-right).
  // Zenith (90°) is straight up.
  const getSunSvgPos = (elevation: number, azimuth: number) => {
    // For visual clarity:
    // If Mars, elevation goes 0° to 90° across the sky from East (left) to West (right)
    if (body === "mars") {
      // Map hour angle or azimuth to arch angle
      // Hour angle -90° (sunrise) to +90° (sunset)
      const normHA = Math.max(-90, Math.min(90, solarData.hourAngleDeg));
      // Angle in radians: 180° is left horizon (East), 90° is Zenith (top), 0° is right horizon (West)
      const archAngleDeg = 90 - normHA;
      const rad = (archAngleDeg * Math.PI) / 180;
      return {
        x: dialCenter.x + dialRadius * Math.cos(rad),
        y: dialCenter.y - dialRadius * Math.sin(rad),
      };
    } else {
      // Moon: grazing sun skims between 0.8° and 3.2° above the horizon!
      // To make the 1° to 3° grazing motion dramatically intuitive and readable,
      // we project the sun along the Shackleton rim 360° circular horizon panoramic arch
      const azRad = (azimuth * Math.PI) / 180;
      // Elliptical horizon path hovering just 10-24px above the terrain ridge
      const x = dialCenter.x + Math.sin(azRad) * (dialRadius * 0.92);
      // Elevation visual offset: 1° ~ 8px above baseline
      const elevOffset = Math.max(0, elevation) * 10;
      const y = dialCenter.y - 12 - elevOffset - Math.cos(azRad) * 16;
      return { x, y };
    }
  };

  const sunPos = getSunSvgPos(solarData.elevationDeg, solarData.azimuthDeg);

  // Ratio calculation for Vertical Mast advantage on the Moon
  const verticalMastAdvantage = useMemo(() => {
    if (comparisonData.horiz.globalHorizontalFlux > 0) {
      return (
        comparisonData.vert.verticalTowerFlux /
        comparisonData.horiz.globalHorizontalFlux
      ).toFixed(1);
    }
    return "38.5";
  }, [comparisonData]);

  return (
    <div
      className={`relative w-full ${
        variant === "embedded" ? "rounded-2xl" : "max-w-5xl mx-auto rounded-3xl"
      } bg-slate-950/95 border border-cyan-800/50 shadow-2xl overflow-hidden backdrop-blur-xl text-slate-100 font-sans`}
    >
      {/* ------------------------------------------------------------- */}
      {/* HEADER BAR & MISSION TARGET TOGGLE */}
      {/* ------------------------------------------------------------- */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-gradient-to-r from-[#070d18] via-[#0b172a] to-[#070d18] border-b border-cyan-900/40">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-inner">
            <Sun className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-sm tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-yellow-200">
                SOLAR ELEVATION & SHADOW TRACKER
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700/50">
                NASA LRO & CURIOSITY
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Orbital Mechanics, Diurnal Insolation & Artemis Vertical Mast vs Flat Panel Physics
            </p>
          </div>
        </div>

        {/* Planet / Destination Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-2xl bg-slate-900/90 border border-slate-700/60 shadow-lg">
            <button
              type="button"
              onClick={() => handleBodyToggle("moon")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                body === "moon"
                  ? "bg-gradient-to-r from-slate-200 to-slate-400 text-slate-950 shadow-md font-black"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Shackleton Rim (Moon)</span>
            </button>
            <button
              type="button"
              onClick={() => handleBodyToggle("mars")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                body === "mars"
                  ? "bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 shadow-md font-black"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Gale Crater (Mars)</span>
            </button>
          </div>

          {/* Educational Tooltip Button */}
          <button
            type="button"
            onClick={() => {
              soundEffects.playButtonClick();
              setShowEducationModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-600/50 text-cyan-300 text-xs font-mono font-bold transition-all cursor-pointer shadow-sm group"
            title="Read STEM Orbital Science Breakdown"
          >
            <HelpCircle className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform text-cyan-400" />
            <span className="hidden sm:inline">Science Guide</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={() => {
                soundEffects.playButtonClick();
                onClose();
              }}
              className="p-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/50 transition-colors cursor-pointer"
              title="Close Tracker"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MAIN INTERACTIVE WORKSPACE */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
        {/* LEFT / CENTER: THE CELESTIAL HORIZON RADIAL ARCH (7 COLS) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* RADIAL DIAL CONTAINER */}
          <div className="relative rounded-2xl bg-gradient-to-b from-[#060c18] via-[#09152b] to-[#040813] border border-cyan-900/40 p-4 shadow-inner overflow-hidden">
            {/* Ambient Background Glow */}
            <div
              className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${
                solarData.isSunlit ? "opacity-30" : "opacity-5"
              }`}
              style={{
                background:
                  body === "moon"
                    ? "radial-gradient(circle at 50% 85%, rgba(200,225,255,0.2) 0%, transparent 70%)"
                    : "radial-gradient(circle at 50% 70%, rgba(245,158,11,0.25) 0%, transparent 75%)",
              }}
            />

            {/* Mode & Sky Status Pill Badge */}
            <div className="relative z-10 flex items-center justify-between text-xs font-mono mb-2">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  {body === "moon"
                    ? "LUNAR SOUTH POLE (89.9°S) — 1.5° AXIAL TILT"
                    : "GALE CRATER (4.6°S) — 25.2° AXIAL TILT"}
                </span>
              </span>
              <span
                className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                  solarData.isSunlit
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "bg-indigo-950/80 text-indigo-300 border border-indigo-700/40"
                }`}
              >
                {solarData.isSunlit ? "Sun Above Horizon" : "Astronomical Night"}
              </span>
            </div>

            {/* SVG RADIAL HORIZON ARCH & SHADOW VECTOR */}
            <div className="relative w-full aspect-[440/250] flex items-center justify-center">
              <svg
                viewBox="0 0 440 250"
                className="w-full h-full object-contain"
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  {/* Sun Glow Filter */}
                  <filter id="sunGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>

                  {/* Martian Pink Sky Gradient vs Lunar Black Void */}
                  <linearGradient id="marsSkyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#451a03" stopOpacity="0.4" />
                    <stop offset="60%" stopColor="#78350f" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.0" />
                  </linearGradient>

                  <linearGradient id="groundGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={body === "moon" ? "#1e293b" : "#451a03"}
                    />
                    <stop
                      offset="100%"
                      stopColor={body === "moon" ? "#090d16" : "#1c0d02"}
                    />
                  </linearGradient>

                  {/* Shadow Gradient */}
                  <linearGradient id="shadowGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#020617" stopOpacity="0.9" />
                    <stop offset="85%" stopColor="#090d16" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#090d16" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Sky fill for Mars */}
                {body === "mars" && (
                  <path
                    d={`M 70 200 A 150 150 0 0 1 370 200 Z`}
                    fill="url(#marsSkyGradient)"
                  />
                )}

                {/* Celestial Guide Arcs & Grid for Elevation */}
                {body === "mars" ? (
                  // Full 0° to 90° Diurnal Arch
                  <g className="opacity-40">
                    {/* Main Sky Arch */}
                    <path
                      d="M 70 200 A 150 150 0 0 1 370 200"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                    />
                    {/* 30° Elevation Arc */}
                    <path
                      d="M 125 200 A 95 95 0 0 1 315 200"
                      fill="none"
                      stroke="#0284c7"
                      strokeWidth="0.8"
                      strokeDasharray="2 4"
                    />
                    {/* 60° Elevation Arc */}
                    <path
                      d="M 175 200 A 45 45 0 0 1 265 200"
                      fill="none"
                      stroke="#0284c7"
                      strokeWidth="0.8"
                      strokeDasharray="2 4"
                    />

                    {/* Degree Labels */}
                    <text x="220" y="42" fill="#38bdf8" fontSize="9" textAnchor="middle" fontFamily="monospace">
                      Zenith 90°
                    </text>
                    <text x="220" y="100" fill="#0284c7" fontSize="8" textAnchor="middle" fontFamily="monospace">
                      60°
                    </text>
                    <text x="220" y="150" fill="#0284c7" fontSize="8" textAnchor="middle" fontFamily="monospace">
                      30°
                    </text>
                    <text x="65" y="214" fill="#94a3b8" fontSize="8" textAnchor="end" fontFamily="monospace">
                      0° East (Dawn)
                    </text>
                    <text x="375" y="214" fill="#94a3b8" fontSize="8" textAnchor="start" fontFamily="monospace">
                      0° West (Dusk)
                    </text>
                  </g>
                ) : (
                  // Lunar South Pole: Grazing Horizon 360° Circular Panorama
                  <g className="opacity-40">
                    {/* Low hover line for grazing angle: 1° to 3° */}
                    <ellipse
                      cx={dialCenter.x}
                      cy={dialCenter.y - 18}
                      rx={dialRadius * 0.92}
                      ry="28"
                      fill="none"
                      stroke="#facc15"
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                    />
                    <text
                      x="220"
                      y="160"
                      fill="#fde047"
                      fontSize="9"
                      textAnchor="middle"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      Grazing Sun Orbit Path (1.5° - 3.0° Elevation)
                    </text>
                    <text
                      x="220"
                      y="174"
                      fill="#94a3b8"
                      fontSize="7.5"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      Sun never rises high; skims 360° around crater rim peaks
                    </text>
                  </g>
                )}

                {/* Horizon Baseline & Surface Terrain Silhouette */}
                <path
                  d="M 10 200 L 430 200"
                  stroke="#475569"
                  strokeWidth="2"
                  strokeDasharray="3 3"
                />

                {/* Terrain Profiles: Shackleton Rim vs Gale Crater / Mt. Sharp */}
                {body === "moon" ? (
                  // Shackleton Crater Rim jagged peaks & deep shadowed crater floor
                  <g>
                    {/* Background jagged rim ridge */}
                    <polygon
                      points="10,200 40,193 85,190 120,195 160,186 210,188 250,182 290,191 340,187 380,194 430,200 430,250 10,250"
                      fill="url(#groundGradient)"
                    />
                    {/* Deep Shackleton PSR (Permanently Shadowed Region) Crater Floor */}
                    <path
                      d="M 70 200 Q 150 240 220 238 Q 290 240 370 200 Z"
                      fill="#02040a"
                    />
                    <text
                      x="220"
                      y="232"
                      fill="#38bdf8"
                      fontSize="7.5"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      Shackleton Crater Floor (Permanent Darkness / Ice PSR)
                    </text>
                  </g>
                ) : (
                  // Gale Crater floor with Aeolis Mons (Mount Sharp) in the background
                  <polygon
                    points="10,200 50,197 110,194 170,180 220,165 270,180 330,194 390,198 430,200 430,250 10,250"
                    fill="url(#groundGradient)"
                  />
                )}

                {/* Habitat Dome at Local Outpost Ground Zero (x: 220, y: 200) */}
                <g>
                  {/* Outpost Base Pad */}
                  <ellipse cx="220" cy="200" rx="14" ry="4" fill="#334155" />

                  {/* Habitat Dome Shell */}
                  <path
                    d="M 210 200 A 10 10 0 0 1 230 200 Z"
                    fill={body === "moon" ? "#94a3b8" : "#cbd5e1"}
                    stroke="#0284c7"
                    strokeWidth="1"
                  />

                  {/* Vertical Solar Mast Tower (Artemis VSAT) */}
                  {arrayMode === "vertical_mast" && (
                    <g>
                      <line
                        x1="234"
                        y1="200"
                        x2="234"
                        y2="178"
                        stroke="#f59e0b"
                        strokeWidth="2"
                      />
                      {/* Vertical array panel blades */}
                      <rect
                        x="232"
                        y="178"
                        width="4"
                        height="18"
                        fill="#38bdf8"
                        stroke="#0369a1"
                        strokeWidth="0.5"
                        rx="1"
                      />
                      <circle cx="234" cy="177" r="1.5" fill="#facc15" />
                    </g>
                  )}

                  {/* Flat Horizontal Array (Roof) */}
                  {arrayMode === "horizontal" && (
                    <line
                      x1="213"
                      y1="190"
                      x2="227"
                      y2="190"
                      stroke="#38bdf8"
                      strokeWidth="2"
                    />
                  )}

                  {/* Label */}
                  <text
                    x="220"
                    y="212"
                    fill="#94a3b8"
                    fontSize="7"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    Habitat Dome (8m)
                  </text>
                </g>

                {/* DYNAMIC SHADOW VECTOR CAST BY THE DOME */}
                {solarData.isSunlit && (
                  <g>
                    {/* Calculate shadow direction and visual length */}
                    {(() => {
                      // Shadow points opposite to sun position
                      const dx = dialCenter.x - sunPos.x;
                      const dirSign = dx >= 0 ? 1 : -1;
                      // Visual length clamped for SVG canvas
                      // On Moon: shadow is massive (hundreds of meters / kilometers)
                      const visualLength =
                        body === "moon"
                          ? Math.min(160, Math.max(70, 140 - solarData.elevationDeg * 25))
                          : Math.min(
                              130,
                              Math.max(12, 120 / Math.tan(Math.max(0.15, (solarData.elevationDeg * Math.PI) / 180)))
                            );

                      const shadowEndX = dialCenter.x + dirSign * visualLength;

                      return (
                        <>
                          {/* Projected Shadow Polygon */}
                          <polygon
                            points={`213,200 227,200 ${shadowEndX + dirSign * 4},202 ${shadowEndX},199`}
                            fill="url(#shadowGradient)"
                          />
                          {/* Shadow Distance Annotation */}
                          <line
                            x1="220"
                            y1="204"
                            x2={shadowEndX}
                            y2="204"
                            stroke="#f43f5e"
                            strokeWidth="1"
                            strokeDasharray="2 2"
                          />
                          <circle cx={shadowEndX} cy="204" r="2" fill="#f43f5e" />
                          <text
                            x={(220 + shadowEndX) / 2}
                            y="216"
                            fill="#f43f5e"
                            fontSize="8"
                            textAnchor="middle"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            Shadow: {solarData.habitatShadowLengthM >= 1000
                              ? `${(solarData.habitatShadowLengthM / 1000).toFixed(2)} km`
                              : `${solarData.habitatShadowLengthM} m`}
                          </text>
                        </>
                      );
                    })()}
                  </g>
                )}

                {/* SUNLIGHT RAYS TOWARD THE DOME */}
                {solarData.isSunlit && (
                  <line
                    x1={sunPos.x}
                    y1={sunPos.y}
                    x2="220"
                    y2="195"
                    stroke="#facc15"
                    strokeWidth="0.75"
                    strokeDasharray="3 3"
                    className="opacity-60"
                  />
                )}

                {/* THE GOLDEN SUN ICON */}
                {solarData.isSunlit ? (
                  <g transform={`translate(${sunPos.x}, ${sunPos.y})`} filter="url(#sunGlow)">
                    {/* Outer Solar Corona Pulse */}
                    <circle cx="0" cy="0" r="14" fill="#f59e0b" opacity="0.25" className="animate-pulse" />
                    {/* Middle Disk */}
                    <circle cx="0" cy="0" r="9" fill="#fbbf24" />
                    {/* Inner Core */}
                    <circle cx="0" cy="0" r="6" fill="#fffbeb" />

                    {/* Sun Rays */}
                    <line x1="0" y1="-12" x2="0" y2="-15" stroke="#fef08a" strokeWidth="1.5" />
                    <line x1="0" y1="12" x2="0" y2="15" stroke="#fef08a" strokeWidth="1.5" />
                    <line x1="-12" y1="0" x2="-15" y2="0" stroke="#fef08a" strokeWidth="1.5" />
                    <line x1="12" y1="0" x2="15" y2="0" stroke="#fef08a" strokeWidth="1.5" />

                    {/* Elevation readout tag next to sun */}
                    <rect
                      x="14"
                      y="-12"
                      width="54"
                      height="18"
                      rx="4"
                      fill="#020617"
                      stroke="#f59e0b"
                      strokeWidth="0.8"
                      opacity="0.9"
                    />
                    <text
                      x="41"
                      y="1"
                      fill="#fef08a"
                      fontSize="8"
                      textAnchor="middle"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {solarData.elevationDeg > 0 ? `+${solarData.elevationDeg}°` : `${solarData.elevationDeg}°`}
                    </text>
                  </g>
                ) : (
                  // Moon / Night indicator below horizon
                  <g transform={`translate(${sunPos.x}, ${Math.min(235, sunPos.y)})`}>
                    <circle cx="0" cy="0" r="7" fill="#334155" opacity="0.6" />
                    <text x="0" y="15" fill="#64748b" fontSize="7" textAnchor="middle" fontFamily="monospace">
                      Sub-horizon
                    </text>
                  </g>
                )}
              </svg>
            </div>

            {/* QUICK TELEMETRY PILL STRIP */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-xs font-mono">
              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">Sun Elevation</span>
                <span className="text-sm font-bold text-amber-400">
                  {solarData.elevationDeg > 0 ? `+${solarData.elevationDeg}°` : `${solarData.elevationDeg}°`}
                </span>
                <span className="text-[10px] text-slate-500 block truncate">
                  {body === "moon" ? "Grazing rim sun" : "Diurnal arc"}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">Solar Azimuth</span>
                <span className="text-sm font-bold text-cyan-300">
                  {solarData.azimuthDeg}°
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {solarData.hourAngleDeg >= 0 ? `+${solarData.hourAngleDeg}° HA` : `${solarData.hourAngleDeg}° HA`}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">Dome Shadow</span>
                <span className="text-sm font-bold text-rose-400">
                  {solarData.habitatShadowLengthM >= 1000
                    ? `${(solarData.habitatShadowLengthM / 1000).toFixed(2)} km`
                    : `${solarData.habitatShadowLengthM} m`}
                </span>
                <span className="text-[10px] text-slate-500 block truncate">
                  {body === "moon" ? "Casts across PSR" : "8m dome height"}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">Rim Shadow</span>
                <span className="text-sm font-bold text-purple-400">
                  {solarData.terrainShadowLengthKm} km
                </span>
                <span className="text-[10px] text-slate-500 block truncate">
                  {body === "moon" ? "Shackleton Rim (4.2km)" : "Mt. Sharp (5.5km)"}
                </span>
              </div>
            </div>
          </div>

          {/* TIME SCRUBBER & ANIMATION CONTROLS */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playButtonClick();
                    setIsPlaying(!isPlaying);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    isPlaying
                      ? "bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/30"
                      : "bg-cyan-600 hover:bg-cyan-500 text-white"
                  }`}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlaying ? "Pause Sun" : "Animate Orbit"}</span>
                </button>

                <div className="flex items-center rounded-lg bg-slate-950 border border-slate-700/60 p-0.5">
                  {[1, 2, 5].map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => setPlaySpeed(spd)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer ${
                        playSpeed === spd
                          ? "bg-cyan-500 text-slate-950 font-bold"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Time display */}
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Sol Hour:</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-cyan-400 font-bold text-sm">
                  {Math.floor(timeHour).toString().padStart(2, "0")}:
                  {Math.floor((timeHour % 1) * 60)
                    .toString()
                    .padStart(2, "0")}
                </span>
              </div>
            </div>

            {/* Slider */}
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-slate-400 w-10">00:00</span>
              <input
                type="range"
                min="0"
                max={body === "moon" ? 24.0 : CELESTIAL_CONSTANTS.mars.solDurationHours}
                step="0.1"
                value={timeHour}
                onChange={(e) => {
                  setTimeHour(parseFloat(e.target.value));
                  if (isPlaying) setIsPlaying(false);
                }}
                className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-950 rounded-lg"
              />
              <span className="text-[11px] font-mono text-slate-400 w-10 text-right">
                {body === "moon" ? "24:00" : "24:39"}
              </span>
            </div>

            {/* Sol Stepper & Height / Dust Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono pt-1 text-slate-400">
              <div className="flex items-center gap-2">
                <span>Sol #{sol}</span>
                <button
                  type="button"
                  onClick={() => setSol((s) => Math.max(1, s - 1))}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => setSol((s) => s + 1)}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
                >
                  +
                </button>
                <span className="text-[10px] text-slate-500 hidden sm:inline">
                  {body === "moon" ? "(Lunar Precession)" : "(Mars 668.6 Sol Orbit)"}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Dome Height Slider */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-[11px]">Dome:</span>
                  <input
                    type="range"
                    min="4"
                    max="20"
                    step="1"
                    value={domeHeightM}
                    onChange={(e) => setDomeHeightM(parseFloat(e.target.value))}
                    className="w-16 accent-cyan-400 cursor-pointer h-1.5 bg-slate-950 rounded"
                  />
                  <span className="font-bold text-cyan-300 w-6">{domeHeightM}m</span>
                </div>

                {/* Mars Dust Storm Slider */}
                {body === "mars" && (
                  <div className="flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-amber-300 text-[11px]">Dust (τ):</span>
                    <input
                      type="range"
                      min="0.3"
                      max="5.0"
                      step="0.1"
                      value={tau}
                      onChange={(e) => setTau(parseFloat(e.target.value))}
                      className="w-16 accent-amber-400 cursor-pointer h-1.5 bg-slate-950 rounded"
                    />
                    <span className="font-bold text-amber-400 w-7">{tau.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: SOLAR FLUX TELEMETRY, EFFICIENCY & ARTEMIS MAST COMPARISON (5 COLS) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* LIVE FLUX GAUGES */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-cyan-800/40 flex flex-col gap-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="font-mono font-bold text-xs uppercase tracking-wider text-slate-200">
                  Solar Flux Telemetry
                </span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400">
                {body === "moon" ? "Vacuum Irradiance" : "REMS Atmospheric Model"}
              </span>
            </div>

            {/* Array Selection Radio Pills */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-mono text-slate-400">Array Configuration:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playButtonClick();
                    setArrayMode("vertical_mast");
                  }}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    arrayMode === "vertical_mast"
                      ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md font-black"
                      : "bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700/50"
                  }`}
                >
                  <span>🗼 Vertical Mast (VSAT)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playButtonClick();
                    setArrayMode("horizontal");
                  }}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    arrayMode === "horizontal"
                      ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-md font-black"
                      : "bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700/50"
                  }`}
                >
                  <span>📐 Flat Horizontal</span>
                </button>
              </div>
            </div>

            {/* Big Live Power & Optical Efficiency Readout */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">
                  Effective Captured Flux
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-200">
                    {solarData.effectiveArrayFlux}
                  </span>
                  <span className="text-xs font-mono text-slate-400 font-bold">W/m²</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  Solar Const: {solarData.solarConstant} W/m²
                </span>
              </div>

              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">
                  Optical Efficiency
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span
                    className={`text-2xl font-black font-mono ${
                      solarData.opticalEfficiencyPercent > 70
                        ? "text-emerald-400"
                        : solarData.opticalEfficiencyPercent > 20
                        ? "text-amber-400"
                        : "text-rose-400"
                    }`}
                  >
                    {solarData.opticalEfficiencyPercent}%
                  </span>
                </div>
                {/* Visual Progress Bar */}
                <div className="w-full bg-slate-900 rounded-full h-1.5 mt-1 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      solarData.opticalEfficiencyPercent > 70
                        ? "bg-emerald-400"
                        : solarData.opticalEfficiencyPercent > 20
                        ? "bg-amber-400"
                        : "bg-rose-500"
                    }`}
                    style={{ width: `${Math.min(100, solarData.opticalEfficiencyPercent)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* DETAILED FLUX COMPONENT BREAKDOWN */}
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center py-1 border-b border-slate-800/70">
                <span className="text-slate-400">Direct Beam Flux (I_dir):</span>
                <span className="font-bold text-amber-300">{solarData.directBeamFlux} W/m²</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-800/70">
                <span className="text-slate-400">Diffuse Sky Flux (I_diff):</span>
                <span className="font-bold text-cyan-300">
                  {solarData.diffuseSkyFlux} W/m² {body === "moon" && "(0 in vacuum)"}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-800/70">
                <span className="text-slate-400">Horizontal Flux (sin θ):</span>
                <span className="font-bold text-slate-300">{solarData.globalHorizontalFlux} W/m²</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-800/70">
                <span className="text-slate-400">Vertical Tower Flux (cos θ):</span>
                <span className="font-bold text-emerald-400">{solarData.verticalTowerFlux} W/m²</span>
              </div>
            </div>

            {/* LUNAR POLAR VERTICAL MAST SCIENTIFIC CALLOUT */}
            {body === "moon" && (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/40 via-yellow-950/30 to-amber-950/40 border border-amber-500/40 text-xs">
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-mono font-bold text-amber-300 uppercase text-[11px]">
                    Why Artemis VSAT Must Stand Vertical
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  At the Lunar South Pole, the Sun hovers at <strong>{solarData.elevationDeg}°</strong>.
                  A flat horizontal panel receives only <strong>{comparisonData.horiz.globalHorizontalFlux} W/m²</strong> (
                  {comparisonData.horiz.opticalEfficiencyPercent}%), while a <strong>Vertical Mast Array</strong> captures{" "}
                  <strong>{comparisonData.vert.verticalTowerFlux} W/m²</strong> ({comparisonData.vert.opticalEfficiencyPercent}%).
                </p>
                <div className="mt-2 flex items-center justify-between pt-1 border-t border-amber-500/30 font-mono text-[10px]">
                  <span className="text-amber-200">Vertical Mast Multiplier:</span>
                  <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                    +{verticalMastAdvantage}x More Power!
                  </span>
                </div>
              </div>
            )}

            {/* MARS DUST STORM SCIENTIFIC CALLOUT */}
            {body === "mars" && (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-orange-950/40 to-red-950/30 border border-orange-500/40 text-xs">
                <div className="flex items-center gap-2 mb-1">
                  <Wind className="w-4 h-4 text-orange-400 shrink-0" />
                  <span className="font-mono font-bold text-orange-300 uppercase text-[11px]">
                    Curiosity & Opportunity REMS Dust Attenuation
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  Martian atmospheric dust creates Beer-Lambert extinction{" "}
                  <code className="text-amber-300">I = I₀ · exp(-τ · airMass)</code>.
                  At τ = {tau.toFixed(1)}, solar flux drops by{" "}
                  <strong>
                    {(
                      (1 -
                        solarData.globalHorizontalFlux /
                          (solarData.solarConstant * Math.sin(Math.max(0.01, (solarData.elevationDeg * Math.PI) / 180)))) *
                      100
                    ).toFixed(0)}
                    %
                  </strong>{" "}
                  compared to a clear vacuum sky.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 24-HOUR DIURNAL TRAJECTORY GRAPH & MINI COMPARATOR */}
      {/* ------------------------------------------------------------- */}
      <div className="px-6 pb-6">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-300">
              Full Diurnal Insolation Curve ({body === "moon" ? "Shackleton 24h Sweep" : "Gale Crater 24.66h Sol"})
            </span>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2.5 h-0.5 bg-emerald-400 inline-block" />
                <span>Vertical Mast Flux</span>
              </span>
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="w-2.5 h-0.5 bg-cyan-400 inline-block" />
                <span>Horizontal Flux</span>
              </span>
            </div>
          </div>

          {/* SVG Plot */}
          <div className="w-full h-24">
            <svg viewBox="0 0 500 80" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="20" x2="500" y2="20" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" />
              <line x1="0" y1="50" x2="500" y2="50" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" />
              <line x1="0" y1="78" x2="500" y2="78" stroke="#475569" strokeWidth="1" />

              {/* Horizontal Flux Polyline */}
              <polyline
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2"
                points={diurnalCurve
                  .map((p, idx) => {
                    const x = (idx / (diurnalCurve.length - 1)) * 500;
                    const maxFlux = body === "moon" ? 1400 : 700;
                    const y = 78 - (p.globalFlux / maxFlux) * 65;
                    return `${x},${y}`;
                  })
                  .join(" ")}
              />

              {/* Vertical Mast Flux Polyline */}
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeDasharray={body === "moon" ? "none" : "3 2"}
                points={diurnalCurve
                  .map((p, idx) => {
                    const x = (idx / (diurnalCurve.length - 1)) * 500;
                    const maxFlux = body === "moon" ? 1400 : 700;
                    const y = 78 - (p.verticalFlux / maxFlux) * 65;
                    return `${x},${y}`;
                  })
                  .join(" ")}
              />

              {/* Current Time Cursor Line */}
              {(() => {
                const maxTime = body === "moon" ? 24.0 : CELESTIAL_CONSTANTS.mars.solDurationHours;
                const cursorX = (timeHour / maxTime) * 500;
                return (
                  <g>
                    <line x1={cursorX} y1="5" x2={cursorX} y2="78" stroke="#f59e0b" strokeWidth="1.5" />
                    <circle cx={cursorX} cy="10" r="3" fill="#f59e0b" />
                  </g>
                );
              })()}
            </svg>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* EDUCATIONAL MODAL: WHY LUNAR POLAR ARRAYS MUST BE VERTICAL */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {showEducationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setShowEducationModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl bg-gradient-to-b from-[#09152b] via-[#050b16] to-[#02050b] border border-cyan-500/50 rounded-3xl p-6 shadow-2xl text-slate-100"
            >
              <div className="flex items-center justify-between pb-3 border-b border-cyan-800/40">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                    <Sun className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-mono font-bold text-base text-amber-300">
                      STEM Orbital Mechanics Guide: Moon vs. Mars
                    </h3>
                    <p className="text-xs text-slate-400">
                      Why Lunar South Pole Outposts Deploy Vertical Solar Masts
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEducationModal(false)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-4 space-y-4 text-xs leading-relaxed max-h-[70vh] overflow-y-auto pr-2">
                {/* Principle 1 */}
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-700/60">
                  <h4 className="font-mono font-bold text-cyan-300 text-sm mb-1">
                    1. The 1.5° Axial Tilt & Grazing Sunlight
                  </h4>
                  <p className="text-slate-300">
                    The Moon’s obliquity to the ecliptic is only <strong>1.54°</strong> (compared to Earth's 23.5°
                    and Mars' 25.2°). Because of this slight tilt, an observer at Shackleton Crater Rim (89.9°S)
                    never sees the Sun rise high into the zenith. Instead, the Sun slowly circles the 360° horizon,
                    skimming perpetually at <strong>1° to 3° above the horizon</strong>.
                  </p>
                </div>

                {/* Principle 2 */}
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-700/60">
                  <h4 className="font-mono font-bold text-amber-300 text-sm mb-1">
                    2. Lambert’s Cosine Law: Horizontal vs. Vertical Masts
                  </h4>
                  <p className="text-slate-300">
                    Solar irradiance intercepted by a surface follows Lambert’s cosine law:
                  </p>
                  <ul className="mt-2 space-y-1 font-mono text-[11px] bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <li className="text-rose-300">
                      • Horizontal Array: <code className="text-white">I = S₀ · sin(θ)</code> → At θ = 1.5°, sin(1.5°) = 0.026.
                      Captured flux is only <strong>~35 W/m²</strong> (a 97.4% loss!).
                    </li>
                    <li className="text-emerald-300">
                      • Vertical Mast Array: <code className="text-white">I = S₀ · cos(θ)</code> → At θ = 1.5°, cos(1.5°) = 0.9996.
                      Captured flux is <strong>~1360 W/m²</strong> (virtually 100% full solar constant!).
                    </li>
                  </ul>
                  <p className="text-slate-300 mt-2">
                    This is why NASA’s Artemis <strong>Vertical Solar Array Technology (VSAT)</strong> mounts arrays on
                    10-to-20-meter vertical masts that slowly rotate 360° to track the grazing polar sun!
                  </p>
                </div>

                {/* Principle 3 */}
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-700/60">
                  <h4 className="font-mono font-bold text-purple-300 text-sm mb-1">
                    3. Gigantic 20+ Kilometer Shadows & Permanently Shadowed Regions (PSRs)
                  </h4>
                  <p className="text-slate-300">
                    With shadow length <code className="text-cyan-300">L = h / tan(θ)</code>, small obstacles cast
                    colossal shadows:
                  </p>
                  <ul className="mt-2 space-y-1 font-mono text-[11px] bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <li>• An 8-meter habitat dome casts a <strong>~300 to 500-meter</strong> shadow!</li>
                    <li>
                      • The 4.2-kilometer-high rim of Shackleton Crater casts shadows extending over{" "}
                      <strong>20 to 120 kilometers</strong> across the crater floor, ensuring the interior floor has
                      remained in perpetual sub-zero cryogenic darkness for over 2 billion years (preserving water ice!).
                    </li>
                  </ul>
                </div>

                {/* Principle 4 */}
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-700/60">
                  <h4 className="font-mono font-bold text-orange-300 text-sm mb-1">
                    4. Mars Contrast: Diurnal Cycle & Atmospheric Dust (Tau)
                  </h4>
                  <p className="text-slate-300">
                    On Mars (Gale Crater), Mars has a 25.2° axial tilt and a 24-hour 39-minute Sol. The sun rises in the
                    east and climbs to over 80° at local solar noon. However, solar flux is governed by atmospheric dust
                    optical depth (τ):
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-amber-200">
                    Beer-Lambert Extinction: <code className="text-white">I_direct = S₀ · exp(-τ · m)</code>
                  </p>
                  <p className="text-slate-300 mt-1">
                    During regional or global dust storms (like the 2018 storm that ended Opportunity), optical depth
                    exceeds τ &gt; 8.0, reducing direct solar irradiance by more than 98%.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowEducationModal(false)}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-all cursor-pointer shadow-md"
                >
                  Understood, Flight Director!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
