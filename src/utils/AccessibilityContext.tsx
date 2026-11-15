// ============================================================
// AccessibilityContext.tsx — Universal Classroom Usability
// High-Contrast & Colorblind-Safe Design System for Outpost Commander
// ColorBrewer / Okabe-Ito Compliant Palettes & Redundant Shape Markers
// ============================================================
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

export interface ShapeMarkers {
  surplus: string;   // ▲ for power/resource surplus
  deficit: string;   // ▼ for deficit/depletion
  brownout: string;  // ✖ for critical brownout/failure
  nominal: string;   // ✔ for nominal/balanced
  warning: string;   // ⚠ for caution/warning
}

export const SHAPE_MARKERS: ShapeMarkers = {
  surplus: "▲",
  deficit: "▼",
  brownout: "✖",
  nominal: "✔",
  warning: "⚠",
};

export interface ColorTokens {
  // Hex color codes
  nominal: string;
  surplus: string;
  deficit: string;
  danger: string;
  warning: string;

  // Specific Okabe-Ito / ColorBrewer reference hexes
  vermilion: string;
  magenta: string;
  cyanBlue: string;
  standardGreen: string;
  standardRed: string;

  // Tailwind utility classes
  nominalText: string;
  surplusText: string;
  deficitText: string;
  dangerText: string;
  warningText: string;

  nominalBg: string;
  surplusBg: string;
  deficitBg: string;
  dangerBg: string;
  warningBg: string;

  nominalBorder: string;
  surplusBorder: string;
  deficitBorder: string;
  dangerBorder: string;
  warningBorder: string;

  // Composite badge/pill styling
  nominalBadge: string;
  surplusBadge: string;
  deficitBadge: string;
  dangerBadge: string;
  warningBadge: string;
}

export const STANDARD_TOKENS: ColorTokens = {
  nominal: "#10b981", // Green
  surplus: "#10b981", // Green
  deficit: "#ef4444", // Red
  danger: "#ef4444",  // Red
  warning: "#f59e0b", // Amber
  vermilion: "#f97316",
  magenta: "#d946ef",
  cyanBlue: "#0284c7",
  standardGreen: "#10b981",
  standardRed: "#ef4444",

  nominalText: "text-emerald-400",
  surplusText: "text-emerald-400",
  deficitText: "text-red-400",
  dangerText: "text-red-400",
  warningText: "text-amber-400",

  nominalBg: "bg-emerald-500/20",
  surplusBg: "bg-emerald-500/20",
  deficitBg: "bg-red-500/20",
  dangerBg: "bg-red-500/20",
  warningBg: "bg-amber-500/20",

  nominalBorder: "border-emerald-500/40",
  surplusBorder: "border-emerald-500/40",
  deficitBorder: "border-red-500/40",
  dangerBorder: "border-red-500/40",
  warningBorder: "border-amber-500/40",

  nominalBadge: "bg-emerald-950/80 text-emerald-300 border border-emerald-500/40",
  surplusBadge: "bg-emerald-950/80 text-emerald-300 border border-emerald-500/40",
  deficitBadge: "bg-red-950/80 text-red-300 border border-red-500/40",
  dangerBadge: "bg-red-950/80 text-red-300 border border-red-500/40",
  warningBadge: "bg-amber-950/80 text-amber-300 border border-amber-500/40",
};

export const COLORBLIND_TOKENS: ColorTokens = {
  // Okabe-Ito / ColorBrewer Accessible Palette
  nominal: "#0284c7", // Cyan/Blue
  surplus: "#0284c7", // Cyan/Blue
  deficit: "#f97316", // Vermilion / Orange
  danger: "#f97316",  // Vermilion / Orange
  warning: "#facc15", // High-contrast Yellow
  vermilion: "#f97316",
  magenta: "#d946ef",
  cyanBlue: "#0284c7",
  standardGreen: "#10b981",
  standardRed: "#ef4444",

  nominalText: "text-[#0284c7] sm:text-sky-400 text-sky-400",
  surplusText: "text-[#0284c7] sm:text-sky-400 text-sky-400",
  deficitText: "text-[#f97316] sm:text-orange-400 text-orange-400",
  dangerText: "text-[#f97316] sm:text-orange-400 text-orange-400",
  warningText: "text-amber-300",

  nominalBg: "bg-sky-500/20",
  surplusBg: "bg-sky-500/20",
  deficitBg: "bg-orange-500/20",
  dangerBg: "bg-orange-500/20",
  warningBg: "bg-amber-500/20",

  nominalBorder: "border-sky-500/50",
  surplusBorder: "border-sky-500/50",
  deficitBorder: "border-orange-500/50",
  dangerBorder: "border-orange-500/50",
  warningBorder: "border-amber-500/50",

  nominalBadge: "bg-sky-950/80 text-sky-300 border border-sky-500/50",
  surplusBadge: "bg-sky-950/80 text-sky-300 border border-sky-500/50",
  deficitBadge: "bg-orange-950/80 text-orange-300 border border-orange-500/50",
  dangerBadge: "bg-orange-950/80 text-orange-300 border border-orange-500/50",
  warningBadge: "bg-amber-950/80 text-amber-300 border border-amber-500/50",
};

