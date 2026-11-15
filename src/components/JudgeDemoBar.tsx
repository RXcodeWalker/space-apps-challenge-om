// ============================================================
// JudgeDemoBar.tsx — Unobtrusive Judge Express Demo Bar
// Provides rapid 3-minute hackathon evaluation shortcuts:
// 1. Jump to Sol 9 Crisis (Low battery, active Solar Particle Event)
// 2. Trigger Crisis Minigame (15s Shield, Breaker, or Soil Wash)
// 3. View Mission Debrief (Interactive SVG chart & STEM certificate)
// 4. Preview Printable Lab Report (@media print STEM worksheet)
//
// Layout contract: the collapsed pill is a small flat button in a thin strip in
// normal page flow (after the content), so it never overlaps a primary control.
// When opened, the bar is a centred modal dialog (scrim, Escape / click-outside /
// chevron to dismiss) so it can never half-cover the page it launches from.
// ============================================================

import { useEffect } from "react";
import { FastForward, Radio, Award, FileText, Zap, ChevronDown, Sparkles, Sun } from "lucide-react";
import { soundEffects } from "../utils/soundEffects";

interface JudgeDemoBarProps {
  isOpen: boolean;
  onToggle: () => void;
  onJumpToSol9: () => void;
  onTriggerMinigame: () => void;
  onViewDebrief: () => void;
  onPreviewLabReport: () => void;
  onOpenSolarTracker?: () => void;
  onOpenPatchDesigner?: () => void;
}

// Judge/demo controls are hidden. Flip to true to bring them back.
const SHOW_JUDGE_DEMO = false;

/**
 * Subtle Nav Pill for Header Navigation bars
 */
export function JudgeDemoNavPill({
  onClick,
  isOpen,
}: {
  onClick: () => void;
  isOpen?: boolean;
}) {
  if (!SHOW_JUDGE_DEMO) return null;
  return (
    <button
      type="button"
      onClick={() => {
        soundEffects.playButtonClick();
        onClick();
      }}
      className="oc-btn oc-btn--sm oc-toggle"
      aria-pressed={!!isOpen}
      title="Judge Express Demo Bar (Hackathon 3-Minute Rapid Evaluation)"
    >
      <Zap size={14} aria-hidden="true" />
      <span>Demo / Fast-Forward</span>
    </button>
  );
}

interface DemoAction {
  code: string;
  title: string;
  tag: string;
  body: string;
  icon: React.ReactNode;
  tone: "critical" | "accent" | "caution" | "neutral";
  onClick?: () => void;
}

