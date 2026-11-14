// ============================================================
// NASA Data Constants — Outpost Commander
// All physical parameters sourced from real NASA missions.
// ============================================================

export type MissionEnvironmentId =
  | "lunar_south_pole"
  | "mars_gale_crater"
  | "europa_under_ice"
  | "titan_hydrocarbon";

export interface NasaCitation {
  datasetName: string;
  missionInstrument: string;
  parameter: string;
  value: string;
  kidFriendlyExplanation: string;
  sourceUrl: string;
}

export interface TurnEvent {
  id: string;
  label: string;
  description: string;
  kidFriendlyDescription: string;
  powerDeltaMW: number;         // positive = bonus power; negative = loss
  radiationSpikeMultiplier: number; // 1.0 = baseline; >1 = heightened radiation
  lifeSupportStressFactor: number;  // 1.0 = normal; <1 = easier; >1 = harder
  shieldingWearDelta: number;   // extra wear applied to shielding subsystem (0–1 scale)
}

export interface MissionEnvironment {
  id: MissionEnvironmentId;
  name: string;
  subtitle: string;
  emoji: string;
  backgroundGradient: string;
  basePowerBudgetMW: number;    // total MW available for the outpost
  baselineSolarEfficiency: number; // fraction 0–1
  baselineDailyRadiationMSv: number;
  citations: NasaCitation[];
  turnEvents: TurnEvent[];      // deterministic sequence, one per turn
  kidSummary: string;
  primaryPowerSource?: "solar_fsp" | "cryo_geothermal_rtg" | "mmrtg_methane_cryo";
  atmosphericPressureKPa?: number;
  surfaceTempCelsius?: string;
  gravityG?: number;
}

// ---------------------------------------------------------------------------
// Lunar South Pole — Shackleton Crater Rim
// Primary data sources: NASA LRO Diviner Lunar Radiometer Experiment (DLRE),
// Lunar Orbiter Laser Altimeter (LOLA), LRO Mini-RF & LCROSS mission results.
// ---------------------------------------------------------------------------
const lunarTurnEvents: TurnEvent[] = [
  {
    id: "nominal_start",
    label: "Sol 1 — Nominal Ops",
    description: "All systems nominal. Solar arrays at peak efficiency on the crater rim.",
    kidFriendlyDescription: "Great start! The Sun is shining on the crater rim and all your systems are working perfectly.",
    powerDeltaMW: 0,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 1.0,
    shieldingWearDelta: 0,
  },
  {
    id: "solar_particle_event_minor",
    label: "Sol 2 — Minor Solar Particle Event",
    description: "NOAA Space Weather Center detects an M-class solar flare. Radiation increases 2×. Shielding systems under moderate stress.",
    kidFriendlyDescription: "The Sun just burped out a bunch of tiny fast particles! Your radiation shields need extra power to protect the crew.",
    powerDeltaMW: -5,
    radiationSpikeMultiplier: 2.2,
    lifeSupportStressFactor: 1.0,
    shieldingWearDelta: 0.08,
  },
  {
    id: "water_ice_extraction_bonus",
    label: "Sol 3 — PSR Ice Extraction",
    description: "Rover successfully mines water ice from a Permanently Shadowed Region (PSR). Life support water reserves +20%.",
    kidFriendlyDescription: "Your ice-mining rover found water hiding in the super-cold shadows of the crater! More water means more oxygen for the crew.",
    powerDeltaMW: -8,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 0.8,
    shieldingWearDelta: 0,
  },
  {
    id: "partial_eclipse",
    label: "Sol 4 — Partial Lunar Eclipse",
    description: "Earth occludes partial sunlight reaching the crater rim. Solar panel output drops 35% for this turn. Battery reserves critical.",
    kidFriendlyDescription: "Earth is blocking some of the Sun's light from reaching your solar panels — like a giant shadow! Use your backup batteries wisely.",
    powerDeltaMW: -18,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 1.1,
    shieldingWearDelta: 0,
  },
  {
    id: "micrometeorite_impact",
    label: "Sol 5 — Micrometeorite Strike",
    description: "A micrometeorite impacts a solar panel array. 15 MW generation lost until repairs complete. Shielding and thermal regulation stressed.",
    kidFriendlyDescription: "A tiny space rock hit one of your solar panels! You'll need to fix it, but that takes crew time away from other jobs.",
    powerDeltaMW: -15,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 1.15,
    shieldingWearDelta: 0.12,
  },
  {
    id: "x_class_spe",
    label: "Sol 6 — X-class Solar Particle Event",
    description: "Major X-class solar flare (similar to the 2003 Halloween storms). Radiation spikes 5× baseline. Crew must shelter; shielding systems at maximum load.",
    kidFriendlyDescription: "DANGER! The Sun fired its biggest energy burst! Everyone must hide in the shelter. Your radiation shields are working super hard right now.",
    powerDeltaMW: -10,
    radiationSpikeMultiplier: 5.0,
    lifeSupportStressFactor: 1.3,
    shieldingWearDelta: 0.22,
  },
  {
    id: "rtg_maintenance",
    label: "Sol 7 — RTG Maintenance Window",
    description: "Scheduled maintenance on the Radioisotope Thermoelectric Generator (RTG). Backup power output reduced 10 MW for this sol.",
    kidFriendlyDescription: "It's time to service the nuclear battery (RTG) that keeps the base running at night. Things slow down a bit while the engineers work on it.",
    powerDeltaMW: -10,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 1.0,
    shieldingWearDelta: 0.04,
  },
  {
    id: "thermal_extreme",
    label: "Sol 8 — Extreme Thermal Gradient",
    description: "LRO Diviner data shows a 227°C surface swing this sol (−173°C shadow / +54°C sunlit). Thermal management systems under high load.",
    kidFriendlyDescription: "Half the Moon is freezing cold (−173°C!) and the other half is baking hot (+54°C). Your thermal systems are working overtime to keep the temperature comfortable inside.",
    powerDeltaMW: -12,
    radiationSpikeMultiplier: 1.2,
    lifeSupportStressFactor: 1.2,
    shieldingWearDelta: 0.1,
  },
  {
    id: "hydroponics_milestone",
    label: "Sol 9 — First Lunar Harvest",
    description: "Hydroponics bay produces first crop yield. Crew morale +15%. Food reserves extend mission by an estimated 2 days.",
    kidFriendlyDescription: "Your plants grew food on the Moon! The crew is so happy — eating fresh vegetables in space is amazing. This helps everyone stay healthy and energetic.",
    powerDeltaMW: 0,
    radiationSpikeMultiplier: 0.9,
    lifeSupportStressFactor: 0.75,
    shieldingWearDelta: 0,
  },
  {
    id: "mission_complete_lunar",
    label: "Sol 10 — Mission Evaluation",
    description: "Mission control conducts final systems review. All readings are logged for the science return.",
    kidFriendlyDescription: "It's the last day! Mission Control is checking all your work. Let's see how well you managed the outpost!",
    powerDeltaMW: 0,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 1.0,
    shieldingWearDelta: 0,
  },
];

