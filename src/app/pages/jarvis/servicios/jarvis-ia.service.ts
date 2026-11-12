import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { API, url } from '../../../core/config/api.config';
import { Informe, MensajeChat, NivelExplicacion } from '../modelos';

export type ErrorIA = 'no-conectada' | 'sin-permiso' | 'limite' | 'rechazada' | 'red';

/**
 * Conversación con la IA a través del ia-service (API Gateway).
 * La clave del proveedor de IA y las reglas de comportamiento de JARVIS viven en el BACKEND
 * (ver docs/jarvis-ia-service.md). El navegador solo envía la conversación, el nivel de
 * explicación y el informe para que JARVIS no invente resultados.
 */
@Injectable({ providedIn: 'root' })
export class JarvisIaService {
  private http = inject(HttpClient);

  /** false mientras API.demo sea true: el chat se muestra como "IA no conectada" (no se simulan respuestas). */
  readonly disponible = !API.demo;

  conversar(mensajes: MensajeChat[], nivel: NivelExplicacion, informe: Informe | null): Observable<string> {
    if (!this.disponible) return throwError(() => 'no-conectada' satisfies ErrorIA);
    return this.http
      .post<{ respuesta: string }>(url(API.ia.chatJarvis), {
        mensajes: mensajes.slice(-12),
        nivel,
        informe: informe ? contextoInforme(informe) : null,
      })
      .pipe(map((r) => r.respuesta), catchError((e: HttpErrorResponse) => throwError(() => tipoError(e))));
  }

  resumenEjecutivo(informe: Informe): Observable<string> {
    if (!this.disponible) return throwError(() => 'no-conectada' satisfies ErrorIA);
    return this.http
      .post<{ respuesta: string }>(url(API.ia.resumenInforme), { informe: contextoInforme(informe) })
      .pipe(map((r) => r.respuesta), catchError((e: HttpErrorResponse) => throwError(() => tipoError(e))));
  }
}

export const MENSAJE_ERROR_IA: Record<ErrorIA, string> = {
  'no-conectada': 'El chat con IA todavía no está conectado al servidor. La evaluación, el informe y el PDF sí funcionan.',
  'sin-permiso': 'Tu sesión no tiene permiso para usar la IA. Inicia sesión de nuevo.',
  limite: 'Recibí demasiadas preguntas seguidas. Espera un momento y vuelve a intentarlo.',
  rechazada: 'No puedo ayudar con esa solicitud. Si buscas proteger un sistema, cuéntame qué quieres asegurar.',
  red: 'No pude responder por un problema de conexión. Inténtalo de nuevo.',
};

function tipoError(e: HttpErrorResponse): ErrorIA {
  if (e.status === 401 || e.status === 403) return 'sin-permiso';
  if (e.status === 429) return 'limite';
  if (e.status === 422) return 'rechazada';
  return 'red';
}

/** Solo lo necesario para que la IA responda con datos reales del informe. */
function contextoInforme(r: Informe) {
  return {
    empresa: r.empresa,
    sector: r.sector,
    empleados: r.empleados,
    puntuacion: r.puntuacion,
    nivel: r.nivel,
    activos: r.activos.map(([k, v]) => `${k}: ${v}`),
    hallazgos: r.hallazgos.map((h) => ({
      prioridad: h.prioridad,
      gravedad: h.severidad,
      tipo: h.tipo,
      titulo: h.titulo,
      evidencia: h.evidencia,
      recomendacion: h.recomendacion,
      detalleTecnico: h.detalleTecnico,
    })),
  };
}
