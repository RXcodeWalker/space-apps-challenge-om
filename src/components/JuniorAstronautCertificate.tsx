// ============================================================
// JuniorAstronautCertificate.tsx — Official Junior Astronaut Certificate
// Features:
// 1. Official NASA Deep Space Habitation Command Certificate
// 2. High-res vector Mission Badge, Gold Filigree Borders & Embossed Seal
// 3. Commander Name input with real-time live preview
// 4. Mission Score, Calculated Rank & Milestone Citation
// 5. One-Click "Download Image (PNG)" via HTML5 Canvas (2400x1500)
// 6. One-Click "Print / Save as PDF" via @media print stylesheet
// ============================================================

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Printer,
  Download,
  X,
  Edit3,
  Award,
  CheckCircle,
  Sparkles,
} from "lucide-react";

import type { GameState } from "../engine/simulationEngine";
import type { MissionEnvironment } from "../data/nasaConstants";
import { soundEffects } from "../utils/soundEffects";
import { buildFlightRecorderData } from "../utils/flightRecorder";
import { useTranslation } from "../i18n/LanguageContext";
import LanguageSelector from "./LanguageSelector";
import MissionPatchDesigner, { MissionPatchView } from "./MissionPatchDesigner";
import { loadSavedPatch, type MissionPatchState } from "../data/patchAssets";


interface JuniorAstronautCertificateProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  environment: MissionEnvironment;
  rankTitle: string;
  rankTier?: "master" | "senior" | "survivor" | "junior" | "trainee";
}