export default function JudgeDemoBar({
  isOpen,
  onToggle,
  onJumpToSol9,
  onTriggerMinigame,
  onViewDebrief,
  onPreviewLabReport,
  onOpenSolarTracker,
  onOpenPatchDesigner,
}: JudgeDemoBarProps) {
  // Global keyboard shortcut ('d' or 'D') to toggle drawer if not focused on inputs
  useEffect(() => {
    if (!SHOW_JUDGE_DEMO) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea") return;

      if (e.key === "Escape" && isOpen) {
        onToggle();
        return;
      }

      if (e.key === "d" || e.key === "D") {
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          onToggle();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onToggle, isOpen]);

  if (!SHOW_JUDGE_DEMO) return null;

  const actions: DemoAction[] = [
    {
      code: "SOL 9",
      title: "Jump to Sol 9 crisis",
      tag: "High stakes",
      body: "Low battery, brownout alert & active Solar Particle Event incident.",
      icon: <FastForward size={16} aria-hidden="true" />,
      tone: "critical",
      onClick: onJumpToSol9,
    },
    {
      code: "15 S",
      title: "Trigger crisis mini-game",
      tag: "Triage",
      body: "Tactile micro-puzzles: Magnetic Shield, Circuit Breaker, or Soil Wash.",
      icon: <Radio size={16} aria-hidden="true" />,
      tone: "caution",
      onClick: onTriggerMinigame,
    },
    {
      code: "10 SOL",
      title: "View mission debrief",
      tag: "SVG chart",
      body: "Interactive SVG chart, AI insights & printable STEM certificate.",
      icon: <Award size={16} aria-hidden="true" />,
      tone: "accent",
      onClick: onViewDebrief,
    },
    {
      code: "PRINT",
      title: "Printable lab report",
      tag: "@media print",
      body: "Directly preview the NASA flight director STEM lab report & rubric.",
      icon: <FileText size={16} aria-hidden="true" />,
      tone: "neutral",
      onClick: onPreviewLabReport,
    },
    ...(onOpenSolarTracker
      ? [
          {
            code: "ORBIT",
            title: "Solar elevation & shadow tracker",
            tag: "NASA LRO & Curiosity",
            body: "Inspect Moon 1.5° grazing sun vs Mars 25.2° diurnal arc, 20 km crater shadows & Artemis vertical solar masts.",
            icon: <Sun size={16} aria-hidden="true" />,
            tone: "caution" as const,
            onClick: onOpenSolarTracker,
          },
        ]
      : []),
    ...(onOpenPatchDesigner
      ? [
          {
            code: "PATCH",
            title: "Mission patch designer studio",
            tag: "Vector SVG",
            body: "Customize an embroidered expedition patch: 4 crest shapes, 6 SVG insignia, NASA color schemes, and SVG/PNG export.",
            icon: <Sparkles size={16} aria-hidden="true" />,
            tone: "accent" as const,
            onClick: onOpenPatchDesigner,
          },
        ]
      : []),
  ];

  return (
    <>
      {/* Collapsed pill: lives in normal page flow (a thin strip after the content), so it can
          never float over a destination card, slider or Run Day button at any screen size. */}
      {!isOpen && (
        <div className="oc-demo-strip">
          <button
            type="button"
            onClick={() => {
              soundEffects.playButtonClick();
              onToggle();
            }}
            className="oc-btn oc-btn--sm oc-demo-pill"
            title="Open Judge Express Demo Bar (Press 'D')"
            aria-label="Open Judge Express Demo Bar"
          >
            <Zap size={14} aria-hidden="true" />
            <span>Judge demo</span>
            <span className="oc-btn__right">D</span>
          </button>
        </div>
      )}

      {/* Opened state: modal dialog with an explicit close button. */}
      {isOpen && (
        <div className="oc-modal-root" role="dialog" aria-modal="true" aria-label="Judge Express Demo Bar">
          <div className="oc-modal-scrim" onClick={onToggle} />
          <div className="oc-modal oc-modal--sm" data-tone="caution">
          <div className="oc-modal__bar">
            <span>
              <Zap size={14} aria-hidden="true" />
              Judge express demo bar
            </span>
            <button
              type="button"
              onClick={() => {
                soundEffects.playButtonClick();
                onToggle();
              }}
              className="oc-modal__close"
              style={{ margin: 0, width: 32, height: 32 }}
              title="Minimize Demo Bar (Press 'D')"
              aria-label="Minimize demo bar"
            >
              <ChevronDown size={16} aria-hidden="true" />
            </button>
          </div>

          <div className="oc-modal__body" style={{ gap: 8, padding: 16 }}>
            <p className="oc-modal__text">
              Jump immediately into any phase of Outpost Commander without playing all 10 Sols.
            </p>

            {actions.map((a) => (
              <button
                key={a.title}
                type="button"
                className="oc-opt"
                data-tone={a.tone}
                onClick={() => {
                  soundEffects.playButtonClick();
                  a.onClick?.();
                }}
              >
                <span className="oc-readout__code" style={{ flex: "none", minWidth: 48, color: "var(--tone)" }}>
                  {a.code}
                </span>
                <span className="oc-opt__main">
                  <span className="oc-opt__title" style={{ fontSize: 14 }}>
                    {a.icon}
                    <span>{a.title}</span>
                    <span className="oc-chip oc-chip--plain">{a.tag}</span>
                  </span>
                  <span className="oc-opt__desc">{a.body}</span>
                </span>
              </button>
            ))}
          </div>

          <div className="oc-modal__foot" style={{ padding: "8px 16px" }}>
            <span className="oc-readout__code" style={{ overflowWrap: "anywhere" }}>
              Tip: ?demo=true auto-opens this bar
            </span>
            <span className="oc-readout__code">Press D to toggle</span>
          </div>
          </div>
        </div>
      )}
    </>
  );
}