const lunarCitations: NasaCitation[] = [
  {
    datasetName: "LRO Diviner Lunar Radiometer Experiment (DLRE)",
    missionInstrument: "NASA Lunar Reconnaissance Orbiter / Diviner",
    parameter: "Surface Temperature Range",
    value: "−173°C (PSR) to +54°C (sunlit equatorial peak); crater rim swings ≈ 100°C",
    kidFriendlyExplanation: "The Moon has no air to hold heat, so it swings from super-hot to super-cold. Special craters near the poles stay frozen forever — that's where we find water ice!",
    sourceUrl: "https://diviner.ucla.edu/",
  },
  {
    datasetName: "LRO LOLA (Lunar Orbiter Laser Altimeter) Illumination Maps",
    missionInstrument: "NASA Lunar Reconnaissance Orbiter / LOLA",
    parameter: "Peak Solar Illumination on Shackleton Crater Rim",
    value: "≈ 86% of the year (some peaks receive ~89–94% illumination seasonally)",
    kidFriendlyExplanation: "The tips of the mountains on the crater rim see sunlight almost all year long — that's why they're perfect for solar panels!",
    sourceUrl: "https://lola.gsfc.nasa.gov/",
  },
  {
    datasetName: "LCROSS & LRO Mini-RF Water Ice Detection",
    missionInstrument: "NASA LCROSS Impact Mission / LRO Mini-RF Radar",
    parameter: "Water Ice in Permanently Shadowed Regions (PSRs)",
    value: "5.6% ± 2.9% water by mass in LCROSS debris plume; Mini-RF confirms widespread PSR deposits",
    kidFriendlyExplanation: "Scientists crashed a rocket into the Moon's shadow on purpose and found real water! That water (as ice) could become drinking water or rocket fuel for future astronauts.",
    sourceUrl: "https://www.nasa.gov/mission_pages/LCROSS/main/",
  },
  {
    datasetName: "NASA Space Radiation Environment — Galactic Cosmic Rays (GCR) & SPE",
    missionInstrument: "LRO CRaTER (Cosmic Ray Telescope for the Effects of Radiation)",
    parameter: "Surface Radiation Dose Rate (no magnetosphere/atmosphere)",
    value: "GCR baseline ≈ 0.3 mSv/day; X-class SPE can deliver 1–10 Sv in hours without shielding",
    kidFriendlyExplanation: "The Moon has no magnetic force field or air to block dangerous rays from the Sun and distant stars. Astronauts need thick shielding — like wearing a super-powered invisible suit!",
    sourceUrl: "https://crater.bu.edu/",
  },
];

export const LUNAR_SOUTH_POLE: MissionEnvironment = {
  id: "lunar_south_pole",
  name: "Lunar South Pole",
  subtitle: "Shackleton Crater Rim",
  emoji: "🌕",
  backgroundGradient: "from-slate-900 via-indigo-950 to-slate-800",
  basePowerBudgetMW: 100,
  baselineSolarEfficiency: 0.86,
  baselineDailyRadiationMSv: 0.3,
  citations: lunarCitations,
  turnEvents: lunarTurnEvents,
  kidSummary:
    "The south pole of the Moon is special! Mountaintop rims near Shackleton Crater get sunlight almost all year, and deep icy craters hold frozen water. But there's NO air and NO magnetic shield, so the Sun's radiation is dangerous. You'll need to balance solar power, grow food, and keep the crew safe from solar storms!",
  primaryPowerSource: "solar_fsp",
  atmosphericPressureKPa: 0.0,
  surfaceTempCelsius: "−173°C to +54°C",
  gravityG: 0.166,
};