export default function JuniorAstronautCertificate({
  isOpen,
  onClose,
  gameState,
  environment,
  rankTitle,
  rankTier: _rankTier,
}: JuniorAstronautCertificateProps) {
  const { t } = useTranslation();
  const [customPatch, setCustomPatch] = useState<MissionPatchState>(() => loadSavedPatch());
  const [isPatchModalOpen, setIsPatchModalOpen] = useState<boolean>(false);
  const [commanderName, setCommanderName] = useState<string>(() => {
    const saved = loadSavedPatch();
    return saved.commanderCallsign ? `Commander ${saved.commanderCallsign}` : "Commander Alex";
  });
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const certificateContainerRef = useRef<HTMLDivElement>(null);

  // Sync custom patch updates from storage or designer modal
  useEffect(() => {
    const handlePatchUpdate = () => {
      const updated = loadSavedPatch();
      setCustomPatch(updated);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("outpost_patch_saved", handlePatchUpdate);
      window.addEventListener("storage", handlePatchUpdate);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("outpost_patch_saved", handlePatchUpdate);
        window.removeEventListener("storage", handlePatchUpdate);
      }
    };
  }, []);

  const { cumulativeScore } = gameState;
  const flightData = buildFlightRecorderData(gameState, environment);

  // Sol 4 or major hazard milestone citation
  const milestoneCitation = flightData.certificateCitation;

  // Formatted date and certificate serial
  const completionDate = "November 14, 2026 · Sol 10";
  const envCode =
    environment.id === "lunar_south_pole"
      ? "LUN"
      : environment.id === "mars_gale_crater"
      ? "MAR"
      : environment.id === "europa_under_ice"
      ? "EUR"
      : "TTN";
  const certificateId = `OC-JAC-2026-${envCode}-${Math.max(
    10,
    cumulativeScore
  )}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Sound effect on mount
  useEffect(() => {
    if (isOpen) {
      soundEffects.playVictoryChord();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function handlePrint() {
    soundEffects.playSliderClick();
    window.print();
  }

  /**
   * Generates a 2400x1500 high-resolution PNG image of the certificate using HTML5 Canvas.
   */
  async function handleDownloadPNG() {
    soundEffects.playSliderClick(80);

    const canvas = document.createElement("canvas");
    canvas.width = 2400;
    canvas.height = 1500;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 1. Background gradient (Deep space navy to black)
    const bgGrad = ctx.createRadialGradient(1200, 750, 100, 1200, 750, 1400);
    bgGrad.addColorStop(0, "#081128");
    bgGrad.addColorStop(0.6, "#040916");
    bgGrad.addColorStop(1, "#02040A");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 2400, 1500);

    // 2. Subtle star field
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    for (let i = 0; i < 90; i++) {
      const sx = (i * 269) % 2400;
      const sy = (i * 383) % 1500;
      const sr = (i % 3) + 1;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Ornate Double Gold Borders
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 10;
    ctx.strokeRect(60, 60, 2280, 1380);

    ctx.strokeStyle = "#F59E0B";
    ctx.lineWidth = 3;
    ctx.strokeRect(84, 84, 2232, 1332);

    ctx.strokeStyle = "rgba(212, 175, 55, 0.35)";
    ctx.lineWidth = 2;
    ctx.strokeRect(100, 100, 2200, 1300);

    // Corner decorative brackets
    const corners = [
      [84, 84],
      [2316, 84],
      [84, 1416],
      [2316, 1416],
    ];
    corners.forEach(([cx, cy]) => {
      ctx.fillStyle = "#D4AF37";
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. Header: NASA Typography
    ctx.textAlign = "center";

    // Sub-header
    ctx.font = "bold 28px 'Courier New', monospace";
    ctx.fillStyle = "#38BDF8";
    ctx.letterSpacing = "6px";
    ctx.fillText("NATIONAL AERONAUTICS AND SPACE ADMINISTRATION", 1200, 200);

    ctx.font = "bold 20px 'Courier New', monospace";
    ctx.fillStyle = "#94A3B8";
    ctx.letterSpacing = "4px";
    ctx.fillText("DEEP SPACE HABITATION & SURFACE EXPLORATION COMMAND", 1200, 240);

    // Main Certificate Title
    ctx.font = "900 68px system-ui, -apple-system, sans-serif";
    const titleGrad = ctx.createLinearGradient(600, 310, 1800, 310);
    titleGrad.addColorStop(0, "#F59E0B");
    titleGrad.addColorStop(0.5, "#FDE68A");
    titleGrad.addColorStop(1, "#D97706");
    ctx.fillStyle = titleGrad;
    ctx.fillText("JUNIOR ASTRONAUT MISSION CERTIFICATE", 1200, 320);

    ctx.font = "italic 26px Georgia, serif";
    ctx.fillStyle = "#E2E8F0";
    ctx.fillText("This official commendation is solemnly conferred upon", 1200, 390);

    // 5. Commander Name
    ctx.font = "bold 74px Georgia, serif";
    const nameGrad = ctx.createLinearGradient(600, 480, 1800, 480);
    nameGrad.addColorStop(0, "#67E8F9");
    nameGrad.addColorStop(0.5, "#FFFFFF");
    nameGrad.addColorStop(1, "#38BDF8");
    ctx.fillStyle = nameGrad;
    ctx.fillText(commanderName.toUpperCase(), 1200, 490);

    // Gold underline below name
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(700, 520);
    ctx.lineTo(1700, 520);
    ctx.stroke();

    // 6. Mission Citation & Destination
    ctx.font = "28px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#CBD5E1";
    ctx.fillText(
      `For extraordinary merit and sound engineering decisions as Expedition Commander of the 10-Sol surface mission at`,
      1200,
      580
    );

    ctx.font = "bold 38px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#F59E0B";
    ctx.fillText(
      `${environment.name.toUpperCase()} · ${environment.subtitle.toUpperCase()}`,
      1200,
      640
    );

    // 7. Rank & Score Showcase Box
    ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
    ctx.strokeStyle = "#0284C7";
    ctx.lineWidth = 2;
    ctx.roundRect(400, 700, 1600, 210, 24);
    ctx.fill();
    ctx.stroke();

    // Rank Title
    ctx.font = "bold 26px 'Courier New', monospace";
    ctx.fillStyle = "#94A3B8";
    ctx.fillText("OFFICIAL ASTRONAUT RANK CONFERRED", 1200, 750);

    ctx.font = "900 46px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#38BDF8";
    ctx.fillText(rankTitle.toUpperCase(), 1200, 810);

    // Score & Grade
    ctx.font = "bold 28px 'Courier New', monospace";
    ctx.fillStyle = "#10B981";
    ctx.fillText(
      `MISSION SCORE: ${cumulativeScore}/100 · 10 SOLS · ${(gameState.difficulty || "commander").toUpperCase()} TIER`,
      1200,
      865
    );

    // 8. Milestone Citation
    ctx.font = "italic 24px Georgia, serif";
    ctx.fillStyle = "#E2E8F0";
    ctx.fillText(`"${milestoneCitation}"`, 1200, 970);

    // 9. Official Signatures
    ctx.font = "italic bold 36px 'Brush Script MT', 'Dancing Script', cursive, serif";
    ctx.fillStyle = "#E2E8F0";
    ctx.fillText("Dr. Vanessa Vance", 650, 1150);
    ctx.fillText("Commander Gene Lovell II", 1750, 1150);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(480, 1170);
    ctx.lineTo(820, 1170);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(1580, 1170);
    ctx.lineTo(1920, 1170);
    ctx.stroke();

    ctx.font = "18px 'Courier New', monospace";
    ctx.fillStyle = "#94A3B8";
    ctx.fillText("FLIGHT DIRECTOR · DEEP SPACE SYSTEMS", 650, 1205);
    ctx.fillText("CHIEF ASTRONAUT · ECLSS OPERATIONS", 1750, 1205);

    // 10. Center Gold Embossed Seal
    ctx.save();
    ctx.translate(1200, 1160);

    // Ribbon tails
    ctx.fillStyle = "#0284C7";
    ctx.beginPath();
    ctx.moveTo(-35, 30);
    ctx.lineTo(-50, 110);
    ctx.lineTo(-30, 90);
    ctx.lineTo(-10, 110);
    ctx.lineTo(-15, 30);
    ctx.fill();

    ctx.fillStyle = "#0369A1";
    ctx.beginPath();
    ctx.moveTo(15, 30);
    ctx.lineTo(10, 110);
    ctx.lineTo(30, 90);
    ctx.lineTo(50, 110);
    ctx.lineTo(35, 30);
    ctx.fill();

    // Seal Outer Gold Ring
    ctx.beginPath();
    ctx.arc(0, 0, 75, 0, Math.PI * 2);
    ctx.fillStyle = "#D4AF37";
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#F59E0B";
    ctx.stroke();

    // Seal Inner Blue Ring
    ctx.beginPath();
    ctx.arc(0, 0, 60, 0, Math.PI * 2);
    ctx.fillStyle = "#0C4A6E";
    ctx.fill();

    // Star in center
    ctx.font = "bold 32px sans-serif";
    ctx.fillStyle = "#FDE68A";
    ctx.fillText("★", 0, 12);

    ctx.font = "bold 10px 'Courier New', monospace";
    ctx.fillStyle = "#FDE68A";
    ctx.fillText("OUTPOST CMDR", 0, -28);
    ctx.fillText("CERTIFIED", 0, 36);

    ctx.restore();

    // 11. Footer: Security hash & date
    ctx.font = "16px 'Courier New', monospace";
    ctx.fillStyle = "#64748B";
    ctx.fillText(`AUTHENTICATION CODE: ${certificateId} · ISSUED: ${completionDate}`, 1200, 1370);

    // Trigger Download
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    const safeName = commanderName.replace(/[^a-zA-Z0-9]/g, "_");
    link.download = `Junior_Astronaut_Certificate_${safeName}.png`;
    link.href = dataUrl;
    link.click();

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        {/* Backdrop (hidden during print) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-[var(--oc-scrim)] no-print"
          onClick={onClose}
        />

        {/* Modal Wrapper */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", damping: 25, stiffness: 280 }}
          className="relative w-full max-w-5xl rounded-oc-2 bg-oc-panel border border-oc-line-strong flex flex-col max-h-[calc(100dvh-24px)] my-auto z-10"
        >
          {/* Top Control Bar (hidden during print) */}
          <div className="w-full py-3 px-4 sm:px-5 bg-oc-inset border-b border-oc-line rounded-t-[3px] flex flex-wrap items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-2 text-oc-text-1 min-w-0">
              <Award className="w-5 h-5 text-oc-accent shrink-0" />
              <span className="oc-type-label">
                Official Junior Astronaut Mission Certificate
              </span>
            </div>

            {/* Editable Commander Name Field in Control Bar */}
            <div className="flex items-center gap-2 bg-oc-panel px-3 py-1.5 rounded-oc-1 border border-oc-line text-xs">
              <span className="text-slate-400 font-mono">Astronaut:</span>
              {isEditingName ? (
                <input
                  type="text"
                  value={commanderName}
                  onChange={(e) => setCommanderName(e.target.value)}
                  onBlur={() => setIsEditingName(false)}
                  onKeyDown={(e) => e.key === "Enter" && setIsEditingName(false)}
                  autoFocus
                  maxLength={28}
                  className="bg-oc-raised text-oc-text-1 font-bold px-2 py-0.5 rounded-oc-1 border border-oc-accent focus:outline-none w-36 sm:w-44"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingName(true)}
                  className="flex items-center gap-1.5 text-oc-text-1 font-bold hover:underline min-h-8"
                  title="Click to edit commander name"
                >
                  <span>{commanderName}</span>
                  <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}
            </div>

            {/* Action Buttons: Print & Download */}
            <div className="flex flex-wrap items-center gap-2">
              <LanguageSelector compact />

              <button
                type="button"
                onClick={handlePrint}
                className="oc-btn oc-btn--sm"
                title="Print or Save as PDF"
              >
                <Printer className="w-4 h-4" />
                <span>{t("certificate.printPdf")}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPNG}
                className="oc-btn oc-btn--sm oc-btn--primary"
                title="Download High-Resolution PNG Image"
              >
                {downloadSuccess ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>{downloadSuccess ? "DOWNLOADED!" : t("certificate.downloadPng")}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="oc-modal__close"
                style={{ margin: 0, width: 32, height: 32 }}
                aria-label="Close"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Certificate Viewable Body (Target for Screen & Print) */}
          <div className="overflow-y-auto p-4 sm:p-7 flex items-center justify-center bg-[#02050E]">
            <div
              ref={certificateContainerRef}
              id="printable-astronaut-certificate"
              className="certificate-printable-container relative w-full max-w-[940px] sm:aspect-[16/10] bg-gradient-to-b from-[#081128] via-[#040916] to-[#02040A] rounded-2xl border-[8px] border-[#D4AF37] p-6 sm:p-10 shadow-2xl flex flex-col justify-between text-center overflow-hidden"
              style={{
                boxShadow: "0 0 60px rgba(212, 175, 55, 0.2), inset 0 0 40px rgba(0, 0, 0, 0.8)",
              }}
            >
              {/* Inner Decorative Borders */}
              <div className="absolute inset-2 border-2 border-amber-500/50 pointer-events-none rounded-xl" />
              <div className="absolute inset-3 border border-amber-500/20 pointer-events-none rounded-lg" />

              {/* Corner Medallions */}
              <div className="absolute top-4 left-4 w-4 h-4 rounded-full bg-[#D4AF37] border-2 border-black" />
              <div className="absolute top-4 right-4 w-4 h-4 rounded-full bg-[#D4AF37] border-2 border-black" />
              <div className="absolute bottom-4 left-4 w-4 h-4 rounded-full bg-[#D4AF37] border-2 border-black" />
              <div className="absolute bottom-4 right-4 w-4 h-4 rounded-full bg-[#D4AF37] border-2 border-black" />

              {/* Background Celestial Star Grid */}
              <div className="absolute inset-0 bg-[radial-gradient(#38bdf810_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

              {/* Certificate Header */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="flex items-center gap-2 text-cyan-400 font-mono text-[10px] sm:text-xs font-bold tracking-[0.25em] uppercase">
                  <span>{t("certificate.agency")}</span>
                </div>
                <div className="text-slate-400 font-mono text-[8px] sm:text-[10px] tracking-[0.18em] uppercase mt-0.5">
                  {t("certificate.command")}
                </div>

                <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 font-serif mt-2">
                  {t("certificate.officialAward")}
                </h1>

                <p className="text-[11px] sm:text-xs italic text-slate-300 font-serif mt-1">
                  {t("certificate.certifies")}
                </p>
              </div>

              {/* Commander Name (Centerpiece) */}
              <div className="relative z-10 my-1 sm:my-2">
                <div className="inline-block relative">
                  <h2 className="text-3xl sm:text-5xl md:text-6xl font-black font-serif tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-cyan-400 uppercase">
                    {commanderName}
                  </h2>
                  <div className="w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent mt-1" />
                </div>

                <p className="text-xs sm:text-sm text-slate-300 font-sans mt-2 max-w-2xl mx-auto leading-relaxed">
                  {t("certificate.hasCompleted")}
                </p>
                <p className="text-sm sm:text-lg font-black text-amber-400 font-mono uppercase tracking-wide mt-0.5">
                  {t(`destinations.${environment.id === "lunar_south_pole" ? "moon" : "mars"}.name`)} · {t(`destinations.${environment.id === "lunar_south_pole" ? "moon" : "mars"}.subtitle`)}
                </p>
              </div>

              {/* Rank, Score & Badge Plaque */}
              <div className="relative z-10 mx-auto w-full max-w-2xl bg-black/60 border border-cyan-500/40 rounded-2xl p-3 sm:p-4 shadow-lg flex flex-wrap items-center justify-between gap-3 sm:gap-4">
                {/* Left: Vector Mission Badge */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playButtonClick();
                      setIsPatchModalOpen(true);
                    }}
                    className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center shrink-0 cursor-pointer hover:scale-105 transition-transform"
                    title="Click to customize expedition patch"
                  >
                    <MissionPatchView patch={customPatch} size="100%" showShadow={false} />
                  </button>
                  <div className="text-left">
                    <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <span>OFFICIAL CONFERRED RANK</span>
                      <span className="text-amber-400 font-semibold">· {(gameState.difficulty || "commander").toUpperCase()} TIER</span>
                    </div>
                    <div className="text-base sm:text-xl font-black text-cyan-300 font-serif">
                      {rankTitle}
                    </div>
                  </div>
                </div>

                {/* Right: Score Seal */}
                <div className="text-right border-l border-slate-700/80 pl-4 shrink-0">
                  <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                    MISSION SCORE
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                    {cumulativeScore}
                    <span className="text-xs text-slate-400 font-normal"> / 100</span>
                  </div>
                  <div className="text-[10px] font-mono text-cyan-400 font-bold">
                    10 SOLS SURVIVED
                  </div>
                </div>
              </div>

              {/* Milestone Citation */}
              <div className="relative z-10 px-4 text-slate-300 italic text-[11px] sm:text-xs font-serif max-w-2xl mx-auto">
                "{milestoneCitation}"
              </div>

              {/* Signatures & Official Gold Seal */}
              <div className="relative z-10 pt-2 border-t border-amber-500/20 grid grid-cols-3 items-end text-center">
                {/* Signature 1 */}
                <div className="flex flex-col items-center">
                  <div className="font-serif italic text-base sm:text-xl text-slate-200">
                    Dr. Vanessa Vance
                  </div>
                  <div className="w-32 sm:w-44 h-0.5 bg-slate-500/60 my-1" />
                  <div className="font-mono text-[8px] sm:text-[10px] text-slate-400 uppercase">
                    FLIGHT DIRECTOR · DEEP SPACE
                  </div>
                </div>

                {/* Center Gold Embossed Medal */}
                <div className="flex flex-col items-center justify-center">
                  <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#D4AF37] via-[#FDE68A] to-[#B45309] p-1 shadow-lg shadow-amber-900/40 flex items-center justify-center">
                    <div className="w-full h-full rounded-full bg-[#0C4A6E] flex flex-col items-center justify-center text-amber-300">
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
                      <span className="text-[6px] sm:text-[7px] font-mono font-black uppercase tracking-tighter">
                        OUTPOST CMDR
                      </span>
                    </div>
                  </div>
                </div>

                {/* Signature 2 */}
                <div className="flex flex-col items-center">
                  <div className="font-serif italic text-base sm:text-xl text-slate-200">
                    Capt. Gene Lovell II
                  </div>
                  <div className="w-32 sm:w-44 h-0.5 bg-slate-500/60 my-1" />
                  <div className="font-mono text-[8px] sm:text-[10px] text-slate-400 uppercase">
                    CHIEF ASTRONAUT · ECLSS
                  </div>
                </div>
              </div>

              {/* Bottom Verification Code & Date */}
              <div className="relative z-10 flex items-center justify-between text-[8px] sm:text-[9px] font-mono text-slate-500 pt-1">
                <span>VERIFICATION: {certificateId}</span>
                <span>ISSUED: {completionDate}</span>
              </div>
            </div>
          </div>

          {/* Bottom Bar Info */}
          <div className="p-3 bg-oc-inset border-t border-oc-line rounded-b-[3px] text-center text-xs text-oc-text-2 font-mono no-print">
            Click <strong>Download Image</strong> for a 2400×1500 high-res PNG or <strong>Print / PDF</strong> to save directly to paper or PDF document.
          </div>
        </motion.div>

        {/* Mission Patch Designer Modal Triggered from Certificate */}
        <MissionPatchDesigner
          isOpen={isPatchModalOpen}
          onClose={() => {
            setIsPatchModalOpen(false);
            setCustomPatch(loadSavedPatch());
          }}
        />
      </div>
    </AnimatePresence>
  );
}
