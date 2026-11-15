// ============================================================
// Habitat diorama for the game screen (ported from the v3 scene3d.js).
// Flat-shaded, no glow. The shield dome, greenhouse lights and battery
// lamps follow the power sliders; Run Day sweeps the sun across the sky.
// ============================================================
import * as THREE from 'three';
import { color } from '../tokens';
import type { PlanetId } from './planet';

interface EnvDef {
  sky: string;
  ground: string;
  sun: number;
  sunI: number;
  hemiSky: number;
  hemiGround: number;
  hemiI: number;
  fog: [string, number, number] | null;
  stars: boolean;
  /** Sun skims the horizon all day (polar) instead of rising and setting. */
  polar: boolean;
}

const ENV: Record<PlanetId, EnvDef> = {
  moon: { sky: '#050607', ground: color.sceneMoon, sun: 0xfff6ea, sunI: 3.2, hemiSky: 0x5a6470, hemiGround: 0x15171a, hemiI: 0.35, fog: null, stars: true, polar: true },
  mars: { sky: color.sceneMarsSky, ground: color.sceneMars, sun: 0xffe6cc, sunI: 2.6, hemiSky: 0xb07a5c, hemiGround: 0x3a2016, hemiI: 0.6, fog: [color.sceneMarsSky, 40, 130], stars: false, polar: false },
  europa: { sky: '#050607', ground: color.sceneEuropa, sun: 0xfff6ea, sunI: 1.8, hemiSky: 0x6a7a88, hemiGround: 0x1a1f24, hemiI: 0.45, fog: null, stars: true, polar: true },
  titan: { sky: color.sceneTitanSky, ground: color.sceneTitan, sun: 0xffd9a8, sunI: 1.2, hemiSky: 0xa87a44, hemiGround: 0x2a1a0a, hemiI: 0.75, fog: [color.sceneTitanSky, 30, 100], stars: false, polar: false },
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const H = Math.PI / 2;

function h2(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export interface HabitatParams {
  /** MW on the radiation shield. */
  shield: number;
  /** MW on the greenhouse. */
  food: number;
  /** MW on the power grid. */
  batt: number;
  /** Battery lamps, 0–100. */
  battery: number;
}

export interface HabitatView {
  set(p: Partial<HabitatParams>): void;
  setEnv(name: PlanetId): void;
  /** Sweep the sun across one day over `ms`. */
  runDay(ms: number, opts?: { flare?: boolean }): void;
  setReduceMotion(v: boolean): void;
  dispose(): void;
}

export function createHabitat(el: HTMLElement, opts: { env?: PlanetId; reduceMotion?: boolean } = {}): HabitatView {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const cv = renderer.domElement;
  cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  el.appendChild(cv);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 600);
  const sun = new THREE.DirectionalLight(0xffffff, 3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 1, far: 120 });
  sun.shadow.bias = -0.0004;
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x000000, 0.4);
  scene.add(hemi);

  // ---- Terrain ----
  const gGeo = new THREE.PlaneGeometry(170, 170, 130, 130);
  gGeo.rotateX(-Math.PI / 2);
  const gp = gGeo.attributes.position;
  const craters: Array<[number, number, number]> = [[-10, -7, 3.4], [13, -11, 4.6], [-15, 11, 5.2], [8, 14, 2.6], [22, 3, 3.2], [-26, -18, 7], [30, -26, 9], [-4, 22, 4]];
  for (let i = 0; i < gp.count; i++) {
    const x = gp.getX(i), z = gp.getZ(i), r = Math.hypot(x, z);
    let y = (h2(x * 0.71, z * 0.71) - 0.5) * 0.24 + Math.sin(x * 0.09) * Math.cos(z * 0.075) * 0.7;
    if (r > 28) y += (r - 28) * 0.1;
    for (const [cx, cz, cr] of craters) {
      const d = Math.hypot(x - cx, z - cz) / cr;
      if (d < 1) y -= (1 - d * d) * cr * 0.28;
      else if (d < 1.45) y += (1.45 - d) * cr * 0.14;
    }
    if (r < 8.5) y *= Math.max(0.06, r / 8.5);
    gp.setY(i, y);
  }
  gGeo.computeVertexNormals();
  const gMat = new THREE.MeshStandardMaterial({ roughness: 1, metalness: 0, flatShading: true });
  const ground = new THREE.Mesh(gGeo, gMat);
  ground.receiveShadow = true;
  scene.add(ground);

  // ---- Outpost ----
  const M = (c: number, o: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.65, metalness: 0.05, flatShading: true, ...o });
  const hull = M(0xd9dcdd), trim = M(0x3a4045), dark = M(0x22272b);
  const panelM = M(0x1d2b3d, { roughness: 0.3, metalness: 0.5 });
  const foil = M(0xc9a24a, { roughness: 0.4, metalness: 0.6, side: THREE.DoubleSide });
  const base = new THREE.Group();
  scene.add(base);
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, parent: THREE.Object3D = base) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, rz);
    m.castShadow = m.receiveShadow = true;
    parent.add(m);
    return m;
  };

  const modGeo = new THREE.CylinderGeometry(1, 1, 3.6, 24);
  add(modGeo, hull, -2.9, 1.15, 0, 0, 0, H);
  add(modGeo, hull, 2.9, 1.15, 0, 0, 0, H);
  add(new THREE.CylinderGeometry(0.9, 0.9, 3, 24), hull, 0, 1.15, 2.6, H, 0, 0);
  add(new THREE.CylinderGeometry(1.15, 1.15, 2.3, 24), hull, 0, 1.15, 0);
  add(new THREE.CylinderGeometry(1.2, 1.2, 0.12, 24), trim, 0, 2.32, 0);
  for (const x of [-4.2, -1.6, 1.6, 4.2]) add(new THREE.CylinderGeometry(1.04, 1.04, 0.14, 24), trim, x, 1.15, 0, 0, 0, H);
  const cap = new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, H);
  add(cap, hull, -4.7, 1.15, 0, 0, 0, H);
  add(cap, hull, 4.7, 1.15, 0, 0, 0, -H);
  add(new THREE.SphereGeometry(0.9, 20, 10, 0, Math.PI * 2, 0, H), hull, 0, 1.15, 4.1, H, 0, 0);
  for (const x of [-4, -1.8, 1.8, 4]) for (const z of [-0.6, 0.6]) add(new THREE.BoxGeometry(0.14, 0.5, 0.14), trim, x, 0.2, z);
  for (const x of [-3.6, -2.2, 2.2, 3.6]) add(new THREE.BoxGeometry(0.36, 0.22, 0.06), dark, x, 1.5, 0.97);

  // Greenhouse dome
  const domeMat = new THREE.MeshStandardMaterial({ color: 0xd6e4dc, transparent: true, opacity: 0.42, roughness: 0.15, metalness: 0, flatShading: true });
  const dome = add(new THREE.SphereGeometry(1.7, 18, 9, 0, Math.PI * 2, 0, H), domeMat, 0, 0.05, -3.9);
  dome.castShadow = false;
  add(new THREE.CylinderGeometry(1.75, 1.8, 0.2, 18), trim, 0, 0.05, -3.9);
  add(new THREE.CylinderGeometry(0.5, 0.5, 1.6, 16), hull, 0, 0.9, -1.8, H, 0, 0);
  const plantMat = M(0x6e9a55);
  const plantGeo = new THREE.ConeGeometry(0.17, 0.6, 6);
  const plants: THREE.Mesh[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2, r = 0.45 + (i % 3) * 0.35;
    plants.push(add(plantGeo, plantMat, Math.cos(a) * r, 0.4, -3.9 + Math.sin(a) * r));
  }
  const growLight = new THREE.PointLight(0xffd6a8, 6, 5, 2);
  growLight.position.set(0, 1.2, -3.9);
  base.add(growLight);

  // Solar panels track the sun
  const panels: THREE.Group[] = [];
  for (let i = 0; i < 3; i++) {
    const z = -4.5 + i * 3.2;
    add(new THREE.CylinderGeometry(0.07, 0.07, 2.6, 8), trim, 9.5, 1.3, z);
    const g = new THREE.Group();
    g.position.set(9.5, 2.8, z);
    base.add(g);
    add(new THREE.BoxGeometry(0.06, 1.7, 2.7), panelM, 0, 0, 0, 0, 0, 0, g);
    panels.push(g);
  }

  // Battery bank with five lamps
  add(new THREE.BoxGeometry(2.2, 1.1, 1.2), dark, -7.6, 0.55, 3.4);
  const cellGeo = new THREE.BoxGeometry(0.28, 0.5, 0.04);
  const cells: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>[] = [];
  for (let i = 0; i < 5; i++) {
    const m = new THREE.Mesh(cellGeo, new THREE.MeshBasicMaterial({ color: 0x1a1f22 }));
    m.position.set(-8.4 + i * 0.4, 0.6, 4.02);
    base.add(m);
    cells.push(m);
  }

  // Radiator, comms dish, regolith blocks
  add(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 8), trim, -7.8, 1.2, -3.2);
  add(new THREE.BoxGeometry(0.06, 1.8, 3.2), hull, -7.8, 1.9, -3.2);
  add(new THREE.CylinderGeometry(0.06, 0.08, 4.2, 8), trim, 5.8, 2.1, 4.4);
  add(new THREE.SphereGeometry(0.7, 16, 8, 0, Math.PI * 2, 0, 1.0), foil, 5.8, 4.3, 4.4, -0.9, 0.6, 0);
  const rockMat = M(0x8a8780);
  const rockGeo = new THREE.BoxGeometry(0.9, 0.5, 0.7);
  for (let i = 0; i < 6; i++) add(rockGeo, rockMat, -2 + i * 0.95, 0.25, -6.6 - (i % 2) * 0.2, 0, i * 0.3, 0);

  // Radiation shield: wireframe dome that thickens with power
  const accent = new THREE.Color(color.accent), caution = new THREE.Color(color.caution);
  const shieldMat = new THREE.MeshBasicMaterial({ color: color.accent, wireframe: true, transparent: true, opacity: 0.15, depthWrite: false });
  const shield = new THREE.Mesh(new THREE.IcosahedronGeometry(7.4, 3), shieldMat);
  scene.add(shield);

  // Sky
  const sg = new THREE.BufferGeometry(), sa = new Float32Array(1500 * 3);
  for (let i = 0; i < 1500; i++) {
    const u = Math.random() * Math.PI * 2, v = Math.random() * 0.9 + 0.05, r = 400;
    sa[i * 3] = Math.cos(u) * Math.cos(v) * r;
    sa[i * 3 + 1] = Math.sin(v) * r;
    sa[i * 3 + 2] = Math.sin(u) * Math.cos(v) * r;
  }
  sg.setAttribute('position', new THREE.BufferAttribute(sa, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: color.text2, size: 1.2, sizeAttenuation: false }));
  const earth = new THREE.Mesh(new THREE.SphereGeometry(6, 32, 16), new THREE.MeshStandardMaterial({ color: 0x3f6fa8, roughness: 1 }));
  earth.position.set(-150, 22, -260);
  scene.add(stars, earth);

  let envName: PlanetId = 'moon', envCfg = ENV.moon;
  function setEnv(name: PlanetId) {
    envName = ENV[name] ? name : 'moon';
    envCfg = ENV[envName];
    scene.background = new THREE.Color(envCfg.sky);
    scene.fog = envCfg.fog ? new THREE.Fog(envCfg.fog[0], envCfg.fog[1], envCfg.fog[2]) : null;
    gMat.color.set(envCfg.ground);
    sun.color.set(envCfg.sun);
    hemi.color.set(envCfg.hemiSky);
    hemi.groundColor.set(envCfg.hemiGround);
    stars.visible = envCfg.stars;
    earth.visible = envName === 'moon';
  }
  setEnv(opts.env ?? 'moon');

  const params: HabitatParams = { shield: 20, food: 20, batt: 30, battery: 70 };
  const target: HabitatParams = { ...params };
  let theta = 0.75, dayDur = 0, dayStart = 0, flare = false, raf = 0, reduce = !!opts.reduceMotion;

  const fit = () => {
    const w = el.clientWidth || 1, h = el.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(fit);
  ro.observe(el);
  fit();

  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    (Object.keys(target) as Array<keyof HabitatParams>).forEach(k => { params[k] += (target[k] - params[k]) * 0.08; });
    let prog = -1;
    if (dayDur) {
      prog = (now - dayStart) / dayDur;
      if (prog >= 1) { dayDur = 0; prog = -1; }
    }
    if (!reduce) theta += 0.0006;
    camera.position.set(Math.cos(theta) * 25, 9, Math.sin(theta) * 25);
    camera.lookAt(0, 0.6, 0);

    // Polar worlds: the sun circles the horizon. Others: it rises and sets.
    let az = 2.3, elv = envCfg.polar ? 0.1 : 0.75, day = 1;
    if (prog >= 0) {
      if (envCfg.polar) az += prog * Math.PI * 2;
      else { elv = 0.75 * Math.cos(prog * Math.PI * 2); az += prog * Math.PI; day = clamp((elv + 0.05) / 0.25, 0, 1); }
    }
    sun.position.set(Math.cos(az) * Math.cos(elv) * 40, Math.max(Math.sin(elv), 0.02) * 40, Math.sin(az) * Math.cos(elv) * 40);
    sun.intensity = envCfg.sunI * day;
    hemi.intensity = envCfg.hemiI * (0.3 + 0.7 * day);
    panels.forEach(g => { g.rotation.y = -az; });

    // Shield: opacity follows MW; a flare pushes it amber for a beat.
    let op = 0.04 + Math.min(1, params.shield / 40) * 0.26;
    shieldMat.color.copy(accent);
    if (prog >= 0 && flare) {
      const f = Math.sin(clamp((prog - 0.3) / 0.4, 0, 1) * Math.PI);
      shieldMat.color.lerp(caution, f);
      op += f * 0.35;
    }
    shieldMat.opacity = op;
    if (!reduce) shield.rotation.y += 0.0005;

    growLight.intensity = 0.3 + Math.min(1, params.food / 30) * 9;
    const gs = 0.5 + Math.min(1.3, params.food / 24) * 0.6;
    plants.forEach((pl, i) => { const s = gs * (0.8 + (i % 3) * 0.15); pl.scale.set(1, s, 1); pl.position.y = 0.12 + 0.3 * s; });

    const lit = Math.ceil(clamp(params.battery, 0, 100) / 20);
    cells.forEach((c, i) => c.material.color.set(i < lit ? (lit <= 1 ? color.critical : color.accent) : 0x1a1f22));
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);

  return {
    set: p => { Object.assign(target, p); },
    setEnv,
    runDay: (ms, o = {}) => { dayDur = ms; dayStart = performance.now(); flare = !!o.flare; },
    setReduceMotion: v => { reduce = !!v; },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      scene.traverse(o => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
        const mat = m.material;
        if (Array.isArray(mat)) mat.forEach(x => x.dispose()); else mat?.dispose?.();
      });
      renderer.dispose();
      cv.remove();
    },
  };
}
