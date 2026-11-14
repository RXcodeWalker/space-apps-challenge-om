// ============================================================
// RegolithChemistryViewer.tsx — 3D Molecular / Crystallographic Viewer
// Interactive Three.js Mol*-style Chemical Explorer for:
//  1. Martian Perchlorate Ion (ClO4-) & Toxic Soil Remediation
//  2. Lunar Regolith Silicate Tetrahedron (SiO4^4-) & Mineral Glass
//  3. Lunar PSR Water Ice (H2O) & Electrolysis for O2
// Grounded in NASA Phoenix, MSL Curiosity SAM, and Apollo lunar sample data.
// ============================================================

import { useEffect, useRef, useState, useMemo } from "react";
import * as THREE from "three";
import {
  Atom,
  RotateCw,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Zap,
} from "lucide-react";
import { soundEffects } from "../utils/soundEffects";

interface AtomDef {
  element: string;
  name: string;
  color: number;
  radius: number;
  position: [number, number, number];
  role: string;
  atomicMass: string;
  oxidation: string;
}

interface BondDef {
  fromIndex: number;
  toIndex: number;
  order?: number;
}

interface MoleculePreset {
  id: "perchlorate" | "silicate" | "water" | "calcium_perchlorate" | "magnesium_sulfate" | "methane";
  name: string;
  formula: string;
  environment: "Mars" | "Moon" | "Europa" | "Titan" | "Both";
  nasaMission: string;
  tagline: string;
  kidSummary: string;
  scienceDetails: string;
  hazardLevel: "Toxic Hazard" | "Physical Abrasive" | "Vital Resource" | "Soil Oxidizer";
  hazardColor: string;
  atoms: AtomDef[];
  bonds: BondDef[];
}

