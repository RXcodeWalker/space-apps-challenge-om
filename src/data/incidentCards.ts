// ============================================================
// Incident Cards — Outpost Commander
// 10 NASA-grounded dynamic mid-mission engineering incidents
// (5 Lunar South Pole & 5 Mars Gale Crater)
// ============================================================

import type { MissionEnvironmentId } from "./nasaConstants";
import { createSeededRNG } from "../utils/seededRandom";

export interface NasaScienceBadge {
  instrument: string;
  mission: string;
  badgeTitle: string;
  explanation: string;
  dataSourceUrl: string;
}

export interface IncidentChoiceEffects {
  powerDeltaMW?: number;
  lifeSupportHealthDelta?: number;
  shieldingHealthDelta?: number;
  powerGridHealthDelta?: number;
  moraleDelta?: number;
  radiationDeltaMSv?: number;
  oxygenBufferDelta?: number;
  foodDaysDelta?: number;
  permanentWaterO2Bonus?: number; // e.g. +15% permanent efficiency
}

export interface IncidentChoice {
  id: string;
  label: string;
  shortTag: string;
  description: string;
  tradeOffSummary: string;
  effects: IncidentChoiceEffects;
  engineeringTakeaway: string;
}

export interface IncidentCard {
  id: string;
  environmentId: MissionEnvironmentId;
  triggerSol: number; // 1 to 10
  severity: "critical" | "warning" | "opportunity";
  title: string;
  headline: string;
  description: string;
  nasaScience: NasaScienceBadge;
  choices: [IncidentChoice, IncidentChoice, IncidentChoice?];
}

// ---------------------------------------------------------------------------
// 5 LUNAR SOUTH POLE INCIDENT CARDS
// ---------------------------------------------------------------------------

