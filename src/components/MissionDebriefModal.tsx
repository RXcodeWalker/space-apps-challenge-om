// ============================================================
// MissionDebriefModal.tsx — End-of-Mission Engineering Debrief
// Features:
// 1. Mission Outcome Rank (Artemis Master Engineer, Outpost Survivor, etc.)
// 2. Pure SVG/CSS Turn-by-Turn Line/Bar Interactive Subsystem Telemetry Chart
// 3. 2 Specific Personalized Engineering Insights synthesized from run history
// 4. One-click "Play Again" and "Switch Planet" buttons
// ============================================================
import { useState, useMemo } from "react";
import {
  Award,
  RotateCcw,
  Globe,
  Database,
  Sparkles,
  ShieldAlert,
  Printer,
  X,
} from "lucide-react";

import type { GameState } from "../engine/simulationEngine";
import type { MissionEnvironment } from "../data/nasaConstants";
import FlightRecorderReplay from "./FlightRecorderReplay";
import JuniorAstronautCertificate from "./JuniorAstronautCertificate";
import StemDebriefWorksheet from "./StemDebriefWorksheet";
import { calculateOutcomeRank } from "../utils/flightRecorder";
import { DIFFICULTY_PRESETS } from "../data/difficultyTiers";
import { useTranslation } from "../i18n/LanguageContext";
import LanguageSelector from "./LanguageSelector";

interface MissionDebriefModalProps {
  isOpen: boolean;
  gameState: GameState;
  environment: MissionEnvironment;
  onPlayAgain: () => void;
  onSwitchPlanet: () => void;
  onShowNasaData?: () => void;
  onClose?: () => void;
}

