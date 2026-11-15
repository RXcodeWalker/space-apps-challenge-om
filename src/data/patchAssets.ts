// ============================================================
// patchAssets.ts — NASA Expedition Mission Patch Assets & Configurations
// NASA Space Apps Challenge · Outpost Commander
//
// Historic expeditions (Apollo 11, Artemis II, Curiosity) feature
// custom embroidered mission patches. This configuration provides
// authentic crest shapes, insignia symbols, NASA color schemes,
// and expedition mottoes with full vector graphics & embroidery effects.
// ============================================================

import React from "react";

export type CrestShapeId = "shield" | "circle" | "hexagon" | "chevron";

export type InsigniaSymbolId =
  | "artemis_moon"
  | "mars_mountain"
  | "falcon_rocket"
  | "wheat_sprout"
  | "atomic_orbit"
  | "solar_array";

export type PatchColorSchemeId =
  | "apollo_gold_navy"
  | "artemis_blue_silver"
  | "mars_terracotta_sand"
  | "deep_space_neon";

export type ExpeditionMotto =
  | "Ad Astra"
  | "Survive to Thrive"
  | "Systems First"
  | "Pioneers of Shackleton";

export interface CrestShapeDefinition {
  id: CrestShapeId;
  name: string;
  tagline: string;
  description: string;
  viewBox: string;
  // Outer outline SVG path for clipping and background fill
  outerPath: string;
  // Inner embroidery border path for the stitched rim
  innerStitchPath: string;
  // Rocker banner or arch style details
  bannerTopPath?: string;
  bannerBottomPath?: string;
  bannerTopCenter: { x: number; y: number };
  bannerBottomCenter: { x: number; y: number };
  badgeCenter: { x: number; y: number };
}

export interface PatchColorSchemeDefinition {
  id: PatchColorSchemeId;
  name: string;
  tagline: string;
  paletteDescription: string;
  primary: string; // Vibrant heraldic tone
  secondary: string; // Secondary accent / shadow
  accent: string; // Highlighting tone
  darkBg: string; // Dark patch background fill
  gradientStops: [string, string, string]; // Top to bottom radial/linear gradient
  borderThread: string; // Outer merrowed border thread
  innerStitch: string; // Inner embroidery stitch line
  textColor: string; // Text font color
  bannerFill: string; // Rocker banner background
  bannerText: string; // Rocker banner text
  starColor: string; // Background stars
  glowColor: string; // Luminous accent glow
}

export interface InsigniaSymbolDefinition {
  id: InsigniaSymbolId;
  name: string;
  category: "Celestial" | "Engineering" | "Life Support" | "Propulsion";
  description: string;
  historicContext: string;
  render: (colors: PatchColorSchemeDefinition) => React.ReactNode;
}

export interface MissionPatchState {
  crestShape: CrestShapeId;
  symbol: InsigniaSymbolId;
  colorScheme: PatchColorSchemeId;
  motto: string;
  commanderCallsign: string;
  outpostName: string;
  expeditionYear?: string;
  starCount?: number;
  showTwillTexture?: boolean;
  showMerrowedEdge?: boolean;
  savedAt?: number;
}

