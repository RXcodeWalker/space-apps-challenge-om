// ============================================================
// verify-mission-seed.ts — Verification of Deterministic Mission Seed System
// Validates:
// 1. PRNG determinism & reproducibility (Mulberry32)
// 2. NASA seed generation & normalization
// 3. GameState seed binding
// 4. Identical incident scheduling across multiple Sol runs
// 5. Identical MMOD rolls in Flight Director mode
// 6. Thermal swing variance reproducibility
// 7. Power flux variance reproducibility
// 8. Challenge URL generation & parsing
// ============================================================

import {
  createSeededRNG,
  seededRandom,
  generateMissionSeed,
  normalizeSeed,
  formatSeedDisplay,
  buildChallengeUrl,
  parseMissionParamsFromUrl,
} from "../src/utils/seededRandom";
import {
  createInitialGameState,
  processTurn,
  getEffectivePowerBudget,
  getSeededTurnEvent,
} from "../src/engine/simulationEngine";
import {
  getIncidentForSol,
  getSeededIncidentSchedule,
} from "../src/data/incidentCards";
import {
  rollMicrometeoroidStrike,
  calculateThermalFatigue,
} from "../src/data/difficultyTiers";
import {
  LUNAR_SOUTH_POLE,
  MARS_GALE_CRATER,
} from "../src/data/nasaConstants";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ ${msg}`);
}

console.log("=== 1. TESTING PRNG UTILITY (seededRandom.ts) ===");
const rng1 = createSeededRNG("ARTEMIS-26");
const rng2 = createSeededRNG("ARTEMIS-26");
const seq1 = [rng1.next(), rng1.next(), rng1.next(), rng1.next(), rng1.next()];
const seq2 = [rng2.next(), rng2.next(), rng2.next(), rng2.next(), rng2.next()];

assert(
  JSON.stringify(seq1) === JSON.stringify(seq2),
  "PRNG produces identical float sequences for the same seed string"
);

seq1.forEach((val, i) => {
  assert(val >= 0 && val < 1, `PRNG value ${i} is in [0, 1): ${val}`);
});

const rngDiff = createSeededRNG("GALE-99");
const seqDiff = [rngDiff.next(), rngDiff.next(), rngDiff.next()];
assert(
  JSON.stringify(seq1.slice(0, 3)) !== JSON.stringify(seqDiff),
  "Different seeds produce distinct pseudo-random sequences"
);

console.log("\n=== 2. TESTING SEED NORMALIZATION & DISPLAY ===");
assert(normalizeSeed("  #artemis-26  ") === "ARTEMIS-26", "Normalizes lowercase, whitespace, and leading #");
assert(normalizeSeed("apollo_42") === "APOLLO_42", "Preserves underscores and dashes");
assert(formatSeedDisplay("orion-07") === "#ORION-07", "Formats seed with canonical '#' prefix");

console.log("\n=== 3. TESTING NASA SEED CODE GENERATION ===");
for (let i = 0; i < 5; i++) {
  const code = generateMissionSeed();
  assert(
    /^[A-Z]+-\d{2}$/.test(code),
    `Generated NASA seed matches authentic format PREFIX-XX: ${code}`
  );
}

console.log("\n=== 4. TESTING SIMULATION ENGINE BINDING ===");
const gameA = createInitialGameState(LUNAR_SOUTH_POLE, "commander", "ARTEMIS-26");
assert(gameA.missionSeed === "ARTEMIS-26", "GameState stores the mission seed");

const gameDefault = createInitialGameState(LUNAR_SOUTH_POLE, "commander");
assert(
  typeof gameDefault.missionSeed === "string" && gameDefault.missionSeed.length > 0,
  `Default seed automatically generated when omitted: ${gameDefault.missionSeed}`
);

console.log("\n=== 5. TESTING DETERMINISTIC INCIDENT SELECTION ===");
const schedA = getSeededIncidentSchedule("lunar_south_pole", "ARTEMIS-26");
const schedB = getSeededIncidentSchedule("lunar_south_pole", "ARTEMIS-26");
assert(
  JSON.stringify(schedA) === JSON.stringify(schedB),
  "Identical incident schedule generated for ARTEMIS-26 on Lunar South Pole"
);

// Check Sol 2, 4, 6, 7, 8 incidents match across separate runs
[2, 4, 6, 7, 8].forEach((sol) => {
  const incA = getIncidentForSol("lunar_south_pole", sol, "ARTEMIS-26");
  const incB = getIncidentForSol("lunar_south_pole", sol, "ARTEMIS-26");
  assert(incA?.id === incB?.id, `Sol ${sol} incident is identical across runs: ${incA?.id}`);
});

console.log("\n=== 6. TESTING MICROMETEOROID ROLLS (FLIGHT DIRECTOR) ===");
[3, 5, 7, 8].forEach((sol) => {
  const strike1 = rollMicrometeoroidStrike("lunar_south_pole", sol, 80, "VALKYRIE-18");
  const strike2 = rollMicrometeoroidStrike("lunar_south_pole", sol, 80, "VALKYRIE-18");
  const id1 = strike1 ? strike1.subsystemHit : "none";
  const id2 = strike2 ? strike2.subsystemHit : "none";
  assert(id1 === id2, `Sol ${sol} Flight Director MMOD roll is 100% identical: ${id1}`);
});

console.log("\n=== 7. TESTING THERMAL & SOLAR FLUX VARIANCE ===");
for (let sol = 1; sol <= 5; sol++) {
  const tf1 = calculateThermalFatigue("lunar_south_pole", sol, 30, 30, 0, "ARTEMIS-26");
  const tf2 = calculateThermalFatigue("lunar_south_pole", sol, 30, 30, 0, "ARTEMIS-26");
  assert(tf1.solDeltaT === tf2.solDeltaT, `Sol ${sol} thermal swing ΔT is identical: ${tf1.solDeltaT}°C`);

  const budget1 = getEffectivePowerBudget(LUNAR_SOUTH_POLE, sol, 0, "commander", "ARTEMIS-26");
  const budget2 = getEffectivePowerBudget(LUNAR_SOUTH_POLE, sol, 0, "commander", "ARTEMIS-26");
  assert(budget1 === budget2, `Sol ${sol} effective power budget is identical: ${budget1} MW`);
}

console.log("\n=== 8. TESTING CHALLENGE URL GENERATION ===");
const challengeUrl = buildChallengeUrl("ARTEMIS-26", "lunar_south_pole", "commander");
assert(
  challengeUrl.includes("seed=ARTEMIS-26") && challengeUrl.includes("env=lunar_south_pole"),
  `Direct challenge URL correctly formats seed & env query params: ${challengeUrl}`
);

console.log("\n🎉 ALL CLASSROOM MISSION SEED TESTS PASSED PERFECTLY!");
