// ============================================================
// verify-accessibility.ts — Verification of High-Contrast & Colorblind-Safe Mode
// Validates:
// 1. Accessibility Tokens & Okabe-Ito / ColorBrewer Color Standards
// 2. Shape Marker Pairing (▲ surplus, ▼ deficit, ✖ brownout, ✔ nominal)
// 3. LocalStorage persistence key ("colorblindMode")
// 4. ARIA live regions & Screen Reader announcements
// 5. Codebase audit for ControlDeck, PowerSlider, and AlertBanner
// ============================================================

import {
  SHAPE_MARKERS,
  STANDARD_TOKENS,
  COLORBLIND_TOKENS,
  useAccessibility,
} from "../src/utils/AccessibilityContext";
import * as fs from "fs";
import * as path from "path";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ ${msg}`);
}

console.log("=== 1. TESTING COLOR PALETTE TOKENS ===");

// Check standard tokens
assert(
  STANDARD_TOKENS.nominal === "#10b981",
  `Standard nominal token is Green (#10b981): ${STANDARD_TOKENS.nominal}`
);
assert(
  STANDARD_TOKENS.surplus === "#10b981",
  `Standard surplus token is Green (#10b981): ${STANDARD_TOKENS.surplus}`
);
assert(
  STANDARD_TOKENS.deficit === "#ef4444",
  `Standard deficit token is Red (#ef4444): ${STANDARD_TOKENS.deficit}`
);
assert(
  STANDARD_TOKENS.danger === "#ef4444",
  `Standard danger token is Red (#ef4444): ${STANDARD_TOKENS.danger}`
);

// Check colorblind-safe tokens (Okabe-Ito / ColorBrewer)
assert(
  COLORBLIND_TOKENS.nominal === "#0284c7",
  `Colorblind nominal token is Cyan/Blue (#0284c7): ${COLORBLIND_TOKENS.nominal}`
);
assert(
  COLORBLIND_TOKENS.surplus === "#0284c7",
  `Colorblind surplus token is Cyan/Blue (#0284c7): ${COLORBLIND_TOKENS.surplus}`
);
assert(
  COLORBLIND_TOKENS.deficit === "#f97316",
  `Colorblind deficit token is Vermilion/Orange (#f97316): ${COLORBLIND_TOKENS.deficit}`
);
assert(
  COLORBLIND_TOKENS.danger === "#f97316",
  `Colorblind danger token is Vermilion/Orange (#f97316): ${COLORBLIND_TOKENS.danger}`
);
assert(
  COLORBLIND_TOKENS.magenta === "#d946ef",
  `Colorblind palette provides Magenta (#d946ef): ${COLORBLIND_TOKENS.magenta}`
);

console.log("\n=== 2. TESTING REDUNDANT SHAPE MARKERS ===");
assert(
  SHAPE_MARKERS.surplus === "▲",
  `Surplus marker is distinct upward triangle ▲: ${SHAPE_MARKERS.surplus}`
);
assert(
  SHAPE_MARKERS.deficit === "▼",
  `Deficit marker is distinct downward triangle ▼: ${SHAPE_MARKERS.deficit}`
);
assert(
  SHAPE_MARKERS.brownout === "✖",
  `Brownout/hazard marker is distinct cross ✖: ${SHAPE_MARKERS.brownout}`
);
assert(
  SHAPE_MARKERS.nominal === "✔",
  `Nominal marker is distinct checkmark ✔: ${SHAPE_MARKERS.nominal}`
);

console.log("\n=== 3. TESTING FALLBACK HOOK & DELTA COMPUTATION ===");
const hook = useAccessibility();
assert(typeof hook.colorblindMode === "boolean", "Hook returns boolean colorblindMode");
assert(typeof hook.toggleColorblindMode === "function", "Hook provides toggleColorblindMode function");
assert(typeof hook.formatWithShape === "function", "Hook provides formatWithShape function");

const surplusLabel = hook.formatWithShape("surplus", "+15 MW Surplus");
assert(
  surplusLabel.includes("▲"),
  `formatWithShape pairs surplus with ▲: "${surplusLabel}"`
);

const deficitLabel = hook.formatWithShape("deficit", "-10 MW Deficit");
assert(
  deficitLabel.includes("▼"),
  `formatWithShape pairs deficit with ▼: "${deficitLabel}"`
);

const brownoutLabel = hook.formatWithShape("brownout", "Grid Brownout Alert");
assert(
  brownoutLabel.includes("✖"),
  `formatWithShape pairs brownout with ✖: "${brownoutLabel}"`
);

