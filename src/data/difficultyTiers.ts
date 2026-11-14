// ============================================================
// difficultyTiers.ts — Commander Ranks & Difficulty Presets
// Implements 3 distinct mission simulation tiers:
// 1. Cadet (Ages 7–10): High margin of error, gentle automated hints
// 2. Commander (Standard): Balanced baseline 10-Sol NASA simulation
// 3. Flight Director (Hardcore / Realistic Mode):
//    - Random micro-meteoroid punctures
//    - Real non-linear thermal fatigue degradation curves (Coffin-Manson)
//    - Stricter 500 mSv NASA astronaut career radiation limits (NASA-STD-3001)
// ============================================================

import type { SubsystemId, PowerAllocation } from "../engine/simulationEngine";

export type DifficultyTier = "cadet" | "commander" | "flight_director";

export interface ThermalFatigueReport {
  solDeltaT: number;             // Temperature swing (°C) this sol
  activeThermalCoolingMW: number;// Power allocated to thermal / radiation loop
  thermalProtectionEfficiency: number; // 0 to 1
  thermalStrainStress: number;   // Calculated cyclic strain factor
  fatigueWearAdded: number;      // Progressive structural wear added this sol
  totalCumulativeFatigueWear: number; // Cumulative across mission
  warningLevel: "nominal" | "elevated" | "critical";
  technicalDiagnosis: string;
}

export interface MicrometeoroidStrike {
  id: string;
  sol: number;
  subsystemHit: SubsystemId;
  impactVelocityKmh: number;    // Hypervelocity (typically 40,000 - 72,000 km/h)
  particleDiameterMm: number;    // 0.5 mm to 2.5 mm
  pressureDropKPa: number;
  powerLossMW: number;
  wearDelta: number;
  o2LeakPercent: number;
  structuralBreachSeverity: "minor" | "moderate" | "severe";
  telemetryHeadline: string;
  technicalDetails: string;
  mitigationProtocol: string;
  repaired: boolean;
}

export interface AutomatedHint {
  id: string;
  category: "life_support" | "radiation" | "power" | "general";
  title: string;
  message: string;
  kidFriendlyMessage: string;
  actionRecommendation: string;
  suggestedAllocation?: Partial<PowerAllocation>;
  severity: "info" | "warning" | "urgent";
}

export interface DifficultyConfig {
  id: DifficultyTier;
  title: string;
  commanderRank: string;
  targetAudience: string;
  badge: string;
  emoji: string;
  tagline: string;
  description: string;
  accentColor: string;
  glowColor: string;
  borderColor: string;

  // Power demand & margins
  baselinePowerDemands: Record<SubsystemId, number>;
  rtgReserveFraction: number;
  recoveryMultiplier: number;
  deficitPenaltyMultiplier: number;
  wearRateMultiplier: number;

  // ECLSS & Crew Margins
  oxygenLossRateMultiplier: number;
  foodConsumptionPerTurn: number;
  lifeSupportSafetyThreshold: number; // Health % trigger for hints

  // Radiation Limits & Career Thresholds
  missionRadiationLimitMSv: number;   // 10-Sol expedition limit
  careerRadiationLimitMSv: number;    // 500 mSv NASA STD-3001 career limit
  radiationDamageMultiplier: number;
  strictCareerLimitEnforcement: boolean;

  // Hardcore Mechanics
  enableMicrometeoroids: boolean;
  micrometeoroidProbability: number;  // per-sol probability in realistic mode
  enableThermalFatigueCurves: boolean;
  thermalFatigueMultiplier: number;

  // Cadet Assistance
  enableAutomatedHints: boolean;
  automatedHintVerbosity: "high" | "standard" | "none";
}

