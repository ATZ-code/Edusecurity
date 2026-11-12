import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { AccesibilidadService } from '../../core/accesibilidad/accesibilidad.service';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../core/ui/toast.service';

interface Enlace {
  texto: string;
  fragmento: string;
}

/**
 * Navegación principal (diseño v2): transparente sobre el héroe, sólida al bajar o en otras páginas.
 * Referencia: docs/diseno/index.html líneas 736–762 (HTML) y 1344–1357 (JS).
 */
@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'nav',
    role: 'banner',
    '[class.solid]': 'solida()',
    '[class.open]': 'abierto()',
    '(window:scroll)': 'alHacerScroll()',
    '(keydown.escape)': 'cerrar()',
  },
  template: `
    <div class="wrap nav-inner">
      <a routerLink="/" fragment="inicio" class="logo" aria-label="EduSecurity, inicio">
        <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 2.5 4.5 7v8.2c0 7 4.8 12.4 11.5 14.3 6.7-1.9 11.5-7.3 11.5-14.3V7L16 2.5Z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M10.5 16.2 14.4 20l7.2-8" fill="none" stroke="#a693ff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span>Edu<b>Security</b></span>
      </a>
      <nav aria-label="Principal" style="display:contents">
        <ul class="nav-links" id="menu">
          @for (e of enlaces; track e.fragmento) {
            <li>
              <a routerLink="/" [fragment]="e.fragmento" [class.active]="activo() === e.fragmento"
                 [attr.aria-current]="activo() === e.fragmento ? 'true' : null" (click)="cerrar()">{{ e.texto }}</a>
            </li>
          }
        </ul>
      </nav>
      <div class="nav-tools">
        <button class="icon-btn" type="button" id="a11yOpen" [attr.aria-expanded]="a11y.panelAbierto()" aria-controls="a11yPanel"
                aria-label="Opciones de accesibilidad" title="Opciones de accesibilidad" (click)="a11y.panelAbierto.set(true)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="6.8" r="1.4" fill="currentColor" stroke="none"/><path d="M7 9.5l5 1 5-1M12 10.5v3.5l-2.5 4.5M12 14l2.5 4.5"/></svg>
        </button>
        @if (auth.usuario(); as u) {
          <button type="button" class="btn btn-solid btn-sm" (click)="salir()">Salir · {{ u.nombre }}</button>
        } @else {
          <a routerLink="/ingresar" class="btn btn-solid btn-sm">Ingresar</a>
        }
        <button class="burger" type="button" [attr.aria-label]="abierto() ? 'Cerrar menú' : 'Abrir menú'"
                [attr.aria-expanded]="abierto()" aria-controls="menu" (click)="abierto.set(!abierto())">
          <span></span><span></span><span></span>
        </button>
      </div>
      <div class="nav-cta"><a routerLink="/ingresar" class="btn btn-solid" (click)="cerrar()">Ingresar o crear cuenta</a></div>
    </div>
  `,
})
export class Navbar {
  protected auth = inject(AuthService);
  protected a11y = inject(AccesibilidadService);
  private toast = inject(ToastService);
  private router = inject(Router);

  protected readonly enlaces: Enlace[] = [
    { texto: 'Inicio', fragmento: 'inicio' },
    { texto: '¿Qué es EduSecurity?', fragmento: 'que-es' },
    { texto: 'Aprende sobre ciberseguridad', fragmento: 'amenazas' },
    { texto: 'Servicios y herramientas', fragmento: 'herramientas' },
    { texto: 'JARVIS', fragmento: 'asistente' },
  ];
  protected readonly abierto = signal(false);
  protected readonly activo = signal('');
  private readonly enInicio = signal(true);
  private readonly bajo = signal(false);
  protected solida(): boolean {
    return this.bajo() || this.abierto() || !this.enInicio();
  }

  constructor() {
    this.router.events.subscribe((e) => {
      if (e instanceof NavigationEnd) this.enInicio.set(e.urlAfterRedirects.split(/[?#]/)[0] === '/');
    });
  }

  protected alHacerScroll(): void {
    this.bajo.set(window.scrollY > 40);
    // El botón flotante de JARVIS aparece después del héroe (clase en <html>, ver edusecurity.css)
    document.documentElement.classList.toggle('past-hero', window.scrollY > window.innerHeight * 0.75);
    const centro = window.innerHeight / 2;
    let actual = '';
    for (const e of this.enlaces) {
      const r = document.getElementById(e.fragmento)?.getBoundingClientRect();
      if (r && r.top <= centro && r.bottom >= centro) actual = e.fragmento;
    }
    this.activo.set(actual);
  }

  protected cerrar(): void {
    this.abierto.set(false);
  }

  protected salir(): void {
    this.auth.cerrarSesion();
    this.toast.mostrar('Cerraste sesión.');
    this.router.navigateByUrl('/');
  }
}
