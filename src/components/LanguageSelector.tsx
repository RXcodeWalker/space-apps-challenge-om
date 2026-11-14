// ============================================================
// LanguageSelector.tsx — Interactive Multi-Language Switcher
// Outpost Commander — NASA Space Apps Challenge i18n
// ============================================================

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useTranslation } from "../i18n/LanguageContext";
import type { SupportedLanguage } from "../i18n/types";
import { soundEffects } from "../utils/soundEffects";

interface LanguageSelectorProps {
  compact?: boolean;
  className?: string;
}

export default function LanguageSelector({
  compact = false,
  className = "",
}: LanguageSelectorProps) {
  const { language, setLanguage, languages, currentLanguage, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen]);

  function handleSelectLanguage(code: SupportedLanguage) {
    soundEffects.playButtonClick();
    setLanguage(code);
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          soundEffects.playSliderClick();
          setIsOpen((prev) => !prev);
        }}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={t("common.selectLanguage")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono text-xs font-bold transition-all select-none cursor-pointer ${
          isOpen
            ? "bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-950/50"
            : "bg-slate-900/80 hover:bg-slate-800 border-slate-700/80 text-slate-200 hover:text-cyan-300 hover:border-cyan-600/50"
        }`}
      >
        <Globe className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-sm leading-none">{currentLanguage.flag}</span>
        {!compact && (
          <span className="hidden sm:inline font-semibold">
            {currentLanguage.nativeName}
          </span>
        )}
        <span className="sm:hidden font-semibold uppercase">
          {currentLanguage.code}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-cyan-400" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl bg-[#0B1120] border-2 border-cyan-500/40 p-2 shadow-2xl shadow-black/80 z-50 backdrop-blur-xl"
          >
            {/* Header info */}
            <div className="px-3 py-2 border-b border-cyan-900/40 mb-1 flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-cyan-400">
                {t("common.language")} / I18N
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                NASA Space Apps
              </span>
            </div>

            {/* Language items */}
            <div className="flex flex-col gap-1 max-h-72 overflow-y-auto">
              {languages.map((lang) => {
                const isSelected = lang.code === language;

                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleSelectLanguage(lang.code)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all text-xs cursor-pointer ${
                      isSelected
                        ? "bg-gradient-to-r from-blue-950/80 to-cyan-950/80 border border-cyan-400/40 text-cyan-200"
                        : "hover:bg-slate-800/80 text-slate-300 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{lang.flag}</span>
                      <div>
                        <div className="font-bold flex items-center gap-1.5">
                          <span>{lang.nativeName}</span>
                          {lang.name !== lang.nativeName && (
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({lang.name})
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 truncate max-w-[155px]">
                          {lang.region}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
