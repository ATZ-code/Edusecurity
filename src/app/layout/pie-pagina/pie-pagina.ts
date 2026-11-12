import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AccesibilidadService } from '../../core/accesibilidad/accesibilidad.service';

/** Pie de página (diseño v2). Referencia: docs/diseno/index.html líneas 1160–1173. */
@Component({
  selector: 'app-pie-pagina',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="foot s-dark">
      <div class="wrap">
        <div class="foot-grid">
          <div>
            <a routerLink="/" fragment="inicio" class="logo"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 2.5 4.5 7v8.2c0 7 4.8 12.4 11.5 14.3 6.7-1.9 11.5-7.3 11.5-14.3V7L16 2.5Z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M10.5 16.2 14.4 20l7.2-8" fill="none" stroke="#a693ff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Edu<b>Security</b></span></a>
            <p>Educación en ciberseguridad para todas las edades.</p>
          </div>
          <div><h2 class="foot-h">Aprender</h2><ul>
            <li><a routerLink="/" fragment="que-es">Qué es EduSecurity</a></li>
            <li><a routerLink="/" fragment="amenazas">Amenazas digitales</a></li>
            <li><a routerLink="/" fragment="herramientas">Módulos y simulaciones</a></li>
          </ul></div>
          <div><h2 class="foot-h">Plataforma</h2><ul>
            <li><a routerLink="/jarvis">JARVIS</a></li>
            <li><a routerLink="/aprendizaje-gamificado">Mi aprendizaje</a></li>
            <li><a routerLink="/ingresar">Iniciar sesión</a></li>
            <li><button type="button" (click)="a11y.panelAbierto.set(true)">Accesibilidad</button></li>
          </ul></div>
          <div><h2 class="foot-h">Proyecto</h2><ul>
            <li><a routerLink="/" fragment="equipo">Equipo</a></li>
            <li><a routerLink="/soporte-asistencia">Centro de ayuda</a></li>
          </ul></div>
        </div>
        <div class="foot-base"><span>© 2026 EduSecurity · Proyecto formativo SENA</span><span>Hecho para que nadie caiga dos veces.</span></div>
      </div>
    </footer>
  `,
})
export class PiePagina {
  protected a11y = inject(AccesibilidadService);
}
