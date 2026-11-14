# 🚀 Outpost Commander: Junior Astronaut Mission Trainer
### NASA International Space Apps Challenge 2026
**Theme:** *Build a Junior Astronaut Mission Trainer*  
**Target Explorers:** Junior Commanders (Ages 7–12+), Students & Space Enthusiasts  
**Live Application:** [astronaut.beyondthebasics.me](https://astronaut.beyondthebasics.me)  
**Cloud Deployment:** Zero-configuration instant deployment on Vercel & Netlify  

---

## 🛰️ Project Overview

**Outpost Commander** is an authentic, telemetry-grounded mission simulator that puts young explorers in the flight director's chair. As the commander of either the **Artemis Lunar South Pole Basecamp (Shackleton Crater)** or the **Mars Gale Crater Outpost (Curiosity Territory)**, junior astronauts face the fundamental law of space survival:

> *Power is never unlimited. Every kilowatt diverted to keep your crew warm or shielded leaves less energy to grow food or charge emergency batteries.*

Over a 10-Sol (day) expedition, commanders manage a shared **100 MW micro-grid** across three critical life-sustaining systems:
1. **Life Support (ECLSS):** Oxygen recyclers, water scrubbers, and hydroponic plant bays.
2. **Radiation & Thermal Shielding:** Water-wall barriers, magnetic deflectors, and resistive thermal blankets.
3. **Battery Storage & Power Grid:** Solar array charge controllers and backup Radioisotope Thermoelectric Generators (RTG).

With real-time predictive feedback, live cross-section habitat telemetry, mid-mission space weather incidents, and an in-depth NASA engineering debrief, Outpost Commander transforms complex aerospace engineering into an intuitive, empowering experience.

---

## 🎯 Challenge Alignment: "Build a Junior Astronaut Mission Trainer"

Outpost Commander directly solves the challenge mandate by delivering:
- **No Complex Math or Spreadsheets:** Replaces overwhelming spreadsheets with tactile sliders, 1-click operational presets (*Balanced*, *Storm Shield*, *Life Support Boost*, *Max Reserves*), and instant visual cues.
- **Immediate Cause & Effect:** Real-time **Live Trade-off Arrows** (▲ Surplus / ▼ Deficit) preview projected turn deltas before advancing, coaching players to think like NASA systems engineers.
- **Authentic Aerospace Terminology Made Accessible:** Teaches real mission concepts—like *mSv radiation dose*, *ECLSS closed-loop recycling*, *solar flux opacity (tau)*, and *diurnal temperature swings*—through clear, kid-friendly analogies.
- **Interactive Habitats:** A responsive SVG cross-section of the outpost visually reflects commander decisions in real time (e.g., plants wilt during power cuts, shields glow during solar flare surges, airlock indicators react to barometric changes).
- **Zero Friction:** Requires no logins, accounts, or heavy downloads. Loads instantly in any desktop or mobile browser.

---

## 🔬 NASA Scientific Data Sources & Mission Citations

All environmental constants, solar availability curves, radiation baselines, and hazard events in Outpost Commander are grounded directly in published NASA mission data. Players can click the **NASA Data** button in the console header at any time to inspect the underlying instruments:

| Mission & Instrument | Sourced Parameter | Real-World Value & Outpost Impact | Official NASA Reference |
| :--- | :--- | :--- | :--- |
| **NASA LRO Diviner (DLRE)** | Lunar Surface Temperature | Extreme **227°C delta** (−173°C in PSR shadow to +54°C sunlit rim). Outpost thermal systems experience heavy strain during lunar twilight. | [NASA LRO Diviner](https://diviner.ucla.edu/) |
| **NASA LRO LOLA** | Shackleton Crater Illumination | **~86% seasonal solar illumination** on elevated crater rims. Enables high-efficiency photovoltaic baseline operations. | [NASA LRO LOLA](https://lola.gsfc.nasa.gov/) |
| **NASA LCROSS & Mini-RF** | Polar Volatile Water Ice | **5.6% ± 2.9% water ice** detected in permanently shadowed craters. Unlocks cryo-drilling directives for closed-loop oxygen buffers. | [NASA LCROSS Mission](https://www.nasa.gov/mission_pages/LCROSS/main/) |
| **NASA LRO CRaTER** | Lunar Radiation Environment | Galactic Cosmic Ray (GCR) baseline of **~0.30 mSv/day**; elevated to multi-Sievert spikes during X-class Solar Particle Events (SPE). | [LRO CRaTER](https://crater.bu.edu/) |
| **NASA MSL Curiosity REMS** | Mars Gale Crater Meteorology | Atmospheric pressure of **610 Pa** (~0.6% Earth's); diurnal swings from −80°C to +20°C; dust atmospheric opacity ($\tau$). | [MSL Curiosity REMS](https://mars.nasa.gov/msl/mission/instruments/rems/) |
| **NASA MSL Curiosity RAD** | Mars Surface Radiation | Baseline dose rate of **0.64 mSv/day**; thin CO₂ atmosphere provides only ~12% shielding against solar proton storms. | [MSL Curiosity RAD](https://mars.nasa.gov/msl/mission/instruments/rad/) |
| **NASA Phoenix MECA & MSL SAM**| Regolith Perchlorate Salts | **~0.5% perchlorate concentration** by weight in Martian soil, necessitating catalytic filtration power before hydroponic use. | [NASA MSL SAM](https://mars.nasa.gov/msl/mission/instruments/sam/) |
| **NASA MOXIE (Perseverance)** | In-Situ O₂ Extraction | Solid oxide electrolysis principles used to model closed-loop oxygen recovery from ambient atmospheric carbon dioxide. | [NASA MOXIE](https://mars.nasa.gov/mars2020/spacecraft/instruments/moxie/) |

---

## ⚡ Core Features & Console Capabilities

### 1. Tactile 100 MW Power Budget Deck
- 3 responsive, color-coded power sliders with step buttons (±5 MW) designed for touch and mouse interaction.
- Instant 1-click operational presets:
  - ⚖️ **Balanced:** 35 MW Life Support / 30 MW Shields / 35 MW Battery
  - 🌱 **Life Support Boost:** Prioritizes oxygen scrubbers and hydroponic yields
  - 🛡️ **Storm Shield:** Maximum power to force-fields and water-wall shielding
  - 🔋 **Max Reserves:** Charges backup battery bank ahead of dust storms and nightfall
- Multi-segment dynamic budget pool bar showing real-time distribution and brownout warning alerts.

### 2. Live Trade-off Consequence Engine
- Live predictive telemetry before committing your turn:
  - Oxygen buffer surplus/depletion rate (% per Sol)
  - Food harvest extension days
  - Projected biological radiation dose (mSv/Sol)
  - Battery charge/discharge delta (MW)
  - Subsystem health wear projections

### 3. Native Web Audio API Sound Synthesizer
- Built entirely on the browser's native **Web Audio API** (`src/utils/soundEffects.ts`) with **zero external MP3/WAV assets**:
  - **Tactile UI Clicks:** Subtle high-tech audio ticks when adjusting sliders or clicking steppers.
  - **Telemetry Chime:** Ascending three-tone chime (D5 → A5 → D6) upon Sol advance.
  - **Hazard Alert Pulse:** Dual-tone warning beacon on solar storms and environmental incidents.
  - **Victory Chord:** Resonant major 9th arpeggio upon successful 10-Sol mission completion.
- Persistent **Mute / Unmute** toggle in the top telemetry header (remembers preference in `localStorage`).

### 4. 15-Second 3-Step Spotlight Tutorial (`QuickTutorialOverlay.tsx`)
- Guided first-run walkthrough highlighting:
  1. *Shared 100 MW Power Budget*
  2. *Live Trade-off Arrows & Consequence Engine*
  3. *NASA Incident Alerts & Space Weather*
- Includes progress indicators, "Skip Tutorial" button, and on-demand replay via the header **Tutorial** button.

### 5. Mid-Mission NASA Incident Directives
- Randomly triggered space weather anomalies grounded in real flight data:
  - *X-class Solar Particle Event*
  - *Regional Gale Crater Dust Storm ($\tau = 2.5$)*
  - *Cryogenic Ice Drill Overclocking*
  - *Micrometeoroid Thermal Blanket Puncture*
  - *Perchlorate Soil Contamination Alert*
- Players choose between 2–3 authentic flight-director trade-offs that reshape power budgets and telemetry.

### 6. End-of-Mission Engineering Debrief Modal
- **Flight Rank Title:** Artemis Master Architect, Senior Flight Engineer, Outpost Survivor, or Systems Trainee.
- **Interactive Pure-SVG Telemetry Chart:** Toggle between Subsystem Health, Cumulative Score, Crew Morale, and Power Reserve trends across all 10 Sols.
- **Personalized Engineering Insights:** Two customized technical takeaways dynamically synthesized from the player's incident choices and grid management.

---

## 🛠️ Tech Stack & Architecture

- **Framework:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Build Tool:** [Vite 8](https://vite.dev/) (with Rolldown engine & optimized code splitting)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Audio:** Native Browser Web Audio API (Zero external network dependencies)
- **Code Architecture:**
  - `src/engine/simulationEngine.ts` — Deterministic mathematical model of ECLSS, radiation attenuation, and power decay.
  - `src/data/nasaConstants.ts` — Curated NASA scientific datasets and mission citations.
  - `src/data/incidentCards.ts` — Mission event cards and engineering trade-offs.
  - `src/utils/soundEffects.ts` — Web Audio API procedural sound engine with persistent mute state.
  - `src/components/` — Modular, accessible components (ControlDeck, OutpostVisualizer, QuickTutorialOverlay, MissionDebriefModal, NasaDataModal).

---

## 💻 Local Setup & Development

### Prerequisites
- Node.js 18.0.0 or higher
- npm 9.0.0 or higher

### Installation & Run

```bash
# 1. Clone the repository
git clone https://github.com/your-username/outpost-commander.git

# 2. Enter project directory
cd outpost-commander

# 3. Install dependencies
npm install

# 4. Start local development server
npm run dev
```

Open your browser to the URL displayed in the terminal (typically `http://localhost:5173`).

### Production Build & Verification

```bash
# Verify TypeScript types and build optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

The build completes with **0 TypeScript errors and 0 Vite warnings**, outputting minified and split chunks directly to `dist/`.

---

## 🌐 Cloud Deployment (Vercel & Netlify)

Outpost Commander is pre-configured for seamless single-command cloud deployment:

### Deploy to Vercel
A `vercel.json` configuration is included in the project:
```bash
# Install Vercel CLI (optional) or connect GitHub repository to Vercel dashboard:
# Framework Preset: Vite
# Build Command: npm run build
# Output Directory: dist
vercel
```

### Deploy to Netlify
```bash
# Build Command: npm run build
# Publish Directory: dist
netlify deploy --prod
```

---

## 🤖 AI Development Disclosure

*In full compliance with NASA International Space Apps Challenge guidelines and Hackathon rules regarding transparent tool usage:*

This project utilized AI-assisted pair programming and development tools (Google DeepMind's Gemini and Antigravity) during the designated hackathon window. Specifically:
- **Architectural Scaffolding:** Used to structure modular React 19 components and TypeScript simulation types.
- **NASA Publication Synthesis:** Assisted in referencing and cross-verifying numerical parameters from public NASA LRO and Curiosity mission papers into simulation constants.
- **UI & Web Audio Polish:** Assisted in formulating procedural Web Audio API oscillator envelopes (sound effects) and accessible Tailwind CSS color schemes.
- **Human Oversight:** All game design concepts, mathematical trade-off balancing, educational summaries, visual layouts, and code implementations were curated, tested, and approved by the team.

---

## 📜 License & Credits

- Created for the **NASA International Space Apps Challenge 2026**.
- Scientific datasets courtesy of **NASA / JPL-Caltech / GSFC / UCLA Diviner / BU CRaTER**.
- Licensed under the **MIT License**.
