import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NOMBRE_ROL, Rol } from '../../core/auth/auth.models';
import { AuthService } from '../../core/auth/auth.service';
import { API } from '../../core/config/api.config';
import { AnunciadorService } from '../../core/ui/anunciador.service';

type Paso = 'datos' | 'codigo';

/**
 * Inicio de sesión FUNCIONAL pero con diseño básico (HU2, HU10, HU33).
 * PENDIENTE (Participante 1): llevarle el diseño del panel de la muestra (docs/diseno/index.html,
 * HTML líneas 1175–1272 y JS 1787–1933): lado izquierdo con el escudo de triángulos, lista de protecciones
 * y consejo; campo de contraseña con candado y botón Mostrar/Ocultar dentro; aviso de mayúsculas;
 * código de 6 casillas y pantalla de bienvenida. La lógica (AuthService) ya está lista.
 */
@Component({
  selector: 'app-ingresar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ingresar.html',
  styleUrl: './ingresar.scss',
})
export class Ingresar {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private anunciador = inject(AnunciadorService);

  protected readonly demo = API.demo;
  protected readonly areaEmpresa = this.route.snapshot.queryParamMap.get('area') === 'empresa';
  protected readonly paso = signal<Paso>('datos');
  protected readonly correo = signal('');
  protected readonly clave = signal('');
  protected readonly codigo = signal('');
  protected readonly enviando = signal(false);
  protected readonly errorCorreo = signal('');
  protected readonly errorClave = signal('');
  protected readonly error = signal('');
  protected readonly bloqueo = signal(0);
  private desafio = '';
  private reloj?: ReturnType<typeof setInterval>;
  private tituloCodigo = viewChild<ElementRef<HTMLElement>>('tituloCodigo');

  protected async entrar(e: Event): Promise<void> {
    e.preventDefault();
    this.error.set('');
    this.errorCorreo.set(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.correo().trim()) ? '' : 'Escribe un correo válido, por ejemplo: nombre@correo.com');
    this.errorClave.set(this.clave() ? '' : 'Escribe tu contraseña.');
    if (this.errorCorreo() || this.errorClave()) {
      document.getElementById(this.errorCorreo() ? 'correo' : 'clave')?.focus();
      return;
    }
    this.enviando.set(true);
    const r = await this.auth.iniciarSesion(this.correo(), this.clave());
    this.enviando.set(false);
    switch (r.estado) {
      case 'ok':
        this.listo(r.sesion.usuario.rol);
        break;
      case 'requiere-codigo':
        this.desafio = r.desafio;
        this.paso.set('codigo');
        setTimeout(() => this.tituloCodigo()?.nativeElement.focus());
        break;
      case 'credenciales-invalidas':
        this.error.set(`El correo o la contraseña no coinciden. Te quedan ${r.intentosRestantes} intentos antes de un bloqueo temporal.`);
        break;
      case 'bloqueado':
        this.iniciarBloqueo(r.segundos);
        break;
      default:
        this.error.set('No pudimos conectarnos. Revisa tu conexión e inténtalo de nuevo.');
    }
  }

  protected async verificar(e: Event): Promise<void> {
    e.preventDefault();
    if (!/^\d{6}$/.test(this.codigo())) {
      this.error.set('El código tiene 6 números.');
      return;
    }
    this.enviando.set(true);
    const r = await this.auth.verificarCodigo(this.correo().trim().toLowerCase(), this.desafio, this.codigo());
    this.enviando.set(false);
    if (r.estado === 'ok') this.listo(r.sesion.usuario.rol);
    else this.error.set(r.estado === 'codigo-invalido' ? 'Ese código no es correcto. Revisa el mensaje e inténtalo otra vez.' : 'No pudimos conectarnos. Inténtalo de nuevo.');
  }

  protected volver(): void {
    this.paso.set('datos');
    this.codigo.set('');
    this.error.set('');
  }

  protected rellenarDemo(correo: string): void {
    this.correo.set(correo);
    this.clave.set('Seguro2026!');
  }

  protected valor(e: Event): string {
    return (e.target as HTMLInputElement).value;
  }

  private listo(rol: Rol): void {
    this.anunciador.anunciar(`Sesión iniciada como ${NOMBRE_ROL[rol]}`);
    const volver = this.route.snapshot.queryParamMap.get('volver');
    const destino = volver && volver.startsWith('/') && !volver.startsWith('//') ? volver
      : rol === 'ESTUDIANTE' ? '/aprendizaje-gamificado' : '/jarvis';
    this.router.navigateByUrl(destino);
  }

  private iniciarBloqueo(segundos: number): void {
    this.bloqueo.set(segundos);
    clearInterval(this.reloj);
    this.reloj = setInterval(() => {
      const s = this.auth.segundosBloqueo();
      this.bloqueo.set(s);
      if (s <= 0) clearInterval(this.reloj);
    }, 1000);
  }
}