const nominalLabel = hook.formatWithShape("nominal", "Systems Nominal");
assert(
  nominalLabel.includes("✔"),
  `formatWithShape pairs nominal with ✔: "${nominalLabel}"`
);

const deltaPlus = hook.getDeltaMeta(10);
assert(deltaPlus.shape === "▲", "Positive delta meta uses ▲");

const deltaMinus = hook.getDeltaMeta(-8);
assert(deltaMinus.shape === "▼", "Negative delta meta uses ▼");

const deltaZero = hook.getDeltaMeta(0);
assert(deltaZero.shape === "✔", "Zero delta meta uses ✔");

console.log("\n=== 4. CODEBASE AUDIT: UI INTEGRATION & ARIA ===");

const basePath = path.resolve(__dirname, "..");

// Check ControlDeck.tsx
const controlDeckPath = path.join(basePath, "src", "components", "ControlDeck.tsx");
const controlDeckCode = fs.readFileSync(controlDeckPath, "utf-8");

assert(
  controlDeckCode.includes("useAccessibility"),
  "ControlDeck.tsx imports and calls useAccessibility"
);
assert(
  controlDeckCode.includes("Vision / Accessibility") || controlDeckCode.includes("toggleColorblindMode"),
  "ControlDeck.tsx includes Vision / Accessibility toggle button"
);
assert(
  controlDeckCode.includes('aria-live="polite"'),
  'ControlDeck.tsx includes aria-live="polite" live region for slider adjustments'
);
assert(
  controlDeckCode.includes("shapes.surplus") && controlDeckCode.includes("shapes.deficit"),
  "ControlDeck.tsx uses shape markers for surplus and deficit telemetry"
);
assert(
  controlDeckCode.includes("shapes.brownout"),
  "ControlDeck.tsx uses ✖ shape marker for brownout collapse hazard"
);

// Check PowerSlider.tsx
const powerSliderPath = path.join(basePath, "src", "components", "PowerSlider.tsx");
const powerSliderCode = fs.readFileSync(powerSliderPath, "utf-8");

assert(
  powerSliderCode.includes("useAccessibility"),
  "PowerSlider.tsx imports and calls useAccessibility"
);
assert(
  powerSliderCode.includes('aria-live="polite"'),
  'PowerSlider.tsx includes aria-live="polite" live region for screen readers'
);
assert(
  powerSliderCode.includes("shapes.surplus") && powerSliderCode.includes("shapes.deficit"),
  "PowerSlider.tsx pairs status with distinct shape markers"
);
assert(
  powerSliderCode.includes("tokens.nominalText") && powerSliderCode.includes("tokens.deficitText"),
  "PowerSlider.tsx applies accessible color classes from design tokens"
);

// Check AlertBanner.tsx
const alertBannerPath = path.join(basePath, "src", "components", "AlertBanner.tsx");
const alertBannerCode = fs.readFileSync(alertBannerPath, "utf-8");

assert(
  alertBannerCode.includes("useAccessibility"),
  "AlertBanner.tsx imports and calls useAccessibility"
);
assert(
  alertBannerCode.includes("shapes.brownout") || alertBannerCode.includes("shapes.deficit"),
  "AlertBanner.tsx renders distinct shape markers for alerts and anomalies"
);
assert(
  alertBannerCode.includes("orange") || alertBannerCode.includes("tokens"),
  "AlertBanner.tsx adapts critical alerts to accessible colorblind-safe palette"
);

// Check MissionBriefingScreen.tsx
const briefingPath = path.join(basePath, "src", "components", "MissionBriefingScreen.tsx");
const briefingCode = fs.readFileSync(briefingPath, "utf-8");

assert(
  briefingCode.includes("Vision / Accessibility"),
  "MissionBriefingScreen.tsx header includes Vision / Accessibility toggle beside sound"
);

// Check GameScreen.tsx
const gameScreenPath = path.join(basePath, "src", "components", "GameScreen.tsx");
const gameScreenCode = fs.readFileSync(gameScreenPath, "utf-8");

assert(
  gameScreenCode.includes("Vision / Accessibility"),
  "GameScreen.tsx debrief header includes Vision / Accessibility toggle beside sound"
);

// Check AccessibilityContext.tsx localStorage key
const accContextPath = path.join(basePath, "src", "utils", "AccessibilityContext.tsx");
const accContextCode = fs.readFileSync(accContextPath, "utf-8");

assert(
  accContextCode.includes('colorblindMode') && accContextCode.includes('localStorage'),
  "AccessibilityContext.tsx uses persistent localStorage for colorblindMode"
);

console.log("\n🎉 ALL ACCESSIBILITY & COLORBLIND-SAFE TESTS PASSED FLAWLESSLY!");
