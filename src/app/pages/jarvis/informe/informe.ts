import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { JarvisEstadoService } from '../servicios/jarvis-estado.service';

/**
 * JARVIS · Informe  —  Responsable: Participante 3 (ver docs/REPARTO.md)
 * Informe con las 10 secciones. Referencia: docs/diseno/jarvis.js (sección "5. INFORME") y jarvis.css (.rep-*, .rcard, .bars, .finding).
 * Qué construir:
 *  - Sin informe: mensaje y botón a /jarvis/evaluacion.
 *  - Aviso fijo: "Evaluación basada en tus respuestas… Vulnerabilidades confirmadas: ninguna".
 *  - Resumen (puntuación, nivel, chips por severidad), barras por gravedad, activos, hallazgos desplegables
 *    (aria-expanded) con descripción, evidencia, consecuencias, recomendación y detalle técnico (si nivel = 'tecnico').
 *  - Botones: descargarPdf(informe) (motor/informe-pdf.ts), "Preguntarle a JARVIS", "Hacer otra evaluación",
 *    resumen ejecutivo con ia.resumenEjecutivo() → estado.guardarResumenIA().
 */
@Component({
  selector: 'app-jarvis-informe',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './informe.html',
})
export class InformeJarvis {
  protected estado = inject(JarvisEstadoService);
}