// ============================================================
// 1. CREST SHAPES CONFIGURATION
// Coordinate system is standard 500x500 (Center at 250, 250)
// ============================================================
export const CREST_SHAPES: Record<CrestShapeId, CrestShapeDefinition> = {
  circle: {
    id: "circle",
    name: "Apollo Circle",
    tagline: "Historic Apollo 11 & Gemini Round Emblem",
    description:
      "The classic circular mission patch worn by Apollo 11 moonwalkers and ISS expedition commanders. Features concentric embroidery rings and circular arc rockers.",
    viewBox: "0 0 500 500",
    outerPath: "M 250 30 A 220 220 0 1 1 249.9 30 Z",
    innerStitchPath: "M 250 48 A 202 202 0 1 1 249.9 48 Z",
    bannerTopPath: "M 80 250 A 170 170 0 0 1 420 250",
    bannerBottomPath: "M 80 250 A 170 170 0 0 0 420 250",
    bannerTopCenter: { x: 250, y: 100 },
    bannerBottomCenter: { x: 250, y: 405 },
    badgeCenter: { x: 250, y: 250 },
  },
  shield: {
    id: "shield",
    name: "Aerospace Shield",
    tagline: "Apollo 16 & Deep Space Defense Heraldry",
    description:
      "Aerospace heraldic shield with a flat top for the outpost name rocker, vertical defensive walls, and an arched keel pointing toward the stars.",
    viewBox: "0 0 500 500",
    outerPath:
      "M 75 55 L 425 55 L 425 275 C 425 375 345 440 250 470 C 155 440 75 375 75 275 Z",
    innerStitchPath:
      "M 92 72 L 408 72 L 408 270 C 408 360 335 422 250 450 C 165 422 92 360 92 270 Z",
    bannerTopCenter: { x: 250, y: 88 },
    bannerBottomCenter: { x: 250, y: 405 },
    badgeCenter: { x: 250, y: 245 },
  },
  hexagon: {
    id: "hexagon",
    name: "Hexagonal Airlock",
    tagline: "JWST Beryllium Mirror & Habitat Modular Hull",
    description:
      "A high-tech 6-sided polygon representing the interlocking beryllium mirrors of the James Webb Space Telescope and modular lunar habitat airlocks.",
    viewBox: "0 0 500 500",
    outerPath:
      "M 250 35 L 440 145 L 440 355 L 250 465 L 60 355 L 60 145 Z",
    innerStitchPath:
      "M 250 54 L 424 154 L 424 346 L 250 446 L 76 346 L 76 154 Z",
    bannerTopCenter: { x: 250, y: 92 },
    bannerBottomCenter: { x: 250, y: 410 },
    badgeCenter: { x: 250, y: 250 },
  },
  chevron: {
    id: "chevron",
    name: "Retro NASA Vector Chevron",
    tagline: "1960s Aeronautics Hypersonic Arrowhead",
    description:
      "Inspired by NASA's iconic aeronautics vector chevron and 1960s flight test patches. Swept aerodynamic wings taper into a supersonic forward vector.",
    viewBox: "0 0 500 500",
    outerPath:
      "M 250 40 L 450 160 L 385 325 L 250 465 L 115 325 L 50 160 Z",
    innerStitchPath:
      "M 250 60 L 430 168 L 372 318 L 250 445 L 128 318 L 70 168 Z",
    bannerTopCenter: { x: 250, y: 95 },
    bannerBottomCenter: { x: 250, y: 400 },
    badgeCenter: { x: 250, y: 245 },
  },
};

// ============================================================
// 2. NASA COLOR SCHEMES CONFIGURATION
// ============================================================
export const PATCH_COLOR_SCHEMES: Record<PatchColorSchemeId, PatchColorSchemeDefinition> = {
  apollo_gold_navy: {
    id: "apollo_gold_navy",
    name: "Apollo Gold / Navy",
    tagline: "Apollo 11 Lunar Heritage",
    paletteDescription: "Deep aerospace navy with lustrous 24K gold embroidery thread and brilliant stars.",
    primary: "#F59E0B",
    secondary: "#0F172A",
    accent: "#FCD34D",
    darkBg: "#0B1528",
    gradientStops: ["#1E3A8A", "#0F172A", "#030712"],
    borderThread: "#EAB308",
    innerStitch: "#FEF08A",
    textColor: "#FFFFFF",
    bannerFill: "#172554",
    bannerText: "#FCD34D",
    starColor: "#FDE68A",
    glowColor: "rgba(245, 158, 11, 0.45)",
  },
  artemis_blue_silver: {
    id: "artemis_blue_silver",
    name: "Artemis Blue / Silver",
    tagline: "Lunar South Pole & Next-Gen Exploration",
    paletteDescription: "Electric Artemis blue and aerospace titanium silver thread with glacial highlights.",
    primary: "#0284C7",
    secondary: "#082F49",
    accent: "#38BDF8",
    darkBg: "#051329",
    gradientStops: ["#0284C7", "#082F49", "#020617"],
    borderThread: "#E2E8F0",
    innerStitch: "#94A3B8",
    textColor: "#FFFFFF",
    bannerFill: "#0369A1",
    bannerText: "#E0F2FE",
    starColor: "#E0F2FE",
    glowColor: "rgba(56, 189, 248, 0.45)",
  },
  mars_terracotta_sand: {
    id: "mars_terracotta_sand",
    name: "Mars Terracotta / Sand",
    tagline: "Gale Crater & Red Planet Regolith",
    paletteDescription: "Rich ferric rust terracotta with warm desert sandstone and dark volcanic basalt.",
    primary: "#EA580C",
    secondary: "#431407",
    accent: "#FED7AA",
    darkBg: "#220B05",
    gradientStops: ["#C2410C", "#431407", "#170502"],
    borderThread: "#FB923C",
    innerStitch: "#FDBA74",
    textColor: "#FFF7ED",
    bannerFill: "#9A3412",
    bannerText: "#FFEDD5",
    starColor: "#FFEDD5",
    glowColor: "rgba(234, 88, 12, 0.45)",
  },
  deep_space_neon: {
    id: "deep_space_neon",
    name: "Deep Space Neon",
    tagline: "Cyber Telemetry & Outer Void",
    paletteDescription: "High-contrast ultraviolet magenta and electric cyan for deep space expeditions.",
    primary: "#D946EF",
    secondary: "#3B0764",
    accent: "#06B6D4",
    darkBg: "#0A0214",
    gradientStops: ["#7E22CE", "#3B0764", "#03000E"],
    borderThread: "#C084FC",
    innerStitch: "#22D3EE",
    textColor: "#FDF4FF",
    bannerFill: "#581C87",
    bannerText: "#67E8F9",
    starColor: "#67E8F9",
    glowColor: "rgba(217, 70, 239, 0.45)",
  },
};

