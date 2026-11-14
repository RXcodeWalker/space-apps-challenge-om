// ============================================================
// Verification Script: Test all 3 Commander Ranks / Difficulty Tiers
// ============================================================
import { LUNAR_SOUTH_POLE, MARS_GALE_CRATER } from "../src/data/nasaConstants.ts";
import {
  createInitialGameState,
  processTurn,
  getDefaultAllocation,
  getEffectivePowerBudget,
} from "../src/engine/simulationEngine.ts";
import {
  calculateThermalFatigue,
  rollMicrometeoroidStrike,
  generateCadetAutomatedHints,
  DIFFICULTY_PRESETS,
} from "../src/data/difficultyTiers.ts";
import { calculateOutcomeRank } from "../src/utils/flightRecorder.ts";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ ${msg}`);
}

console.log("=== 1. TESTING CADET TIER (AGES 7-10) ===");
const cadetState = createInitialGameState(LUNAR_SOUTH_POLE, "cadet");
assert(cadetState.difficulty === "cadet", "Difficulty correctly set to cadet");
assert(cadetState.crew.morale === 90, "Cadet crew starts with elevated morale buffer (90%)");
assert(cadetState.crew.foodReserveDays === 18, "Cadet crew starts with 18 food days buffer");
assert(cadetState.subsystems.lifeSupport.health === 95, "Cadet subsystems start at 95% health");

// Baseline power demand for cadet is 28 MW (life support) vs 35 MW standard
const cadetConfig = DIFFICULTY_PRESETS.cadet;
assert(cadetConfig.baselinePowerDemands.lifeSupport === 28, "Cadet Life Support baseline demand is 28 MW");
assert(cadetConfig.baselinePowerDemands.radiationShielding === 24, "Cadet Shielding baseline demand is 24 MW");
assert(cadetConfig.baselinePowerDemands.powerGrid === 20, "Cadet Grid baseline demand is 20 MW");

// Test automated gentle hints when life support drops below threshold
const hints = generateCadetAutomatedHints(
  cadetState.subsystems,
  { ...cadetState.crew, oxygenBufferPercent: 62 },
  { powerGrid: 30, lifeSupport: 22, radiationShielding: 25 },
  77,
  2
);
assert(hints.length > 0, "Automated hints generated when life support is below safe threshold");
assert(
  hints.some((h) => h.category === "life_support"),
  "Found life support specific coaching hint"
);
console.log("Cadet hint sample:", hints[0].kidFriendlyMessage);

// Test Turn Simulation for Cadet
const cadetTurn1 = processTurn(cadetState, { powerGrid: 25, lifeSupport: 35, radiationShielding: 26 });
assert(cadetTurn1.result.subsystems.lifeSupport.health >= 95, "High margin of error maintains health under moderate power");
assert(cadetTurn1.result.difficulty === "cadet", "Turn result carries difficulty tier");

console.log("\n=== 2. TESTING COMMANDER TIER (STANDARD BASELINE) ===");
const commState = createInitialGameState(LUNAR_SOUTH_POLE, "commander");
assert(commState.difficulty === "commander", "Difficulty correctly set to commander");
assert(commState.subsystems.lifeSupport.powerDrawMW === 35, "Commander baseline demand is 35 MW");
assert(commState.crew.foodReserveDays === 15, "Commander starts with 15 food days");

const commTurn1 = processTurn(commState, { powerGrid: 25, lifeSupport: 35, radiationShielding: 30 });
console.log("commTurn1 lifeSupport health:", commTurn1.result.subsystems.lifeSupport.health);
assert(commTurn1.result.subsystems.lifeSupport.health >= 85, "Standard baseline turn maintains nominal health (~90%)");

console.log("\n=== 3. TESTING FLIGHT DIRECTOR TIER (HARDCORE / REALISTIC) ===");
const fdState = createInitialGameState(LUNAR_SOUTH_POLE, "flight_director");
assert(fdState.difficulty === "flight_director", "Difficulty correctly set to flight_director");
assert(fdState.crew.careerRadiationExposureMSv === 180, "Veteran astronaut starts with 180 mSv career baseline");
assert(fdState.crew.safeRadiationLimitMSv === 45, "Flight Director expedition radiation threshold is 45 mSv");

// 3.1 Test Thermal Fatigue Physics Curve (Coffin-Manson)
const lunarThermalReportLowPower = calculateThermalFatigue("lunar_south_pole", 4, 10, 32, 0);
const lunarThermalReportHighPower = calculateThermalFatigue("lunar_south_pole", 4, 32, 32, 0);

assert(
  lunarThermalReportLowPower.solDeltaT === 227,
  "Lunar thermal swing correctly set to 227°C (LRO Diviner)"
);
assert(
  lunarThermalReportLowPower.fatigueWearAdded > lunarThermalReportHighPower.fatigueWearAdded,
  `Low thermal shielding (+${(lunarThermalReportLowPower.fatigueWearAdded * 100).toFixed(1)}%) suffers more thermal fatigue wear than high shielding (+${(lunarThermalReportHighPower.fatigueWearAdded * 100).toFixed(1)}%)`
);
console.log("Thermal fatigue low power wear:", lunarThermalReportLowPower.fatigueWearAdded);
console.log("Thermal fatigue high power wear:", lunarThermalReportHighPower.fatigueWearAdded);

// 3.2 Test Micro-Meteoroid Punctures
let strikeFound = false;
for (let s = 1; s <= 10; s++) {
  const strike = rollMicrometeoroidStrike("lunar_south_pole", s, 60);
  if (strike) {
    strikeFound = true;
    console.log(`MMOD Strike detected on Sol ${s}:`, strike.telemetryHeadline, `Impact velocity: ${strike.impactVelocityKmh} km/h`);
    assert(strike.impactVelocityKmh > 30000, "MMOD particle velocity is hypervelocity (>30,000 km/h)");
    break;
  }
}
assert(strikeFound, "Micro-meteoroid strikes trigger during vulnerable mission window");

// 3.3 Test Strict 500 mSv NASA Astronaut Career Limit
const fdOverdoseState = {
  ...fdState,
  crew: {
    ...fdState.crew,
    careerRadiationExposureMSv: 512, // Breached 500 mSv
    radiationExposureMSv: 48,
  },
};
const overdoseRank = calculateOutcomeRank(fdOverdoseState);
assert(
  overdoseRank.rankTitle.includes("Disqualified") || overdoseRank.badge.includes("500 mSv"),
  `Strict 500 mSv limit triggers flight disqualification: ${overdoseRank.rankTitle}`
);

// Test Gene Kranz Gold Medal on high score in Flight Director mode
const fdSuccessState = {
  ...fdState,
  cumulativeScore: 88,
  finalOutcome: "mission_success" as const,
  crew: {
    ...fdState.crew,
    careerRadiationExposureMSv: 240,
    radiationExposureMSv: 12,
  },
};
const fdSuccessRank = calculateOutcomeRank(fdSuccessState);
assert(
  fdSuccessRank.rankTitle.includes("Gene Kranz"),
  `Flight Director high score grants Gene Kranz medal: ${fdSuccessRank.rankTitle}`
);

// Test Cadet Wings Rank
const cadetSuccessState = {
  ...cadetState,
  cumulativeScore: 82,
  finalOutcome: "mission_success" as const,
};
const cadetRank = calculateOutcomeRank(cadetSuccessState);
assert(
  cadetRank.rankTitle.includes("Cadet Commander Gold Wings"),
  `Cadet mode grants Cadet Gold Wings: ${cadetRank.rankTitle}`
);

console.log("\n🎉 ALL VERIFICATION TESTS PASSED SUCCESSFULLY!");