export type StatusCategory = "nominal" | "surplus" | "deficit" | "brownout" | "danger" | "warning";

export interface AccessibilityContextType {
  colorblindMode: boolean;
  toggleColorblindMode: () => void;
  setColorblindMode: (enabled: boolean) => void;
  tokens: ColorTokens;
  shapes: ShapeMarkers;
  /**
   * Helper to retrieve the appropriate shape marker for any status category
   */
  getStatusShape: (status: StatusCategory) => string;
  /**
   * Helper to prefix or pair a text label with its corresponding shape marker
   */
  formatWithShape: (status: StatusCategory, label: string) => string;
  /**
   * Computes styling and shape info for numerical deltas (positive, negative, neutral)
   */
  getDeltaMeta: (delta: number, isCriticalBrownout?: boolean) => {
    shape: string;
    textClass: string;
    bgClass: string;
    borderClass: string;
    badgeClass: string;
    hex: string;
    formatted: string;
  };
}

const STORAGE_KEY = "colorblindMode";
const LEGACY_STORAGE_KEY = "outpost_commander_colorblind_mode";

function readStoredColorblindMode(): boolean {
  if (typeof window === "undefined" || !window.localStorage) {
    return false;
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      return saved === "true";
    }
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy !== null) {
      return legacy === "true";
    }
  } catch {
    // Graceful fallback for privacy-hardened classroom environments
  }
  return false;
}