export const DIFFICULTY_PRESETS: Record<DifficultyTier, DifficultyConfig> = {
  cadet: {
    id: "cadet",
    title: "Cadet",
    commanderRank: "Junior Cadet (Ages 7–10)",
    targetAudience: "Ages 7–10 & First-time Astronauts",
    badge: "CADET WINGS",
    emoji: "🌟",
    tagline: "Higher margin of error with automated gentle hints & coaching.",
    description:
      "Engineered for young explorers! Subsystems have built-in safety buffers, power goes further, and your automated Mission Control assistant alerts you whenever life support needs attention.",
    accentColor: "#10B981", // Emerald
    glowColor: "rgba(16, 185, 129, 0.35)",
    borderColor: "border-emerald-500/60",

    baselinePowerDemands: {
      powerGrid: 20,          // Reduced from 25 MW
      lifeSupport: 28,        // Reduced from 35 MW
      radiationShielding: 24, // Reduced from 30 MW
    },
    rtgReserveFraction: 0.15,
    recoveryMultiplier: 1.5,
    deficitPenaltyMultiplier: 0.55,
    wearRateMultiplier: 0.45,

    oxygenLossRateMultiplier: 0.5,
    foodConsumptionPerTurn: 0.75,
    lifeSupportSafetyThreshold: 70,

    missionRadiationLimitMSv: 60,
    careerRadiationLimitMSv: 500,
    radiationDamageMultiplier: 0.65,
    strictCareerLimitEnforcement: false,

    enableMicrometeoroids: false,
    micrometeoroidProbability: 0,
    enableThermalFatigueCurves: false,
    thermalFatigueMultiplier: 0,

    enableAutomatedHints: true,
    automatedHintVerbosity: "high",
  },

  commander: {
    id: "commander",
    title: "Commander",
    commanderRank: "Expedition Commander",
    targetAudience: "Standard Artemis Expedition Simulation",
    badge: "MISSION COMMANDER",
    emoji: "🚀",
    tagline: "The standard balanced NASA simulation experience.",
    description:
      "Authentic NASA mission baseline. Manage 100 MW of power across 10 unpredictable Sols. Trade-offs require careful planning between ECLSS life support, force-field deflection, and battery backup.",
    accentColor: "#06B6D4", // Cyan
    glowColor: "rgba(6, 182, 212, 0.35)",
    borderColor: "border-cyan-500/60",

    baselinePowerDemands: {
      powerGrid: 25,
      lifeSupport: 35,
      radiationShielding: 30,
    },
    rtgReserveFraction: 0.10,
    recoveryMultiplier: 1.0,
    deficitPenaltyMultiplier: 1.0,
    wearRateMultiplier: 1.0,

    oxygenLossRateMultiplier: 1.0,
    foodConsumptionPerTurn: 1.0,
    lifeSupportSafetyThreshold: 50,

    missionRadiationLimitMSv: 50,
    careerRadiationLimitMSv: 500,
    radiationDamageMultiplier: 1.0,
    strictCareerLimitEnforcement: false,

    enableMicrometeoroids: false,
    micrometeoroidProbability: 0,
    enableThermalFatigueCurves: false,
    thermalFatigueMultiplier: 0,

    enableAutomatedHints: false,
    automatedHintVerbosity: "standard",
  },

  flight_director: {
    id: "flight_director",
    title: "Flight Director",
    commanderRank: "Lead Flight Director (Kranz Elite)",
    targetAudience: "Hardcore / Realistic Mode",
    badge: "FLIGHT DIRECTOR (HARDCORE)",
    emoji: "⚡",
    tagline: "Micro-meteoroids, thermal fatigue curves, and strict 500 mSv career limits.",
    description:
      "Uncompromising realism. Realistic micro-meteoroid hull punctures occur dynamically. Non-linear thermal fatigue degrades hardware under extreme 227°C diurnal swings, and NASA's 500 mSv career radiation ceiling is strictly enforced.",
    accentColor: "#F59E0B", // Amber / Gold
    glowColor: "rgba(245, 158, 11, 0.4)",
    borderColor: "border-amber-500/70",

    baselinePowerDemands: {
      powerGrid: 26,
      lifeSupport: 37,
      radiationShielding: 32,
    },
    rtgReserveFraction: 0.08,
    recoveryMultiplier: 0.85,
    deficitPenaltyMultiplier: 1.35,
    wearRateMultiplier: 1.65,

    oxygenLossRateMultiplier: 1.35,
    foodConsumptionPerTurn: 1.15,
    lifeSupportSafetyThreshold: 60,

    missionRadiationLimitMSv: 45,        // Tight expedition threshold
    careerRadiationLimitMSv: 500,       // Strict 500 mSv NASA STD-3001 career ceiling
    radiationDamageMultiplier: 1.35,
    strictCareerLimitEnforcement: true, // Non-compliance triggers flight doctor grounding

    enableMicrometeoroids: true,
    micrometeoroidProbability: 0.32,     // 32% probability on candidate sols
    enableThermalFatigueCurves: true,
    thermalFatigueMultiplier: 1.75,     // Coffin-Manson non-linear strain exponent

    enableAutomatedHints: false,
    automatedHintVerbosity: "none",
  },
};

/**
 * Calculates physics-based thermal fatigue wear according to the Coffin-Manson relation:
 * Delta epsilon_th = alpha * Delta T * (1 - eta_thermal_protection)
 * Damage per cycle D = (Delta epsilon_th / epsilon_f)^m
 */
