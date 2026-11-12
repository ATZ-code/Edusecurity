import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { AnunciadorService } from '../ui/anunciador.service';

export type Tema = 'oscuro' | 'claro';
export type Interruptor = 'contraste' | 'legible' | 'enlaces' | 'puntero' | 'movimiento';

export interface PrefsAccesibilidad {
  /** Índice en TAMANOS_TEXTO */
  tamano: number;
  tema: Tema;
  /** null = seguir al dispositivo (prefers-contrast: more) */
  contraste: boolean | null;
  legible: boolean;
  enlaces: boolean;
  puntero: boolean;
  /** Reducir animaciones. null = seguir al dispositivo (prefers-reduced-motion) */
  movimiento: boolean | null;
}

export const TAMANOS_TEXTO = [100, 112.5, 125, 137.5, 150] as const;
const CLAVE = 'edusecurity-a11y';
const DEFECTO: PrefsAccesibilidad = {
  tamano: 0,
  tema: 'oscuro',
  contraste: null,
  legible: false,
  enlaces: false,
  puntero: false,
  movimiento: null,
};
const NOMBRES: Record<Interruptor, string> = {
  contraste: 'Alto contraste',
  legible: 'Letra más legible',
  enlaces: 'Destacar enlaces y botones',
  puntero: 'Puntero grande',
  movimiento: 'Reducir animaciones',
};

/**
 * Preferencias de accesibilidad (WCAG 2.2): tamaño de texto, tema, alto contraste, letra legible,
 * enlaces destacados, puntero grande y movimiento reducido. Aplica clases en <html> que el
 * sistema de diseño (src/styles/edusecurity.css) ya sabe interpretar.
 */
@Injectable({ providedIn: 'root' })
export class AccesibilidadService {
  private doc = inject(DOCUMENT);
  private anunciador = inject(AnunciadorService);

  readonly prefs = signal<PrefsAccesibilidad>(this.leer());
  readonly panelAbierto = signal(false);

  private readonly mqMovimiento = this.doc.defaultView?.matchMedia('(prefers-reduced-motion: reduce)');
  private readonly mqContraste = this.doc.defaultView?.matchMedia('(prefers-contrast: more)');
  private readonly sistemaReduce = signal(this.mqMovimiento?.matches ?? false);
  private readonly sistemaContraste = signal(this.mqContraste?.matches ?? false);

  readonly porcentaje = computed(() => TAMANOS_TEXTO[this.prefs().tamano]);
  readonly altoContraste = computed(() => this.prefs().contraste ?? this.sistemaContraste());
  /** true cuando NO se deben reproducir animaciones (preferencia o sistema). */
  readonly reducirMovimiento = computed(() => this.prefs().movimiento ?? this.sistemaReduce());
  readonly contrastePorSistema = computed(() => this.prefs().contraste === null && this.sistemaContraste());
  readonly movimientoPorSistema = computed(() => this.prefs().movimiento === null && this.sistemaReduce());

  private fuenteCargada = false;

  constructor() {
    this.mqMovimiento?.addEventListener('change', (e) => this.sistemaReduce.set(e.matches));
    this.mqContraste?.addEventListener('change', (e) => this.sistemaContraste.set(e.matches));
    effect(() => this.aplicar());
  }

  activo(k: Interruptor): boolean {
    if (k === 'contraste') return this.altoContraste();
    if (k === 'movimiento') return this.reducirMovimiento();
    return this.prefs()[k];
  }

  cambiarTamano(delta: number): void {
    const n = Math.max(0, Math.min(TAMANOS_TEXTO.length - 1, this.prefs().tamano + delta));
    if (n === this.prefs().tamano) return;
    this.actualizar({ tamano: n });
    this.anunciador.anunciar(`Tamaño del texto: ${TAMANOS_TEXTO[n]} por ciento`);
  }

  setTema(tema: Tema): void {
    this.actualizar({ tema });
    this.anunciador.anunciar(tema === 'claro' ? 'Tema claro activado' : 'Tema oscuro activado');
  }

  alternar(k: Interruptor): void {
    const valor = !this.activo(k);
    this.actualizar({ [k]: valor } as Partial<PrefsAccesibilidad>);
    this.anunciador.anunciar(`${NOMBRES[k]} ${valor ? 'activado' : 'desactivado'}`);
  }

  restablecer(): void {
    this.prefs.set({ ...DEFECTO });
    try {
      localStorage.removeItem(CLAVE);
    } catch {
      /* sin almacenamiento */
    }
    this.anunciador.anunciar('Se restablecieron los valores originales');
  }

  private actualizar(cambio: Partial<PrefsAccesibilidad>): void {
    this.prefs.update((p) => ({ ...p, ...cambio }));
    try {
      localStorage.setItem(CLAVE, JSON.stringify(this.prefs()));
    } catch {
      /* sin almacenamiento */
    }
  }

  private aplicar(): void {
    const p = this.prefs();
    const html = this.doc.documentElement;
    html.classList.remove('fs-1', 'fs-2', 'fs-3', 'fs-4');
    if (p.tamano > 0) html.classList.add(`fs-${p.tamano}`);
    html.classList.toggle('theme-light', p.tema === 'claro');
    html.classList.toggle('hc', this.altoContraste());
    html.classList.toggle('readable', p.legible);
    html.classList.toggle('hl', p.enlaces);
    html.classList.toggle('big-cursor', p.puntero);
    html.classList.toggle('calm', this.reducirMovimiento());
    if (p.legible && !this.fuenteCargada) {
      this.fuenteCargada = true;
      const l = this.doc.createElement('link');
      l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap';
      this.doc.head.appendChild(l);
    }
    const meta = this.doc.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta) meta.content = this.altoContraste() || p.tema !== 'claro' ? '#000000' : '#f4f3f9';
  }

  private leer(): PrefsAccesibilidad {
    const p = { ...DEFECTO };
    try {
      const guardado = JSON.parse(localStorage.getItem(CLAVE) ?? 'null') as Partial<PrefsAccesibilidad> | null;
      if (guardado) Object.assign(p, guardado);
      // Compatibilidad con el selector de tema que ya tenía el proyecto
      else if (localStorage.getItem('edusecurity-tema') === 'claro') p.tema = 'claro';
    } catch {
      /* sin almacenamiento */
    }
    return p;
  }
}
