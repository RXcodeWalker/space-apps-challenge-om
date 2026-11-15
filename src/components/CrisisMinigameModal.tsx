// ============================================================
// CrisisMinigameModal.tsx — 15-Second Tactical Intervention Tester
// Allows hackathon judges to immediately launch & test all 3 NASA
// micro-puzzles: Magnetic Shield Deflector, Circuit Breaker Reroute,
// and Perchlorate Soil Wash Calibration with full audio & dynamic telemetry.
// Styled with the Flight Panel v3 modal shell (src/ui/modal.css).
// ============================================================

import { useState } from "react";
import { X, Shield, Zap, Beaker, Radio, RotateCcw, Sparkles } from "lucide-react";
import FlightDirectorIntervention from "./interventions/FlightDirectorIntervention";
import { SAMPLE_CRISIS_INCIDENTS } from "../utils/judgeDemoData";
import type { FlightDirectorInterventionResult, InterventionType } from "../types/intervention";
import { soundEffects } from "../utils/soundEffects";

interface CrisisMinigameModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: InterventionType;
}

const TABS: { type: InterventionType; code: string; label: string; sub: string; Icon: typeof Shield }[] = [
  { type: "magnetic_shield", code: "RAD", label: "Magnetic Shield", sub: "Solar particle vector", Icon: Shield },
  { type: "circuit_breaker", code: "EPS", label: "Circuit Breaker", sub: "120 MW grid reroute", Icon: Zap },
  { type: "perchlorate_wash", code: "AGRI", label: "Perchlorate Wash", sub: "Toxic salt removal", Icon: Beaker },
];

export default function CrisisMinigameModal({
  isOpen,
  onClose,
  initialType = "magnetic_shield",
}: CrisisMinigameModalProps) {
  const [activeType, setActiveType] = useState<InterventionType>(initialType);
  const [resetNonce, setResetNonce] = useState<number>(0);
  const [latestResult, setLatestResult] = useState<FlightDirectorInterventionResult | null>(null);

  if (!isOpen) return null;

  const currentIncident = SAMPLE_CRISIS_INCIDENTS[activeType];

  const handleSwitchType = (type: InterventionType) => {
    soundEffects.playButtonClick();
    setActiveType(type);
    setLatestResult(null);
    setResetNonce((n) => n + 1);
  };

  const handleRestartTimer = () => {
    soundEffects.playButtonClick();
    setLatestResult(null);
    setResetNonce((n) => n + 1);
  };

  return (
    <div className="oc-modal-root" role="dialog" aria-modal="true" aria-labelledby="crisis-title">
      {/* Backdrop dismiss */}
      <div className="oc-modal-scrim" onClick={onClose} />

      <div className="oc-modal" data-tone="critical">
        <div className="oc-modal__bar">
          <span>
            <Radio size={14} aria-hidden="true" />
            15-sec tactical triage
          </span>
          <span>Judge express sandbox</span>
        </div>

        <div className="oc-modal__head">
          <div className="oc-modal__headrow">
            <div className="oc-section" style={{ gap: 4 }}>
              <h2 id="crisis-title" className="oc-modal__title">
                Flight Director emergency interventions
              </h2>
              <p className="oc-modal__text">
                Fast-paced tactile micro-puzzles teaching real NASA engineering triage under pressure.
              </p>
            </div>
            <button type="button" onClick={onClose} className="oc-modal__close" title="Close Sandbox" aria-label="Close sandbox">
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="oc-modal__body">
          {/* Minigame selector */}
          <div
            role="group"
            aria-label="Mini-game"
            style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}
          >
            {TABS.map(({ type, code, label, sub, Icon }) => (
              <button
                key={type}
                type="button"
                className="oc-opt oc-opt--grid"
                aria-pressed={activeType === type}
                onClick={() => handleSwitchType(type)}
              >
                <span className="oc-readout__code">{code}</span>
                <span className="oc-opt__title" style={{ fontSize: 14 }}>
                  <Icon size={16} aria-hidden="true" />
                  <span>{label}</span>
                </span>
                <span className="oc-opt__desc" style={{ fontSize: 12, lineHeight: "16px" }}>{sub}</span>
              </button>
            ))}
          </div>

          {/* Incident context */}
          <div className="oc-card">
            <div className="oc-section__head" style={{ alignItems: "flex-start", flexWrap: "nowrap" }}>
              <div className="oc-section" style={{ gap: 4, minWidth: 0 }}>
                <div className="oc-kv">
                  <span style={{ color: "var(--oc-accent)" }}>{currentIncident.nasaScience.instrument}</span>
                  <span>{currentIncident.nasaScience.mission}</span>
                </div>
                <p className="oc-modal__lede">{currentIncident.headline}</p>
                <p className="oc-modal__text">{currentIncident.description}</p>
              </div>

              <button type="button" onClick={handleRestartTimer} className="oc-btn oc-btn--sm" title="Reset 15-Second Timer" style={{ flex: "none" }}>
                <RotateCcw size={14} aria-hidden="true" />
                <span>Reset 15s</span>
              </button>
            </div>
          </div>

          {/* Interactive 15-second intervention component */}
          <FlightDirectorIntervention
            key={`${activeType}-${resetNonce}`}
            incident={currentIncident}
            onInterventionComplete={(res) => setLatestResult(res)}
            activeResult={latestResult}
          />
        </div>

        <div className="oc-modal__foot">
          <div className="oc-modal__foot-note">
            <Sparkles size={16} aria-hidden="true" style={{ flex: "none", color: "var(--oc-accent)" }} />
            <span>Features sub-second Web Audio countdown ticking and Cadet mode auto-resolve.</span>
          </div>
          <button type="button" onClick={onClose} className="oc-btn">
            Done testing
          </button>
        </div>
      </div>
    </div>
  );
}
