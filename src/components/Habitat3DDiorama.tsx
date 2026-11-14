// ============================================================
// Habitat3DDiorama.tsx — 3D Interactive Space Habitat Diorama
// Built with Three.js
// Features:
// 1. Martian Dust Storm with dynamic dust settling on solar panels & swirling particle vortex
// 2. Lunar Twilight Frost accumulation with glistening ice crystals & cryogenic thermal drop
// 3. Glowing Magnetic Deflector Shield with hexagonal energy lattice, cosmic ray sparks & deflection rings
// 4. Hydroponics bio-dome with dynamic plant vitality & grow lights
// 5. Rotating Comm Dish, Pulsing Power Conduits, Battery Vault & Surface Rover
// 6. 360° OrbitControls, Preset Camera Angles, Sol Lighting Toggle, and Click-to-Inspect
// ============================================================

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  Sun,
  Shield,
  Camera,
  AlertTriangle,
  Sparkles,
  CloudSun,
  Moon,
  Layers,
} from "lucide-react";
import type {
  SubsystemState,
  SubsystemId,
  PowerAllocation,
  CrewState,
} from "../engine/simulationEngine";
import type { MissionEnvironment, TurnEvent } from "../data/nasaConstants";
import { soundEffects } from "../utils/soundEffects";
import { ambientAudio } from "../utils/ambientAudio";

export interface Habitat3DDioramaProps {
  environment: MissionEnvironment;
  subsystems: Record<SubsystemId, SubsystemState>;
  allocation: PowerAllocation;
  effectiveBudgetMW: number;
  currentEvent?: TurnEvent;
  crew?: CrewState;
  interactive?: boolean;
  onSelectModule?: (module: "shield" | "hydroponics" | "power" | "command" | "rover" | null) => void;
}

type LightingMode = "auto" | "day" | "twilight" | "night";

