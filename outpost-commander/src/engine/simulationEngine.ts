// ============================================================
// Simulation Engine — Outpost Commander
// Implements a deterministic 10-turn mission loop for the
// Lunar South Pole and Mars Gale Crater environments.
// ============================================================

import type { MissionEnvironment, TurnEvent } from "../data/nasaConstants";
import {
  TOTAL_TURNS,
  MIN_SYSTEM_HEALTH,
  MAX_SYSTEM_HEALTH,
} from "../data/nasaConstants";

// ---------------------------------------------------------------------------
// Core type definitions
// ---------------------------------------------------------------------------

export type SubsystemId = "powerGrid" | "lifeSupport" | "radiationShielding";

export interface PowerAllocation {
  powerGrid: number;        // MW allocated to power grid management & batteries
  lifeSupport: number;      // MW allocated to O₂, water recycling, hydroponics
  radiationShielding: number; // MW allocated to magnetic/water-wall & thermal management
}

export interface SubsystemState {
  id: SubsystemId;
  label: string;
  health: number;           // 0–100 percentage
  wearAccumulated: number;  // 0–1 cumulative wear factor (drives failure risk)
  powerDrawMW: number;      // current turn's allocated MW
  statusMessage: string;    // human-readable status description
  kidFriendlyStatus: string;
}

export interface CrewState {
  morale: number;           // 0–100; drops with life support failures & radiation spikes
  radiationExposureMSv: number; // cumulative mission exposure
  safeRadiationLimitMSv: number; // 500 mSv NASA career limit (simplified 10-turn threshold)
  foodReserveDays: number;  // days of food remaining; starts at 15
  oxygenBufferPercent: number; // % of nominal O₂ buffer; 0 = emergency
}

export interface MissionAlert {
  severity: "info" | "warning" | "critical";
  subsystem: SubsystemId | "crew" | "power" | "general";
  headline: string;
  detail: string;
  tradeOffExplanation: string; // which engineering trade-off caused this
  kidFriendlyExplanation: string;
}

export type MissionOutcome =
  | "ongoing"
  | "mission_success"
  | "partial_success"
  | "critical_alert";

export interface TurnResult {
  turn: number;             // 1–10
  event: TurnEvent;
  powerBudgetMW: number;    // effective MW available this turn (after event modifiers)
  allocation: PowerAllocation;
  subsystems: Record<SubsystemId, SubsystemState>;
  crew: CrewState;
  alerts: MissionAlert[];
  outcome: MissionOutcome;
  missionScorePercent: number; // 0–100 running score
  turnNarrativeSummary: string;
  kidNarrativeSummary: string;
}

export interface GameState {
  environment: MissionEnvironment;
  currentTurn: number;      // 1-indexed; 0 = not started
  history: TurnResult[];
  subsystems: Record<SubsystemId, SubsystemState>;
  crew: CrewState;
  finalOutcome: MissionOutcome;
  cumulativeScore: number;
}

// ---------------------------------------------------------------------------
// Constants for the simulation model
// ---------------------------------------------------------------------------

/** MW required to keep a subsystem at exactly 100% health (baseline demand). */
const SUBSYSTEM_BASELINE_POWER: Record<SubsystemId, number> = {
  powerGrid: 25,
  lifeSupport: 35,
  radiationShielding: 30,
};

/** Fraction of remaining budget that acts as a free RTG/fuel-cell reserve. */
const RTG_RESERVE_FRACTION = 0.1;

/** Health recovery per MW over baseline (diminishing above 100%). */
const HEALTH_RECOVERY_PER_EXCESS_MW = 1.4;

/** Health degradation per MW under baseline demand. */
const HEALTH_LOSS_PER_DEFICIT_MW = 2.5;

/** Overload penalty: running any system above 120% power triggers wear. */
const OVERLOAD_THRESHOLD_FRACTION = 1.2;
const OVERLOAD_WEAR_RATE = 0.05;

/** Morale modifiers. */
const MORALE_GAIN_GOOD_TURN = 4;
const MORALE_LOSS_LIFE_SUPPORT_LOW = 8;
const MORALE_LOSS_RADIATION_HIGH = 6;
const MORALE_LOSS_FOOD_LOW = 10;

