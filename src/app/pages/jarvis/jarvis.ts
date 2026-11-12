import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { Prisma } from '../../shared/prisma/prisma';
import { Avisos } from '../../shared/toast/toast';
import { NivelExplicacion } from './modelos';
import { JarvisEstadoService } from './servicios/jarvis-estado.service';

interface Pestana {
  ruta: string;
  texto: string;
  empresa: boolean;
}

/**
 * Marco de JARVIS (pantalla completa): encabezado, selector de nivel y pestañas.
 * Cada pestaña es una ruta hija: /jarvis/conversar, /evaluacion, /informe, /escaneo.
 * Las pestañas del área empresarial están protegidas por rol en app.routes.ts.
 */
@Component({
  selector: 'app-jarvis',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Prisma, Avisos],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'jv-app' },
  template: `
    <div class="jv-top">
      <div class="jv-brand">
        <app-prisma [icono]="true" [estado]="estado.estadoMascota()" class="jv-icon" />
        <div><b id="jvTitle">JARVIS</b><small>Asistente de ciberseguridad de EduSecurity</small></div>
      </div>
      <label class="jv-level">
        <span>Explícame</span>
        <select aria-label="Nivel de explicación" [value]="estado.nivel()" (change)="cambiarNivel($event)">
          <option value="sencillo">Con palabras sencillas</option>
          <option value="tecnico">Con detalle técnico</option>
          <option value="empresa">Para la gerencia de una empresa</option>
        </select>
      </label>
      <a class="btn btn-ghost btn-sm" routerLink="/" id="jvClose">Volver a EduSecurity</a>
    </div>

    <nav class="jv-tabs" aria-label="Herramientas de JARVIS">
      @for (p of pestanas; track p.ruta) {
        <a class="jv-tab" [routerLink]="p.ruta" routerLinkActive #rla="routerLinkActive"
           [attr.aria-current]="rla.isActive ? 'page' : null">
          {{ p.texto }}
          @if (p.ruta === 'escaneo') { <span class="pill">Por conectar</span> }
          @if (p.empresa && !auth.tieneRol('EMPRESA', 'ADMINISTRADOR')) { <span class="sr-only"> (requiere cuenta de empresa)</span> }
        </a>
      }
    </nav>

    <div class="jv-body">
      <router-outlet />
    </div>
    <app-avisos />
  `,
})
export class Jarvis {
  protected estado = inject(JarvisEstadoService);
  protected auth = inject(AuthService);

  protected readonly pestanas: Pestana[] = [
    { ruta: 'conversar', texto: 'Conversar', empresa: false },
    { ruta: 'evaluacion', texto: 'Evaluar mi empresa', empresa: true },
    { ruta: 'informe', texto: 'Informe', empresa: true },
    { ruta: 'escaneo', texto: 'Escaneo técnico', empresa: true },
  ];

  protected cambiarNivel(e: Event): void {
    this.estado.setNivel((e.target as HTMLSelectElement).value as NivelExplicacion);
  }
}
