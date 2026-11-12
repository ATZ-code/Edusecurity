import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API, POLITICA_ACCESO, url } from '../config/api.config';
import { ResultadoCodigo, ResultadoLogin, Rol, Sesion, Usuario } from './auth.models';

const CLAVE_SESION = 'edusecurity-sesion';

/** Usuarios de prueba (solo con API.demo = true). Contraseña: Seguro2026!  Código 2FA: 482913 */
const USUARIOS_DEMO: Record<string, { usuario: Usuario; dosPasos: boolean }> = {
  'estudiante@edusecurity.co': {
    usuario: { nombre: 'Laura', correo: 'estudiante@edusecurity.co', rol: 'ESTUDIANTE' },
    dosPasos: false,
  },
  'empresa@edusecurity.co': {
    usuario: { nombre: 'Ferretería La Esquina', correo: 'empresa@edusecurity.co', rol: 'EMPRESA' },
    dosPasos: false,
  },
  'admin@edusecurity.co': {
    usuario: { nombre: 'Johan', correo: 'admin@edusecurity.co', rol: 'ADMINISTRADOR' },
    dosPasos: true,
  },
};
const CLAVE_DEMO = 'Seguro2026!';
const CODIGO_DEMO = '482913';

/**
 * Sesión del usuario (HU2 inicio de sesión, HU10 bloqueo temporal, HU33 verificación en dos pasos).
 * El conteo de intentos aquí es solo para la interfaz: el auth-service debe aplicar su propio bloqueo.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  private readonly _sesion = signal<Sesion | null>(this.leerSesion());
  readonly sesion = this._sesion.asReadonly();
  readonly usuario = computed(() => this._sesion()?.usuario ?? null);
  readonly autenticado = computed(() => this._sesion() !== null);
  readonly rol = computed<Rol | null>(() => this._sesion()?.usuario.rol ?? null);

  private fallos = 0;
  private bloqueadoHasta = 0;

  token(): string | null {
    return this._sesion()?.token ?? null;
  }

  tieneRol(...roles: Rol[]): boolean {
    const r = this.rol();
    return r !== null && roles.includes(r);
  }

  /** Segundos que faltan para poder intentar de nuevo (0 si no hay bloqueo). */
  segundosBloqueo(): number {
    return Math.max(0, Math.ceil((this.bloqueadoHasta - Date.now()) / 1000));
  }

  async iniciarSesion(correo: string, contrasena: string): Promise<ResultadoLogin> {
    const espera = this.segundosBloqueo();
    if (espera > 0) return { estado: 'bloqueado', segundos: espera };
    correo = correo.trim().toLowerCase();

    if (API.demo) {
      await pausa(700);
      const u = USUARIOS_DEMO[correo];
      if (!u || contrasena !== CLAVE_DEMO) return this.registrarFallo();
      this.fallos = 0;
      if (u.dosPasos) return { estado: 'requiere-codigo', desafio: 'demo', correo };
      return { estado: 'ok', sesion: this.guardar({ usuario: u.usuario, token: 'demo' }) };
    }

    try {
      const r = await firstValueFrom(
        this.http.post<RespuestaLoginApi>(url(API.auth.login), { correo, contrasena }),
      );
      this.fallos = 0;
      if (r.requiereCodigo && r.desafio) return { estado: 'requiere-codigo', desafio: r.desafio, correo };
      if (!r.token || !r.usuario) return { estado: 'error-red' };
      return { estado: 'ok', sesion: this.guardar({ usuario: r.usuario, token: r.token }) };
    } catch (e) {
      const err = e as HttpErrorResponse;
      if (err.status === 401) return this.registrarFallo();
      if (err.status === 423 || err.status === 429) {
        const seg = Number(err.error?.segundos) || POLITICA_ACCESO.bloqueoSegundos;
        this.bloqueadoHasta = Date.now() + seg * 1000;
        return { estado: 'bloqueado', segundos: seg };
      }
      return { estado: 'error-red' };
    }
  }

  async verificarCodigo(correo: string, desafio: string, codigo: string): Promise<ResultadoCodigo> {
    if (API.demo) {
      await pausa(600);
      const u = USUARIOS_DEMO[correo];
      if (!u || codigo !== CODIGO_DEMO) return { estado: 'codigo-invalido' };
      return { estado: 'ok', sesion: this.guardar({ usuario: u.usuario, token: 'demo' }) };
    }
    try {
      const r = await firstValueFrom(
        this.http.post<RespuestaLoginApi>(url(API.auth.verificarCodigo), { desafio, codigo }),
      );
      if (!r.token || !r.usuario) return { estado: 'codigo-invalido' };
      return { estado: 'ok', sesion: this.guardar({ usuario: r.usuario, token: r.token }) };
    } catch (e) {
      return (e as HttpErrorResponse).status === 401 ? { estado: 'codigo-invalido' } : { estado: 'error-red' };
    }
  }

  cerrarSesion(): void {
    if (!API.demo && this.token()) {
      this.http.post(url(API.auth.cerrarSesion), {}).subscribe({ error: () => undefined });
    }
    this._sesion.set(null);
    try {
      sessionStorage.removeItem(CLAVE_SESION);
    } catch {
      /* almacenamiento no disponible */
    }
  }

  private registrarFallo(): ResultadoLogin {
    this.fallos++;
    if (this.fallos >= POLITICA_ACCESO.maxIntentos) {
      this.fallos = 0;
      this.bloqueadoHasta = Date.now() + POLITICA_ACCESO.bloqueoSegundos * 1000;
      return { estado: 'bloqueado', segundos: POLITICA_ACCESO.bloqueoSegundos };
    }
    return { estado: 'credenciales-invalidas', intentosRestantes: POLITICA_ACCESO.maxIntentos - this.fallos };
  }

  private guardar(s: Sesion): Sesion {
    this._sesion.set(s);
    try {
      sessionStorage.setItem(CLAVE_SESION, JSON.stringify(s));
    } catch {
      /* almacenamiento no disponible */
    }
    return s;
  }

  private leerSesion(): Sesion | null {
    try {
      const t = sessionStorage.getItem(CLAVE_SESION);
      return t ? (JSON.parse(t) as Sesion) : null;
    } catch {
      return null;
    }
  }
}

/** Forma esperada de la respuesta del auth-service (ajustar si el backend usa otros nombres). */
interface RespuestaLoginApi {
  token?: string;
  usuario?: Usuario;
  requiereCodigo?: boolean;
  desafio?: string;
}

function pausa(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