/** Food/oxygen constants. */
const FOOD_CONSUMED_PER_TURN = 1.0;      // days consumed per turn
const FOOD_HYDROPONICS_BONUS_PER_MW = 0.08; // extra food days per MW excess in life support
const OXYGEN_RECOVERY_PER_MW_EXCESS = 2;    // % O₂ buffer per MW excess
const OXYGEN_LOSS_PER_MW_DEFICIT = 4;       // % O₂ loss per MW deficit

/** Career radiation limit across the 10-turn mission (simplified). */
const MISSION_RADIATION_LIMIT_MSV = 50;

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function totalAllocatedMW(allocation: PowerAllocation): number {
  return allocation.powerGrid + allocation.lifeSupport + allocation.radiationShielding;
}

function initialSubsystems(): Record<SubsystemId, SubsystemState> {
  return {
    powerGrid: {
      id: "powerGrid",
      label: "Power Grid",
      health: 85,
      wearAccumulated: 0.05,
      powerDrawMW: SUBSYSTEM_BASELINE_POWER.powerGrid,
      statusMessage: "Solar arrays nominal. RTG on standby.",
      kidFriendlyStatus: "Your solar panels and backup batteries are working great!",
    },
    lifeSupport: {
      id: "lifeSupport",
      label: "Life Support",
      health: 90,
      wearAccumulated: 0.02,
      powerDrawMW: SUBSYSTEM_BASELINE_POWER.lifeSupport,
      statusMessage: "O₂ scrubbers, water recycling, and hydroponics nominal.",
      kidFriendlyStatus: "Air, water, and food systems are all doing well!",
    },
    radiationShielding: {
      id: "radiationShielding",
      label: "Radiation & Thermal Shielding",
      health: 80,
      wearAccumulated: 0.08,
      powerDrawMW: SUBSYSTEM_BASELINE_POWER.radiationShielding,
      statusMessage: "Magnetic wall and regolith shielding at standard deflection.",
      kidFriendlyStatus: "Your radiation shield is protecting the crew like a force field!",
    },
  };
}

function initialCrew(): CrewState {
  return {
    morale: 80,
    radiationExposureMSv: 0,
    safeRadiationLimitMSv: MISSION_RADIATION_LIMIT_MSV,
    foodReserveDays: 15,
    oxygenBufferPercent: 100,
  };
}

// ---------------------------------------------------------------------------
// Core simulation step — processes one turn given player allocation
// ---------------------------------------------------------------------------

function processSubsystem(
  subsystemId: SubsystemId,
  previous: SubsystemState,
  allocatedMW: number,
  eventStressFactor: number,
  extraWear: number
): SubsystemState {
  const baseline = SUBSYSTEM_BASELINE_POWER[subsystemId];
  const deficit = Math.max(0, baseline - allocatedMW);
  const excess = Math.max(0, allocatedMW - baseline);
  const overloadFraction = allocatedMW / baseline;

  let healthDelta = 0;
  healthDelta += excess * HEALTH_RECOVERY_PER_EXCESS_MW * (1 / eventStressFactor);
  healthDelta -= deficit * HEALTH_LOSS_PER_DEFICIT_MW * eventStressFactor;

  let newWear = previous.wearAccumulated + extraWear;
  if (overloadFraction > OVERLOAD_THRESHOLD_FRACTION) {
    newWear += OVERLOAD_WEAR_RATE * (overloadFraction - OVERLOAD_THRESHOLD_FRACTION) * 10;
  }

  // Accumulated wear linearly degrades max recoverable health
  const wearPenalty = newWear * 15;
  const newHealth = clamp(
    previous.health + healthDelta - wearPenalty * 0.3,
    MIN_SYSTEM_HEALTH,
    MAX_SYSTEM_HEALTH
  );

  const { statusMessage, kidFriendlyStatus } = buildSubsystemStatus(
    subsystemId,
    newHealth,
    deficit,
    excess,
    overloadFraction,
    eventStressFactor
  );

  return {
    ...previous,
    health: Math.round(newHealth * 10) / 10,
    wearAccumulated: Math.min(1, Math.round(newWear * 1000) / 1000),
    powerDrawMW: allocatedMW,
    statusMessage,
    kidFriendlyStatus,
  };
}