// ---------------------------------------------------------------------------
// Mars — Gale Crater (MSL Curiosity Rover Site)
// Primary data sources: NASA MSL Curiosity REMS (Rover Environmental
// Monitoring Station) & RAD (Radiation Assessment Detector) instruments.
// ---------------------------------------------------------------------------
const marsTurnEvents: TurnEvent[] = [
  {
    id: "nominal_sol1",
    label: "Sol 1 — Arrival Ops",
    description: "Outpost systems check out nominal. REMS records typical Gale Crater conditions: thin CO₂ atmosphere at 610 Pa.",
    kidFriendlyDescription: "Welcome to Mars! Everything's starting up. The air pressure here is 170 times less than Earth's — but your base keeps you safe inside!",
    powerDeltaMW: 0,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 1.0,
    shieldingWearDelta: 0,
  },
  {
    id: "regional_dust_storm",
    label: "Sol 2 — Regional Dust Storm",
    description: "REMS detects opacity (tau) rising to 2.5. Solar panel efficiency drops 40% as dust coats panels. Similar conditions to 2018 global dust storm that ended Opportunity.",
    kidFriendlyDescription: "A Mars dust storm is blowing! Dust covers your solar panels like a dirty window. You're getting way less power — be careful how you spend it!",
    powerDeltaMW: -22,
    radiationSpikeMultiplier: 0.8,
    lifeSupportStressFactor: 1.2,
    shieldingWearDelta: 0.06,
  },
  {
    id: "perchlorate_soil_discovery",
    label: "Sol 3 — Perchlorate Soil Alert",
    description: "MECA soil analysis detects perchlorate salts (~0.5% by weight). Life support hydroponics require additional filtration power to process safe growing media.",
    kidFriendlyDescription: "The Mars soil contains a chemical called perchlorate that's dangerous for plants. Your life support team needs extra power to filter it out before you can grow food safely.",
    powerDeltaMW: -6,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 1.3,
    shieldingWearDelta: 0,
  },
  {
    id: "solar_flare_thin_atm",
    label: "Sol 4 — Solar Particle Event",
    description: "RAD detects elevated SEP flux. Mars' thin CO₂ atmosphere offers ≈12% the shielding of Earth's atmosphere. Radiation dose rate spikes 3×.",
    kidFriendlyDescription: "The Sun is shooting dangerous particles at Mars! Earth's thick air normally stops most of them, but Mars has very thin air — your radiation shields are really important right now.",
    powerDeltaMW: -8,
    radiationSpikeMultiplier: 3.0,
    lifeSupportStressFactor: 1.1,
    shieldingWearDelta: 0.14,
  },
  {
    id: "co2_frost_cycle",
    label: "Sol 5 — CO₂ Frost Condensation",
    description: "Night temperatures drop to −80°C. CO₂ frost forms on exposed surfaces, increasing thermal load on habitat seals and power lines.",
    kidFriendlyDescription: "Mars gets SO cold at night that the air itself starts to freeze! Your base needs extra heating to prevent cracks, like warming up a frozen water pipe.",
    powerDeltaMW: -14,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 1.15,
    shieldingWearDelta: 0.08,
  },
  {
    id: "global_dust_storm",
    label: "Sol 6 — Global Dust Storm (tau > 8)",
    description: "REMS records opacity above tau 8.0 — a planet-encircling storm like the 2018 event. Solar panel output reduced 70%. RTG/fuel cell backup critical.",
    kidFriendlyDescription: "The biggest kind of Martian dust storm is happening! It covers the WHOLE planet. Your solar panels are almost completely blocked. Time to use backup power very carefully!",
    powerDeltaMW: -38,
    radiationSpikeMultiplier: 0.6,
    lifeSupportStressFactor: 1.4,
    shieldingWearDelta: 0.1,
  },
  {
    id: "subsurface_water_find",
    label: "Sol 7 — Subsurface Hydrated Minerals",
    description: "Ground-penetrating radar detects hydrated sulfate minerals 2 m below the surface. Drilling operation successful; supplemental water source available.",
    kidFriendlyDescription: "Your drill found water hiding underground inside minerals — like squeezing a wet sponge! This is a huge discovery that gives you backup water for the crew.",
    powerDeltaMW: -10,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 0.7,
    shieldingWearDelta: 0,
  },
  {
    id: "storm_clearing",
    label: "Sol 8 — Storm Clearing, Panel Dust-Off",
    description: "Dust storm begins clearing. Crew EVA to clean solar panels (similar to dust-cleaning events observed saving Spirit/Opportunity). Power generation partially restored (+20 MW).",
    kidFriendlyDescription: "The storm is passing! Your crew is going outside in their spacesuits to wipe off the solar panels — just like cleaning dirty windows. Power is coming back!",
    powerDeltaMW: 20,
    radiationSpikeMultiplier: 1.1,
    lifeSupportStressFactor: 1.1,
    shieldingWearDelta: 0.05,
  },
  {
    id: "methane_detection",
    label: "Sol 9 — Methane Spike Detection",
    description: "SAM (Sample Analysis at Mars) detects a methane spike (21 ppbv). Science team excited; life support atmospheric monitors on alert for unexpected chemistry.",
    kidFriendlyDescription: "Your sensors smell something weird — methane gas! On Earth this usually comes from living things, but on Mars we're not sure yet. Scientists are very excited about this mystery!",
    powerDeltaMW: -5,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 1.05,
    shieldingWearDelta: 0,
  },
  {
    id: "mission_complete_mars",
    label: "Sol 10 — Mission Evaluation",
    description: "Mission control conducts final systems review and science data downlink. Earth is currently 20 light-minutes away; all logs transmitted.",
    kidFriendlyDescription: "Last day on Mars! Mission Control is checking all your work — but remember, messages take 20 minutes each way to reach Earth! Let's see how you did.",
    powerDeltaMW: 0,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 1.0,
    shieldingWearDelta: 0,
  },
];