// ============================================================
// 3. EXPEDITION MOTTOES CONFIGURATION
// ============================================================
export interface ExpeditionMottoItem {
  motto: ExpeditionMotto;
  latinOrSource: string;
  englishTranslation: string;
  theme: string;
}

export const EXPEDITION_MOTTOES: ExpeditionMottoItem[] = [
  {
    motto: "Ad Astra",
    latinOrSource: "Latin Proverb (Per Aspera Ad Astra)",
    englishTranslation: "To the Stars Through Hardships",
    theme: "Exploration & Deep Space Ambition",
  },
  {
    motto: "Survive to Thrive",
    latinOrSource: "NASA Habitat Closed-Loop Axiom",
    englishTranslation: "Enduring the Elements to Build Tomorrow",
    theme: "Resilience & Survival",
  },
  {
    motto: "Systems First",
    latinOrSource: "Apollo Engineering Discipline",
    englishTranslation: "Redundancy, Life Support & Precision",
    theme: "Engineering & Safety",
  },
  {
    motto: "Pioneers of Shackleton",
    latinOrSource: "Artemis Polar Basecamp Creed",
    englishTranslation: "Lighting the Eternal Darkness of Lunar Ice",
    theme: "Permanent Settlement",
  },
];

// ============================================================
// 4. PRIMARY INSIGNIA SYMBOLS (PURE SVG VECTORS VIA React.createElement)
// Pure TypeScript compatible: 0 JSX syntax tags in .ts file
// ============================================================
export const INSIGNIA_SYMBOLS: Record<InsigniaSymbolId, InsigniaSymbolDefinition> = {
  artemis_moon: {
    id: "artemis_moon",
    name: "Artemis Moon Crescent",
    category: "Celestial",
    description: "Crescent moon with polar craters and a dynamic orbital trajectory arc reaching for deep space.",
    historicContext: "Represents NASA's Artemis program returning humanity to the Moon and on to Mars.",
    render: (c: PatchColorSchemeDefinition) =>
      React.createElement(
        "g",
        { id: "symbol-artemis-moon", className: "patch-insignia" },
        // Lunar Glow
        React.createElement("circle", {
          cx: 250,
          cy: 245,
          r: 115,
          fill: c.glowColor,
          opacity: 0.6,
        }),
        // Crescent Moon Body
        React.createElement("path", {
          d: "M 230 140 A 105 105 0 1 0 355 265 A 88 88 0 1 1 230 140 Z",
          fill: c.accent,
          stroke: c.textColor,
          strokeWidth: 3,
        }),
        // Moon Craters
        React.createElement("ellipse", { cx: 190, cy: 225, rx: 16, ry: 12, fill: c.secondary, opacity: 0.4 }),
        React.createElement("circle", { cx: 215, cy: 285, r: 14, fill: c.secondary, opacity: 0.45 }),
        React.createElement("circle", { cx: 265, cy: 315, r: 10, fill: c.secondary, opacity: 0.4 }),
        React.createElement("circle", { cx: 180, cy: 265, r: 8, fill: c.secondary, opacity: 0.35 }),
        // Shackleton Crater Rim
        React.createElement("ellipse", {
          cx: 215,
          cy: 285,
          rx: 14,
          ry: 10,
          fill: "none",
          stroke: c.primary,
          strokeWidth: 2,
        }),
        // Artemis Trajectory Arc
        React.createElement("path", {
          d: "M 130 330 C 170 360, 280 370, 345 285 C 385 230, 375 160, 315 135",
          fill: "none",
          stroke: c.primary,
          strokeWidth: 5,
          strokeLinecap: "round",
        }),
        React.createElement("path", {
          d: "M 130 330 C 170 360, 280 370, 345 285 C 385 230, 375 160, 315 135",
          fill: "none",
          stroke: "#FFFFFF",
          strokeWidth: 2,
          strokeDasharray: "6 4",
        }),
        // Artemis Arrowhead Vector
        React.createElement("polygon", {
          points: "315,135 300,145 310,155",
          fill: c.primary,
          stroke: "#FFFFFF",
          strokeWidth: 1.5,
        }),
        // 4-Point Artemis Guiding Star
        React.createElement(
          "g",
          { transform: "translate(340, 160)" },
          React.createElement("path", {
            d: "M 0 -18 Q 0 0 18 0 Q 0 0 0 18 Q 0 0 -18 0 Q 0 0 0 -18 Z",
            fill: c.primary,
            stroke: "#FFFFFF",
            strokeWidth: 1.5,
          }),
          React.createElement("circle", { cx: 0, cy: 0, r: 3, fill: "#FFFFFF" })
        )
      ),
  },

  mars_mountain: {
    id: "mars_mountain",
    name: "Mars Gale Mountain",
    category: "Celestial",
    description: "Towering Mount Sharp (Aeolis Mons) with geological strata, crater rim, and twin Martian moons.",
    historicContext: "Honors the Curiosity and Perseverance rovers scaling ancient sedimentary layers inside Gale Crater.",
    render: (c: PatchColorSchemeDefinition) =>
      React.createElement(
        "g",
        { id: "symbol-mars-mountain", className: "patch-insignia" },
        // Glow
        React.createElement("circle", {
          cx: 250,
          cy: 245,
          r: 110,
          fill: c.glowColor,
          opacity: 0.65,
        }),
        // Martian Moons Phobos & Deimos
        React.createElement("circle", { cx: 175, cy: 165, r: 8, fill: c.accent, stroke: c.textColor, strokeWidth: 1.5 }),
        React.createElement("ellipse", { cx: 177, cy: 164, rx: 2, ry: 1.5, fill: c.secondary }),
        React.createElement("circle", { cx: 325, cy: 150, r: 5, fill: c.primary, stroke: c.textColor, strokeWidth: 1 }),
        // Gale Crater Rim Silhouette
        React.createElement("path", {
          d: "M 140 310 Q 185 250 250 265 Q 315 250 360 310 Z",
          fill: c.secondary,
          opacity: 0.75,
        }),
        // Mount Sharp Peak - Shaded Face
        React.createElement("polygon", {
          points: "250,155 160,330 250,330",
          fill: c.secondary,
          stroke: c.primary,
          strokeWidth: 2,
        }),
        // Mount Sharp Peak - Sunlit Face
        React.createElement("polygon", {
          points: "250,155 250,330 340,330",
          fill: c.primary,
          stroke: c.accent,
          strokeWidth: 2,
        }),
        // Central Ridge Line
        React.createElement("line", {
          x1: 250,
          y1: 155,
          x2: 250,
          y2: 330,
          stroke: c.accent,
          strokeWidth: 3,
          strokeLinecap: "round",
        }),
        // Strata Layer Lines
        React.createElement("path", { d: "M 195 260 L 250 260 L 305 260", stroke: c.textColor, strokeWidth: 2, opacity: 0.8 }),
        React.createElement("path", { d: "M 180 290 L 250 290 L 320 290", stroke: c.accent, strokeWidth: 2.5 }),
        React.createElement("path", { d: "M 210 230 L 250 230 L 290 230", stroke: c.textColor, strokeWidth: 1.5, opacity: 0.7 }),
        // Foreground Sand Dune Contours
        React.createElement("path", {
          d: "M 130 335 Q 200 315 250 335 Q 300 355 370 335 L 370 355 L 130 355 Z",
          fill: c.accent,
          opacity: 0.9,
        }),
        // Rover Tread Track
        React.createElement("path", {
          d: "M 180 345 L 320 345",
          stroke: c.secondary,
          strokeWidth: 3,
          strokeDasharray: "5 4",
        })
      ),
  },

  falcon_rocket: {
    id: "falcon_rocket",
    name: "Falcon Rocket",
    category: "Propulsion",
    description: "High-thrust reusable orbital launch vehicle with hypersonic grid fins and diamond exhaust plume.",
    historicContext: "Symbolizes modern commercial orbital rocketry and rapid payload delivery to cis-lunar space.",
    render: (c: PatchColorSchemeDefinition) =>
      React.createElement(
        "g",
        { id: "symbol-falcon-rocket", className: "patch-insignia" },
        // Thrust halo
        React.createElement("circle", {
          cx: 250,
          cy: 300,
          r: 85,
          fill: c.glowColor,
          opacity: 0.75,
        }),
        // Mach Shock Diamonds
        React.createElement("polygon", { points: "250,305 240,320 250,335 260,320", fill: "#FFFFFF" }),
        React.createElement("polygon", { points: "250,335 242,348 250,360 258,348", fill: c.accent }),
        React.createElement("polygon", { points: "250,360 244,370 250,380 256,370", fill: c.primary }),
        // Rocket Exhaust Fire Plume
        React.createElement("path", {
          d: "M 240 295 Q 220 350 250 395 Q 280 350 260 295 Z",
          fill: c.primary,
          opacity: 0.85,
        }),
        React.createElement("path", {
          d: "M 244 295 Q 232 340 250 375 Q 268 340 256 295 Z",
          fill: c.accent,
          opacity: 0.95,
        }),
        // Vapor Trails
        React.createElement("path", {
          d: "M 215 350 Q 235 320 240 295",
          stroke: c.accent,
          strokeWidth: 2,
          fill: "none",
          strokeLinecap: "round",
        }),
        React.createElement("path", {
          d: "M 285 350 Q 265 320 260 295",
          stroke: c.accent,
          strokeWidth: 2,
          fill: "none",
          strokeLinecap: "round",
        }),
        // Rocket Booster Body
        React.createElement("rect", {
          x: 238,
          y: 160,
          width: 24,
          height: 135,
          rx: 3,
          fill: "#FFFFFF",
          stroke: c.secondary,
          strokeWidth: 2,
        }),
        // Interstage Separation Band
        React.createElement("rect", { x: 238, y: 195, width: 24, height: 6, fill: c.secondary }),
        // Fairing Nosecone
        React.createElement("path", {
          d: "M 238 160 Q 250 115 250 115 Q 250 115 262 160 Z",
          fill: "#FFFFFF",
          stroke: c.secondary,
          strokeWidth: 2,
        }),
        React.createElement("path", { d: "M 250 115 L 250 160", stroke: c.primary, strokeWidth: 2.5 }),
        // Titanium Grid Fins
        React.createElement("rect", { x: 228, y: 200, width: 10, height: 7, rx: 1.5, fill: c.primary, stroke: c.secondary, strokeWidth: 1 }),
        React.createElement("rect", { x: 262, y: 200, width: 10, height: 7, rx: 1.5, fill: c.primary, stroke: c.secondary, strokeWidth: 1 }),
        // Aerodynamic Base Fins
        React.createElement("polygon", { points: "238,275 220,295 238,295", fill: c.primary, stroke: c.secondary, strokeWidth: 1.5 }),
        React.createElement("polygon", { points: "262,275 280,295 262,295", fill: c.primary, stroke: c.secondary, strokeWidth: 1.5 }),
        // NASA Meatball Accent Circle
        React.createElement("circle", { cx: 250, cy: 235, r: 4, fill: c.primary })
      ),
  },

  wheat_sprout: {
    id: "wheat_sprout",
    name: "Hydroponic Wheat Sprout",
    category: "Life Support",
    description: "Golden grain stalk and lush botanical leaves enclosed within a circular closed-loop biosphere.",
    historicContext: "Represents bioregenerative life support systems (BLSS) feeding astronauts on multi-year journeys.",
    render: (c: PatchColorSchemeDefinition) =>
      React.createElement(
        "g",
        { id: "symbol-wheat-sprout", className: "patch-insignia" },
        // Biosphere Halo
        React.createElement("circle", {
          cx: 250,
          cy: 245,
          r: 105,
          fill: c.glowColor,
          opacity: 0.6,
        }),
        // Circular Biosphere Rings
        React.createElement("circle", {
          cx: 250,
          cy: 245,
          r: 95,
          fill: "none",
          stroke: c.primary,
          strokeWidth: 3,
          strokeDasharray: "12 6",
        }),
        React.createElement("circle", {
          cx: 250,
          cy: 245,
          r: 86,
          fill: "none",
          stroke: c.accent,
          strokeWidth: 1.5,
          opacity: 0.6,
        }),
        // Hydroponic Nutrient Droplet
        React.createElement("path", {
          d: "M 250 310 C 235 335, 235 355, 250 355 C 265 355, 265 335, 250 310 Z",
          fill: c.primary,
          stroke: c.textColor,
          strokeWidth: 2,
        }),
        React.createElement("circle", { cx: 247, cy: 342, r: 3, fill: "#FFFFFF", opacity: 0.8 }),
        // Central Plant Stem
        React.createElement("path", {
          d: "M 250 320 Q 248 240 250 150",
          stroke: c.primary,
          strokeWidth: 5,
          strokeLinecap: "round",
          fill: "none",
        }),
        // Left Leaf
        React.createElement("path", {
          d: "M 248 260 C 205 255, 185 220, 195 195 C 220 205, 245 235, 248 260 Z",
          fill: c.accent,
          stroke: c.textColor,
          strokeWidth: 2,
        }),
        // Right Leaf
        React.createElement("path", {
          d: "M 252 230 C 295 225, 315 190, 305 165 C 280 175, 255 205, 252 230 Z",
          fill: c.accent,
          stroke: c.textColor,
          strokeWidth: 2,
        }),
        // Wheat Kernels
        React.createElement("ellipse", { cx: 250, cy: 145, rx: 6, ry: 12, fill: c.primary, stroke: c.textColor, strokeWidth: 1.5 }),
        React.createElement("ellipse", { cx: 242, cy: 165, rx: 6, ry: 10, transform: "rotate(-25 242 165)", fill: c.primary, stroke: c.textColor, strokeWidth: 1.5 }),
        React.createElement("ellipse", { cx: 258, cy: 165, rx: 6, ry: 10, transform: "rotate(25 258 165)", fill: c.primary, stroke: c.textColor, strokeWidth: 1.5 }),
        React.createElement("ellipse", { cx: 242, cy: 190, rx: 6, ry: 10, transform: "rotate(-25 242 190)", fill: c.accent, stroke: c.textColor, strokeWidth: 1.5 }),
        React.createElement("ellipse", { cx: 258, cy: 190, rx: 6, ry: 10, transform: "rotate(25 258 190)", fill: c.accent, stroke: c.textColor, strokeWidth: 1.5 }),
        // Water / Oxygen Bubbles
        React.createElement("circle", { cx: 215, cy: 155, r: 5, fill: "#FFFFFF", opacity: 0.9 }),
        React.createElement("circle", { cx: 285, cy: 270, r: 4, fill: "#FFFFFF", opacity: 0.8 }),
        React.createElement("circle", { cx: 275, cy: 140, r: 6, fill: c.accent, opacity: 0.85 })
      ),
  },

  atomic_orbit: {
    id: "atomic_orbit",
    name: "Atomic Electron Orbit",
    category: "Engineering",
    description: "Kilopower nuclear reactor core encircled by 3 interlocking quantum orbital electron rings.",
    historicContext: "Symbolizes Stirling nuclear fission power (Kilopower) sustaining human outposts through 14-day lunar nights.",
    render: (c: PatchColorSchemeDefinition) =>
      React.createElement(
        "g",
        { id: "symbol-atomic-orbit", className: "patch-insignia" },
        // Glow
        React.createElement("circle", {
          cx: 250,
          cy: 245,
          r: 95,
          fill: c.glowColor,
          opacity: 0.8,
        }),
        // Ring 1 (Horizontal)
        React.createElement("ellipse", {
          cx: 250,
          cy: 245,
          rx: 105,
          ry: 38,
          fill: "none",
          stroke: c.primary,
          strokeWidth: 3.5,
          strokeDasharray: "14 6",
        }),
        // Ring 2 (60 deg rotated)
        React.createElement(
          "g",
          { transform: "rotate(60 250 245)" },
          React.createElement("ellipse", {
            cx: 250,
            cy: 245,
            rx: 105,
            ry: 38,
            fill: "none",
            stroke: c.accent,
            strokeWidth: 3.5,
          }),
          React.createElement("circle", { cx: 345, cy: 245, r: 7, fill: "#FFFFFF", stroke: c.primary, strokeWidth: 2 })
        ),
        // Ring 3 (120 deg rotated)
        React.createElement(
          "g",
          { transform: "rotate(120 250 245)" },
          React.createElement("ellipse", {
            cx: 250,
            cy: 245,
            rx: 105,
            ry: 38,
            fill: "none",
            stroke: c.primary,
            strokeWidth: 3.5,
            strokeDasharray: "8 4",
          }),
          React.createElement("circle", { cx: 155, cy: 245, r: 7, fill: "#FFFFFF", stroke: c.accent, strokeWidth: 2 })
        ),
        // Orbiting Electrons on Ring 1
        React.createElement("circle", { cx: 350, cy: 245, r: 7.5, fill: "#FFFFFF", stroke: c.primary, strokeWidth: 2.5 }),
        React.createElement("circle", { cx: 150, cy: 245, r: 5, fill: c.accent }),
        // Reactor Core Nucleus
        React.createElement("circle", { cx: 250, cy: 245, r: 26, fill: c.primary, stroke: c.textColor, strokeWidth: 3 }),
        React.createElement("circle", { cx: 250, cy: 245, r: 16, fill: "#FFFFFF" }),
        React.createElement("circle", { cx: 250, cy: 245, r: 8, fill: c.secondary }),
        // Quantum Energy Sparks
        React.createElement("line", { x1: 250, y1: 205, x2: 250, y2: 195, stroke: c.accent, strokeWidth: 3, strokeLinecap: "round" }),
        React.createElement("line", { x1: 250, y1: 285, x2: 250, y2: 295, stroke: c.accent, strokeWidth: 3, strokeLinecap: "round" }),
        React.createElement("line", { x1: 210, y1: 245, x2: 200, y2: 245, stroke: c.accent, strokeWidth: 3, strokeLinecap: "round" }),
        React.createElement("line", { x1: 290, y1: 245, x2: 300, y2: 245, stroke: c.accent, strokeWidth: 3, strokeLinecap: "round" })
      ),
  },

  solar_array: {
    id: "solar_array",
    name: "Solar Array Wing",
    category: "Engineering",
    description: "Dual deployable photovoltaic solar array wings capturing solar radiation with photon sunburst.",
    historicContext: "Honors the International Space Station and Lunar Gateway's roll-out solar arrays (ROSA).",
    render: (c: PatchColorSchemeDefinition) =>
      React.createElement(
        "g",
        { id: "symbol-solar-array", className: "patch-insignia" },
        // Photon Sunburst
        React.createElement("circle", {
          cx: 250,
          cy: 245,
          r: 110,
          fill: c.glowColor,
          opacity: 0.75,
        }),
        // Background Sun Disk
        React.createElement("circle", { cx: 250, cy: 245, r: 42, fill: c.accent, opacity: 0.3 }),
        // Radial Beams
        ...[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) =>
          React.createElement("line", {
            key: deg,
            x1: 250,
            y1: 245,
            x2: 250 + 105 * Math.cos((deg * Math.PI) / 180),
            y2: 245 + 105 * Math.sin((deg * Math.PI) / 180),
            stroke: c.accent,
            strokeWidth: 1.5,
            opacity: 0.5,
            strokeDasharray: "4 6",
          })
        ),
        // Left Wing
        React.createElement("polygon", {
          points: "135,195 225,205 225,285 135,295",
          fill: c.secondary,
          stroke: c.primary,
          strokeWidth: 2.5,
        }),
        React.createElement("line", { x1: 165, y1: 198, x2: 165, y2: 292, stroke: c.accent, strokeWidth: 1.5 }),
        React.createElement("line", { x1: 195, y1: 202, x2: 195, y2: 288, stroke: c.accent, strokeWidth: 1.5 }),
        React.createElement("line", { x1: 135, y1: 245, x2: 225, y2: 245, stroke: c.textColor, strokeWidth: 1.5 }),
        // Right Wing
        React.createElement("polygon", {
          points: "275,205 365,195 365,295 275,285",
          fill: c.secondary,
          stroke: c.primary,
          strokeWidth: 2.5,
        }),
        React.createElement("line", { x1: 305, y1: 202, x2: 305, y2: 288, stroke: c.accent, strokeWidth: 1.5 }),
        React.createElement("line", { x1: 335, y1: 198, x2: 335, y2: 292, stroke: c.accent, strokeWidth: 1.5 }),
        React.createElement("line", { x1: 275, y1: 245, x2: 365, y2: 245, stroke: c.textColor, strokeWidth: 1.5 }),
        // Spacecraft Truss Mast
        React.createElement("rect", {
          x: 234,
          y: 180,
          width: 32,
          height: 130,
          rx: 6,
          fill: c.primary,
          stroke: c.textColor,
          strokeWidth: 2,
        }),
        React.createElement("circle", { cx: 250, cy: 245, r: 10, fill: "#FFFFFF", stroke: c.secondary, strokeWidth: 2.5 }),
        React.createElement("circle", { cx: 250, cy: 245, r: 4, fill: c.primary }),
        // Telemetry Antenna
        React.createElement("line", { x1: 250, y1: 180, x2: 250, y2: 155, stroke: c.textColor, strokeWidth: 3, strokeLinecap: "round" }),
        React.createElement("circle", { cx: 250, cy: 152, r: 3.5, fill: c.accent })
      ),
  },
};

