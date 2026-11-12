/**
 * Prisma · la mascota de JARVIS.
 * Un rostro hecho de fragmentos de luz proyectados sobre una base. Cada estado cambia la paleta,
 * la expresión y el gesto. Todo es SVG generado aquí (sin imágenes externas).
 * Funciones puras: no dependen de Angular, se pueden probar por separado.
 */
export type EstadoPrisma = 'idle' | 'welcome' | 'thinking' | 'analyzing' | 'alert' | 'ok' | 'explaining';

interface Paleta {
  c: [string, string, string, string];
  glow: string;
  face: string;
  beam: string;
}

const PAL: Record<'normal' | 'alert' | 'ok', Paleta> = {
  normal: { c: ['#a98cff', '#4fd1b5', '#8fd3ff', '#ec5cc4'], glow: '#a98cff', face: '#ffffff', beam: '#8fd3ff' },
  alert: { c: ['#ffb829', '#ff8a4c', '#ffd166', '#ff6b6b'], glow: '#ffb829', face: '#fff4dc', beam: '#ffd166' },
  ok: { c: ['#4fd1b5', '#8fd3ff', '#7ee8c8', '#a98cff'], glow: '#4fd1b5', face: '#eafff8', beam: '#7ee8c8' },
};

export const ETIQUETA_ESTADO: Record<EstadoPrisma, string> = {
  idle: 'JARVIS',
  welcome: 'JARVIS saludando',
  thinking: 'JARVIS pensando',
  analyzing: 'JARVIS analizando',
  alert: 'JARVIS mostrando una alerta',
  ok: 'JARVIS indicando que todo está bien',
  explaining: 'JARVIS explicando',
};

let uid = 0;
function id(p: string): string {
  return p + ++uid;
}

function paleta(estado: EstadoPrisma): Paleta {
  return estado === 'alert' ? PAL.alert : estado === 'ok' ? PAL.ok : PAL.normal;
}

function fragmentos(
  n: number, cx: number, cy: number, rad: number, sMin: number, sMax: number,
  p: Paleta, semilla: number, titilar: boolean,
): string {
  let sd = semilla;
  let out = '';
  const r = () => {
    sd = (sd * 16807) % 2147483647;
    return (sd - 1) / 2147483646;
  };
  for (let i = 0; i < n; i++) {
    const a = r() * 6.283;
    const d = Math.sqrt(r()) * rad;
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d * 1.08;
    const s = sMin + r() * (sMax - sMin);
    const rot = r() * 6.28;
    const c = p.c[(r() * 4) | 0];
    const lleno = r() < 0.32;
    const op = (0.4 + r() * 0.5).toFixed(2);
    const tw = titilar && r() < 0.35;
    const pts = [0, 1, 2]
      .map((k) => `${(x + Math.cos(rot + k * 2.094) * s).toFixed(1)},${(y + Math.sin(rot + k * 2.094) * s).toFixed(1)}`)
      .join(' ');
    out += `<polygon${tw ? ` class="jv-tw" style="animation-delay:${(r() * 3).toFixed(2)}s"` : ''} points="${pts}" fill="${lleno ? c : 'none'}" stroke="${c}" stroke-opacity="${op}" fill-opacity=".35"/>`;
  }
  return out;
}

