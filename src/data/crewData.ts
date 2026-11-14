// ============================================================
// crewData.ts — Outpost Commander Crew Specialization & Morale System
// 4 Distinct Crew Roles:
// 1. Astrobotanist (Dr. Mei Lin / "Sprout")
// 2. Power Engineer (Commander Marcus Vance / "Volt")
// 3. Flight Medical Officer (Dr. Sarah Chen / "Doc")
// 4. Planetary Geologist & Lead EVA (Dr. Alex Rivera / "Bedrock")
//
// Grounded in NASA-STD-3001, Artemis Base Camp Crew Architecture,
// and Johnson Space Center Behavioral Health & Performance (BHP).
// ============================================================

export type CrewRoleId = "botanist" | "power_engineer" | "medical_officer" | "geologist";

export type CrewMemberStatus =
  | "nominal"
  | "fatigued"
  | "injured"
  | "irradiated"
  | "heroic"
  | "on_eva";

export interface CrewSkillStats {
  evaRating: number;      // 1 to 5 stars
  engineering: number;    // 1 to 5 stars
  lifeSupport: number;    // 1 to 5 stars
  medical: number;        // 1 to 5 stars
}

export interface CrewMember {
  id: string;
  name: string;
  callsign: string;
  role: CrewRoleId;
  roleTitle: string;
  avatar: string;
  badgeIcon: string;
  color: string;
  health: number; // 0 to 100
  morale: number; // 0 to 100
  radiationDoseMSv: number; // individual expedition dose
  careerRadiationMSv: number; // towards 500 mSv NASA limit
  status: CrewMemberStatus;
  statusDescription: string;
  specialtyPerk: string;
  perkSummary: string;
  bio: string;
  emergencySpecialty: string;
  stats: CrewSkillStats;
  currentAssignment?: string;
  recentEvent?: string;
  repairsConducted: number;
}

export interface CrewMoraleEvent {
  id: string;
  sol: number;
  crewMemberId: string;
  crewMemberName: string;
  crewRole: CrewRoleId;
  roleIcon: string;
  title: string;
  narrative: string;
  moraleDelta: number;
  healthDelta?: number;
  radiationDeltaMSv?: number;
  type: "heroic" | "positive" | "warning" | "critical" | "sacrifice";
  subsystemHelped?: string;
}

export interface SpecialistRepairEffects {
  // Individual specialist impact
  healthDelta?: number;
  moraleDelta?: number;
  radiationDeltaMSv?: number;
  newStatus?: CrewMemberStatus;
  statusDescription?: string;

  // Outpost & team impact
  teamMoraleDelta?: number;
  powerDeltaMW?: number;
  powerGridHealthDelta?: number;
  lifeSupportHealthDelta?: number;
  shieldingHealthDelta?: number;
  oxygenBufferDelta?: number;
  foodDaysDelta?: number;
  permanentWaterO2Bonus?: number;
}

export interface SpecialistRepairOption {
  crewRole: CrewRoleId;
  actionTitle: string;
  actionPrompt: string; // The explicit risk-vs-reward choice
  tacticalSummary: string;
  riskDescription: string;
  rewardDescription: string;
  isHighRiskWarning?: boolean;
  effects: SpecialistRepairEffects;
  moraleEvent: {
    title: string;
    narrative: string;
    type: "heroic" | "positive" | "warning" | "critical" | "sacrifice";
  };
  engineeringTakeaway: string;
}

// ---------------------------------------------------------------------------
// 4 DISTINCT NASA CREW MEMBERS
// ---------------------------------------------------------------------------

export function createInitialCrewMembers(difficulty: string = "commander"): CrewMember[] {
  const isCadet = difficulty === "cadet";
  const isHardcore = difficulty === "flight_director";

  const startingMorale = isCadet ? 95 : isHardcore ? 75 : 85;
  const startingHealth = isCadet ? 100 : isHardcore ? 90 : 95;
  const startingCareerRad = isHardcore ? 180 : 50;

  return [
    {
      id: "crew_botanist",
      name: "Dr. Mei Lin",
      callsign: "Sprout",
      role: "botanist",
      roleTitle: "Lead Astrobotanist & Closed-Loop ECLSS Specialist",
      avatar: "🌱",
      badgeIcon: "Leaf",
      color: "#10b981", // Emerald
      health: startingHealth,
      morale: startingMorale,
      radiationDoseMSv: 0,
      careerRadiationMSv: startingCareerRad + 12,
      status: "nominal",
      statusDescription: "Monitoring aeroponic root misting & biomass chambers.",
      specialtyPerk: "Green Thumb: +20% crop yield & +15% closed-loop O₂ scrub headroom.",
      perkSummary: "+20% Crop Yield · +15% O₂ Headroom",
      bio: "PhD in Astrobotany. Former lead scientist for NASA's Veggie and Advanced Plant Habitat on the ISS. Dedicated to creating self-sustaining Martian greenhouses.",
      emergencySpecialty: "Rapid crop salvage, bio-scrubber decontamination, volatile algae culture preservation.",
      stats: { evaRating: 2, engineering: 3, lifeSupport: 5, medical: 3 },
      currentAssignment: "Hydroponics Biomass Lab",
      repairsConducted: 0,
    },
    {
      id: "crew_power_engineer",
      name: "Cdr. Marcus Vance",
      callsign: "Volt",
      role: "power_engineer",
      roleTitle: "Chief Electrical & Kilopower Systems Engineer",
      avatar: "⚡",
      badgeIcon: "Zap",
      color: "#f59e0b", // Amber
      health: startingHealth,
      morale: startingMorale,
      radiationDoseMSv: 0,
      careerRadiationMSv: startingCareerRad + 35,
      status: "nominal",
      statusDescription: "Balancing Stirling convertors & battery vault thermals.",
      specialtyPerk: "Grid Master: Cuts overload wear by 40% and provides emergency power bus routing.",
      perkSummary: "-40% Overload Wear · Emergency +6 MW Reroute",
      bio: "MS Aerospace Electrical (MIT). Veteran of Navy nuclear reactors and Artemis surface power distribution. Treats high-voltage megawatt switches like second nature.",
      emergencySpecialty: "High-voltage conduit bypass, battery thermal loop rescue, generator surge arrest.",
      stats: { evaRating: 3, engineering: 5, lifeSupport: 2, medical: 2 },
      currentAssignment: "Kilopower & Battery Vault",
      repairsConducted: 0,
    },
    {
      id: "crew_medical_officer",
      name: "Dr. Sarah Chen",
      callsign: "Doc",
      role: "medical_officer",
      roleTitle: "Flight Surgeon & Bio-Dosimetry Officer",
      avatar: "🩺",
      badgeIcon: "HeartPulse",
      color: "#ec4899", // Rose
      health: startingHealth,
      morale: startingMorale,
      radiationDoseMSv: 0,
      careerRadiationMSv: startingCareerRad,
      status: "nominal",
      statusDescription: "Tracking crew biodosimetry and circadian psychological health.",
      specialtyPerk: "Guardian Angel: Reduces crew morale decay by 35% and administers radio-protective therapy.",
      perkSummary: "-35% Morale Decay · Radioprotective Countermeasures",
      bio: "MD in Aerospace Medicine (UTMB Galveston). Specializes in space radiation biology, acute cosmic ray prophylaxis, and team dynamics under high-isolation stress.",
      emergencySpecialty: "Acute trauma triage, antioxidant radioprotection, hyperbaric O₂ protocol, crew psych stabilization.",
      stats: { evaRating: 2, engineering: 2, lifeSupport: 4, medical: 5 },
      currentAssignment: "Medical Bay & Bio-Dosimetry",
      repairsConducted: 0,
    },
    {
      id: "crew_geologist",
      name: "Dr. Alex Rivera",
      callsign: "Bedrock",
      role: "geologist",
      roleTitle: "Planetary Geologist & Chief EVA Specialist",
      avatar: "🪨",
      badgeIcon: "Hammer",
      color: "#38bdf8", // Sky Cyan
      health: startingHealth,
      morale: startingMorale,
      radiationDoseMSv: 0,
      careerRadiationMSv: startingCareerRad + 25,
      status: "nominal",
      statusDescription: "Prepping surface exploration tools & Whipple armor patch kits.",
      specialtyPerk: "EVA Veteran: Heavy exploration suit offers superior surface endurance and 95% exterior repair success.",
      perkSummary: "95% Exterior EVA Success · Heavy Suit Radiation Shield",
      bio: "PhD in Planetary Geology (Caltech). 240+ neutral buoyancy spacewalk hours. Expert in regolith microwave sintering, volatile ice drilling, and micrometeoroid Whipple patching.",
      emergencySpecialty: "Exterior hull welding, regolith radiation berming, cryogenic permafrost core recovery.",
      stats: { evaRating: 5, engineering: 4, lifeSupport: 2, medical: 2 },
      currentAssignment: "EVA Airlock & Tool Staging",
      repairsConducted: 0,
    },
  ];
}