export default function Habitat3DDiorama({
  environment,
  subsystems,
  allocation,
  effectiveBudgetMW,
  currentEvent,
  crew: _crew,
  interactive = true,
  onSelectModule,
}: Habitat3DDioramaProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const [inspectedModule, setInspectedModule] = useState<
    "shield" | "hydroponics" | "power" | "command" | "rover" | null
  >(null);
  const [lightingMode, setLightingMode] = useState<LightingMode>("auto");
  const [isDustBlown, setIsDustBlown] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(60);

  const isMars = environment.id === "mars_gale_crater";

  // Environmental events
  const hasDustStorm =
    Boolean(currentEvent?.id.includes("dust_storm")) ||
    (currentEvent?.powerDeltaMW ?? 0) <= -20;
  const hasEclipse = Boolean(currentEvent?.id.includes("eclipse"));
  const hasSolarFlare = (currentEvent?.radiationSpikeMultiplier ?? 1) > 2;

  // Subsystem condition metrics
  const lsAllocated = allocation.lifeSupport;
  const lsHealth = subsystems.lifeSupport.health;
  const isLifeSupportThriving = lsAllocated >= 32 && lsHealth >= 65;
  const isLifeSupportStressed = lsAllocated < 25 || lsHealth < 50;

  const shieldAllocated = allocation.radiationShielding;
  const shieldHealth = subsystems.radiationShielding.health;
  const isShieldStrong = shieldAllocated >= 28 && shieldHealth >= 70;
  const isShieldCritical = shieldAllocated < 15 || shieldHealth < 35;
  const shieldIntensity = Math.min(1.0, Math.max(0.12, (shieldAllocated / 30) * (shieldHealth / 100)));

  const powerAllocated = allocation.powerGrid;
  const powerHealth = subsystems.powerGrid.health;
  const totalAllocated =
    allocation.powerGrid + allocation.lifeSupport + allocation.radiationShielding;
  const isOverBudget = totalAllocated > effectiveBudgetMW;
  const isBatteryCharging = powerAllocated >= 25 && !isOverBudget;
  const isPowerCritical = powerAllocated < 15 || powerHealth < 35 || isOverBudget;

  // Dust & Frost factors
  // Dust on Mars settles during dust storms unless temporarily blown clean
  const dustFactor = isMars ? (hasDustStorm ? (isDustBlown ? 0.2 : 0.85) : 0.15) : 0;
  // Frost on Moon accumulates during twilight / eclipse / low solar conditions
  const frostFactor = !isMars ? (hasEclipse || lightingMode === "twilight" ? 0.85 : 0.25) : 0;

  // Camera preset handler
  const setCameraPreset = useCallback(
    (preset: "overview" | "solar" | "shield" | "hydro" | "rover") => {
      if (!cameraRef.current || !controlsRef.current) return;
      soundEffects.playSliderClick(70);

      const cam = cameraRef.current;
      const target = controlsRef.current.target;

      switch (preset) {
        case "overview":
          cam.position.set(0, 14, 26);
          target.set(0, 2, 0);
          break;
        case "solar":
          cam.position.set(-14, 6, 12);
          target.set(-11, 3, 0);
          break;
        case "shield":
          cam.position.set(0, 18, 16);
          target.set(0, 5, 0);
          break;
        case "hydro":
          cam.position.set(-8, 5, 8);
          target.set(-5, 2.5, 0);
          break;
        case "rover":
          cam.position.set(9, 4, 11);
          target.set(7, 1.2, 3);
          break;
      }
      controlsRef.current.update();
    },
    []
  );

  const handleSelect = (mod: "shield" | "hydroponics" | "power" | "command" | "rover" | null) => {
    soundEffects.playSliderClick(80);
    if (mod === "shield") {
      ambientAudio.testGeigerClick();
    } else if (mod === "command" || mod === "hydroponics") {
      ambientAudio.triggerAirlock(0.5);
    }
    setInspectedModule(mod);
    onSelectModule?.(mod);
  };

  // Three.js Scene Setup & Animation
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 800;
    const height = mount.clientHeight || 450;

    // 1. Scene & Background Fog
    const scene = new THREE.Scene();
    const skyColor = isMars
      ? hasDustStorm
        ? 0x8a3818
        : 0x5a2312
      : 0x050814;
    scene.background = new THREE.Color(skyColor);
    scene.fog = new THREE.FogExp2(
      skyColor,
      isMars ? (hasDustStorm ? 0.028 : 0.012) : 0.005
    );

    // 2. Camera & OrbitControls
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 300);
    camera.position.set(0, 15, 27);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      stencil: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    mount.replaceChildren(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Prevent camera under terrain
    controls.minDistance = 6;
    controls.maxDistance = 55;
    controls.target.set(0, 2.5, 0);
    controlsRef.current = controls;

    // 3. Lighting (Sun & Ambient)
    const ambientLight = new THREE.AmbientLight(
      isMars ? 0xfecdd3 : 0xdbeafe,
      lightingMode === "night" ? 0.2 : lightingMode === "twilight" ? 0.5 : 0.85
    );
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(
      isMars ? 0xffedd5 : 0xffffff,
      lightingMode === "night" ? 0.05 : lightingMode === "twilight" ? 1.2 : 2.6
    );
    if (lightingMode === "twilight") {
      sunLight.position.set(-35, 4, -15); // Low grazing twilight angle
    } else {
      sunLight.position.set(20, 30, 20); // Overhead sun
    }
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 80;
    sunLight.shadow.camera.left = -25;
    sunLight.shadow.camera.right = 25;
    sunLight.shadow.camera.top = 25;
    sunLight.shadow.camera.bottom = -25;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // Secondary fill light
    const fillLight = new THREE.DirectionalLight(
      isMars ? 0x9a3412 : 0x1e3a8a,
      0.6
    );
    fillLight.position.set(-20, -5, -20);
    scene.add(fillLight);

    // 4. Celestial Elements: Earth (Moon view) or Phobos/Sun (Mars view)
    if (!isMars) {
      // Earth visible in lunar sky
      const earthGeom = new THREE.SphereGeometry(3.2, 32, 32);
      const earthMat = new THREE.MeshStandardMaterial({
        color: 0x2563eb,
        roughness: 0.6,
        metalness: 0.1,
        emissive: 0x1d4ed8,
        emissiveIntensity: 0.35,
      });
      const earthMesh = new THREE.Mesh(earthGeom, earthMat);
      earthMesh.position.set(38, 26, -55);
      scene.add(earthMesh);

      // Distant stars field
      const starCount = 350;
      const starGeom = new THREE.BufferGeometry();
      const starPositions = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount * 3; i += 3) {
        starPositions[i] = (Math.random() - 0.5) * 180;
        starPositions[i + 1] = Math.random() * 80 + 10;
        starPositions[i + 2] = (Math.random() - 0.5) * 180;
      }
      starGeom.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
      const starMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.75,
        transparent: true,
        opacity: 0.85,
      });
      const starPoints = new THREE.Points(starGeom, starMat);
      scene.add(starPoints);
    }

    // 5. TERRAIN: Lunar Anorthosite / Martian Iron-Oxide Dunes
    const terrainGeom = new THREE.PlaneGeometry(80, 80, 64, 64);
    terrainGeom.rotateX(-Math.PI / 2);

    // Procedural crater displacements
    const posAttr = terrainGeom.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      // Gentle rolling hills and rim depressions
      let y = Math.sin(x * 0.08) * Math.cos(z * 0.08) * 0.8;
      // Habitat foundation leveling at center (radius < 14)
      const distFromCenter = Math.sqrt(x * x + z * z);
      if (distFromCenter < 14) {
        y *= distFromCenter / 14;
      } else {
        // Distant craters
        const crater1Dist = Math.sqrt((x - 22) ** 2 + (z + 18) ** 2);
        if (crater1Dist < 8) {
          y -= (8 - crater1Dist) * 0.35;
        }
      }
      posAttr.setY(i, y);
    }
    terrainGeom.computeVertexNormals();

    // Terrain material with Frost / Regolith color
    const terrainBaseColor = isMars
      ? new THREE.Color(0xa84323) // Mars iron-oxide red
      : new THREE.Color(0x374151); // Lunar dark grey regolith

    // If frost is accumulating, blend terrain with glistening white/cyan ice
    if (frostFactor > 0.2) {
      terrainBaseColor.lerp(new THREE.Color(0x93c5fd), frostFactor * 0.45);
    }

    const terrainMat = new THREE.MeshStandardMaterial({
      color: terrainBaseColor,
      roughness: frostFactor > 0.3 ? 0.35 : 0.88,
      metalness: frostFactor > 0.3 ? 0.25 : 0.08,
      flatShading: false,
    });
    const terrainMesh = new THREE.Mesh(terrainGeom, terrainMat);
    terrainMesh.receiveShadow = true;
    scene.add(terrainMesh);

    // Base foundation landing pad
    const padGeom = new THREE.CylinderGeometry(11, 11.4, 0.4, 48);
    const padMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.5,
      metalness: 0.6,
    });
    const padMesh = new THREE.Mesh(padGeom, padMat);
    padMesh.position.set(0, 0.2, 0);
    padMesh.receiveShadow = true;
    scene.add(padMesh);

    // ========================================================
    // 6. HABITAT MODULES (Interactive raycast targets)
    // ========================================================
    const interactiveObjects: THREE.Object3D[] = [];

    // --- A. CENTRAL COMMAND HABITAT DOME ---
    const commandGroup = new THREE.Group();
    commandGroup.position.set(0, 0.4, 0);
    commandGroup.userData = { moduleId: "command" };

    // Metallic main dome
    const cmdDomeGeom = new THREE.SphereGeometry(4.2, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2);
    const cmdMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: frostFactor > 0.3 ? 0.25 : 0.45,
      metalness: 0.65,
    });
    if (frostFactor > 0.3) {
      cmdMat.color.lerp(new THREE.Color(0xdbeafe), frostFactor * 0.4);
    }
    const cmdDome = new THREE.Mesh(cmdDomeGeom, cmdMat);
    cmdDome.castShadow = true;
    cmdDome.receiveShadow = true;
    commandGroup.add(cmdDome);

    // Observation windows (glow warm cyan/amber)
    const windowGeom = new THREE.TorusGeometry(3.6, 0.16, 16, 32, Math.PI);
    windowGeom.rotateX(Math.PI / 2);
    const windowMat = new THREE.MeshBasicMaterial({
      color: isPowerCritical ? 0xef4444 : 0x38bdf8,
    });
    const windowRing = new THREE.Mesh(windowGeom, windowMat);
    windowRing.position.y = 2.4;
    commandGroup.add(windowRing);

    // High-gain communications dish on mast
    const mastGeom = new THREE.CylinderGeometry(0.12, 0.12, 4, 12);
    const mastMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
    const mastMesh = new THREE.Mesh(mastGeom, mastMat);
    mastMesh.position.set(0, 5.8, 0);
    commandGroup.add(mastMesh);

    const dishGroup = new THREE.Group();
    dishGroup.position.set(0, 7.6, 0);

    const dishGeom = new THREE.SphereGeometry(1.2, 24, 16, 0, Math.PI * 2, 0, Math.PI / 3);
    dishGeom.rotateX(Math.PI);
    const dishMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.7,
      roughness: 0.3,
    });
    const dishMesh = new THREE.Mesh(dishGeom, dishMat);
    dishGroup.add(dishMesh);

    // Antenna feed horn
    const hornGeom = new THREE.CylinderGeometry(0.06, 0.14, 0.9, 8);
    const hornMesh = new THREE.Mesh(hornGeom, mastMat);
    hornMesh.position.set(0, -0.6, 0);
    dishGroup.add(hornMesh);

    // Beacon light
    const beaconLight = new THREE.PointLight(0x06b6d4, 1.2, 8);
    beaconLight.position.set(0, 8.2, 0);
    commandGroup.add(beaconLight);

    commandGroup.add(dishGroup);
    scene.add(commandGroup);
    interactiveObjects.push(commandGroup);

    // --- B. HYDROPONICS BIO-DOME (Life Support) ---
    const hydroGroup = new THREE.Group();
    hydroGroup.position.set(-5.5, 0.4, 0);
    hydroGroup.userData = { moduleId: "hydroponics" };

    // Foundation
    const hydroBaseGeom = new THREE.CylinderGeometry(3.2, 3.4, 0.6, 24);
    const hydroBaseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.5 });
    const hydroBase = new THREE.Mesh(hydroBaseGeom, hydroBaseMat);
    hydroBase.castShadow = true;
    hydroGroup.add(hydroBase);

    // Translucent glass dome
    const bioDomeGeom = new THREE.SphereGeometry(3.0, 24, 18, 0, Math.PI * 2, 0, Math.PI / 2);
    const bioDomeMat = new THREE.MeshPhysicalMaterial({
      color: isLifeSupportThriving ? 0x10b981 : isLifeSupportStressed ? 0xf59e0b : 0xef4444,
      transmission: 0.78,
      opacity: 0.88,
      transparent: true,
      roughness: 0.15,
      ior: 1.45,
    });
    const bioDome = new THREE.Mesh(bioDomeGeom, bioDomeMat);
    bioDome.castShadow = true;
    bioDome.position.y = 0.3;
    hydroGroup.add(bioDome);

    // Plant trays inside
    const plantColor = isLifeSupportThriving
      ? 0x22c55e
      : isLifeSupportStressed
      ? 0xd97706
      : 0x78350f;
    const plantMat = new THREE.MeshStandardMaterial({
      color: plantColor,
      roughness: 0.4,
      emissive: plantColor,
      emissiveIntensity: isLifeSupportThriving ? 0.3 : 0.05,
    });

    for (let ring = 0; ring < 3; ring++) {
      const radius = 1.0 + ring * 0.75;
      const count = 5 + ring * 4;
      for (let j = 0; j < count; j++) {
        const angle = (j / count) * Math.PI * 2;
        const px = Math.cos(angle) * radius;
        const pz = Math.sin(angle) * radius;
        const plantGeom = new THREE.ConeGeometry(0.28, 0.65, 8);
        const plantMesh = new THREE.Mesh(plantGeom, plantMat);
        plantMesh.position.set(px, 0.4 + ring * 0.2, pz);
        hydroGroup.add(plantMesh);
      }
    }

    // Grow Light (Magenta LED internally)
    const growLight = new THREE.PointLight(0xec4899, isLifeSupportThriving ? 1.5 : 0.4, 6);
    growLight.position.set(0, 2.2, 0);
    hydroGroup.add(growLight);

    scene.add(hydroGroup);
    interactiveObjects.push(hydroGroup);

    // --- C. POWER CORE & BATTERY VAULT (Right Side) ---
    const powerVaultGroup = new THREE.Group();
    powerVaultGroup.position.set(5.5, 0.4, 0);
    powerVaultGroup.userData = { moduleId: "power" };

    const vaultBoxGeom = new THREE.BoxGeometry(4.8, 2.2, 3.6);
    const vaultMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.7,
      roughness: 0.35,
    });
    const vaultBox = new THREE.Mesh(vaultBoxGeom, vaultMat);
    vaultBox.position.y = 1.1;
    vaultBox.castShadow = true;
    vaultBox.receiveShadow = true;
    powerVaultGroup.add(vaultBox);

    // 3 Cylindrical Battery Storage Units on Roof
    const batteryGeom = new THREE.CylinderGeometry(0.55, 0.55, 1.8, 16);
    const batteryColor = isPowerCritical
      ? 0xef4444
      : isBatteryCharging
      ? 0x10b981
      : 0x06b6d4;
    const batteryMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.8,
      roughness: 0.2,
      emissive: batteryColor,
      emissiveIntensity: 0.55,
    });

    [-1.4, 0, 1.4].forEach((bx) => {
      const batMesh = new THREE.Mesh(batteryGeom, batteryMat);
      batMesh.position.set(bx, 2.8, 0);
      powerVaultGroup.add(batMesh);
    });

    scene.add(powerVaultGroup);
    interactiveObjects.push(powerVaultGroup);

    // --- D. SOLAR ARRAY WINGS (Left & Right) with Dynamic Dust Settling & Frost ---
    const solarArrays: THREE.Mesh[] = [];
    const solarGroup = new THREE.Group();
    solarGroup.userData = { moduleId: "power" };

    const createSolarArrayWing = (xPos: number, zAngle: number) => {
      const wingGroup = new THREE.Group();
      wingGroup.position.set(xPos, 0, 0);

      // Support Pylon
      const pylonGeom = new THREE.CylinderGeometry(0.2, 0.3, 5, 12);
      const pylonMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 });
      const pylon = new THREE.Mesh(pylonGeom, pylonMat);
      pylon.position.y = 2.5;
      pylon.castShadow = true;
      wingGroup.add(pylon);

      // Solar Panel Face
      const panelGeom = new THREE.BoxGeometry(6.5, 0.15, 3.2);

      // Base Photovoltaic Material (sleek dark blue)
      const panelColor = new THREE.Color(0x1e3a8a);

      // USER REQUIREMENT 1: DUST SETTLING ON SOLAR PANELS DURING MARTIAN DUST STORMS
      if (dustFactor > 0.05) {
        // Blend from sleek blue to matte reddish-orange Martian regolith dust
        panelColor.lerp(new THREE.Color(0xc2410c), dustFactor);
      }

      // USER REQUIREMENT 2: FROST ACCUMULATING ON LUNAR BASE DURING TWILIGHT
      if (frostFactor > 0.1) {
        // Blend in icy crystalline frost glisten
        panelColor.lerp(new THREE.Color(0xe0f2fe), frostFactor * 0.7);
      }

      const panelMat = new THREE.MeshStandardMaterial({
        color: panelColor,
        metalness: dustFactor > 0.4 ? 0.15 : 0.85,
        roughness: dustFactor > 0.4 ? 0.92 : frostFactor > 0.3 ? 0.25 : 0.15,
      });

      const panelMesh = new THREE.Mesh(panelGeom, panelMat);
      panelMesh.position.set(0, 5.0, 0);
      panelMesh.rotation.z = zAngle;
      panelMesh.rotation.x = 0.35; // Sun-facing tilt
      panelMesh.castShadow = true;
      wingGroup.add(panelMesh);
      solarArrays.push(panelMesh);

      // Cell Grid lines overlay
      const gridWireGeom = new THREE.WireframeGeometry(panelGeom);
      const gridWireMat = new THREE.LineBasicMaterial({
        color: dustFactor > 0.5 ? 0x9a3412 : 0x60a5fa,
        transparent: true,
        opacity: dustFactor > 0.5 ? 0.3 : 0.6,
      });
      const gridWire = new THREE.LineSegments(gridWireGeom, gridWireMat);
      gridWire.position.copy(panelMesh.position);
      gridWire.rotation.copy(panelMesh.rotation);
      wingGroup.add(gridWire);

      return wingGroup;
    };

    solarGroup.add(createSolarArrayWing(-11, 0.12));
    solarGroup.add(createSolarArrayWing(11, -0.12));
    scene.add(solarGroup);
    interactiveObjects.push(solarGroup);

    // --- E. PRESSURIZED INTER-MODULE TUNNELS ---
    const tunnelMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.6,
      roughness: 0.4,
    });
    const tunnelGeom = new THREE.CylinderGeometry(0.9, 0.9, 2.5, 16);
    tunnelGeom.rotateZ(Math.PI / 2);

    const leftTunnel = new THREE.Mesh(tunnelGeom, tunnelMat);
    leftTunnel.position.set(-3.2, 1.2, 0);
    scene.add(leftTunnel);

    const rightTunnel = new THREE.Mesh(tunnelGeom, tunnelMat);
    rightTunnel.position.set(3.2, 1.2, 0);
    scene.add(rightTunnel);

    // --- F. GLOWING POWER CONDUITS ---
    // Pulsing energy lines connecting solar arrays to central battery
    const conduitCurveL = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-11, 0.4, 0),
      new THREE.Vector3(-6, 0.4, 1.5),
      new THREE.Vector3(-1, 0.4, 1.5),
    ]);
    const conduitGeomL = new THREE.TubeGeometry(conduitCurveL, 24, 0.12, 8, false);
    const conduitMatL = new THREE.MeshBasicMaterial({
      color: isPowerCritical ? 0xef4444 : 0x06b6d4,
    });
    const conduitMeshL = new THREE.Mesh(conduitGeomL, conduitMatL);
    scene.add(conduitMeshL);

    const conduitCurveR = new THREE.CatmullRomCurve3([
      new THREE.Vector3(11, 0.4, 0),
      new THREE.Vector3(6, 0.4, 1.5),
      new THREE.Vector3(1, 0.4, 1.5),
    ]);
    const conduitGeomR = new THREE.TubeGeometry(conduitCurveR, 24, 0.12, 8, false);
    const conduitMeshR = new THREE.Mesh(conduitGeomR, conduitMatL);
    scene.add(conduitMeshR);

    // --- G. SURFACE EXPLORATION ROVER & EVA ASTRONAUT ---
    const roverGroup = new THREE.Group();
    roverGroup.position.set(7.5, 0.4, 4.5);
    roverGroup.rotation.y = -Math.PI / 3;
    roverGroup.userData = { moduleId: "rover" };

    // Rover chassis
    const chassisGeom = new THREE.BoxGeometry(1.6, 0.6, 2.4);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.6,
      roughness: 0.3,
    });
    const chassis = new THREE.Mesh(chassisGeom, chassisMat);
    chassis.position.y = 0.6;
    chassis.castShadow = true;
    roverGroup.add(chassis);

    // 6 Wheels with Rocker-Bogie styling
    const wheelGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 16);
    wheelGeom.rotateZ(Math.PI / 2);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.9 });
    const wheelOffsets = [
      [-0.95, 0.35, -0.8],
      [-0.95, 0.35, 0],
      [-0.95, 0.35, 0.8],
      [0.95, 0.35, -0.8],
      [0.95, 0.35, 0],
      [0.95, 0.35, 0.8],
    ];
    wheelOffsets.forEach(([wx, wy, wz]) => {
      const wMesh = new THREE.Mesh(wheelGeom, wheelMat);
      wMesh.position.set(wx, wy, wz);
      roverGroup.add(wMesh);
    });

    // Mast Camera
    const roverMastGeom = new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8);
    const roverMast = new THREE.Mesh(roverMastGeom, mastMat);
    roverMast.position.set(0.4, 1.4, 0.6);
    roverGroup.add(roverMast);

    const mastHeadGeom = new THREE.BoxGeometry(0.3, 0.2, 0.3);
    const mastHead = new THREE.Mesh(mastHeadGeom, chassisMat);
    mastHead.position.set(0.4, 2.0, 0.6);
    roverGroup.add(mastHead);

    scene.add(roverGroup);
    interactiveObjects.push(roverGroup);

    // EVA Astronaut figure nearby
    const astroGroup = new THREE.Group();
    astroGroup.position.set(-6.5, 0.4, 4.5);
    astroGroup.rotation.y = Math.PI / 4;

    const suitMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
    // Body & head
    const astroBody = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.8, 12), suitMat);
    astroBody.position.y = 0.8;
    astroGroup.add(astroBody);

    const astroHelmet = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), suitMat);
    astroHelmet.position.y = 1.35;
    astroGroup.add(astroHelmet);

    // Gold Visor
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.95,
      roughness: 0.05,
    });
    const visor = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), visorMat);
    visor.position.set(0, 1.35, 0.12);
    astroGroup.add(visor);

    // Life support backpack
    const plssMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7 });
    const plss = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 0.25), plssMat);
    plss.position.set(0, 0.85, -0.25);
    astroGroup.add(plss);

    scene.add(astroGroup);

    // ========================================================
    // 7. USER REQUIREMENT 3: GLOWING MAGNETIC DEFLECTOR SHIELD
    // ========================================================
    const shieldGroup = new THREE.Group();
    shieldGroup.userData = { moduleId: "shield" };

    const shieldRadius = 14.5;
    const shieldGeom = new THREE.SphereGeometry(
      shieldRadius,
      48,
      32,
      0,
      Math.PI * 2,
      0,
      Math.PI / 2
    );

    const shieldColor = isShieldCritical
      ? 0xf43f5e
      : isShieldStrong
      ? 0x06b6d4
      : 0x3b82f6;

    const shieldMat = new THREE.MeshPhysicalMaterial({
      color: shieldColor,
      emissive: shieldColor,
      emissiveIntensity: isShieldStrong ? 0.75 : 0.35,
      transparent: true,
      opacity: isShieldCritical ? 0.25 : shieldIntensity * 0.38,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.85,
      ior: 1.25,
      side: THREE.DoubleSide,
      wireframe: false,
    });

    const shieldMesh = new THREE.Mesh(shieldGeom, shieldMat);
    shieldMesh.position.y = 0.2;
    shieldGroup.add(shieldMesh);

    // Hexagonal force field wireframe lattice overlay
    const shieldWireGeom = new THREE.WireframeGeometry(shieldGeom);
    const shieldWireMat = new THREE.LineBasicMaterial({
      color: isShieldCritical ? 0xff2222 : 0x67e8f9,
      transparent: true,
      opacity: isShieldStrong ? 0.45 : 0.2,
      linewidth: 1,
    });
    const shieldWire = new THREE.LineSegments(shieldWireGeom, shieldWireMat);
    shieldWire.position.copy(shieldMesh.position);
    shieldGroup.add(shieldWire);

    scene.add(shieldGroup);
    interactiveObjects.push(shieldGroup);

    // ========================================================
    // 8. PARTICLE SYSTEMS:
    //  A) Martian Swirling Dust Storm Particles
    //  B) Cosmic Ray / Solar Flare Particle Streams striking shield
    // ========================================================

    // A) Dust Storm Particles
    let dustParticles: THREE.Points | null = null;
    const dustCount = isMars && hasDustStorm ? 1200 : isMars ? 200 : 0;
    let dustPositions: Float32Array;

    if (dustCount > 0) {
      const dustGeom = new THREE.BufferGeometry();
      dustPositions = new Float32Array(dustCount * 3);
      for (let i = 0; i < dustCount * 3; i += 3) {
        dustPositions[i] = (Math.random() - 0.5) * 60;
        dustPositions[i + 1] = Math.random() * 15 + 0.2;
        dustPositions[i + 2] = (Math.random() - 0.5) * 60;
      }
      dustGeom.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
      const dustMat = new THREE.PointsMaterial({
        color: 0xc2410c,
        size: hasDustStorm ? 0.45 : 0.25,
        transparent: true,
        opacity: hasDustStorm ? 0.65 : 0.25,
      });
      dustParticles = new THREE.Points(dustGeom, dustMat);
      scene.add(dustParticles);
    }

    // B) Cosmic Ray Particles Striking Shield Dome
    const rayCount = hasSolarFlare ? 250 : 80;
    const rayGeom = new THREE.BufferGeometry();
    const rayPositions = new Float32Array(rayCount * 3);
    for (let i = 0; i < rayCount * 3; i += 3) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * (Math.PI / 2.5);
      const r = shieldRadius + Math.random() * 12;
      rayPositions[i] = r * Math.sin(phi) * Math.cos(theta);
      rayPositions[i + 1] = r * Math.cos(phi);
      rayPositions[i + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    rayGeom.setAttribute("position", new THREE.BufferAttribute(rayPositions, 3));
    const rayMat = new THREE.PointsMaterial({
      color: hasSolarFlare ? 0xf43f5e : 0x38bdf8,
      size: 0.35,
      transparent: true,
      opacity: 0.8,
    });
    const rayParticles = new THREE.Points(rayGeom, rayMat);
    scene.add(rayParticles);

    // ========================================================
    // 9. RAYCASTING & CLICK SELECTION
    // ========================================================
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: PointerEvent) => {
      if (!interactive) return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveObjects, true);

      if (intersects.length > 0) {
        let rootObj: THREE.Object3D | null = intersects[0].object;
        while (rootObj && !rootObj.userData.moduleId && rootObj.parent) {
          rootObj = rootObj.parent;
        }
        if (rootObj && rootObj.userData.moduleId) {
          handleSelect(rootObj.userData.moduleId);
        }
      }
    };

    renderer.domElement.addEventListener("pointerdown", handlePointerDown);

    // ========================================================
    // 10. ANIMATION LOOP & TELEMETRY CLOCK
    // ========================================================
    let animId: number;
    let clock = new THREE.Clock();
    let frameCount = 0;
    let lastFpsTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Update OrbitControls
      controls.update();

      // FPS calculation
      frameCount++;
      const now = performance.now();
      if (now - lastFpsTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastFpsTime)));
        frameCount = 0;
        lastFpsTime = now;
      }

      // Rotate High-Gain Communications Dish
      dishGroup.rotation.y = Math.sin(elapsedTime * 0.4) * 0.8;

      // Pulse Conduit Emission
      const pulseSpeed = isPowerCritical ? 8.0 : 3.0;
      conduitMatL.color.setHex(
        isPowerCritical
          ? 0xef4444
          : (Math.sin(elapsedTime * pulseSpeed) + 1) * 0.5 > 0.5
          ? 0x06b6d4
          : 0x0e7490
      );

      // USER REQUIREMENT 3: Glowing Magnetic Shield pulsating frequency & breathing
      const shieldFreq = hasSolarFlare ? 5.5 : 2.0;
      const shieldBreath = (Math.sin(elapsedTime * shieldFreq) + 1) * 0.5;
      shieldMat.opacity = (isShieldCritical ? 0.2 : shieldIntensity * 0.35) + shieldBreath * 0.12;
      shieldWireMat.opacity = 0.25 + shieldBreath * 0.25;

      // Swirling Dust Storm Particles Animation
      if (dustParticles && dustPositions) {
        const positions = dustParticles.geometry.attributes.position.array as Float32Array;
        const windSpeed = hasDustStorm ? 18 : 6;
        for (let i = 0; i < positions.length; i += 3) {
          positions[i] += delta * windSpeed; // Blow horizontally
          if (positions[i] > 30) positions[i] = -30;
          positions[i + 1] += Math.sin(elapsedTime + i) * delta * 1.5; // Slight vertical swirl
        }
        dustParticles.geometry.attributes.position.needsUpdate = true;
      }

      // Cosmic Ray Particle Inflow towards Shield
      const rayPos = rayParticles.geometry.attributes.position.array as Float32Array;
      const raySpeed = hasSolarFlare ? 16 : 8;
      for (let i = 0; i < rayPos.length; i += 3) {
        const vx = rayPos[i];
        const vy = rayPos[i + 1];
        const vz = rayPos[i + 2];
        const dist = Math.sqrt(vx * vx + vy * vy + vz * vz);

        if (dist <= shieldRadius + 0.5) {
          // Reset outside
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * (Math.PI / 2.5);
          const r = shieldRadius + 14;
          rayPos[i] = r * Math.sin(phi) * Math.cos(theta);
          rayPos[i + 1] = r * Math.cos(phi);
          rayPos[i + 2] = r * Math.sin(phi) * Math.sin(theta);
        } else {
          // Travel inward along radial vector
          const factor = (raySpeed * delta) / dist;
          rayPos[i] -= vx * factor;
          rayPos[i + 1] -= vy * factor;
          rayPos[i + 2] -= vz * factor;
        }
      }
      rayParticles.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // Resize Observer
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
    resizeObserver.observe(mount);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.dispose();
      controls.dispose();
    };
  }, [
    isMars,
    hasDustStorm,
    hasEclipse,
    hasSolarFlare,
    dustFactor,
    frostFactor,
    lightingMode,
    isShieldStrong,
    isShieldCritical,
    shieldIntensity,
    isLifeSupportThriving,
    isLifeSupportStressed,
    isPowerCritical,
    isBatteryCharging,
    interactive,
  ]);

  // Handle manual dust blowing
  const handleWipeSolarDust = () => {
    soundEffects.playButtonClick();
    setIsDustBlown(true);
    setTimeout(() => {
      setIsDustBlown(false);
    }, 8000);
  };

  return (
    <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] max-h-[460px] bg-[#070C18] rounded-2xl overflow-hidden select-none flex flex-col justify-between">
      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* TOP HUD: Environmental State & Status Indicators */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-2 p-3 bg-gradient-to-b from-[#0B1120]/90 to-transparent backdrop-blur-sm pointer-events-none text-xs">
        {/* Left Side: Real-time Visual Status Pills */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          {/* USER REQUIREMENT 1: Martian Dust Settling Status */}
          {isMars && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[11px] font-bold backdrop-blur-md border shadow-lg ${
                hasDustStorm
                  ? "bg-amber-950/80 border-amber-500/60 text-amber-300 animate-pulse"
                  : "bg-slate-900/80 border-slate-700/60 text-slate-300"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {hasDustStorm
                  ? isDustBlown
                    ? "Dust Blown (Temporary Recovery) 💨"
                    : "Mars Dust Settling on Solar Panels (-40%) 🌪️"
                  : "Solar Panels: Clean Baseline ☀️"}
              </span>
            </div>
          )}

          {/* USER REQUIREMENT 2: Lunar Frost Accumulation Status */}
          {!isMars && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[11px] font-bold backdrop-blur-md border shadow-lg ${
                frostFactor > 0.4
                  ? "bg-cyan-950/80 border-cyan-400/60 text-cyan-200 animate-pulse"
                  : "bg-slate-900/80 border-slate-700/60 text-slate-300"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              <span>
                {frostFactor > 0.4
                  ? "Twilight Frost Accumulating (-173°C) ❄️"
                  : "Thermal Baseline: Sunlit Rim ☀️"}
              </span>
            </div>
          )}

          {/* USER REQUIREMENT 3: Glowing Magnetic Deflector Shield Indicator */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[11px] font-bold backdrop-blur-md border shadow-lg ${
              isShieldStrong
                ? "bg-cyan-950/80 border-cyan-500/60 text-cyan-300"
                : isShieldCritical
                ? "bg-rose-950/80 border-rose-500/60 text-rose-300 animate-bounce"
                : "bg-blue-950/80 border-blue-500/60 text-blue-300"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>
              {isShieldStrong
                ? "Magnetic Shield: Active Deflection 🛡️"
                : isShieldCritical
                ? "Magnetic Shield: Critical Fissures ⚠️"
                : "Deflector Shield: Standard Field"}
            </span>
          </div>
        </div>

        {/* Right Side: Quick Action buttons (Dust Blower, Lighting, Camera Presets) */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Dust Blower Action for Mars */}
          {isMars && hasDustStorm && (
            <button
              type="button"
              onClick={handleWipeSolarDust}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 border border-amber-500/50 text-amber-200 font-mono text-[11px] font-bold flex items-center gap-1 shadow-md transition-all active:scale-95"
            >
              <span>💨 Electrostatic Dust Wiper</span>
            </button>
          )}

          {/* Lighting Mode Switcher */}
          <div className="flex items-center p-0.5 rounded-lg bg-black/50 border border-white/10 text-[11px]">
            <button
              type="button"
              onClick={() => {
                soundEffects.playSliderClick(70);
                setLightingMode("day");
              }}
              title="Day Sun"
              className={`p-1 rounded ${
                lightingMode === "day" ? "bg-amber-500/30 text-amber-300" : "text-slate-400"
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                soundEffects.playSliderClick(70);
                setLightingMode("twilight");
              }}
              title="Twilight / Frost Horizon"
              className={`p-1 rounded ${
                lightingMode === "twilight" ? "bg-cyan-500/30 text-cyan-300" : "text-slate-400"
              }`}
            >
              <CloudSun className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                soundEffects.playSliderClick(70);
                setLightingMode("night");
              }}
              title="Night / Eclipse"
              className={`p-1 rounded ${
                lightingMode === "night" ? "bg-indigo-500/30 text-indigo-300" : "text-slate-400"
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM HUD: Camera Quick-Jumps & Tap Prompt */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-2 p-3 bg-gradient-to-t from-[#0B1120]/95 via-[#0B1120]/60 to-transparent backdrop-blur-sm pointer-events-none text-xs">
        {/* Camera Preset Quick Buttons */}
        <div className="flex items-center gap-1 pointer-events-auto">
          <span className="text-[10px] font-mono text-slate-400 mr-1 hidden sm:inline flex items-center gap-1">
            <Camera className="w-3 h-3 text-cyan-400" /> Presets:
          </span>
          <button
            type="button"
            onClick={() => setCameraPreset("overview")}
            className="px-2 py-1 rounded bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-[10px] font-mono text-slate-300 shadow-sm"
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setCameraPreset("solar")}
            className="px-2 py-1 rounded bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-[10px] font-mono text-slate-300 shadow-sm"
          >
            Solar Array
          </button>
          <button
            type="button"
            onClick={() => setCameraPreset("shield")}
            className="px-2 py-1 rounded bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-[10px] font-mono text-slate-300 shadow-sm"
          >
            Deflector
          </button>
          <button
            type="button"
            onClick={() => setCameraPreset("hydro")}
            className="px-2 py-1 rounded bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-[10px] font-mono text-slate-300 shadow-sm"
          >
            Bio-Dome
          </button>
          <button
            type="button"
            onClick={() => setCameraPreset("rover")}
            className="px-2 py-1 rounded bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-[10px] font-mono text-slate-300 shadow-sm"
          >
            Rover EVA
          </button>
        </div>

        {/* Telemetry Indicator */}
        <div className="flex items-center gap-2 pointer-events-auto text-[10px] font-mono text-slate-400">
          {inspectedModule && (
            <span className="px-2 py-0.5 rounded bg-cyan-950/90 border border-cyan-500/50 text-cyan-300 font-bold uppercase flex items-center gap-1">
              <Layers className="w-3 h-3 text-cyan-400" />
              Focus: {inspectedModule}
            </span>
          )}
          <span className="hidden md:inline">Click 3D structures to inspect</span>
          <span className="px-1.5 py-0.5 rounded bg-black/60 border border-white/10 text-cyan-400">
            {fps} FPS
          </span>
        </div>
      </div>
    </div>
  );
}
