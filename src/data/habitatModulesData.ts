// ============================================================
// habitatModulesData.ts — NASA Habitat Cutaway Modules Data
// Grounded in real NASA missions:
//  - NASA Advanced Plant Habitat (APH) & Veggie (ISS)
//  - Perseverance MOXIE & ISS ECLSS
//  - NASA LRO CRaTER, MSL RAD & Langley Water-Wall Shielding
//  - NASA Kilopower KRUSTY (Los Alamos & NASA Glenn)
//  - NASA Kennedy Electrodynamic Dust Shield (EDS) & Artemis EVA
// Baseline Values and Assumptions Document (BVAD: NASA/TP-2015-218570)
// ============================================================

import type { SubsystemId } from "../engine/simulationEngine";

export type HabitatModuleId =
  | "greenhouse"
  | "life_support"
  | "radiation_shield"
  | "power_core"
  | "airlock";

export interface ModuleProcessStep {
  title: string;
  description: string;
  iconName: string;
}

export interface ModuleJuniorData {
  metaphor: string;
  simpleStory: string;
  funFact: string;
  juniorTakeaway: string;
  processSteps: ModuleProcessStep[];
}

export interface ModuleFormulaData {
  title: string;
  equation: string;
  subEquation?: string;
  description: string;
  variables: { symbol: string; meaning: string; bvadStandard: string }[];
}

export interface ModuleEngineeringData {
  missions: string;
  operatingTemp: string;
  powerConsumption: string;
  inputs: string;
  outputs: string;
  formula: ModuleFormulaData;
  technicalSpecs: Record<string, string>;
  citations: { name: string; url: string; organization: string }[];
}

export interface HabitatModuleData {
  id: HabitatModuleId;
  name: string;
  shortName: string;
  subsystemId: SubsystemId;
  icon: string;
  color: {
    primary: string;
    border: string;
    bg: string;
    badge: string;
    glow: string;
    hex: string;
  };
  tagline: string;
  junior: ModuleJuniorData;
  engineering: ModuleEngineeringData;
}