function buildSubsystemStatus(
  id: SubsystemId,
  health: number,
  deficit: number,
  _excess: number,
  overloadFraction: number,
  stressFactor: number
): { statusMessage: string; kidFriendlyStatus: string } {
  const labels: Record<SubsystemId, { normal: string; low: string; critical: string; kid: string; kidLow: string; kidCritical: string }> = {
    powerGrid: {
      normal: "Solar arrays and RTG providing stable power output.",
      low: "Battery reserves depleting. Solar generation below demand.",
      critical: "POWER FAILURE RISK — reserves near zero. Immediate reallocation required.",
      kid: "Your solar panels and backup batteries are doing great!",
      kidLow: "Uh oh — the batteries are running low! Move more power to the grid.",
      kidCritical: "EMERGENCY! Almost no power left! Fix this right away!",
    },
    lifeSupport: {
      normal: "O₂ scrubbers, water recycler, and hydroponics nominal.",
      low: "O₂ buffer dropping. CO₂ scrubbing under-powered. Hydroponics stress.",
      critical: "LIFE SUPPORT CRITICAL — crew O₂ at risk. Immediate power allocation required.",
      kid: "Air, water, and food systems are all working well!",
      kidLow: "The crew is running low on fresh air and water — add more power to Life Support!",
      kidCritical: "DANGER! The crew needs air NOW! Send more power to Life Support immediately!",
    },
    radiationShielding: {
      normal: "Magnetic deflection and thermal regulation within safe parameters.",
      low: "Shielding degraded. Elevated crew radiation exposure. Thermal stress detected.",
      critical: "SHIELDING FAILURE — crew exposed to hazardous radiation. Solar storm risk extreme.",
      kid: "Your radiation shield is working like a superhero force field!",
      kidLow: "The shield is getting weak — the crew is absorbing more radiation. Add more power!",
      kidCritical: "DANGER! The shield is almost broken! The crew is in serious danger from radiation!",
    },
  };

  const l = labels[id];
  if (health < 30 || (stressFactor > 3 && health < 50)) {
    return { statusMessage: l.critical, kidFriendlyStatus: l.kidCritical };
  }
  if (health < 60 || deficit > 8) {
    return { statusMessage: l.low, kidFriendlyStatus: l.kidLow };
  }
  if (overloadFraction > OVERLOAD_THRESHOLD_FRACTION) {
    return {
      statusMessage: `${l.normal} ⚠ OVERLOAD: running at ${Math.round(overloadFraction * 100)}%.`,
      kidFriendlyStatus: `${l.kid} But it's working TOO hard — this causes extra wear!`,
    };
  }
  return { statusMessage: l.normal, kidFriendlyStatus: l.kid };
}

