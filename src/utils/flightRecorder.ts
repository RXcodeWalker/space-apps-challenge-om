// ============================================================
// flightRecorder.ts — Sol-by-Sol Flight Recorder & Milestone Engine
// Computes power distribution, crew telemetry, and contextual
// milestone annotations across all 10 Sols of the mission.
// ============================================================

import type { GameState, TurnResult, PowerAllocation, SubsystemId } from "../engine/simulationEngine";
import type { MissionEnvironment, TurnEvent } from "../data/nasaConstants";

export interface SolMilestone {
  sol: number;
  event: TurnEvent;
  headline: string;
  milestoneAnnotation: string; // e.g. "Sol 4: Major Solar Flare weathered with 45 MW shields"
  shortAnnotation: string;
  tag: string;
  severity: "critical" | "warning" | "bonus" | "nominal";
  iconType: "flare" | "storm" | "harvest" | "eclipse" | "strike" | "thermal" | "nominal" | "eval";
  isMajor: boolean;
  powerAllocation: PowerAllocation;
  effectiveBudgetMW: number;
  totalAllocatedMW: number;
  crewVitals: {
    morale: number;
    oxygenBufferPercent: number;
    foodReserveDays: number;
    radiationExposureMSv: number;
    deltaRadiationMSv: number;
  };
  subsystemHealth: Record<SubsystemId, number>;
  incidentChoiceLabel?: string;
  incidentTakeaway?: string;
}

export interface FlightRecorderSummary {
  milestones: SolMilestone[];
  peakRadiationSol: number;
  maxPowerBudgetSol: number;
  minPowerBudgetSol: number;
  avgAllocation: PowerAllocation;
  totalRadiationAbsorbedMSv: number;
  lowestOxygenSol: number;
  certificateCitation: string;
}

/**
 * Synthesizes a punchy, NASA-grounded milestone annotation for a given Sol
 * based on the environment hazard, player's power allocation, and incident choice.
 */