// ---------------------------------------------------------------------------
// 10 NASA INCIDENT EMERGENCY REPAIR MATRICES
// Tailored risk-vs-reward options for all 4 crew specialists
// ---------------------------------------------------------------------------

export const INCIDENT_SPECIALIST_REPAIRS: Record<string, Record<CrewRoleId, SpecialistRepairOption>> = {
  // =========================================================================
  // 1. LUNAR: Micrometeorite Thermal Blanket Puncture (Sol 2)
  // =========================================================================
  lunar_micrometeorite_puncture: {
    botanist: {
      crewRole: "botanist",
      actionTitle: "Rapid Emergency Seal on Module B Hydroponics",
      actionPrompt: "Send Botanist to seal the inner hydroponics airlock before thermal drop wilts the seedlings?",
      tacticalSummary: "Mei secures the inner bio-dome seal, preserving green crops at the cost of intense personal stress.",
      riskDescription: "Botanist suffers -18 Morale from high-stress bio-emergency.",
      rewardDescription: "+10 Food Reserve Days, +8% O₂ Buffer saved from freezing vacuum.",
      effects: {
        moraleDelta: -18,
        teamMoraleDelta: 4,
        foodDaysDelta: 10,
        oxygenBufferDelta: 8,
        lifeSupportHealthDelta: 8,
        statusDescription: "Exhausted after hand-cranking Module B hermetic seal.",
      },
      moraleEvent: {
        title: "Seedlings Saved from Cold Vacuum",
        narrative: "Dr. Mei Lin rushed into the depressurizing vestibule to dog down the hydroponic bulkhead. Her quick thinking saved two weeks of precious food crops!",
        type: "positive",
      },
      engineeringTakeaway: "Targeted compartment isolation preserved sensitive bio-assets without spending external EVA time.",
    },
    power_engineer: {
      crewRole: "power_engineer",
      actionTitle: "Thermal Grid Shunt & Resistance Heating Overclock",
      actionPrompt: "Order Power Engineer to reroute high-voltage heater conduits around the puncture zone?",
      tacticalSummary: "Marcus manually patches thermal loops; risks electrical arc burns to halt habitat freeze.",
      riskDescription: "Power Engineer takes -12 Health from flash burns, -10 Morale.",
      rewardDescription: "+15% Power Grid Health, prevents habitat cold-soak, 0 external EVA exposure.",
      effects: {
        healthDelta: -12,
        moraleDelta: -10,
        powerGridHealthDelta: 15,
        powerDeltaMW: 5,
        statusDescription: "Suffered mild thermal conduit burns during emergency rewire.",
      },
      moraleEvent: {
        title: "Thermal Loop Stabilized Under High Voltage",
        narrative: "Commander Vance braved hot electrical sparks to bypass the ruptured heating circuit, keeping the outpost warm through the lunar night.",
        type: "heroic",
      },
      engineeringTakeaway: "Internal electrical rerouting can substitute for physical hull insulation in extreme emergencies.",
    },
    medical_officer: {
      crewRole: "medical_officer",
      actionTitle: "Hypothermia Prevention & Crew Atmospheric Stabilization",
      actionPrompt: "Direct Medical Officer to administer rapid thermal countermeasures and psych triage?",
      tacticalSummary: "Sarah stabilizes crew vitals and monitors oxygen partial pressure across living quarters.",
      riskDescription: "-8 Medical Supplies headroom, -8 Sarah Morale.",
      rewardDescription: "+12 Team Morale, +10% O₂ Buffer efficiency, zero physical injury.",
      effects: {
        moraleDelta: -8,
        teamMoraleDelta: 12,
        oxygenBufferDelta: 10,
        statusDescription: "Administered thermal shock therapy across the crew.",
      },
      moraleEvent: {
        title: "Medical Team Maintains Mission Composure",
        narrative: "Dr. Sarah Chen immediately distributed thermal insulation suits and oxygen regulators, calming crew panic during the hull puncture alarm.",
        type: "positive",
      },
      engineeringTakeaway: "Human factors triage prevents secondary panic errors during structural decompression alarms.",
    },
    geologist: {
      crewRole: "geologist",
      actionTitle: "Lead Emergency Exterior EVA Whipple Patch",
      actionPrompt: "Send Geologist on an immediate 4-hour exterior EVA to apply vacuum weld and Kevlar Whipple tape?",
      tacticalSummary: "Alex suits up in the xEMU and climbs onto the freezing crater rim to weld the breach.",
      riskDescription: "+0.6 mSv Radiation Dose, -15 Morale from sub-zero vacuum fatigue.",
      rewardDescription: "+20% Shielding Integrity, 100% hull hermetic seal restored permanently.",
      effects: {
        moraleDelta: -15,
        radiationDeltaMSv: 0.6,
        shieldingHealthDelta: 20,
        newStatus: "fatigued",
        statusDescription: "Recovering from demanding 4-hour vacuum hull welding EVA.",
      },
      moraleEvent: {
        title: "Flawless Vacuum Hull Welding",
        narrative: "Dr. Alex Rivera executed a textbook EVA weld on the punctured MLI blanket in −170°C shadow. The habitat seal was fully restored!",
        type: "heroic",
      },
      engineeringTakeaway: "Expert EVA crew equipped with Whipple patch kits deliver the most durable structural recovery.",
    },
  },

  // =========================================================================
  // 2. LUNAR: Shackleton Shadowed Crater Ice Drill Surge (Sol 4)
  // =========================================================================
  lunar_ice_drill_surge: {
    botanist: {
      crewRole: "botanist",
      actionTitle: "Direct Cryo-Meltwater Injection to Bioreactors",
      actionPrompt: "Assign Botanist to directly route sub-surface cryogenic meltwater into the hydroponic bio-filters?",
      tacticalSummary: "Mei captures the virgin volatile ice directly into algae culture beds, supercharging food reserves.",
      riskDescription: "-10 Botanist Morale from 16-hour continuous filter calibration.",
      rewardDescription: "+8 Food Reserve Days, +12% O₂ Buffer, PERMANENT +10% water recycling bonus.",
      effects: {
        moraleDelta: -10,
        foodDaysDelta: 8,
        oxygenBufferDelta: 12,
        permanentWaterO2Bonus: 10,
        statusDescription: "Calibrating newly injected meltwater into the aeroponic loop.",
      },
      moraleEvent: {
        title: "Hydroponics Flooded with Lunar Ice Water",
        narrative: "Dr. Mei Lin successfully integrated pristine water ice harvested from Shackleton Crater directly into the hydroponics system!",
        type: "positive",
      },
      engineeringTakeaway: "Coupling In-Situ Resource Utilization (ISRU) water harvesting directly to life support closes the consumable cycle.",
    },
    power_engineer: {
      crewRole: "power_engineer",
      actionTitle: "Harmonic Synchronizer on TRIDENT Drill Motors",
      actionPrompt: "Task Power Engineer with tuning drill motor harmonics to eliminate the 25 MW grid surge?",
      tacticalSummary: "Marcus overrides drill motor speed controls, smoothing the massive power draw into a gentle trickle.",
      riskDescription: "-12 Power Engineer Morale, takes minor component wear.",
      rewardDescription: "Eliminates -20 MW power penalty, +12% Power Grid Health.",
      effects: {
        moraleDelta: -12,
        powerGridHealthDelta: 12,
        powerDeltaMW: 12,
        statusDescription: "Tuned TRIDENT drill harmonic controllers to nominal frequency.",
      },
      moraleEvent: {
        title: "Drill Surge Tamed by Electrical Engineering",
        narrative: "Commander Vance re-engineered the drill's motor variable frequency drive, eliminating the grid brownout risk completely.",
        type: "heroic",
      },
      engineeringTakeaway: "Smart electrical phase-modulation eliminates the need for brute-force power spikes during heavy drilling.",
    },
    medical_officer: {
      crewRole: "medical_officer",
      actionTitle: "Volatile Plume Toxicity & Water Purity Screening",
      actionPrompt: "Have Medical Officer run gas chromatography to verify lunar ice is free of toxic mercury and cyanide?",
      tacticalSummary: "Sarah conducts comprehensive toxicology screening on harvested cryogenic ice samples.",
      riskDescription: "-10 Medical Officer Morale from meticulous lab assays.",
      rewardDescription: "+15 Team Morale (crew trusts water supply), +5% Life Support Health.",
      effects: {
        moraleDelta: -10,
        teamMoraleDelta: 15,
        lifeSupportHealthDelta: 5,
        statusDescription: "Completed toxicology certification for Shackleton ice harvest.",
      },
      moraleEvent: {
        title: "Lunar Water Certified 100% Potable",
        narrative: "Dr. Sarah Chen's assay confirmed the ice melt was completely pure of heavy metals, giving the crew enormous psychological confidence.",
        type: "positive",
      },
      engineeringTakeaway: "Water purity verification is a critical physiological and psychological requirement before ISRU consumption.",
    },
    geologist: {
      crewRole: "geologist",
      actionTitle: "Optimize Deep Permafrost Coring Angle",
      actionPrompt: "Deploy Geologist to manually steer the TRIDENT drill into the richest cryogenic volatile vein?",
      tacticalSummary: "Alex operates seismic sensors to drill straight into the motherlode of Cabeus-type volatile ice.",
      riskDescription: "-15 Geologist Morale, heavy vibrational strain.",
      rewardDescription: "PERMANENT +20% Water/O₂ Buffer, +15% Life Support Health.",
      effects: {
        moraleDelta: -15,
        lifeSupportHealthDelta: 15,
        permanentWaterO2Bonus: 20,
        oxygenBufferDelta: 15,
        foodDaysDelta: 5,
        statusDescription: "Extracted premier cryogenic volatile ice core from Shackleton.",
      },
      moraleEvent: {
        title: "Pure Permafrost Ice Core Struck",
        narrative: "Dr. Alex Rivera pinpointed a rich volatile pocket 1.5 meters beneath Shackleton regolith, multiplying base water yield by 20%!",
        type: "heroic",
      },
      engineeringTakeaway: "Geological expertise dramatically elevates ISRU yield compared to blind automated drilling.",
    },
  },

  // =========================================================================
  // 3. LUNAR: Coronal Mass Ejection Solar Particle Event (Sol 6) — HIGH SOLAR FLUX
  // The iconic user example: "Send Botanist on an EVA during high solar flux to salvage crops?"
  // =========================================================================
  lunar_solar_storm_spe: {
    botanist: {
      crewRole: "botanist",
      actionTitle: "Emergency EVA Crop Salvage During Solar Particle Flux",
      actionPrompt: "Send Botanist on an EVA during high solar flux to salvage crops?",
      tacticalSummary: "Mei rushes out into ionizing solar flux to haul exterior hydroponic pods into the shielded storm cellar.",
      riskDescription: "HIGH SOLAR FLUX HAZARD: Botanist absorbs +2.8 mSv Radiation Dose, -25 Morale, and enters 'irradiated' status!",
      rewardDescription: "100% Crop Salvage (+18 Food Days), +18% O₂ Buffer, +15% Life Support Health!",
      isHighRiskWarning: true,
      effects: {
        moraleDelta: -25,
        radiationDeltaMSv: 2.8,
        teamMoraleDelta: -8,
        foodDaysDelta: 18,
        oxygenBufferDelta: 18,
        lifeSupportHealthDelta: 15,
        newStatus: "irradiated",
        statusDescription: "Acute radiation exposure while heroically hauling crop pods.",
      },
      moraleEvent: {
        title: "Heroic Spacewalk Under Blistering Solar Flux",
        narrative: "Dr. Mei Lin dashed through a gale of relativistic solar protons to drag the vulnerable aeroponic modules into the bunker. Her dosimeter screamed, but the outpost food reserves were saved from total destruction!",
        type: "sacrifice",
      },
      engineeringTakeaway: "High-risk EVA during solar flux represents the ultimate commander trade-off: risking human biology to secure biological survival food.",
    },
    power_engineer: {
      crewRole: "power_engineer",
      actionTitle: "Overclock Magnetic Deflection Coil Shunts",
      actionPrompt: "Command Power Engineer to bypass transformer breakers and pump 30 MW into the magnetic shield coils?",
      tacticalSummary: "Marcus pushes the magnetic deflection harness past thermal limits to create an active magnetosphere.",
      riskDescription: "-15 Health from intense electromagnetic arcing, -15 Morale.",
      rewardDescription: "+25% Shield Integrity, shields all crew members from the brunt of the storm.",
      effects: {
        healthDelta: -15,
        moraleDelta: -15,
        shieldingHealthDelta: 25,
        powerGridHealthDelta: -5,
        teamMoraleDelta: 8,
        statusDescription: "Recovering from electrical flash while overclocking shield coils.",
      },
      moraleEvent: {
        title: "Magnetic Force Field Overclocked",
        narrative: "Commander Vance shunted raw RTG power directly into the superconducting magnetic deflector, generating a visible purple aurora that deflected the proton wave!",
        type: "heroic",
      },
      engineeringTakeaway: "Active magnetic shielding requires massive power surges but drastically reduces crew ionizing particle exposure.",
    },
    medical_officer: {
      crewRole: "medical_officer",
      actionTitle: "Administer Radioprotective Antioxidant Cocktail",
      actionPrompt: "Order Medical Officer to administer full-dose radioprotective countermeasures to the entire team?",
      tacticalSummary: "Sarah administers amifostine and antioxidant cocktails, preparing the crew's cellular DNA for ionizing flux.",
      riskDescription: "-15 Medical Officer Morale, mild pharmacological nausea.",
      rewardDescription: "Cuts ALL crew radiation absorption by 40%, +15 Team Morale.",
      effects: {
        moraleDelta: -15,
        teamMoraleDelta: 15,
        shieldingHealthDelta: 8,
        statusDescription: "Administering IV radioprotective therapy in storm shelter.",
      },
      moraleEvent: {
        title: "Cellular Radioprotection Protocol Active",
        narrative: "Dr. Sarah Chen dosed all astronauts with cutting-edge radioprotectant therapies before the peak solar flux arrived, preventing acute cell damage.",
        type: "positive",
      },
      engineeringTakeaway: "Pharmacological countermeasures complement physical shielding by scavenging free radicals inside living tissues.",
    },
    geologist: {
      crewRole: "geologist",
      actionTitle: "Stack Microwave-Sintered Regolith Shielding Berm",
      actionPrompt: "Send Geologist in heavy xEMU suit to bulldoze sintered lunar regolith over the habitat roof?",
      tacticalSummary: "Alex uses the surface rover shovel to pile dense lunar soil over the module before the storm peaks.",
      riskDescription: "+1.2 mSv Radiation Dose, -20 Morale from brutal physical earth-moving.",
      rewardDescription: "+28% Radiation Shielding Health, permanent habitat mass barrier.",
      effects: {
        moraleDelta: -20,
        radiationDeltaMSv: 1.2,
        shieldingHealthDelta: 28,
        teamMoraleDelta: 6,
        newStatus: "fatigued",
        statusDescription: "Exhausted after bulldozing 8 tons of regolith over habitat.",
      },
      moraleEvent: {
        title: "Regolith Shielding Wall Erected in the Nick of Time",
        narrative: "Dr. Alex Rivera worked the rover scoop under rising proton radiation, burying the living quarters under a half-meter of dense lunar regolith!",
        type: "heroic",
      },
      engineeringTakeaway: "Bulk in-situ regolith mass is the most effective passive radiation barrier against high-energy solar particle events.",
    },
  },

  // =========================================================================
  // 4. LUNAR: Diviner Thermal Anomaly & Ammonia Freeze (Sol 7)
  // =========================================================================
  lunar_radiator_frost_lock: {
    botanist: {
      crewRole: "botanist",
      actionTitle: "Route Warm Hydroponic Waste Heat to Radiator Loop",
      actionPrompt: "Direct Botanist to tap heated runoff water from the greenhouse to thaw the frozen ammonia line?",
      tacticalSummary: "Mei redirects lukewarm plant growth water into the external heat exchanger.",
      riskDescription: "-10 Botanist Morale, -2 Food Reserve Days diverted.",
      rewardDescription: "+15% Life Support Health, thaws ammonia without electric heater draw.",
      effects: {
        moraleDelta: -10,
        foodDaysDelta: -2,
        lifeSupportHealthDelta: 15,
        shieldingHealthDelta: 10,
        statusDescription: "Managing cross-system thermal plumbing from hydroponics.",
      },
      moraleEvent: {
        title: "Greenhouse Thermal Plume Thaws Ammonia Line",
        narrative: "Dr. Mei Lin cleverly rerouted excess warm water from the hydroponic bio-filters into the frozen radiator conduit, melting the ice dam!",
        type: "positive",
      },
      engineeringTakeaway: "Cross-system waste heat recovery solves thermal freezing without consuming precious kilowatt-hours.",
    },
    power_engineer: {
      crewRole: "power_engineer",
      actionTitle: "Inductive Pulse Thaw on Primary Radiator Loop",
      actionPrompt: "Task Power Engineer with firing high-frequency inductive pulses through the ammonia pipes?",
      tacticalSummary: "Marcus uses electromagnetic induction to melt the frozen blockage from inside the pipe walls.",
      riskDescription: "-12 Power Engineer Morale, risks blowing thermal fuses.",
      rewardDescription: "+15% Power Grid Health, 0 external EVA required, restores full loop flow.",
      effects: {
        moraleDelta: -12,
        powerGridHealthDelta: 15,
        shieldingHealthDelta: 12,
        powerDeltaMW: 4,
        statusDescription: "Cleared pipe obstruction via controlled inductive pulses.",
      },
      moraleEvent: {
        title: "Inductive Heat Pulse Clears Frozen Radiator",
        narrative: "Commander Vance used electromagnetic induction coils to warm the metal pipe directly, freeing the frozen ammonia without stepping outside.",
        type: "heroic",
      },
      engineeringTakeaway: "Inductive heating targets metal walls directly, liquefying cryo-plugs faster than external radiant heaters.",
    },
    medical_officer: {
      crewRole: "medical_officer",
      actionTitle: "Ammonia Vapor Monitor & Air Toxicity Lockdown",
      actionPrompt: "Have Medical Officer monitor habitat air scrubbers for deadly anhydrous ammonia leaks?",
      tacticalSummary: "Sarah seals crew sleep cabins and runs real-time gas spectrophotometry.",
      riskDescription: "-8 Sarah Morale from constant vigilance.",
      rewardDescription: "+10 Team Morale, +8% O₂ Buffer safety margin, zero toxicity incidents.",
      effects: {
        moraleDelta: -8,
        teamMoraleDelta: 10,
        oxygenBufferDelta: 8,
        statusDescription: "Certified habitat air supply free of toxic ammonia contamination.",
      },
      moraleEvent: {
        title: "Habitat Air Quality Safeguarded",
        narrative: "Dr. Sarah Chen's vigilant bio-monitoring ensured no toxic ammonia fumes permeated the crew quarters during the thermal crisis.",
        type: "positive",
      },
      engineeringTakeaway: "Toxic secondary leak monitoring during thermal fluid failures is vital for human survival.",
    },
    geologist: {
      crewRole: "geologist",
      actionTitle: "Direct Mechanical Thaw on Radiator Hinge Actuator",
      actionPrompt: "Send Geologist on an EVA to physically chisel cryogenic frost off the radiator positioning gears?",
      tacticalSummary: "Alex steps into the freezing lunar shadow to free the jammed mechanical hinge.",
      riskDescription: "+0.5 mSv Radiation Dose, -15 Morale from freezing -180°C shadow traverse.",
      rewardDescription: "+22% Shielding Health, radiator fully re-oriented towards open space.",
      effects: {
        moraleDelta: -15,
        radiationDeltaMSv: 0.5,
        shieldingHealthDelta: 22,
        statusDescription: "Freed cryogenic radiator hinge on crater shadow lip.",
      },
      moraleEvent: {
        title: "Cryogenic Frost Chiseled from Radiator Gimbal",
        narrative: "Dr. Alex Rivera braved −180°C temperatures to manually scrape ice crystals from the radiator swivel joint, allowing it to dissipate heat once more.",
        type: "heroic",
      },
      engineeringTakeaway: "When automated motors freeze in deep cryo-shadow, a skilled EVA astronaut is the only reliable mechanical remedy.",
    },
  },

  // =========================================================================
  // 5. LUNAR: Charged Regolith Electrostatic Solar Abrasion (Sol 8)
  // =========================================================================
  lunar_dust_electrostatic_abrasion: {
    botanist: {
      crewRole: "botanist",
      actionTitle: "Dust Airlock Decontamination Protocol",
      actionPrompt: "Deploy Botanist to operate electro-static airlock showers to prevent toxic dust entering the greenhouse?",
      tacticalSummary: "Mei enforces sterile containment so abrasive lunar glass dust doesn't poison the plants.",
      riskDescription: "-10 Botanist Morale from tedious decontamination scrubbing.",
      rewardDescription: "+12% Life Support Health, +6 Food Reserve Days safeguarded.",
      effects: {
        moraleDelta: -10,
        lifeSupportHealthDelta: 12,
        foodDaysDelta: 6,
        statusDescription: "Decontaminated all bio-chambers from abrasive lunar dust.",
      },
      moraleEvent: {
        title: "Greenhouse Protected from Abrasive Lunar Regolith",
        narrative: "Dr. Mei Lin maintained rigid quarantine procedures, ensuring sharp lunar glass shards did not contaminate the delicate aeroponic root zones.",
        type: "positive",
      },
      engineeringTakeaway: "Lunar dust particles are razor-sharp jagged glass shards; isolating them from bio-systems is mission-critical.",
    },
    power_engineer: {
      crewRole: "power_engineer",
      actionTitle: "Electrostatic Solar Wave Repulsion Activation",
      actionPrompt: "Direct Power Engineer to pulse an alternating high-voltage charge through the solar array grid?",
      tacticalSummary: "Marcus electrifies the solar panel surface with high frequency waves to blow dust levitating off.",
      riskDescription: "-12 Power Engineer Morale, burns 8 MW in pulse energy.",
      rewardDescription: "+20% Power Grid Health, recovers +12 MW solar efficiency.",
      effects: {
        moraleDelta: -12,
        powerGridHealthDelta: 20,
        powerDeltaMW: 12,
        statusDescription: "Activated electro-dynamic dust clearing grid on solar panels.",
      },
      moraleEvent: {
        title: "Dust Levitated and Swept Away Electrostatically",
        narrative: "Commander Vance pulsed the solar panel electro-dynamic shields, levitating the abrasive charged dust and restoring 100% solar capture!",
        type: "heroic",
      },
      engineeringTakeaway: "NASA EDS (Electrodynamic Dust Shield) technology uses pulsed electric fields to clear dust without mechanical wipers.",
    },
    medical_officer: {
      crewRole: "medical_officer",
      actionTitle: "Crew Respiratory Filter Check & Silicosis Prevention",
      actionPrompt: "Task Medical Officer with inspecting lung health and replacing micro-HEPA seals across suits?",
      tacticalSummary: "Sarah conducts pulmonary exams and changes airlock HEPA filters to stop toxic lunar hay-fever.",
      riskDescription: "-8 Sarah Morale from exhaustive suit examinations.",
      rewardDescription: "+14 Team Morale, +8% O₂ Buffer health, zero lung irritation.",
      effects: {
        moraleDelta: -8,
        teamMoraleDelta: 14,
        oxygenBufferDelta: 8,
        statusDescription: "Inspected crew lung health and replaced airlock filters.",
      },
      moraleEvent: {
        title: "Astronaut Respiratory Health Preserved",
        narrative: "Dr. Sarah Chen replaced worn HEPA filters, ensuring no crew member inhaled toxic nano-scale lunar regolith particles.",
        type: "positive",
      },
      engineeringTakeaway: "Lunar regolith causes acute space silicosis (Apollo toxic dust response); medical filtration vigilance is paramount.",
    },
    geologist: {
      crewRole: "geologist",
      actionTitle: "Surface Rover Mechanical Dust Brush Excursion",
      actionPrompt: "Send Geologist on a 3-hour rover excursion with carbon-fiber sweepers to scrub panel joints?",
      tacticalSummary: "Alex takes the rover to manually clear mechanical pivot joints on the primary solar tracking mast.",
      riskDescription: "+0.5 mSv Radiation Dose, -14 Morale from dusty EVA work.",
      rewardDescription: "+16% Power Grid Health, +10% Shielding Integrity.",
      effects: {
        moraleDelta: -14,
        radiationDeltaMSv: 0.5,
        powerGridHealthDelta: 16,
        shieldingHealthDelta: 10,
        statusDescription: "Cleaned abrasive dust from solar array gimbal joints.",
      },
      moraleEvent: {
        title: "Solar Gimbal Restored on Crater Ridge",
        narrative: "Dr. Alex Rivera cleared packed regolith from the solar panel tracking bearings, restoring full sun-tracking mobility.",
        type: "heroic",
      },
      engineeringTakeaway: "Manual mechanical intervention frees packed bearings that automated electrostatic pulses cannot reach.",
    },
  },

  // =========================================================================
  // 6. MARS: Global Planet-Encircling Dust Storm (Sol 2)
  // =========================================================================
  mars_global_dust_storm: {
    botanist: {
      crewRole: "botanist",
      actionTitle: "Overclock Hydroponic LED Spectrum for Crew Melatonin",
      actionPrompt: "Task Botanist with re-tuning grow-lights to simulate natural Earth sunlight during the dark storm?",
      tacticalSummary: "Mei adjusts the spectrum of 500 hydroponic grow-lamps to provide circadian psychological support.",
      riskDescription: "-10 Botanist Morale, draws 4 MW auxiliary light power.",
      rewardDescription: "+18 Team Morale (wards off storm depression), +8% Life Support.",
      effects: {
        moraleDelta: -10,
        teamMoraleDelta: 18,
        lifeSupportHealthDelta: 8,
        foodDaysDelta: 4,
        statusDescription: "Operating full-spectrum circadian grow lights in greenhouse.",
      },
      moraleEvent: {
        title: "Artificial Sunlight Brightens Martian Gloom",
        narrative: "Dr. Mei Lin configured the greenhouse grow-lights to emit natural 6500K daylight, completely transforming crew mood during the planet-wide black sky!",
        type: "positive",
      },
      engineeringTakeaway: "In extended Martian darkness, biological lighting prevents circadian rhythm collapse and deep psychological fatigue.",
    },
    power_engineer: {
      crewRole: "power_engineer",
      actionTitle: "Kilopower Nuclear Reactor High-Output Surge",
      actionPrompt: "Order Power Engineer to spin up the backup Stirling nuclear reactor to 120% continuous output?",
      tacticalSummary: "Marcus overrides automated reactor safeties, replacing lost solar megawatts with nuclear fission.",
      riskDescription: "-15 Power Engineer Morale, -8% Reactor core wear.",
      rewardDescription: "+22 MW Power Budget, +15% Power Grid Health, immune to solar drop.",
      effects: {
        moraleDelta: -15,
        powerGridHealthDelta: 15,
        powerDeltaMW: 22,
        statusDescription: "Overclocked Kilopower reactor Stirling convertor banks.",
      },
      moraleEvent: {
        title: "Kilopower Reactor Roars to Life",
        narrative: "Commander Vance ramped up the Kilopower reactor core, delivering steady megawatts through the storm while solar generation plummeted.",
        type: "heroic",
      },
      engineeringTakeaway: "Fission surface power (NASA Kilopower) is the ultimate baseload hedge against planet-encircling Martian dust storms.",
    },
    medical_officer: {
      crewRole: "medical_officer",
      actionTitle: "Storm Cabin-Fever Psych Support & Sleep Protocol",
      actionPrompt: "Assign Medical Officer to run active psychological debriefs and sound therapy to counter storm howling?",
      tacticalSummary: "Sarah leads crew mindfulness and sleep-aid regimens to counteract extreme isolation anxiety.",
      riskDescription: "-10 Sarah Morale from conducting individual therapy rounds.",
      rewardDescription: "+20 Team Morale, prevents stress-induced operational mistakes.",
      effects: {
        moraleDelta: -10,
        teamMoraleDelta: 20,
        statusDescription: "Maintained crew behavioral health through peak dust storm.",
      },
      moraleEvent: {
        title: "Crew Psychological Resilience Maintained",
        narrative: "Dr. Sarah Chen's proactive group debriefs and relaxation protocols prevented acute confinement stress while winds shook the habitat shell.",
        type: "positive",
      },
      engineeringTakeaway: "Behavioral health support (NASA BHP) is as vital as hardware repair during multi-day habitat lock-ins.",
    },
    geologist: {
      crewRole: "geologist",
      actionTitle: "Secure Exterior Weather Station & Rover Tethering",
      actionPrompt: "Send Geologist outside in 100 km/h dust winds to anchor the Curiosity mast and solar arrays?",
      tacticalSummary: "Alex braves zero-visibility red dust to lock down exterior antennae and rover tie-downs.",
      riskDescription: "-18 Geologist Morale, -10 Health from flying regolith grit.",
      rewardDescription: "+18% Shielding Health, +10% Grid Health, protects rover from tip-over.",
      effects: {
        healthDelta: -10,
        moraleDelta: -18,
        shieldingHealthDelta: 18,
        powerGridHealthDelta: 10,
        statusDescription: "Anchored all surface rovers and comm masts in 100 km/h winds.",
      },
      moraleEvent: {
        title: "Surface Hardware Tied Down in Gale-Force Dust",
        narrative: "Dr. Alex Rivera navigated blinding red dust storms to lash down surface instrumentation, preventing catastrophic equipment loss.",
        type: "heroic",
      },
      engineeringTakeaway: "Securing exterior mechanical tie-downs prevents high-drag storm damage to sensitive communications equipment.",
    },
  },

  // =========================================================================
  // 7. MARS: MOXIE Electrolyzer Ceramic Stack Crack (Sol 4)
  // =========================================================================
  mars_moxie_electrolyzer_fault: {
    botanist: {
      crewRole: "botanist",
      actionTitle: "Overdrive Algae Photobioreactor O₂ Production",
      actionPrompt: "Deploy Botanist to inject concentrated nutrient feed into algae tanks to replace MOXIE oxygen output?",
      tacticalSummary: "Mei spurs micro-algae growth, generating pure breathable oxygen biologically while MOXIE is down.",
      riskDescription: "-12 Botanist Morale, consumes 4 Food Reserve Days of nutrient salts.",
      rewardDescription: "+25% O₂ Buffer restored, +10% Life Support Health.",
      effects: {
        moraleDelta: -12,
        foodDaysDelta: -4,
        oxygenBufferDelta: 25,
        lifeSupportHealthDelta: 10,
        statusDescription: "Boosted biological oxygen generation in algae bioreactors.",
      },
      moraleEvent: {
        title: "Algae Tanks Flood Habitat with Fresh Oxygen",
        narrative: "Dr. Mei Lin supercharged the Spirulina algae bioreactor tanks, producing gallons of fresh oxygen when the mechanical MOXIE failed!",
        type: "positive",
      },
      engineeringTakeaway: "Biological life support redundancy (algae cultures) provides life-saving backup when mechanical solid oxide electrolysis fails.",
    },
    power_engineer: {
      crewRole: "power_engineer",
      actionTitle: "Precision Laser Sinter on Ceramic Electrolyzer Stack",
      actionPrompt: "Order Power Engineer to attempt an internal micro-welding repair on the 800°C ceramic crack?",
      tacticalSummary: "Marcus uses a handheld fiber laser to melt and seal the cracked zirconia stack.",
      riskDescription: "-15 Power Engineer Morale, -8 Health from high-temperature burns.",
      rewardDescription: "+22% Life Support Health, 100% MOXIE O₂ production permanently restored.",
      effects: {
        healthDelta: -8,
        moraleDelta: -15,
        lifeSupportHealthDelta: 22,
        oxygenBufferDelta: 15,
        statusDescription: "Repaired 800°C scandia-stabilized zirconia ceramic stack.",
      },
      moraleEvent: {
        title: "MOXIE Ceramic Electrolyzer Repaired at 800°C",
        narrative: "Commander Vance used a precision fiber laser to fuse the micro-crack in the MOXIE zirconia cell, restoring mechanical O₂ generation from Mars CO₂!",
        type: "heroic",
      },
      engineeringTakeaway: "Solid Oxide Electrolysis operates at 800°C; thermal shock crack repair requires surgical precision.",
    },
    medical_officer: {
      crewRole: "medical_officer",
      actionTitle: "Hyperbaric Oxygen Conservation & Metabolic Rationing",
      actionPrompt: "Direct Medical Officer to put crew on strict low-metabolism rest and calibrate CO₂ scrubbers?",
      tacticalSummary: "Sarah regulates crew exertion and administers mild sedatives to minimize basal metabolic O₂ consumption.",
      riskDescription: "-10 Sarah Morale from stringent rationing oversight.",
      rewardDescription: "Reduces oxygen loss rate by 50%, +10 Team Morale.",
      effects: {
        moraleDelta: -10,
        teamMoraleDelta: 10,
        oxygenBufferDelta: 12,
        statusDescription: "Implemented metabolic oxygen conservation doctrine.",
      },
      moraleEvent: {
        title: "Metabolic Rationing Protocol Saves Oxygen Reserves",
        narrative: "Dr. Sarah Chen coached the crew through deep-breathing conservation techniques, cutting human oxygen consumption by 30% while repairs proceeded.",
        type: "positive",
      },
      engineeringTakeaway: "Physiological demand management stretches limited oxygen reserves during ECLSS hardware failure.",
    },
    geologist: {
      crewRole: "geologist",
      actionTitle: "Tap Mineral Iron-Oxide Regolith Oxygen Reservoir",
      actionPrompt: "Send Geologist to run hydrogen reduction on rich Martian hematite regolith in the chemistry lab?",
      tacticalSummary: "Alex bakes iron-rich Martian red soil with hydrogen gas to extract pure elemental oxygen.",
      riskDescription: "-14 Geologist Morale, heavy chemical furnace duty.",
      rewardDescription: "+18% O₂ Buffer, +12% Life Support Health.",
      effects: {
        moraleDelta: -14,
        oxygenBufferDelta: 18,
        lifeSupportHealthDelta: 12,
        statusDescription: "Extracted chemical O₂ from iron oxide regolith reduction.",
      },
      moraleEvent: {
        title: "Oxygen Baked Directly from Martian Red Sand",
        narrative: "Dr. Alex Rivera baked hematite-rich Martian regolith in the metallurgical furnace, liberating mineral-bound oxygen straight into the habitat!",
        type: "heroic",
      },
      engineeringTakeaway: "Martian regolith is ~40% oxygen by mass; carbothermal and hydrogen reduction unlock vast geological O₂ reserves.",
    },
  },

  // =========================================================================
  // 8. MARS: Curiosity SAM Methane Subsurface Gas Plume (Sol 5)
  // =========================================================================
  mars_methane_plume_hazard: {
    botanist: {
      crewRole: "botanist",
      actionTitle: "Methanotrophic Bio-Filter Extraction Chamber",
      actionPrompt: "Assign Botanist to deploy methanotrophic bacterial cultures to metabolize the methane into biomass?",
      tacticalSummary: "Mei uses specialized methane-eating microbes to turn dangerous flammable gas into protein-rich crop food.",
      riskDescription: "-10 Botanist Morale from delicate culture inoculation.",
      rewardDescription: "+8 Food Reserve Days, +12% Life Support Health, eliminates explosion hazard.",
      effects: {
        moraleDelta: -10,
        foodDaysDelta: 8,
        lifeSupportHealthDelta: 12,
        statusDescription: "Converted subsurface methane into bio-fertilizer protein.",
      },
      moraleEvent: {
        title: "Hazardous Gas Converted into Organic Fertilizer",
        narrative: "Dr. Mei Lin inoculated the filtration chambers with methanotrophic bacteria, miraculously transforming toxic gas into nutritious plant feed!",
        type: "positive",
      },
      engineeringTakeaway: "Biotechnological recycling can convert hazardous volatile emissions into biological assets.",
    },
    power_engineer: {
      crewRole: "power_engineer",
      actionTitle: "Direct Methane Sabatier Fuel-Cell Combustion",
      actionPrompt: "Task Power Engineer with burning the methane plume in the secondary Sabatier fuel cell?",
      tacticalSummary: "Marcus routes the pressurized natural gas into the fuel cell, extracting emergency megawatts.",
      riskDescription: "-12 Power Engineer Morale, risks backfire pressure wave.",
      rewardDescription: "+15 MW Power Generation Bonus, +12% Power Grid Health.",
      effects: {
        moraleDelta: -12,
        powerDeltaMW: 15,
        powerGridHealthDelta: 12,
        statusDescription: "Burned pressurized methane plume for extra kilowatt output.",
      },
      moraleEvent: {
        title: "Subsurface Methane Fuel Cell Generates Surplus Power",
        narrative: "Commander Vance plumbed the geological gas plume into the Sabatier generator, producing an unexpected 15 MW surge of clean power!",
        type: "heroic",
      },
      engineeringTakeaway: "In-situ methane is high-density rocket fuel; burning it in fuel cells supplies potent energy during shortages.",
    },
    medical_officer: {
      crewRole: "medical_officer",
      actionTitle: "Toxic Gas Alarm Calibration & Habitat Hyper-Ventilation",
      actionPrompt: "Order Medical Officer to seal module firebreaks and purge trace hydrogen sulfide from crew quarters?",
      tacticalSummary: "Sarah coordinates rapid atmospheric purging to prevent crew asphyxiation or neurotoxicity.",
      riskDescription: "-8 Sarah Morale from continuous gas sensor monitoring.",
      rewardDescription: "+15 Team Morale, +8% O₂ Buffer, zero toxic exposures.",
      effects: {
        moraleDelta: -8,
        teamMoraleDelta: 15,
        oxygenBufferDelta: 8,
        statusDescription: "Ensured zero combustible gases penetrated crew bunks.",
      },
      moraleEvent: {
        title: "Crew Quarters Isolated from Explosive Gas",
        narrative: "Dr. Sarah Chen's swift atmospheric quarantine prevented volatile gases from reaching the sleeping quarters, keeping everyone safe.",
        type: "positive",
      },
      engineeringTakeaway: "Gas chromatography monitoring protects human respiratory systems during unknown geological volatile venting.",
    },
    geologist: {
      crewRole: "geologist",
      actionTitle: "Sample Vent Venting Chimney & Subsurface Fault Analysis",
      actionPrompt: "Send Geologist on an EVA to sample the vent opening and cap the high-pressure gas fissure?",
      tacticalSummary: "Alex ventures to the crater fissure with gas capture canisters, capping the explosive rift.",
      riskDescription: "-16 Geologist Morale, risks pressurized rock blowout.",
      rewardDescription: "+25% Science Data Bonus, PERMANENT +15% Water/O₂ Buffer, +15% Shielding.",
      effects: {
        moraleDelta: -16,
        shieldingHealthDelta: 15,
        permanentWaterO2Bonus: 15,
        teamMoraleDelta: 8,
        statusDescription: "Capped methane vent and secured priceless isotopic samples.",
      },
      moraleEvent: {
        title: "Subsurface Vent Capped on Gale Crater Floor",
        narrative: "Dr. Alex Rivera stepped up to the hissing fissure and clamped a high-pressure seal over the rift, capturing pristine samples for science!",
        type: "heroic",
      },
      engineeringTakeaway: "Field geology enables active capping of planetary vents while harvesting high-value geochemical samples.",
    },
  },

  // =========================================================================
  // 9. MARS: Phoenix Wet Chemistry Perchlorate Leaching (Sol 6)
  // =========================================================================
  mars_perchlorate_water_leach: {
    botanist: {
      crewRole: "botanist",
      actionTitle: "Deploy Bioremediation Dechlorinating Microbes",
      actionPrompt: "Deploy Botanist to seed the water recycler with Dechloromonas bacteria that metabolize perchlorates?",
      tacticalSummary: "Mei breaks down deadly chlorine oxidizers into harmless chloride and pure oxygen using biology.",
      riskDescription: "-10 Botanist Morale, delicate microbial culturing.",
      rewardDescription: "+15 Food Days, +15% Life Support Health, PERMANENT +15% Water Bonus.",
      effects: {
        moraleDelta: -10,
        foodDaysDelta: 15,
        lifeSupportHealthDelta: 15,
        permanentWaterO2Bonus: 15,
        statusDescription: "Cultured Dechloromonas bacteria to neutralize toxic perchlorates.",
      },
      moraleEvent: {
        title: "Perchlorate Toxins Cleared by Microbial Bioremediation",
        narrative: "Dr. Mei Lin deployed specialized dechlorinating microbes, breaking down the deadly rocket-fuel salts into harmless table salt and pure oxygen!",
        type: "positive",
      },
      engineeringTakeaway: "Biological reduction of perchlorate salts (ClO₄⁻ -> Cl⁻ + 2O₂) cleans water and produces pure O₂ as a byproduct.",
    },
    power_engineer: {
      crewRole: "power_engineer",
      actionTitle: "Electrodialysis & Reverse Osmosis Membrane Overdrive",
      actionPrompt: "Task Power Engineer with surging 15 MW into high-pressure reverse osmosis water purifiers?",
      tacticalSummary: "Marcus pushes the ceramic membrane filtration pumps to 150% pressure to strip perchlorate ions.",
      riskDescription: "-14 Power Engineer Morale, takes 15 MW auxiliary power draw.",
      rewardDescription: "+18% Life Support Health, +10% Power Grid Health, pure water restored.",
      effects: {
        moraleDelta: -14,
        powerDeltaMW: -15,
        lifeSupportHealthDelta: 18,
        powerGridHealthDelta: 10,
        statusDescription: "Overclocked reverse osmosis pumps to strip chlorine ions.",
      },
      moraleEvent: {
        title: "High-Pressure Osmosis Strips Heavy Salts",
        narrative: "Commander Vance pumped high-pressure electricity through the multi-stage reverse osmosis filtration array, purifying the drinking water.",
        type: "heroic",
      },
      engineeringTakeaway: "High-pressure reverse osmosis removes up to 99.5% of monovalent perchlorate salts at the cost of high pumping power.",
    },
    medical_officer: {
      crewRole: "medical_officer",
      actionTitle: "Thyroid Protection & Potassium Iodide Distribution",
      actionPrompt: "Order Medical Officer to distribute potassium iodide prophylaxis to protect crew thyroid glands?",
      tacticalSummary: "Sarah protects crew endocrine systems from perchlorate iodine-uptake inhibition.",
      riskDescription: "-8 Sarah Morale from medical monitoring.",
      rewardDescription: "+18 Team Morale, prevents long-term thyroid illness, protects crew health.",
      effects: {
        moraleDelta: -8,
        teamMoraleDelta: 18,
        lifeSupportHealthDelta: 5,
        statusDescription: "Administered thyroid iodine blockers to all astronauts.",
      },
      moraleEvent: {
        title: "Crew Endocrine Systems Shielded from Toxins",
        narrative: "Dr. Sarah Chen immediately administered potassium iodide tablets to prevent toxic perchlorate ions from accumulating in crew thyroid tissue.",
        type: "positive",
      },
      engineeringTakeaway: "Perchlorate competitively inhibits thyroid iodine uptake; prophylactic iodide dosing is a NASA flight surgeon medical standard.",
    },
    geologist: {
      crewRole: "geologist",
      actionTitle: "Excavate Low-Perchlorate Glacial Ice Deposits",
      actionPrompt: "Send Geologist with the rover to excavate buried glacial ice with lower salt contamination?",
      tacticalSummary: "Alex treks 2 km north to core into pure, low-perchlorate subsurface sheets.",
      riskDescription: "+0.6 mSv Radiation Dose, -15 Morale from freezing trek.",
      rewardDescription: "+10 Food Reserve Days, +20% Water/O₂ Buffer, +12% Shielding.",
      effects: {
        moraleDelta: -15,
        radiationDeltaMSv: 0.6,
        foodDaysDelta: 10,
        oxygenBufferDelta: 20,
        shieldingHealthDelta: 12,
        statusDescription: "Cored pristine glacial ice free of surface perchlorate salts.",
      },
      moraleEvent: {
        title: "Pristine Ice Excavated Far from Salt Crust",
        narrative: "Dr. Alex Rivera found a deep glacial ice deposit buried under debris, bypassing the contaminated topsoil completely!",
        type: "heroic",
      },
      engineeringTakeaway: "Deep glacial ice shielded by debris aprons contains significantly lower perchlorate concentrations than surface dust.",
    },
  },

  // =========================================================================
  // 10. MARS: Polar Sublimation Chill & Atmospheric Freeze-Out (Sol 8)
  // =========================================================================
  mars_atmospheric_sublimation_chill: {
    botanist: {
      crewRole: "botanist",
      actionTitle: "Emergency Thermal Blanket Wrapping on Plant Nurseries",
      actionPrompt: "Direct Botanist to wrap plant roots in aerogel blankets to prevent root-zone freezing at -125°C?",
      tacticalSummary: "Mei works in the freezing greenhouse to save rare heirloom space crops from fatal frost.",
      riskDescription: "-12 Botanist Morale from working in near-freezing bio-dome.",
      rewardDescription: "+12 Food Reserve Days saved, +12% Life Support Health.",
      effects: {
        moraleDelta: -12,
        foodDaysDelta: 12,
        lifeSupportHealthDelta: 12,
        statusDescription: "Insulated all plant root beds with lightweight aerogel.",
      },
      moraleEvent: {
        title: "Heirloom Crops Shielded from -125°C Cold",
        narrative: "Dr. Mei Lin swaddled the hydroponic root nurseries in aerogel insulation, keeping the crops warm while outdoor temperatures plummeted to -125°C!",
        type: "positive",
      },
      engineeringTakeaway: "Aerogel root wraps preserve thermal mass in living plants even when ambient greenhouse temperatures drop during polar night.",
    },
    power_engineer: {
      crewRole: "power_engineer",
      actionTitle: "Stirling Engine High-Temperature Thermal Bleed",
      actionPrompt: "Task Power Engineer with tapping Stirling engine exhaust heat directly into habitat ducting?",
      tacticalSummary: "Marcus vents nuclear convertor thermal exhaust through habitat walls, warming crew bunks.",
      riskDescription: "-14 Power Engineer Morale, draws 10 MW thermal control overhead.",
      rewardDescription: "+20% Power Grid Health, +15% Life Support Health, 100% warm quarters.",
      effects: {
        moraleDelta: -14,
        powerGridHealthDelta: 20,
        lifeSupportHealthDelta: 15,
        powerDeltaMW: 6,
        statusDescription: "Connected Stirling reactor exhaust loop to habitat heaters.",
      },
      moraleEvent: {
        title: "Nuclear Reactor Heat Piped into Living Modules",
        narrative: "Commander Vance plumbed the hot exhaust fluid from the Stirling nuclear generator straight into the outpost vents, keeping the habitat cozy!",
        type: "heroic",
      },
      engineeringTakeaway: "Nuclear fission reactors generate substantial thermal reject heat; tapping this exhaust provides free habitat heating.",
    },
    medical_officer: {
      crewRole: "medical_officer",
      actionTitle: "Cold-Stress Countermeasures & Warm Calorie Rations",
      actionPrompt: "Order Medical Officer to distribute high-calorie hot nutrient broths and thermal suits?",
      tacticalSummary: "Sarah monitors core body temperatures and dispenses warm high-lipid rations to prevent hypothermia.",
      riskDescription: "-8 Sarah Morale from constant vitals monitoring.",
      rewardDescription: "+20 Team Morale, +8% O₂ Buffer, zero cold-induced fatigue.",
      effects: {
        moraleDelta: -8,
        teamMoraleDelta: 20,
        oxygenBufferDelta: 8,
        statusDescription: "Managed crew core body thermals and caloric intake.",
      },
      moraleEvent: {
        title: "Hot Rations and Thermal Gear Keep Crew Spirits High",
        narrative: "Dr. Sarah Chen brewed hot fortified nutrient soups and distributed insulated thermal undergarments, turning a freezing crisis into team bonding!",
        type: "positive",
      },
      engineeringTakeaway: "Dietary thermogenesis and high-lipid warm rations are standard NASA countermeasures for extreme habitat cold-soak scenarios.",
    },
    geologist: {
      crewRole: "geologist",
      actionTitle: "Seal Habitat Perimeter Berm with Dry-Ice Snowpack",
      actionPrompt: "Send Geologist outside to pack dense frozen CO₂ dry ice around habitat footings to block whistling winds?",
      tacticalSummary: "Alex builds an exterior wind-break berm using dense, compacted Martian snow and regolith.",
      riskDescription: "-16 Geologist Morale, -8 Health from handling -125°C dry ice blocks.",
      rewardDescription: "+25% Shielding Health, blocks thermal wind-chill entirely.",
      effects: {
        healthDelta: -8,
        moraleDelta: -16,
        shieldingHealthDelta: 25,
        statusDescription: "Built dense exterior windbreak berm around habitat foundation.",
      },
      moraleEvent: {
        title: "Thermal Windbreak Constructed from Martian Snow",
        narrative: "Dr. Alex Rivera worked in brutal -125°C conditions to pile dry ice and soil against the windward habitat wall, slashing convective heat loss by half!",
        type: "heroic",
      },
      engineeringTakeaway: "Compacted surface snowpack acts as an exterior insulating berm, dramatically reducing convective heat transfer in sub-freezing winds.",
    },
  },
};