function computeAlerts(
  prevSubsystems: Record<SubsystemId, SubsystemState>,
  nextSubsystems: Record<SubsystemId, SubsystemState>,
  crew: CrewState,
  event: TurnEvent,
  allocation: PowerAllocation,
  effectiveBudgetMW: number
): MissionAlert[] {
  const alerts: MissionAlert[] = [];
  const totalUsed = totalAllocatedMW(allocation);

  if (totalUsed > effectiveBudgetMW + 2) {
    alerts.push({
      severity: "critical",
      subsystem: "power",
      headline: "Over-budget Power Allocation",
      detail: `You allocated ${totalUsed} MW but only ${effectiveBudgetMW.toFixed(0)} MW is available this turn.`,
      tradeOffExplanation:
        "Allocating more power than the grid can produce causes brownouts across all systems simultaneously — the classic trade-off: you can't give everyone more than you generate.",
      kidFriendlyExplanation:
        "You tried to use more power than your solar panels and batteries make! It's like trying to run three hair dryers from one tiny battery. Everything gets weak at once.",
    });
  }

  (["powerGrid", "lifeSupport", "radiationShielding"] as SubsystemId[]).forEach((id) => {
    const prev = prevSubsystems[id];
    const next = nextSubsystems[id];
    const drop = prev.health - next.health;

    if (next.health < 30) {
      const tradeOffs: Record<SubsystemId, string> = {
        powerGrid:
          "Starving the Power Grid to feed other systems triggers a cascade: without power generation, everything else shuts down too.",
        lifeSupport:
          "Diverting power from Life Support to Shielding during a storm saves the crew from radiation but risks their air supply — a classic mission survival dilemma.",
        radiationShielding:
          "Powering Life Support and the Grid at the expense of Shielding exposes the crew to cumulative radiation — a risk that grows invisibly every turn.",
      };
      const kidExplanations: Record<SubsystemId, string> = {
        powerGrid:
          "Your power system is almost broken! Without power, NOTHING works — not the air system, not the shields. Power is the most important thing!",
        lifeSupport:
          "The crew is almost out of fresh air and food! You protected them from radiation, but now they need life support power urgently.",
        radiationShielding:
          "The radiation shield is almost gone! The crew has been absorbing dangerous rays that add up over time — like getting too much sunburn, but invisible.",
      };
      alerts.push({
        severity: "critical",
        subsystem: id,
        headline: `${nextSubsystems[id].label} CRITICAL`,
        detail: `Health dropped to ${next.health.toFixed(1)}%. Immediate power reallocation required.`,
        tradeOffExplanation: tradeOffs[id],
        kidFriendlyExplanation: kidExplanations[id],
      });
    } else if (drop > 20) {
      alerts.push({
        severity: "warning",
        subsystem: id,
        headline: `${nextSubsystems[id].label} Degrading Fast`,
        detail: `Health fell ${drop.toFixed(1)} points this turn. Consider reallocating power.`,
        tradeOffExplanation: `Rapid health decline in ${nextSubsystems[id].label} means the current power allocation is too low relative to this turn's demand. Increasing power here will draw from other systems.`,
        kidFriendlyExplanation: `The ${nextSubsystems[id].label} lost a lot of health this turn. Try giving it more power — but remember, that means taking power from somewhere else!`,
      });
    }
  });

  if (crew.oxygenBufferPercent < 20) {
    alerts.push({
      severity: "critical",
      subsystem: "crew",
      headline: "O₂ Emergency — Crew at Risk",
      detail: `Oxygen buffer at ${crew.oxygenBufferPercent.toFixed(0)}%. CO₂ scrubbing critically under-powered.`,
      tradeOffExplanation:
        "Oxygen regeneration requires sustained Life Support power. Prioritising shielding or power grid in previous turns depleted the O₂ buffer — a time-delayed consequence of power trade-offs.",
      kidFriendlyExplanation:
        "EMERGENCY! The crew is running out of breathable air! This happened because Life Support didn't get enough power in the last few turns. Air is life — always keep some power here!",
    });
  }

  if (crew.radiationExposureMSv > MISSION_RADIATION_LIMIT_MSV * 0.7) {
    alerts.push({
      severity: "warning",
      subsystem: "crew",
      headline: "Crew Radiation Exposure Elevated",
      detail: `Cumulative exposure: ${crew.radiationExposureMSv.toFixed(2)} mSv (limit: ${MISSION_RADIATION_LIMIT_MSV} mSv).`,
      tradeOffExplanation:
        "Radiation exposure is cumulative and invisible — a small deficit in shielding each turn compiles into a serious health risk by mission end. This is exactly why long-duration missions require robust, continuous shielding.",
      kidFriendlyExplanation:
        "The crew has absorbed quite a bit of radiation — it adds up like collecting points in a bad game. Keep the radiation shield strong for the rest of the mission!",
    });
  }

  if (event.radiationSpikeMultiplier >= 3) {
    alerts.push({
      severity: "critical",
      subsystem: "general",
      headline: event.label,
      detail: event.description,
      tradeOffExplanation:
        "During a major Solar Particle Event, engineers must choose: pour power into shielding (sacrificing food/O₂ production) or maintain life support (accepting higher crew radiation dose). There is no free option.",
      kidFriendlyExplanation: event.kidFriendlyDescription,
    });
  } else if (event.powerDeltaMW < -15) {
    alerts.push({
      severity: "warning",
      subsystem: "power",
      headline: event.label,
      detail: event.description,
      tradeOffExplanation:
        "A power reduction event compresses the available budget — every MW becomes more valuable and the prioritisation trade-offs become sharper. Something must give.",
      kidFriendlyExplanation: event.kidFriendlyDescription,
    });
  } else if (event.powerDeltaMW !== 0 || event.lifeSupportStressFactor !== 1.0) {
    alerts.push({
      severity: "info",
      subsystem: "general",
      headline: event.label,
      detail: event.description,
      tradeOffExplanation: "",
      kidFriendlyExplanation: event.kidFriendlyDescription,
    });
  }

  return alerts;
}

