import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { JarvisEstadoService } from '../servicios/jarvis-estado.service';

/**
 * JARVIS · Evaluar mi empresa  —  Responsable: Participante 3 (ver docs/REPARTO.md)
 * Asistente de 5 pasos + revisión. Referencia: docs/diseno/jarvis.js (sección "4. ASISTENTE POR PASOS") y jarvis.css (.wiz, .q, .opt-c, .review).
 * Qué construir:
 *  - Recorrer PASOS (datos/preguntas.ts). Tipos: text, select, radio, check (OPCIONES_EXCLUSIVAS desmarca las demás).
 *  - Guardar cada cambio con estado.actualizarBorrador(...). Validar obligatorias con mensajes claros y foco en el primer error.
 *  - Paso final: revisión con textoOpcion(), luego estado.generarInforme() y navegar a /jarvis/informe.
 *  - Ayudas de las preguntas traen <b>…</b>: usar [innerHTML] (Angular lo sanitiza; solo es negrita).
 */
@Component({
  selector: 'app-jarvis-evaluacion',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './evaluacion.html',
})
export class Evaluacion {
  protected estado = inject(JarvisEstadoService);
}