const MOLECULES: MoleculePreset[] = [
  {
    id: "perchlorate",
    name: "Perchlorate Anion",
    formula: "ClO₄⁻",
    environment: "Mars",
    nasaMission: "NASA Phoenix Lander (WCL) & Curiosity Rover (SAM)",
    tagline: "Toxic Martian soil salt that holds 64% pure oxygen by mass!",
    kidSummary:
      "Mars dirt is filled with perchlorates! They act like poison for our bodies, but smart space engineers can bake them with heat to produce fresh breathable oxygen for the crew!",
    scienceDetails:
      "Discovered in concentrations of 0.5–1.0 wt% at the Phoenix landing site and Gale Crater. Strong oxidizer toxic to human thyroid function, but can be thermally decomposed at ~450°C to yield O2 gas and non-toxic chloride salts.",
    hazardLevel: "Toxic Hazard",
    hazardColor: "#F43F5E",
    atoms: [
      {
        element: "Cl",
        name: "Chlorine",
        color: 0x22c55e,
        radius: 0.95,
        position: [0, 0, 0],
        role: "Central oxidizer atom (+7 oxidation state)",
        atomicMass: "35.45 u",
        oxidation: "+7",
      },
      {
        element: "O",
        name: "Oxygen 1",
        color: 0xef4444,
        radius: 0.72,
        position: [0, 1.4, 0],
        role: "Harvestable oxygen atom bound in tetrahedral geometry",
        atomicMass: "16.00 u",
        oxidation: "-2",
      },
      {
        element: "O",
        name: "Oxygen 2",
        color: 0xef4444,
        radius: 0.72,
        position: [1.32, -0.46, 0],
        role: "Harvestable oxygen atom",
        atomicMass: "16.00 u",
        oxidation: "-2",
      },
      {
        element: "O",
        name: "Oxygen 3",
        color: 0xef4444,
        radius: 0.72,
        position: [-0.66, -0.46, 1.14],
        role: "Harvestable oxygen atom",
        atomicMass: "16.00 u",
        oxidation: "-2",
      },
      {
        element: "O",
        name: "Oxygen 4",
        color: 0xef4444,
        radius: 0.72,
        position: [-0.66, -0.46, -1.14],
        role: "Harvestable oxygen atom",
        atomicMass: "16.00 u",
        oxidation: "-2",
      },
    ],
    bonds: [
      { fromIndex: 0, toIndex: 1 },
      { fromIndex: 0, toIndex: 2 },
      { fromIndex: 0, toIndex: 3 },
      { fromIndex: 0, toIndex: 4 },
    ],
  },
  {
    id: "silicate",
    name: "Regolith Silicate Tetrahedron",
    formula: "SiO₄⁴⁻",
    environment: "Moon",
    nasaMission: "NASA Apollo Lunar Sample Laboratory & LRO Diviner",
    tagline: "The microscopic building block of abrasive Moon dust and lunar glass.",
    kidSummary:
      "Moon dust is made of razor-sharp glassy mineral crystals. Because there is no wind or water on the Moon to smooth them out, they cut into spacesuits and seals like sandpaper!",
    scienceDetails:
      "Lunar regolith is dominated by pyroxene, plagioclase feldspar, and olivine containing SiO4 tetrahedral frameworks. Over 45% of lunar soil by weight is oxygen trapped in these silicates, extractable through Molten Regolith Electrolysis (MRE).",
    hazardLevel: "Physical Abrasive",
    hazardColor: "#F59E0B",
    atoms: [
      {
        element: "Si",
        name: "Silicon",
        color: 0x38bdf8,
        radius: 1.0,
        position: [0, 0, 0],
        role: "Central silicate core atom",
        atomicMass: "28.08 u",
        oxidation: "+4",
      },
      {
        element: "O",
        name: "Oxygen (Apex)",
        color: 0xef4444,
        radius: 0.72,
        position: [0, 1.45, 0],
        role: "Corner oxygen connecting crystal lattices",
        atomicMass: "16.00 u",
        oxidation: "-2",
      },
      {
        element: "O",
        name: "Oxygen (Base A)",
        color: 0xef4444,
        radius: 0.72,
        position: [1.36, -0.48, 0],
        role: "Corner oxygen",
        atomicMass: "16.00 u",
        oxidation: "-2",
      },
      {
        element: "O",
        name: "Oxygen (Base B)",
        color: 0xef4444,
        radius: 0.72,
        position: [-0.68, -0.48, 1.18],
        role: "Corner oxygen",
        atomicMass: "16.00 u",
        oxidation: "-2",
      },
      {
        element: "O",
        name: "Oxygen (Base C)",
        color: 0xef4444,
        radius: 0.72,
        position: [-0.68, -0.48, -1.18],
        role: "Corner oxygen",
        atomicMass: "16.00 u",
        oxidation: "-2",
      },
    ],
    bonds: [
      { fromIndex: 0, toIndex: 1 },
      { fromIndex: 0, toIndex: 2 },
      { fromIndex: 0, toIndex: 3 },
      { fromIndex: 0, toIndex: 4 },
    ],
  },
  {
    id: "water",
    name: "Lunar Ice / Hydroxyl",
    formula: "H₂O",
    environment: "Both",
    nasaMission: "NASA LCROSS Impact & LRO Mini-RF Radar",
    tagline: "Cryogenic water ice harvested from permanently shadowed craters.",
    kidSummary:
      "Water found in the freezing dark craters of the Moon's South Pole can be split into hydrogen fuel and fresh oxygen for astronauts to breathe!",
    scienceDetails:
      "LCROSS detected 5.6% water ice by mass in the Cabeus crater plume. Essential feedstock for ECLSS Sabatier recycling and in-situ bipropellant (LOX/LH2) production.",
    hazardLevel: "Vital Resource",
    hazardColor: "#06B6D4",
    atoms: [
      {
        element: "O",
        name: "Oxygen",
        color: 0xef4444,
        radius: 0.85,
        position: [0, 0.25, 0],
        role: "Central oxygen atom with lone pairs",
        atomicMass: "16.00 u",
        oxidation: "-2",
      },
      {
        element: "H",
        name: "Hydrogen 1",
        color: 0xf8fafc,
        radius: 0.52,
        position: [-0.98, -0.65, 0],
        role: "Hydrogen proton (104.5° bond angle)",
        atomicMass: "1.008 u",
        oxidation: "+1",
      },
      {
        element: "H",
        name: "Hydrogen 2",
        color: 0xf8fafc,
        radius: 0.52,
        position: [0.98, -0.65, 0],
        role: "Hydrogen proton (104.5° bond angle)",
        atomicMass: "1.008 u",
        oxidation: "+1",
      },
    ],
    bonds: [
      { fromIndex: 0, toIndex: 1 },
      { fromIndex: 0, toIndex: 2 },
    ],
  },
];

