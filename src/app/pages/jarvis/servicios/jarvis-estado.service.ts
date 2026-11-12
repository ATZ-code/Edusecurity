import { Injectable, computed, signal } from '@angular/core';
import { EstadoPrisma } from '../../../shared/prisma/prisma-svg';
import { estadoSegunInforme, evaluar } from '../motor/motor-reglas';
import { Actividad, ActivoRegistrado, Informe, NivelExplicacion, Respuestas } from '../modelos';

/**
 * Estado compartido de JARVIS (lo usan las cuatro pestañas).
 * Mientras no exista el backend se guarda en este navegador (localStorage).
 * PENDIENTE (Participante 3 + backend): guardar evaluaciones, actividad y activos en el seguridad-service.
 */
@Injectable({ providedIn: 'root' })
export class JarvisEstadoService {
  readonly nivel = signal<NivelExplicacion>(leer('jv-nivel', 'sencillo'));
  readonly informe = signal<Informe | null>(leer('jv-informe', null));
  readonly borrador = signal<Respuestas>(leer('jv-borrador', {}));
  readonly actividad = signal<Actividad[]>(leer('jv-actividad', []));
  readonly activos = signal<ActivoRegistrado[]>(leer('jv-activos', []));

  /** Estado de la mascota mientras JARVIS trabaja (null = según el informe). */
  readonly ocupado = signal<{ estado: EstadoPrisma; texto: string } | null>(null);
  readonly estadoMascota = computed<EstadoPrisma>(() => this.ocupado()?.estado ?? estadoSegunInforme(this.informe()));
  readonly textoEstado = computed(() => this.ocupado()?.texto ?? 'Listo para ayudarte');

  setNivel(n: NivelExplicacion): void {
    this.nivel.set(n);
    guardar('jv-nivel', n);
  }

  actualizarBorrador(r: Respuestas): void {
    this.borrador.set(r);
    guardar('jv-borrador', r);
  }

  generarInforme(): Informe {
    const inf = evaluar(this.borrador());
    this.informe.set(inf);
    guardar('jv-informe', inf);
    this.registrar(`Evaluación generada para ${inf.empresa} (${inf.puntuacion}/100).`);
    return inf;
  }

  guardarResumenIA(texto: string): void {
    const inf = this.informe();
    if (!inf) return;
    const nuevo = { ...inf, resumenIA: texto };
    this.informe.set(nuevo);
    guardar('jv-informe', nuevo);
    this.registrar('JARVIS generó un resumen ejecutivo.');
  }

  agregarActivo(a: ActivoRegistrado): void {
    this.activos.update((l) => [a, ...l]);
    guardar('jv-activos', this.activos());
    this.registrar(`Activo registrado: ${a.objetivo} (pendiente de verificar propiedad). No se ejecutó ningún escaneo.`);
  }

  registrar(mensaje: string): void {
    this.actividad.update((l) => [{ fecha: new Date().toISOString(), mensaje }, ...l].slice(0, 40));
    guardar('jv-actividad', this.actividad());
  }
}

function leer<T>(clave: string, defecto: T): T {
  try {
    const v = JSON.parse(localStorage.getItem(clave) ?? 'null') as T | null;
    return v ?? defecto;
  } catch {
    return defecto;
  }
}
function guardar(clave: string, valor: unknown): void {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    /* sin almacenamiento */
  }
}