export function calculateThermalFatigue(
  environmentId: string,
  _sol: number,
  allocatedShieldingMW: number,
  baselineShieldingMW: number,
  cumulativeFatigueWearSoFar: number
): ThermalFatigueReport {
  // Delta T (°C) across different planetary environments:
  // - Lunar South Pole: ~227°C swing (LRO Diviner, −173°C to +54°C)
  // - Mars Gale Crater: ~100°C diurnal swing (MSL REMS, −80°C to +20°C)
  // - Europa Under-Ice: ~160°C cryogenic shear gradient (−173°C crust to −13°C ocean boundary)
  // - Titan Hydrocarbon: ~200°C cryogenic thermal differential (−179°C surface, dense convective atmosphere)
  let solDeltaT = 100;
  if (environmentId === "lunar_south_pole") {
    solDeltaT = 227;
  } else if (environmentId === "europa_under_ice") {
    solDeltaT = 160;
  } else if (environmentId === "titan_hydrocarbon") {
    solDeltaT = 200;
  }

  // Active thermal loops and heat pipes depend on shielding/thermal power
  const protectionEfficiency = Math.min(
    1.0,
    Math.max(0.15, allocatedShieldingMW / baselineShieldingMW)
  );

  // Unprotected thermal delta
  const effectiveUnmitigatedDeltaT = solDeltaT * (1 - protectionEfficiency * 0.85);

  // Non-linear fatigue curve (normalized to nominal 50°C baseline)
  const normalizedDeltaT = effectiveUnmitigatedDeltaT / 80;
  const thermalStrainStress = Math.pow(normalizedDeltaT, 1.75);

  // Progressive hardware wear added this sol (0.01 to 0.12 scale)
  const fatigueWearAdded = Math.min(
    0.15,
    Math.round(thermalStrainStress * 0.024 * 1000) / 1000
  );

  const totalCumulativeFatigueWear =
    Math.round((cumulativeFatigueWearSoFar + fatigueWearAdded) * 1000) / 1000;

  let warningLevel: "nominal" | "elevated" | "critical" = "nominal";
  if (fatigueWearAdded > 0.06 || totalCumulativeFatigueWear > 0.25) {
    warningLevel = "critical";
  } else if (fatigueWearAdded > 0.03 || totalCumulativeFatigueWear > 0.12) {
    warningLevel = "elevated";
  }

  let technicalDiagnosis = "";
  if (environmentId === "lunar_south_pole") {
    technicalDiagnosis = `LRO Diviner ΔT: ${solDeltaT}°C. Thermal loop efficiency: ${Math.round(
      protectionEfficiency * 100
    )}%. Thermal cycling induced +${(fatigueWearAdded * 100).toFixed(
      1
    )}% structural fatigue wear on composite bulkheads and radiator seals.`;
  } else if (environmentId === "europa_under_ice") {
    technicalDiagnosis = `Europa Clipper Cryo-Gradient ΔT: ${solDeltaT}°C (−173°C ice crust to −13°C ocean). Active heating efficiency: ${Math.round(
      protectionEfficiency * 100
    )}%. Cryogenic ice-expansion shear added +${(fatigueWearAdded * 100).toFixed(
      1
    )}% strain to titanium foundation pilings.`;
  } else if (environmentId === "titan_hydrocarbon") {
    technicalDiagnosis = `Dragonfly Atmosphere Convective ΔT: ${solDeltaT}°C (−179°C surface, 1.45 bar air). Thermal loop efficiency: ${Math.round(
      protectionEfficiency * 100
    )}%. Cryogenic methane convective cooling added +${(fatigueWearAdded * 100).toFixed(
      1
    )}% fatigue wear to outer habitat airlocks.`;
  } else {
    technicalDiagnosis = `MSL REMS Diurnal ΔT: ${solDeltaT}°C (−80°C to +20°C). Active heat rejection: ${Math.round(
      protectionEfficiency * 100
    )}%. CO₂ frost expansion strain added +${(fatigueWearAdded * 100).toFixed(
      1
    )}% fatigue wear to habitat seals.`;
  }

  return {
    solDeltaT,
    activeThermalCoolingMW: allocatedShieldingMW,
    thermalProtectionEfficiency: Math.round(protectionEfficiency * 100) / 100,
    thermalStrainStress: Math.round(thermalStrainStress * 100) / 100,
    fatigueWearAdded,
    totalCumulativeFatigueWear,
    warningLevel,
    technicalDiagnosis,
  };
}