export interface RegolithChemistryViewerProps {
  initialMolecule?: "perchlorate" | "silicate" | "water";
  onClose?: () => void;
}

export default function RegolithChemistryViewer({
  initialMolecule = "perchlorate",
  onClose,
}: RegolithChemistryViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string>(initialMolecule);
  const [selectedAtom, setSelectedAtom] = useState<AtomDef | null>(null);
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [isRemediating, setIsRemediating] = useState<boolean>(false);
  const [remediatedO2Count, setRemediatedO2Count] = useState<number>(0);

  const activeMolecule = useMemo(
    () => MOLECULES.find((m) => m.id === selectedId) ?? MOLECULES[0],
    [selectedId]
  );

  useEffect(() => {
    setSelectedAtom(activeMolecule.atoms[0]);
    setIsRemediating(false);
    setRemediatedO2Count(0);
  }, [activeMolecule]);

  // Three.js Scene Setup
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 360;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070c18);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 6.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.replaceChildren(renderer.domElement);

    // Molecular root group
    const molGroup = new THREE.Group();
    scene.add(molGroup);

    // Subtle background stars / grid
    const gridHelper = new THREE.PolarGridHelper(5, 16, 8, 32, 0x1e3a8a, 0x0f172a);
    gridHelper.position.y = -2.2;
    scene.add(gridHelper);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(5, 6, 7);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    fillLight.position.set(-6, -2, -4);
    scene.add(fillLight);

    // Mesh maps for picking
    const atomMeshes: THREE.Mesh[] = [];
    const sphereGeom = new THREE.SphereGeometry(1, 32, 32);

    // Build Atoms
    activeMolecule.atoms.forEach((atom, idx) => {
      const mat = new THREE.MeshStandardMaterial({
        color: atom.color,
        roughness: 0.25,
        metalness: 0.15,
        emissive: atom.color,
        emissiveIntensity: 0.08,
      });

      const mesh = new THREE.Mesh(sphereGeom, mat);
      mesh.scale.setScalar(atom.radius);
      mesh.position.set(...atom.position);
      mesh.userData = { atomIndex: idx, atomDef: atom };
      molGroup.add(mesh);
      atomMeshes.push(mesh);
    });

    // Build Bonds
    const cylinderGeom = new THREE.CylinderGeometry(0.12, 0.12, 1, 16);
    const bondMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.35,
      metalness: 0.4,
    });

    activeMolecule.bonds.forEach((bond) => {
      const atomA = activeMolecule.atoms[bond.fromIndex];
      const atomB = activeMolecule.atoms[bond.toIndex];
      if (!atomA || !atomB) return;

      const posA = new THREE.Vector3(...atomA.position);
      const posB = new THREE.Vector3(...atomB.position);
      const mid = new THREE.Vector3().addVectors(posA, posB).multiplyScalar(0.5);
      const distance = posA.distanceTo(posB);

      const bondMesh = new THREE.Mesh(cylinderGeom, bondMat);
      bondMesh.position.copy(mid);
      bondMesh.scale.set(1, distance, 1);
      bondMesh.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3().subVectors(posB, posA).normalize()
      );
      molGroup.add(bondMesh);
    });

    // Raycasting for interactive atom selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(atomMeshes);

      if (intersects.length > 0) {
        const clicked = intersects[0].object as THREE.Mesh;
        const atomData = clicked.userData.atomDef as AtomDef;
        if (atomData) {
          soundEffects.playSliderClick(75);
          setSelectedAtom(atomData);
        }
      }
    };

    renderer.domElement.addEventListener("pointerdown", handlePointerDown);

    // Mouse Drag Rotation
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMousePos.x;
      const deltaY = e.clientY - prevMousePos.y;
      molGroup.rotation.y += deltaX * 0.01;
      molGroup.rotation.x += deltaY * 0.01;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    // Touch Rotation
    let prevTouchPos = { x: 0, y: 0 };
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        prevTouchPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - prevTouchPos.x;
        const deltaY = e.touches[0].clientY - prevTouchPos.y;
        molGroup.rotation.y += deltaX * 0.012;
        molGroup.rotation.x += deltaY * 0.012;
        prevTouchPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    dom.addEventListener("touchstart", onTouchStart);
    dom.addEventListener("touchmove", onTouchMove);

    // Animation loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (isRotating && !isDragging) {
        molGroup.rotation.y += delta * 0.55;
        molGroup.rotation.x = Math.sin(clock.getElapsedTime() * 0.5) * 0.2;
      }

      // Highlight selected atom with pulse
      atomMeshes.forEach((mesh) => {
        const isCurrent =
          selectedAtom &&
          (mesh.userData.atomDef as AtomDef).name === selectedAtom.name;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (isCurrent) {
          const pulse = (Math.sin(clock.getElapsedTime() * 6) + 1) * 0.5;
          mat.emissiveIntensity = 0.35 + pulse * 0.45;
        } else {
          mat.emissiveIntensity = 0.08;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // Resize handling
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });

    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      dom.removeEventListener("pointerdown", handlePointerDown);
      dom.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      dom.removeEventListener("touchstart", onTouchStart);
      dom.removeEventListener("touchmove", onTouchMove);
      renderer.dispose();
      sphereGeom.dispose();
      cylinderGeom.dispose();
    };
  }, [activeMolecule, isRotating, selectedAtom]);

  // Handle remediation demonstration
  const handleTriggerRemediation = () => {
    soundEffects.playButtonClick();
    setIsRemediating(true);
    setRemediatedO2Count((prev) => prev + 2);
    setTimeout(() => {
      setIsRemediating(false);
    }, 1800);
  };

  return (
    <div className="flex flex-col w-full bg-[#070C18] rounded-2xl border border-cyan-800/40 overflow-hidden shadow-2xl">
      {/* Top Bar with Molecule Selector */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-3 bg-[#0B1120] border-b border-cyan-900/40">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
            <Atom className="w-4 h-4 animate-spin" style={{ animationDuration: "12s" }} />
          </div>
          <div>
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-cyan-300">
              REGOLITH & PERCHLORATE CHEMISTRY LAB
            </span>
            <p className="text-[10px] text-slate-400">
              Interactive Mol* 3D Crystallographic & Soil Remediation Model
            </p>
          </div>
        </div>

        {/* Molecule Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/80 border border-slate-700/60">
          {MOLECULES.map((m) => {
            const isTabActive = m.id === selectedId;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  soundEffects.playSliderClick();
                  setSelectedId(m.id);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isTabActive
                    ? "bg-cyan-500 text-black shadow-md font-black"
                    : "text-slate-300 hover:text-white hover:bg-slate-800"
                }`}
              >
                <span>{m.formula}</span>
                <span className="hidden sm:inline text-[10px] opacity-80">
                  ({m.environment})
                </span>
              </button>
            );
          })}
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
          >
            ✕ Close
          </button>
        )}
      </div>

      {/* Main 3D Canvas Area & Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 relative">
        {/* 3D Viewport (8 Cols) */}
        <div className="lg:col-span-8 relative aspect-[16/10] sm:aspect-[16/9] bg-gradient-to-b from-[#050A14] to-[#0A1224] flex items-center justify-center overflow-hidden">
          <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

          {/* Floating Canvas Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border backdrop-blur-md shadow-md"
              style={{
                backgroundColor: `${activeMolecule.hazardColor}20`,
                borderColor: `${activeMolecule.hazardColor}60`,
                color: activeMolecule.hazardColor,
              }}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{activeMolecule.hazardLevel}</span>
            </div>
            <div className="px-2.5 py-0.5 rounded-md bg-black/60 border border-white/10 text-[10px] font-mono text-cyan-300">
              Drag to rotate 360° · Tap atoms to inspect
            </div>
          </div>

          {/* Controls Bar (Rotate toggle, reset) */}
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsRotating(!isRotating)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-mono text-slate-300 shadow-md backdrop-blur-md"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRotating ? "animate-spin" : ""}`} />
              <span>{isRotating ? "Auto-Spin ON" : "Paused"}</span>
            </button>
          </div>
        </div>

        {/* Chemical Telemetry & NASA Fact Panel (4 Cols) */}
        <div className="lg:col-span-4 p-4 bg-[#0A1122]/90 border-t lg:border-t-0 lg:border-l border-cyan-900/30 flex flex-col justify-between gap-3 text-xs">
          <div>
            {/* Header info */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="font-bold text-white text-base">
                {activeMolecule.name} ({activeMolecule.formula})
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950/80 border border-blue-500/40 text-blue-300">
                {activeMolecule.environment}
              </span>
            </div>

            <p className="text-slate-300 text-xs leading-relaxed mb-3">
              {activeMolecule.tagline}
            </p>

            {/* Kid-friendly explanation box */}
            <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 mb-3">
              <div className="flex items-center gap-1.5 text-cyan-300 font-bold mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Astronaut Guide</span>
              </div>
              <p className="text-slate-200 text-xs leading-relaxed">
                {activeMolecule.kidSummary}
              </p>
            </div>

            {/* Selected Atom Telemetry */}
            {selectedAtom && (
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-700/80 mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: `#${selectedAtom.color.toString(16)}` }}
                    />
                    <span className="font-mono font-bold text-white">
                      {selectedAtom.name} ({selectedAtom.element})
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    Ox: {selectedAtom.oxidation}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">{selectedAtom.role}</p>
                <div className="mt-2 text-[10px] font-mono text-slate-400 flex justify-between">
                  <span>Atomic Mass: {selectedAtom.atomicMass}</span>
                  <span>Radius: {selectedAtom.radius * 50} pm</span>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Chemical Reaction Demonstration: Perchlorate to Oxygen */}
          {activeMolecule.id === "perchlorate" && (
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono font-bold text-emerald-300 text-xs flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  Thermal Catalytic Remediation
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  + {remediatedO2Count} O₂ Molecules
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mb-2 font-mono">
                ClO₄⁻ + Heat (450°C) → Cl⁻ + 2 O₂ ↑
              </p>
              <button
                type="button"
                onClick={handleTriggerRemediation}
                disabled={isRemediating}
                className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {isRemediating ? (
                  <>
                    <Zap className="w-3.5 h-3.5 animate-spin" />
                    <span>Decomposing Salt & Harvesting O₂...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Run O₂ Soil Extraction Cycle</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* NASA Citation */}
          <div className="flex items-start gap-1.5 text-[10px] font-mono text-slate-400">
            <Info className="w-3 h-3 text-cyan-400 shrink-0 mt-0.5" />
            <span>NASA Data: {activeMolecule.nasaMission}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
