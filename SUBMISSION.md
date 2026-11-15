# Space Apps 2026 — Project Page Text (copy/paste)

> Paste each section into the matching field on your team's **Project** tab, click **Save Progress**,
> tick both checkboxes, then **Submit for Judging** before **11:59 p.m. local time, Sunday Nov 15**.
>
> Before submitting: open both links in a private/incognito window to confirm they load with no login.

---

## Project Name

Outpost Commander: Junior Astronaut Mission Trainer

---

## High-Level Project Summary

Outpost Commander is a free, browser-based mission simulator that teaches kids (ages 8–14) how astronauts actually stay alive: by making trade-offs. Players command a crew of four at an outpost on the Moon, Mars, Europa or Titan for ten days. Each morning they split a fixed power budget between life support, radiation shielding, food production and batteries, then watch the consequences play out in a live 3D habitat. Real space-weather events — solar particle storms, Martian dust storms, Jupiter's radiation belts — are drawn from NASA mission data, and each one names the NASA instrument that measured it. A root-cause debrief turns every failure into a lesson, and teacher tools (class codes, printable lab reports, certificates) make it ready for classrooms. It matters because it teaches systems thinking — not just space facts — to the Artemis Generation, with no installs, no logins, in six languages, and offline.

---

## Link to Project Demo

https://astronaut.beyondthebasics.me/pitch.html

---

## Link to Final Project

https://astronaut.beyondthebasics.me

