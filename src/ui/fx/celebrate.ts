// ============================================================
// Celebration effects (design system v3): shape burst, achievement
// pop-up, "Promoted" banner. Plain DOM + Web Animations so they work
// from anywhere and never re-render React.
//
// You normally don't call these directly: installCelebrations()
// (mounted once via <CelebrationLayer/>) listens to award() events
// and fires the right effect for the player's celebrate level.
// ============================================================

import { color, ease, font, shape } from '../tokens';
import { getSettings, onProgressEvent, type AwardAt } from '../game/progress';
import { prefersReducedMotion } from '../hooks';
import { sfx } from './sound';

// ---------- Hosts ----------

function host(cls: string): HTMLElement {
  let el = document.querySelector<HTMLElement>(`body > .${cls}`);
  if (!el) {
    el = document.createElement('div');
    el.className = cls;
    if (cls === 'oc-ach-stack') { el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite'); }
    document.body.appendChild(el);
  }
  return el;
}
const fxLayer = () => host('oc-fx-layer');
const achStack = () => host('oc-ach-stack');

function span(parent: HTMLElement, css: string, text?: string) {
  const d = document.createElement('span');
  d.style.cssText = 'position:fixed;display:block;pointer-events:none;' + css;
  if (text !== undefined) d.textContent = text;
  parent.appendChild(d);
  return d;
}

// ---------- Anchors: where a celebration starts ----------

let hudEl: HTMLElement | null = null;
let lastPointer: { x: number; y: number; t: number } | null = null;

/** The rank HUD registers itself so awards fly from / pulse it. */
export function setHudAnchor(el: HTMLElement | null) { hudEl = el; }

function hudPoint() {
  const r = hudEl?.getBoundingClientRect();
  return r && r.width ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: window.innerWidth - 120, y: 40 };
}
function resolveAt(at: AwardAt) {
  if (typeof at === 'object') return at;
  if (at === 'pointer' && lastPointer && performance.now() - lastPointer.t < 4000) return lastPointer;
  return hudPoint();
}

// ---------- Effects ----------

const SHAPES = [shape.circle, shape.triangle, shape.diamond, shape.square];

/** Shape burst: a ring plus status-shape confetti in Signal Blue and white, with an optional "+XP" float. */
export function burst(x: number, y: number, opts: { xp?: number; count?: number } = {}) {
  if (prefersReducedMotion()) return;
  const layer = fxLayer(), n = opts.count ?? 18;
  const ring = span(layer, `left:${x - 12}px;top:${y - 12}px;width:24px;height:24px;border:2px solid ${color.accent};border-radius:50%`);
  ring.animate([{ transform: 'scale(.4)', opacity: 1 }, { transform: 'scale(4)', opacity: 0 }], { duration: 640, easing: ease.out }).onfinish = () => ring.remove();
  for (let i = 0; i < n; i++) {
    const sz = 6 + Math.random() * 8, a = Math.random() * Math.PI * 2, dist = 50 + Math.random() * 120;
    const dx = Math.cos(a) * dist, dy = Math.sin(a) * dist + 30;
    const d = span(layer, `left:${x - sz / 2}px;top:${y - sz / 2}px;width:${sz}px;height:${sz}px;background:${i % 3 ? color.accent : color.text1};clip-path:${SHAPES[i % 4]}`);
    d.animate(
      [{ transform: 'translate(0,0) rotate(0deg) scale(1)', opacity: 1 }, { transform: `translate(${dx}px,${dy}px) rotate(${Math.random() * 540 - 270}deg) scale(.2)`, opacity: 0 }],
      { duration: 700 + Math.random() * 500, easing: ease.out },
    ).onfinish = () => d.remove();
  }
  if (opts.xp) {
    const t = span(layer, `left:${x}px;top:${y - 28}px;font-family:${font.data};font-weight:500;font-size:16px;color:${color.accent};white-space:nowrap`, `+${opts.xp} XP`);
    t.animate(
      [{ transform: 'translate(-50%,8px)', opacity: 0 }, { transform: 'translate(-50%,-8px)', opacity: 1, offset: 0.25 }, { transform: 'translate(-50%,-56px)', opacity: 0 }],
      { duration: 1200, easing: ease.out, fill: 'forwards' },
    ).onfinish = () => t.remove();
  }
}

