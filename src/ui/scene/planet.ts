// ============================================================
// Planet globe for the landing screen (ported from the v3 scene3d.js).
// Flat-shaded, low-poly, no glow. Swaps worlds with a squash + spin.
// ============================================================
import * as THREE from 'three';
import { color } from '../tokens';

type RGB = [number, number, number];
interface PlanetDef { seed: number; base: RGB; dark: RGB; craters: number; rough: number; tilt: number; cap?: boolean; site: [number, number] }

export type PlanetId = 'moon' | 'mars' | 'europa' | 'titan';

const PLANETS: Record<PlanetId, PlanetDef> = {
  moon: { seed: 3, base: [0.62, 0.615, 0.59], dark: [0.34, 0.34, 0.33], craters: 34, rough: 0.05, tilt: -0.62, site: [-89.9, 0] },
  mars: { seed: 11, base: [0.72, 0.38, 0.2], dark: [0.42, 0.2, 0.12], craters: 14, rough: 0.035, tilt: 0.22, cap: true, site: [-4.6, 137.4] },
  europa: { seed: 7, base: [0.86, 0.87, 0.84], dark: [0.5, 0.36, 0.28], craters: 6, rough: 0.015, tilt: 0.1, site: [10, 40] },
  titan: { seed: 19, base: [0.78, 0.5, 0.18], dark: [0.46, 0.28, 0.1], craters: 4, rough: 0.02, tilt: -0.15, site: [-10, 160] },
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function ih(x: number, y: number, z: number) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 1440662683);
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function vn(x: number, y: number, z: number) {
  const X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z), fx = x - X, fy = y - Y, fz = z - Z;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
  const L = (a: number, b: number, t: number) => a + (b - a) * t;
  return L(
    L(L(ih(X, Y, Z), ih(X + 1, Y, Z), u), L(ih(X, Y + 1, Z), ih(X + 1, Y + 1, Z), u), v),
    L(L(ih(X, Y, Z + 1), ih(X + 1, Y, Z + 1), u), L(ih(X, Y + 1, Z + 1), ih(X + 1, Y + 1, Z + 1), u), v),
    w,
  );
}
function fbm(x: number, y: number, z: number, o: number) {
  let a = 0.5, f = 1, s = 0;
  for (let i = 0; i < o; i++) { s += a * vn(x * f, y * f, z * f); f *= 2.03; a *= 0.5; }
  return s;
}
function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildPlanet(name: PlanetId) {
  const P = PLANETS[name];
  const geo = new THREE.IcosahedronGeometry(1, 22);
  const pos = geo.attributes.position, n = pos.count, r = rng(P.seed);
  const cr: number[][] = [];
  for (let i = 0; i < P.craters; i++) {
    const u = r() * 2 - 1, t = r() * Math.PI * 2, s = Math.sqrt(1 - u * u);
    cr.push([s * Math.cos(t), u, s * Math.sin(t), 0.04 + Math.pow(r(), 2) * 0.22]);
  }
  const dirs = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const v = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)).normalize();
    dirs[i * 3] = v.x; dirs[i * 3 + 1] = v.y; dirs[i * 3 + 2] = v.z;
    let h = (fbm(v.x * 2.5 + P.seed, v.y * 2.5, v.z * 2.5, 4) - 0.5) * P.rough * 2;
    for (const [cx, cy, cz, rad] of cr) {
      const d = Math.acos(clamp(v.x * cx + v.y * cy + v.z * cz, -1, 1)) / rad;
      if (d < 1) h -= (1 - d * d) * rad * 0.22; else if (d < 1.35) h += (1.35 - d) * rad * 0.16;
    }
    pos.setXYZ(i, v.x * (1 + h), v.y * (1 + h), v.z * (1 + h));
  }
  const col = new Float32Array(n * 3), c = new THREE.Color();
  for (let i = 0; i < n; i += 3) {
    const x = (dirs[i * 3] + dirs[i * 3 + 3] + dirs[i * 3 + 6]) / 3;
    const y = (dirs[i * 3 + 1] + dirs[i * 3 + 4] + dirs[i * 3 + 7]) / 3;
    const z = (dirs[i * 3 + 2] + dirs[i * 3 + 5] + dirs[i * 3 + 8]) / 3;
    const m = fbm(x * 1.6 + 7, y * 1.6, z * 1.6, 4);
    const t = clamp((m - 0.44) / 0.14, 0, 1), j = (ih(i, 7, 3) - 0.5) * 0.04;
    let rr = P.base[0] + (P.dark[0] - P.base[0]) * t + j;
    let gg = P.base[1] + (P.dark[1] - P.base[1]) * t + j;
    let bb = P.base[2] + (P.dark[2] - P.base[2]) * t + j;
    if (P.cap && Math.abs(y) > 0.9 - m * 0.08) { rr = 0.9; gg = 0.88; bb = 0.85; }
    c.setRGB(rr, gg, bb, THREE.SRGBColorSpace);
    for (let k = 0; k < 3; k++) { col[(i + k) * 3] = c.r; col[(i + k) * 3 + 1] = c.g; col[(i + k) * 3 + 2] = c.b; }
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  return geo;
}