function buildMilestoneAnnotation(
  sol: number,
  turnResult: TurnResult,
  prevTurnResult: TurnResult | null,
  incidentRecord?: {
    choiceLabel: string;
    incidentTitle: string;
    tradeOffSummary: string;
    specialistName?: string;
    specialistRole?: string;
    specialistAction?: string;
  }
): {
  headline: string;
  milestoneAnnotation: string;
  shortAnnotation: string;
  tag: string;
  severity: "critical" | "warning" | "bonus" | "nominal";
  iconType: "flare" | "storm" | "harvest" | "eclipse" | "strike" | "thermal" | "nominal" | "eval";
  isMajor: boolean;
} {
  const { event, allocation } = turnResult;
  const prevRad = prevTurnResult ? prevTurnResult.crew.radiationExposureMSv : 0;
  const deltaRad = Math.max(0, turnResult.crew.radiationExposureMSv - prevRad);

  const eventLabelLower = event.label.toLowerCase();
  const eventDescLower = event.description.toLowerCase();

  // 1. Solar Particle Event / Solar Flare (Major Hazard)
  if (
    event.radiationSpikeMultiplier >= 2.0 ||
    eventLabelLower.includes("solar particle") ||
    eventLabelLower.includes("solar flare") ||
    eventLabelLower.includes("x-class") ||
    eventLabelLower.includes("spe")
  ) {
    const isXClass = event.radiationSpikeMultiplier >= 4 || eventLabelLower.includes("x-class");
    const flareType = isXClass ? "Major Solar Flare" : "Solar Particle Event";
    
    // Check if incident was resolved on this sol
    let choiceContext = "";
    if (incidentRecord) {
      const specText = incidentRecord.specialistName
        ? ` — Emergency Repair by ${incidentRecord.specialistName} (${incidentRecord.specialistRole})`
        : "";
      choiceContext = ` (${incidentRecord.choiceLabel}${specText})`;
    }

    return {
      headline: `Sol ${sol}: ${flareType} Weathered`,
      milestoneAnnotation: `Sol ${sol}: ${flareType} weathered with ${allocation.radiationShielding} MW shields (Crew dose held to +${deltaRad.toFixed(2)} mSv)${choiceContext}`,
      shortAnnotation: `Sol ${sol}: ${flareType} weathered with ${allocation.radiationShielding} MW shields`,
      tag: isXClass ? "X-CLASS FLARE" : "SOLAR FLARE",
      severity: "critical",
      iconType: "flare",
      isMajor: true,
    };
  }

  // 2. Severe Dust Storm / Solar Drop
  if (
    event.powerDeltaMW <= -15 ||
    eventLabelLower.includes("dust storm") ||
    eventDescLower.includes("dust coats")
  ) {
    const dropMW = Math.abs(event.powerDeltaMW);
    return {
      headline: `Sol ${sol}: Martian Dust Storm Endured`,
      milestoneAnnotation: `Sol ${sol}: Regional Dust Storm weathered with ${allocation.powerGrid} MW grid management through a ${dropMW} MW solar drop`,
      shortAnnotation: `Sol ${sol}: Dust Storm weathered with ${allocation.powerGrid} MW grid (${dropMW} MW drop)`,
      tag: "DUST STORM",
      severity: "warning",
      iconType: "storm",
      isMajor: true,
    };
  }

  // 3. Eclipse / Shadow Occlusion
  if (eventLabelLower.includes("eclipse") || eventDescLower.includes("occludes")) {
    return {
      headline: `Sol ${sol}: Lunar Eclipse Managed`,
      milestoneAnnotation: `Sol ${sol}: Partial Lunar Eclipse managed with ${allocation.powerGrid} MW battery discharge during solar shadow`,
      shortAnnotation: `Sol ${sol}: Eclipse managed with ${allocation.powerGrid} MW battery reserve`,
      tag: "ECLIPSE",
      severity: "warning",
      iconType: "eclipse",
      isMajor: true,
    };
  }

  // 4. Micrometeorite Strike / Hull Damage
  if (eventLabelLower.includes("micrometeorite") || eventDescLower.includes("strike") || eventDescLower.includes("puncture")) {
    return {
      headline: `Sol ${sol}: Micrometeorite Strike Absorbed`,
      milestoneAnnotation: `Sol ${sol}: Micrometeorite impact absorbed; grid stabilized at ${allocation.powerGrid} MW while crew maintained life support`,
      shortAnnotation: `Sol ${sol}: Micrometeorite impact stabilized with ${allocation.powerGrid} MW grid`,
      tag: "IMPACT EVENT",
      severity: "critical",
      iconType: "strike",
      isMajor: true,
    };
  }

  // 5. Hydroponics / Harvest / Life Support Milestone
  if (
    eventLabelLower.includes("harvest") ||
    eventLabelLower.includes("hydroponics") ||
    eventLabelLower.includes("ice extraction") ||
    eventDescLower.includes("crop yield") ||
    eventDescLower.includes("water ice")
  ) {
    const isHarvest = eventLabelLower.includes("harvest");
    return {
      headline: isHarvest ? `Sol ${sol}: First Surface Harvest` : `Sol ${sol}: Resource Extraction Milestone`,
      milestoneAnnotation: isHarvest
        ? `Sol ${sol}: First greenhouse harvest achieved with ${allocation.lifeSupport} MW ECLSS (+15% morale boost)`
        : `Sol ${sol}: Crater ice successfully extracted with ${allocation.lifeSupport} MW life support power (+20% reserves)`,
      shortAnnotation: isHarvest
        ? `Sol ${sol}: Harvest achieved with ${allocation.lifeSupport} MW ECLSS`
        : `Sol ${sol}: Ice extracted with ${allocation.lifeSupport} MW ECLSS`,
      tag: isHarvest ? "CROP HARVEST" : "RESOURCE BONUS",
      severity: "bonus",
      iconType: "harvest",
      isMajor: true,
    };
  }

  // 6. Thermal Extremes / Frost
  if (
    eventLabelLower.includes("thermal") ||
    eventLabelLower.includes("frost") ||
    eventDescLower.includes("thermal swing") ||
    eventDescLower.includes("temperatures drop")
  ) {
    return {
      headline: `Sol ${sol}: Extreme Thermal Swing Countered`,
      milestoneAnnotation: `Sol ${sol}: Extreme surface thermal gradient countered with ${allocation.radiationShielding} MW thermal deflection`,
      shortAnnotation: `Sol ${sol}: Thermal extreme countered with ${allocation.radiationShielding} MW thermal shields`,
      tag: "THERMAL LOAD",
      severity: "warning",
      iconType: "thermal",
      isMajor: true,
    };
  }

  // 7. Sol 1: Deployment & Arrival
  if (sol === 1) {
    return {
      headline: `Sol 1: Outpost Deployment & Systems Nominal`,
      milestoneAnnotation: `Sol 1: Outpost deployed successfully; initial baseline configured with ${allocation.powerGrid} MW Grid, ${allocation.lifeSupport} MW ECLSS, and ${allocation.radiationShielding} MW Shields`,
      shortAnnotation: `Sol 1: Deployment nominal (${allocation.powerGrid} MW Grid / ${allocation.lifeSupport} MW ECLSS / ${allocation.radiationShielding} MW Shields)`,
      tag: "DEPLOYMENT",
      severity: "nominal",
      iconType: "nominal",
      isMajor: true,
    };
  }

  // 8. Sol 10: Mission Evaluation & Completion
  if (sol === 10) {
    return {
      headline: `Sol 10: 10-Sol Surface Mission Completed`,
      milestoneAnnotation: `Sol 10: Outpost survival verified; final telemetry recorded at ${turnResult.missionScorePercent}/100 operational integrity`,
      shortAnnotation: `Sol 10: Mission evaluation complete (${turnResult.missionScorePercent}/100 score)`,
      tag: "COMPLETION",
      severity: "bonus",
      iconType: "eval",
      isMajor: true,
    };
  }

  // 9. Standard / Routine Sol
  const eventCleanName = event.label.replace(/^Sol\s+\d+\s*[-—:]\s*/i, "").trim();
  return {
    headline: `Sol ${sol}: ${eventCleanName}`,
    milestoneAnnotation: `Sol ${sol}: Outpost operations maintained with ${allocation.powerGrid} MW Grid, ${allocation.lifeSupport} MW ECLSS, and ${allocation.radiationShielding} MW Shields`,
    shortAnnotation: `Sol ${sol}: Ops maintained (${allocation.powerGrid}G / ${allocation.lifeSupport}L / ${allocation.radiationShielding}S MW)`,
    tag: "OPERATIONS",
    severity: "nominal",
    iconType: "nominal",
    isMajor: false,
  };
}

