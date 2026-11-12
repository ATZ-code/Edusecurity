import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { JarvisEstadoService } from '../servicios/jarvis-estado.service';

/**
 * JARVIS · Escaneo técnico  —  Responsable: Participante 3 (ver docs/REPARTO.md)
 * Registro de activos con autorización. Referencia: docs/diseno/jarvis.js (sección "7. ESCANEO") y jarvis.css (.scan-grid, .svc, .token, .logl).
 * Qué construir:
 *  - Aviso: el servicio de escaneo no está conectado (ESCANEO_CONECTADO = false). NO mostrar resultados inventados.
 *  - Formulario: tipo dominio/IP, objetivo (validarObjetivo), 3 casillas de autorización obligatorias, horario permitido.
 *  - Al registrar: generarCodigoVerificacion(), estado.agregarActivo(...), mostrar el registro TXT y la ruta .well-known.
 *    El botón "Verificar propiedad" queda desactivado con su explicación.
 *  - Lista REVISIONES_ESCANEO con la etiqueta "Requiere configuración", reglas de seguridad y estado.actividad().
 */
@Component({
  selector: 'app-jarvis-escaneo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './escaneo.html',
})
export class Escaneo {
  protected estado = inject(JarvisEstadoService);
}