export interface PlanetView {
  setEnv(name: PlanetId): void;
  setReduceMotion(v: boolean): void;
  dispose(): void;
}

export function createPlanet(el: HTMLElement, opts: { env?: PlanetId; reduceMotion?: boolean } = {}): PlanetView {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  const cv = renderer.domElement;
  cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  el.appendChild(cv);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100); camera.position.set(0, 0, 5.2);
  const sun = new THREE.DirectionalLight(0xfff6ea, 3.4); sun.position.set(-4, 1.4, 3); scene.add(sun);
  scene.add(new THREE.AmbientLight(0x8090a0, 0.06));
  const tiltG = new THREE.Group(), spin = new THREE.Group(); tiltG.add(spin); scene.add(tiltG);
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1, metalness: 0 });
  const mesh = new THREE.Mesh(new THREE.BufferGeometry(), mat); spin.add(mesh);

  const markMat = new THREE.MeshBasicMaterial({ color: color.accent });
  const marker = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.28, 6), markMat); stem.position.y = 0.14; marker.add(stem);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.05), markMat); head.position.y = 0.3; marker.add(head);
  spin.add(marker);

  const ringPts = Array.from({ length: 128 }, (_, i) => { const a = (i / 128) * Math.PI * 2; return new THREE.Vector3(Math.cos(a) * 1.45, 0, Math.sin(a) * 1.45); });
  const ring = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(ringPts), new THREE.LineBasicMaterial({ color: color.lineStrong }));
  ring.rotation.x = 0.28; scene.add(ring);

  const sg = new THREE.BufferGeometry(), sa = new Float32Array(700 * 3);
  for (let i = 0; i < 700; i++) { sa[i * 3] = (Math.random() - 0.5) * 60; sa[i * 3 + 1] = (Math.random() - 0.5) * 40; sa[i * 3 + 2] = -20 - Math.random() * 10; }
  sg.setAttribute('position', new THREE.BufferAttribute(sa, 3));
  scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: color.text2, size: 1.2, sizeAttenuation: false })));

  let cur: PlanetId | null = null, swapT = -1, pending: PlanetId | null = null, raf = 0, reduce = !!opts.reduceMotion, tiltTarget = 0;
  const geos: Partial<Record<PlanetId, THREE.BufferGeometry>> = {};
  const apply = (name: PlanetId) => {
    const g = geos[name] ?? (geos[name] = buildPlanet(name));
    mesh.geometry = g; cur = name;
    const [lat, lon] = PLANETS[name].site, la = (lat * Math.PI) / 180, lo = (lon * Math.PI) / 180;
    const d = new THREE.Vector3(Math.cos(la) * Math.cos(lo), Math.sin(la), Math.cos(la) * Math.sin(lo));
    marker.position.copy(d.clone().multiplyScalar(0.99));
    marker.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
    tiltTarget = PLANETS[name].tilt;
  };
  apply(opts.env ?? 'moon');
  tiltG.rotation.x = tiltTarget;

  const fit = () => {
    const w = el.clientWidth || 1, h = el.clientHeight || 1;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(fit); ro.observe(el); fit();

  let last = performance.now();
  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(50, now - last); last = now;
    let boost = 0;
    if (swapT >= 0) {
      swapT += dt / 700; const k = Math.sin(Math.min(1, swapT) * Math.PI);
      mesh.scale.setScalar(1 - 0.12 * k); boost = k * 0.05;
      if (swapT >= 0.5 && pending) { apply(pending); pending = null; }
      if (swapT >= 1) { swapT = -1; mesh.scale.setScalar(1); }
    }
    marker.scale.setScalar(mesh.scale.x);
    spin.rotation.y += (reduce ? 0 : 0.0016) + boost;
    tiltG.rotation.x += (tiltTarget - tiltG.rotation.x) * 0.06;
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);

  return {
    setEnv(name) { if (name === cur && !pending) return; pending = name; swapT = 0; },
    setReduceMotion: v => { reduce = !!v; },
    dispose() {
      cancelAnimationFrame(raf); ro.disconnect();
      Object.values(geos).forEach(g => g?.dispose());
      mat.dispose(); renderer.dispose(); cv.remove();
    },
  };
}
