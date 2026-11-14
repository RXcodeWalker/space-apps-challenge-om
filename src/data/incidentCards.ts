// ============================================================
// Incident Cards — Outpost Commander
// 10 NASA-grounded dynamic mid-mission engineering incidents
// (5 Lunar South Pole & 5 Mars Gale Crater)
// ============================================================

import type { MissionEnvironmentId } from "./nasaConstants";

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
// Helpers
// ---------------------------------------------------------------------------

export const ALL_INCIDENT_CARDS = [...LUNAR_INCIDENT_CARDS, ...MARS_INCIDENT_CARDS];

export function getIncidentForSol(
  environmentId: MissionEnvironmentId,
  sol: number
): IncidentCard | undefined {
  const cards = environmentId === "lunar_south_pole" ? LUNAR_INCIDENT_CARDS : MARS_INCIDENT_CARDS;
  return cards.find((c) => c.triggerSol === sol);
}

export function getIncidentById(id: string): IncidentCard | undefined {
  return ALL_INCIDENT_CARDS.find((c) => c.id === id);
}