function computeMissionScore(subsystems: Record<SubsystemId, SubsystemState>, crew: CrewState): number {
  const healthScore =
    (subsystems.powerGrid.health + subsystems.lifeSupport.health + subsystems.radiationShielding.health) / 3;
  const moraleScore = crew.morale;
  const radiationScore = clamp(
    100 - (crew.radiationExposureMSv / MISSION_RADIATION_LIMIT_MSV) * 100,
    0,
    100
  );
  const foodScore = clamp((crew.foodReserveDays / 15) * 100, 0, 100);
  const o2Score = crew.oxygenBufferPercent;

  return Math.round(
    healthScore * 0.35 +
      moraleScore * 0.2 +
      radiationScore * 0.2 +
      foodScore * 0.1 +
      o2Score * 0.15
  );
}

function computeOutcome(
  turn: number,
  subsystems: Record<SubsystemId, SubsystemState>,
  crew: CrewState,
  score: number
): MissionOutcome {
  const anySystemCritical = Object.values(subsystems).some((s) => s.health < 15);
  const crewInDanger = crew.oxygenBufferPercent < 10 || crew.radiationExposureMSv > MISSION_RADIATION_LIMIT_MSV;

  if (anySystemCritical || crewInDanger) {
    return "critical_alert";
  }

  if (turn === TOTAL_TURNS) {
    if (score >= 70) return "mission_success";
    if (score >= 45) return "partial_success";
    return "critical_alert";
  }

  return "ongoing";
}

