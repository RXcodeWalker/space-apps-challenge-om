# 🚀 Outpost Commander: Junior Astronaut Mission Trainer
### NASA International Space Apps Challenge 2026

[![NASA Space Apps Challenge](https://img.shields.io/badge/NASA%20Space%20Apps-2026%20Global%20Challenge-0B3D91?style=for-the-badge&logo=nasa&logoColor=white)](https://www.spaceappschallenge.org/)
[![Live Mission Console](https://img.shields.io/badge/Mission%20Console-Live%20Online-00E5FF?style=for-the-badge&logo=googlechrome&logoColor=black)](https://astronaut.beyondthebasics.me)
[![Educational Standard](https://img.shields.io/badge/NGSS%20Aligned-MS--ETS1--2%20%7C%20MS--ESS1--3-10B981?style=for-the-badge&logo=academia&logoColor=white)](https://www.nextgenscience.org/)
[![Offline First PWA](https://img.shields.io/badge/PWA-100%25%20Offline%20Ready-7C3AED?style=for-the-badge&logo=pwa&logoColor=white)](https://astronaut.beyondthebasics.me)
[![i18n Multi-Lingual](https://img.shields.io/badge/Languages-EN%20%7C%20ES%20%7C%20FR%20%7C%20DE%20%7C%20JA%20%7C%20PT-F59E0B?style=for-the-badge&logo=googletranslate&logoColor=white)](https://astronaut.beyondthebasics.me)
[![TypeScript React 19](https://img.shields.io/badge/React%2019-Vite%208%20%7C%20TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)

> **Theme:** *Build a Junior Astronaut Mission Trainer*  
> **Target Explorers:** Junior Commanders (Ages 7–14+), STEM Classrooms, Space Camp Cadets & General Public  
> **Live Web Application:** [astronaut.beyondthebasics.me](https://astronaut.beyondthebasics.me)  
> **Project Demo (7 slides):** [astronaut.beyondthebasics.me/pitch.html](https://astronaut.beyondthebasics.me/pitch.html)  
> **Deployment Architecture:** Zero-config Edge PWA (Vercel / Netlify / Offline Service Worker)

---

## 📑 Table of Contents

1. [Executive Summary & Challenge Alignment](#-executive-summary--challenge-alignment)
2. [The Core Problem in Space STEM](#-the-core-problem-in-space-stem)
3. [The 4 Engineering Pillars (100 MW Microgrid)](#-the-4-engineering-pillars-100-mw-microgrid)
4. [Extreme NASA Historic & Future Scenarios](#-extreme-nasa-historic--future-scenarios)
5. [Interactive Habitat Cutaway Inspector](#-interactive-habitat-cutaway-inspector)
6. [Classroom & Educator Toolkit (NGSS Aligned)](#-classroom--educator-toolkit-ngss-aligned)
7. [NASA Scientific Grounding & Instrument Citations](#-nasa-scientific-grounding--instrument-citations)
8. [Offline PWA & Multi-Language i18n Architecture](#-offline-pwa--multi-language-i18n-architecture)
9. [Audio Synthesis & Procedural FX Engine](#-audio-synthesis--procedural-fx-engine)
10. [Local Development & Verification](#-local-development--verification)
11. [NASA Space Apps AI & Scientific Disclosure](#-nasa-space-apps-ai--scientific-disclosure)

---

## 🛰️ Executive Summary & Challenge Alignment

**Outpost Commander** is an authentic, telemetry-grounded mission simulator engineered specifically for the 2026 NASA International Space Apps Challenge. Stepping into the shoes of a NASA Flight Director at Mission Control, young explorers command human civilization's vanguard outposts:
- 🌑 **Artemis Lunar South Pole Basecamp** (*Shackleton Crater Rim — 89.9°S*)
- 🔴 **Mars Gale Crater Outpost** (*Curiosity Territory / Aeolis Mons — 4.6°S*)

Every decision is governed by the unyielding first law of space architecture:
$$\sum P_{\text{allocated}} \le P_{\text{total}} \quad (100\text{ MW Microgrid Cap})$$

> [!IMPORTANT]
> **Power is never unlimited.** Diverting megawatts to heat crew quarters or energize electromagnetic deflector shields inevitably starves hydroponic growth lamps or discharges life-saving emergency battery reserves. Outpost Commander transforms abstract thermodynamic laws into tactile, consequential systems engineering.

```
       +--------------------------------------------------------------+
       |             SHARED 100 MW SURFACE MICROGRID                  |
       +--------------+---------------+---------------+---------------+
                      |               |               |
             +--------v-------+       |       +-------v--------+
             |   POWER GRID   |       |       |  LIFE SUPPORT  |
             | Energy Storage |       |       |  ECLSS Oxygen  |
             +--------+-------+       |       +-------+--------+
                      |               |               |
                      |       +-------v-------+       |
                      +------>| RADIATION     |<------+
                              | & THERMAL     |
                              +-------+-------+
                                      |
                              +-------v-------+
                              |  HYDROPONIC   |
                              |  FOOD BAY     |
                              +---------------+
```

### Hackathon Evaluation Rubric Mapping

| Evaluation Rubric | How Outpost Commander Delivers |
| :--- | :--- |
| **Impact** | Inspires the Artemis Generation (ages 7–14+) by democratizing space systems engineering. Includes a 1-click printable STEM Lab Report, reproducible classroom seeds, and dual-tier telemetry modes for mixed-ability classrooms. |
| **Scientific Rigor** | Grounded in published peer-reviewed NASA flight instruments (LRO Diviner, LOLA, CRaTER; MSL Curiosity REMS, RAD; MOXIE; Kilopower KRUSTY; NASA BVAD-3001 metabolic standards). Every metric correlates to verified space physics. |
| **Usability & UX** | Frictionless, zero-install web application that loads in under 1 second. Built-in interactive 15-second spotlight tutorial, native Web Audio synthesized tactile cues, high-contrast accessible visualizer, and 6 full language translations. |
| **Challenge Alignment** | Directly answers *"Build a Junior Astronaut Mission Trainer"* by avoiding dry spreadsheets or mindless clickers; replaces them with active trade-off consequence loops, realistic incident triage, and root-cause post-flight debriefs. |

---

## 🎯 The Core Problem in Space STEM

Modern aerospace education suffers from a persistent polarization:

```
[ Cartoonish Clicker Games ] <========== G A P ==========> [ Dense Engineering Simulators ]
   - No real physics or trade-offs                              - Multitudes of spreadsheets
   - Tapping without consequence                                - Inaccessible math & orbital mechanics
   - Does not teach engineering                                 - Discourages junior learners
```

### The Outpost Commander Bridge:
1. **Physical Cause & Effect:** Real-time **Live Trade-off Arrows** (▲ Surplus / ▼ Deficit) calculate turn deltas *before* the commander commits power allocations.
2. **Dual-Cognitive Presentation:** Every habitat module provides a **Junior Explorer Narrative** (intuitive real-world metaphors, e.g., *"The Greenhouse is an Astronaut Supermarket"*) alongside the **NASA Flight Director Telemetry** (exact BVAD thermodynamic equations and NASA mission citations).
3. **High-Stakes Space Weather:** Unpredictable Solar Particle Events (SPE), regional dust storms ($\tau = 10.8$), and micrometeoroid punctures force junior commanders to prioritize crew survival over perfection.

---

## ⚡ The 4 Engineering Pillars (100 MW Microgrid)

Commanders balance four interdependent engineering pillars within a hard **100 MW** microgrid pool:

```
+----------------------------------------------------------------------------------------------------+
|                                    100 MW POWER ALLOCATION DECK                                    |
|  [===========================   ===================   =============   ===========================] |
|     30 MW Power Grid            30 MW Life Support      20 MW Shield      20 MW Food Production    |
+----------------------------------------------------------------------------------------------------+
```

### 1. 🔋 Power Grid & Energy Storage
- **Engineering Role:** Manages primary power distribution, Kilopower Stirling core generation, photovoltaic array angles, and regenerative battery banks.
- **Physical Dynamics:** Under-allocation triggers deep discharge cycles, thermal battery degradation, and emergency brownouts. Excess energy is routed into high-capacity lithium-sulfur/solid-state storage cells to survive nighttime and dust storms.
- **NASA Heritage:** Los Alamos / Glenn Research Center **Kilopower KRUSTY** (Kilopower Reactor Using Stirling Technology) 1–10 kWe space fission architecture.

### 2. 🫁 Life Support System (ECLSS)
- **Engineering Role:** Maintains closed-loop oxygen revitalization, $CO_2$ removal, catalytic trace contaminant control, and cabin humidity regulation.
- **Physical Dynamics:** Requires baseline power to crack water ice and regenerate breathing air. Power deficits cause cabin $CO_2$ buildup and acute hypoxia, directly damaging crew morale and triggering emergency alarms.
- **NASA Heritage:** ISS ECLSS, Perseverance **MOXIE** (Solid Oxide Electrolysis), and the **Sabatier Catalytic Methanation Reactor** ($0.84\text{ kg O}_2/\text{astronaut/day}$ per NASA-STD-3001).

### 3. 🛡️ Radiation Shielding & Thermal Control
- **Engineering Role:** Energizes high-voltage active electromagnetic deflector fields, circulates water-wall radiation buffers, and drives active fluid cooling loops.
- **Physical Dynamics:** Deflects incoming Galactic Cosmic Rays (GCR) and episodic Solar Particle Events (SPE). Insufficient shielding allows cumulative biological doses to exceed the NASA lifetime ceiling ($500\text{ mSv}$), forcing emergency medical triage.
- **NASA Heritage:** Langley Research Center Water-Wall Habitation, Kennedy Space Center Electrodynamic Dust Shield (EDS), and LRO CRaTER dosimeters.

### 4. 🥗 Hydroponic Food Production
- **Engineering Role:** Regulates the Advanced Plant Habitat (APH): high-efficiency LED grow arrays (450 nm blue / 660 nm red), nutrient solution aeroponics, and root-zone thermal blankets.
- **Physical Dynamics:**
  - **Caloric Balance:** 4 crew members require $10,000\text{ kcal/day}$ total ($2,500\text{ kcal/astronaut/day}$).
  - **Crop Lifecycle:** Crops mature across a deterministic 3-Sol growth cycle.
  - **Thermal Shock:** If greenhouse power falls below $10\text{ MW}$, plants suffer immediate thermal freezing and growth stunting.
  - **Harvest Surge:** Reaching 100% maturity triggers a fresh crop harvest, injecting $+4\text{ reserve days}$ of high-nutrition fresh biomass and $+15\%\text{ crew morale}$.
- **NASA Heritage:** NASA Kennedy **Veggie** & **Advanced Plant Habitat (APH)** operating aboard the International Space Station.

---

## ☄️ Extreme NASA Historic & Future Scenarios

In addition to custom sandbox missions, commanders can test their mettle against three high-stakes, historical NASA exploration crises:

| Scenario | Destination & Environment | Primary Hazard | Mission Challenge |
| :--- | :--- | :--- | :--- |
| **🌑 Artemis III: The 14-Day Lunar Night** | Shackleton Crater Rim (*Moon*) | $336\text{ hours}$ of total darkness at $-173^\circ\text{C}$ (100 K) | Solar generation drops to **0 MW**. The commander must balance limited Kilopower baseload and battery reserves without letting the hydroponic bay freeze. |
| **🔴 Opportunity 2018: Global Dust Storm** | Gale Crater / Meridiani (*Mars*) | Atmospheric opacity spikes to $\tau = 10.8$ | Massive planet-encircling dust storm blots out $99.5\%$ of sunlight. Simulates the actual storm that concluded the historic 15-year Opportunity rover mission. |
| **🚀 Apollo 13: Cold Cabin Emergency** | Lunar Transit Trajectory | Cryogenic $O_2$ tank rupture; total grid power capped at $20\text{ MW}$ | Severe power rationing. Commanders must endure extreme freezing conditions, moisture condensation, and manually prioritize life support over all auxiliary subsystems. |

---

## 🔬 Interactive Habitat Cutaway Inspector

Commanders can click any module inside the responsive SVG outpost cross-section to open the **NASA Habitat Telemetry Inspector**. This window exposes real NASA mathematical models and engineering equations:

```
+------------------------------------------------------------------------------------+
| 🔍 NASA HABITAT MODULE INSPECTOR: ECLSS & ATMOSPHERIC REVITALIZATION              |
+------------------------------------------------------------------------------------+
| JUNIOR EXPLORER VIEW:                                                              |
| "The Life Support module is like a giant set of mechanical lungs! It traps the CO2 |
| you exhale and splits water into fresh oxygen so the crew can breathe."            |
+------------------------------------------------------------------------------------+
| NASA BVAD-3001 ENGINEERING FORMULA:                                                |
|                                                                                    |
|   Sabatier Reactor:                                                                |
|   CO2 + 4H2  ---[ 400°C, Ni ]--->  CH4 + 2H2O   (ΔH = -165 kJ/mol)                 |
|                                                                                    |
|   Water Electrolysis:                                                              |
|   2H2O  ---[ e- ]--->  2H2 + O2  ==>  m_dot_O2 = 0.84 kg / astronaut / day         |
|                                                                                    |
|   Operating Temp: 18°C - 24°C  |  Cabin Pressure: 101.3 kPa  |  BVAD Class: Flight |
+------------------------------------------------------------------------------------+
```

### Module Formulas Integrated in Engine:

1. **Hydroponics Bay Transpiration & Caloric Burn:**
   $$E_{\text{crew}} = \sum_{i=1}^{N_{\text{crew}}} \dot{C}_i = 4 \times 2,500\text{ kcal/day} = 10,000\text{ kcal/day}$$
   $$\dot{m}_{\text{H}_2\text{O}} = A_{\text{canopy}} \cdot \phi_{\text{transpiration}} = 10\text{ m}^2 \times 0.25\text{ L/m}^2/\text{hr} = 60\text{ L/day}$$

2. **Radiation Attenuation (Beer-Lambert & Lorentz Force):**
   $$I(x) = I_0 \cdot e^{-\left(\frac{\mu}{\rho}\right) \cdot \rho x} \quad \text{and} \quad \vec{F}_L = q \left( \vec{E} + \vec{v} \times \vec{B} \right)$$
   $$H = \int \frac{d\Phi}{dE} \cdot S(E) \cdot Q(L) \, dE \le 500\text{ mSv (Career Ceiling)}$$

3. **Kilopower Stirling Heat-to-Electricity Conversion:**
   $$\eta_{\text{Stirling}} = \frac{T_H - T_C}{T_H} \cdot \varepsilon_{\text{mech}} \approx \frac{923\text{ K} - 333\text{ K}}{923\text{ K}} \times 0.50 \approx 32\%$$
   $$P_{\text{grid}}(t) = P_{\text{Kilopower}} + \sum A_{\text{solar}} \cdot S_0 \cdot \cos(\theta) \cdot e^{-\tau / \cos(\theta)}$$

4. **Kennedy Electrodynamic Dust Shield (EDS) Dielectrophoresis:**
   $$\vec{F}_{\text{EDS}} = q\vec{E} + 2\pi \varepsilon_m r^3 K \nabla |\vec{E}|^2 > \vec{F}_{\text{van der Waals}} + m\vec{g}$$

---

## 👩‍🏫 Classroom & Educator Toolkit (NGSS Aligned)

Outpost Commander is purpose-built for easy integration into Middle School and Early High School Science and Engineering curricula (Ages 11–16, Grades 6–10).

### Next Generation Science Standards (NGSS) Alignment

| NGSS Standard | Description | Classroom Application |
| :--- | :--- | :--- |
| **MS-ETS1-2** | *Evaluate competing design solutions using a systematic process to determine how well they meet criteria and constraints.* | Students evaluate microgrid trade-offs (e.g., shielding vs. food production) to preserve crew health during solar storms. |
| **MS-ESS1-3** | *Analyze and interpret data to determine scale properties of solar system objects.* | Students compare solar flux and thermal swing differences between Shackleton Crater Rim (Moon) and Gale Crater (Mars). |
| **MS-ETS1-4** | *Develop a model to generate data for iterative testing and modification.* | Students iterate through 10-Sol missions, optimizing power presets across varied environmental seeds. |

### 🎲 Deterministic Classroom Seeds (`#SEED`)

To enable fair, synchronized classroom competitions and scientific reproducibility, Outpost Commander features a **Mulberry32-based deterministic Pseudo-Random Number Generator (PRNG)** initialized via a 32-bit **FNV-1a hash**:

```
Teacher generates URL: https://astronaut.beyondthebasics.me/?seed=ARTEMIS-CLASS-4B&env=lunar_south_pole
```

- Every student who enters `#ARTEMIS-CLASS-4B` receives the **exact same** sequence of space weather events, solar flares, dust storm opacities, and equipment wear rates.
- Eliminates RNG variance: students can directly compare how their distinct systems engineering strategies performed under identical planetary conditions!

### 📝 1-Click Printable STEM Flight Director Lab Worksheet

At the end of any mission (or via the Flight Recorder header), students and teachers can click **"Print / Save PDF Lab Report"** (`StemDebriefWorksheet.tsx`). This opens a printer-optimized, ink-friendly report containing:

1. **Official NASA Mission Header:** Flight seed, commander name, planetary outpost, completion status, and composite efficiency rating.
2. **Pure-SVG 10-Sol Telemetry Trends:** Visual line graph of Subsystem Health, Power Reserves, and Caloric Reserves.
3. **Guided Scientific Reflection Prompts:**
   - *Systems Engineering:* "Which subsystem demanded the most power, and how did your allocation impact the other three?"
   - *Incident Analysis:* "Describe the most critical space weather event. What was the physical root cause and your mitigation strategy?"
   - *Iterative Redesign:* "If you could re-run this exact seed, what power distribution would you change?"
4. **12-Point NGSS Grading Rubric:** Standardized rubric evaluating *Systems Engineering* (4 pts), *Scientific Reasoning* (4 pts), and *Resource Efficiency* (4 pts).

---

## 🛰️ NASA Scientific Grounding & Instrument Citations

Every planetary constant, radiation flux, and atmospheric pressure value is taken directly from published NASA mission publications:

| Mission & Instrument | Planetary Parameter | Grounded Value & Telemetry Impact | NASA Scientific Citation |
| :--- | :--- | :--- | :--- |
| **NASA LRO Diviner (DLRE)** | Lunar Surface Temperatures | **$\Delta 227^\circ\text{C}$ swing** ($-173^\circ\text{C}$ in shadow to $+54^\circ\text{C}$ on sunlit rim). Creates extreme thermal fatigue on radiator arrays. | [NASA LRO Diviner](https://diviner.ucla.edu/) |
| **NASA LRO LOLA** | Shackleton Crater Topography & Illumination | **$\sim 86\%$ seasonal sunlight** on elevated rim peaks; near-perpetual darkness inside crater floor. | [NASA LRO LOLA](https://lola.gsfc.nasa.gov/) |
| **NASA LRO CRaTER** | Lunar Cosmic Radiation Baseline | GCR baseline of **$0.30\text{ mSv/day}$**; elevated to multi-Sievert spikes during coronal mass ejections. | [LRO CRaTER](https://crater.bu.edu/) |
| **NASA MSL Curiosity REMS** | Gale Crater Meteorology | Atmospheric pressure of **$610\text{ Pa}$** ($<1\%$ Earth); diurnal air temperature from $-80^\circ\text{C}$ to $+20^\circ\text{C}$; optical opacity ($\tau$). | [MSL Curiosity REMS](https://mars.nasa.gov/msl/mission/instruments/rems/) |
| **NASA MSL Curiosity RAD** | Mars Surface Radiation Dose | Surface dose rate of **$0.64\text{ mSv/day}$**; thin $CO_2$ atmosphere provides only partial protection. | [MSL Curiosity RAD](https://mars.nasa.gov/msl/mission/instruments/rad/) |
| **NASA LCROSS & Mini-RF** | Polar Volatile Water Ice | **$5.6\% \pm 2.9\%$ water ice equivalent** in permanently shadowed cold traps, providing in-situ oxygen feedstock. | [NASA LCROSS Mission](https://www.nasa.gov/mission_pages/LCROSS/main/) |
| **NASA MSL SAM & Phoenix MECA** | Regolith Toxic Perchlorates | **$\sim 0.5\%$ toxic perchlorate salt salts** in soil, requiring catalytic wash before use in food substrate. | [NASA MSL SAM](https://mars.nasa.gov/msl/mission/instruments/sam/) |
| **NASA MOXIE (Perseverance)** | In-Situ Atmospheric Electrolysis | Solid oxide electrolysis of atmospheric $CO_2$ producing $6\text{ to }10\text{ g O}_2/\text{hr}$. | [NASA MOXIE](https://mars.nasa.gov/mars2020/spacecraft/instruments/moxie/) |
| **NASA Kilopower KRUSTY** | Space Nuclear Fission Power | $1\text{ to }10\text{ kWe}$ enriched uranium-235 core paired with sodium heat pipes and Stirling engines. | [NASA Kilopower](https://www.nasa.gov/directorates/stmd/game-changing-development-program/kilopower/) |
| **NASA BVAD-3001** | Life Support Baseline Constants | $2,500\text{ kcal/person/day}$, $0.84\text{ kg O}_2/\text{day}$, $2.5\text{ L H}_2\text{O}/\text{day}$, $500\text{ mSv}$ career radiation cap. | [NASA/TP-2015-218570](https://ntrs.nasa.gov/citations/20150002905) |

---

## 🌍 Offline PWA & Multi-Language i18n Architecture

### Native Progressive Web App (PWA)
Built for school computer labs with strict firewalls or unstable internet connectivity:
- **Service Worker Offline Cache:** All HTML, CSS, JavaScript, and Web Audio synthesizers are cached locally upon first visit.
- **Installable Desktop/Mobile App:** Can be installed directly to the home screen or desktop shelf via standard Web App Manifest (`manifest.webmanifest`).
- **Zero Remote Assets:** Operates 100% autonomously without external CDNs, tracking pixels, or third-party fonts.

### Multi-Language Internationalization (i18n)
Outpost Commander supports **6 major global languages**, enabling classrooms worldwide to participate in the NASA Space Apps Challenge in their native tongue:
- 🇺🇸 **English (EN)** — Native NASA Mission Terminology
- 🇪🇸 **Español (ES)** — Spanish
- 🇫🇷 **Français (FR)** — French
- 🇩🇪 **Deutsch (DE)** — German
- 🇯🇵 **日本語 (JA)** — Japanese
- 🇧🇷 **Português (PT)** — Portuguese

Language switching is accessible anytime from the top navigation bar and preserves all active telemetry state.

---

## 🔊 Audio Synthesis & Procedural FX Engine

Outpost Commander features an immersive procedural sound engine (`src/utils/soundEffects.ts`) constructed entirely with the browser's native **Web Audio API**:

- **Zero MP3 / WAV Assets:** Requires zero audio downloads, eliminating network latency and bandwidth constraints.
- **Custom Oscillators & Envelopes:**
  - *Slider Stepping:* Micro-frequency sine clicks ($1,200\text{ Hz} \rightarrow 800\text{ Hz}$).
  - *Sol Advance Chime:* Ascending D-major chord arpeggio ($D_5 \rightarrow A_5 \rightarrow D_6$).
  - *Emergency Warning Pulse:* Dual sawtooth modulated alert pulse ($440\text{ Hz} \leftrightarrow 880\text{ Hz}$).
  - *Mission Victory Fanfare:* Resonant Major 9th synthetic arpeggio.
- **Audio State Memory:** Persistent user mute/unmute preference stored in `localStorage`.

---

## 💻 Local Development & Verification

### Prerequisites
- **Node.js:** `v18.0.0` or higher
- **npm:** `v9.0.0` or higher

### Installation & Local Server

```bash
# 1. Clone the repository
git clone https://github.com/your-username/outpost-commander.git

# 2. Navigate to project root
cd outpost-commander

# 3. Install dependencies
npm install

# 4. Start local development server
npm run dev
```

Visit the local development server (typically `http://localhost:5173`) in any modern browser.

### Production Build & Code Quality

```bash
# Run TypeScript compilation check and bundle optimized production assets
npm run build

# Preview the production build locally
npm run preview
```

> [!NOTE]
> The production build compiles cleanly with **0 TypeScript errors and 0 Vite warnings**, outputting minified, tree-shaken chunks to `dist/`.

---

## 🤖 NASA Space Apps AI & Scientific Disclosure

*In full compliance with NASA International Space Apps Challenge guidelines and Hackathon rules regarding transparent tool usage:*

This project utilized AI-assisted pair programming and development tools (Google DeepMind's Gemini and Antigravity, and Anthropic's Claude via Claude Code) during the designated hackathon window. Specifically:
- **Architectural Scaffolding:** Accelerated the implementation of modular React 19 components and TypeScript simulation types.
- **NASA Publication Synthesis:** Assisted in cross-referencing published numerical parameters from NASA technical reports (NASA/TP-2015-218570, LRO Diviner, Curiosity REMS/RAD) into mathematical simulation constants.
- **Procedural Audio Synthesis:** Assisted in formulating mathematical frequency envelopes and gain ramps for native Web Audio API oscillators.
- **Human Oversight & Verification:** All game balance formulas, educational narratives, classroom rubrics, user interface design, and final code commits were manually verified, engineered, and approved by the project team.

---

## 📜 License & Credits

- **Project:** Outpost Commander — Junior Astronaut Mission Trainer
- **Hackathon:** NASA International Space Apps Challenge 2026
- **Scientific Citations:** NASA, Jet Propulsion Laboratory (JPL-Caltech), Goddard Space Flight Center (GSFC), UCLA Diviner Team, Boston University CRaTER Team.
- **License:** Open source under the [MIT License](LICENSE).