/** Ilustración completa (viewBox 200×220) con su estado. */
export function prismaSvg(estado: EstadoPrisma = 'idle', etiqueta?: string): string {
  const p = paleta(estado);
  const f = p.face;
  const g = id('pg');
  const lbl = etiqueta ?? ETIQUETA_ESTADO[estado];
  let ojos: string;
  if (estado === 'welcome' || estado === 'ok') ojos = `<path d="M74 98q8-11 16 0M110 98q8-11 16 0" fill="none" stroke="${f}" stroke-width="5" stroke-linecap="round"/>`;
  else if (estado === 'thinking') ojos = `<g class="jv-look"><ellipse cx="86" cy="90" rx="6" ry="9" fill="${f}"/><ellipse cx="122" cy="90" rx="6" ry="9" fill="${f}"/></g>`;
  else if (estado === 'analyzing') ojos = `<rect x="72" y="93" width="20" height="6" rx="3" fill="${f}"/><rect x="108" y="93" width="20" height="6" rx="3" fill="${f}"/>`;
  else if (estado === 'alert') ojos = `<circle cx="82" cy="96" r="8.5" fill="${f}"/><circle cx="118" cy="96" r="8.5" fill="${f}"/><path d="M70 80l18 6M130 80l-18 6" stroke="${f}" stroke-width="4" stroke-linecap="round"/>`;
  else ojos = `<g class="jv-blink"><ellipse cx="82" cy="96" rx="7" ry="10" fill="${f}"/><ellipse cx="118" cy="96" rx="7" ry="10" fill="${f}"/></g>`;

  const boca =
    estado === 'alert' ? `<path d="M90 122h20" stroke="${f}" stroke-width="3.5" stroke-linecap="round"/>`
    : estado === 'thinking' ? `<circle cx="106" cy="122" r="3" fill="${f}"/>`
    : estado === 'explaining' ? `<ellipse cx="100" cy="122" rx="7" ry="5" fill="none" stroke="${f}" stroke-width="3"/>`
    : estado === 'welcome' || estado === 'ok' ? `<path d="M86 118q14 12 28 0" fill="none" stroke="${f}" stroke-width="3.5" stroke-linecap="round"/>`
    : `<path d="M88 120q12 8 24 0" fill="none" stroke="${f}" stroke-width="3" stroke-linecap="round" opacity=".9"/>`;

  let extra = '';
  if (estado === 'thinking') extra = `<g class="jv-dots" fill="${p.c[0]}"><circle cx="150" cy="38" r="4"/><circle cx="164" cy="28" r="5"/><circle cx="180" cy="16" r="6"/></g>`;
  else if (estado === 'analyzing') extra = `<g class="jv-sweep"><rect x="36" y="34" width="128" height="3" rx="1.5" fill="${p.beam}" opacity=".9"/><rect x="36" y="37" width="128" height="16" fill="${p.beam}" opacity=".08"/></g><g class="jv-ring" fill="none" stroke="${p.c[1]}" stroke-width="2" opacity=".55"><circle cx="100" cy="98" r="84" stroke-dasharray="4 12" style="transform-origin:100px 98px"/></g>`;
  else if (estado === 'alert') extra = `<g class="jv-pulse"><path d="M170 18l14 26h-28z" fill="#ffb829" stroke="#000" stroke-width="1.5" stroke-linejoin="round"/><path d="M170 28v7M170 39v.5" stroke="#000" stroke-width="2.5" stroke-linecap="round"/></g>`;
  else if (estado === 'ok') extra = `<g class="jv-pulse" fill="${p.c[0]}"><path d="M172 26l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/><path d="M28 46l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" opacity=".7"/></g>`;
  else if (estado === 'explaining') extra = `<g fill="none" stroke="${p.c[2]}" stroke-width="2.5" stroke-linecap="round" opacity=".9"><rect x="148" y="14" width="44" height="30" rx="8" fill="${p.c[2]}" fill-opacity=".08"/><path d="M156 25h28M156 33h18"/></g><path d="M150 46l-12 14" stroke="${p.c[2]}" stroke-width="2" stroke-dasharray="3 4" opacity=".7"/>`;
  else if (estado === 'welcome') extra = `<g class="jv-wave">${fragmentos(9, 170, 92, 12, 3, 6, p, 41, false)}</g>`;

  const nube = fragmentos(80, 100, 98, 62, 3, 9, p, 7, true);
  return (
    `<svg viewBox="0 0 200 220" role="img" aria-label="${lbl}" class="jv-mascot jv-prisma jv-${estado}">` +
    `<defs><radialGradient id="${g}"><stop offset="0" stop-color="${p.glow}" stop-opacity=".55"/><stop offset="1" stop-color="${p.glow}" stop-opacity="0"/></radialGradient></defs>` +
    `<circle cx="100" cy="98" r="84" fill="url(#${g})"/>${extra}` +
    `<g class="jv-float"><g${estado === 'thinking' ? ' class="jv-orbit"' : ''}>${nube}</g>${ojos}${boca}</g>` +
    `<path d="M66 178 100 150l34 28" fill="${p.beam}" opacity=".12"/>` +
    `<g opacity=".55" stroke="${p.beam}" stroke-linecap="round"><line x1="40" y1="182" x2="160" y2="182"/><line x1="56" y1="192" x2="144" y2="192"/><line x1="72" y1="202" x2="128" y2="202"/></g></svg>`
  );
}

/** Icono pequeño (cuadrado): pocos fragmentos grandes para que se lea a 24 px. Decorativo. */
export function prismaIconoSvg(estado: EstadoPrisma = 'idle'): string {
  const p = paleta(estado);
  const g = id('pi');
  return (
    `<svg viewBox="28 28 144 144" aria-hidden="true" class="jv-icon jv-prisma-icon">` +
    `<defs><radialGradient id="${g}"><stop offset="0" stop-color="${p.glow}" stop-opacity=".7"/><stop offset="1" stop-color="${p.glow}" stop-opacity="0"/></radialGradient></defs>` +
    `<circle cx="100" cy="100" r="70" fill="url(#${g})"/>${fragmentos(16, 100, 100, 56, 9, 16, p, 13, false)}` +
    `<ellipse cx="80" cy="98" rx="11" ry="15" fill="${p.face}"/><ellipse cx="120" cy="98" rx="11" ry="15" fill="${p.face}"/></svg>`
  );
}