export interface OutcomeRank {
  rankTitle: string;
  badge: string;
  evaluation: string;
  tier: "master" | "senior" | "survivor" | "junior" | "trainee";
  color: string;
  borderColor: string;
  bgGradient: string;
}

export function calculateOutcomeRank(gameState: GameState): OutcomeRank {
  const { cumulativeScore, finalOutcome, crew, subsystems, difficulty = "commander" } = gameState;
  const isHardcore = difficulty === "flight_director";
  const isCadet = difficulty === "cadet";

  const criticalHealthFloor = isCadet ? 8 : isHardcore ? 20 : 15;
  const criticalO2Floor = isCadet ? 5 : isHardcore ? 15 : 10;
  const missionRadLimit = isCadet ? 60 : isHardcore ? 45 : 50;

  const isFailed =
    finalOutcome === "critical_alert" ||
    crew.oxygenBufferPercent < criticalO2Floor ||
    crew.radiationExposureMSv > missionRadLimit ||
    (isHardcore && crew.careerRadiationExposureMSv > 500) ||
    Object.values(subsystems).some((s) => s.health < criticalHealthFloor);

  if (isFailed) {
    if (isHardcore && crew.careerRadiationExposureMSv > 500) {
      return {
        rankTitle: "Flight Status Disqualified (NCRP Overdose)",
        badge: "500 mSv CEILING BREACH",
        evaluation:
          "NASA-STD-3001 career radiation ceiling breached (>500 mSv). Grounding protocol initiated under federal aerospace medical guidelines. Crew biological cancer risk exceeded the 3% REID statutory threshold.",
        tier: "trainee",
        color: "text-red-400",
        borderColor: "border-red-500/50",
        bgGradient: "from-red-950/60 via-slate-900 to-black",
      };
    }

    if (isHardcore) {
      return {
        rankTitle: "Flight Director Abort",
        badge: "HARDCORE BREACH",
        evaluation:
          "Mission compromised under realistic hazards. Subsystems succumbed to extreme thermal cycling fatigue and hypervelocity MMOD micro-punctures. Realistic operations demand uncompromising margin management.",
        tier: "trainee",
        color: "text-red-400",
        borderColor: "border-red-500/50",
        bgGradient: "from-red-950/60 via-slate-900 to-black",
      };
    }

    if (isCadet) {
      return {
        rankTitle: "Cadet Trainee",
        badge: "TRAINING MISSION",
        evaluation:
          "Good effort, Cadet! Space is full of surprises. Remember to watch your automated assistant hints to keep life support and oxygen in the green zone. Ready for another try!",
        tier: "trainee",
        color: "text-amber-400",
        borderColor: "border-amber-500/50",
        bgGradient: "from-amber-950/60 via-slate-900 to-black",
      };
    }

    return {
      rankTitle: "Systems Trainee",
      badge: "SIMULATION ABORT",
      evaluation:
        "Critical survival threshold breached. Subsystems suffered cascading brownouts or life support depletion. NASA post-flight analysis recommends tighter power rationing during environmental spikes.",
      tier: "trainee",
      color: "text-red-400",
      borderColor: "border-red-500/50",
      bgGradient: "from-red-950/60 via-slate-900 to-black",
    };
  }

  // FLIGHT DIRECTOR HARDCORE RANKS
  if (isHardcore) {
    if (cumulativeScore >= 80) {
      return {
        rankTitle: "Gene Kranz Lead Flight Director",
        badge: "FLIGHT DIRECTOR GOLD MEDAL",
        evaluation:
          "Unrivaled operational excellence under brutal realism. Conquered hypervelocity micro-meteoroids, resisted severe 227°C cyclic thermal fatigue curves, and strictly safeguarded crew within NASA's 500 mSv lifetime career limit. An iconic mission for Mission Control.",
        tier: "master",
        color: "text-amber-300",
        borderColor: "border-amber-400/60",
        bgGradient: "from-amber-950/60 via-slate-900 to-black",
      };
    }
    if (cumulativeScore >= 65) {
      return {
        rankTitle: "Senior Mission Controller",
        badge: "KRANZ PIN (REALISTIC EXPEDITION)",
        evaluation:
          "Exemplary command under unforgiving physics. Managed micro-punctures and non-linear Coffin-Manson material fatigue while maintaining full NCRP radiation compliance.",
        tier: "senior",
        color: "text-cyan-300",
        borderColor: "border-cyan-400/60",
        bgGradient: "from-cyan-950/60 via-slate-900 to-black",
      };
    }
    return {
      rankTitle: "Hardcore Outpost Survivor",
      badge: "REALISTIC SURVIVOR",
      evaluation:
        "Outpost survived all 10 Sols of realistic space hazards. Significant thermal fatigue wear accumulated on composite seals, but all astronauts returned safely within career limits.",
      tier: "survivor",
      color: "text-emerald-300",
      borderColor: "border-emerald-500/50",
      bgGradient: "from-emerald-950/60 via-slate-900 to-black",
    };
  }

  // CADET RANKS
  if (isCadet) {
    if (cumulativeScore >= 75) {
      return {
        rankTitle: "Cadet Commander Gold Wings",
        badge: "CADET HONOR ROLL ⭐",
        evaluation:
          "Spectacular mission, Cadet! You balanced oxygen, food, and shields with automated coaching, keeping your astronauts happy and healthy all 10 Sols. NASA is proud of your leadership!",
        tier: "master",
        color: "text-emerald-300",
        borderColor: "border-emerald-400/60",
        bgGradient: "from-emerald-950/60 via-slate-900 to-black",
      };
    }
    if (cumulativeScore >= 50) {
      return {
        rankTitle: "Junior Explorer Wings",
        badge: "CADET MISSION GRADUATE",
        evaluation:
          "Great job completing your deep-space outpost mission! You learned how vital air, water, and power are for astronauts on the Moon and Mars.",
        tier: "senior",
        color: "text-cyan-300",
        borderColor: "border-cyan-400/60",
        bgGradient: "from-cyan-950/60 via-slate-900 to-black",
      };
    }
    return {
      rankTitle: "Junior Outpost Cadet",
      badge: "MISSION COMPLETED",
      evaluation:
        "You guided the outpost through all 10 Sols! With each mission you learn more about balancing solar power and keeping space explorers safe.",
      tier: "junior",
      color: "text-yellow-400",
      borderColor: "border-yellow-500/50",
      bgGradient: "from-yellow-950/60 via-slate-900 to-black",
    };
  }

  // COMMANDER STANDARD RANKS
  if (cumulativeScore >= 85) {
    return {
      rankTitle: "Artemis Master Architect",
      badge: "CHIEF FLIGHT ENGINEER",
      evaluation:
        "Flawless multi-variable execution. Maintained positive energy reserves while shielding the crew and keeping closed-loop ECLSS buffers above 80%. An exemplary model for NASA's Moon-to-Mars operational doctrine.",
      tier: "master",
      color: "text-amber-300",
      borderColor: "border-amber-400/60",
      bgGradient: "from-amber-950/60 via-slate-900 to-black",
    };
  }

  if (cumulativeScore >= 70) {
    return {
      rankTitle: "Artemis Master Engineer",
      badge: "EXPEDITION COMMANDER",
      evaluation:
        "Superb command under pressure. Successfully navigated extreme solar particle events and thermal anomalies while maintaining safe crew biological radiation thresholds.",
      tier: "senior",
      color: "text-cyan-300",
      borderColor: "border-cyan-400/60",
      bgGradient: "from-cyan-950/60 via-slate-900 to-black",
    };
  }

  if (cumulativeScore >= 52) {
    return {
      rankTitle: "Outpost Survivor",
      badge: "MISSION SURVIVOR",
      evaluation:
        "Mission completed and crew returned safely. However, several critical systems endured excessive wear or narrow O₂ margins. Optimization of power-divert protocols is recommended.",
      tier: "survivor",
      color: "text-emerald-300",
      borderColor: "border-emerald-500/50",
      bgGradient: "from-emerald-950/60 via-slate-900 to-black",
    };
  }

  return {
    rankTitle: "Junior Operations Officer",
    badge: "MISSION COMPLETED (MARGINAL)",
    evaluation:
      "Outpost survived the 10-turn window, but significant reserves were depleted. Heavy reliance on emergency buffers highlighted vulnerabilities in long-term infrastructure stability.",
    tier: "junior",
    color: "text-yellow-400",
    borderColor: "border-yellow-500/50",
    bgGradient: "from-yellow-950/60 via-slate-900 to-black",
  };
}