/** Pulse the rank HUD border so the eye follows the XP there. */
export function pulseHud() {
  if (!hudEl || prefersReducedMotion()) return;
  hudEl.animate(
    [{ transform: 'scale(1)', borderColor: color.accent }, { transform: 'scale(1.08)', borderColor: color.accent }, { transform: 'scale(1)', borderColor: color.lineStrong }],
    { duration: 480, delay: 300, easing: ease.out },
  );
}

/** Achievement pop-up: slides in top-right, diamond badge spins in, 3.2 s countdown bar. Max 4 stacked. */
export function achievementToast(title: string, xp: number) {
  const stack = achStack(), rm = prefersReducedMotion();
  const el = document.createElement('div');
  el.style.cssText = `position:relative;display:flex;align-items:center;gap:12px;padding:12px 16px;background:${color.bgPanel};border:1px solid ${color.accent};border-radius:4px;overflow:hidden;color:${color.text1};font-family:${font.ui}`;
  el.innerHTML =
    `<span style="flex:none;width:40px;height:40px;display:grid;place-items:center;background:${color.accentTrack};border-radius:2px"><span data-b style="display:block;width:18px;height:18px;background:${color.accent};clip-path:${shape.diamond}"></span></span>` +
    `<span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px"><span style="font-family:${font.data};font-weight:500;font-size:12px;letter-spacing:.08em;color:${color.accent}">ACHIEVEMENT UNLOCKED</span><span data-t style="font-weight:600;font-size:16px;line-height:20px"></span></span>` +
    `<span data-x style="flex:none;font-family:${font.data};font-weight:500;font-size:16px;color:${color.accent}"></span>` +
    `<span data-bar style="position:absolute;left:0;bottom:0;height:2px;width:100%;background:${color.accent};transform-origin:0 50%"></span>`;
  el.querySelector<HTMLElement>('[data-t]')!.textContent = title;
  el.querySelector<HTMLElement>('[data-x]')!.textContent = `+${xp}`;
  stack.prepend(el);
  while (stack.children.length > 4) stack.lastChild!.remove();
  if (!rm) {
    el.animate([{ transform: 'translateX(110%)' }, { transform: 'none' }], { duration: 420, easing: ease.out });
    el.querySelector('[data-b]')!.animate([{ transform: 'rotate(-180deg) scale(0)' }, { transform: 'none' }], { duration: 640, delay: 160, easing: 'cubic-bezier(.2,1.5,.4,1)', fill: 'backwards' });
  }
  el.querySelector('[data-bar]')!.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], { duration: 3200, easing: 'linear', fill: 'forwards' });
  window.setTimeout(() => {
    el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: rm ? 'none' : 'translateX(40px)' }], { duration: 240, fill: 'forwards' }).onfinish = () => el.remove();
  }, 3200);
}

/** Text scramble used by headings and the promotion banner: random glyphs resolve left to right. */
export function scramble(el: HTMLElement | null, final: string, durMs = 700) {
  if (!el) return;
  if (prefersReducedMotion()) { el.textContent = final; return; }
  const ch = '0123456789#%/▲◆○ABCDEFGHKMNPRSTVXZ', t0 = performance.now();
  const step = (now: number) => {
    const p = Math.min(1, (now - t0) / durMs), n = Math.floor(p * final.length);
    el.textContent = final.slice(0, n) + final.slice(n).replace(/[^ ]/g, () => ch[Math.floor(Math.random() * ch.length)]);
    if (p < 1) requestAnimationFrame(step); else el.textContent = final;
  };
  requestAnimationFrame(step);
}

