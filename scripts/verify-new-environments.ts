// ============================================================
// Verification Script: Test New Mission Environments (Europa & Titan)
// ============================================================
import {
  EUROPA_UNDER_ICE,
  TITAN_HYDROCARBON,
  LUNAR_SOUTH_POLE,
  MARS_GALE_CRATER,
  MISSION_ENVIRONMENTS,
} from "../src/data/nasaConstants.ts";
import {
  createInitialGameState,
  processTurn,
  getEffectivePowerBudget,
} from "../src/engine/simulationEngine.ts";
import { getIncidentForSol } from "../src/data/incidentCards.ts";
import { calculateThermalFatigue } from "../src/data/difficultyTiers.ts";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ ${msg}`);
}

console.log("=== 1. VERIFYING CONSTANTS & MISSION ENVIRONMENTS ===");

assert(MISSION_ENVIRONMENTS.europa_under_ice !== undefined, "Europa exists in MISSION_ENVIRONMENTS");
assert(MISSION_ENVIRONMENTS.titan_hydrocarbon !== undefined, "Titan exists in MISSION_ENVIRONMENTS");
assert(MISSION_ENVIRONMENTS.lunar_south_pole !== undefined, "Moon exists in MISSION_ENVIRONMENTS");
assert(MISSION_ENVIRONMENTS.mars_gale_crater !== undefined, "Mars exists in MISSION_ENVIRONMENTS");

// Europa Checks
assert(EUROPA_UNDER_ICE.baselineSolarEfficiency === 0.0, "Europa has ZERO solar flux (under ice)");
assert(EUROPA_UNDER_ICE.turnEvents.length === 10, "Europa has exactly 10 Sol turn events");
assert(EUROPA_UNDER_ICE.citations.length >= 4, "Europa has rich NASA Clipper citations");
assert(EUROPA_UNDER_ICE.primaryPowerSource === "cryo_geothermal_rtg", "Europa power source is cryo-geothermal & RTG");

// Titan Checks
assert(EUROPA_UNDER_ICE.atmosphericPressureKPa === 0.0000001, "Europa has trace atmosphere under ice");
assert(TITAN_HYDROCARBON.atmosphericPressureKPa === 146.7, "Titan has thick atmosphere (~1.45 bar / 146.7 kPa)");
assert(TITAN_HYDROCARBON.turnEvents.length === 10, "Titan has exactly 10 Sol turn events");
assert(TITAN_HYDROCARBON.citations.length >= 4, "Titan has rich NASA Dragonfly & Cassini citations");
assert(TITAN_HYDROCARBON.primaryPowerSource === "mmrtg_methane_cryo", "Titan power source is MMRTG & methane cryogenic cycle");

console.log("\n=== 2. VERIFYING POWER ENGINE FOR NEW WORLDS ===");

// Europa power budget
const europaSol1Budget = getEffectivePowerBudget(EUROPA_UNDER_ICE, 1);
assert(europaSol1Budget === 87, `Europa Sol 1 baseload power is 87 MW (actual: ${europaSol1Budget})`);

const europaSol3Budget = getEffectivePowerBudget(EUROPA_UNDER_ICE, 3);
assert(europaSol3Budget === 105, `Europa Sol 3 hydrothermal vent surge provides +18 MW bonus (actual: ${europaSol3Budget})`);

// Titan power budget
const titanSol1Budget = getEffectivePowerBudget(TITAN_HYDROCARBON, 1);
assert(titanSol1Budget === 85, `Titan Sol 1 baseload power is 85 MW (actual: ${titanSol1Budget})`);

const titanSol3Budget = getEffectivePowerBudget(TITAN_HYDROCARBON, 3);
assert(titanSol3Budget === 107, `Titan Sol 3 Kraken Mare Carnot surge provides +22 MW bonus (actual: ${titanSol3Budget})`);

console.log("\n=== 3. VERIFYING INCIDENTS FOR EUROPA & TITAN ===");

const europaIncidents = [2, 4, 6, 8, 10].map((sol) => getIncidentForSol("europa_under_ice", sol));
assert(europaIncidents.every((inc) => inc !== undefined), "Europa has dynamic incidents on trigger Sols 2, 4, 6, 8, 10");
assert(europaIncidents[0]?.id === "europa_jovian_radiation_storm", "Sol 2 is Jovian Radiation Storm");
assert(europaIncidents[1]?.id === "europa_hydrothermal_vent_surge_card", "Sol 4 is Hydrothermal Vent Eruption");

const titanIncidents = [2, 4, 6, 8, 10].map((sol) => getIncidentForSol("titan_hydrocarbon", sol));
assert(titanIncidents.every((inc) => inc !== undefined), "Titan has dynamic incidents on trigger Sols 2, 4, 6, 8, 10");
assert(titanIncidents[0]?.id === "titan_methane_monsoon_flash_flood", "Sol 2 is Methane Monsoon Inundation");
assert(titanIncidents[1]?.id === "titan_dragonfly_icing_in_supercooled_fog", "Sol 4 is Dragonfly Supercooled Icing");

console.log("\n=== 4. VERIFYING 10-SOL FULL SIMULATION RUN (EUROPA) ===");

let europaGame = createInitialGameState(EUROPA_UNDER_ICE, "commander");
for (let sol = 1; sol <= 10; sol++) {
  const budget = getEffectivePowerBudget(EUROPA_UNDER_ICE, sol);
  const alloc = {
    powerGrid: Math.round(budget * 0.3),
    lifeSupport: Math.round(budget * 0.4),
    radiationShielding: Math.round(budget * 0.3),
  };
  const step = processTurn(europaGame, alloc);
  europaGame = step.nextState;
  assert(!isNaN(europaGame.cumulativeScore), `Europa Sol ${sol} score is valid number`);
  assert(europaGame.crew.morale > 0, `Europa Sol ${sol} crew morale is positive`);
}
assert(europaGame.currentTurn === 10, "Europa full 10-Sol simulation completed successfully");
console.log(`Europa 10-Sol completion score: ${europaGame.cumulativeScore}, Crew Morale: ${europaGame.crew.morale}%`);

console.log("\n=== 5. VERIFYING 10-SOL FULL SIMULATION RUN (TITAN) ===");

let titanGame = createInitialGameState(TITAN_HYDROCARBON, "commander");
for (let sol = 1; sol <= 10; sol++) {
  const budget = getEffectivePowerBudget(TITAN_HYDROCARBON, sol);
  const alloc = {
    powerGrid: Math.round(budget * 0.3),
    lifeSupport: Math.round(budget * 0.4),
    radiationShielding: Math.round(budget * 0.3),
  };
  const step = processTurn(titanGame, alloc);
  titanGame = step.nextState;
  assert(!isNaN(titanGame.cumulativeScore), `Titan Sol ${sol} score is valid number`);
  assert(titanGame.crew.morale > 0, `Titan Sol ${sol} crew morale is positive`);
}
assert(titanGame.currentTurn === 10, "Titan full 10-Sol simulation completed successfully");
console.log(`Titan 10-Sol completion score: ${titanGame.cumulativeScore}, Crew Morale: ${titanGame.crew.morale}%`);

console.log("\n=== 6. VERIFYING THERMAL FATIGUE ON NEW WORLDS ===");

const europaThermal = calculateThermalFatigue("europa_under_ice", 4, 30, 30, 0);
assert(europaThermal.solDeltaT === 160, `Europa thermal gradient is 160°C (actual: ${europaThermal.solDeltaT})`);
assert(europaThermal.technicalDiagnosis.includes("Europa Clipper"), "Europa thermal report cites Europa Clipper");

const titanThermal = calculateThermalFatigue("titan_hydrocarbon", 4, 30, 30, 0);
assert(titanThermal.solDeltaT === 200, `Titan thermal gradient is 200°C (actual: ${titanThermal.solDeltaT})`);
assert(titanThermal.technicalDiagnosis.includes("Dragonfly"), "Titan thermal report cites Dragonfly");

console.log("\n🎉 ALL VERIFICATION TESTS PASSED SUCCESSFULLY! 🚀");
