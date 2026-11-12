import {
  ChangeDetectionStrategy, Component, ElementRef, effect, inject, signal, untracked, viewChild,
} from '@angular/core';
import { AccesibilidadService, Interruptor, TAMANOS_TEXTO, Tema } from '../../core/accesibilidad/accesibilidad.service';

interface OpcionSwitch {
  clave: Interruptor;
  titulo: string;
  ayuda: string;
}

/** Panel lateral de accesibilidad: foco atrapado, Escape cierra y el foco vuelve a donde estaba. */
@Component({
  selector: 'app-panel-accesibilidad',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (a11y.panelAbierto()) {
      <div class="a11y-scrim" (click)="cerrar()"></div>
      <aside #panel class="a11y" id="a11yPanel" role="dialog" aria-modal="true" aria-labelledby="a11yTitle" (keydown)="teclado($event)">
        <div class="a11y-head">
          <h2 id="a11yTitle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="6.8" r="1.4" fill="currentColor" stroke="none"/><path d="M7 9.5l5 1 5-1M12 10.5v3.5l-2.5 4.5M12 14l2.5 4.5"/></svg>
            Opciones de accesibilidad
          </h2>
          <button #cerrarBtn class="auth-close" type="button" aria-label="Cerrar opciones de accesibilidad" style="position:static" (click)="cerrar()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>
          </button>
        </div>
        <div class="a11y-body">
          <p class="a11y-intro">Ajusta la página a tu manera. Los cambios se aplican al instante y se guardan en este dispositivo.</p>

          <section class="a11y-group" aria-labelledby="g1">
            <h3 id="g1">Ver mejor</h3>
            <div class="opt">
              <span class="oi" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 19 9 5l5 14M5.8 14h6.4M15 19l3-8 3 8M15.9 16.5h4.2"/></svg></span>
              <div><b id="lblSize">Tamaño del texto</b><small>Agranda todo el texto de la página.</small></div>
              <div class="stepper" role="group" aria-labelledby="lblSize">
                <button type="button" aria-label="Más pequeño" [disabled]="a11y.prefs().tamano === 0" (click)="a11y.cambiarTamano(-1)">−</button>
                <output>{{ a11y.porcentaje() }}%</output>
                <button type="button" aria-label="Más grande" [disabled]="a11y.prefs().tamano === max" (click)="a11y.cambiarTamano(1)">+</button>
              </div>
            </div>

            <fieldset class="a11y-group" style="gap:.45rem">
              <legend>Colores de la página</legend>
              <div class="themes">
                <label><input type="radio" name="tema" value="oscuro" [checked]="a11y.prefs().tema === 'oscuro'" (change)="tema('oscuro')"><span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/></svg> Oscuro</span></label>
                <label><input type="radio" name="tema" value="claro" [checked]="a11y.prefs().tema === 'claro'" (change)="tema('claro')"><span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg> Claro</span></label>
              </div>
            </fieldset>

            @for (o of verMejor; track o.clave) {
              <div class="opt">
                <span class="oi" aria-hidden="true">
                  @switch (o.clave) {
                    @case ('contraste') { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor"/></svg> }
                    @case ('legible') { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h10"/></svg> }
                    @case ('enlaces') { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg> }
                    @default { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M5 3l14 9-6.5 1.2 3.8 7-2.7 1.5-3.8-7L5 19Z"/></svg> }
                  }
                </span>
                <div>
                  <b [id]="'lbl-' + o.clave">{{ o.titulo }}</b><small>{{ o.ayuda }}</small>
                  @if (o.clave === 'contraste' && a11y.contrastePorSistema()) {
                    <span class="auto-note">Activado porque tu dispositivo lo pide</span>
                  }
                </div>
                <button class="switch" type="button" role="switch" [attr.aria-checked]="a11y.activo(o.clave)"
                        [attr.aria-labelledby]="'lbl-' + o.clave" (click)="a11y.alternar(o.clave)"></button>
              </div>
            }
          </section>

          <section class="a11y-group" aria-labelledby="g2">
            <h3 id="g2">Movimiento</h3>
            <div class="opt">
              <span class="oi" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg></span>
              <div>
                <b id="lbl-movimiento">Reducir animaciones</b><small>Detiene el globo, la cinta de texto y los efectos al moverte por la página.</small>
                @if (a11y.movimientoPorSistema()) {
                  <span class="auto-note">Activado porque tu dispositivo lo pide</span>
                }
              </div>
              <button class="switch" type="button" role="switch" [attr.aria-checked]="a11y.reducirMovimiento()"
                      aria-labelledby="lbl-movimiento" (click)="a11y.alternar('movimiento')"></button>
            </div>
          </section>

          <section class="a11y-group" aria-labelledby="g3">
            <h3 id="g3">Bueno saber</h3>
            <div class="a11y-info"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="m22 9-6 6M16 9l6 6"/></svg><span>No necesitas sonido. Todo lo que se escucha en las actividades, como las llamadas falsas, también está escrito.</span></div>
            <div class="a11y-info"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/></svg><span>Puedes usar solo el teclado: Tab avanza, Mayús + Tab retrocede, Enter elige y Escape cierra ventanas.</span></div>
          </section>
        </div>
        <div class="a11y-foot">
          @if (!confirmando()) {
            <button class="btn btn-ghost btn-block" type="button" (click)="confirmando.set(true)">Restablecer valores</button>
          } @else {
            <div class="confirm" role="alertdialog" aria-labelledby="resetQ">
              <span id="resetQ">¿Volver a la configuración original? Se quitarán todos tus ajustes.</span>
              <div class="row">
                <button class="btn btn-primary btn-sm" type="button" (click)="restablecer()">Sí, restablecer</button>
                <button #noBtn class="btn btn-ghost btn-sm" type="button" (click)="confirmando.set(false)">Cancelar</button>
              </div>
            </div>
          }
          <button class="btn btn-primary btn-block" type="button" (click)="cerrar()">Listo</button>
        </div>
      </aside>
    }
  `,
})
export class PanelAccesibilidad {
  protected a11y = inject(AccesibilidadService);
  protected readonly max = TAMANOS_TEXTO.length - 1;
  protected readonly confirmando = signal(false);
  private panel = viewChild<ElementRef<HTMLElement>>('panel');
  private cerrarBtn = viewChild<ElementRef<HTMLButtonElement>>('cerrarBtn');
  private noBtn = viewChild<ElementRef<HTMLButtonElement>>('noBtn');
  private volverA: HTMLElement | null = null;

  protected readonly verMejor: OpcionSwitch[] = [
    { clave: 'contraste', titulo: 'Alto contraste', ayuda: 'Negro, blanco y amarillo. Bordes marcados y sin transparencias.' },
    { clave: 'legible', titulo: 'Letra más legible', ayuda: 'Una letra pensada para baja visión, con más espacio entre líneas y palabras.' },
    { clave: 'enlaces', titulo: 'Destacar enlaces y botones', ayuda: 'Subraya los enlaces y marca con un borde todo lo que se puede tocar.' },
    { clave: 'puntero', titulo: 'Puntero grande', ayuda: 'Hace más grande la flecha del mouse para no perderla.' },
  ];

  constructor() {
    // Al abrir: guardar el foco, bloquear el scroll y llevar el foco al botón de cerrar
    effect(() => {
      const abierto = this.a11y.panelAbierto();
      untracked(() => {
        if (abierto) {
          this.volverA = document.activeElement as HTMLElement | null;
          document.body.style.overflow = 'hidden';
          setTimeout(() => {
            this.cerrarBtn()?.nativeElement.focus();
            const p = this.panel()?.nativeElement;
            if (p && !this.a11y.reducirMovimiento()) {
              p.animate([{ transform: 'translateX(24px)', opacity: 0 }, { transform: 'none', opacity: 1 }],
                { duration: 240, easing: 'cubic-bezier(.23,1,.32,1)' });
            }
          });
        }
      });
    });
    effect(() => {
      if (this.confirmando()) setTimeout(() => this.noBtn()?.nativeElement.focus());
    });
  }

  protected tema(t: Tema): void {
    this.a11y.setTema(t);
  }

  protected restablecer(): void {
    this.a11y.restablecer();
    this.confirmando.set(false);
  }

  protected cerrar(): void {
    this.a11y.panelAbierto.set(false);
    this.confirmando.set(false);
    document.body.style.overflow = '';
    (this.volverA ?? document.getElementById('a11yOpen'))?.focus();
  }

  protected teclado(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault();
      this.cerrar();
      return;
    }
    if (e.key !== 'Tab') return;
    const p = this.panel()?.nativeElement;
    if (!p) return;
    const f = Array.from(p.querySelectorAll<HTMLElement>('button,input')).filter(
      (el) => !(el as HTMLButtonElement).disabled && el.offsetParent !== null &&
        !(el instanceof HTMLInputElement && el.type === 'radio' && !el.checked),
    );
    const primero = f[0];
    const ultimo = f[f.length - 1];
    if (e.shiftKey && document.activeElement === primero) {
      e.preventDefault();
      ultimo?.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primero?.focus();
    }
  }
}