/** "Rank up · Promoted to" banner across the middle of the screen, with a big burst and the victory arpeggio. */
export function promoteBanner(name: string, level: number, total: number) {
  const layer = fxLayer(), rm = prefersReducedMotion();
  const el = document.createElement('div');
  el.setAttribute('role', 'alert');
  el.style.cssText = `position:fixed;left:0;right:0;top:50%;height:200px;margin-top:-100px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:${color.bgVoid};border-top:1px solid ${color.accent};border-bottom:1px solid ${color.accent};overflow:hidden;color:${color.text1}`;
  el.innerHTML =
    `<span data-sw style="position:absolute;top:0;bottom:0;left:0;width:40%;background:${color.accentTrack}"></span>` +
    `<span style="position:relative;font-family:${font.data};font-weight:500;font-size:14px;letter-spacing:.12em;color:${color.accent}">RANK UP · PROMOTED TO</span>` +
    `<span data-n style="position:relative;font-family:${font.label};font-weight:600;font-size:72px;line-height:72px;letter-spacing:.04em;text-align:center"></span>` +
    `<span data-l style="position:relative;font-family:${font.data};font-size:14px;color:${color.text2}"></span>`;
  const nameEl = el.querySelector<HTMLElement>('[data-n]')!;
  nameEl.textContent = name;
  el.querySelector<HTMLElement>('[data-l]')!.textContent = `LEVEL ${level} OF ${total}`;
  layer.appendChild(el);
  if (rm) {
    el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240 });
    el.querySelector<HTMLElement>('[data-sw]')!.style.display = 'none';
  } else {
    el.animate([{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], { duration: 280, easing: ease.out });
    el.querySelector('[data-sw]')!.animate([{ transform: 'translateX(-100%)' }, { transform: 'translateX(260%)' }], { duration: 1100, easing: ease.inout, fill: 'forwards' });
    scramble(nameEl, name, 800);
    burst(window.innerWidth / 2, window.innerHeight / 2, { count: 40 });
  }
  sfx.play('victory');
  window.setTimeout(() => {
    el.animate([{ transform: 'scaleY(1)', opacity: 1 }, { transform: rm ? 'scaleY(1)' : 'scaleY(0)', opacity: 0 }], { duration: 280, fill: 'forwards' }).onfinish = () => el.remove();
  }, 2400);
}

// ---------- Wiring: award() events → effects ----------

let installed = 0;
let uninstall: (() => void) | null = null;

/**
 * Start listening to progress events and celebrate them. Idempotent and ref-counted,
 * so React StrictMode double-mounts are fine. Returns a cleanup function.
 */
export function installCelebrations(): () => void {
  installed++;
  if (installed === 1) {
    const onPt = (e: PointerEvent) => { lastPointer = { x: e.clientX, y: e.clientY, t: performance.now() }; };
    window.addEventListener('pointerdown', onPt, { capture: true, passive: true });
    let lastChime = 0;
    const off = onProgressEvent(e => {
      const level = getSettings().celebrate;
      if (level === 'off') return;
      if (e.type === 'award') {
        const p = resolveAt(e.at);
        if (level === 'full') burst(p.x, p.y, { xp: e.xp, count: e.at === 'hud' ? 8 : 18 });
        pulseHud();
        achievementToast(e.title, e.xp);
        const now = performance.now();
        if (now - lastChime > 200) { lastChime = now; sfx.play('chime'); }
      } else if (e.type === 'promote' && level === 'full') {
        // Let the achievement pop-up land first.
        window.setTimeout(() => promoteBanner(e.name, e.level, e.total), 900);
      }
    });
    uninstall = () => { off(); window.removeEventListener('pointerdown', onPt, { capture: true }); };
  }
  return () => {
    installed = Math.max(0, installed - 1);
    if (installed === 0) { uninstall?.(); uninstall = null; }
  };
}