// ============================================================
// 5. DEFAULT STATE & PRESETS
// ============================================================
export const PATCH_STORAGE_KEY = "outpost_commander_custom_patch";

export const DEFAULT_PATCH_STATE: MissionPatchState = {
  crestShape: "circle",
  symbol: "artemis_moon",
  colorScheme: "apollo_gold_navy",
  motto: "Ad Astra",
  commanderCallsign: "VANGUARD",
  outpostName: "SHACKLETON BASE",
  expeditionYear: "2026",
  starCount: 4,
  showTwillTexture: true,
  showMerrowedEdge: true,
};

export interface PresetPatch {
  id: string;
  name: string;
  subtitle: string;
  patch: MissionPatchState;
}

export const PRESET_PATCHES: PresetPatch[] = [
  {
    id: "artemis_polar",
    name: "Artemis II Lunar Base",
    subtitle: "Lunar South Pole · Ice Drilling Outpost",
    patch: {
      crestShape: "circle",
      symbol: "artemis_moon",
      colorScheme: "artemis_blue_silver",
      motto: "Pioneers of Shackleton",
      commanderCallsign: "ORION",
      outpostName: "SHACKLETON BASECAMP",
      expeditionYear: "2026",
      starCount: 4,
      showTwillTexture: true,
      showMerrowedEdge: true,
    },
  },
  {
    id: "apollo_heritage",
    name: "Apollo 11 Tribute",
    subtitle: "Historic Mare Tranquillitatis Heritage",
    patch: {
      crestShape: "shield",
      symbol: "falcon_rocket",
      colorScheme: "apollo_gold_navy",
      motto: "Ad Astra",
      commanderCallsign: "EAGLE",
      outpostName: "TRANQUILITY OUTPOST",
      expeditionYear: "1969",
      starCount: 3,
      showTwillTexture: true,
      showMerrowedEdge: true,
    },
  },
  {
    id: "mars_gale",
    name: "Mars Gale Explorer",
    subtitle: "Aeolis Mons Sedimentary Traverse",
    patch: {
      crestShape: "shield",
      symbol: "mars_mountain",
      colorScheme: "mars_terracotta_sand",
      motto: "Survive to Thrive",
      commanderCallsign: "BEDROCK",
      outpostName: "GALE CALDERA HAB",
      expeditionYear: "2031",
      starCount: 5,
      showTwillTexture: true,
      showMerrowedEdge: true,
    },
  },
  {
    id: "biosphere_eden",
    name: "Peary Biosphere",
    subtitle: "Closed-Loop Hydroponics Expedition",
    patch: {
      crestShape: "hexagon",
      symbol: "wheat_sprout",
      colorScheme: "apollo_gold_navy",
      motto: "Survive to Thrive",
      commanderCallsign: "SPROUT",
      outpostName: "PEARY GREENHOUSE",
      expeditionYear: "2028",
      starCount: 4,
      showTwillTexture: true,
      showMerrowedEdge: true,
    },
  },
  {
    id: "nuclear_kilopower",
    name: "Deep Void Kilopower",
    subtitle: "Surface Fission Power Station",
    patch: {
      crestShape: "chevron",
      symbol: "atomic_orbit",
      colorScheme: "deep_space_neon",
      motto: "Systems First",
      commanderCallsign: "VOLT",
      outpostName: "KILOPOWER ARRAY",
      expeditionYear: "2029",
      starCount: 4,
      showTwillTexture: true,
      showMerrowedEdge: true,
    },
  },
  {
    id: "solar_gateway",
    name: "Helios Solar Gateway",
    subtitle: "Cis-Lunar Orbital Staging Facility",
    patch: {
      crestShape: "hexagon",
      symbol: "solar_array",
      colorScheme: "artemis_blue_silver",
      motto: "Systems First",
      commanderCallsign: "SOLARIS",
      outpostName: "GATEWAY STATION",
      expeditionYear: "2027",
      starCount: 4,
      showTwillTexture: true,
      showMerrowedEdge: true,
    },
  },
];