const marsCitations: NasaCitation[] = [
  {
    datasetName: "MSL Curiosity REMS — Surface Atmospheric Pressure",
    missionInstrument: "NASA Mars Science Laboratory / REMS (Rover Environmental Monitoring Station)",
    parameter: "Atmospheric Pressure at Gale Crater Floor",
    value: "~610 Pa average (~0.6% of Earth sea-level pressure of 101,325 Pa)",
    kidFriendlyExplanation: "Mars air is super thin — 170 times less than Earth's! You couldn't breathe it, and it barely protects you from space radiation. Your habitat is like a pressurized submarine on a distant world.",
    sourceUrl: "https://mars.nasa.gov/msl/spacecraft/instruments/rems/",
  },
  {
    datasetName: "MSL Curiosity RAD — Surface Radiation Dose",
    missionInstrument: "NASA Mars Science Laboratory / RAD (Radiation Assessment Detector)",
    parameter: "Average Surface Radiation Dose Rate",
    value: "0.64 mSv/day baseline (Gale Crater); rises to several mSv/day during Solar Particle Events",
    kidFriendlyExplanation: "Every day on Mars you get about twice the radiation dose of someone on Earth. During solar storms it can get much worse — that's why your radiation shield is so important!",
    sourceUrl: "https://mars.nasa.gov/msl/spacecraft/instruments/rad/",
  },
  {
    datasetName: "REMS Dust Opacity (tau) — Dust Storm Monitoring",
    missionInstrument: "NASA MSL Curiosity / MCS & REMS; MRO MCS",
    parameter: "Global Dust Storm Solar Panel Reduction",
    value: "Tau >8.0 reduces solar insolation by 70–98% (2018 global storm ended Opportunity rover at tau ~10.8)",
    kidFriendlyExplanation: "Mars dust storms can block almost all sunlight — imagine putting your solar panels in a dark closet! That's why the 2018 storm was so bad it shut down the Opportunity rover forever.",
    sourceUrl: "https://www.nasa.gov/feature/jpl/opportunity-s-decade-of-mars-exploration-came-to-an-unexpected-end",
  },
  {
    datasetName: "MSL Curiosity SAM — Methane Detection",
    missionInstrument: "NASA MSL Curiosity / SAM (Sample Analysis at Mars)",
    parameter: "Atmospheric Methane Concentration (spike events)",
    value: "21 ppbv (June 2019 peak); background ~0.4 ppbv; seasonal variation observed",
    kidFriendlyExplanation: "Curiosity's 'nose' (a super-sensitive chemistry lab) smelled methane on Mars! On Earth, methane usually comes from animals or microbes. We don't know yet if it means Mars has life — it's one of the biggest mysteries in science!",
    sourceUrl: "https://www.nasa.gov/feature/jpl/curiosity-detects-unusually-high-methane-levels-on-mars",
  },
];

export const MARS_GALE_CRATER: MissionEnvironment = {
  id: "mars_gale_crater",
  name: "Mars",
  subtitle: "Gale Crater — MSL Curiosity Site",
  emoji: "🔴",
  backgroundGradient: "from-red-950 via-orange-950 to-slate-900",
  basePowerBudgetMW: 100,
  baselineSolarEfficiency: 0.6,
  baselineDailyRadiationMSv: 0.64,
  citations: marsCitations,
  turnEvents: marsTurnEvents,
  kidSummary:
    "Gale Crater on Mars is where NASA's Curiosity rover lives! Mars has a super-thin atmosphere (mostly CO₂), giant planet-wide dust storms, and radiation from space. The good news: there's water hiding underground! You'll need to manage power through dust storms, protect your crew from solar bursts, and find clever ways to grow food on the Red Planet.",
  primaryPowerSource: "solar_fsp",
  atmosphericPressureKPa: 0.61,
  surfaceTempCelsius: "−80°C to +20°C",
  gravityG: 0.379,
};