/**
 * Builds the complete Sol-by-Sol Flight Recorder summary from a game state.
 */
export function buildFlightRecorderData(
  gameState: GameState,
  _environment: MissionEnvironment
): FlightRecorderSummary {
  const history = gameState.history || [];
  const incidentHistory = gameState.incidentHistory || [];

  let prevTurnResult: TurnResult | null = null;
  const milestones: SolMilestone[] = [];

  let peakRadSol = 1;
  let maxRadDelta = -1;
  let maxPowerSol = 1;
  let maxPower = -1;
  let minPowerSol = 1;
  let minPower = 9999;
  let lowestO2Sol = 1;
  let lowestO2 = 101;

  let totalGrid = 0;
  let totalLS = 0;
  let totalShield = 0;
  let totalFood = 0;

  history.forEach((turnResult, index) => {
    const sol = turnResult.turn || index + 1;
    const prevRad = prevTurnResult ? prevTurnResult.crew.radiationExposureMSv : 0;
    const deltaRad = Math.max(0, turnResult.crew.radiationExposureMSv - prevRad);

    if (deltaRad > maxRadDelta) {
      maxRadDelta = deltaRad;
      peakRadSol = sol;
    }

    if (turnResult.powerBudgetMW > maxPower) {
      maxPower = turnResult.powerBudgetMW;
      maxPowerSol = sol;
    }

    if (turnResult.powerBudgetMW < minPower) {
      minPower = turnResult.powerBudgetMW;
      minPowerSol = sol;
    }

    if (turnResult.crew.oxygenBufferPercent < lowestO2) {
      lowestO2 = turnResult.crew.oxygenBufferPercent;
      lowestO2Sol = sol;
    }

    totalGrid += turnResult.allocation.powerGrid;
    totalLS += turnResult.allocation.lifeSupport;
    totalShield += turnResult.allocation.radiationShielding;
    totalFood += turnResult.allocation.foodProduction;

    const matchedIncident = incidentHistory.find((i) => i.sol === sol);

    const annotation = buildMilestoneAnnotation(
      sol,
      turnResult,
      prevTurnResult,
      matchedIncident
    );

    milestones.push({
      sol,
      event: turnResult.event,
      headline: annotation.headline,
      milestoneAnnotation: annotation.milestoneAnnotation,
      shortAnnotation: annotation.shortAnnotation,
      tag: annotation.tag,
      severity: annotation.severity,
      iconType: annotation.iconType,
      isMajor: annotation.isMajor,
      powerAllocation: turnResult.allocation,
      effectiveBudgetMW: turnResult.powerBudgetMW,
      totalAllocatedMW:
        turnResult.allocation.powerGrid +
        turnResult.allocation.lifeSupport +
        turnResult.allocation.radiationShielding +
        turnResult.allocation.foodProduction,
      crewVitals: {
        morale: turnResult.crew.morale,
        oxygenBufferPercent: turnResult.crew.oxygenBufferPercent,
        foodReserveDays: turnResult.crew.foodReserveDays,
        radiationExposureMSv: turnResult.crew.radiationExposureMSv,
        deltaRadiationMSv: deltaRad,
      },
      subsystemHealth: {
        powerGrid: turnResult.subsystems.powerGrid.health,
        lifeSupport: turnResult.subsystems.lifeSupport.health,
        radiationShielding: turnResult.subsystems.radiationShielding.health,
        foodProduction: turnResult.subsystems.foodProduction.health,
      },
      incidentChoiceLabel: matchedIncident?.choiceLabel,
      incidentTakeaway: matchedIncident?.engineeringTakeaway,
    });

    prevTurnResult = turnResult;
  });

  const count = Math.max(1, history.length);
  const avgAllocation: PowerAllocation = {
    powerGrid: Math.round(totalGrid / count),
    lifeSupport: Math.round(totalLS / count),
    radiationShielding: Math.round(totalShield / count),
    foodProduction: Math.round(totalFood / count),
  };

  // Generate citation text for the certificate based on the actual history
  const majorMilestone = milestones.find((m) => m.iconType === "flare") ||
    milestones.find((m) => m.iconType === "storm") ||
    milestones[Math.min(3, milestones.length - 1)];

  let citation = "";
  if (majorMilestone) {
    citation = `Weathered ${majorMilestone.shortAnnotation} while maintaining stable closed-loop life support and safeguarding the expedition crew across all 10 Sols of surface operations.`;
  } else {
    citation = `Maintained exceptional multi-variable system stability across all 10 Sols of surface exploration, preserving crew health and habitat reserves.`;
  }

  return {
    milestones,
    peakRadiationSol: peakRadSol,
    maxPowerBudgetSol: maxPowerSol,
    minPowerBudgetSol: minPowerSol,
    avgAllocation,
    totalRadiationAbsorbedMSv: gameState.crew.radiationExposureMSv,
    lowestOxygenSol: lowestO2Sol,
    certificateCitation: citation,
  };
}
