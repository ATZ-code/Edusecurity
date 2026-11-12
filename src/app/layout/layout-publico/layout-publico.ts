import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { AccesibilidadService } from '../../core/accesibilidad/accesibilidad.service';
import { Prisma } from '../../shared/prisma/prisma';
import { Avisos } from '../../shared/toast/toast';
import { Navbar } from '../navbar/navbar';
import { PanelAccesibilidad } from '../panel-accesibilidad/panel-accesibilidad';
import { PiePagina } from '../pie-pagina/pie-pagina';

/** Marco de las páginas públicas: navegación, contenido, pie y herramientas fijas (diseño v2). */
@Component({
  selector: 'app-layout-publico',
  imports: [RouterOutlet, RouterLink, Navbar, PiePagina, PanelAccesibilidad, Avisos, Prisma],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(window:scroll)': 'alHacerScroll()' },
  template: `
    <a class="skip-link" href="#contenido" (click)="saltar($event)">Saltar al contenido principal</a>
    <app-navbar />

    <main id="contenido" tabindex="-1" [class.bajo-nav]="!enInicio()">
      <router-outlet />
    </main>

    <app-pie-pagina />

    <a class="jv-launch" routerLink="/jarvis" aria-label="Abrir JARVIS, el asistente de ciberseguridad">
      <app-prisma [icono]="true" class="jv-icon" /><span>Pregúntale a JARVIS</span>
    </a>
    <button class="to-top" type="button" [class.show]="mostrarArriba()" aria-label="Volver arriba" (click)="arriba()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
      <span>Volver arriba</span>
    </button>

    <app-panel-accesibilidad />
    <app-avisos />
  `,
})
export class LayoutPublico {
  private a11y = inject(AccesibilidadService);
  protected readonly mostrarArriba = signal(false);
  /** Fuera del inicio no hay héroe debajo del menú fijo: el contenido baja para no quedar tapado. */
  protected readonly enInicio = signal(true);

  constructor() {
    inject(Router).events.subscribe((e) => {
      if (e instanceof NavigationEnd) this.enInicio.set(e.urlAfterRedirects.split(/[?#]/)[0] === '/');
    });
  }

  protected alHacerScroll(): void {
    this.mostrarArriba.set(window.scrollY > window.innerHeight * 1.2);
  }

  protected saltar(e: Event): void {
    e.preventDefault();
    document.getElementById('contenido')?.focus();
  }

  protected arriba(): void {
    const suave = !this.a11y.reducirMovimiento();
    window.scrollTo({ top: 0, behavior: suave ? 'smooth' : 'auto' });
    setTimeout(() => document.getElementById('contenido')?.focus({ preventScroll: true }), suave ? 500 : 0);
  }
}