// Aliases matching incidentCards IDs across Moon and Mars
INCIDENT_SPECIALIST_REPAIRS["lunar_x_class_spe"] = INCIDENT_SPECIALIST_REPAIRS["lunar_solar_storm_spe"];
INCIDENT_SPECIALIST_REPAIRS["lunar_dust_electrostatic"] = INCIDENT_SPECIALIST_REPAIRS["lunar_dust_electrostatic_abrasion"];
INCIDENT_SPECIALIST_REPAIRS["lunar_shadow_oscillation"] = INCIDENT_SPECIALIST_REPAIRS["lunar_radiator_frost_lock"];
INCIDENT_SPECIALIST_REPAIRS["mars_regional_dust_storm"] = INCIDENT_SPECIALIST_REPAIRS["mars_global_dust_storm"];
INCIDENT_SPECIALIST_REPAIRS["mars_dust_devil_vortex"] = INCIDENT_SPECIALIST_REPAIRS["mars_moxie_electrolyzer_fault"];
INCIDENT_SPECIALIST_REPAIRS["mars_co2_compressor_freezing"] = INCIDENT_SPECIALIST_REPAIRS["mars_methane_plume_hazard"];
INCIDENT_SPECIALIST_REPAIRS["mars_subsurface_perchlorates"] = INCIDENT_SPECIALIST_REPAIRS["mars_perchlorate_water_leach"];
INCIDENT_SPECIALIST_REPAIRS["mars_gcr_high_flux"] = INCIDENT_SPECIALIST_REPAIRS["mars_atmospheric_sublimation_chill"];