export const LUNAR_INCIDENT_CARDS: IncidentCard[] = [
  {
    id: "lunar_micrometeorite_puncture",
    environmentId: "lunar_south_pole",
    triggerSol: 2,
    severity: "warning",
    title: "Micrometeorite Thermal Blanket Puncture",
    headline: "Hypervelocity particle penetrates primary habitat Multi-Layer Insulation (MLI)",
    description:
      "A millimeter-scale micrometeoroid striking at 18 km/s has punctured the outer thermal regulation blanket near Habitat Module B. With lunar surface temperatures plunging towards −173°C in local crater shade, the habitat will rapidly leak core heat without counter-measures.",
    nasaScience: {
      instrument: "LRO Diviner Lunar Radiometer & Artemis MLI Whipple Shields",
      mission: "NASA Lunar Reconnaissance Orbiter / Artemis Base Camp Architecture",
      badgeTitle: "Real NASA Science",
      explanation:
        "NASA's LRO Diviner recorded surface temperatures dropping below −246°C in Shackleton shadows. To endure these extreme thermal gradients and 20 km/s micrometeoroid impacts, NASA engineers design habitats with Multi-Layer Insulation (MLI) blankets and spaced Nextel/Kevlar Whipple shields that vaporize hypervelocity particles on contact.",
      dataSourceUrl: "https://diviner.ucla.edu/",
    },
    choices: [
      {
        id: "divert_thermal_power",
        label: "Divert Grid Power to Resistive MLI Heaters",
        shortTag: "Power Allocation",
        description:
          "Pump 18 MW of auxiliary power into perimeter heating coils to counteract thermal bleed. Keeps habitat temperature stable without risking crew outside.",
        tradeOffSummary: "−18 MW Power Budget, Habitat Heat Maintained, 0 Crew Risk",
        effects: {
          powerDeltaMW: -18,
          powerGridHealthDelta: -5,
          moraleDelta: 2,
        },
        engineeringTakeaway:
          "You used electrical power as thermal armor. This prevented hull freezing but constrained available MW for other systems.",
      },
      {
        id: "eva_crew_patch",
        label: "Deploy Emergency Crew EVA Patch Team",
        shortTag: "Crew Effort",
        description:
          "Send two astronauts on an immediate 4-hour extravehicular excursion to apply a beta-cloth patch and vacuum sealant tape over the breach.",
        tradeOffSummary: "Crew Morale −12, Radiation Exposure +0.8 mSv, Power Untouched",
        effects: {
          moraleDelta: -12,
          radiationDeltaMSv: 0.8,
          shieldingHealthDelta: 5,
        },
        engineeringTakeaway:
          "You preserved grid energy at the direct cost of astronaut physical fatigue and solar radiation exposure.",
      },
      {
        id: "seal_compartment",
        label: "Seal & Depressurize Compromised Module B",
        shortTag: "Containment",
        description:
          "Isolate Module B behind bulkheads. Conserves both heating power and crew effort, but temporarily reduces operational habitat volume and O₂ scrub headroom.",
        tradeOffSummary: "O₂ Buffer −10%, Morale −6, No Power Spent",
        effects: {
          oxygenBufferDelta: -10,
          moraleDelta: -6,
        },
        engineeringTakeaway:
          "Zonal containment prevented power brownout, but cramped crew quarters and compressed the habitat O₂ buffer.",
      },
    ],
  },
  {
    id: "lunar_ice_drill_surge",
    environmentId: "lunar_south_pole",
    triggerSol: 4,
    severity: "opportunity",
    title: "Shackleton Shadowed Crater Ice Drill Surge",
    headline: "Automated cryo-drill reaches rich volatiles in a Permanently Shadowed Region",
    description:
      "Rover Drill Rig 'TRIDENT-B' strikes a dense layer of pure water ice 1.2 meters below the regolith in Shackleton Crater. Tapping the vein requires an intense cryogenic sublimation surge. Can the outpost grid absorb the massive power spike to secure permanent water and oxygen gains?",
    nasaScience: {
      instrument: "NASA PRIME-1 / TRIDENT Drill & LCROSS Plume Spectrometer",
      mission: "NASA Polar Resources Ice Mining Experiment-1 (PRIME-1)",
      badgeTitle: "Real NASA Science",
      explanation:
        "NASA's LCROSS impactor confirmed 5.6% water ice in Cabeus crater, and the PRIME-1 mission deploys the TRIDENT hammer-drill into lunar cryogenic permafrost. Sublimating and harvesting volatile ice in a 40 Kelvin vacuum requires heavy burst electrical power for heated collection domes.",
      dataSourceUrl: "https://www.nasa.gov/mission_pages/LCROSS/main/",
    },
    choices: [
      {
        id: "overclock_drill_harvest",
        label: "Overclock Cryo-Drill & Capture Volatile Plume",
        shortTag: "Aggressive In-Situ Harvest",
        description:
          "Commit a 25 MW grid surge to run the sublimation heaters at 120% capacity. Captures maximum vapor into the habitat's closed-loop ECLSS tanks.",
        tradeOffSummary: "−25 MW Power Spike, Grid Health −8%, PERMANENT +15% Water/O₂ Buffer",
        effects: {
          powerDeltaMW: -25,
          powerGridHealthDelta: -8,
          permanentWaterO2Bonus: 15,
          oxygenBufferDelta: 15,
          foodDaysDelta: 2.5,
          moraleDelta: 8,
        },
        engineeringTakeaway:
          "You risked a temporary electrical brownout to achieve permanent in-situ resource independence (ISRU) for water and air.",
      },
      {
        id: "nominal_slow_drill",
        label: "Run Conservative Low-Current Extraction",
        shortTag: "Standard Yield",
        description:
          "Maintain the drill at nominal 8 MW draw. Extracts core samples safely without stressing grid transformers, but yields only modest supplemental reserves.",
        tradeOffSummary: "−8 MW Power Draw, O₂ Buffer +6%, Food Reserves +1 Day",
        effects: {
          powerDeltaMW: -8,
          oxygenBufferDelta: 6,
          foodDaysDelta: 1.0,
          moraleDelta: 2,
        },
        engineeringTakeaway:
          "You took the conservative engineering route, protecting grid stability while securing a safe baseline resource return.",
      },
      {
        id: "abort_drill_buffer_grid",
        label: "Abort Extraction & Retract TRIDENT Drill",
        shortTag: "Grid Preservation",
        description:
          "Halt ice extraction immediately and route drill reserve batteries into the habitat power bus to reinforce the outpost energy pool.",
        tradeOffSummary: "+12 MW Power Reserve Bonus, 0 Water Yield, Grid Health +5%",
        effects: {
          powerDeltaMW: 12,
          powerGridHealthDelta: 5,
          moraleDelta: -4,
        },
        engineeringTakeaway:
          "You treated the drill as a backup battery, forfeiting precious lunar water to guarantee bulletproof grid headroom.",
      },
    ],
  },
  {
    id: "lunar_x_class_spe",
    environmentId: "lunar_south_pole",
    triggerSol: 6,
    severity: "critical",
    title: "X-Class Solar Particle Event (SPE)",
    headline: "Coronal mass ejection delivers 400% radiation spike directly onto Shackleton Rim",
    description:
      "NOAA Space Weather and NASA CRaTER sensors detect a massive X9.3 solar flare. Energetic solar protons are bombarding the Moon with no planetary magnetosphere to deflect them. Radiation levels spike 400% for the next 24 hours.",
    nasaScience: {
      instrument: "LRO CRaTER & Artemis Orion Active Water-Wall Shielding",
      mission: "NASA Lunar Reconnaissance Orbiter / Artemis Deep Space Shielding",
      badgeTitle: "Real NASA Science",
      explanation:
        "NASA's CRaTER instrument measured cosmic radiation dosages that exceed 1 Sievert during intense SPEs. Hydrogen atoms are the most effective particle decelerators because protons match neutron mass; Artemis engineers design habitats to pump water reserves into perimeter bulkheads ('water-walls') to protect crews without generating secondary ionizing splatter.",
      dataSourceUrl: "https://crater.bu.edu/",
    },
    choices: [
      {
        id: "divert_water_wall",
        label: "Divert Power to Active Water-Wall & Magnetic Coil",
        shortTag: "Active Shielding",
        description:
          "Siphon 32 MW into the active magnetic deflection field and pump greywater tanks into surrounding habitat bulkheads. Halts hydroponics grow lights for 1 Sol.",
        tradeOffSummary: "Shielding Integrity +20%, Crew Radiation Dosed = 0 mSv, Life Support Health −18%",
        effects: {
          powerDeltaMW: -15,
          shieldingHealthDelta: 20,
          lifeSupportHealthDelta: -18,
          moraleDelta: 5,
        },
        engineeringTakeaway:
          "You starved your agricultural crops to erect an impenetrable hydrological shield, ensuring zero crew radiation dosage.",
      },
      {
        id: "retreat_storm_shelter",
        label: "Order Crew to Storm Shelter (Halt All Maintenance)",
        shortTag: "Passive Bunker",
        description:
          "Order all 4 astronauts into the heavily shielded central regolith storm bunker. Halts routine habitat maintenance, rover ops, and subsystem repairs.",
        tradeOffSummary: "Shield Health Unstressed, Power Grid −10%, Crew Safe, Morale −8",
        effects: {
          powerGridHealthDelta: -10,
          shieldingHealthDelta: -5,
          moraleDelta: -8,
          radiationDeltaMSv: 0.4,
        },
        engineeringTakeaway:
          "You took the procedural safety protocol: sheltering halted systems maintenance, allowing wear to creep upward.",
      },
      {
        id: "risk_exposure_maintain_grid",
        label: "Maintain Nominal Grid & Absorb Residual Dose",
        shortTag: "Risk Exposure",
        description:
          "Keep life support and solar tracking at 100% capacity. Rely strictly on outer regolith berms and distribute radioprotective antioxidants to crew.",
        tradeOffSummary: "Radiation Exposure +3.8 mSv, Subsystems at 100%, Morale −15",
        effects: {
          radiationDeltaMSv: 3.8,
          moraleDelta: -15,
          powerGridHealthDelta: 5,
          lifeSupportHealthDelta: 5,
        },
        engineeringTakeaway:
          "You accepted high human biological toll (+3.8 mSv) to prevent industrial brownouts in the habitat systems.",
      },
    ],
  },
  {
    id: "lunar_dust_electrostatic",
    environmentId: "lunar_south_pole",
    triggerSol: 7,
    severity: "warning",
    title: "Electrostatic Lunar Dust Clinging",
    headline: "Solar UV photoelectric charging coats solar arrays in jagged regolith particles",
    description:
      "Sub-micron abrasive lunar regolith particles, levitated by terminators and solar UV photoelectric charging, have adhered electrostatically to the primary solar array glass. Photovoltaic conversion efficiency has degraded by 28%.",
    nasaScience: {
      instrument: "NASA KSC Electrostatic Dust Shield (EDS) & Apollo 17 Regolith Analysis",
      mission: "NASA Kennedy Space Center Applied Physics Lab",
      badgeTitle: "Real NASA Science",
      explanation:
        "Apollo astronauts found lunar dust razor-sharp and magnetically clingy due to lack of atmospheric weathering. NASA developed Electrostatic Dust Shield (EDS) technology, which runs high-voltage multiphase AC waveforms through embedded micro-electrodes to push dust off optical surfaces without scratching glass.",
      dataSourceUrl: "https://www.nasa.gov/general/electrostatic-dust-shield/",
    },
    choices: [
      {
        id: "pulse_eds_system",
        label: "Fire High-Voltage Electrostatic Dust Shield (EDS)",
        shortTag: "EDS Pulse",
        description:
          "Deliver an automated 14 MW high-voltage pulse across the array conductive grids. Cleans 95% of dust levitation without mechanical contact.",
        tradeOffSummary: "−14 MW Burst Power, Solar Restored to 100%, Power Grid Health +8%",
        effects: {
          powerDeltaMW: -14,
          powerGridHealthDelta: 8,
          moraleDelta: 3,
        },
        engineeringTakeaway:
          "You traded a short electrical pulse to permanently restore clear solar optics, exemplifying advanced NASA ISRU cleaning.",
      },
      {
        id: "manual_eva_sweep",
        label: "Dispatch Crew on Manual EVA Brush Sweep",
        shortTag: "Manual EVA",
        description:
          "Send astronauts with carbon-fiber sweepers to physically clean the panels. Conserves power, but wears spacesuit joint seals against jagged dust.",
        tradeOffSummary: "Power Intact, Crew Morale −10, Shielding Wear +8%",
        effects: {
          moraleDelta: -10,
          shieldingHealthDelta: -8,
          powerGridHealthDelta: 4,
        },
        engineeringTakeaway:
          "You spared electrical reserves by expending human astronaut labor, accelerating mechanical wear on suit bearings.",
      },
      {
        id: "tolerate_dust_loss",
        label: "Accept 28% Solar Loss & Throttle Non-Essentials",
        shortTag: "Passive Derating",
        description:
          "Do nothing to clear the dust. Derate total solar power yield and shut down exterior floodlights and automated material conveyors.",
        tradeOffSummary: "−10 MW Generation for 2 Sols, Morale −5, Zero Upfront Cost",
        effects: {
          powerDeltaMW: -10,
          moraleDelta: -5,
        },
        engineeringTakeaway:
          "You avoided active intervention, choosing to absorb reduced power generation rather than spend resources.",
      },
    ],
  },
  {
    id: "lunar_shadow_oscillation",
    environmentId: "lunar_south_pole",
    triggerSol: 8,
    severity: "warning",
    title: "Shackleton Rim Topographical Shadow Oscillation",
    headline: "Low Sun elevation angle casts 14-hour ridge shadow across the solar farm",
    description:
      "Because the Moon's obliquity is only 1.5°, towering terrain peaks kilometers away cast long knife-edge shadows. An unpredicted topographic ridge eclipse sweeps across the primary solar arrays, cutting insolation by 40 MW.",
    nasaScience: {
      instrument: "LRO LOLA Laser Altimeter High-Resolution Digital Elevation Models",
      mission: "NASA Lunar Reconnaissance Orbiter / LOLA Science Team",
      badgeTitle: "Real NASA Science",
      explanation:
        "NASA's LOLA altimeter mapped crater rim elevations down to millimeter precision, discovering 'peaks of eternal light' (quasi-continuous sunlight). However, seasonal shifts still cause brief shadow fingers; Artemis systems use regenerative fuel cells and tall vertical solar masts to bridge these dips.",
      dataSourceUrl: "https://lola.gsfc.nasa.gov/",
    },
    choices: [
      {
        id: "regenerative_fuel_cells",
        label: "Engage Regenerative Hydrogen Fuel Cell Stack",
        shortTag: "Fuel Cells",
        description:
          "Discharge closed-loop H₂/O₂ fuel cells to bridge the 40 MW shadow deficit. Restores 25 MW to the bus, consuming 8% of the oxygen reserve.",
        tradeOffSummary: "+25 MW Grid Backup, O₂ Buffer −8%, Systems Fully Sustained",
        effects: {
          powerDeltaMW: 25,
          oxygenBufferDelta: -8,
          powerGridHealthDelta: 4,
        },
        engineeringTakeaway:
          "You tapped electrochemical fuel cells to defeat the lunar darkness, directly trading stored reactant O₂ for immediate megawatts.",
      },
      {
        id: "stirling_rtg_boost",
        label: "Reroute Fission Surface Power (FSP) Auxiliary Loop",
        shortTag: "Nuclear Aux",
        description:
          "Ramp up the outpost's Kilopower nuclear Stirling engine. Takes 10 MW to synchronize the heat pipes, then provides steady baseline power.",
        tradeOffSummary: "−10 MW Init Spike, Grid Stability +12%, 0 Oxygen Consumed",
        effects: {
          powerDeltaMW: -10,
          powerGridHealthDelta: 12,
          moraleDelta: 4,
        },
        engineeringTakeaway:
          "You relied on nuclear thermal synergy to bypass astronomical eclipses without touching life support consumables.",
      },
      {
        id: "deep_conservation_mode",
        label: "Initiate Deep Low-Power Outpost Hibernation",
        shortTag: "Hibernation",
        description:
          "Power down lab computers, dim lighting, and lower habitat heating setpoints by 6°C until the crater rim re-emerges into sunlight.",
        tradeOffSummary: "Saves 22 MW, Crew Morale −14, Hydroponics Yield −1 Day",
        effects: {
          moraleDelta: -14,
          foodDaysDelta: -1.0,
          lifeSupportHealthDelta: -6,
        },
        engineeringTakeaway:
          "You practiced strict conservation, preserving power at the cost of astronaut comfort and plant growth.",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// 5 MARS GALE CRATER INCIDENT CARDS
// ---------------------------------------------------------------------------

export const MARS_INCIDENT_CARDS: IncidentCard[] = [
  {
    id: "mars_regional_dust_storm",
    environmentId: "mars_gale_crater",
    triggerSol: 2,
    severity: "critical",
    title: "Martian Regional Dust Storm (Gale Crater)",
    headline: "Atmospheric opacity (tau) skyrockets; solar generation drops 55% for 2 Sols",
    description:
      "Curiosity REMS sensors record a sudden jump in atmospheric optical depth (tau = 4.2). Fine reddish dust fills the sky over Mount Sharp, obscuring direct sunlight. Total solar power generation collapses by 55% for the next 2 Sols.",
    nasaScience: {
      instrument: "MSL Curiosity REMS Optical Sensor & MRO Mars Color Imager (MARCI)",
      mission: "NASA Mars Science Laboratory Curiosity / Mars Reconnaissance Orbiter",
      badgeTitle: "Real NASA Science",
      explanation:
        "NASA REMS monitored global dust storms that encircled Mars in 2018, starving the solar-powered Opportunity rover while Curiosity continued operating uninterrupted thanks to its Multi-Mission Radioisotope Thermoelectric Generator (MMRTG). Martian dust storms require balancing heavy battery discharge against essential habitat survival loads.",
      dataSourceUrl: "https://mars.nasa.gov/msl/spacecraft/instruments/rems/",
    },
    choices: [
      {
        id: "ration_life_support",
        label: "Ration Life Support & Run Baseline O₂ Only",
        shortTag: "LS Rationing",
        description:
          "Cut life support power by 16 MW to protect battery reserves. Shut off hydroponic grow arrays and reduce CO₂ scrubber circulation to minimum survival flow.",
        tradeOffSummary: "Preserves Power Reserves, O₂ Buffer −15%, Food Reserve −1.5 Days",
        effects: {
          powerDeltaMW: 16,
          lifeSupportHealthDelta: -15,
          oxygenBufferDelta: -15,
          foodDaysDelta: -1.5,
          moraleDelta: -8,
        },
        engineeringTakeaway:
          "You prioritized the electrical grid over human comfort, rationing air scrubbers to guarantee battery survival through the dust storm.",
      },
      {
        id: "drain_battery_reserves",
        label: "Discharge Battery Bank to Keep All Systems 100%",
        shortTag: "Full Battery Discharge",
        description:
          "Draw deep on the outpost's lithium-sulfur battery storage to maintain full life support and air filtration throughout the storm.",
        tradeOffSummary: "Life Support at 100%, Grid Health Drops −22%, Brownout Risk Elevated",
        effects: {
          powerGridHealthDelta: -22,
          lifeSupportHealthDelta: 8,
          moraleDelta: 4,
        },
        engineeringTakeaway:
          "You kept crew systems running at luxury nominal specs, taking severe mechanical wear on deep-cycle energy storage.",
      },
      {
        id: "lockdown_science_heaters",
        label: "Halt Science Operations & Direct Waste Heat into Habitat",
        shortTag: "Cogeneration Lockdown",
        description:
          "Mothball exterior rovers and sample drills. Route thermal fluid loops from the base MMRTG into habitat walls to save 10 MW of electrical heat.",
        tradeOffSummary: "+10 MW Thermal Savings, Power Grid −8%, Morale −4",
        effects: {
          powerDeltaMW: 10,
          powerGridHealthDelta: -8,
          moraleDelta: -4,
        },
        engineeringTakeaway:
          "You used industrial waste-heat cogeneration (like NASA's MSL MMRTG loop) to offset electrical demand.",
      },
    ],
  },
  {
    id: "mars_dust_devil_vortex",
    environmentId: "mars_gale_crater",
    triggerSol: 4,
    severity: "opportunity",
    title: "Gale Crater Dust Devil Direct Path",
    headline: "120-meter convective thermal vortex heading straight for the solar field",
    description:
      "Navcam tracking pinpoints an atmospheric dust devil swirling across the floor of Gale Crater directly toward the outpost array field. The intense vortex carries strong electrostatic potentials, but its winds could clean dust off the panels.",
    nasaScience: {
      instrument: "Curiosity Navcam & Spirit Rover Atmospheric Dust Cleaning Logs",
      mission: "NASA Mars Exploration Rovers (Spirit & Opportunity) & MSL Navcam",
      badgeTitle: "Real NASA Science",
      explanation:
        "In 2005, NASA's Spirit rover was near death with dust-covered panels when a Martian dust devil swept directly overhead, miraculously scouring the glass clean and boosting power by 30 MW ('cleaning events'). However, Martian dust devils also generate up to 20 kV/m triboelectric static voltages that can arc into ungrounded electronic buses.",
      dataSourceUrl: "https://mars.nasa.gov/mer/spotlight/spirit_dustdevil.html",
    },
    choices: [
      {
        id: "risk_vortex_cleaning",
        label: "Leave Panels Exposed to Catch Wind Cleaning Event",
        shortTag: "Wind Cleaning",
        description:
          "Do not feather or stow the solar trackers. Allow the vortex to vacuum the dust off the solar cells, accepting minor static discharge risks.",
        tradeOffSummary: "Solar Efficiency +20 MW Permanent Bonus, Power Grid Health −6%",
        effects: {
          powerDeltaMW: 20,
          powerGridHealthDelta: -6,
          moraleDelta: 8,
        },
        engineeringTakeaway:
          "You took a high-stakes gamble on Martian meteorology, earning a massive +20 MW solar cleaning bonus identical to Spirit's 2005 breakthrough.",
      },
      {
        id: "ground_and_stow_arrays",
        label: "Ground Arrays & Stow Panels in Aerodynamic Lock",
        shortTag: "Protective Stow",
        description:
          "Rotate panel faces vertically and earth the bus to ground stakes. Completely shields electronics from static arcs, but draws 8 MW to stow.",
        tradeOffSummary: "−8 MW Power Draw, 0 Wear, Grid Health +5%, No Dust Bonus",
        effects: {
          powerDeltaMW: -8,
          powerGridHealthDelta: 5,
        },
        engineeringTakeaway:
          "You chose defensive aerospace conservatism: sacrificing cleaning potential to guarantee zero electrical shock damage.",
      },
      {
        id: "deploy_vortex_baffles",
        label: "Fire Pressurized Gas Jets to Disrupt Vortex Eye",
        shortTag: "Active Baffle",
        description:
          "Vent a high-velocity pulse of compressed atmospheric CO₂ from the storage accumulator to disrupt the vortex core before it hits.",
        tradeOffSummary: "O₂/Gas Buffer −8%, Prevents All Surface Damage, Morale +2",
        effects: {
          oxygenBufferDelta: -8,
          moraleDelta: 2,
        },
        engineeringTakeaway:
          "You deployed active fluid dynamics countermeasures, expending stored buffer gas to protect habitat perimeter integrity.",
      },
    ],
  },
  {
    id: "mars_co2_compressor_freezing",
    environmentId: "mars_gale_crater",
    triggerSol: 5,
    severity: "warning",
    title: "Atmospheric CO₂ Compressor Freezing & Pressure Drop",
    headline: "Night temperature plunges to −95°C; carbon dioxide frost clogs ISRU intake",
    description:
      "A frigid Martian cold snap pushes ambient temperature down to the deposition point of CO₂ (−95°C). Carbon dioxide frost is accumulating on the mechanical compression valves of the habitat's MOXIE oxygen generation system, threatening O₂ production.",
    nasaScience: {
      instrument: "NASA Perseverance MOXIE (Mars Oxygen ISRU Experiment)",
      mission: "NASA Mars 2020 Perseverance Rover",
      badgeTitle: "Real NASA Science",
      explanation:
        "NASA's MOXIE instrument proved human oxygen generation on Mars by ingesting atmospheric CO₂, compressing it, and running Solid Oxide Electrolysis at 800°C to split CO₂ into O₂ and CO. Extreme Martian night freezes require dedicated heaters and thermal insulation around the scroll compressor to prevent cryogenic mechanical seizure.",
      dataSourceUrl: "https://mars.nasa.gov/mars2020/spacecraft/instruments/moxie/",
    },
    choices: [
      {
        id: "thermal_defrost_pulse",
        label: "Direct 16 MW Thermal Defrost Pulse to Intake Scroll",
        shortTag: "Thermal Pulse",
        description:
          "Run auxiliary induction heating coils at maximum thermal output to instantly vaporize dry-ice frost from the intake valves.",
        tradeOffSummary: "−16 MW Power Draw, O₂ Generation Restored to 100%, Systems Safe",
        effects: {
          powerDeltaMW: -16,
          oxygenBufferDelta: 8,
          lifeSupportHealthDelta: 6,
        },
        engineeringTakeaway:
          "You resolved cryogenic mechanical icing with a rapid thermal electrical pulse, ensuring uninterrupted O₂ production.",
      },
      {
        id: "emergency_o2_tanks",
        label: "Switch to Bottled Emergency O₂ Reserve Tanks",
        shortTag: "Bottled O₂",
        description:
          "Shut down the iced ISRU compressor for 24 hours. Feed the crew from pressurized cryogenic oxygen storage bottles brought from Earth.",
        tradeOffSummary: "O₂ Buffer −20%, Conserves 16 MW Power, Life Support Health −8%",
        effects: {
          oxygenBufferDelta: -20,
          lifeSupportHealthDelta: -8,
          moraleDelta: -6,
        },
        engineeringTakeaway:
          "You hoarded electrical power by consuming non-renewable emergency oxygen bottles — a dangerous gamble if future storms hit.",
      },
      {
        id: "reverse_hot_co2_exhaust",
        label: "Reroute Hot Sabatier Exhaust Back to Intake",
        shortTag: "Waste Heat Loop",
        description:
          "Plumb a temporary bypass hose to vent 150°C Sabatier reactor exhaust gas over the frozen intake manifold. Saves power but requires crew EVA in deep cold.",
        tradeOffSummary: "Power Untouched, Crew Morale −12, Radiation +0.4 mSv",
        effects: {
          moraleDelta: -12,
          radiationDeltaMSv: 0.4,
          lifeSupportHealthDelta: 4,
        },
        engineeringTakeaway:
          "You used clever mechanical plumbing and crew grit to bypass electrical power expenditure.",
      },
    ],
  },
  {
    id: "mars_subsurface_perchlorates",
    environmentId: "mars_gale_crater",
    triggerSol: 6,
    severity: "warning",
    title: "Subsurface Perchlorate Brine Infiltration",
    headline: "Toxic perchlorate oxidizer salts detected in hydroponic water reclamation intake",
    description:
      "Automated spectrometers in the habitat greywater loop detect 0.8% magnesium perchlorate (ClO₄⁻) salts leached into the water extraction well. Perchlorates destroy human thyroid function and poison hydroponic crop roots if not separated.",
    nasaScience: {
      instrument: "Phoenix Mars Lander MECA Wet Chemistry Lab & Curiosity SAM",
      mission: "NASA Phoenix Lander / Mars Science Laboratory Curiosity",
      badgeTitle: "Real NASA Science",
      explanation:
        "NASA's Phoenix lander and MSL Curiosity discovered toxic perchlorates everywhere in Martian soil (0.5–1.0%). NASA Ames researchers engineer catalytic bioreactors using specialized perchlorate-reducing bacteria (*Dechloromonas agitata*) and multi-stage reverse osmosis to purify Martian water for human consumption and agriculture.",
      dataSourceUrl: "https://www.nasa.gov/mission_pages/phoenix/news/phx-20080804.html",
    },
    choices: [
      {
        id: "catalytic_purification",
        label: "Engage Multi-Stage Catalytic Dechlorination Filters",
        shortTag: "Catalytic Filter",
        description:
          "Power up the heavy-duty electrochemical catalytic reduction beds. Destroys 99.9% of perchlorate ions, returning pristine drinking water.",
        tradeOffSummary: "−14 MW Power Draw, Life Support Health +10%, Food Reserves +1.5 Days",
        effects: {
          powerDeltaMW: -14,
          lifeSupportHealthDelta: 10,
          foodDaysDelta: 1.5,
          moraleDelta: 4,
        },
        engineeringTakeaway:
          "You invested electrical energy into biochemical purity, securing pristine water for hydroponic agriculture.",
      },
      {
        id: "quarantine_and_ration_water",
        label: "Quarantine Well & Enforce Strict 50% Water Rationing",
        shortTag: "Water Ration",
        description:
          "Cut off the contaminated external well entirely. Rely strictly on internal recycled humidity and ration drinking water for all crew.",
        tradeOffSummary: "Power Preserved, Crew Morale −16, Food Reserves −2.5 Days",
        effects: {
          moraleDelta: -16,
          foodDaysDelta: -2.5,
          lifeSupportHealthDelta: -10,
        },
        engineeringTakeaway:
          "You protected the power grid by imposing harsh hydration and dietary limits on the crew.",
      },
      {
        id: "thermal_pyrolysis_burn",
        label: "Bake Perchlorates into Oxygen Gas via Thermal Flash",
        shortTag: "ISRU Pyrolysis",
        description:
          "Superheat contaminated brine to 450°C. Thermally decomposes perchlorate into magnesium chloride and pure oxygen gas (O₂).",
        tradeOffSummary: "−20 MW Power Surge, O₂ Buffer +12%, Food Days −1.0",
        effects: {
          powerDeltaMW: -20,
          oxygenBufferDelta: 12,
          foodDaysDelta: -1.0,
          lifeSupportHealthDelta: 2,
        },
        engineeringTakeaway:
          "You converted a toxic pollutant into breathable oxygen gas through high-temperature chemical engineering.",
      },
    ],
  },
  {
    id: "mars_gcr_high_flux",
    environmentId: "mars_gale_crater",
    triggerSol: 8,
    severity: "critical",
    title: "Thin-Atmosphere GCR High-Flux Surge",
    headline: "Solar minimum cosmic ray surge bypasses thin 610 Pa carbon dioxide atmosphere",
    description:
      "Curiosity RAD reports a major wave of Galactic Cosmic Rays (GCR) from outside the solar system. With Mars possessing no global magnetic field and only 0.6% of Earth's atmospheric column, high-energy iron and silicon ions are striking the habitat.",
    nasaScience: {
      instrument: "MSL Curiosity RAD (Radiation Assessment Detector)",
      mission: "NASA Mars Science Laboratory / RAD Science Team",
      badgeTitle: "Real NASA Science",
      explanation:
        "NASA's Curiosity RAD proved that an unshielded astronaut on Mars would receive ~0.64 mSv/day, accumulating dangerous career cancer risk limits over 500-day missions. NASA Moon-to-Mars architectures specify active electromagnetic deflection or piling 2 to 3 meters of Martian regolith overburden above habitat modules.",
      dataSourceUrl: "https://mars.nasa.gov/msl/spacecraft/instruments/rad/",
    },
    choices: [
      {
        id: "active_electromagnetic_shield",
        label: "Energize High-Voltage Superconducting Shield Deflector",
        shortTag: "Magnetic Deflector",
        description:
          "Route 22 MW into the habitat's superconducting magnetic field coil to deflect positively charged cosmic ray heavy ions away from the outpost.",
        tradeOffSummary: "−22 MW Power Draw, Shield Integrity +25%, Radiation Dosed = 0 mSv",
        effects: {
          powerDeltaMW: -22,
          shieldingHealthDelta: 25,
          moraleDelta: 6,
        },
        engineeringTakeaway:
          "You maintained an active magnetic bubble around the habitat, defeating galactic cosmic rays at the cost of high electrical draw.",
      },
      {
        id: "regolith_bunker_retreat",
        label: "Retreat Crew to 3-Meter Subsurface Regolith Trench",
        shortTag: "Regolith Trench",
        description:
          "Move all astronauts beneath the excavated regolith bunker. Crew survives with minimal dose, but all exterior surface experiments and rover telemetry are suspended.",
        tradeOffSummary: "Power Untouched, Crew Radiation +0.4 mSv, Morale −8, Grid Health −5%",
        effects: {
          powerGridHealthDelta: -5,
          moraleDelta: -8,
          radiationDeltaMSv: 0.4,
        },
        engineeringTakeaway:
          "You used passive in-situ dirt shielding rather than electrical power, keeping the grid stable while halting scientific productivity.",
      },
      {
        id: "passive_hull_absorption",
        label: "Rely on Nominal Aluminum Hull & Administer Radioprotectants",
        shortTag: "Passive Hull",
        description:
          "Keep all power directed at life support and grid recharging. Crew ingests radioprotective medical countermeasures while absorbing cosmic rays.",
        tradeOffSummary: "Radiation Exposure +4.2 mSv, Power Untouched, Crew Morale −18",
        effects: {
          radiationDeltaMSv: 4.2,
          moraleDelta: -18,
          lifeSupportHealthDelta: 6,
          powerGridHealthDelta: 6,
        },
        engineeringTakeaway:
          "You compromised astronaut radiation health (+4.2 mSv) to keep base industrial operations humming at full throttle.",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// 5 EUROPA UNDER-ICE INCIDENT CARDS (Clipper-Inspired)
// ---------------------------------------------------------------------------

export const EUROPA_INCIDENT_CARDS: IncidentCard[] = [
  {
    id: "europa_jovian_radiation_storm",
    environmentId: "europa_under_ice",
    triggerSol: 2,
    severity: "critical",
    title: "Jupiter Magnetospheric Radiation Storm",
    headline: "Relativistic electrons from Jupiter's radiation belt barrage sub-surface ice crust",
    description:
      "Jupiter's tilted magnetosphere has rotated its dense plasma sheet directly across Europa. While kilometers of solid ice shell absorb primary cosmic rays, secondary Bremsstrahlung gamma rays are penetrating into the station's upper habitat modules. Magnetic deflection coils must be boosted or astronauts must retreat to deep ballast shelters.",
    nasaScience: {
      instrument: "Europa Clipper PIMS & Radiation Monitoring Unit",
      mission: "NASA Europa Clipper (JPL)",
      badgeTitle: "Jovian Magnetosphere Dynamics",
      explanation:
        "Jupiter's magnetic field is 20,000× stronger than Earth's, trapping charged particles in lethal radiation belts. Europa Clipper is equipped with a heavy 150 kg titanium/aluminum vault to shield its sensitive electronics.",
      dataSourceUrl: "https://europa.nasa.gov/mission/spacecraft/",
    },
    choices: [
      {
        id: "overclock_magnetic_coils",
        label: "Overclock Deflection Coils (+15 MW Radiation Shielding)",
        shortTag: "Deflect Radiation",
        description:
          "Divert 15 MW into the superconducting electromagnetic deflector field, repelling charged particles and preventing radiation penetration.",
        tradeOffSummary: "Requires 15 MW power diversion; completely neutralizes Jovian radiation spike.",
        effects: {
          powerDeltaMW: -15,
          radiationDeltaMSv: -2.8,
          shieldingHealthDelta: -5,
          moraleDelta: 5,
        },
        engineeringTakeaway:
          "Active magnetic deflection protected your astronauts from lethal Jovian Bremsstrahlung radiation at a significant electrical cost.",
      },
      {
        id: "retreat_to_ocean_ballast",
        label: "Retreat Crew to Deep-Ocean Water Ballast Bunker",
        shortTag: "Bunker Down",
        description:
          "Confine crew to the cramped lower ocean-ballast pressure chamber, using 10 meters of surrounding seawater as passive shielding without drawing electrical power.",
        tradeOffSummary: "Zero electrical power drain, but crew is cramped for 24 hours (−12 Morale).",
        effects: {
          moraleDelta: -12,
          radiationDeltaMSv: 0.5,
          lifeSupportHealthDelta: -4,
        },
        engineeringTakeaway:
          "Passive seawater shielding saved valuable megawatts, but confinement in cold ballast tanks stressed crew morale.",
      },
      {
        id: "deploy_composite_shutters",
        label: "Deploy Composite Borated Polyethylene Shutters",
        shortTag: "Mechanical Shutters",
        description:
          "Motorize heavy radiation shielding shutters across habitat viewing cupolas and service trunks.",
        tradeOffSummary: "Balanced approach: draws 8 MW, reduces radiation by 70%.",
        effects: {
          powerDeltaMW: -8,
          radiationDeltaMSv: -1.2,
          shieldingHealthDelta: 4,
          moraleDelta: 0,
        },
        engineeringTakeaway:
          "Mechanical shields provided steady secondary radiation mitigation without overstressing the power grid.",
      },
    ],
  },
  {
    id: "europa_hydrothermal_vent_surge_card",
    environmentId: "europa_under_ice",
    triggerSol: 4,
    severity: "opportunity",
    title: "Hydrothermal Cryo-Geothermal Vent Eruption",
    headline: "Seafloor convective thermal plume expands; Stirling generators can tap surge",
    description:
      "Acoustic hydrophones detect a 65°C mineral-rich hydrothermal brine surge along a seafloor tectonic fissure. Station Stirling heat exchangers can tap this natural thermal convection to harvest immense electrical power, but superheated mineral deposition risks clogging primary radiator tubes.",
    nasaScience: {
      instrument: "Europa Clipper MASPEX & REASON Sounder",
      mission: "NASA Europa Clipper / Astrobiology",
      badgeTitle: "Seafloor Hydrothermal Chemistry",
      explanation:
        "Tidal dissipation in Europa's rocky core sustains hydrothermal vents similar to Earth's deep ocean 'black smokers', providing continuous chemical and thermal energy independent of sunlight.",
      dataSourceUrl: "https://solarsystem.nasa.gov/moons/jupiter-moons/europa/in-depth/",
    },
    choices: [
      {
        id: "engage_full_geothermal",
        label: "Engage Full Geothermal Heat Recovery (+18 MW Power)",
        shortTag: "Full Geothermal",
        description:
          "Open all cryo-turbines to superheated brine flow, capturing a massive +18 MW electrical surge while accepting minor mineral scaling.",
        tradeOffSummary: "Enormous power surge (+18 MW), but increases power grid wear (+0.08).",
        effects: {
          powerDeltaMW: 18,
          powerGridHealthDelta: -6,
          moraleDelta: 8,
        },
        engineeringTakeaway:
          "You capitalized on Europa's internal heat engine to generate clean baseload energy, balancing hardware wear against abundant power.",
      },
      {
        id: "divert_to_eclss_electrolysis",
        label: "Divert Plume to ECLSS Water Electrolysis (+20% O₂ Buffer)",
        shortTag: "Electrolyze Brine",
        description:
          "Channel heated steam through solid-oxide electrolysis units, splitting hydrothermal water into pure breathable O₂ and hydrogen fuel.",
        tradeOffSummary: "Boosts O₂ buffer (+20%) and adds moderate power (+6 MW).",
        effects: {
          powerDeltaMW: 6,
          oxygenBufferDelta: 20,
          lifeSupportHealthDelta: 8,
          moraleDelta: 6,
        },
        engineeringTakeaway:
          "Converting geothermal heat directly into life support reserves permanently bolstered outpost life expectancy.",
      },
      {
        id: "maintain_safe_flow",
        label: "Throttle Wellhead to Conservative Baseline",
        shortTag: "Safe Throttle",
        description:
          "Maintain calibrated intake velocity to prevent mineral scaling and avoid any turbine stress.",
        tradeOffSummary: "Safe baseline: +5 MW bonus, zero hardware wear.",
        effects: {
          powerDeltaMW: 5,
          moraleDelta: 2,
        },
        engineeringTakeaway:
          "Conservative engineering preserved turbine longevity at the expense of a potential power windfall.",
      },
    ],
  },
  {
    id: "europa_ice_crust_tension_fracture",
    environmentId: "europa_under_ice",
    triggerSol: 6,
    severity: "warning",
    title: "Tidal Ice Shell Crevasse Fracture",
    headline: "Laplace orbital resonance triggers seismic shear along station anchor pylons",
    description:
      "Europa's 30-meter diurnal tidal bulge has propagated a high-strain tension fissure through the ice ceiling directly above Habitat Module 1. Without thermal melting or mechanical stabilization, expanding ice will crush the titanium habitat collar.",
    nasaScience: {
      instrument: "Europa Clipper REASON Radar & MISE Spectrometer",
      mission: "NASA Europa Clipper (Univ. of Texas / JPL)",
      badgeTitle: "Ice Shell Tectonics & Lineae",
      explanation:
        "Europa's surface is scored with thousands of intersecting cycloidal fractures (lineae) driven by diurnal gravitational stress from Jupiter. REASON radar soundings map how these fractures penetrate into the subsurface ocean.",
      dataSourceUrl: "https://www.jpl.nasa.gov/missions/europa-clipper/science-instruments/reason",
    },
    choices: [
      {
        id: "pulse_thermal_trusses",
        label: "Pulse Thermal Trusses to Flash-Melt & Re-Freeze Sealant Ice",
        shortTag: "Thermal Weld",
        description:
          "Pump 12 MW into external heating coils, melting a slurry barrier that flash-freezes under vacuum to fuse the crevasse closed.",
        tradeOffSummary: "Draws 12 MW power, but permanently secures the habitat structure.",
        effects: {
          powerDeltaMW: -12,
          lifeSupportHealthDelta: 12,
          shieldingHealthDelta: 8,
          moraleDelta: 5,
        },
        engineeringTakeaway:
          "You used cryogenic phase-change physics to turn Europa's freezing ice into a self-healing structural shield.",
      },
      {
        id: "deploy_titanium_anchor_struts",
        label: "Deploy Hydraulic Titanium Tension Struts",
        shortTag: "Structural Struts",
        description:
          "Extend automated mechanical struts to absorb tectonic shear and anchor the module into solid ice bedrock.",
        tradeOffSummary: "Consumes 7 MW grid power, halts structural deformation.",
        effects: {
          powerDeltaMW: -7,
          powerGridHealthDelta: -4,
          lifeSupportHealthDelta: 4,
        },
        engineeringTakeaway:
          "Mechanical reinforcement arrested ice displacement with minimal electrical disruption.",
      },
      {
        id: "evacuate_module_1",
        label: "Evacuate Module 1 & Isolate Bulkhead Doors",
        shortTag: "Evacuate Module",
        description:
          "Depressurize the affected module and crowd astronauts into the central hub.",
        tradeOffSummary: "Zero power spent, but reduces habitat living volume and crew morale (−14 Morale).",
        effects: {
          moraleDelta: -14,
          lifeSupportHealthDelta: -8,
        },
        engineeringTakeaway:
          "Zero-cost operational isolation preserved electrical power but severely impacted astronaut psychological comfort.",
      },
    ],
  },
  {
    id: "europa_cryo_brine_salinity_short",
    environmentId: "europa_under_ice",
    triggerSol: 8,
    severity: "warning",
    title: "Magnesium Sulfate Ocean Brine Incursion",
    headline: "High-conductivity saline ocean water leaks into secondary thermal exchanger",
    description:
      "Subsurface ocean water has an electrical conductivity of ~2.5 S/m due to dissolved magnesium sulfate (MgSO₄) and sodium salts. A microscopic weep has introduced conductive brine into the primary electrical bus conduit.",
    nasaScience: {
      instrument: "Europa Clipper PIMS & SUDA Surface Dust Analyzer",
      mission: "NASA Europa Clipper (LASP / JPL)",
      badgeTitle: "Ocean Salinity & Composition",
      explanation:
        "Galileo and Clipper measurements of Europa's induced magnetic dipole moment prove the ocean is salty and electrically conductive, comparable to Earth's oceans.",
      dataSourceUrl: "https://europa.nasa.gov/mission/science/",
    },
    choices: [
      {
        id: "electrolytic_desalination",
        label: "Electrolytic Desalination & Vacuum Bakeout (-8 MW Power)",
        shortTag: "Electrolytic Desal",
        description:
          "Run reverse osmosis and vacuum bakeout to boil away saline brine and restore electrical insulation.",
        tradeOffSummary: "Draws 8 MW power, restores power grid health (+12).",
        effects: {
          powerDeltaMW: -8,
          powerGridHealthDelta: 12,
          shieldingHealthDelta: 4,
        },
        engineeringTakeaway:
          "Electrolytic purification prevented short-circuits and stabilized the high-voltage distribution network.",
      },
      {
        id: "isolate_to_backup_rtg",
        label: "Isolate Circuit & Reroute to Backup RTG Shunt",
        shortTag: "Reroute Bus",
        description:
          "Permanently quarantine the flooded junction box and route vital circuits through the secondary RTG bus.",
        tradeOffSummary: "Draws 5 MW, prevents short-circuit risks with minimal downtime.",
        effects: {
          powerDeltaMW: -5,
          powerGridHealthDelta: 4,
          moraleDelta: 0,
        },
        engineeringTakeaway:
          "Pragmatic bus reconfiguration isolated electrical hazards without requiring immediate physical repairs.",
      },
      {
        id: "harvest_salts_hydroponics",
        label: "Harvest Dissolved Salts for Hydroponic Mineral Nutrients",
        shortTag: "Harvest Salts",
        description:
          "Precipitate mineral salts into greenhouse water tanks as vital magnesium and sulfur crop nutrients.",
        tradeOffSummary: "Adds +2 days food reserve, but causes minor electrical wear (−5 Grid Health).",
        effects: {
          foodDaysDelta: 2,
          powerGridHealthDelta: -5,
          moraleDelta: 4,
        },
        engineeringTakeaway:
          "Creative chemical recycling turned hazardous seawater leakage into life-giving agricultural fertilizer.",
      },
    ],
  },
  {
    id: "europa_deep_ocean_biosignature_echo",
    environmentId: "europa_under_ice",
    triggerSol: 10,
    severity: "opportunity",
    title: "Hydrothermal Biosignature Discovery",
    headline: "MASPEX spectrometer detects amino-acid fragments in cryo-vent gas",
    description:
      "An automated autonomous underwater rover docked at the lower ice airlock returns samples from a deep hydrothermal vent. MASPEX chromatography reveals chirally biased amino acid chains, metabolic methane spikes, and lipid polymers!",
    nasaScience: {
      instrument: "Europa Clipper MASPEX Mass Spectrometer",
      mission: "NASA Europa Clipper / Southwest Research Institute",
      badgeTitle: "Ocean World Biosignatures",
      explanation:
        "MASPEX has high enough resolving power (m/Δm > 20,000) to distinguish structural isomers of complex amino acids and determine if organic compounds were formed abiotically or by alien biology.",
      dataSourceUrl: "https://www.swri.org/press-release/swri-built-spectrometer-arrives-at-jpl-for-europa-clipper",
    },
    choices: [
      {
        id: "full_genomic_sequencing",
        label: "Divert Station Supercomputer Bus to Full Genomic Sequencing",
        shortTag: "DNA Sequencing",
        description:
          "Allocate 14 MW to high-throughput nanopore sequencing, confirming whether the genetic code mirrors Earth biology.",
        tradeOffSummary: "Draws 14 MW power, sky-rockets crew morale (+25 Morale).",
        effects: {
          powerDeltaMW: -14,
          moraleDelta: 25,
          lifeSupportHealthDelta: 5,
        },
        engineeringTakeaway:
          "Prioritizing pure exploration science rewarded the mission with humanity's greatest discovery: life beyond Earth.",
      },
      {
        id: "deep_freeze_storage",
        label: "Preserve Cryogenic Specimen Vials in Deep Cold Storage",
        shortTag: "Deep Freeze",
        description:
          "Pack biological samples into ultra-pure liquid nitrogen Dewar flasks for safe preservation and return to Earth.",
        tradeOffSummary: "Conserves power (0 MW), provides high scientific and morale yield (+15 Morale).",
        effects: {
          moraleDelta: 15,
          foodDaysDelta: 1,
        },
        engineeringTakeaway:
          "Careful sample containment ensured irreplaceable scientific specimens survived without draining critical station reserves.",
      },
      {
        id: "transmit_dsn_archive",
        label: "Broadcast High-Gain Deep Space Network Telemetry Burst",
        shortTag: "Broadcast DSN",
        description:
          "Point the high-gain steerable dish through the surface ice bore-hole, beaming the data package straight to Earth.",
        tradeOffSummary: "Consumes 8 MW power, boosts crew morale (+20 Morale).",
        effects: {
          powerDeltaMW: -8,
          moraleDelta: 20,
        },
        engineeringTakeaway:
          "Real-time interplanetary telemetry transmission ensured the scientific payload was secured across 600 million kilometers.",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// 5 TITAN HYDROCARBON BASE INCIDENT CARDS (Dragonfly-Inspired)
// ---------------------------------------------------------------------------

export const TITAN_INCIDENT_CARDS: IncidentCard[] = [
  {
    id: "titan_methane_monsoon_flash_flood",
    environmentId: "titan_hydrocarbon",
    triggerSol: 2,
    severity: "warning",
    title: "Methane Monsoon Flash Inundation",
    headline: "Heavy liquid methane downpour floods cryogenic shoreline radiator manifolds",
    description:
      "Cassini and Huygens observations proved Titan experiences intense liquid methane storms. A violent cloudburst is currently dumping supercooled liquid methane (−179°C) across the outpost landing site, chilling electronics down to cryogenic extremes and flooding exterior drainage culverts.",
    nasaScience: {
      instrument: "Cassini ISS & VIMS (Visual and Infrared Mapping Spectrometer)",
      mission: "NASA Cassini / ESA Huygens",
      badgeTitle: "Methane Hydrological Cycle",
      explanation:
        "Titan is the only world other than Earth with an active hydrological cycle — except clouds, rain, rivers, and lakes are made of liquid methane (CH₄) and ethane (C₂H₆).",
      dataSourceUrl: "https://science.nasa.gov/mission/cassini/science/titan/",
    },
    choices: [
      {
        id: "activate_heated_culverts",
        label: "Activate Emergency Heated Drainage Culverts (-10 MW Power)",
        shortTag: "Heated Drainage",
        description:
          "Energize thermal heating tapes along structural footings, redirecting flash runoff safely away from habitat seals.",
        tradeOffSummary: "Requires 10 MW power, protects all structural seals and electronics.",
        effects: {
          powerDeltaMW: -10,
          lifeSupportHealthDelta: 8,
          shieldingHealthDelta: 8,
          moraleDelta: 4,
        },
        engineeringTakeaway:
          "Active thermal management prevented cryogenic cold-embrittlement of structural titanium and composite seals.",
      },
      {
        id: "divert_to_cryo_turbines",
        label: "Divert Runoff Directly into Cryo-Rankine Turbines (+14 MW Power)",
        shortTag: "Harvest Flood",
        description:
          "Harness the rapid hydrostatic flow of freezing methane through shoreline Stirling heat exchangers for massive power generation.",
        tradeOffSummary: "Generates +14 MW power, but causes minor turbine impeller wear (−6 Grid Health).",
        effects: {
          powerDeltaMW: 14,
          powerGridHealthDelta: -6,
          moraleDelta: 6,
        },
        engineeringTakeaway:
          "Transforming a cryogenic natural disaster into an electrical bonanza demonstrated brilliant adaptive engineering.",
      },
      {
        id: "seal_and_idle_exterior",
        label: "Seal Base Exterior & Idle Outer Modules",
        shortTag: "Idle Modules",
        description:
          "Retract all sensors and idle outer airlocks, waiting out the methane storm indoors.",
        tradeOffSummary: "Zero power consumed, but halts scientific activity (−12 Morale).",
        effects: {
          moraleDelta: -12,
          lifeSupportHealthDelta: -5,
        },
        engineeringTakeaway:
          "Passive shelter preserved power reserves while highlighting the psychological toll of prolonged cryogenic isolation.",
      },
    ],
  },
  {
    id: "titan_dragonfly_icing_in_supercooled_fog",
    environmentId: "titan_hydrocarbon",
    triggerSol: 4,
    severity: "critical",
    title: "Dragonfly Rotorcraft Supercooled Fog Icing",
    headline: "Dense nitrogen-methane fog deposits cryogenic rime ice along rotor blades",
    description:
      "NASA Dragonfly's 8 counter-rotating carbon-fiber rotors are returning from a 15 km reconnaissance flight across Shangri-La. Supercooled methane fog has coated the rotor airfoils with thick rime ice, threatening blade stall and loss of the drone.",
    nasaScience: {
      instrument: "NASA Dragonfly Rotorcraft Airframe & DragonCam",
      mission: "NASA Dragonfly (Johns Hopkins APL / NASA Langley)",
      badgeTitle: "Heavy Atmosphere Aerodynamics",
      explanation:
        "Titan's dense air (4× Earth density) enables efficient rotorcraft flight, but cryogenic atmospheric humidity presents unique condensation and icing hazards modeled at NASA Langley.",
      dataSourceUrl: "https://dragonfly.jhuapl.edu/Spacecraft/",
    },
    choices: [
      {
        id: "power_electrothermal_boots",
        label: "Power Electrothermal De-Icing Boots on Rotor Blades (-8 MW)",
        shortTag: "Thermal Boots",
        description:
          "Send 8 MW to embedded resistive heating strips inside Dragonfly's carbon-fiber blades, flashing the ice to vapor.",
        tradeOffSummary: "Draws 8 MW power, completely restores rotorcraft aerodynamics.",
        effects: {
          powerDeltaMW: -8,
          powerGridHealthDelta: 6,
          moraleDelta: 8,
        },
        engineeringTakeaway:
          "Electrothermal blade heating prevented catastrophic drone loss in Titan's dense, freezing atmosphere.",
      },
      {
        id: "park_in_heated_hangar",
        label: "Tether Drone & Emergency Dock in Heated Hangar (-12 MW)",
        shortTag: "Heated Hangar",
        description:
          "Maneuver Dragonfly into the habitat's pressurized airlock bay for a warm thermal soak.",
        tradeOffSummary: "Diverts 12 MW from life support heaters, safe but power-heavy.",
        effects: {
          powerDeltaMW: -12,
          lifeSupportHealthDelta: 4,
          moraleDelta: 10,
        },
        engineeringTakeaway:
          "Bringing sensitive aerospace hardware indoors ensured thorough maintenance at high heating cost.",
      },
      {
        id: "aerodynamic_centrifugal_shedding",
        label: "Execute High-RPM Centrifugal Ice Shedding Maneuver",
        shortTag: "RPM Shedding",
        description:
          "Spin rotors up to maximum RPM on the launch pad to mechanically fracture and fling off ice sheets.",
        tradeOffSummary: "Low power draw (-3 MW), but risks rotor motor bearing fatigue (−8 Grid Health).",
        effects: {
          powerDeltaMW: -3,
          powerGridHealthDelta: -8,
          moraleDelta: 2,
        },
        engineeringTakeaway:
          "Mechanical centrifugal shedding traded mechanical wear on motors for vital electrical conservation.",
      },
    ],
  },
  {
    id: "titan_cryo_rankine_lake_heat_exchanger_slagging",
    environmentId: "titan_hydrocarbon",
    triggerSol: 6,
    severity: "opportunity",
    title: "Kraken Mare Cryogenic Cold Sink Optimization",
    headline: "Lake surface calms; heat rejection efficiency hits theoretical Carnot peak",
    description:
      "Calm liquid surface conditions on Kraken Mare have eliminated wave turbulence. Station engineers can submerge high-surface-area heat exchanger grids into the 94 K liquid methane sink to achieve a 65% thermodynamic Carnot cycle efficiency.",
    nasaScience: {
      instrument: "Cassini RADAR Altimeter & Dragonfly MMRTG",
      mission: "NASA Glenn Research Center / APL",
      badgeTitle: "Cryogenic Thermodynamic Cycles",
      explanation:
        "The extreme temperature differential between an RTG heat source (~200°C) and Titan's ambient liquid methane (−179°C) provides unmatched thermal-to-electric conversion efficiency.",
      dataSourceUrl: "https://rps.nasa.gov/",
    },
    choices: [
      {
        id: "maximize_cryo_flow",
        label: "Maximize Cryo-Heat Rejection Flow (+20 MW Power)",
        shortTag: "Max Cryo Flow",
        description:
          "Open high-flow cryogenic intake valves to achieve maximum thermodynamic ΔT between hot MMRTG and 94 K lake water.",
        tradeOffSummary: "Generates massive +20 MW bonus power, requires 4 MW life support heating.",
        effects: {
          powerDeltaMW: 20,
          lifeSupportHealthDelta: -4,
          moraleDelta: 8,
        },
        engineeringTakeaway:
          "Leveraging Titan's cryogenic lake as an infinite heat sink unlocked world-class thermodynamic power generation.",
      },
      {
        id: "balanced_lake_cooling",
        label: "Maintain Calibrated Medium Intake Flow (+10 MW Power)",
        shortTag: "Balanced Flow",
        description:
          "Pump lake liquid at sustainable baseline rates without chilling structural habitat bulkheads.",
        tradeOffSummary: "Steady +10 MW power, zero system degradation.",
        effects: {
          powerDeltaMW: 10,
          moraleDelta: 4,
        },
        engineeringTakeaway:
          "Moderate cooling captured reliable electrical gains while shielding the habitat from extreme temperature shock.",
      },
      {
        id: "extract_methane_propellant",
        label: "Filter Liquid Methane for Clean Propellant (+15% Buffer, +6 MW)",
        shortTag: "Extract Fuel",
        description:
          "Divert a fraction of the lake flow into refinery storage tanks as cryogenic rocket propellant and reaction buffer.",
        tradeOffSummary: "Yields +15% permanent buffer reserves and +6 MW power.",
        effects: {
          powerDeltaMW: 6,
          oxygenBufferDelta: 15,
          permanentWaterO2Bonus: 0.15,
          moraleDelta: 5,
        },
        engineeringTakeaway:
          "ISRU (In-Situ Resource Utilization) of Titan's vast methane seas created self-sustaining propellant independence.",
      },
    ],
  },
  {
    id: "titan_tholin_electrostatic_arc",
    environmentId: "titan_hydrocarbon",
    triggerSol: 8,
    severity: "warning",
    title: "Tholin Dune Triboelectric Electrostatic Storm",
    headline: "Organic sand friction generates high-voltage static arcs across comms array",
    description:
      "Titan's towering organic sand dunes, composed of complex tholins and solid hydrocarbons, have high electrical resistivity. Wind-blown sand grains rubbing together create static charges up to tens of kilovolts, arcing into the external antenna mast and tripping circuit breakers.",
    nasaScience: {
      instrument: "Cassini RADAR & Laboratory Tholin Triboelectric Tests",
      mission: "NASA / Georgia Tech Astrobiology",
      badgeTitle: "Organic Sand Electrification",
      explanation:
        "Wind tunnel experiments in Titan-equivalent atmospheres show organic sand grains become electrostatically charged when tumbled, sticking together and generating significant static potentials.",
      dataSourceUrl: "https://www.nasa.gov/feature/goddard/2017/titan-sand-clings-together",
    },
    choices: [
      {
        id: "energize_grounding_plane",
        label: "Energize Ionizing Grounding Plane (-8 MW Power Grid)",
        shortTag: "Grounding Grid",
        description:
          "Charge an active copper counter-poise grounding net beneath the sand to safely dissipate static build-up into the sub-crust.",
        tradeOffSummary: "Draws 8 MW power, completely eliminates all electrical arc hazards.",
        effects: {
          powerDeltaMW: -8,
          powerGridHealthDelta: 10,
          shieldingHealthDelta: 6,
          moraleDelta: 4,
        },
        engineeringTakeaway:
          "Active electrical grounding neutralized high-voltage static arcs generated by Titan's dry hydrocarbon dunes.",
      },
      {
        id: "isolate_antenna_hardline",
        label: "Isolate External Comms & Switch to Fiber-Optic Hardlines",
        shortTag: "Fiber Isolation",
        description:
          "Retract metallic antennas and route local telemetry through shielded subterranean optical fibers.",
        tradeOffSummary: "Consumes only 4 MW power, causes minor comms blackout (−6 Morale).",
        effects: {
          powerDeltaMW: -4,
          moraleDelta: -6,
          powerGridHealthDelta: 2,
        },
        engineeringTakeaway:
          "Physical isolation protected sensitive receivers from static over-voltages at minimal energy cost.",
      },
      {
        id: "capacitive_static_harvest",
        label: "Harness Static Arcs into Secondary Capacitors (+8 MW Power)",
        shortTag: "Harvest Static",
        description:
          "Route static lightning discharges through surge arrestors into solid-state capacitor banks to recharge batteries.",
        tradeOffSummary: "Captures +8 MW power, but causes wear on surge suppression coils (−8 Shielding Health).",
        effects: {
          powerDeltaMW: 8,
          shieldingHealthDelta: -8,
          moraleDelta: 5,
        },
        engineeringTakeaway:
          "Audacious electrical engineering converted destructive atmospheric static arcs into usable stored energy.",
      },
    ],
  },
  {
    id: "titan_prebiotic_amino_acid_discovery",
    environmentId: "titan_hydrocarbon",
    triggerSol: 10,
    severity: "opportunity",
    title: "Prebiotic Organic Chemistry Discovery",
    headline: "DraMS mass spectrometer confirms adenine and pyrimidine bases in lakebed mud",
    description:
      "Dragonfly's drill (DrACO) extracts core samples from the Selk Crater impact melt sheet where liquid water mixed with organic hydrocarbons millions of years ago. DraMS mass spectrometry identifies nitrogen heterocycles, purines, and amino acids!",
    nasaScience: {
      instrument: "NASA Dragonfly DraMS & DraGNS",
      mission: "NASA Dragonfly (NASA Goddard / CNES)",
      badgeTitle: "Prebiotic Astrobiology",
      explanation:
        "Titan's surface represents a planetary-scale frozen prebiotic laboratory, preserving organic chemicals that could explain how non-living chemistry transformed into life on early Earth.",
      dataSourceUrl: "https://dragonfly.jhuapl.edu/Science/",
    },
    choices: [
      {
        id: "full_gas_chromatography",
        label: "Initiate Comprehensive Gas Chromatograph Mass Spectrometry (-12 MW)",
        shortTag: "DraMS GCMS",
        description:
          "Allocate 12 MW to DraMS pyrolysis ovens, confirming molecular weights and chiral structures of prebiotic building blocks.",
        tradeOffSummary: "Draws 12 MW power, results in historic scientific triumph (+25 Morale).",
        effects: {
          powerDeltaMW: -12,
          moraleDelta: 25,
          lifeSupportHealthDelta: 6,
        },
        engineeringTakeaway:
          "DraMS mass spectrometry verified that Titan holds the prebiotic chemical blueprints for the emergence of life.",
      },
      {
        id: "deep_freeze_core_samples",
        label: "Deep-Freeze Replicate Core Samples for Earth Return",
        shortTag: "Sample Return",
        description:
          "Store pristine hydrocarbon core drillings in vacuum-sealed cryogenic canisters for future recovery.",
        tradeOffSummary: "Conserves power (0 MW), secures mission legacy and crew satisfaction (+15 Morale).",
        effects: {
          moraleDelta: 15,
          foodDaysDelta: 1,
        },
        engineeringTakeaway:
          "Pristine sample curation guaranteed long-term scientific value without depleting critical operational energy.",
      },
      {
        id: "transmit_planetary_archive",
        label: "Transmit High-Bandwidth Spectral Archive to Earth (-8 MW)",
        shortTag: "Broadcast Data",
        description:
          "Direct high-power X-band radio transmitter at Earth, streaming the complete chemical spectral database.",
        tradeOffSummary: "Consumes 8 MW power, boosts crew pride and mission success score (+20 Morale).",
        effects: {
          powerDeltaMW: -8,
          moraleDelta: 20,
        },
        engineeringTakeaway:
          "Deep space communications secured humanity's access to the groundbreaking organic secrets of Titan.",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export const ALL_INCIDENT_CARDS = [
  ...LUNAR_INCIDENT_CARDS,
  ...MARS_INCIDENT_CARDS,
  ...EUROPA_INCIDENT_CARDS,
  ...TITAN_INCIDENT_CARDS,
];

const INCIDENT_MAP: Record<MissionEnvironmentId, IncidentCard[]> = {
  lunar_south_pole: LUNAR_INCIDENT_CARDS,
  mars_gale_crater: MARS_INCIDENT_CARDS,
  europa_under_ice: EUROPA_INCIDENT_CARDS,
  titan_hydrocarbon: TITAN_INCIDENT_CARDS,
};

export function getSeededIncidentSchedule(
  environmentId: MissionEnvironmentId,
  missionSeed: string
): Record<number, IncidentCard> {
  const baseCards = INCIDENT_MAP[environmentId] || LUNAR_INCIDENT_CARDS;
  const rng = createSeededRNG(`${missionSeed}_incidents_${environmentId}`);

  // Candidate incident sols for this environment
  const candidateSols = baseCards.map((c) => c.triggerSol).sort((a, b) => a - b);
  // Deterministically shuffle cards according to classroom seed
  const shuffledCards = rng.shuffle(baseCards);

  const schedule: Record<number, IncidentCard> = {};
  for (let i = 0; i < candidateSols.length; i++) {
    const sol = candidateSols[i];
    const card = shuffledCards[i % shuffledCards.length];
    schedule[sol] = {
      ...card,
      triggerSol: sol,
    };
  }

  return schedule;
}

export function getIncidentForSol(
  environmentId: MissionEnvironmentId,
  sol: number,
  missionSeed?: string
): IncidentCard | undefined {
  if (missionSeed) {
    const schedule = getSeededIncidentSchedule(environmentId, missionSeed);
    return schedule[sol];
  }
  const cards = INCIDENT_MAP[environmentId] || LUNAR_INCIDENT_CARDS;
  return cards.find((c) => c.triggerSol === sol);
}

export function getIncidentById(id: string): IncidentCard | undefined {
  return ALL_INCIDENT_CARDS.find((c) => c.id === id);
}