(Source code: https://github.com/RXcodeWalker/space-apps-challenge-om — make sure this repo is **public** if you include it.)

---

## Detailed Project Description

**What it does**

Outpost Commander puts a young player in the role of commander of a small outpost with four astronauts. The goal is simple to say and hard to do: keep everyone alive for ten days.

- **Choose a world.** Lunar South Pole (Shackleton crater rim), Mars (Gale crater), Europa (under-ice station) or Titan (hydrocarbon base). Each has its own gravity, temperature, radiation and power sources based on NASA measurements.
- **Plan each day.** A forecast shows how much power is available. The player splits it between four systems using sliders: life support (oxygen), radiation shield, food production and the power grid (batteries).
- **Run the day.** The simulation updates oxygen, food, radiation dose, battery charge and each astronaut's health. The live 3D habitat reacts — the shield dome, greenhouse lights and battery lamps follow the sliders — and a plain-language day report explains what happened and why.
- **Handle incidents.** Real-science events arrive: an X-class solar particle event on the Moon, a galactic cosmic-ray surge on Mars, a global dust storm like the one that ended NASA's Opportunity rover. Each card explains the science and names the NASA instrument and mission. Players pick an engineering response and can play a 15-second hands-on intervention (align the magnetic shield, reset circuit breakers, wash perchlorate from soil).
- **Debrief.** At the end, a debrief scores the mission, shows crew vitals and dose, and a "Why did this happen?" view traces failures back to the decision that caused them. Players can print a STEM lab report and a junior astronaut certificate, and design their own mission patch.

**How it works**

- A deterministic simulation engine (TypeScript) models power, oxygen (≈0.85 kg O₂ per astronaut per day), food (2,500 kcal per astronaut per day), radiation dose against a mission limit, battery state and crew health. Constants come from NASA standards and mission data (see NASA Data below).
- A seeded random generator means a **class code** gives every student the exact same space weather, so a class can compare strategies fairly.
- A live space-weather badge reads current solar flares from **NASA DONKI** and the planetary Kp index from **NOAA SWPC**, with an offline cache.
- Three difficulty ranks (Cadet, Commander, Flight Director) and historic scenarios (Artemis III night, Opportunity dust storm, Apollo 13 cold cabin) give replay value for different ages.

**Benefits and intended impact**

- Teaches **systems thinking and engineering trade-offs** — the core skill of real mission design — instead of memorized facts.
- **Classroom-ready:** class codes, printable lab report aligned to middle-school engineering standards (NGSS MS-ETS1-2, MS-ESS1-3), certificates, and a teacher page.
- **Accessible to everyone:** free, no account, no install, runs in any modern browser, installable as an offline app on iPads and Chromebooks, six languages (English, Spanish, French, German, Japanese, Portuguese), colour-blind-safe status colours, keyboard support and reduced-motion support.

**Tools, languages and software**

React 19, TypeScript, Vite, Tailwind CSS, Three.js (3D habitat and planets), Framer Motion, Web Audio API (procedural sound and radio voice), Service Worker/PWA, deployed on Vercel.

**Creativity and design decisions**

- Every number a player sees has a source — the in-game **Data** page lists the NASA instrument and dataset behind each value.
- The power budget is deliberately scaled for gameplay so that numbers are easy for kids to reason about; the *relationships* (radiation vs. shielding, sunlight vs. power, crew metabolism vs. oxygen and food) follow NASA data.
- A single fixed budget forces the central lesson: in space, nothing is free — help one system and another one pays.

**Factors considered**

Age-appropriate language, short sessions for a class period (one mission ≈ 10–15 minutes), low-end school hardware, offline classrooms, colour-blind learners, and non-English speakers.

---

## Use of Super Intelligence (SI)

Yes. Our team used AI coding assistants during the hackathon: Google Gemini / Antigravity and Anthropic Claude (Claude Code). We used them to help write and debug React/TypeScript code, scaffold UI components, generate procedural audio code, fix layout bugs, and draft text such as this submission and the demo slides. AI also helped us look up and cross-check published values from NASA sources; we checked those values against the original NASA pages listed below. All game design decisions, scientific choices and final content were reviewed and approved by our team. No AI-generated images, video or voices of real people are used; the in-game radio voice uses the browser's built-in speech synthesis.

---

## NASA Data

- **NASA DONKI (Space Weather Database of Notifications, Knowledge, Information)** — live solar flare feed: https://api.nasa.gov/ (DONKI FLR endpoint)
- **Lunar Reconnaissance Orbiter – Diviner Lunar Radiometer** — lunar surface temperatures: https://diviner.ucla.edu/
- **LRO – LOLA (Lunar Orbiter Laser Altimeter)** — illumination at Shackleton crater rim: https://lola.gsfc.nasa.gov/
- **LRO – CRaTER** — lunar radiation environment: https://crater.unh.edu/
- **LCROSS** — water ice in permanently shadowed craters: https://www.nasa.gov/mission_pages/LCROSS/main/
- **Mars Science Laboratory (Curiosity) – RAD** — Mars surface radiation dose: https://mars.nasa.gov/msl/spacecraft/instruments/rad/
- **Curiosity – REMS** — Mars weather and temperature: https://mars.nasa.gov/msl/spacecraft/instruments/rems/
- **Mars 2020 – MOXIE** — oxygen production from Mars CO₂: https://mars.nasa.gov/mars2020/spacecraft/instruments/moxie/
- **Opportunity rover** — 2018 global dust storm: https://mars.nasa.gov/mer/mission/status/opportunity/all/
- **Europa Clipper** — Jupiter radiation and Europa ice: https://europa.nasa.gov/mission/science/
- **Cassini (Titan science)** — Titan atmosphere and lakes: https://science.nasa.gov/mission/cassini/science/titan/
- **Dragonfly** — Titan rotorcraft concept: https://dragonfly.jhuapl.edu/
- **Kilopower / KRUSTY** — fission surface power: https://www.nasa.gov/directorates/stmd/game-changing-development-program/kilopower/
- **Radioisotope Power Systems (MMRTG)**: https://rps.nasa.gov/
- **NASA-STD-3001 Vol. 1** — crew health and dose standards: https://standards.nasa.gov/standard/NASA/NASA-STD-3001-VOL-1
- **ISS Environmental Control and Life Support System (ECLSS)**: https://www.nasa.gov/reference/environmental-control-and-life-support-system/
- **NASA Baseline Values and Assumptions Document (crew metabolism)**: https://ntrs.nasa.gov/citations/20150002905
- **Apollo 13 mission report** — "Cold Cabin" scenario: https://history.nasa.gov/alsj/a13/a13.report.html

---

## Space Agency Partner Data and Other References

- **ESA – Cassini-Huygens** (Titan surface and atmosphere): https://www.esa.int/Science_Exploration/Space_Science/Cassini-Huygens
- **NOAA Space Weather Prediction Center** — live planetary Kp index: https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json
- **Johns Hopkins APL – Dragonfly mission**: https://dragonfly.jhuapl.edu/
- **Los Alamos National Laboratory – Kilopower reactor test**: https://www.lanl.gov/
- **UCLA Diviner team**, **University of New Hampshire / Boston University CRaTER team**
- **NGSS (Next Generation Science Standards)** — MS-ETS1-2, MS-ESS1-3: https://www.nextgenscience.org/
- Open-source libraries: React, Three.js, Vite, Tailwind CSS, Framer Motion, Lucide icons.
- Fonts: Barlow, Barlow Condensed and IBM Plex Mono (Google Fonts, SIL Open Font License).
