// ============================================================
// IncidentModal.tsx — Outpost Commander Dynamic NASA Incident Modal
// Presents location-specific mid-mission hazards, real NASA instrument
// science, engineering trade-off decisions, and optional
// Emergency Crew Specialist repair assignments (Risk vs. Reward).
// Styled with the Flight Panel v3 modal shell (src/ui/modal.css).
// ============================================================
import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Info,
  Radio,
  Users,
  Shield,
} from "lucide-react";
import type { IncidentCard, IncidentChoice } from "../data/incidentCards";
import type { FlightDirectorInterventionResult } from "../types/intervention";
import FlightDirectorIntervention from "./interventions/FlightDirectorIntervention";
import {
  type CrewRoleId,
  type CrewMember,
  type SpecialistRepairOption,
  INCIDENT_SPECIALIST_REPAIRS,
} from "../data/crewData";
import { soundEffects } from "../utils/soundEffects";

interface IncidentModalProps {
  incident: IncidentCard;
  isOpen: boolean;
  crewMembers?: CrewMember[];
  onSelectChoice: (
    choice: IncidentChoice,
    specialistRepair?: SpecialistRepairOption,
    interventionResult?: FlightDirectorInterventionResult
  ) => void;
}

const SPECIALIST_ROLES: { id: CrewRoleId; code: string; label: string; sub: string }[] = [
  { id: "botanist", code: "AGRI", label: "Dr. Lin (Botanist)", sub: "Crops & O₂" },
  { id: "power_engineer", code: "EPS", label: "Cdr. Vance (Power)", sub: "Grid & Megawatts" },
  { id: "medical_officer", code: "MED", label: "Dr. Chen (Medical)", sub: "Health & Morale" },
  { id: "geologist", code: "EVA", label: "Dr. Rivera (EVA)", sub: "Hull & Regolith" },
];

