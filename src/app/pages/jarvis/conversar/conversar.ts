import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { JarvisEstadoService } from '../servicios/jarvis-estado.service';

/**
 * JARVIS · Conversar  —  Responsable: Participante 3 (ver docs/REPARTO.md)
 * Chat con JARVIS. Referencia visual: docs/diseno/jarvis.js (sección "3. CHAT CON IA") y jarvis.css (.jv-chat, .jv-core, .jv-conv, .msg).
 * Qué construir:
 *  - Columna izquierda: <app-prisma [estado]="estado.estadoMascota()"> + estado.textoEstado() + resumen del informe (puntuación y chips).
 *  - Conversación con role="log", burbujas usuario/JARVIS, preguntas sugeridas (con y sin informe), Enter envía.
 *  - Enviar con ia.conversar(mensajes, estado.nivel(), estado.informe()). Mientras espera:
 *    estado.ocupado.set({ estado: 'thinking', texto: 'Analizando tu pregunta…' }) y luego null.
 *  - Si ia.disponible es false: mostrar MENSAJE_ERROR_IA['no-conectada'] y desactivar el campo. NUNCA simular respuestas.
 */
@Component({
  selector: 'app-jarvis-conversar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './conversar.html',
})
export class Conversar {
  protected estado = inject(JarvisEstadoService);
}
