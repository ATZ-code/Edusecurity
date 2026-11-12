import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * ¿Qué es EduSecurity? (texto + mapa de temas)
 * Responsable: Participante 1  ·  ver docs/REPARTO.md
 * Referencia: docs/diseno/index.html, HTML líneas 850–892; JS: giro de la órbita al desplazarse 1365–1375.
 * Para la aparición al desplazarse usa la directiva Revelar (shared/revelar): class="rv" appRevelar.
 */
@Component({
  selector: 'app-que-es',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './que-es.html',
  styleUrl: './que-es.scss',
})
export class QueEs {}