// ---------------------------------------------------------------------------
// Europa Under-Ice Station — Clipper-Inspired Ocean Worlds Outpost
// Primary data sources: NASA Europa Clipper (REASON, PIMS, MASPEX, SUDA, MISE),
// Galileo Magnetometer & JPL Jovian Magnetospheric Environment models.
// ---------------------------------------------------------------------------
const europaTurnEvents: TurnEvent[] = [
  {
    id: "europa_subsurface_sync",
    label: "Sol 1 — Sub-Surface Ops & RTG Sync",
    description: "Outpost initialized 15 km beneath Europa's chaotic ice shell. Sealed cryo-geothermal exchangers and next-gen RTG arrays sync at 85 MW baseload. Zero solar flux penetrates the ice.",
    kidFriendlyDescription: "You've landed deep under the icy shell of Jupiter's moon Europa! It's completely dark under miles of solid ice, so you have zero solar power — but your nuclear RTG batteries and hot hydrothermal seafloor heat keep you warm!",
    powerDeltaMW: 0,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 1.0,
    shieldingWearDelta: 0,
  },
  {
    id: "europa_jovian_plasma_crossing",
    label: "Sol 2 — Jovian Plasma Sheet Crossing",
    description: "Jupiter's tilted magnetic field swings its dense co-rotating magnetospheric plasma sheet across Europa. Radiation dose rate spikes 4.2×. Superconducting deflection coils require maximum power.",
    kidFriendlyDescription: "Giant Jupiter just swung a wave of supercharged space radiation right at Europa! Your magnetic force fields need heavy power right now to shield the crew.",
    powerDeltaMW: -6,
    radiationSpikeMultiplier: 4.2,
    lifeSupportStressFactor: 1.1,
    shieldingWearDelta: 0.12,
  },
  {
    id: "europa_hydrothermal_vent_surge",
    label: "Sol 3 — Hydrothermal Vent Plume Surge",
    description: "REASON ice-sounding radar detects deep ocean convection plume. Cryo-geothermal Stirling turbines capture boiling mineral brine, generating an extra +18 MW of clean geothermal energy.",
    kidFriendlyDescription: "Hot underwater ocean geysers just surged beneath the ice! Your cryo-geothermal generators captured the boiling steam, giving your station a giant +18 MW power boost!",
    powerDeltaMW: 18,
    radiationSpikeMultiplier: 0.9,
    lifeSupportStressFactor: 0.9,
    shieldingWearDelta: 0,
  },
  {
    id: "europa_tidal_flexing_strain",
    label: "Sol 4 — Laplace Resonance Tidal Flexing",
    description: "Orbital resonance with Io and Ganymede produces intense gravitational tidal flexing. The ice shell groans and shifts; active heating loops must melt expanding ice blockages along structural trusses.",
    kidFriendlyDescription: "Jupiter and its sibling moons are pulling Europa like a rubber band! The ice walls are shifting and squeezing your station, requiring emergency heating power to keep structural seams intact.",
    powerDeltaMW: -10,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 1.35,
    shieldingWearDelta: 0.08,
  },
  {
    id: "europa_io_flux_tube_induction",
    label: "Sol 5 — Io Flux Tube Magnetic Coupling",
    description: "Europa intersects the Jovian auroral flux tube. Mega-ampere induction currents surge through the conductive salty ocean, causing electrical oscillations across the habitat transformer buses.",
    kidFriendlyDescription: "A massive invisible electric highway from volcanic Io zaps through Jupiter's magnetic field! Sparks jump across power lines, demanding tight grid regulation.",
    powerDeltaMW: -14,
    radiationSpikeMultiplier: 2.6,
    lifeSupportStressFactor: 1.2,
    shieldingWearDelta: 0.10,
  },
  {
    id: "europa_radiolytic_oxygen_harvest",
    label: "Sol 6 — Cryo-Plume Volatile Extraction",
    description: "Automated cryo-harvesters tap sub-ice pockets of radiolytic oxidants (H₂O₂ & O₂) produced by Jovian irradiation of surface ice, giving ECLSS an abundance of pure breathable oxygen.",
    kidFriendlyDescription: "Your exploration rovers found trapped pockets of natural oxygen formed by radiation on the surface ice! Your life support tanks fill with crisp, pure air.",
    powerDeltaMW: 5,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 0.7,
    shieldingWearDelta: 0,
  },
  {
    id: "europa_brine_cavitation_shift",
    label: "Sol 7 — Ocean Salinity & Dielectric Shift",
    description: "High-salinity magnesium sulfate brine shifts the dielectric constant in the primary radiator loops. Impeller cavitation temporarily throttles heat rejection by 15%.",
    kidFriendlyDescription: "Salty ocean mineral water is eroding the cooling pump blades. Your engineers need extra power to filter the salt and prevent the engines from overheating.",
    powerDeltaMW: -12,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 1.25,
    shieldingWearDelta: 0.07,
  },
  {
    id: "europa_heavy_ion_belt_peak",
    label: "Sol 8 — Jovian Trapped Ion Belt Peak",
    description: "PIMS instruments detect a severe surge in trapped energetic sulfur and oxygen ions. Secondary bremsstrahlung X-rays penetrate upper ice bulkheads; radiation spikes 5.0×.",
    kidFriendlyDescription: "RED ALERT: Jupiter's most intense radiation belt has swept over the moon! Secondary X-rays are piercing the outer ice crust. Divert maximum power to magnetic shielding immediately!",
    powerDeltaMW: -8,
    radiationSpikeMultiplier: 5.0,
    lifeSupportStressFactor: 1.3,
    shieldingWearDelta: 0.16,
  },
  {
    id: "europa_radar_deep_sounding",
    label: "Sol 9 — REASON Ice Sounding Deep Scan",
    description: "Europa Clipper REASON radar conducts high-frequency ice-penetrating radar sounding, mapping 30 km of internal ice-ocean interfaces and requiring high continuous RF broadcast power.",
    kidFriendlyDescription: "The science crew is firing high-power radar beams straight through miles of solid ice to create a 3D map of the hidden alien ocean! It drains a lot of power, but the data is priceless.",
    powerDeltaMW: -15,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 1.1,
    shieldingWearDelta: 0.04,
  },
  {
    id: "europa_ocean_biosignature_discovery",
    label: "Sol 10 — Hydrothermal Biosignature Discovery",
    description: "MASPEX high-resolution mass spectrometer detects complex amino-acid chains and metabolic methane signatures venting from deep hydrothermal vents! Mission objective accomplished.",
    kidFriendlyDescription: "HISTORIC DISCOVERY! The robot chemistry lab discovered complex organic chemicals venting from warm seafloor geysers! Europa's hidden ocean might truly harbor alien life!",
    powerDeltaMW: 8,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 0.8,
    shieldingWearDelta: 0,
  },
];

const europaCitations: NasaCitation[] = [
  {
    datasetName: "Europa Clipper REASON — Ice Penetrating Radar",
    missionInstrument: "NASA Europa Clipper / REASON (Radar for Europa Assessment and Sounding: Ocean to Near-surface)",
    parameter: "Ice Shell Thickness & Ocean Interface Detection",
    value: "Dual-frequency radar (9 MHz & 60 MHz) profiling 15–25 km ice shell and sub-surface water pockets",
    kidFriendlyExplanation: "Radar beams see right through miles of frozen ice, just like an X-ray sees through human skin! It proves that a liquid ocean 2 times bigger than all of Earth's oceans combined is hiding underneath.",
    sourceUrl: "https://www.jpl.nasa.gov/missions/europa-clipper/science-instruments/reason",
  },
  {
    datasetName: "Europa Clipper PIMS — Plasma & Magnetic Sounding",
    missionInstrument: "NASA Europa Clipper / PIMS (Plasma Instrument for Magnetic Sounding)",
    parameter: "Induced Magnetic Field & Jovian Plasma Flow",
    value: "Characterizes Jupiter's 428 µT equatorial magnetic field and Europa's induced ocean eddy currents (~2.5 S/m electrical conductivity)",
    kidFriendlyExplanation: "Jupiter has a magnetic field 20,000 times stronger than Earth's! When it washes over Europa's salty water, the salt water makes its own magnetic field. PIMS measures this to tell us how deep and salty the hidden ocean is.",
    sourceUrl: "https://www.jpl.nasa.gov/missions/europa-clipper/science-instruments/pims",
  },
  {
    datasetName: "Europa Clipper MASPEX — Mass Spectrometry of Volatiles",
    missionInstrument: "NASA Europa Clipper / MASPEX (Mass Spectrometer for Planetary Exploration)",
    parameter: "Subsurface Volatiles & Organic Resolving Power",
    value: "Mass resolution m/Δm > 20,000; detects isotope ratios (D/H, 12C/13C) and organic fragments in cryovolcanic plumes",
    kidFriendlyExplanation: "MASPEX is like a super-magnifying glass for atoms! It can sniff out tiny organic chemicals, amino acids, and gases erupting from the ice to see if the ocean is habitable for life.",
    sourceUrl: "https://www.jpl.nasa.gov/missions/europa-clipper/science-instruments/maspex",
  },
  {
    datasetName: "Jovian Magnetosphere Trapped Radiation Belt",
    missionInstrument: "NASA Galileo EPD & Europa Clipper Radiation Monitoring System",
    parameter: "Unshielded Surface Ionizing Dose Rate",
    value: "Surface dose rate ~540 mSv/day (54 rad/day); drops to 1.8 mSv/day behind 10+ meters of water ice equivalent shielding",
    kidFriendlyExplanation: "Jupiter's radiation belts trap super-speed particles that would be lethal on the surface in days. But under deep ice, astronauts are shielded just like being in a bunker — though magnetic fields are still needed during storm peaks!",
    sourceUrl: "https://europa.nasa.gov/mission/science/",
  },
  {
    datasetName: "Tidal Dissipation & Geothermal Baseload",
    missionInstrument: "NASA Astrobiology & Galileo Orbital Mechanics / Thermal Models",
    parameter: "Seafloor Cryo-Geothermal Heat Flux",
    value: "Tidal dissipation in silicate mantle generates ~1.0–1.5 TW (~20–40 mW/m²) of sustained hydrothermal heat flux",
    kidFriendlyExplanation: "Even though Europa is 5 times farther from the Sun than Earth and gets zero sunlight under the ice, Jupiter's gravity constantly squeezes the moon's core, creating hot underwater volcanoes that power our base!",
    sourceUrl: "https://solarsystem.nasa.gov/moons/jupiter-moons/europa/in-depth/",
  },
];

