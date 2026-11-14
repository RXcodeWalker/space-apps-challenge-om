import {
  ALL_ROOT_CAUSE_PROFILES,
  detectActiveRootCauses,
  resolveRootCauseForAlert,
  BROWNOUT_OVERBUDGET,
  LIFE_SUPPORT_FAILURE,
  BROWNOUT_BATTERY_DEPLETION,
  RADIATION_SHIELD_FAILURE,
  type RootCauseEvaluationContext,
} from "../src/data/rootCauseData";
import { LUNAR_SOUTH_POLE, MARS_GALE_CRATER } from "../src/data/nasaConstants";

console.log("=== ROOT CAUSE DRILL-DOWN VALIDATION SUITE ===");

// 1. Verify profile integrity
console.log(`\n1. Checking registered profiles count: ${ALL_ROOT_CAUSE_PROFILES.length}`);
for (const profile of ALL_ROOT_CAUSE_PROFILES) {
  console.log(` - Checking [${profile.id}] (${profile.title})...`);
  if (!profile.title || !profile.subtitle || !profile.badgeLabel) {
    throw new Error(`Profile ${profile.id} is missing title/subtitle/badge`);
  }
  if (profile.causalityChain.length !== 5) {
    throw new Error(`Profile ${profile.id} causality chain length is ${profile.causalityChain.length}, expected 5`);
  }
  if (profile.engineeringPrinciples.length === 0) {
    throw new Error(`Profile ${profile.id} is missing engineering principles`);
  }
  for (const principle of profile.engineeringPrinciples) {
    if (!principle.formula || !principle.coreConcept || !principle.habitatApplication || !principle.kidFriendlyAnalogy) {
      throw new Error(`Principle ${principle.id} is missing required fields`);
    }
  }
  if (profile.missionLogs.length === 0) {
    throw new Error(`Profile ${profile.id} has no NASA mission logs`);
  }
  for (const log of profile.missionLogs) {
    if (!log.officialUrl.startsWith("http")) {
      throw new Error(`Mission log ${log.id} has invalid URL: ${log.officialUrl}`);
    }
    if (!log.telemetryQuote || !log.speaker || !log.artemisLessonLearned) {
      throw new Error(`Mission log ${log.id} missing quote/speaker/lesson`);
    }
  }
  if (profile.counterfactualOptions.length === 0) {
    throw new Error(`Profile ${profile.id} has no counterfactual options`);
  }
  console.log(`   ✓ 5-step fault tree verified`);
  console.log(`   ✓ ${profile.engineeringPrinciples.length} physics principles verified`);
  console.log(`   ✓ ${profile.missionLogs.length} NASA mission logs verified`);
  console.log(`   ✓ ${profile.counterfactualOptions.length} remediation profiles verified`);
}

// 2. Test dynamic detection for Over-Budget Brownout
console.log("\n2. Testing Over-Budget Brownout Context Detection...");
const mockOverbudgetCtx: RootCauseEvaluationContext = {
  environment: LUNAR_SOUTH_POLE,
  currentTurn: 3,
  allocation: { powerGrid: 40, lifeSupport: 40, radiationShielding: 35 }, // Total 115 MW
  effectiveBudgetMW: 100,
  subsystems: {
    powerGrid: { id: "powerGrid", label: "Power Grid", health: 85, wearAccumulated: 0.05, powerDrawMW: 40, statusMessage: "nominal", kidFriendlyStatus: "nominal" },
    lifeSupport: { id: "lifeSupport", label: "Life Support", health: 90, wearAccumulated: 0.02, powerDrawMW: 40, statusMessage: "nominal", kidFriendlyStatus: "nominal" },
    radiationShielding: { id: "radiationShielding", label: "Radiation Shielding", health: 80, wearAccumulated: 0.08, powerDrawMW: 35, statusMessage: "nominal", kidFriendlyStatus: "nominal" },
  },
  crew: {
    morale: 80,
    radiationExposureMSv: 0.9,
    safeRadiationLimitMSv: 50,
    careerRadiationExposureMSv: 50.9,
    careerLimitMSv: 500,
    foodReserveDays: 15,
    oxygenBufferPercent: 100,
  },
};