// ============================================================
// 6. LOCAL STORAGE HELPERS
// ============================================================

/**
 * Loads the saved patch vector state from localStorage.
 * Falls back to DEFAULT_PATCH_STATE if uninitialized or corrupted.
 */
export function loadSavedPatch(): MissionPatchState {
  if (typeof window === "undefined") return DEFAULT_PATCH_STATE;
  try {
    const raw = localStorage.getItem(PATCH_STORAGE_KEY);
    if (!raw) return DEFAULT_PATCH_STATE;
    const parsed = JSON.parse(raw) as Partial<MissionPatchState>;
    return {
      crestShape:
        parsed.crestShape && CREST_SHAPES[parsed.crestShape]
          ? parsed.crestShape
          : DEFAULT_PATCH_STATE.crestShape,
      symbol:
        parsed.symbol && INSIGNIA_SYMBOLS[parsed.symbol]
          ? parsed.symbol
          : DEFAULT_PATCH_STATE.symbol,
      colorScheme:
        parsed.colorScheme && PATCH_COLOR_SCHEMES[parsed.colorScheme]
          ? parsed.colorScheme
          : DEFAULT_PATCH_STATE.colorScheme,
      motto: parsed.motto || DEFAULT_PATCH_STATE.motto,
      commanderCallsign: parsed.commanderCallsign || DEFAULT_PATCH_STATE.commanderCallsign,
      outpostName: parsed.outpostName || DEFAULT_PATCH_STATE.outpostName,
      expeditionYear: parsed.expeditionYear || DEFAULT_PATCH_STATE.expeditionYear,
      starCount: typeof parsed.starCount === "number" ? parsed.starCount : DEFAULT_PATCH_STATE.starCount,
      showTwillTexture: parsed.showTwillTexture !== undefined ? parsed.showTwillTexture : true,
      showMerrowedEdge: parsed.showMerrowedEdge !== undefined ? parsed.showMerrowedEdge : true,
      savedAt: parsed.savedAt,
    };
  } catch (err) {
    console.warn("Failed to parse saved mission patch from localStorage:", err);
    return DEFAULT_PATCH_STATE;
  }
}

/**
 * Saves patch vector state to localStorage under 'outpost_commander_custom_patch'.
 */
export function savePatchToStorage(patch: MissionPatchState): void {
  if (typeof window === "undefined") return;
  try {
    const payload: MissionPatchState = {
      ...patch,
      savedAt: Date.now(),
    };
    localStorage.setItem(PATCH_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn("Failed to write mission patch to localStorage:", err);
  }
}