/**
 * Evaluates random micro-meteoroid punctures in Flight Director mode.
 * Deterministic pseudo-randomness based on environment + sol + turn state for testability.
 */
export function rollMicrometeoroidStrike(
  environmentId: string,
  sol: number,
  cumulativeTurnScore: number
): MicrometeoroidStrike | null {
  // Sols 3, 5, 7, and 8 are high-probability orbital crossing windows
  const candidateSols = [3, 5, 7, 8];
  if (!candidateSols.includes(sol)) return null;

  // Pseudo-random hash
  const pseudoSeed = (sol * 37 + environmentId.length * 13 + Math.floor(cumulativeTurnScore * 7)) % 100;
  // 35% probability on candidate sols
  if (pseudoSeed > 35) return null;

  const strikeProfiles: Array<{
    subsystemHit: SubsystemId;
    severity: "minor" | "moderate" | "severe";
    headline: string;
    details: string;
    powerLoss: number;
    wearDelta: number;
    o2Leak: number;
    pressureDrop: number;
    mitigation: string;
  }> = [
    {
      subsystemHit: "lifeSupport",
      severity: "moderate",
      headline: "MMOD Hypervelocity Puncture: ECLSS High-Pressure Line",
      details:
        "NASA Whipple bumper sensor detected a 1.2 mm micro-meteoroid impact at 54,000 km/h. Hab Module 2 outer seal punctured; active O₂ buffer venting at 8% per sol.",
      powerLoss: 0,
      wearDelta: 0.12,
      o2Leak: 12,
      pressureDrop: 4.8,
      mitigation:
        "Boost Life Support power by at least +6 MW to pressurize automated sealant bladders and arrest the leak.",
    },
    {
      subsystemHit: "powerGrid",
      severity: "severe",
      headline:
        environmentId === "europa_under_ice"
          ? "Cryo-Geothermal Wellhead Valve Seal Rupture"
          : environmentId === "titan_hydrocarbon"
          ? "Cryo-Lake Turbine Intake Manifold Slagging"
          : "MMOD Impact: Photovoltaic Array B Sub-string Perforation",
      details:
        environmentId === "europa_under_ice"
          ? "Superheated hydrothermal brine pressure burst a primary steam bypass valve. 14 MW generation knocked offline until secondary loop sync."
          : environmentId === "titan_hydrocarbon"
          ? "Cryogenic methane slush clogged the shoreline lake heat exchanger. 14 MW generation knocked offline until thermal purge cycle."
          : "Micrometeorite fragment perforated Solar Array Wing 2 bypass diodes. Power bus voltage fluctuated; 14 MW generation knocked offline until EVA shunt rerouting.",
      powerLoss: 14,
      wearDelta: 0.15,
      o2Leak: 0,
      pressureDrop: 0,
      mitigation:
        "Rely on battery reserves and RTG baseload while routing power conservatively to avoid grid brownout.",
    },
    {
      subsystemHit: "radiationShielding",
      severity: "moderate",
      headline: "MMOD Strike: Active Radiator Loop Micro-Fracture",
      details:
        "Hypervelocity particle pierced secondary external coolant radiator manifold. Fluid pressure drop reduces active thermal rejection capacity and exposes crew to thermal stress.",
      powerLoss: 5,
      wearDelta: 0.16,
      o2Leak: 0,
      pressureDrop: 7.2,
      mitigation:
        "Reallocate power to Radiation & Thermal Shielding to activate the isolated backup heat-pipe loop.",
    },
  ];

  const profileIndex = (sol + pseudoSeed) % strikeProfiles.length;
  const selected = strikeProfiles[profileIndex];

  return {
    id: `mmod_strike_sol_${sol}`,
    sol,
    subsystemHit: selected.subsystemHit,
    impactVelocityKmh: 42000 + (pseudoSeed * 300),
    particleDiameterMm: 0.8 + (pseudoSeed % 15) * 0.1,
    pressureDropKPa: selected.pressureDrop,
    powerLossMW: selected.powerLoss,
    wearDelta: selected.wearDelta,
    o2LeakPercent: selected.o2Leak,
    structuralBreachSeverity: selected.severity,
    telemetryHeadline: selected.headline,
    technicalDetails: selected.details,
    mitigationProtocol: selected.mitigation,
    repaired: false,
  };
}

/**
 * Generates gentle, encouraging automated hints for Cadet mode (Ages 7–10).
 */
