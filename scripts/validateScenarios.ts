// Verification script for Extreme NASA Scenarios
import {
  HISTORIC_SCENARIOS,
  ARTEMIS_III_LUNAR_NIGHT,
  OPPORTUNITY_DUST_STORM,
  APOLLO_13_COLD_CABIN,
} from "../src/data/scenarioData";
import {
  createInitialGameState,
  processTurn,
  getEffectivePowerBudget,
  getDefaultAllocation,
} from "../src/engine/simulationEngine";

console.log("=== VERIFYING HISTORIC SCENARIOS ===");

// 1. Verify Registry
console.log(`Loaded ${HISTORIC_SCENARIOS.length} scenarios:`);
HISTORIC_SCENARIOS.forEach((s) => {
  console.log(` - ${s.emoji} ${s.title} (${s.location}) [${s.difficultyRating}]`);
  console.log(`   Quote: "${s.telemetryQuote.quote.slice(0, 60)}..."`);
  console.log(`   Constraints count: ${s.constraints.length}`);
});

if (HISTORIC_SCENARIOS.length !== 3) {
  throw new Error("Expected exactly 3 historic scenarios!");
}

// 2. Test Artemis III: The 14-Day Lunar Night
console.log("\n--- Testing Artemis III: The 14-Day Lunar Night ---");
const artemisState = createInitialGameState(
  ARTEMIS_III_LUNAR_NIGHT.baseEnvironment,
  "commander",
  "TEST-ARTEMIS-01",
  ARTEMIS_III_LUNAR_NIGHT
);

console.log(`Artemis scenario attached: ${artemisState.scenario?.title}`);
console.log(`PowerGrid Status: ${artemisState.subsystems.powerGrid.statusMessage}`);
console.log(`RadiationShielding Status: ${artemisState.subsystems.radiationShielding.statusMessage}`);

const artemisBudget1 = getEffectivePowerBudget(
  artemisState.environment,
  1,
  0,
  "commander",
  artemisState.missionSeed,
  artemisState.scenario
);
console.log(`Sol 1 Effective Budget: ${artemisBudget1} MW (Expected ~35 MW)`);
if (artemisBudget1 !== 35) {
  throw new Error(`Expected Sol 1 Artemis budget to be 35 MW, got ${artemisBudget1}`);
}

// Test under-allocation alert for thermal heating (<10 MW)
const underAllocTurn = processTurn(artemisState, {
  powerGrid: 10,
  lifeSupport: 15,
  radiationShielding: 5, // <10 MW! Should trigger freeze alert
  foodProduction: 5,
});

const freezeAlert = underAllocTurn.result.alerts.find(
  (a) => a.headline.includes("FREEZE") || a.detail.includes("freezing")
);
console.log(`Freeze alert triggered when heating < 10 MW: ${!!freezeAlert}`);
if (!freezeAlert) {
  throw new Error("Expected freeze alert for Artemis III when thermal heating < 10 MW!");
}

// 3. Test Opportunity's Dust Storm (2018 Global Storm)
console.log("\n--- Testing Opportunity's Dust Storm ---");
const oppyState = createInitialGameState(
  OPPORTUNITY_DUST_STORM.baseEnvironment,
  "commander",
  "TEST-OPPY-5111",
  OPPORTUNITY_DUST_STORM
);

console.log(`Opportunity scenario attached: ${oppyState.scenario?.title}`);
console.log(`PowerGrid initial health: ${oppyState.subsystems.powerGrid.health}%`);
console.log(`Food initial days: ${oppyState.crew.foodReserveDays}`);

const oppyBudget1 = getEffectivePowerBudget(
  oppyState.environment,
  1,
  0,
  "commander",
  oppyState.missionSeed,
  oppyState.scenario
);
const oppyBudget2 = getEffectivePowerBudget(
  oppyState.environment,
  2,
  0,
  "commander",
  oppyState.missionSeed,
  oppyState.scenario
);
console.log(`Sol 2 Effective Budget (Tau 10.8): ${oppyBudget2} MW (Expected 22 MW)`);
if (oppyBudget2 !== 22) {
  throw new Error(`Expected Sol 2 Opportunity budget to be 22 MW, got ${oppyBudget2}`);
}

// Test Greenhouse thermal shock alert (<10 MW)
const oppyTurn = processTurn(oppyState, {
  powerGrid: 6,
  lifeSupport: 10,
  radiationShielding: 6,
  foodProduction: 0, // 0 MW!
});

const shockAlert = oppyTurn.result.alerts.find(
  (a) => a.headline.includes("DUST BLACKOUT") || a.headline.includes("Thermal Shock")
);
console.log(`Thermal shock / blackout alert triggered: ${!!shockAlert}`);
if (!shockAlert) {
  throw new Error("Expected greenhouse shock alert for Opportunity when food power < 10 MW!");
}

// 4. Test Apollo 13 Cold Cabin Emergency Protocol
console.log("\n--- Testing Apollo 13 Cold Cabin Protocol ---");
const apolloState = createInitialGameState(
  APOLLO_13_COLD_CABIN.baseEnvironment,
  "commander",
  "TEST-APOLLO-13",
  APOLLO_13_COLD_CABIN
);

console.log(`Apollo scenario attached: ${apolloState.scenario?.title}`);
console.log(`PowerGrid initial health: ${apolloState.subsystems.powerGrid.health}% (Ruptured battery bank)`);
console.log(`RadiationShielding initial health: ${apolloState.subsystems.radiationShielding.health}%`);

const apolloBudget1 = getEffectivePowerBudget(
  apolloState.environment,
  1,
  0,
  "commander",
  apolloState.missionSeed,
  apolloState.scenario
);
console.log(`Sol 1 Effective Budget: ${apolloBudget1} MW (Capped at 45 MW)`);
if (apolloBudget1 > 45) {
  throw new Error(`Expected Apollo 13 budget to be capped at 45 MW, got ${apolloBudget1}`);
}

// Test cold cabin heating violation alert (>6 MW)
const apolloTurn = processTurn(apolloState, {
  powerGrid: 10,
  lifeSupport: 20,
  radiationShielding: 15, // >6 MW! Violates Cold Cabin Protocol
  foodProduction: 0,
});

const coldCabinViolationAlert = apolloTurn.result.alerts.find((a) =>
  a.headline.includes("COLD CABIN")
);
console.log(`Cold Cabin violation alert triggered: ${!!coldCabinViolationAlert}`);
if (!coldCabinViolationAlert) {
  throw new Error("Expected Cold Cabin violation alert when heating > 6 MW!");
}

// 5. Run full 10-Sol simulation on all 3 scenarios
console.log("\n--- Running 10-Sol Full Simulation Across All Scenarios ---");
for (const scenario of HISTORIC_SCENARIOS) {
  let state = createInitialGameState(
    scenario.baseEnvironment,
    "commander",
    `SEED-${scenario.id.toUpperCase()}`,
    scenario
  );

  for (let sol = 1; sol <= 10; sol++) {
    const budget = getEffectivePowerBudget(
      state.environment,
      sol,
      0,
      state.difficulty,
      state.missionSeed,
      state.scenario
    );
    const alloc = getDefaultAllocation(budget, state.difficulty);
    const step = processTurn(state, alloc);
    state = step.nextState;
  }

  console.log(
    `✓ ${scenario.title}: Completed 10 Sols | Outcome: ${state.finalOutcome} | Score: ${state.cumulativeScore}/100`
  );
}

console.log("\nALL HISTORIC SCENARIOS VALIDATED SUCCESSFULLY! ✓");