export default function IncidentModal({
  incident,
  isOpen,
  crewMembers = [],
  onSelectChoice,
}: IncidentModalProps) {
  const [selectedChoiceId, setSelectedChoiceId] = useState<string>(
    incident.choices[0]?.id || ""
  );

  // Crew Specialist Assignment State: "none" or one of the 4 roles
  const [selectedSpecialistRole, setSelectedSpecialistRole] = useState<CrewRoleId | "none">("none");

  // 15-Second Flight Director Tactical Intervention State
  const [interventionResult, setInterventionResult] =
    useState<FlightDirectorInterventionResult | null>(null);

  useEffect(() => {
    if (isOpen) {
      soundEffects.playIncidentAlert();
      setSelectedSpecialistRole("none");
      setSelectedChoiceId(incident.choices[0]?.id || "");
      setInterventionResult(null);
    }
  }, [isOpen, incident]);

  const selectedChoice =
    incident.choices.find((c) => c?.id === selectedChoiceId) ||
    incident.choices[0];

  const specialistRepairs = INCIDENT_SPECIALIST_REPAIRS[incident.id];
  const activeSpecialistRepair: SpecialistRepairOption | undefined =
    selectedSpecialistRole !== "none" && specialistRepairs
      ? specialistRepairs[selectedSpecialistRole]
      : undefined;

  const activeCrewMember = crewMembers.find((m) => m.role === selectedSpecialistRole);

  if (!isOpen || !incident) return null;

  const tone: "critical" | "caution" | "accent" =
    incident.severity === "critical" ? "critical" : incident.severity === "warning" ? "caution" : "accent";
  const severityLabel =
    incident.severity === "critical"
      ? "Critical flight alert"
      : incident.severity === "warning"
      ? "Environmental hazard"
      : "Mission opportunity";
  const SeverityIcon =
    incident.severity === "critical" ? ShieldAlert : incident.severity === "warning" ? AlertTriangle : Sparkles;

  const interventionTone =
    interventionResult?.status === "success"
      ? "accent"
      : interventionResult?.status === "skipped"
      ? "neutral"
      : "critical";

  return (
    <div className="oc-modal-root" role="dialog" aria-modal="true" aria-labelledby="incident-title">
      <div className="oc-modal-scrim" />

      <div className="oc-modal" data-tone={tone}>
        {/* Alert bar */}
        <div className="oc-modal__bar">
          <span>
            <Radio size={14} aria-hidden="true" />
            Incoming NASA telemetry {"·"} Sol {incident.triggerSol}
          </span>
          <span>
            {incident.environmentId === "lunar_south_pole"
              ? "Moon // Shackleton rim"
              : incident.environmentId === "mars_gale_crater"
              ? "Mars // Gale crater"
              : incident.environmentId === "europa_under_ice"
              ? "Europa // Sub-surface ocean"
              : "Titan // Kraken Mare"}
          </span>
        </div>

        {/* Header */}
        <div className="oc-modal__head">
          <div className="oc-modal__eyebrow">
            <span className="oc-chip" data-tone={tone}>
              {severityLabel}
            </span>
            <span>Sol {incident.triggerSol} of 10</span>
          </div>
          <h2 id="incident-title" className="oc-modal__title">
            <SeverityIcon size={24} aria-hidden="true" />
            <span>{incident.title}</span>
          </h2>
          <p className="oc-modal__lede">{incident.headline}</p>
          <p className="oc-modal__text">{incident.description}</p>
        </div>

        {/* Body */}
        <div className="oc-modal__body">
          {/* Real NASA science */}
          <div className="oc-card" data-tone="accent">
            <div className="oc-section__head">
              <span className="oc-chip oc-chip--solid" data-tone="accent">
                <Sparkles size={12} aria-hidden="true" />
                {incident.nasaScience.badgeTitle}
              </span>
              {incident.nasaScience.dataSourceUrl && (
                <a
                  href={incident.nasaScience.dataSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="oc-linkbtn"
                  style={{ display: "inline-flex", alignItems: "center" }}
                  title="Open NASA reference"
                  aria-label="Open NASA reference"
                >
                  <ExternalLink size={16} aria-hidden="true" />
                </a>
              )}
            </div>
            <p className="oc-modal__lede">{incident.nasaScience.mission}</p>
            <p className="oc-kv">
              <span>Instrument: {incident.nasaScience.instrument}</span>
            </p>
            <p className="oc-modal__text">{incident.nasaScience.explanation}</p>
          </div>

          {/* 15-second Flight Director tactical intervention */}
          <FlightDirectorIntervention
            incident={incident}
            onInterventionComplete={(res) => setInterventionResult(res)}
            activeResult={interventionResult}
          />

          {/* Section 1: primary commander directive */}
          <div className="oc-section">
            <div className="oc-section__head">
              <span className="oc-label">
                <span className="oc-label__shape" />
                1. Base engineering directive (required)
              </span>
              <span className="oc-label__meta">{incident.choices.filter(Boolean).length} options</span>
            </div>

            <div className="oc-section" role="radiogroup" aria-label="Base engineering directive">
              {incident.choices.map((choice) => {
                if (!choice) return null;
                const isSelected = selectedChoice?.id === choice.id;
                return (
                  <button
                    key={choice.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    className="oc-opt"
                    onClick={() => {
                      soundEffects.playButtonClick();
                      setSelectedChoiceId(choice.id);
                    }}
                  >
                    <span className="oc-opt__pip" aria-hidden="true" />
                    <span className="oc-opt__main">
                      <span className="oc-opt__title">
                        <span className="oc-chip oc-chip--plain">{choice.shortTag}</span>
                        <span>{choice.label}</span>
                      </span>
                      <span className="oc-opt__desc">{choice.description}</span>
                      <span className="oc-kv" style={{ marginTop: 4 }}>
                        <span style={{ color: "var(--oc-caution)" }}>Trade-off:</span>
                        <span style={{ color: "var(--oc-text-1)", overflowWrap: "anywhere" }}>
                          {choice.tradeOffSummary}
                        </span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: emergency crew specialist repair assignment */}
          {specialistRepairs && (
            <div className="oc-section">
              <div className="oc-section__head">
                <span className="oc-label">
                  <Users size={16} aria-hidden="true" />
                  2. Emergency crew repair (risk vs. reward)
                </span>
                <span className="oc-chip oc-chip--plain">Commander authorization</span>
              </div>
              <p className="oc-modal__text">
                Authorize a specialist astronaut for immediate emergency intervention. Introduces a
                tactical risk-vs-reward choice: high systemic rewards to the outpost at the expense
                of individual astronaut radiation dose, physical injury, or morale shock.
              </p>

              <div
                role="group"
                aria-label="Crew specialist"
                style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}
              >
                <button
                  type="button"
                  className="oc-opt oc-opt--grid"
                  aria-pressed={selectedSpecialistRole === "none"}
                  onClick={() => {
                    soundEffects.playButtonClick();
                    setSelectedSpecialistRole("none");
                  }}
                >
                  <span className="oc-readout__code">SAFE</span>
                  <span className="oc-opt__title" style={{ fontSize: 14 }}>
                    <Shield size={16} aria-hidden="true" />
                    <span>Safe Shelter</span>
                  </span>
                  <span className="oc-opt__desc" style={{ fontSize: 12, lineHeight: "16px" }}>
                    No crew risk
                  </span>
                </button>

                {SPECIALIST_ROLES.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    className="oc-opt oc-opt--grid"
                    aria-pressed={selectedSpecialistRole === role.id}
                    onClick={() => {
                      soundEffects.playButtonClick();
                      setSelectedSpecialistRole(role.id);
                    }}
                  >
                    <span className="oc-readout__code">{role.code}</span>
                    <span className="oc-opt__title" style={{ fontSize: 14 }}>
                      {role.label}
                    </span>
                    <span className="oc-opt__desc" style={{ fontSize: 12, lineHeight: "16px" }}>
                      {role.sub}
                    </span>
                  </button>
                ))}
              </div>

              {activeSpecialistRepair ? (
                <div className="oc-card" data-tone="accent">
                  <div className="oc-section__head" style={{ alignItems: "flex-start" }}>
                    <div className="oc-opt__title">
                      <span className="oc-chip" data-tone="accent">
                        Specialist action
                      </span>
                      <span>{activeSpecialistRepair.actionTitle}</span>
                    </div>
                    {activeSpecialistRepair.isHighRiskWarning && (
                      <span className="oc-chip oc-chip--solid" data-tone="critical">
                        <AlertTriangle size={12} aria-hidden="true" />
                        High flux EVA risk
                      </span>
                    )}
                  </div>
                  <p className="oc-modal__lede" style={{ fontStyle: "italic" }}>
                    {"“"}
                    {activeSpecialistRepair.actionPrompt}
                    {"”"}
                  </p>
                  <p className="oc-modal__text">{activeSpecialistRepair.tacticalSummary}</p>

                  <div
                    style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}
                  >
                    <div className="oc-note" data-tone="accent">
                      <Sparkles size={16} aria-hidden="true" />
                      <div>
                        <div className="oc-label" style={{ color: "var(--oc-accent)" }}>
                          Outpost reward
                        </div>
                        <div>{activeSpecialistRepair.rewardDescription}</div>
                      </div>
                    </div>
                    <div className="oc-note" data-tone="caution">
                      <AlertTriangle size={16} aria-hidden="true" />
                      <div>
                        <div className="oc-label" style={{ color: "var(--oc-caution)" }}>
                          Personal crew risk
                        </div>
                        <div>{activeSpecialistRepair.riskDescription}</div>
                      </div>
                    </div>
                  </div>

                  {activeCrewMember && (
                    <div className="oc-kv" style={{ paddingTop: 8, borderTop: "1px solid var(--oc-line)" }}>
                      <span style={{ color: "var(--oc-text-1)" }}>
                        {activeCrewMember.avatar} {activeCrewMember.name} ({activeCrewMember.roleTitle})
                      </span>
                      <span>Health {activeCrewMember.health}%</span>
                      <span>Morale {activeCrewMember.morale}%</span>
                      <span>Dose {activeCrewMember.radiationDoseMSv.toFixed(2)} mSv</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="oc-note oc-note--quiet">
                  <Shield size={16} aria-hidden="true" />
                  <span>
                    <strong>Safe Shelter active:</strong> All 4 astronauts remain secured inside
                    radiation-shielded storm modules. Zero individual biological risk.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="oc-modal__foot">
          <div className="oc-modal__foot-note">
            <Info size={16} aria-hidden="true" style={{ flex: "none", color: "var(--oc-accent)" }} />
            <span style={{ minWidth: 0 }}>
              {activeSpecialistRepair
                ? `Deploying ${activeCrewMember?.name || "Astronaut"} to emergency repair.`
                : "Automated systems protocol selected. No crew assigned to risk."}
            </span>
            {interventionResult && (
              <span className="oc-chip" data-tone={interventionTone}>
                Intervention:{" "}
                {interventionResult.status === "success"
                  ? "Optimal deflection / grid balanced"
                  : interventionResult.status === "skipped"
                  ? "Auto-resolved (Cadet mode)"
                  : "Breached"}
              </span>
            )}
          </div>

          <button
            type="button"
            className="oc-btn oc-btn--primary"
            disabled={!selectedChoice}
            onClick={() => {
              if (selectedChoice) {
                onSelectChoice(selectedChoice, activeSpecialistRepair, interventionResult || undefined);
              }
            }}
          >
            <span>
              {activeSpecialistRepair
                ? `Authorize order & deploy ${activeCrewMember?.callsign || "Specialist"}`
                : "Execute engineering directive"}
            </span>
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
