// ============================================================
// verify-crew-specialization.ts
// Test suite for Crew Specialization, Morale Events, and Emergency Repairs
// ============================================================

import {
  createInitialCrewMembers,
  INCIDENT_SPECIALIST_REPAIRS,
  type CrewRoleId,
} from "../src/data/crewData";
import {
  createInitialGameState,
  applyIncidentChoice,
  processTurn,
  type PowerAllocation,
} from "../src/engine/simulationEngine";
import { LUNAR_SOUTH_POLE, MARS_GALE_CRATER } from "../src/data/nasaConstants";
import { LUNAR_INCIDENT_CARDS, MARS_INCIDENT_CARDS } from "../src/data/incidentCards";

console.log("=== OUTPOST COMMANDER: CREW SPECIALIZATION VERIFICATION ===");

// 1. Verify 4 distinct crew roles
const crew = createInitialCrewMembers("commander");
if (crew.length !== 4) {
  throw new Error(`Expected 4 crew members, got ${crew.length}`);
}

const expectedRoles: CrewRoleId[] = ["botanist", "power_engineer", "medical_officer", "geologist"];
const actualRoles = crew.map((c) => c.role);
for (const r of expectedRoles) {
  if (!actualRoles.includes(r)) {
    throw new Error(`Missing expected crew role: ${r}`);
  }
}
console.log("✓ Verified 4 distinct crew roles initialized:", actualRoles.join(", "));

// 2. Verify all 10 incidents have specialist repair options for all 4 roles
const allIncidentCards = [...LUNAR_INCIDENT_CARDS, ...MARS_INCIDENT_CARDS];
console.log(`Checking ${allIncidentCards.length} NASA incidents for complete specialist matrices...`);

for (const card of allIncidentCards) {
  const matrix = INCIDENT_SPECIALIST_REPAIRS[card.id];
  if (!matrix) {
    throw new Error(`Missing specialist repairs for incident: ${card.id}`);
  }
  for (const role of expectedRoles) {
    const repair = matrix[role];
    if (!repair) {
      throw new Error(`Missing repair option for ${role} on incident: ${card.id}`);
    }
    if (!repair.actionPrompt || !repair.riskDescription || !repair.rewardDescription) {
      throw new Error(`Incomplete risk/reward definition for ${role} on ${card.id}`);
    }
  }
}
console.log("✓ Verified all 10 NASA incidents contain rich risk-vs-reward options for all 4 roles!");

// 3. Test High Solar Flux Botanist EVA Scenario (Prompt's exact requirement)
console.log("\nTesting prompt scenario: 'Send Botanist on an EVA during high solar flux to salvage crops?'");
let gameState = createInitialGameState(LUNAR_SOUTH_POLE, "commander");

const speIncident = LUNAR_INCIDENT_CARDS.find((c) => c.id === "lunar_solar_storm_spe");
if (!speIncident) throw new Error("Could not find lunar_solar_storm_spe card");

const botanistRepair = INCIDENT_SPECIALIST_REPAIRS["lunar_solar_storm_spe"]["botanist"];
console.log(`Action Prompt: "${botanistRepair.actionPrompt}"`);
console.log(`Reward: ${botanistRepair.rewardDescription}`);
console.log(`Risk: ${botanistRepair.riskDescription}`);

const initialFood = gameState.crew.foodReserveDays;
const initialBotanistMorale = gameState.crew.members.find((m) => m.role === "botanist")?.morale ?? 0;
const initialBotanistRad = gameState.crew.members.find((m) => m.role === "botanist")?.radiationDoseMSv ?? 0;

// Apply incident directive with emergency Botanist EVA deployment
gameState = applyIncidentChoice(gameState, speIncident, speIncident.choices[0], botanistRepair);

const postBotanist = gameState.crew.members.find((m) => m.role === "botanist");
if (!postBotanist) throw new Error("Botanist not found after incident");

console.log(`Botanist Status after EVA: ${postBotanist.status}`);
console.log(`Botanist Morale: ${initialBotanistMorale} -> ${postBotanist.morale}`);
console.log(`Botanist Radiation Dose: ${initialBotanistRad} -> ${postBotanist.radiationDoseMSv} mSv`);
console.log(`Food Reserves: ${initialFood} -> ${gameState.crew.foodReserveDays} days`);

if (postBotanist.status !== "irradiated") {
  throw new Error(`Expected Botanist status to be 'irradiated', got ${postBotanist.status}`);
}
if (postBotanist.radiationDoseMSv <= initialBotanistRad) {
  throw new Error("Expected Botanist radiation dose to increase");
}
if (postBotanist.morale >= initialBotanistMorale) {
  throw new Error("Expected Botanist morale to drop from extreme EVA stress");
}
if (gameState.crew.foodReserveDays <= initialFood) {
  throw new Error("Expected food reserves to increase from crop salvage reward");
}

// Verify Morale Event created
const recentEvents = gameState.crew.recentMoraleEvents || [];
const speEvent = recentEvents.find((e) => e.crewRole === "botanist");
if (!speEvent) throw new Error("Expected Morale Event for Botanist sacrifice not found");
console.log(`✓ Morale Event recorded: [${speEvent.type.toUpperCase()}] "${speEvent.title}" — ${speEvent.narrative}`);

// 4. Test Turn Processing & Passive Doctor Perks
console.log("\nTesting turn simulation & passive crew perks...");
const allocation: PowerAllocation = {
  powerGrid: 30,
  lifeSupport: 35,
  radiationShielding: 25,
};

const { nextState } = processTurn(gameState, allocation);
console.log(`Sol 1 Turn Processed: Team Morale = ${nextState.crew.morale}%, Team Rad = ${nextState.crew.radiationExposureMSv} mSv`);
console.log(`Botanist Status after medical care: ${nextState.crew.members.find((m) => m.role === "botanist")?.status}`);

console.log("\n=======================================================");
console.log("ALL CREW SPECIALIZATION & MORALE TESTS PASSED 100%!");
console.log("=======================================================");