export const HABITAT_MODULES: Record<HabitatModuleId, HabitatModuleData> = {
  greenhouse: {
    id: "greenhouse",
    name: "Greenhouse / Hydroponic Bay",
    shortName: "Hydroponics Bay",
    subsystemId: "foodProduction",
    icon: "Leaf",
    color: {
      primary: "text-emerald-400",
      border: "border-emerald-500/50",
      bg: "bg-emerald-950/30",
      badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      glow: "shadow-emerald-500/20",
      hex: "#10B981",
    },
    tagline: "NASA Advanced Plant Habitat (APH) & Veggie Space Agronomy",
    junior: {
      metaphor: "The Greenhouse is an Astronaut Supermarket & Oxygen Nursery!",
      simpleStory:
        "Think of the hydroponics bay as a vertical plant factory without any dirt! Instead of soil, space crops like red romaine lettuce, dwarf wheat, and juicy cherry tomatoes grow on porous mats soaked in nutrient water. Special pink-magenta LED grow lights shower them with the exact blue (450nm) and red (660nm) light rays they love most. The plants drink up the carbon dioxide astronauts exhale and breathe out sweet, fresh oxygen, while giving everyone delicious fresh food!",
      funFact:
        "In 2015, astronaut Scott Kelly and the Expedition 44 crew became the first humans to eat space-grown salad on the ISS. They dressed their fresh red romaine lettuce with olive oil and balsamic vinegar!",
      juniorTakeaway:
        "Every salad grown on Mars is food a rocket doesn't have to carry from Earth!",
      processSteps: [
        {
          title: "1. LED Photon Pumping",
          description:
            "Adjustable 450nm (blue) and 660nm (red) LEDs stimulate chlorophyll for peak photosynthesis with zero wasted energy.",
          iconName: "Sun",
        },
        {
          title: "2. Aeroponic Misting",
          description:
            "Micro-nozzles spray plant roots with oxygenated nutrient solution every 15 minutes without heavy soil.",
          iconName: "Droplet",
        },
        {
          title: "3. Transpiration Recycling",
          description:
            "Cold condensing coils capture clean water vapor sweating from plant leaves, recycling it directly into drinking water.",
          iconName: "RefreshCw",
        },
        {
          title: "4. Calorie Harvesting",
          description:
            "Produces 2,500 kcal/astronaut/day in fresh greens, boosting crew immune health and moral stamina.",
          iconName: "Sparkles",
        },
      ],
    },
    engineering: {
      missions: "NASA Advanced Plant Habitat (APH) & Veggie (ISS Destiny & Columbus Labs)",
      operatingTemp: "22.0°C (71.6°F) root zone · 24.0°C (75.2°F) canopy · 65% RH",
      powerConsumption: "25 MW Outpost Grid Scale (2.5 kW ISS APH Flight Rack)",
      inputs: "25 MW electrical power · 2.5 L/m²/day recycled H₂O · 1,200 ppm CO₂",
      outputs: "2,500 kcal/person/day food (10,000 kcal/day for 4 crew) · 16 kg biomass/cycle",
      formula: {
        title: "NASA BVAD Metabolic Energy & Biomass Growth Balance",
        equation: "E_{crew} = \\sum_{i=1}^{N_{crew}} \\dot{C}_i = 4 \\times 2,500\\text{ kcal/day} = 10,000\\text{ kcal/day}",
        subEquation: "\\dot{m}_{H_2O} = A_{canopy} \\cdot \\phi_{transpiration} = 10\\text{ m}^2 \\times 0.25\\text{ L/m}^2/\\text{hr} = 60\\text{ L/day}",
        description:
          "NASA Advanced Life Support Baseline Values and Assumptions Document (BVAD NASA/TP-2015-218570, Sec 4.1.2) benchmarks adult metabolic intake at 2,500 kcal/day. 450nm and 660nm LED arrays provide Photosynthetically Active Radiation (PAR) at ~12% electrical-to-carbohydrate conversion, demanding ~25 MW continuous baseload heating and lighting in cryogenic surface environments.",
        variables: [
          { symbol: "E_{crew}", meaning: "Total crew caloric intake requirement", bvadStandard: "10,000 kcal/day (4 astronauts)" },
          { symbol: "\\dot{C}_i", meaning: "Daily metabolic rate per astronaut", bvadStandard: "2,500 kcal/person/day" },
          { symbol: "A_{canopy}", meaning: "Active phototrophic canopy surface area", bvadStandard: "10 to 25 m² per module" },
          { symbol: "\\phi_{transpiration}", meaning: "Plant water evapotranspiration rate", bvadStandard: "2.5 L/m²/day recycled" },
        ],
      },
      technicalSpecs: {
        "Enclosed Volume": "3.8 m³ pressurized biospheric growth envelope",
        "PAR Intensity": "0–1,000 µmol/m²/s adjustable multi-spectral LEDs",
        "CO₂ Enrichment": "1,200–1,500 ppm scrubbed cabin air recycling",
        "Harvest Cycle": "3 Sols (rapid micro-greens / dwarf wheat crops)",
        "Nutrient System": "Closed-loop sub-surface capillary aeroponic misting",
      },
      citations: [
        {
          name: "NASA BVAD NASA/TP-2015-218570: Life Support Baseline Values",
          url: "https://ntrs.nasa.gov/citations/20150002905",
          organization: "NASA Johnson Space Center (JSC)",
        },
        {
          name: "Advanced Plant Habitat (APH) Science Experiment",
          url: "https://www.nasa.gov/mission_pages/station/research/experiments/explorer/Investigation.html?#id=2027",
          organization: "NASA Kennedy Space Center (KSC)",
        },
      ],
    },
  },

  life_support: {
    id: "life_support",
    name: "MOXIE & Sabatier Life Support Core",
    shortName: "Life Support (ECLSS)",
    subsystemId: "lifeSupport",
    icon: "Activity",
    color: {
      primary: "text-cyan-400",
      border: "border-cyan-500/50",
      bg: "bg-cyan-950/30",
      badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
      glow: "shadow-cyan-500/20",
      hex: "#06B6D4",
    },
    tagline: "Perseverance MOXIE & ISS ECLSS Atmospheric Chemistry",
    junior: {
      metaphor: "The Sabatier and MOXIE reactors act like an artificial robotic lung!",
      simpleStory:
        "Every time an astronaut exhales, they breathe out carbon dioxide (CO₂). On Earth, vast forests and oceans absorb it. Inside our space habitat, the Sabatier reactor and MOXIE system do that job with super-smart chemistry! They trap the CO₂, bake it at blistering heat, split apart the stubborn atoms, and turn it right back into clean, crisp oxygen to breathe and crystal-clear water to drink!",
      funFact:
        "NASA's toaster-sized MOXIE unit on the Perseverance rover successfully generated 122 grams of 98% pure oxygen on Mars between 2021 and 2023 — enough to keep an astronaut breathing for several hours!",
      juniorTakeaway:
        "In space, sweat, breath, and carbon dioxide are recycled so cleanly that station water is purer than spring water in a grocery store!",
      processSteps: [
        {
          title: "1. CO₂ Molecular Scrubbing",
          description:
            "Zeolite chemical filter beds capture carbon dioxide molecules exhaled by the crew inside the habitat.",
          iconName: "Filter",
        },
        {
          title: "2. Sabatier Methanation",
          description:
            "Reacts captured CO₂ with hydrogen over a nickel catalyst at 400°C, producing methane and pure water vapor.",
          iconName: "Flame",
        },
        {
          title: "3. Water Electrolysis (OGA)",
          description:
            "Electric current zaps water molecules apart into fresh breathable oxygen gas (O₂) and hydrogen fuel.",
          iconName: "Zap",
        },
        {
          title: "4. Solid Oxide Electrolysis (MOXIE)",
          description:
            "On Mars, ceramic solid-oxide cells split ambient 600 Pa CO₂ directly into oxygen and carbon monoxide at 800°C.",
          iconName: "Cpu",
        },
      ],
    },
    engineering: {
      missions: "NASA Mars 2020 Perseverance MOXIE & ISS Environmental Control (ECLSS)",
      operatingTemp: "MOXIE SOXE: 800°C (1,472°F) · Sabatier Core: 350°C–400°C · Cabin: 21°C",
      powerConsumption: "30–35 MW Outpost Grid Scale (300 W MOXIE Flight Unit / 1.5 kW ISS OGA)",
      inputs: "30 MW electricity · 1.00 kg/person/day CO₂ · 0.95 kg/person/day H₂O",
      outputs: "0.84 kg O₂/person/day (3.36 kg/day for 4 crew) · >98% water recovery",
      formula: {
        title: "NASA BVAD Adult Respiratory Intake & Sabatier Stoichiometry",
        equation: "\\text{Sabatier: } \\text{CO}_2 + 4\\text{H}_2 \\xrightarrow{400^\\circ\\text{C},\\text{ Ni}} \\text{CH}_4 + 2\\text{H}_2\\text{O} \\quad (\\Delta H = -165\\text{ kJ/mol})",
        subEquation: "\\text{Electrolysis: } 2\\text{H}_2\\text{O} \\xrightarrow{e^-} 2\\text{H}_2 + \\text{O}_2 \\implies \\dot{m}_{\\text{O}_2} = 0.84\\text{ kg/person/day}",
        description:
          "NASA BVAD Table 4.1 establishes human basal oxygen consumption at 0.84 kg/person/day (26.25 mol O₂). The Sabatier reactor condenses metabolic CO₂ and byproduct H₂ into water, which is then cleaved by the Oxygen Generation Assembly (OGA) via alkaline water electrolysis, closing the atmospheric loop to >98% recovery.",
        variables: [
          { symbol: "\\dot{m}_{\\text{O}_2}", meaning: "Metabolic O₂ consumption rate per astronaut", bvadStandard: "0.84 kg/person/day" },
          { symbol: "\\dot{m}_{\\text{CO}_2}", meaning: "Metabolic CO₂ exhalation rate per astronaut", bvadStandard: "1.00 kg/person/day" },
          { symbol: "\\Delta H", meaning: "Sabatier exothermic reaction enthalpy", bvadStandard: "-165 kJ/mol @ 400°C" },
          { symbol: "\\eta_{loop}", meaning: "Closed-loop water and oxygen recovery efficiency", bvadStandard: "98% closed-loop recovery" },
        ],
      },
      technicalSpecs: {
        "O₂ Purity": "> 99.6% medical / flight aviation grade",
        "Cabin Atmosphere": "101.3 kPa (14.7 psi) · 21% O₂ / 78% N₂ earth-standard",
        "Water Loop Efficiency": "98.4% total recycling (urine distillate + condensate)",
        "MOXIE SOXE Cell": "Scandia-stabilized zirconia (YSZ) ceramic solid oxide",
        "Trace Contaminants": "Catalytic oxidizer removes methane, VOCs, and CO",
      },
      citations: [
        {
          name: "Perseverance MOXIE Mars Oxygen ISRU Instrument Investigation",
          url: "https://mars.nasa.gov/mars2020/spacecraft/instruments/moxie/",
          organization: "NASA Jet Propulsion Laboratory (JPL) & MIT",
        },
        {
          name: "International Space Station ECLSS Technology Summary",
          url: "https://www.nasa.gov/international-space-station/space-station-life-support-systems/",
          organization: "NASA Marshall Space Flight Center (MSFC)",
        },
      ],
    },
  },

  radiation_shield: {
    id: "radiation_shield",
    name: "Regolith Water-Wall & Magnetic Deflector",
    shortName: "Radiation Shield",
    subsystemId: "radiationShielding",
    icon: "Shield",
    color: {
      primary: "text-blue-400",
      border: "border-blue-500/50",
      bg: "bg-blue-950/30",
      badge: "bg-blue-500/20 text-blue-300 border-blue-500/40",
      glow: "shadow-blue-500/20",
      hex: "#3B82F6",
    },
    tagline: "Active GCR/SPE Lorentz Deflector & Hydrogen-Rich Water Walls",
    junior: {
      metaphor: "The Shield is an Invisible Magnetic Umbrella and a Super-Thick Liquid Armor!",
      simpleStory:
        "Deep space is constantly pelted by invisible cosmic rays and solar storm protons shooting at almost the speed of light! Because these energetic particles carry positive electrical charges, our superconducting coils create an invisible magnetic force-field that deflects them around the base like water curving around an umbrella. For any stubborn rays that make it through, thick outer walls filled with water bladders and baked lunar dirt (regolith) catch them like a soft, heavy baseball glove!",
      funFact:
        "Why water? Water molecules are rich in hydrogen atoms. A hydrogen nucleus has nearly the exact same mass as a flying cosmic proton, so it cushions the impact without shattering into dangerous radioactive debris!",
      juniorTakeaway:
        "Just like putting on sunscreen on Earth, an outpost needs magnetic force fields and water blankets to keep astronauts healthy!",
      processSteps: [
        {
          title: "1. Superconducting Coils",
          description:
            "Cryo-cooled coils generate a 3.2 Tesla magnetic bubble around the habitat rim.",
          iconName: "Radio",
        },
        {
          title: "2. Lorentz Force Deflection",
          description:
            "Charged solar protons and cosmic iron ions are bent safely away into the void of space.",
          iconName: "ShieldAlert",
        },
        {
          title: "3. Sintered Regolith Berm",
          description:
            "A 1.5-meter outer envelope of 3D-microwave-sintered soil stops secondary particles.",
          iconName: "Layers",
        },
        {
          title: "4. Water-Wall Bladders",
          description:
            "Water reserves encircle the crew sleep berths, cutting nighttime radiation exposure to near zero.",
          iconName: "Droplet",
        },
      ],
    },
    engineering: {
      missions: "LRO CRaTER, MSL Curiosity RAD & NASA Langley Active Shielding Studies",
      operatingTemp: "Coil Cryostats: 77 Kelvin (−196.15°C) · Regolith Skin: −130°C to +120°C",
      powerConsumption: "25–30 MW Outpost Grid Scale (Cryocoolers + Superconducting Solenoids)",
      inputs: "25–30 MW power · 12,000 L habitat water reserve · 1.5 m regolith overburden",
      outputs: "85–95% GCR/SPE dose reduction · Safe crew dose < 0.3 mSv/day",
      formula: {
        title: "Radiation Attenuation (Beer-Lambert) & Lorentz Deflection",
        equation: "I(x) = I_0 \\cdot e^{-\\left(\\frac{\\mu}{\\rho}\\right) \\cdot \\rho x} \\quad \\text{and} \\quad \\vec{F}_L = q \\left( \\vec{E} + \\vec{v} \\times \\vec{B} \\right)",
        subEquation: "H = \\int \\frac{d\\Phi}{dE} \\cdot S(E) \\cdot Q(L) \\, dE \\le 500\\text{ mSv Career Ceiling}",
        description:
          "Particle flux I(x) attenuates exponentially according to mass stopping power (\\mu/\\rho) and areal density (\\rho x). Hydrogen-dense matter (H₂O, polyethylene) maximizes proton stopping power per gram and prevents Bremsstrahlung. Simultaneously, the Lorentz force \\vec{F} = q(\\vec{v} \\times \\vec{B}) deflects charged ions with gyroradius r_g = mv_\\perp / (qB).",
        variables: [
          { symbol: "I(x)", meaning: "Transmitted radiation intensity at depth x", bvadStandard: "< 0.3 mSv/day operational dose" },
          { symbol: "\\mu/\\rho", meaning: "Mass attenuation coefficient", bvadStandard: "High for H₂O, low for heavy metals" },
          { symbol: "\\rho x", meaning: "Areal shielding mass density", bvadStandard: "> 20 g/cm² minimum NASA benchmark" },
          { symbol: "\\vec{B}", meaning: "Deflector magnetic flux density", bvadStandard: "3.2 Tesla peak at coil bore" },
        ],
      },
      technicalSpecs: {
        "Magnetic Field": "3.2 Tesla toroidal field with <0.5 Gauss hab interior",
        "Regolith Thickness": "1.5 m compacted regolith berm (2.8 g/cm³ density)",
        "Water Bladder Depth": "20 cm dual-purpose potable/greywater jacket",
        "GCR Dose Mitigation": "Dose suppressed from 0.64 mSv/day to <0.18 mSv/day",
        "SPE Flare Protection": "> 98% attenuation against 100 MeV solar protons",
      },
      citations: [
        {
          name: "LRO Cosmic Ray Telescope for the Effects of Radiation (CRaTER)",
          url: "https://crater.unh.edu/",
          organization: "NASA Goddard Space Flight Center (GSFC)",
        },
        {
          name: "MSL RAD Measurements of Radiation Environment on Mars Surface",
          url: "https://mars.nasa.gov/msl/spacecraft/instruments/rad/",
          organization: "Southwest Research Institute (SwRI) & NASA JPL",
        },
      ],
    },
  },

  power_core: {
    id: "power_core",
    name: "Kilopower Fission Reactor & Solar Array",
    shortName: "Power Core (Kilopower)",
    subsystemId: "powerGrid",
    icon: "Zap",
    color: {
      primary: "text-amber-400",
      border: "border-amber-500/50",
      bg: "bg-amber-950/30",
      badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      glow: "shadow-amber-500/20",
      hex: "#F59E0B",
    },
    tagline: "NASA Kilopower KRUSTY 10–40 kWe Nuclear Surface Power & Photovoltaics",
    junior: {
      metaphor: "Kilopower is like a miniature, super-safe nuclear battery campfire that never goes out!",
      simpleStory:
        "On the Moon, night lasts for 14 whole Earth days! And on Mars, ferocious dust storms can blot out the Sun for months at a time. While our tall solar panels catch plenty of sunshine during clear days, an outpost needs dependable electricity 24 hours a day to keep heaters and oxygen flowing. The Kilopower reactor uses a tiny core of uranium to produce steady heat, which Stirling engines turn into clean electricity without needing any wind, sun, or oxygen!",
      funFact:
        "The Kilopower KRUSTY reactor was tested in the Nevada desert in 2018. It naturally regulates its own temperature through physics alone — if it gets too hot, the metal expands slightly and slows down the reaction automatically without computer help!",
      juniorTakeaway:
        "A hybrid grid (Solar by day, Kilopower by night) means our outpost never freezes in the dark!",
      processSteps: [
        {
          title: "1. U-235 Reactor Core",
          description:
            "A solid cast enriched uranium core surrounded by beryllium oxide generates 133 kW of steady thermal energy.",
          iconName: "Atom",
        },
        {
          title: "2. Sodium Heat Pipes",
          description:
            "Passive sodium metal heat pipes transfer 650°C heat to Stirling engines without any noisy mechanical pumps.",
          iconName: "Thermometer",
        },
        {
          title: "3. Stirling Power Converters",
          description:
            "Dual-opposed Stirling engines convert heat differences into 10–40 kWe of clean alternating electrical current.",
          iconName: "Cpu",
        },
        {
          title: "4. Titanium Radiators",
          description:
            "Titanium-water heat pipe radiators discard waste heat into the cold blackness of space.",
          iconName: "Maximize2",
        },
      ],
    },
    engineering: {
      missions: "NASA STMD Kilopower KRUSTY Project (Los Alamos & NASA Glenn Research Center)",
      operatingTemp: "Reactor Core: 650°C (1,202°F) · Stirling Cold End: 60°C · Waste Radiator: 55°C",
      powerConsumption: "Net Baseload Generation: 10–40 kWe per modular unit (100 MW Outpost Grid Scale)",
      inputs: "Solid U-235 alloy core (passive self-regulating) · Solar tracking array irradiance",
      outputs: "100 MW Outpost Power Grid distribution · Co-generation thermal hab warming",
      formula: {
        title: "Stirling Thermodynamic Efficiency & Diurnal Power Balancing",
        equation: "\\eta_{\\text{Stirling}} = \\frac{T_H - T_C}{T_H} \\cdot \\varepsilon_{\\text{mech}} \\approx \\frac{923\\text{ K} - 333\\text{ K}}{923\\text{ K}} \\times 0.50 \\approx 32\\%",
        subEquation: "P_{\\text{grid}}(t) = P_{\\text{Kilopower}} + \\sum A_{\\text{solar}} \\cdot S_0 \\cdot \\cos(\\theta) \\cdot e^{-\\tau / \\cos(\\theta)}",
        description:
          "The Stirling engine efficiency \\eta is bounded by the Carnot limit between reactor hot end T_H (923 K / 650°C) and radiator sink T_C (333 K / 60°C). Net outpost electrical generation merges the unyielding fission baseload with solar insolation degraded by atmospheric optical opacity \\tau (which spikes above 8.0 during Martian dust storms).",
        variables: [
          { symbol: "\\eta_{\\text{Stirling}}", meaning: "Thermal-to-electric conversion efficiency", bvadStandard: "30% to 35% net electrical" },
          { symbol: "T_H / T_C", meaning: "Stirling hot and cold source temperatures", bvadStandard: "923 K hot / 333 K cold end" },
          { symbol: "P_{\\text{Kilopower}}", meaning: "Fission Surface Power continuous baseload", bvadStandard: "10 to 40 kWe per unit" },
          { symbol: "\\tau", meaning: "Atmospheric optical dust opacity factor", bvadStandard: "Tau 0.5 (clear) to 8.0+ (storm)" },
        ],
      },
      technicalSpecs: {
        "System Mass": "1,500 kg per 10 kWe modular unit",
        "Operational Life": "> 10 years continuous without maintenance or refueling",
        "Control Mechanism": "Single central B₄C control rod with negative thermal reactivity",
        "Solar Tracking Masts": "Dual 15-meter vertical masts with triple-junction GaAs cells",
        "Battery Bank": "Li-ion and regenerative fuel cell buffer with 120 kWh storage",
      },
      citations: [
        {
          name: "NASA Kilopower Project: Fission Surface Power for Moon and Mars",
          url: "https://www.nasa.gov/directorates/stmd/game-changing-development-program/kilopower/",
          organization: "NASA Glenn Research Center (GRC)",
        },
        {
          name: "KRUSTY Nuclear Demonstration Testing Results (LANL)",
          url: "https://www.lanl.gov/discover/news-release-archive/2018/May/05.02-kilopower-reactor.php",
          organization: "Los Alamos National Laboratory (LANL)",
        },
      ],
    },
  },

  airlock: {
    id: "airlock",
    name: "Dust-Mitigation Airlock & EVA Prep",
    shortName: "Airlock & EVA Prep",
    subsystemId: "powerGrid", // Auxiliary system powered through grid & life support
    icon: "DoorOpen",
    color: {
      primary: "text-purple-400",
      border: "border-purple-500/50",
      bg: "bg-purple-950/30",
      badge: "bg-purple-500/20 text-purple-300 border-purple-500/40",
      glow: "shadow-purple-500/20",
      hex: "#A855F7",
    },
    tagline: "Electrodynamic Dust Shields (EDS) & Dual-Chamber Repressurization",
    junior: {
      metaphor: "The Airlock is an Air Shower, an Invisible Dust Broom, and a Space Gateway!",
      simpleStory:
        "On the Moon and Mars, dust isn't soft like beach sand — it is made of tiny, razor-sharp shards of volcanic glass with static cling that stick to everything! If that dust got inside the base, it would scratch astronaut eyes, irritate lungs, and jam door seals. Our airlock uses an invisible electric wave that sweeps the dust right off spacesuits before astronauts enter, followed by a roaring air-shower that blows every last speck away!",
      funFact:
        "Apollo 17 Commander Gene Cernan said lunar dust was the number one obstacle for exploration on the Moon! It smelled like burnt gunpowder, scratched face visors, and wore through multiple layers of heavy Kevlar boots!",
      juniorTakeaway:
        "Never open the front door in space! The airlock equalizes pressure and shakes off microscopic dust before letting astronauts into the living quarters!",
      processSteps: [
        {
          title: "1. Suitport Outer Docking",
          description:
            "Astronauts back into exterior suitports, slipping into the hab while leaving dusty suit exteriors outside.",
          iconName: "LogOut",
        },
        {
          title: "2. Electrodynamic Dust Shield (EDS)",
          description:
            "High-voltage AC electrodes create a traveling electric wave that levitates and repels clingy electrostatic dust.",
          iconName: "Zap",
        },
        {
          title: "3. Air Evacuation & Compression",
          description:
            "High-efficiency turbopumps suck chamber air into storage tanks to avoid losing precious oxygen and nitrogen.",
          iconName: "Wind",
        },
        {
          title: "4. Prebreathe Protocol",
          description:
            "Astronauts breathe 100% pure oxygen at 30 kPa to flush nitrogen from blood and prevent 'the bends' during spacewalks.",
          iconName: "Heart",
        },
      ],
    },
    engineering: {
      missions: "NASA Kennedy Space Center Electrodynamic Dust Shield (EDS) & Artemis xEMU Airlock",
      operatingTemp: "Chamber Ambient: 21.0°C (69.8°F) · Exterior Hatch Interface: −120°C to +80°C",
      powerConsumption: "5–10 MW Transient cycling (Turbopumps, repressurization compressors & EDS)",
      inputs: "Multi-phase AC electric potential (1–3 kV) · Pressurized N₂/O₂ gas ballast reservoir",
      outputs: "> 99% regolith dust exclusion · < 1% cabin air loss per EVA depressurization cycle",
      formula: {
        title: "Electrostatic Dielectrophoretic Dust Levitation & P-V Compression",
        equation: "\\vec{F}_{\\text{EDS}} = q\\vec{E} + 2\\pi \\varepsilon_m r^3 K \\nabla |\\vec{E}|^2 > \\vec{F}_{\\text{van der Waals}} + m\\vec{g}",
        subEquation: "W_{\\text{pump}} = \\int_{P_{\\text{suit}}}^{P_{\\text{hab}}} V \\, dP = nRT \\ln\\left(\\frac{P_{\\text{hab}}}{P_{\\text{suit}}}\\right) \\quad (101.3\\text{ kPa} \\rightarrow 29.6\\text{ kPa})",
        description:
          "Lunar dust adheres via triboelectric electrostatic charge and van der Waals molecular forces. NASA's Electrodynamic Dust Shield (EDS) applies a multi-phase high-voltage AC electric field \\vec{E}, producing a net dielectrophoretic force \\vec{F}_{EDS} that exceeds adhesion and surface gravity, levitating particles off suits and optical lenses. Meanwhile, isothermal pump work W reclaims cabin gas from suit pressure (29.6 kPa / 4.3 psi) to habitat pressure (101.3 kPa).",
        variables: [
          { symbol: "\\vec{F}_{\\text{EDS}}", meaning: "Electrodynamic repulsion force", bvadStandard: "Exceeds van der Waals surface adhesion" },
          { symbol: "q\\vec{E}", meaning: "Coulomb electrostatic force on charged grains", bvadStandard: "1 to 3 kV/cm field strength" },
          { symbol: "P_{\\text{hab}}", meaning: "Habitat normal cabin pressure", bvadStandard: "101.3 kPa (14.7 psi)" },
          { symbol: "P_{\\text{suit}}", meaning: "xEMU EVA suit operational pressure", bvadStandard: "29.6 kPa (4.3 psi) pure O₂" },
        ],
      },
      technicalSpecs: {
        "EDS Voltage": "1–3 kV peak-to-peak at 10–50 Hz multi-phase AC",
        "Dust Removal Efficiency": "> 99% of Apollo regolith simulant cleared within 90 seconds",
        "Repressurization Speed": "6 minutes rapid emergency; 15 minutes standard nominal",
        "Airlock Volume": "7.5 m³ dual-chamber hyperbaric airlock configuration",
        "Suitport Interface": "Rear-entry suitport latch with double-lip elastomer vacuum seals",
      },
      citations: [
        {
          name: "NASA Electrodynamic Dust Shield (EDS) Technology",
          url: "https://www.nasa.gov/directorates/stmd/game-changing-development-program/electrodynamic-dust-shield/",
          organization: "NASA Kennedy Space Center (KSC)",
        },
        {
          name: "NASA-STD-3001 Space Flight Human-System Standard: EVA & Pressure",
          url: "https://standards.nasa.gov/standard/NASA/NASA-STD-3001-VOL-1",
          organization: "NASA Office of the Chief Health and Medical Officer",
        },
      ],
    },
  },
};