export const EUROPA_UNDER_ICE: MissionEnvironment = {
  id: "europa_under_ice",
  name: "Europa",
  subtitle: "Under-Ice Station — Clipper-Inspired",
  emoji: "❄️",
  backgroundGradient: "from-cyan-950 via-blue-950 to-slate-950",
  basePowerBudgetMW: 100,
  baselineSolarEfficiency: 0.0, // Zero solar flux beneath kilometers of ice
  baselineDailyRadiationMSv: 1.8, // Shielded under ice, but Jovian magnetosphere surges
  citations: europaCitations,
  turnEvents: europaTurnEvents,
  kidSummary:
    "Europa is Jupiter's incredible ice moon! Miles beneath the frozen crust lies an enormous warm salt ocean with more water than all Earth's oceans combined. Because you're deep under ice, there is ZERO sunlight — your base runs on hot underwater volcanic vents and nuclear RTG batteries. Watch out for Jupiter's intense radiation storms and keep your magnetic force fields humming!",
  primaryPowerSource: "cryo_geothermal_rtg",
  atmosphericPressureKPa: 0.0000001, // Vacuum / trace O2 atmosphere
  surfaceTempCelsius: "−173°C to −13°C",
  gravityG: 0.134,
};

// ---------------------------------------------------------------------------
// Titan Hydrocarbon Base — Dragonfly-Inspired Ocean Worlds Outpost
// Primary data sources: NASA Dragonfly (DraMS, DraGMet, DraGNS, DragonCam),
// Cassini-Huygens HASI, DISR, RADAR & VIMS instruments.
// ---------------------------------------------------------------------------
const titanTurnEvents: TurnEvent[] = [
  {
    id: "titan_arrival_ops",
    label: "Sol 1 — Dragonfly Base Touchdown",
    description: "Outpost established along the shore of Kraken Mare. Atmospheric pressure is 146.7 kPa (1.45 bar, 4× denser air than Earth). Surface temperature is −179°C (94 K). MMRTG and cryogenic lake heat exchanger nominal.",
    kidFriendlyDescription: "Welcome to Titan, Saturn's giant moon! The air here is so thick you could strap fake wings to your arms and fly like a bird! It's freezing cold (−179°C), with lakes of liquid methane all around.",
    powerDeltaMW: 0,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 1.0,
    shieldingWearDelta: 0,
  },
  {
    id: "titan_tholin_smog_peak",
    label: "Sol 2 — Dense Photochemical Tholin Smog",
    description: "Upper atmospheric photochemistry generates thick organic tholin smog. Solar irradiance drops from 1.0 W/m² to near zero. Baseline reliance shifts 100% to MMRTG and cryogenic lake Rankine cycles.",
    kidFriendlyDescription: "A thick orange smog has gathered in Titan's sky! The Sun looks like a faint lightbulb in a foggy room. Solar power is totally useless here — good thing we brought nuclear RTGs and cold lake power generators!",
    powerDeltaMW: -5,
    radiationSpikeMultiplier: 0.7,
    lifeSupportStressFactor: 1.15,
    shieldingWearDelta: 0.02,
  },
  {
    id: "titan_kraken_mare_carnot_surge",
    label: "Sol 3 — Cryogenic Lake Thermal Sink Surge",
    description: "Shoreline cryogenic pumps tap Kraken Mare liquid methane at 94 K. The massive temperature differential (ΔT > 180°C) against MMRTG waste heat drives a high-efficiency Stirling-Rankine cycle, producing +22 MW bonus power!",
    kidFriendlyDescription: "Your engineers connected heat pipes into the freezing methane lake! Because the lake is super cold (−179°C) and our engine is hot, physics gives us an enormous +22 MW power surge for free!",
    powerDeltaMW: 22,
    radiationSpikeMultiplier: 0.9,
    lifeSupportStressFactor: 0.9,
    shieldingWearDelta: 0,
  },
  {
    id: "titan_methane_monsoon_downpour",
    label: "Sol 4 — Methane Monsoon Downpour",
    description: "Atmospheric methane clouds produce a violent cryogenic downpour. Flash hydrocarbon runoff drenches exterior heat sinks; dense droplets pull structural seals down to −182°C.",
    kidFriendlyDescription: "It's raining liquid methane! Giant raindrops fall in slow motion because of low gravity. Flash floods of liquid natural gas are chilling our base seals — turn up the heaters!",
    powerDeltaMW: -16,
    radiationSpikeMultiplier: 0.5,
    lifeSupportStressFactor: 1.4,
    shieldingWearDelta: 0.10,
  },
  {
    id: "titan_dragonfly_aerial_sortie",
    label: "Sol 5 — Dragonfly Aerial Reconnaissance",
    description: "Dragonfly octocopter completes an autonomous 15 km aerial flight across the Shangri-La hydrocarbon dunes, pinpointing high-grade organic deposits and mapping regional weather fronts.",
    kidFriendlyDescription: "The Dragonfly drone just flew a 15-kilometer loop through the orange skies! Its cameras and sensors found safe travel routes and rich mineral deposits.",
    powerDeltaMW: 10,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 0.85,
    shieldingWearDelta: 0,
  },
  {
    id: "titan_cryo_turbine_cavitation",
    label: "Sol 6 — Cryo-Turbine Impeller Cavitation",
    description: "Liquid ethane currents create vortex bubbles and cavitation across the lake intake manifolds. Pumps must be throttled down to prevent cryogenic blade fatigue.",
    kidFriendlyDescription: "Freezing liquid ethane bubbles are vibrating inside the lake water intake pipes. Your engineers need extra power to defrost and clear the impellers.",
    powerDeltaMW: -14,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 1.2,
    shieldingWearDelta: 0.08,
  },
  {
    id: "titan_polar_vortex_cold_snap",
    label: "Sol 7 — Polar Vortex Cold Snap (−183°C)",
    description: "Dense nitrogen-methane winds bring a severe cryogenic temperature drop to −183°C (90 Kelvin). Convective heat loss to the 1.45 bar atmosphere accelerates; thermal loops demand maximum heating power.",
    kidFriendlyDescription: "Brrr! A cryogenic polar blizzard just rolled in, dropping temperatures to −183°C! The thick air sucks heat out of our walls 4 times faster than on Earth. Keep the heating systems blaring!",
    powerDeltaMW: -12,
    radiationSpikeMultiplier: 0.8,
    lifeSupportStressFactor: 1.35,
    shieldingWearDelta: 0.09,
  },
  {
    id: "titan_organic_dune_electrostatics",
    label: "Sol 8 — Tholin Dune Electrostatic Storm",
    description: "Dry winds blow tholin-coated organic hydrocarbon sands. High dielectric friction generates high-voltage triboelectric arcs, disrupting RF comms and drawing surge-suppression power.",
    kidFriendlyDescription: "The giant orange sand dunes are rubbing together in the wind, creating crackling static electricity lightning sparks across our antennas!",
    powerDeltaMW: -8,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 1.1,
    shieldingWearDelta: 0.12,
  },
  {
    id: "titan_cryovolcanic_slush_eruption",
    label: "Sol 9 — Sotra Patera Ammonia Slush Incursion",
    description: "Nearby cryovolcano vents a warm water-ammonia slurry from Titan's subsurface ocean. ECLSS filters tap the effluent, extracting abundant ammonia for hydroponic fertilizer.",
    kidFriendlyDescription: "An ice volcano just erupted nearby! Instead of hot lava, it spews freezing water-ammonia slush from deep underground. Your life support team extracts rich fertilizer to grow huge fresh crops!",
    powerDeltaMW: 6,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 0.7,
    shieldingWearDelta: 0,
  },
  {
    id: "titan_prebiotic_synthesis_milestone",
    label: "Sol 10 — Prebiotic Organic Synthesis Discovery",
    description: "DraMS mass spectrometer analyzes lakebed sediments, confirming complex organic macromolecules, polycyclic aromatic hydrocarbons, and prebiotic nitrogenous bases! Mission triumph.",
    kidFriendlyDescription: "AMAZING SCIENCE! Dragonfly's chemistry lab discovered the building blocks of life — complex organic molecules and amino acid ingredients — inside Titan's lakes! You proved ocean worlds hold secrets to the origins of life!",
    powerDeltaMW: 12,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 0.75,
    shieldingWearDelta: 0,
  },
];