function persistColorblindMode(enabled: boolean) {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    localStorage.setItem(STORAGE_KEY, String(enabled));
    localStorage.setItem(LEGACY_STORAGE_KEY, String(enabled));
  } catch {
    // Ignore storage quota or security errors
  }
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [colorblindMode, setColorblindModeState] = useState<boolean>(readStoredColorblindMode);

  const setColorblindMode = useCallback((enabled: boolean) => {
    setColorblindModeState(enabled);
    persistColorblindMode(enabled);
  }, []);

  const toggleColorblindMode = useCallback(() => {
    setColorblindModeState((prev) => {
      const next = !prev;
      persistColorblindMode(next);
      return next;
    });
  }, []);

  // Sync with document element attributes for classroom CSS theming
  useEffect(() => {
    if (typeof document !== "undefined") {
      if (colorblindMode) {
        document.documentElement.classList.add("colorblind-mode");
        document.documentElement.setAttribute("data-colorblind", "true");
      } else {
        document.documentElement.classList.remove("colorblind-mode");
        document.documentElement.removeAttribute("data-colorblind");
      }
    }
  }, [colorblindMode]);

  // Synchronize across multiple browser tabs / windows in classroom setups
  useEffect(() => {
    function handleStorageChange(e: StorageEvent) {
      if (e.key === STORAGE_KEY || e.key === LEGACY_STORAGE_KEY) {
        if (e.newValue !== null) {
          setColorblindModeState(e.newValue === "true");
        }
      }
    }
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const tokens = useMemo(
    () => (colorblindMode ? COLORBLIND_TOKENS : STANDARD_TOKENS),
    [colorblindMode]
  );

  const getStatusShape = useCallback((status: StatusCategory): string => {
    switch (status) {
      case "surplus":
        return SHAPE_MARKERS.surplus;
      case "deficit":
        return SHAPE_MARKERS.deficit;
      case "brownout":
        return SHAPE_MARKERS.brownout;
      case "danger":
        return SHAPE_MARKERS.brownout;
      case "warning":
        return SHAPE_MARKERS.warning;
      case "nominal":
      default:
        return SHAPE_MARKERS.nominal;
    }
  }, []);

  const formatWithShape = useCallback(
    (status: StatusCategory, label: string): string => {
      const shape = getStatusShape(status);
      return `${shape} ${label}`;
    },
    [getStatusShape]
  );

  const getDeltaMeta = useCallback(
    (delta: number, isCriticalBrownout = false) => {
      if (isCriticalBrownout || delta < -15) {
        return {
          shape: SHAPE_MARKERS.brownout,
          textClass: tokens.dangerText,
          bgClass: tokens.dangerBg,
          borderClass: tokens.dangerBorder,
          badgeClass: tokens.dangerBadge,
          hex: tokens.danger,
          formatted: `${SHAPE_MARKERS.brownout} ${delta > 0 ? "+" : ""}${delta}`,
        };
      }
      if (delta < 0) {
        return {
          shape: SHAPE_MARKERS.deficit,
          textClass: tokens.deficitText,
          bgClass: tokens.deficitBg,
          borderClass: tokens.deficitBorder,
          badgeClass: tokens.deficitBadge,
          hex: tokens.deficit,
          formatted: `${SHAPE_MARKERS.deficit} ${delta}`,
        };
      }
      if (delta > 0) {
        return {
          shape: SHAPE_MARKERS.surplus,
          textClass: tokens.surplusText,
          bgClass: tokens.surplusBg,
          borderClass: tokens.surplusBorder,
          badgeClass: tokens.surplusBadge,
          hex: tokens.surplus,
          formatted: `${SHAPE_MARKERS.surplus} +${delta}`,
        };
      }
      return {
        shape: SHAPE_MARKERS.nominal,
        textClass: tokens.nominalText,
        bgClass: tokens.nominalBg,
        borderClass: tokens.nominalBorder,
        badgeClass: tokens.nominalBadge,
        hex: tokens.nominal,
        formatted: `${SHAPE_MARKERS.nominal} 0`,
      };
    },
    [tokens]
  );

  const contextValue = useMemo<AccessibilityContextType>(
    () => ({
      colorblindMode,
      toggleColorblindMode,
      setColorblindMode,
      tokens,
      shapes: SHAPE_MARKERS,
      getStatusShape,
      formatWithShape,
      getDeltaMeta,
    }),
    [
      colorblindMode,
      toggleColorblindMode,
      setColorblindMode,
      tokens,
      getStatusShape,
      formatWithShape,
      getDeltaMeta,
    ]
  );

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
}

/**
 * Hook to access the Accessibility & Colorblind-Safe Design System.
 * Safe to call even outside a provider (falls back to standard tokens).
 */
export function useAccessibility(): AccessibilityContextType {
  const context = useContext(AccessibilityContext);
  if (context) {
    return context;
  }

  // Graceful fallback if invoked outside provider (e.g. in standalone tests)
  const isColorblind = readStoredColorblindMode();
  const tokens = isColorblind ? COLORBLIND_TOKENS : STANDARD_TOKENS;

  return {
    colorblindMode: isColorblind,
    toggleColorblindMode: () => {},
    setColorblindMode: () => {},
    tokens,
    shapes: SHAPE_MARKERS,
    getStatusShape: (status: StatusCategory) => {
      switch (status) {
        case "surplus":
          return SHAPE_MARKERS.surplus;
        case "deficit":
          return SHAPE_MARKERS.deficit;
        case "brownout":
        case "danger":
          return SHAPE_MARKERS.brownout;
        case "warning":
          return SHAPE_MARKERS.warning;
        default:
          return SHAPE_MARKERS.nominal;
      }
    },
    formatWithShape: (status: StatusCategory, label: string) => {
      const shape =
        status === "surplus"
          ? SHAPE_MARKERS.surplus
          : status === "deficit"
          ? SHAPE_MARKERS.deficit
          : status === "brownout" || status === "danger"
          ? SHAPE_MARKERS.brownout
          : status === "warning"
          ? SHAPE_MARKERS.warning
          : SHAPE_MARKERS.nominal;
      return `${shape} ${label}`;
    },
    getDeltaMeta: (delta: number) => ({
      shape: delta > 0 ? SHAPE_MARKERS.surplus : delta < 0 ? SHAPE_MARKERS.deficit : SHAPE_MARKERS.nominal,
      textClass: delta > 0 ? tokens.surplusText : delta < 0 ? tokens.deficitText : tokens.nominalText,
      bgClass: delta > 0 ? tokens.surplusBg : delta < 0 ? tokens.deficitBg : tokens.nominalBg,
      borderClass: delta > 0 ? tokens.surplusBorder : delta < 0 ? tokens.deficitBorder : tokens.nominalBorder,
      badgeClass: delta > 0 ? tokens.surplusBadge : delta < 0 ? tokens.deficitBadge : tokens.nominalBadge,
      hex: delta > 0 ? tokens.surplus : delta < 0 ? tokens.deficit : tokens.nominal,
      formatted: `${delta > 0 ? SHAPE_MARKERS.surplus + " +" : delta < 0 ? SHAPE_MARKERS.deficit + " " : SHAPE_MARKERS.nominal + " "}${delta}`,
    }),
  };
}

export const useColorblindMode = useAccessibility;