// Europa Specialist Repairs
INCIDENT_SPECIALIST_REPAIRS["europa_jovian_radiation_storm"] = {
  botanist: {
    crewRole: "botanist",
    actionTitle: "Deep Water Ballast Hydroponic Shielding",
    actionPrompt: "Send Botanist to submerge fragile bioluminescent algae cultures into deep sub-ice water ballasts?",
    tacticalSummary: "Mei secures seed cultures under 2 meters of Jovian ocean ice.",
    riskDescription: "-15 Botanist Morale from working near high-pressure sub-ice airlocks.",
    rewardDescription: "+15 Food Reserve Days, +12% O₂ Buffer.",
    effects: { moraleDelta: -15, foodDaysDelta: 15, oxygenBufferDelta: 12, lifeSupportHealthDelta: 12 },
    moraleEvent: { title: "Sub-Ice Seed Vault Secured", narrative: "Dr. Mei Lin secured all botanical strains in the subterranean ice well before Jovian radiation crested.", type: "positive" },
    engineeringTakeaway: "Sub-surface ice water mass is a superb passive barrier against Jupiter's trapped radiation belt."
  },
  power_engineer: {
    crewRole: "power_engineer",
    actionTitle: "Superconducting Magnetic Siphon Overclock",
    actionPrompt: "Order Power Engineer to harness Jovian auroral flux into the superconducting shield coils?",
    tacticalSummary: "Marcus taps Jupiter's massive magnetosphere to boost the base shield.",
    riskDescription: "-12 Power Engineer Morale, -10 Health from electromagnetic shock.",
    rewardDescription: "+25% Shield Health, +15 MW Induction Power.",
    effects: { healthDelta: -10, moraleDelta: -12, shieldingHealthDelta: 25, powerDeltaMW: 15 },
    moraleEvent: { title: "Jovian Magnetic Flux Harnessed", narrative: "Commander Vance coupled the station inductors into Jupiter's magnetosphere, creating an impenetrable force field!", type: "heroic" },
    engineeringTakeaway: "Planetary magnetic fields can be inductively coupled to power outpost defensive coils."
  },
  medical_officer: {
    crewRole: "medical_officer",
    actionTitle: "Jovian Magnetosphere Bio-Dosimetry Protocol",
    actionPrompt: "Have Medical Officer administer targeted DNA repair enzymes and cellular radioprotection?",
    tacticalSummary: "Sarah administers specialized rad-blockers for high-energy Jovian electrons.",
    riskDescription: "-10 Sarah Morale, depletes enzyme reserves.",
    rewardDescription: "Halves crew Jovian radiation absorption, +15 Team Morale.",
    effects: { moraleDelta: -10, teamMoraleDelta: 15, shieldingHealthDelta: 8 },
    moraleEvent: { title: "DNA Radioprotection Protocol Active", narrative: "Dr. Sarah Chen dosed the crew with radioprotective antioxidants, neutralizing ionizing Jovian particle damage.", type: "positive" },
    engineeringTakeaway: "Specialized pharmaceutical enzyme therapies defend against energetic Jovian trapped electron cascades."
  },
  geologist: {
    crewRole: "geologist",
    actionTitle: "Sub-Ice Cryo-Anchor & Ice Sheet Reinforcement",
    actionPrompt: "Send Geologist into the sub-ice crevasse to anchor radiation-dense ice slab baffles?",
    tacticalSummary: "Alex cuts and packs high-density Jovian ice slabs above the module.",
    riskDescription: "+1.2 mSv Radiation Dose, -18 Morale from freezing abyss excursion.",
    rewardDescription: "+28% Shielding Health, permanent ice shielding barrier.",
    effects: { moraleDelta: -18, radiationDeltaMSv: 1.2, shieldingHealthDelta: 28 },
    moraleEvent: { title: "Glacial Ice Shielding Slabs Locked in Place", narrative: "Dr. Alex Rivera worked suspended over Europa's abyssal ocean to lock 10-ton ice slabs over the habitat roof.", type: "heroic" },
    engineeringTakeaway: "Europa's thick water ice shell provides hundreds of tons of natural radiation shielding if properly anchored."
  }
};