const titanCitations: NasaCitation[] = [
  {
    datasetName: "NASA Dragonfly Rotorcraft Mission & DraMS Payload",
    missionInstrument: "NASA Dragonfly / DraMS (Dragonfly Mass Spectrometer) & DraGNS",
    parameter: "Autonomous Rotorcraft Flight in Dense Atmosphere",
    value: "Dual-quadcopter nuclear rotorcraft; 1.45 bar atmosphere (density 5.4 kg/m³) with 0.138 g gravity enables 38× higher lift-to-power efficiency than Earth",
    kidFriendlyExplanation: "Dragonfly is a nuclear-powered flying robot with 8 giant propellers! Because Titan's air is 4 times thicker than Earth's and gravity is weak, flying is effortless — Dragonfly can explore miles of alien terrain in a single flight!",
    sourceUrl: "https://dragonfly.jhuapl.edu/",
  },
  {
    datasetName: "Cassini-Huygens HASI Atmospheric Profile",
    missionInstrument: "ESA/NASA Cassini-Huygens HASI (Huygens Atmospheric Structure Instrument)",
    parameter: "Surface Atmospheric Pressure & Temperature",
    value: "Surface pressure: 146.7 kPa (1.45 atm); surface temperature: 93.7 K (−179.5°C); composition: 95% N₂, 4.9% CH₄, 0.1% H₂",
    kidFriendlyExplanation: "In 2005, the Huygens probe parachuted all the way down to Titan's surface and measured the air! It discovered Titan has a real atmosphere with clouds, rain, and air pressure 50% stronger than Earth's sea level.",
    sourceUrl: "https://www.esa.int/Science_Exploration/Space_Science/Cassini-Huygens",
  },
  {
    datasetName: "Cassini RADAR & VIMS — Hydrocarbon Seas Mapping",
    missionInstrument: "NASA Cassini / RADAR Altimeter & Visual and Infrared Mapping Spectrometer",
    parameter: "Kraken Mare & Ligeia Mare Hydrocarbon Volume",
    value: "Liquid methane/ethane lakes cover >1.6 million km²; Kraken Mare reaches depths >300 m and holds hundreds of times more hydrocarbons than all global oil reserves",
    kidFriendlyExplanation: "Titan is the only place in the solar system besides Earth with open liquid seas and lakes! But instead of water, the lakes are filled with liquid natural gas so clear and cold you could look deep into the abyss.",
    sourceUrl: "https://science.nasa.gov/mission/cassini/science/titan/",
  },
  {
    datasetName: "Dragonfly MMRTG & Cryogenic Thermodynamic Heat Rejection",
    missionInstrument: "NASA Glenn & JPL / Multi-Mission Radioisotope Thermoelectric Generator",
    parameter: "Cryogenic Carnot Efficiency & Baseload",
    value: "70 W_e MMRTG coupled to 94 K liquid methane thermal sink yields theoretical Carnot efficiency η_c = 1 − (94/473) ≈ 80.1%",
    kidFriendlyExplanation: "Power generators love cold weather! When our hot nuclear generator rejects heat into the −179°C cryogenic methane lake, the huge temperature difference generates electricity with world-class efficiency!",
    sourceUrl: "https://rps.nasa.gov/power-and-propulsion-systems/radioisotope-power-systems/mmrtg/",
  },
  {
    datasetName: "Prebiotic Tholin Chemistry & Prebiotic Nitrogen Bases",
    missionInstrument: "Cassini INMS (Ion and Neutral Mass Spectrometer) & NASA Ames Lab Studies",
    parameter: "Complex Organic Aerosols & Amino Acid Precursors",
    value: "Photolysis of N₂ and CH₄ forms tholin haze particles (MW > 1000 Da) which settle into dunes and hydrolyze into amino acids and nucleotide bases",
    kidFriendlyExplanation: "Titan's orange sky acts like a natural organic chemistry laboratory! Sunlight cooks methane and nitrogen into complex molecules that could be the ancient precursors to living cells.",
    sourceUrl: "https://astrobiology.nasa.gov/news/titan-as-a-prebiotic-chemical-laboratory/",
  },
];