function buildNarratives(
  turn: number,
  event: TurnEvent,
  subsystems: Record<SubsystemId, SubsystemState>,
  crew: CrewState,
  alerts: MissionAlert[]
): { summary: string; kidSummary: string } {
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const worstSystem = Object.values(subsystems).sort((a, b) => a.health - b.health)[0];

  if (criticalAlerts.length > 0) {
    return {
      summary: `Turn ${turn}: ${event.label} — CRITICAL alerts active. ${worstSystem.label} at ${worstSystem.health.toFixed(0)}% health. Immediate reallocation needed.`,
      kidSummary: `Turn ${turn}: ${event.kidFriendlyDescription} Things are getting serious — your ${worstSystem.label} needs help right now!`,
    };
  }

  const avgHealth =
    Object.values(subsystems).reduce((s, x) => s + x.health, 0) / 3;
  if (avgHealth > 70) {
    return {
      summary: `Turn ${turn}: ${event.label} — Systems stable. Average health ${avgHealth.toFixed(0)}%. Crew morale ${crew.morale}%.`,
      kidSummary: `Turn ${turn}: ${event.kidFriendlyDescription} Great job — the outpost is running well and the crew is happy!`,
    };
  }

  return {
    summary: `Turn ${turn}: ${event.label} — Systems under pressure. Average health ${avgHealth.toFixed(0)}%. Review allocation.`,
    kidSummary: `Turn ${turn}: ${event.kidFriendlyDescription} Some systems need attention — check where you're sending power!`,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function createInitialGameState(environment: MissionEnvironment): GameState {
  return {
    environment,
    currentTurn: 0,
    history: [],
    subsystems: initialSubsystems(),
    crew: initialCrew(),
    finalOutcome: "ongoing",
    cumulativeScore: 0,
  };
}

export function getDefaultAllocation(effectiveBudgetMW: number): PowerAllocation {
  // Sensible baseline: prioritise life support, then shielding, then grid management
  const lifeSupport = Math.min(SUBSYSTEM_BASELINE_POWER.lifeSupport, effectiveBudgetMW * 0.38);
  const radiationShielding = Math.min(SUBSYSTEM_BASELINE_POWER.radiationShielding, effectiveBudgetMW * 0.32);
  const powerGrid = Math.max(0, effectiveBudgetMW - lifeSupport - radiationShielding);
  return {
    powerGrid: Math.round(powerGrid),
    lifeSupport: Math.round(lifeSupport),
    radiationShielding: Math.round(radiationShielding),
  };
}

export function getEffectivePowerBudget(
  environment: MissionEnvironment,
  turn: number
): number {
  const event = environment.turnEvents[turn - 1];
  const rtgFloor = environment.basePowerBudgetMW * RTG_RESERVE_FRACTION;
  const solar = environment.basePowerBudgetMW * environment.baselineSolarEfficiency;
  const effective = Math.max(rtgFloor, solar + event.powerDeltaMW);
  return Math.round(effective);
}

export function processTurn(
  gameState: GameState,
  allocation: PowerAllocation
): { nextState: GameState; result: TurnResult } {
  const turn = gameState.currentTurn + 1;
  const { environment } = gameState;
  const event = environment.turnEvents[turn - 1];

  const effectiveBudgetMW = getEffectivePowerBudget(environment, turn);

  // Clamp allocation so it never exceeds the budget (simulate brownout proportionally)
  const totalRequested = totalAllocatedMW(allocation);
  const scaleFactor = totalRequested > effectiveBudgetMW ? effectiveBudgetMW / totalRequested : 1;
  const clampedAllocation: PowerAllocation = {
    powerGrid: Math.round(allocation.powerGrid * scaleFactor),
    lifeSupport: Math.round(allocation.lifeSupport * scaleFactor),
    radiationShielding: Math.round(allocation.radiationShielding * scaleFactor),
  };

  // Process each subsystem
  const prevSubsystems = gameState.subsystems;
  const nextSubsystems: Record<SubsystemId, SubsystemState> = {
    powerGrid: processSubsystem(
      "powerGrid",
      prevSubsystems.powerGrid,
      clampedAllocation.powerGrid,
      1.0, // power grid stress is from eclipse/storm, encoded in effectiveBudgetMW already
      0
    ),
    lifeSupport: processSubsystem(
      "lifeSupport",
      prevSubsystems.lifeSupport,
      clampedAllocation.lifeSupport,
      event.lifeSupportStressFactor,
      0
    ),
    radiationShielding: processSubsystem(
      "radiationShielding",
      prevSubsystems.radiationShielding,
      clampedAllocation.radiationShielding,
      event.radiationSpikeMultiplier,
      event.shieldingWearDelta
    ),
  };

  // Update crew state
  const shieldingHealth = nextSubsystems.radiationShielding.health / 100;
  const effectiveRadiationMSv =
    environment.baselineDailyRadiationMSv *
    event.radiationSpikeMultiplier *
    (1 - shieldingHealth * 0.85); // good shielding blocks up to 85% of radiation

  const lsHealth = nextSubsystems.lifeSupport.health / 100;
  const lsDeficit = Math.max(
    0,
    SUBSYSTEM_BASELINE_POWER.lifeSupport - clampedAllocation.lifeSupport
  );
  const lsExcess = Math.max(
    0,
    clampedAllocation.lifeSupport - SUBSYSTEM_BASELINE_POWER.lifeSupport
  );

  const oxygenDelta = lsExcess * OXYGEN_RECOVERY_PER_MW_EXCESS - lsDeficit * OXYGEN_LOSS_PER_MW_DEFICIT;
  const newOxygenBuffer = clamp(
    gameState.crew.oxygenBufferPercent + oxygenDelta * event.lifeSupportStressFactor,
    0,
    100
  );

  const foodDelta =
    lsExcess * FOOD_HYDROPONICS_BONUS_PER_MW - FOOD_CONSUMED_PER_TURN;
  const newFoodReserve = clamp(gameState.crew.foodReserveDays + foodDelta, 0, 30);

  let moraleDelta = 0;
  if (lsHealth > 0.75 && nextSubsystems.powerGrid.health > 60) moraleDelta += MORALE_GAIN_GOOD_TURN;
  if (lsHealth < 0.5) moraleDelta -= MORALE_LOSS_LIFE_SUPPORT_LOW;
  if (effectiveRadiationMSv > environment.baselineDailyRadiationMSv * 2) moraleDelta -= MORALE_LOSS_RADIATION_HIGH;
  if (newFoodReserve < 3) moraleDelta -= MORALE_LOSS_FOOD_LOW;

  const nextCrew: CrewState = {
    morale: clamp(gameState.crew.morale + moraleDelta, 0, 100),
    radiationExposureMSv:
      Math.round((gameState.crew.radiationExposureMSv + effectiveRadiationMSv) * 100) / 100,
    safeRadiationLimitMSv: MISSION_RADIATION_LIMIT_MSV,
    foodReserveDays: Math.round(newFoodReserve * 10) / 10,
    oxygenBufferPercent: Math.round(newOxygenBuffer * 10) / 10,
  };

  const alerts = computeAlerts(
    prevSubsystems,
    nextSubsystems,
    nextCrew,
    event,
    clampedAllocation,
    effectiveBudgetMW
  );

  const score = computeMissionScore(nextSubsystems, nextCrew);
  const outcome = computeOutcome(turn, nextSubsystems, nextCrew, score);
  const { summary, kidSummary } = buildNarratives(turn, event, nextSubsystems, nextCrew, alerts);

  const result: TurnResult = {
    turn,
    event,
    powerBudgetMW: effectiveBudgetMW,
    allocation: clampedAllocation,
    subsystems: nextSubsystems,
    crew: nextCrew,
    alerts,
    outcome,
    missionScorePercent: score,
    turnNarrativeSummary: summary,
    kidNarrativeSummary: kidSummary,
  };

  const nextState: GameState = {
    ...gameState,
    currentTurn: turn,
    history: [...gameState.history, result],
    subsystems: nextSubsystems,
    crew: nextCrew,
    finalOutcome: outcome,
    cumulativeScore: score,
  };

  return { nextState, result };
}

export function getTradeOffHints(allocation: PowerAllocation, effectiveBudgetMW: number): string[] {
  const hints: string[] = [];
  const total = totalAllocatedMW(allocation);

  if (total > effectiveBudgetMW) {
    hints.push(`You're trying to use ${total} MW but only ${effectiveBudgetMW} MW is available — the system will auto-scale down proportionally.`);
  }

  if (allocation.lifeSupport < SUBSYSTEM_BASELINE_POWER.lifeSupport - 5) {
    hints.push(`Life Support is under-powered by ${SUBSYSTEM_BASELINE_POWER.lifeSupport - allocation.lifeSupport} MW — crew O₂ and food production will suffer.`);
  }

  if (allocation.radiationShielding < SUBSYSTEM_BASELINE_POWER.radiationShielding - 5) {
    hints.push(`Radiation Shielding is under-powered by ${SUBSYSTEM_BASELINE_POWER.radiationShielding - allocation.radiationShielding} MW — crew cumulative radiation dose will rise.`);
  }

  if (allocation.powerGrid < SUBSYSTEM_BASELINE_POWER.powerGrid - 5) {
    hints.push(`Power Grid management is under-resourced by ${SUBSYSTEM_BASELINE_POWER.powerGrid - allocation.powerGrid} MW — battery reserves may not replenish adequately.`);
  }

  const overloads = (["powerGrid", "lifeSupport", "radiationShielding"] as SubsystemId[]).filter((id) => {
    return allocation[id] > SUBSYSTEM_BASELINE_POWER[id] * OVERLOAD_THRESHOLD_FRACTION;
  });
  if (overloads.length > 0) {
    hints.push(`${overloads.map((id) => ({ powerGrid: "Power Grid", lifeSupport: "Life Support", radiationShielding: "Radiation Shielding" }[id])).join(" & ")} are in overload — this causes accelerated wear that is hard to reverse!`);
  }

  if (hints.length === 0) {
    hints.push("Allocation looks balanced. All three systems near their baseline power requirements.");
  }

  return hints;
}