function generatePersonalizedInsights(
  gameState: GameState,
  environment: MissionEnvironment
): [string, string] {
  const insights: string[] = [];
  const incidents = gameState.incidentHistory || [];
  const history = gameState.history || [];

  // Insight 1: Based on specific incident choices
  const speChoice = incidents.find((i) =>
    i.incidentId.includes("spe") || i.incidentTitle.includes("Solar Particle")
  );
  const dustStormChoice = incidents.find((i) =>
    i.incidentId.includes("dust_storm") || i.incidentTitle.includes("Dust Storm")
  );
  const iceDrillChoice = incidents.find((i) =>
    i.incidentId.includes("ice_drill") || i.incidentTitle.includes("Ice Drill")
  );
  const thermalPunctureChoice = incidents.find((i) =>
    i.incidentId.includes("puncture") || i.incidentTitle.includes("Thermal Blanket")
  );
  const dustDevilChoice = incidents.find((i) =>
    i.incidentId.includes("dust_devil") || i.incidentTitle.includes("Dust Devil")
  );
  const perchlorateChoice = incidents.find((i) =>
    i.incidentId.includes("perchlorate") || i.incidentTitle.includes("Perchlorate")
  );
  const co2FreezingChoice = incidents.find((i) =>
    i.incidentId.includes("compressor") || i.incidentTitle.includes("Compressor Freezing")
  );

  if (speChoice) {
    if (speChoice.choiceId === "divert_water_wall") {
      insights.push(
        "You prioritized shielding during the X-class solar flare by energizing the active water-wall; this completely neutralized crew radiation dose, though life support hydroponics dipped temporarily under the diverted megawatts."
      );
    } else if (speChoice.choiceId === "retreat_storm_shelter") {
      insights.push(
        "During the solar storm, you ordered the crew into the regolith bunker; this kept astronauts safe without draining electrical megawatts, though routine maintenance was halted."
      );
    } else {
      insights.push(
        "You accepted an elevated radiation dose (+3.8 mSv) during the solar storm to preserve continuous grid output — a high-risk trade-off that tested astronaut biological limits."
      );
    }
  } else if (dustStormChoice) {
    if (dustStormChoice.choiceId === "ration_life_support") {
      insights.push(
        "During Sol 2's Martian dust storm, you conservatively rationed life support air scrubbers; this preserved your battery pool through a 55% solar collapse while keeping O₂ buffers above critical threshold."
      );
    } else {
      insights.push(
        "You fully discharged battery reserves during the Martian dust storm to keep habitat life support at 100%, taking severe storage battery wear to avoid crew discomfort."
      );
    }
  } else if (iceDrillChoice && iceDrillChoice.choiceId === "overclock_drill_harvest") {
    insights.push(
      "You over-clocked the TRIDENT cryo-drill in Shackleton Crater; absorbing the 25 MW grid surge rewarded your outpost with a permanent +15% water and oxygen recycling buffer."
    );
  } else if (thermalPunctureChoice && thermalPunctureChoice.choiceId === "divert_thermal_power") {
    insights.push(
      "Following the micrometeorite puncture, you utilized resistive MLI heating to counteract −173°C thermal bleed, preventing habitat freezing at the cost of 18 MW of grid reserve."
    );
  } else if (dustDevilChoice && dustDevilChoice.choiceId === "risk_vortex_cleaning") {
    insights.push(
      "You gambled on the Gale Crater dust devil path; catching the natural aerodynamic wind scour cleaned your solar arrays for a massive +20 MW generation boost identical to Spirit's 2005 breakthrough."
    );
  } else if (perchlorateChoice && perchlorateChoice.choiceId === "catalytic_purification") {
    insights.push(
      "You deployed multi-stage catalytic dechlorination when toxic perchlorate salts infiltrated the well, spending 14 MW to preserve long-term crop safety."
    );
  } else if (co2FreezingChoice) {
    insights.push(
      "When Gale Crater temperatures plummeted to −95°C, your thermal defrost pulse cleared dry-ice frost from the MOXIE intake scroll, preserving continuous oxygen production."
    );
  }

  // Insight 2: Based on system interaction trends
  if (history.length > 0) {
    const avgLifeSupport =
      history.reduce((acc, h) => acc + h.subsystems.lifeSupport.health, 0) /
      history.length;
    const avgShield =
      history.reduce(
        (acc, h) => acc + h.subsystems.radiationShielding.health,
        0
      ) / history.length;
    const avgGrid =
      history.reduce((acc, h) => acc + h.subsystems.powerGrid.health, 0) /
      history.length;

    if (gameState.crew.radiationExposureMSv < 2.0 && avgShield >= 75) {
      insights.push(
        `Your proactive radiation deflection kept total cumulative exposure to just ${gameState.crew.radiationExposureMSv.toFixed(
          2
        )} mSv, well within NASA's stringent deep-space health guidelines.`
      );
    } else if (gameState.crew.oxygenBufferPercent >= 80 && avgLifeSupport >= 75) {
      insights.push(
        `Consistent power feeding to ECLSS scrubbers maintained an exemplary ${gameState.crew.oxygenBufferPercent.toFixed(
          0
        )}% oxygen buffer, preventing the insidious CO₂ buildup that risks long-duration missions.`
      );
    } else if (avgGrid < 60) {
      insights.push(
        `Power grid wear accumulated to ${gameState.subsystems.powerGrid.wearAccumulated.toFixed(
          2
        )}, showing how sustained peak draws degrade transformer longevity over a 10-sol deployment.`
      );
    } else {
      insights.push(
        `Your balanced triple-subsystem allocation maintained an average grid stability of ${avgGrid.toFixed(
          0
        )}% across the ${history.length} completed sols.`
      );
    }
  }

  // Fallbacks if fewer than 2
  if (insights.length === 0) {
    insights.push(
      `Your mission achieved a final composite operational score of ${gameState.cumulativeScore}/100 in the ${environment.name} environment.`
    );
  }
  if (insights.length === 1) {
    insights.push(
      `The crew concluded operations with ${gameState.crew.morale}% morale and ${gameState.crew.foodReserveDays.toFixed(
        1
      )} days of remaining food reserves.`
    );
  }

  return [insights[0], insights[1]];
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function MissionDebriefModal({
  isOpen,
  gameState,
  environment,
  onPlayAgain,
  onSwitchPlanet,
  onShowNasaData,
  onClose,
}: MissionDebriefModalProps) {
  const { t } = useTranslation();
  const [showCertificate, setShowCertificate] = useState(false);
  const [showWorksheet, setShowWorksheet] = useState(false);

  // Hooks must run on every render, so the open/closed early return comes after them.
  const open = isOpen && !!gameState;
  const outcomeRank = useMemo(
    () => (open ? calculateOutcomeRank(gameState) : null),
    [open, gameState]
  );
  const insights = useMemo(
    () => (open ? generatePersonalizedInsights(gameState, environment) : null),
    [open, gameState, environment]
  );

  if (!open || !outcomeRank || !insights) return null;
  const [insight1, insight2] = insights;

  const rankTone: "accent" | "caution" = outcomeRank.tier === "trainee" ? "caution" : "accent";
  const difficulty = DIFFICULTY_PRESETS[gameState.difficulty || "commander"];
  const crewStatusTone = (status: string): "neutral" | "accent" | "caution" | "critical" =>
    status === "nominal"
      ? "neutral"
      : status === "heroic"
      ? "accent"
      : status === "irradiated" || status === "fatigued"
      ? "caution"
      : "critical";

  return (
    <>
      <div className="oc-modal-root" role="dialog" aria-modal="true" aria-labelledby="debrief-title">
        {/* Backdrop */}
        <div className="oc-modal-scrim" onClick={onClose} />

        {/* Modal window */}
        <div className="oc-modal oc-modal--lg" data-tone={rankTone}>
          {/* Header bar */}
          <div className="oc-modal__bar">
            <span id="debrief-title">
              <Award size={14} aria-hidden="true" />
              {t("debrief.title")}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 8, flex: "none" }}>
              <span className="hidden sm:inline">
                {gameState.scenario
                  ? gameState.scenario.title
                  : environment.id === "lunar_south_pole"
                  ? t("destinations.moon.name")
                  : environment.id === "mars_gale_crater"
                  ? t("destinations.mars.name")
                  : environment.name}
              </span>
              <LanguageSelector compact />
              {onClose && (
                <button type="button" onClick={onClose} className="oc-modal__close" style={{ margin: 0, width: 32, height: 32 }} title="Close Debrief Modal" aria-label="Close debrief">
                  <X size={16} aria-hidden="true" />
                </button>
              )}
            </span>
          </div>

          {/* Modal content */}
          <div className="oc-modal__body">
            {/* 1. Mission outcome rank card */}
            <div className="oc-card oc-card--tint" data-tone={rankTone} style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "stretch", gap: 16, padding: 24 }}>
              <div className="oc-section" style={{ flex: "1 1 280px", gap: 8 }}>
                <div className="oc-modal__eyebrow">
                  <span className="oc-chip oc-chip--solid" data-tone={rankTone}>{outcomeRank.badge}</span>
                  <span className="oc-chip oc-chip--plain">
                    {difficulty.emoji} {difficulty.commanderRank}
                  </span>
                  <span>Sol {gameState.currentTurn} of 10</span>
                </div>

                <h1 className="oc-modal__title" style={{ fontSize: 40, lineHeight: "44px" }}>
                  {outcomeRank.rankTitle}
                </h1>
                <p className="oc-modal__text" style={{ fontSize: 16, lineHeight: "24px", color: "var(--oc-text-1)" }}>
                  {outcomeRank.evaluation}
                </p>

                {/* Action pills */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                  <button type="button" onClick={() => setShowCertificate(true)} className="oc-btn oc-btn--primary" style={{ height: "auto", paddingTop: 8, paddingBottom: 8, whiteSpace: "normal", textAlign: "center" }}>
                    <Award size={16} aria-hidden="true" />
                    <span>{t("debrief.viewCertificate")}</span>
                  </button>
                  <button type="button" onClick={() => setShowWorksheet(true)} className="oc-btn" style={{ height: "auto", paddingTop: 8, paddingBottom: 8, whiteSpace: "normal", textAlign: "center" }}>
                    <Printer size={16} aria-hidden="true" />
                    <span>Print / Save PDF lab report</span>
                  </button>
                </div>
              </div>

              {/* Composite score */}
              <div className="oc-stat" style={{ flex: "0 0 auto", alignItems: "center", justifyContent: "center", minWidth: 140, padding: 16, background: "var(--oc-bg-panel)" }}>
                <span className="oc-stat__k">Mission score</span>
                <span className="oc-type-data-xl">{gameState.cumulativeScore}</span>
                <span className="oc-stat__s">out of 100</span>
              </div>
            </div>

            {/* Hardcore simulation realism breakdown (Flight Director) */}
            {gameState.difficulty === "flight_director" && (
              <div className="oc-card" data-tone="caution">
                <div className="oc-section__head">
                  <span className="oc-label" style={{ color: "var(--oc-caution)" }}>
                    <ShieldAlert size={16} aria-hidden="true" />
                    Hardcore simulation telemetry ledger
                  </span>
                  <span className="oc-label__meta" style={{ marginLeft: 0 }}>NASA-STD-3001 &amp; MMOD calibration</span>
                </div>
                <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                  <div className="oc-stat" style={{ background: "var(--oc-bg-panel)" }}>
                    <span className="oc-stat__k">MMOD micro-punctures</span>
                    <span className="oc-type-data-s" style={{ color: "var(--oc-text-1)" }}>
                      {gameState.micrometeoroidHistory.length} strikes repelled
                    </span>
                  </div>
                  <div className="oc-stat" style={{ background: "var(--oc-bg-panel)" }}>
                    <span className="oc-stat__k">Thermal fatigue wear</span>
                    <span className="oc-type-data-s" style={{ color: "var(--oc-text-1)" }}>
                      +{((gameState.cumulativeThermalFatigueWear || 0) * 100).toFixed(1)}% cyclic strain
                    </span>
                  </div>
                  <div className="oc-stat" style={{ background: "var(--oc-bg-panel)" }}>
                    <span className="oc-stat__k">Career radiation cap</span>
                    <span
                      className="oc-type-data-s"
                      style={{ color: gameState.crew.careerRadiationExposureMSv > 500 ? "var(--oc-critical)" : "var(--oc-text-1)" }}
                    >
                      {gameState.crew.careerRadiationExposureMSv.toFixed(1)}{" "}
                      <span style={{ color: "var(--oc-text-3)" }}>/ 500 mSv</span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Cadet mission achievement (Cadet mode) */}
            {gameState.difficulty === "cadet" && (
              <div className="oc-note" data-tone="accent">
                <Sparkles size={20} aria-hidden="true" />
                <div>
                  <h3 className="oc-label" style={{ color: "var(--oc-text-1)", margin: 0 }}>
                    Cadet flight assistant summary
                  </h3>
                  <p className="oc-modal__text" style={{ marginTop: 4 }}>
                    Congratulations on completing your mission with automated coaching! You learned how NASA flight directors balance life support air, water, and power grids on distant worlds.
                  </p>
                </div>
              </div>
            )}

            {/* Expedition crew status and flight surgeon citation */}
            {gameState.crew.members && gameState.crew.members.length > 0 && (
              <div className="oc-section">
                <div className="oc-section__head">
                  <span className="oc-label">
                    <span className="oc-label__shape" />
                    Expedition crew roster &amp; final vitals
                  </span>
                  <span className="oc-chip oc-chip--plain">4 astronauts deployed</span>
                </div>

                <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                  {gameState.crew.members.map((member) => (
                    <div key={member.id} className="oc-card" style={{ gap: 8 }}>
                      <div className="oc-section__head" style={{ alignItems: "flex-start", flexWrap: "nowrap" }}>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ margin: 0, fontWeight: 600, overflowWrap: "anywhere" }}>
                            {member.avatar} {member.name}
                          </p>
                          <p className="oc-readout__code" style={{ margin: 0 }}>{"“"}{member.callsign}{"”"}</p>
                        </div>
                        <span className="oc-chip" data-tone={crewStatusTone(member.status)}>
                          {member.status}
                        </span>
                      </div>

                      <div className="oc-kv" style={{ paddingTop: 8, borderTop: "1px solid var(--oc-line)", columnGap: 16 }}>
                        <span>Health <strong style={{ color: "var(--oc-text-1)", fontWeight: 500 }}>{member.health}%</strong></span>
                        <span>Morale <strong style={{ color: "var(--oc-text-1)", fontWeight: 500 }}>{member.morale}%</strong></span>
                        <span>Dose <strong style={{ color: "var(--oc-text-1)", fontWeight: 500 }}>{member.radiationDoseMSv.toFixed(1)} mSv</strong></span>
                        <span>Repairs <strong style={{ color: "var(--oc-text-1)", fontWeight: 500 }}>{member.repairsConducted}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Sol-by-sol mission replay and flight recorder */}
            <FlightRecorderReplay gameState={gameState} environment={environment} />

            {/* 3. Two personalized engineering insights */}
            <div className="oc-section">
              <div className="oc-section__head">
                <h2 className="oc-label" style={{ margin: 0 }}>
                  <Sparkles size={16} aria-hidden="true" />
                  Personalized engineering insights (based on your actual run)
                </h2>
              </div>

              <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
                <div className="oc-card" data-tone="accent" style={{ justifyContent: "space-between", gap: 12 }}>
                  <div className="oc-section">
                    <span className="oc-chip" data-tone="accent" style={{ alignSelf: "flex-start" }}>Hazard decision trade-off</span>
                    <p className="oc-modal__text" style={{ color: "var(--oc-text-1)", fontSize: 16, lineHeight: "24px" }}>{insight1}</p>
                  </div>
                  <div className="oc-readout__code">Verified against mission incident logs</div>
                </div>

                <div className="oc-card" style={{ justifyContent: "space-between", gap: 12 }}>
                  <div className="oc-section">
                    <span className="oc-chip oc-chip--plain" style={{ alignSelf: "flex-start" }}>Resource dynamic takeaway</span>
                    <p className="oc-modal__text" style={{ color: "var(--oc-text-1)", fontSize: 16, lineHeight: "24px" }}>{insight2}</p>
                  </div>
                  <div className="oc-readout__code">Calibrated by NASA ECLSS &amp; power models</div>
                </div>
              </div>
            </div>

            {/* Final crew and consumable metrics */}
            <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
              <div className="oc-stat">
                <span className="oc-stat__k">Crew morale</span>
                <span className="oc-stat__v">{gameState.crew.morale}%</span>
              </div>
              <div className="oc-stat">
                <span className="oc-stat__k">Oxygen buffer</span>
                <span className="oc-stat__v">{gameState.crew.oxygenBufferPercent.toFixed(0)}%</span>
              </div>
              <div className="oc-stat">
                <span className="oc-stat__k">Food reserve</span>
                <span className="oc-stat__v">{gameState.crew.foodReserveDays.toFixed(1)} <span className="oc-readout__unit">sols</span></span>
              </div>
              <div className="oc-stat">
                <span className="oc-stat__k">Cumulative radiation</span>
                <span className="oc-stat__v">{gameState.crew.radiationExposureMSv.toFixed(2)} <span className="oc-readout__unit">mSv</span></span>
              </div>
            </div>
          </div>

          {/* Modal action bar */}
          <div className="oc-modal__foot oc-modal__foot--flow">
            {onShowNasaData ? (
              <button type="button" onClick={onShowNasaData} className="oc-btn">
                <Database size={16} aria-hidden="true" />
                <span>{t("common.nasaData")}</span>
              </button>
            ) : (
              <span />
            )}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "flex-end" }}>
              {/* Switch planet */}
              <button type="button" onClick={onSwitchPlanet} className="oc-btn">
                <Globe size={16} aria-hidden="true" />
                <span>{t("common.switchPlanet")}</span>
              </button>

              {/* One-click play again */}
              <button type="button" onClick={onPlayAgain} className="oc-btn oc-btn--primary">
                <RotateCcw size={16} aria-hidden="true" />
                <span>{t("common.playAgain")}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Junior Astronaut Mission Certificate Modal */}
      {showCertificate && (
        <JuniorAstronautCertificate
          isOpen={showCertificate}
          onClose={() => setShowCertificate(false)}
          gameState={gameState}
          environment={environment}
          rankTitle={outcomeRank.rankTitle}
          rankTier={outcomeRank.tier}
        />
      )}

      {/* STEM Flight Director Debrief Worksheet Modal */}
      {showWorksheet && (
        <StemDebriefWorksheet
          isOpen={showWorksheet}
          onClose={() => setShowWorksheet(false)}
          gameState={gameState}
          environment={environment}
        />
      )}
    </>
  );
}