export const TITAN_HYDROCARBON: MissionEnvironment = {
  id: "titan_hydrocarbon",
  name: "Titan",
  subtitle: "Hydrocarbon Base — Dragonfly-Inspired",
  emoji: "🪐",
  backgroundGradient: "from-amber-950 via-yellow-950 to-stone-900",
  basePowerBudgetMW: 100,
  baselineSolarEfficiency: 0.01, // Only 1% solar reach through thick orange smog
  baselineDailyRadiationMSv: 0.12, // Thick atmosphere blocks space radiation effectively
  citations: titanCitations,
  turnEvents: titanTurnEvents,
  kidSummary:
    "Titan is Saturn's mysterious giant moon! It is the only moon with a thick, dense atmosphere (1.5× Earth's air pressure) and real lakes of liquid methane like Kraken Mare. It's freezing cold (−179°C), but NASA's Dragonfly octocopter can soar easily through the dense air, and our base turns the freezing cryogenic lakes into massive electrical power using thermodynamic heat engines!",
  primaryPowerSource: "mmrtg_methane_cryo",
  atmosphericPressureKPa: 146.7,
  surfaceTempCelsius: "−179°C",
  gravityG: 0.138,
};

export const MISSION_ENVIRONMENTS: Record<MissionEnvironmentId, MissionEnvironment> = {
  lunar_south_pole: LUNAR_SOUTH_POLE,
  mars_gale_crater: MARS_GALE_CRATER,
  europa_under_ice: EUROPA_UNDER_ICE,
  titan_hydrocarbon: TITAN_HYDROCARBON,
};

export const TOTAL_TURNS = 10;
export const TOTAL_POWER_MW = 100;
export const MIN_SYSTEM_HEALTH = 0;
export const MAX_SYSTEM_HEALTH = 100;

// ---------------------------------------------------------------------------
// NASA Advanced Life Support Baseline Values and Assumptions Document (BVAD)
// Parameters for Surface Habitat Agronomy & Food Production Systems
// ---------------------------------------------------------------------------
export const NASA_BVAD_ASTRONAUT_CALORIES_PER_DAY = 2500; // NASA standard adult metabolic demand
export const OUTPOST_CREW_SIZE = 4; // Expedition crew complement
export const DAILY_CREW_CALORIC_DEMAND = NASA_BVAD_ASTRONAUT_CALORIES_PER_DAY * OUTPOST_CREW_SIZE; // 10,000 kcal/day total
export const GREENHOUSE_BASELINE_POWER_MW = 20; // 20 MW baseline (LED grow lights, aeroponic pumps, atmospheric heaters)
export const GREENHOUSE_THERMAL_SHOCK_THRESHOLD_MW = 10; // <10 MW triggers thermal shock (freezing root zone)
export const GREENHOUSE_THERMAL_SHOCK_PROGRESS_PENALTY = 25; // 25% growth progress loss per Sol in shock
export const HARVEST_CYCLE_SOLS = 3; // 3 Sols from 0% to 100% maturity under adequate power
export const HARVEST_FOOD_RESERVE_DAYS_BONUS = 4; // +4 days food reserve reset/bonus per harvest
export const HARVEST_CREW_MORALE_SURGE = 15; // +15% crew morale surge upon harvesting fresh vegetables
export const HARVEST_YIELD_KG_PER_CYCLE = 16.0; // 16 kg fresh edible biomass per harvest cycle
export const STARVATION_HEALTH_PENALTY_PER_TURN = 15; // -15 crew health/turn when food reserve reaches 0
export const STARVATION_REPAIR_SPEED_PENALTY = 0.20; // -20% subsystem repair speed when starving