const activeOverbudget = detectActiveRootCauses(mockOverbudgetCtx);
console.log(`Detected ${activeOverbudget.length} causes. Primary: ${activeOverbudget[0]?.id}`);
if (activeOverbudget[0]?.id !== "brownout_overbudget") {
  throw new Error("Expected brownout_overbudget to be triggered!");
}
const telemetryOverbudget = activeOverbudget[0].generateDynamicTelemetry(mockOverbudgetCtx);
console.log(`Dynamic Telemetry Headline: "${telemetryOverbudget.headline}"`);
console.log(`Summary: "${telemetryOverbudget.telemetrySummary}"`);

// 3. Test dynamic detection for Life Support Failure
console.log("\n3. Testing Life Support Failure Context Detection...");
const mockLifeSupportCtx: RootCauseEvaluationContext = {
  environment: MARS_GALE_CRATER,
  currentTurn: 5,
  allocation: { powerGrid: 45, lifeSupport: 15, radiationShielding: 40 }, // LS starved
  effectiveBudgetMW: 100,
  subsystems: {
    powerGrid: { id: "powerGrid", label: "Power Grid", health: 85, wearAccumulated: 0.05, powerDrawMW: 45, statusMessage: "nominal", kidFriendlyStatus: "nominal" },
    lifeSupport: { id: "lifeSupport", label: "Life Support", health: 32, wearAccumulated: 0.15, powerDrawMW: 15, statusMessage: "critical", kidFriendlyStatus: "critical" },
    radiationShielding: { id: "radiationShielding", label: "Radiation Shielding", health: 80, wearAccumulated: 0.08, powerDrawMW: 40, statusMessage: "nominal", kidFriendlyStatus: "nominal" },
  },
  crew: {
    morale: 60,
    radiationExposureMSv: 2.5,
    safeRadiationLimitMSv: 50,
    careerRadiationExposureMSv: 52.5,
    careerLimitMSv: 500,
    foodReserveDays: 12,
    oxygenBufferPercent: 28, // Critical O2
  },
};

const activeLifeSupport = detectActiveRootCauses(mockLifeSupportCtx);
console.log(`Detected ${activeLifeSupport.length} causes. Primary: ${activeLifeSupport[0]?.id}`);
if (!activeLifeSupport.some((c) => c.id === "life_support_o2_collapse")) {
  throw new Error("Expected life_support_o2_collapse to be triggered!");
}
const telemetryLifeSupport = LIFE_SUPPORT_FAILURE.generateDynamicTelemetry(mockLifeSupportCtx);
console.log(`Dynamic Telemetry Headline: "${telemetryLifeSupport.headline}"`);
console.log(`Summary: "${telemetryLifeSupport.telemetrySummary}"`);

// 4. Test resolveRootCauseForAlert helper
console.log("\n4. Testing resolveRootCauseForAlert...");
const resolvedAlertPower = resolveRootCauseForAlert(
  { severity: "critical", subsystem: "power", headline: "Over-budget Power Allocation", detail: "", tradeOffExplanation: "", kidFriendlyExplanation: "" },
  mockOverbudgetCtx
);
if (resolvedAlertPower.id !== "brownout_overbudget") {
  throw new Error("Failed to resolve power alert to brownout_overbudget");
}
console.log(`   ✓ Power alert resolved to ${resolvedAlertPower.id}`);

const resolvedAlertLS = resolveRootCauseForAlert(
  { severity: "critical", subsystem: "lifeSupport", headline: "Life Support CRITICAL", detail: "", tradeOffExplanation: "", kidFriendlyExplanation: "" },
  mockLifeSupportCtx
);
if (resolvedAlertLS.id !== "life_support_o2_collapse") {
  throw new Error("Failed to resolve life support alert to life_support_o2_collapse");
}
console.log(`   ✓ Life support alert resolved to ${resolvedAlertLS.id}`);

console.log("\n=== ALL ROOT CAUSE SUITE CHECKS PASSED PERFECTLY ===");