export function generateCadetAutomatedHints(
  subsystems: Record<SubsystemId, { health: number; label: string }>,
  crew: { oxygenBufferPercent: number; foodReserveDays: number; radiationExposureMSv: number; morale: number },
  allocation: PowerAllocation,
  effectiveBudgetMW: number,
  sol: number
): AutomatedHint[] {
  const hints: AutomatedHint[] = [];

  // 1. Life support critical check (health or oxygen buffer or power)
  if (
    subsystems.lifeSupport.health < 70 ||
    crew.oxygenBufferPercent < 70 ||
    allocation.lifeSupport < 26
  ) {
    const deficit = Math.max(0, 28 - allocation.lifeSupport);
    const isHardwareDamaged = subsystems.lifeSupport.health < 70;
    hints.push({
      id: "hint_cadet_ls_o2",
      category: "life_support",
      title: isHardwareDamaged ? "Life Support Needs Care! 🛠️" : "Fresh Air Alert! 🌬️",
      message: `The crew's oxygen buffer is at ${crew.oxygenBufferPercent.toFixed(
        0
      )}% (Life Support Health: ${subsystems.lifeSupport.health.toFixed(
        0
      )}%). Life Support needs at least 28 MW to keep fresh oxygen flowing!`,
      kidFriendlyMessage: isHardwareDamaged
        ? "Your Life Support scrubbers are feeling a bit tired! Slide +5 MW more power into Life Support so your crew can breathe clean, fresh air."
        : "Hey Commander! Your astronauts are breathing through their backup air tanks. Slide a little more power (+5 MW) into Life Support so everyone breathes easy!",
      actionRecommendation: `Add ${Math.max(5, deficit)} MW to Life Support`,
      suggestedAllocation: {
        lifeSupport: Math.min(effectiveBudgetMW, Math.max(28, allocation.lifeSupport + 5)),
      },
      severity: crew.oxygenBufferPercent < 45 || subsystems.lifeSupport.health < 50 ? "urgent" : "warning",
    });
  }

  // 2. Food / Hydroponics check
  if (crew.foodReserveDays < 8) {
    hints.push({
      id: "hint_cadet_food",
      category: "life_support",
      title: "Hydroponics Garden Needs Sunshine! 🥗",
      message: `Only ${crew.foodReserveDays.toFixed(1)} days of food remaining! Hydroponic greenhouse crops need sustained power.`,
      kidFriendlyMessage:
        "The space plants in your greenhouse are getting hungry! Give Life Support some extra energy to grow yummy fresh space veggies.",
      actionRecommendation: "Keep Life Support above 30 MW to boost crop growth",
      severity: "warning",
    });
  }

  // 3. Radiation shield check
  if (allocation.radiationShielding < 22) {
    hints.push({
      id: "hint_cadet_shield",
      category: "radiation",
      title: "Force Field Shield is Low! 🛡️",
      message: "Radiation Shielding is below the 24 MW safe threshold. Invisible space rays are reaching the habitat.",
      kidFriendlyMessage:
        "Your invisible superhero force field is getting thin! Slide more power to Radiation Shielding so the crew doesn't get space sunburn.",
      actionRecommendation: "Increase Radiation Shielding to 24 MW or higher",
      suggestedAllocation: {
        radiationShielding: Math.min(effectiveBudgetMW, 24),
      },
      severity: "warning",
    });
  }

  // 4. Over-budget helper
  const totalUsed = allocation.powerGrid + allocation.lifeSupport + allocation.radiationShielding;
  if (totalUsed > effectiveBudgetMW) {
    const overage = totalUsed - effectiveBudgetMW;
    hints.push({
      id: "hint_cadet_overbudget",
      category: "power",
      title: "Power Overload! ⚡",
      message: `You allocated ${totalUsed} MW, but only ${effectiveBudgetMW} MW is generated this sol.`,
      kidFriendlyMessage:
        `Oops! You asked for ${overage} MW more power than your solar panels make! Tap the minus (−5 MW) button on battery reserves or shields to balance it.`,
      actionRecommendation: `Reduce power by ${overage} MW to prevent brownouts`,
      severity: "urgent",
    });
  }

  // If everything is great, give an encouraging Cadet thumbs up
  if (hints.length === 0) {
    hints.push({
      id: "hint_cadet_all_good",
      category: "general",
      title: "Super Job, Cadet! ⭐",
      message: `Sol ${sol} systems are balanced within safe operational tolerances.`,
      kidFriendlyMessage:
        "Awesome job! All your sliders look fantastic! Air is clean, shields are holding, and the crew has high spirits. Ready to advance Sol!",
      actionRecommendation: "Ready to advance to the next Sol!",
      severity: "info",
    });
  }

  return hints;
}