INCIDENT_SPECIALIST_REPAIRS["europa_hydrothermal_vent_surge_card"] = INCIDENT_SPECIALIST_REPAIRS["lunar_ice_drill_surge"];
INCIDENT_SPECIALIST_REPAIRS["europa_ice_crust_tension_fracture"] = INCIDENT_SPECIALIST_REPAIRS["lunar_micrometeorite_puncture"];
INCIDENT_SPECIALIST_REPAIRS["europa_cryo_brine_salinity_short"] = INCIDENT_SPECIALIST_REPAIRS["mars_subsurface_perchlorates"];
INCIDENT_SPECIALIST_REPAIRS["europa_deep_ocean_biosignature_echo"] = INCIDENT_SPECIALIST_REPAIRS["mars_methane_plume_hazard"];

// Titan Specialist Repairs
INCIDENT_SPECIALIST_REPAIRS["titan_methane_monsoon_flash_flood"] = INCIDENT_SPECIALIST_REPAIRS["mars_global_dust_storm"];
INCIDENT_SPECIALIST_REPAIRS["titan_dragonfly_icing_in_supercooled_fog"] = INCIDENT_SPECIALIST_REPAIRS["lunar_radiator_frost_lock"];
INCIDENT_SPECIALIST_REPAIRS["titan_cryo_rankine_lake_heat_exchanger_slagging"] = INCIDENT_SPECIALIST_REPAIRS["mars_atmospheric_sublimation_chill"];
INCIDENT_SPECIALIST_REPAIRS["titan_tholin_electrostatic_arc"] = INCIDENT_SPECIALIST_REPAIRS["lunar_dust_electrostatic_abrasion"];
INCIDENT_SPECIALIST_REPAIRS["titan_prebiotic_amino_acid_discovery"] = INCIDENT_SPECIALIST_REPAIRS["mars_methane_plume_hazard"];
