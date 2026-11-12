import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * JARVIS en el inicio (mascota Prisma + capacidades)
 * Responsable: Participante 3  ·  ver docs/REPARTO.md
 * Referencia: docs/diseno/index.html, HTML líneas 1068–1087; JS: mascota: usa <app-prisma estado="welcome" /> (línea 1940).
 * Para la aparición al desplazarse usa la directiva Revelar (shared/revelar): class="rv" appRevelar.
 */
@Component({
  selector: 'app-asistente',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './asistente.html',
  styleUrl: './asistente.scss',
})
export class Asistente {}
