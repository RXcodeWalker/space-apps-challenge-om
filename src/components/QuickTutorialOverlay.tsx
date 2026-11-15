// ============================================================
// QuickTutorialOverlay.tsx — 3-Step Spotlight Mission Tutorial
// Takes < 15 seconds to complete. Dismissible at any point.
// Steps:
// 1. Shared 100 MW Power Budget
// 2. Live Trade-off Arrows
// 3. NASA Incident Alerts & Telemetry
// ============================================================
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Zap,
  Activity,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { soundEffects } from "../utils/soundEffects";
import { useTranslation } from "../i18n/LanguageContext";

export interface QuickTutorialOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StepConfig {
  targetSelector: string;
  badge: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  tip: string;
  tone: "accent" | "caution";
}

export const TUTORIAL_STORAGE_KEY = "outpost_commander_tutorial_seen";

export default function QuickTutorialOverlay({
  isOpen,
  onClose,
}: QuickTutorialOverlayProps) {
  const { t } = useTranslation();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const steps: StepConfig[] = useMemo(
    () => [
      {
        targetSelector: '[data-tutorial="power-budget"]',
        badge: "STEP 1 OF 3",
        title: t("tutorial.step1Title"),
        icon: <Zap size={20} aria-hidden="true" />,
        description: t("tutorial.step1Body"),
        tip: "Keep Net Power at 0 MW (balanced) or positive to keep batteries charged!",
        tone: "accent",
      },
      {
        targetSelector: '[data-tutorial="tradeoff-arrows"]',
        badge: "STEP 2 OF 3",
        title: t("tutorial.step2Title"),
        icon: <Activity size={20} aria-hidden="true" />,
        description: t("tutorial.step2Body"),
        tip: "Check the projected changes under each gauge before you press Run Day!",
        tone: "accent",
      },
      {
        targetSelector: '[data-tutorial="incident-alerts"]',
        badge: "STEP 3 OF 3",
        title: t("tutorial.step3Title"),
        icon: <AlertTriangle size={20} aria-hidden="true" />,
        description: t("tutorial.step3Body"),
        tip: "Open Data from the menu anytime to inspect genuine LRO and Curiosity sensor records.",
        tone: "caution",
      },
    ],
    [t]
  );

  const step = steps[currentStepIndex];

  // Measure and track target element position
  const updateTargetPosition = useCallback(() => {
    if (!isOpen) return;
    const el = document.querySelector(step.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
      // Smooth scroll target into comfortable view if partially offscreen
      if (rect.top < 60 || rect.bottom > window.innerHeight - 60) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } else {
      setTargetRect(null);
    }
  }, [isOpen, step.targetSelector]);

  useEffect(() => {
    if (!isOpen) return;

    updateTargetPosition();
    const handleResizeOrScroll = () => updateTargetPosition();

    window.addEventListener("resize", handleResizeOrScroll);
    window.addEventListener("scroll", handleResizeOrScroll, true);

    const timeout = setTimeout(updateTargetPosition, 250);

    return () => {
      window.removeEventListener("resize", handleResizeOrScroll);
      window.removeEventListener("scroll", handleResizeOrScroll, true);
      clearTimeout(timeout);
    };
  }, [isOpen, currentStepIndex, updateTargetPosition]);

  if (!isOpen) return null;

  const handleNext = () => {
    soundEffects.playButtonClick();
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    soundEffects.playButtonClick();
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    soundEffects.playButtonClick();
    try {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
    } catch {
      // Ignore storage errors
    }
    onClose();
  };

  const handleSkip = () => {
    soundEffects.playButtonClick();
    try {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
    } catch {
      // Ignore storage errors
    }
    onClose();
  };

  // Determine ideal position for the tooltip popover. On phones the card is docked to the
  // edge of the screen opposite the target so it never hides what it is pointing at.
  const hasTarget = targetRect !== null && targetRect.width > 0;
  const isTargetNearBottom = hasTarget && targetRect.top + targetRect.height / 2 > window.innerHeight * 0.45;
  const dockClass = isTargetNearBottom ? "oc-tut--top" : "oc-tut--bottom";

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto">
      {/* Scrim */}
      <div className="oc-modal-scrim" onClick={handleSkip} />

      {/* Spotlight ring around target */}
      {hasTarget && (
        <div
          key={`spotlight-${currentStepIndex}`}
          className="oc-spot"
          style={{
            top: Math.max(8, targetRect.top - 8),
            left: Math.max(8, targetRect.left - 8),
            width: Math.min(window.innerWidth - 16, targetRect.width + 16),
            height: targetRect.height + 16,
          }}
        >
          <span className="oc-spot__n">{currentStepIndex + 1}</span>
        </div>
      )}

      {/* Floating tooltip card */}
      <div className={`oc-tut ${dockClass}`}>
        <div
          key={`tooltip-${currentStepIndex}`}
          className="oc-modal oc-modal--sm"
          data-tone={step.tone}
          role="dialog"
          aria-modal="true"
          aria-labelledby="tutorial-title"
          style={{ margin: 0, pointerEvents: "auto" }}
        >
          <div className="oc-modal__head">
            <div className="oc-modal__headrow">
              <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                <span className="oc-modal__eyebrow" style={{ color: "var(--tone)" }}>
                  {step.badge}
                </span>
                <h3 id="tutorial-title" className="oc-modal__title" style={{ fontSize: 24, lineHeight: "28px" }}>
                  <span style={{ display: "inline-flex", flex: "none", color: "var(--tone)" }}>{step.icon}</span>
                  <span>{step.title}</span>
                </h3>
              </div>
              <button type="button" onClick={handleSkip} className="oc-modal__close" title="Skip Tutorial" aria-label="Skip Tutorial">
                <X size={20} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="oc-modal__body" style={{ gap: 16 }}>
            <p className="oc-modal__text" style={{ fontSize: 16, lineHeight: "24px" }}>
              {step.description}
            </p>

            <div className="oc-note" data-tone="accent">
              <Sparkles size={16} aria-hidden="true" />
              <p style={{ margin: 0 }}>
                <strong>Commander's Tip:</strong> {step.tip}
              </p>
            </div>
          </div>

          <div className="oc-modal__foot">
            <div className="oc-dots" role="group" aria-label="Tutorial steps">
              {steps.map((_: StepConfig, idx: number) => (
                <button
                  key={idx}
                  type="button"
                  aria-current={idx === currentStepIndex ? "step" : undefined}
                  onClick={() => {
                    soundEffects.playButtonClick();
                    setCurrentStepIndex(idx);
                  }}
                  title={`Jump to Step ${idx + 1}`}
                  aria-label={`Jump to Step ${idx + 1}`}
                >
                  <i />
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
              <button type="button" onClick={handleSkip} className="oc-linkbtn">
                {t("tutorial.skip")}
              </button>

              {currentStepIndex > 0 && (
                <button type="button" onClick={handleBack} className="oc-btn">
                  <ChevronLeft size={16} aria-hidden="true" />
                  <span>{t("tutorial.prev")}</span>
                </button>
              )}

              <button type="button" onClick={handleNext} className="oc-btn oc-btn--primary">
                {currentStepIndex < steps.length - 1 ? (
                  <>
                    <span>{t("tutorial.next")}</span>
                    <ChevronRight size={16} aria-hidden="true" />
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} aria-hidden="true" />
                    <span>{t("tutorial.start")}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
